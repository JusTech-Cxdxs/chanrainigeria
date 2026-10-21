import "server-only";
import { db, schema } from "@/db";

// Vercel rejects request bodies over 4.5 MB, so uploads there are capped at 4 MB.
export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB ?? (process.env.VERCEL ? 4 : 8)) * 1024 * 1024;

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

export async function saveUpload(file: File, opts: { allowed: string[]; alt?: string; isPrivate?: boolean }) {
  if (!file || file.size === 0) return { ok: false as const, error: "The file is empty." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false as const, error: `${file.name} is larger than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB. Please use a smaller file.` };
  const data = Buffer.from(await file.arrayBuffer());
  const type = sniff(data);
  const allowed = opts.allowed.includes("image/vnd.microsoft.icon") ? [...opts.allowed, "image/x-icon"] : opts.allowed;
  if (!type || !allowed.includes(type)) return { ok: false as const, error: `${file.name}: this file type isn't accepted.` };
  if (type === "image/svg+xml" && unsafeSvg(data)) {
    return { ok: false as const, error: `${file.name}: this SVG contains scripts or links and can't be used. Export it again as a plain drawing or a PNG.` };
  }
  const [row] = await db
    .insert(schema.media)
    .values({
      filename: file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 200),
      mimeType: type,
      size: data.length,
      alt: (opts.alt ?? "").slice(0, 200),
      isPrivate: opts.isPrivate ?? false,
      data,
    })
    .returning({ id: schema.media.id });
  return { ok: true as const, id: row.id };
}
