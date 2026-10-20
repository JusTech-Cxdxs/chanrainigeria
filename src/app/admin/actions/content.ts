"use server";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { audit, can, requireAdmin } from "@/lib/auth";
import { clearEnyoCache } from "@/lib/enyo";
import { slugify } from "@/lib/format";
import { saveUpload } from "@/lib/media";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const on = (f: FormData, k: string) => f.get(k) === "on";
const IMAGE = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"];

async function editor() {
  const user = await requireAdmin();
  if (!can.content(user.role)) redirect("/admin?denied=1");
  return user;
}

// ---------- News ----------
export async function savePost(id: string, f: FormData) {
  const user = await editor();
  const title = s(f, "title");
  const path = `/admin/news/${id}`;
  if (!title) redirect(`${path}?error=Give%20the%20post%20a%20title`);
  let coverId: string | undefined;
  const file = f.get("cover");
  if (file instanceof File && file.size) {
    const r = await saveUpload(file, { allowed: IMAGE, alt: title });
    if (!r.ok) redirect(`${path}?error=${encodeURIComponent(r.error)}`);
    coverId = r.id;
  }
  const existing = id === "new" ? null : await db.query.posts.findFirst({ where: eq(schema.posts.id, id) });
  const published = on(f, "published");
  let slug = slugify(s(f, "slug") || title) || "post";
  for (let i = 2; ; i++) {
    const clash = await db.select({ id: schema.posts.id }).from(schema.posts).where(existing ? and(eq(schema.posts.slug, slug), ne(schema.posts.id, existing.id)) : eq(schema.posts.slug, slug)).limit(1);
    if (!clash.length) break;
    slug = `${slugify(s(f, "slug") || title)}-${i}`;
  }
  const date = s(f, "publishedAt");
  const vals = {
    title,
    slug,
    excerpt: s(f, "excerpt"),
    body: String(f.get("body") ?? ""),
    published,
    publishedAt: date ? new Date(date) : published ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null),
    ...(coverId ? { coverId } : on(f, "removeCover") ? { coverId: null } : {}),
  };
  let postId = id;
  if (!existing) {
    const [row] = await db.insert(schema.posts).values(vals).returning();
    postId = row.id;
    await audit(user.id, "create", "post", `Wrote news post “${title}”`, row.id);
  } else {
    await db.update(schema.posts).set(vals).where(eq(schema.posts.id, id));
    await audit(user.id, existing.published !== published ? (published ? "publish" : "unpublish") : "update", "post", `${published && !existing.published ? "Published" : "Updated"} news post “${title}”`, id);
  }
  revalidateTag("posts");
  revalidatePath("/", "layout");
  redirect(`/admin/news/${postId}?saved=`);
}

export async function deletePost(id: string) {
  const user = await editor();
  const p = await db.query.posts.findFirst({ where: eq(schema.posts.id, id) });
  if (p) {
    await db.delete(schema.posts).where(eq(schema.posts.id, id));
    await audit(user.id, "delete", "post", `Deleted news post “${p.title}”`, id);
  }
  revalidateTag("posts");
  redirect("/admin/news?saved=Post%20deleted.");
}

// ---------- Locations ----------
export async function saveBranch(id: string, f: FormData) {
  const user = await editor();
  const vals = {
    name: s(f, "name"),
    address: s(f, "address"),
    city: s(f, "city"),
    state: s(f, "state"),
    phone: s(f, "phone") || null,
    email: s(f, "email") || null,
    mapUrl: s(f, "mapUrl") || null,
    hours: s(f, "hours") || null,
    isHeadOffice: on(f, "isHeadOffice"),
    active: on(f, "active"),
    order: Number(f.get("order") ?? 0) || 0,
  };
  if (!vals.name || !vals.address) redirect("/admin/branches?error=Name%20and%20address%20are%20required");
  if (vals.mapUrl && !/^https:\/\//.test(vals.mapUrl)) redirect("/admin/branches?error=The%20map%20link%20must%20start%20with%20https%3A%2F%2F");
  if (id === "new") {
    const [row] = await db.insert(schema.branches).values(vals).returning();
    await audit(user.id, "create", "branch", `Added location ${vals.name}`, row.id);
  } else {
    await db.update(schema.branches).set(vals).where(eq(schema.branches.id, id));
    await audit(user.id, "update", "branch", `Updated location ${vals.name}`, id);
  }
  revalidateTag("branches");
  revalidatePath("/", "layout");
  clearEnyoCache();
  redirect("/admin/branches?saved=");
}

// ---------- Media ----------
export async function uploadMedia(f: FormData) {
  const user = await editor();
  let n = 0;
  for (const file of f.getAll("files")) {
    if (!(file instanceof File) || !file.size) continue;
    const r = await saveUpload(file, { allowed: [...IMAGE, "application/pdf"], alt: s(f, "alt") });
    if (!r.ok) redirect(`/admin/media?error=${encodeURIComponent(r.error)}`);
    n++;
  }
  await audit(user.id, "upload", "media", `Uploaded ${n} file${n === 1 ? "" : "s"}`);
  redirect(`/admin/media?saved=${encodeURIComponent(`${n} file${n === 1 ? "" : "s"} uploaded.`)}`);
}
