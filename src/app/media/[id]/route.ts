import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentAdmin } from "@/lib/auth";

// Serves uploaded files from the database with long-lived caching (ids never change).
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const row = await db.query.media.findFirst({ where: eq(schema.media.id, id) });
  if (!row) return new Response("Not found", { status: 404 });
  if (row.isPrivate && !(await currentAdmin())) return new Response("Not found", { status: 404 });
  const inline = row.mimeType.startsWith("image/") || row.mimeType === "application/pdf";
  return new Response(new Uint8Array(row.data), {
    headers: {
      "content-type": row.mimeType,
      "content-length": String(row.size),
      "cache-control": row.isPrivate ? "private, no-store" : "public, max-age=31536000, immutable",
      "content-disposition": `${inline ? "inline" : "attachment"}; filename="${encodeURIComponent(row.filename)}"`,
      "x-content-type-options": "nosniff",
      // SVG uploads can carry script; sandbox anything served from here.
      "content-security-policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
