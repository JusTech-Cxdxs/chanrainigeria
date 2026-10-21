import "server-only";
import { and, isNotNull, isNull, lt, ne, sql } from "drizzle-orm";
import sharp from "sharp";
import { db, schema } from "@/db";
import { pageDef } from "./content-registry";
import { IMAGE_SLOTS } from "./image-slots";

// Vercel rejects request bodies over 4.5 MB, so uploads there are capped at 4 MB.
export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB ?? (process.env.VERCEL ? 4 : 8)) * 1024 * 1024;

/** Longest side kept for uploaded pictures. Larger photos are scaled down. */
export const MAX_IMAGE_WIDTH = 2400;
/** Widths /media/[id]?w= can produce. */
export const THUMB_WIDTHS = [480, 960, 1600] as const;
/** Folder that holds earlier versions of replaced files. Never shown in the library. */
export const HISTORY_FOLDER = "__history";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"];
export const UPLOAD_TYPES = [...IMAGE_TYPES, "image/heic", "application/pdf"];

/** Works out the real file type from its first bytes, ignoring what the browser claims. */
function sniff(buf: Buffer): string | null {
  const hex = buf.subarray(0, 12).toString("hex");
  if (hex.startsWith("ffd8ff")) return "image/jpeg";
  if (hex.startsWith("89504e470d0a1a0a")) return "image/png";
  if (buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
  if (buf.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  if (buf.subarray(4, 8).toString("latin1") === "ftyp") {
    const brand = buf.subarray(8, 12).toString("latin1");
    if (/avif|avis/.test(brand)) return "image/avif";
    if (/heic|heix|mif1|msf1|hevc/.test(brand)) return "image/heic";
  }
  if (hex.startsWith("00000100")) return "image/x-icon";
  const head = buf.subarray(0, 1024).toString("utf8").trimStart();
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(head)) return "image/svg+xml";
  return null;
}

/** SVG can carry script. Only plain drawings are accepted. */
function unsafeSvg(buf: Buffer) {
  return /<script|on[a-z]+\s*=|javascript:|<foreignObject|<iframe|<embed|<object|href\s*=\s*["']?(?!#)/i.test(buf.toString("utf8"));
}

/** Width and height from an SVG's viewBox or width/height attributes, when they are plain numbers. */
function svgSize(buf: Buffer) {
  const tag = buf.toString("utf8").match(/<svg[^>]*>/i)?.[0] ?? "";
  const w = Number(tag.match(/\swidth\s*=\s*["']?([\d.]+)(px)?["'\s>]/i)?.[1]);
  const h = Number(tag.match(/\sheight\s*=\s*["']?([\d.]+)(px)?["'\s>]/i)?.[1]);
  if (w && h) return { width: Math.round(w), height: Math.round(h) };
  const vb = tag.match(/viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  return vb ? { width: Math.round(Number(vb[1])), height: Math.round(Number(vb[2])) } : { width: null, height: null };
}

export type Prepared = { filename: string; mimeType: string; data: Buffer; size: number; width: number | null; height: number | null };

const extFor: Record<string, string> = { "image/webp": "webp", "image/png": "png", "image/jpeg": "jpg" };
const rename = (name: string, mime: string) => (extFor[mime] ? name.replace(/\.[a-z0-9]{2,5}$/i, "") + "." + extFor[mime] : name);

/**
 * Pictures are tidied before they are stored: turned the right way up, location and camera data
 * removed, scaled down to 2400 px wide, and photos saved as WebP. Logos with a transparent background
 * stay PNG so they keep working in emails. SVG and PDF files are stored as they are.
 */
async function processImage(data: Buffer, type: string) {
  const img = sharp(data, { failOn: "none", limitInputPixels: 120_000_000 }).rotate();
  const meta = await img.metadata();
  const resize = (meta.width ?? 0) > MAX_IMAGE_WIDTH || (meta.height ?? 0) > MAX_IMAGE_WIDTH * 2;
  const pipeline = resize ? img.resize({ width: MAX_IMAGE_WIDTH, height: MAX_IMAGE_WIDTH * 2, fit: "inside", withoutEnlargement: true }) : img;
  const keepPng = type === "image/png" && meta.hasAlpha;
  const out = keepPng
    ? await pipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer({ resolveWithObject: true })
    : await pipeline.webp({ quality: 82, alphaQuality: 90, effort: 4, smartSubsample: true }).toBuffer({ resolveWithObject: true });
  // Keep the original if it was already smaller and needed no changes (e.g. an optimised WebP).
  if (!resize && type === "image/webp" && data.length <= out.data.length && meta.orientation === undefined) {
    return { data, mime: type, width: meta.width ?? null, height: meta.height ?? null };
  }
  return { data: out.data, mime: keepPng ? "image/png" : "image/webp", width: out.info.width, height: out.info.height };
}

/** Checks a file and prepares the bytes to store. Never trusts the file name or the browser's type. */
export async function prepareUpload(file: File, allowed: string[]): Promise<{ ok: true; file: Prepared } | { ok: false; error: string }> {
  if (!file || file.size === 0) return { ok: false, error: "The file is empty." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: `${file.name} is larger than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB. Please use a smaller file.` };
  const raw = Buffer.from(await file.arrayBuffer());
  const type = sniff(raw);
  const ok = allowed.includes("image/vnd.microsoft.icon") ? [...allowed, "image/x-icon"] : allowed;
  if (!type || !ok.includes(type)) return { ok: false, error: `${file.name}: this file type isn't accepted here.` };
  if (type === "image/svg+xml" && unsafeSvg(raw)) {
    return { ok: false, error: `${file.name}: this SVG contains scripts or links and can't be used. Export it again as a plain drawing or a PNG.` };
  }
  const name = file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 200) || "file";
  if (type === "image/svg+xml") return { ok: true, file: { filename: name, mimeType: type, data: raw, size: raw.length, ...svgSize(raw) } };
  if (type === "application/pdf" || type === "image/x-icon") return { ok: true, file: { filename: name, mimeType: type, data: raw, size: raw.length, width: null, height: null } };
  try {
    const p = await processImage(raw, type);
    return { ok: true, file: { filename: rename(name, p.mime), mimeType: p.mime, data: p.data, size: p.data.length, width: p.width, height: p.height } };
  } catch (e) {
    console.error("[media] image processing", e);
    if (type === "image/heic") return { ok: false, error: `${file.name}: iPhone HEIC photos can't be read here. Change the camera setting to "Most compatible" or export the photo as JPG.` };
    return { ok: false, error: `${file.name}: this picture appears to be damaged and couldn't be read.` };
  }
}

export async function saveUpload(
  file: File,
  opts: { allowed: string[]; alt?: string; isPrivate?: boolean; folder?: string; uploadedById?: string | null },
) {
  const r = await prepareUpload(file, opts.allowed);
  if (!r.ok) return r;
  const [row] = await db
    .insert(schema.media)
    .values({
      ...r.file,
      alt: (opts.alt ?? "").slice(0, 200),
      isPrivate: opts.isPrivate ?? false,
      folder: cleanFolder(opts.folder ?? ""),
      uploadedById: opts.uploadedById ?? null,
    })
    .returning({ id: schema.media.id });
  if (Math.random() < 0.05) void purgeDeleted();
  return { ok: true as const, id: row.id };
}

/** Removed files stay restorable for 30 days; earlier versions of replaced files for a year. */
export async function purgeDeleted() {
  try {
    const M = schema.media;
    await db.delete(M).where(and(isNotNull(M.deletedAt), ne(M.folder, HISTORY_FOLDER), lt(M.deletedAt, sql`now() - interval '30 days'`)));
    await db.delete(M).where(and(isNotNull(M.deletedAt), sql`${M.folder} = ${HISTORY_FOLDER}`, lt(M.deletedAt, sql`now() - interval '365 days'`)));
  } catch (e) {
    console.error("[media] purge", e);
  }
}

// ---------- Folders ----------
export const PRESET_FOLDERS = ["Home slider", "Page banners", "Products", "Brands and logos", "News", "Documents"] as const;

export function cleanFolder(v: string) {
  const f = v.replace(/[^\w &().,'-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  return f === "Unsorted" || f.startsWith("__") ? "" : f;
}

/** Library folders: the presets first, then any others in use, with file counts. "" is Unsorted. */
export async function libraryFolders() {
  const M = schema.media;
  const rows = await db
    .select({ folder: M.folder, n: sql<number>`count(*)::int` })
    .from(M)
    .where(and(isNull(M.deletedAt), sql`${M.isPrivate} = false`))
    .groupBy(M.folder);
  const counts = new Map(rows.map((r) => [r.folder, r.n]));
  const custom = rows.map((r) => r.folder).filter((f) => f && f !== HISTORY_FOLDER && !(PRESET_FOLDERS as readonly string[]).includes(f));
  return [
    ...PRESET_FOLDERS.map((f) => ({ name: f, n: counts.get(f) ?? 0, preset: true })),
    ...custom.sort().map((f) => ({ name: f, n: counts.get(f) ?? 0, preset: false })),
    { name: "", n: counts.get("") ?? 0, preset: true },
  ];
}

// ---------- Where a file is used ----------
export type Usage = { where: string; href: string };

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** Every media id mentioned anywhere in a JSON value, with the path where it was found. */
function walk(v: unknown, path: string[], out: (id: string, path: string[]) => void) {
  if (typeof v === "string") {
    for (const m of v.matchAll(UUID)) out(m[0].toLowerCase(), path);
  } else if (Array.isArray(v)) {
    v.forEach((x, i) => walk(x, [...path, String(i)], out));
  } else if (v && typeof v === "object") {
    for (const [k, x] of Object.entries(v)) walk(x, [...path, k], out);
  }
}

function settingsPlace(path: string[]) {
  const [a, b, c] = path;
  if (a === "images") return `Site picture: ${IMAGE_SLOTS.find((s) => s.key === b)?.label ?? b}`;
  if (a === "home" && b === "slides") return `Home slider, slide ${Number(c) + 1}`;
  if (a === "branding") return b === "faviconId" ? "Browser tab icon" : b === "logoDarkId" ? "Logo on dark backgrounds" : "Company logo";
  return "Company settings";
}

/**
 * Scans settings, page text, the catalogue, brands and news for each file id, so staff can see where a
 * file appears before they replace or remove it. The data is small, so one pass covers everything.
 */
export async function mediaUsage(): Promise<Map<string, Usage[]>> {
  const map = new Map<string, Usage[]>();
  const add = (id: string | null | undefined, u: Usage) => {
    if (!id) return;
    const k = id.toLowerCase();
    const list = map.get(k) ?? [];
    if (!list.some((x) => x.where === u.where)) list.push(u);
    map.set(k, list);
  };
  const [settings, pages, cats, fams, prods, brands, posts] = await Promise.all([
    db.select().from(schema.siteSettings),
    db.select().from(schema.pageContent),
    db.select({ id: schema.categories.id, name: schema.categories.name, imageId: schema.categories.imageId }).from(schema.categories),
    db.select({ id: schema.families.id, name: schema.families.name, imageId: schema.families.imageId }).from(schema.families),
    db.select({ id: schema.products.id, name: schema.products.name, imageIds: schema.products.imageIds, brochureId: schema.products.brochureId }).from(schema.products),
    db.select({ id: schema.brands.id, name: schema.brands.name, logoId: schema.brands.logoId }).from(schema.brands),
    db.select({ id: schema.posts.id, title: schema.posts.title, coverId: schema.posts.coverId, body: schema.posts.body }).from(schema.posts),
  ]);
  for (const s of settings) walk(s.data, [], (id, path) => add(id, { where: settingsPlace(path), href: path[0] === "home" || path[0] === "images" ? "/admin/images" : "/admin/settings" }));
  for (const p of pages) {
    const def = pageDef(p.page);
    walk(p.data, [], (id, path) => {
      const field = def?.sections.flatMap((s) => s.fields).find((f) => f.key === path[0]);
      add(id, { where: `${def?.label ?? p.page}${field ? `: ${field.label}` : ""}`, href: `/admin/pages/${p.page}` });
    });
  }
  for (const c of cats) add(c.imageId, { where: `Product line: ${c.name}`, href: `/admin/catalogue/lines/${c.id}` });
  for (const f of fams) add(f.imageId, { where: `Machine type: ${f.name}`, href: `/admin/catalogue/types/${f.id}` });
  for (const p of prods) {
    for (const i of p.imageIds) add(i, { where: `Model photo: ${p.name}`, href: `/admin/catalogue/models/${p.id}` });
    add(p.brochureId, { where: `Model brochure: ${p.name}`, href: `/admin/catalogue/models/${p.id}` });
  }
  for (const b of brands) add(b.logoId, { where: `Brand logo: ${b.name}`, href: `/admin/catalogue/brands/${b.id}` });
  for (const p of posts) {
    add(p.coverId, { where: `News cover: ${p.title}`, href: `/admin/news/${p.id}` });
    for (const m of p.body.matchAll(/\/media\/([0-9a-f-]{36})/gi)) add(m[1], { where: `News story: ${p.title}`, href: `/admin/news/${p.id}` });
  }
  return map;
}

export async function usageOf(id: string) {
  return (await mediaUsage()).get(id.toLowerCase()) ?? [];
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
