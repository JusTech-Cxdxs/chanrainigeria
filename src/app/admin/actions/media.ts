"use server";
import { and, asc, desc, eq, ilike, isNull, like, ne, or, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { audit, requireAdmin } from "@/lib/auth";
import { snapshot, snapshotMediaBytes } from "@/lib/history";
import { cleanFolder, HISTORY_FOLDER, IMAGE_TYPES, libraryFolders, prepareUpload, saveUpload, UPLOAD_TYPES, usageOf } from "@/lib/media";
import type { Permission } from "@/lib/permissions";

const M = schema.media;
const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
/** Anyone who edits something with a picture can browse the library and add to it. */
const PICKERS: Permission[] = ["media", "pages", "products", "brands", "news"];

function refresh() {
  for (const t of ["settings", "content", "catalogue", "posts"]) revalidateTag(t);
  revalidatePath("/", "layout");
}

export type MediaItem = {
  id: string;
  filename: string;
  alt: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  folder: string;
  v: string;
};

const listCols = { id: M.id, filename: M.filename, alt: M.alt, mimeType: M.mimeType, size: M.size, width: M.width, height: M.height, folder: M.folder, updatedAt: M.updatedAt };
const toItem = (r: { updatedAt: Date } & Omit<MediaItem, "v">): MediaItem => {
  const { updatedAt, ...rest } = r;
  return { ...rest, v: new Date(updatedAt).getTime().toString(36) };
};

/** Library search used by the picker. */
export async function listMedia(q: { search?: string; folder?: string | null; type?: "image" | "pdf" | "any"; page?: number }) {
  await requireAdmin(PICKERS);
  const per = 36;
  const page = Math.max(1, Math.floor(q.page ?? 1));
  const where = [isNull(M.deletedAt), eq(M.isPrivate, false), ne(M.folder, HISTORY_FOLDER)];
  if (q.type === "image") where.push(like(M.mimeType, "image/%"));
  if (q.type === "pdf") where.push(eq(M.mimeType, "application/pdf"));
  if (q.folder !== undefined && q.folder !== null) where.push(eq(M.folder, q.folder));
  const term = (q.search ?? "").trim().slice(0, 80);
  if (term) where.push(or(ilike(M.filename, `%${term}%`), ilike(M.alt, `%${term}%`))!);
  const rows = await db
    .select(listCols)
    .from(M)
    .where(and(...where))
    .orderBy(desc(M.createdAt))
    .limit(per + 1)
    .offset((page - 1) * per);
  const folders = (await libraryFolders()).map((f) => ({ name: f.name, n: f.n }));
  return { items: rows.slice(0, per).map(toItem), more: rows.length > per, folders };
}

/** One file at a time, so large batches never hit the request size limit and each shows its own progress. */
export async function uploadOne(f: FormData): Promise<{ ok: true; item: MediaItem } | { ok: false; error: string }> {
  const user = await requireAdmin(PICKERS);
  const file = f.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Choose a file first." };
  const only = s(f, "accept");
  const allowed = only === "image" ? [...IMAGE_TYPES, "image/heic"] : only === "pdf" ? ["application/pdf"] : UPLOAD_TYPES;
  const r = await saveUpload(file, { allowed, alt: s(f, "alt"), folder: s(f, "folder"), uploadedById: user.id });
  if (!r.ok) return r;
  const row = (await db.select(listCols).from(M).where(eq(M.id, r.id)))[0];
  await audit(user.id, "upload", "media", `Uploaded ${row.filename}${row.folder ? ` to ${row.folder}` : ""}`, r.id);
  revalidatePath("/admin/media");
  return { ok: true, item: toItem(row) };
}

/** Rename, describe or move a file. */
export async function updateMedia(id: string, f: FormData) {
  const user = await requireAdmin("media");
  const back = `/admin/media?file=${id}`;
  const cur = await db.query.media.findFirst({ where: and(eq(M.id, id), eq(M.isPrivate, false)), columns: { data: false } });
  if (!cur) redirect("/admin/media?error=That%20file%20no%20longer%20exists.");
  const ext = cur!.filename.match(/\.[a-z0-9]{2,5}$/i)?.[0] ?? "";
  let filename = s(f, "filename").replace(/[^\w.\- ]+/g, "_").slice(0, 200);
  if (!filename) redirect(`${back}&error=${encodeURIComponent("Give the file a name.")}`);
  if (ext && !filename.toLowerCase().endsWith(ext.toLowerCase())) filename += ext;
  const vals = { filename, alt: s(f, "alt").slice(0, 200), folder: cleanFolder(s(f, "folder") === "__new" ? s(f, "newFolder") : s(f, "folder")) };
  await snapshot("media", id, cur!.filename, "update", user.id);
  await db.update(M).set(vals).where(and(eq(M.id, id), eq(M.isPrivate, false)));
  await audit(user.id, "update", "media", `Updated file details for ${filename}`, id);
  refresh();
  redirect(`${back}&saved=${encodeURIComponent("File details saved.")}`);
}

/** New bytes under the same id, so every page using the file shows the new one. The old bytes are kept. */
export async function replaceMedia(id: string, f: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireAdmin("media");
  const cur = await db.query.media.findFirst({ where: and(eq(M.id, id), eq(M.isPrivate, false)), columns: { data: false } });
  if (!cur || cur.deletedAt) return { ok: false, error: "That file no longer exists." };
  const file = f.get("file");
  if (!(file instanceof File) || !file.size) return { ok: false, error: "Choose the new file first." };
  const isPdf = cur.mimeType === "application/pdf";
  const r = await prepareUpload(file, isPdf ? ["application/pdf"] : [...IMAGE_TYPES, "image/heic"], { logo: cur.folder === "Brands and logos" });
  if (!r.ok) return { ok: false, error: isPdf ? `${r.error} A PDF can only be replaced with another PDF.` : r.error };
  await snapshotMediaBytes(id, cur.filename, "update", user.id);
  const { filename, mimeType, data, size, width, height } = r.file;
  await db.update(M).set({ filename, mimeType, data, size, width, height }).where(eq(M.id, id));
  await audit(user.id, "replace", "media", `Replaced ${cur.filename} with ${filename}`, id);
  refresh();
  return { ok: true };
}

/** Removed files are hidden, not destroyed: they can be brought back for 30 days. */
export async function deleteMedia(id: string, back?: string) {
  const user = await requireAdmin("media");
  const cur = await db.query.media.findFirst({ where: and(eq(M.id, id), eq(M.isPrivate, false)), columns: { data: false } });
  if (cur && !cur.deletedAt) {
    const used = await usageOf(id);
    await snapshot("media", id, cur.filename, "delete", user.id);
    await db.update(M).set({ deletedAt: new Date() }).where(eq(M.id, id));
    await audit(user.id, "delete", "media", `Removed ${cur.filename}${used.length ? ` (it was used in ${used.length} place${used.length === 1 ? "" : "s"})` : ""}`, id);
    refresh();
  }
  const to = back && back.startsWith("/admin/media") ? back : "/admin/media";
  redirect(`${to}${to.includes("?") ? "&" : "?"}saved=${encodeURIComponent("File removed. Find it under Recently removed if you need it back.")}`);
}

export async function undeleteMedia(id: string) {
  const user = await requireAdmin("media");
  const cur = await db.query.media.findFirst({ where: and(eq(M.id, id), eq(M.isPrivate, false)), columns: { data: false } });
  if (!cur || cur.folder === HISTORY_FOLDER) redirect("/admin/media?error=That%20file%20can%27t%20be%20brought%20back.");
  await snapshot("media", id, cur!.filename, "update", user.id);
  await db.update(M).set({ deletedAt: null }).where(eq(M.id, id));
  await audit(user.id, "restore", "media", `Brought back ${cur!.filename}`, id);
  refresh();
  redirect(`/admin/media?file=${id}&saved=${encodeURIComponent("File brought back.")}`);
}

/** Move several files to a folder at once. */
export async function moveMedia(f: FormData) {
  const user = await requireAdmin("media");
  const ids = f.getAll("ids").map(String).filter((x) => /^[0-9a-f-]{36}$/i.test(x)).slice(0, 200);
  const folder = cleanFolder(s(f, "folder") === "__new" ? s(f, "newFolder") : s(f, "folder"));
  for (const id of ids) await snapshot("media", id, "Moved file", "update", user.id);
  if (ids.length) await db.update(M).set({ folder }).where(and(sql`${M.id} in (${sql.join(ids.map((i) => sql`${i}`), sql`, `)})`, isNull(M.deletedAt), eq(M.isPrivate, false)));
  await audit(user.id, "update", "media", `Moved ${ids.length} file${ids.length === 1 ? "" : "s"} to ${folder || "Unsorted"}`);
  revalidatePath("/admin/media");
  redirect(`/admin/media?folder=${encodeURIComponent(folder || "Unsorted")}&saved=${encodeURIComponent("Files moved.")}`);
}

export async function folderNames() {
  await requireAdmin(PICKERS);
  return (await libraryFolders()).map((f) => f.name);
}

/** Details for a set of ids (used by pickers to show what is selected). */
export async function mediaInfo(ids: string[]) {
  await requireAdmin(PICKERS);
  const clean = ids.filter((x) => /^[0-9a-f-]{36}$/i.test(x)).slice(0, 50);
  if (!clean.length) return [];
  const rows = await db
    .select(listCols)
    .from(M)
    .where(and(sql`${M.id} in (${sql.join(clean.map((i) => sql`${i}`), sql`, `)})`, eq(M.isPrivate, false)))
    .orderBy(asc(M.filename));
  return rows.map(toItem);
}
