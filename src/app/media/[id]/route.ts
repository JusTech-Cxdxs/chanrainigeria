import { eq } from "drizzle-orm";
import sharp from "sharp";
import { db, schema } from "@/db";
import { currentAdmin, has } from "@/lib/auth";
import { THUMB_WIDTHS } from "@/lib/media";

const M = schema.media;
const RESIZABLE = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Small in-memory cache of resized pictures, so a page of thumbnails isn't resized on every view. */
const resized = new Map<string, Buffer>();
let cachedBytes = 0;
const CACHE_LIMIT = 64 * 1024 * 1024;
function remember(key: string, buf: Buffer) {
  resized.set(key, buf);
  cachedBytes += buf.length;
  while (cachedBytes > CACHE_LIMIT && resized.size) {
    const [oldest, b] = resized.entries().next().value as [string, Buffer];
    resized.delete(oldest);
    cachedBytes -= b.length;
  }
}

const notFound = () => new Response("Not found", { status: 404 });

/**
 * Serves uploaded files from the database. A file keeps its id when staff replace it, so responses are
 * cached briefly and revalidated with an ETag; links that carry ?v= (a version) can be cached for good.
 * ?w=480|960|1600 returns a smaller copy of a picture for thumbnails and cards.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return notFound();
  const url = new URL(req.url);
  const meta = await db.query.media.findFirst({
    where: eq(M.id, id),
    columns: { id: true, filename: true, mimeType: true, size: true, isPrivate: true, deletedAt: true, updatedAt: true },
  });
  if (!meta) return notFound();
  if (meta.deletedAt) {
    // Removed files and earlier versions are gone from the site; staff can still preview them to restore.
    const u = await currentAdmin();
    if (!u || !(has(u, "media") || has(u, "history"))) return notFound();
    meta.isPrivate = true;
  } else if (meta.isPrivate) {
    // Customer attachments: only staff who handle enquiries.
    const u = await currentAdmin();
    if (!u || !has(u, "enquiries")) return notFound();
  }

  const wanted = Number(url.searchParams.get("w"));
  const w = (THUMB_WIDTHS as readonly number[]).includes(wanted) && RESIZABLE.includes(meta.mimeType) ? wanted : 0;
  const version = new Date(meta.updatedAt).getTime().toString(36);
  const etag = `"${meta.id.slice(0, 8)}-${version}-${w}"`;
  const cache = meta.isPrivate
    ? "private, no-store"
    : url.searchParams.has("v")
      ? "public, max-age=31536000, immutable"
      : "public, max-age=300, stale-while-revalidate=604800";
  const common = {
    etag,
    "cache-control": cache,
    "x-content-type-options": "nosniff",
    // SVG uploads can carry script; sandbox anything served from here.
    "content-security-policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
  };
  if (!meta.isPrivate && req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: common });

  const row = await db.query.media.findFirst({ where: eq(M.id, id), columns: { data: true } });
  if (!row) return notFound();
  let body: Buffer = row.data;
  let type = meta.mimeType;
  if (w) {
    const key = `${meta.id}:${version}:${w}`;
    const hit = resized.get(key);
    if (hit) {
      body = hit;
    } else {
      try {
        const img = sharp(row.data, { failOn: "none" });
        const { width } = await img.metadata();
        if (width && width > w) {
          body = await img.resize({ width: w, withoutEnlargement: true }).webp({ quality: 78, alphaQuality: 90 }).toBuffer();
          remember(key, body);
        }
      } catch (e) {
        console.error("[media] resize", e);
      }
    }
    if (body !== row.data) type = "image/webp";
  }
  const inline = type.startsWith("image/") || type === "application/pdf";
  return new Response(new Uint8Array(body), {
    headers: {
      ...common,
      "content-type": type,
      "content-length": String(body.length),
      "content-disposition": `${inline ? "inline" : "attachment"}; filename="${encodeURIComponent(meta.filename)}"`,
    },
  });
}
