"use server";
import { and, asc, eq, ne } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { audit, requireAdmin } from "@/lib/auth";
import { clearEnyoCache } from "@/lib/enyo";
import { slugify } from "@/lib/format";
import { snapshot } from "@/lib/history";
import type { Permission } from "@/lib/permissions";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const on = (f: FormData, k: string) => f.get(k) === "on";
const UUID = /^[0-9a-f-]{36}$/i;

async function editor(perm: Permission) {
  return requireAdmin(perm);
}

// ---------- News ----------
export async function savePost(id: string, f: FormData) {
  const user = await editor("news");
  const title = s(f, "title").slice(0, 200);
  const path = `/admin/news/${id}`;
  if (!title) redirect(`${path}?error=Give%20the%20post%20a%20title`);
  const existing = id === "new" ? null : await db.query.posts.findFirst({ where: eq(schema.posts.id, id) });
  const published = on(f, "published");
  const base = slugify(s(f, "slug") || title) || "post";
  let slug = base;
  for (let i = 2; ; i++) {
    const clash = await db
      .select({ id: schema.posts.id })
      .from(schema.posts)
      .where(existing ? and(eq(schema.posts.slug, slug), ne(schema.posts.id, existing.id)) : eq(schema.posts.slug, slug))
      .limit(1);
    if (!clash.length) break;
    slug = `${base}-${i}`;
  }
  const date = s(f, "publishedAt");
  const when = date && !Number.isNaN(Date.parse(date)) ? new Date(`${date}T09:00:00+01:00`) : null;
  const vals = {
    title,
    slug,
    category: s(f, "category").slice(0, 40) || "News",
    excerpt: s(f, "excerpt"),
    body: String(f.get("body") ?? ""),
    published,
    publishedAt: when ?? (published ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null)),
    coverId: UUID.test(s(f, "coverId")) ? s(f, "coverId") : null,
  };
  let postId = id;
  if (!existing) {
    const [row] = await db.insert(schema.posts).values(vals).returning();
    postId = row.id;
    await audit(user.id, "create", "post", `Wrote news post “${title}”`, row.id);
  } else {
    await snapshot("post", id, existing.title, "update", user.id);
    await db.update(schema.posts).set(vals).where(eq(schema.posts.id, id));
    await audit(user.id, existing.published !== published ? (published ? "publish" : "unpublish") : "update", "post", `${published && !existing.published ? "Published" : "Updated"} news post “${title}”`, id);
  }
  revalidateTag("posts");
  revalidatePath("/", "layout");
  redirect(`/admin/news/${postId}?saved=${encodeURIComponent(published ? "Saved and on the website." : "Saved as a draft. Tick Published when it's ready.")}`);
}

export async function deletePost(id: string) {
  const user = await editor("news");
  const p = await db.query.posts.findFirst({ where: eq(schema.posts.id, id) });
  if (p) {
    await snapshot("post", id, p.title, "delete", user.id);
    await db.delete(schema.posts).where(eq(schema.posts.id, id));
    await audit(user.id, "delete", "post", `Deleted news post “${p.title}”`, id);
  }
  revalidateTag("posts");
  revalidatePath("/", "layout");
  redirect(`/admin/news?saved=${encodeURIComponent("Post deleted. You can bring it back from History.")}`);
}

// ---------- Locations ----------
function refreshBranches() {
  revalidateTag("branches");
  revalidatePath("/", "layout");
  clearEnyoCache();
}

export async function saveBranch(id: string, f: FormData) {
  const user = await editor("locations");
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
    await snapshot("branch", id, vals.name, "update", user.id);
    await db.update(schema.branches).set(vals).where(eq(schema.branches.id, id));
    await audit(user.id, "update", "branch", `Updated location ${vals.name}`, id);
  }
  refreshBranches();
  redirect(`/admin/branches?saved=${encodeURIComponent(`${vals.name} saved.`)}`);
}

export async function deleteBranch(id: string) {
  const user = await editor("locations");
  const b = await db.query.branches.findFirst({ where: eq(schema.branches.id, id) });
  if (b) {
    await snapshot("branch", id, b.name, "delete", user.id);
    await db.delete(schema.branches).where(eq(schema.branches.id, id));
    await audit(user.id, "delete", "branch", `Deleted location ${b.name}`, id);
    refreshBranches();
  }
  redirect(`/admin/branches?saved=${encodeURIComponent(`${b?.name ?? "Location"} deleted. You can bring it back from History.`)}`);
}

export async function moveBranch(id: string, dir: "up" | "down") {
  const user = await editor("locations");
  const rows = await db.select({ id: schema.branches.id, name: schema.branches.name }).from(schema.branches).orderBy(asc(schema.branches.order), asc(schema.branches.name));
  const i = rows.findIndex((r) => r.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i >= 0 && j >= 0 && j < rows.length) {
    [rows[i], rows[j]] = [rows[j], rows[i]];
    for (const [k, r] of rows.entries()) await db.update(schema.branches).set({ order: k + 1 }).where(eq(schema.branches.id, r.id));
    await audit(user.id, "reorder", "branch", `Moved ${rows[j].name} ${dir}`, id);
    refreshBranches();
  }
  redirect("/admin/branches");
}
