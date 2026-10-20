import "server-only";
import { db, schema } from "@/db";

export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB ?? 8) * 1024 * 1024;

export async function saveUpload(file: File, opts: { allowed: string[]; alt?: string; isPrivate?: boolean }) {
  if (!file || file.size === 0) return { ok: false as const, error: "Empty file" };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false as const, error: `${file.name} is larger than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB` };
  const type = file.type || "application/octet-stream";
  if (!opts.allowed.includes(type)) return { ok: false as const, error: `${file.name}: this file type isn't accepted` };
  const data = Buffer.from(await file.arrayBuffer());
  const [row] = await db
    .insert(schema.media)
    .values({ filename: file.name.slice(0, 200), mimeType: type, size: file.size, alt: opts.alt ?? "", isPrivate: opts.isPrivate ?? false, data })
    .returning({ id: schema.media.id });
  return { ok: true as const, id: row.id };
}
