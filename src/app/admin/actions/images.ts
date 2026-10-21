"use server";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { db, schema } from "@/db";
import { audit, requireAdmin } from "@/lib/auth";
import { pageDef } from "@/lib/content-registry";
import { snapshot } from "@/lib/history";
import type { Permission } from "@/lib/permissions";
import { getSettings, type Settings } from "@/lib/settings";

/**
 * Every picture on the site, changed from one place (Dashboard → Images). Each change saves at once,
 * keeps a copy of what was there in History, and refreshes the website.
 */
export type ImageTarget =
  | { kind: "page"; page: string; field: string }
  | { kind: "category" | "family" | "brand" | "post"; id: string }
  | { kind: "company"; key: "logoId" | "logoDarkId" | "faviconId" }
  | { kind: "slot"; key: "og-image" };

export type ImageResult = { ok: boolean; message: string };

const UUID = /^[0-9a-f-]{36}$/i;

const PERM: Record<ImageTarget["kind"], Permission> = {
  page: "pages",
  category: "products",
  family: "products",
  brand: "brands",
  post: "news",
  company: "settings",
  slot: "pages",
};

async function fileExists(id: string) {
  if (!id) return true;
  if (!UUID.test(id)) return false;
  const m = await db.query.media.findFirst({ where: eq(schema.media.id, id), columns: { id: true, deletedAt: true } });
  return !!m && !m.deletedAt;
}

async function storeSettings(next: Settings, actorId: string, label: string) {
  await snapshot("settings", "1", label, "update", actorId);
  await db.insert(schema.siteSettings).values({ id: 1, data: next }).onConflictDoUpdate({ target: schema.siteSettings.id, set: { data: next } });
  revalidateTag("settings");
}

export async function setImage(target: ImageTarget, value: string): Promise<ImageResult> {
  const user = await requireAdmin(PERM[target.kind] ?? "pages");
  const v = String(value ?? "").trim();
  if (!(await fileExists(v))) return { ok: false, message: "That picture couldn't be found in the library. Choose it again." };
  const label = v ? "Picture changed" : "Back to the original picture";

  switch (target.kind) {
    case "page": {
      const def = pageDef(target.page);
      const field = def?.sections.flatMap((s) => s.fields).find((f) => f.key === target.field && f.type === "image");
      if (!def || !field) return { ok: false, message: "That picture's place on the site no longer exists." };
      const row = await db.query.pageContent.findFirst({ where: eq(schema.pageContent.page, def.key) });
      await snapshot("page", def.key, def.label, "update", user.id);
      const data = { ...((row?.data as Record<string, unknown>) ?? {}) };
      if (v) data[field.key] = v;
      else delete data[field.key];
      await db
        .insert(schema.pageContent)
        .values({ page: def.key, data, updatedById: user.id })
        .onConflictDoUpdate({ target: schema.pageContent.page, set: { data, updatedById: user.id } });
      revalidateTag("content");
      await audit(user.id, "update", "image", `${def.label}: ${field.label.toLowerCase()} ${v ? "changed" : "reset to the original"}`, def.key);
      break;
    }
    case "category":
    case "family": {
      const table = target.kind === "category" ? schema.categories : schema.families;
      const row = await db.select({ name: table.name }).from(table).where(eq(table.id, target.id)).limit(1);
      if (!row[0]) return { ok: false, message: "That item no longer exists." };
      await snapshot(target.kind, target.id, row[0].name, "update", user.id);
      await db.update(table).set({ imageId: v || null }).where(eq(table.id, target.id));
      revalidateTag("catalogue");
      await audit(user.id, "update", "image", `${row[0].name}: picture ${v ? "changed" : "removed"}`, target.id);
      break;
    }
    case "brand": {
      const b = await db.query.brands.findFirst({ where: eq(schema.brands.id, target.id) });
      if (!b) return { ok: false, message: "That brand no longer exists." };
      await snapshot("brand", b.id, b.name, "update", user.id);
      await db.update(schema.brands).set({ logoId: v || null }).where(eq(schema.brands.id, b.id));
      revalidateTag("catalogue");
      await audit(user.id, "update", "image", `${b.name}: logo ${v ? "changed" : "removed"}`, b.id);
      break;
    }
    case "post": {
      const p = await db.query.posts.findFirst({ where: eq(schema.posts.id, target.id) });
      if (!p) return { ok: false, message: "That post no longer exists." };
      await snapshot("post", p.id, p.title, "update", user.id);
      await db.update(schema.posts).set({ coverId: v || null }).where(eq(schema.posts.id, p.id));
      revalidateTag("posts");
      await audit(user.id, "update", "image", `${p.title}: cover picture ${v ? "changed" : "removed"}`, p.id);
      break;
    }
    case "company": {
      const cur = await getSettings();
      await storeSettings({ ...cur, branding: { ...cur.branding, [target.key]: v || null } }, user.id, "Company logo");
      await audit(user.id, "update", "image", `Company ${target.key === "faviconId" ? "browser icon" : "logo"} ${v ? "changed" : "removed"}`);
      break;
    }
    case "slot": {
      const cur = await getSettings();
      const images = { ...cur.images };
      if (v) images[target.key] = v;
      else delete images[target.key];
      await storeSettings({ ...cur, images }, user.id, "Link preview picture");
      await audit(user.id, "update", "image", `Link preview picture ${v ? "changed" : "reset to the original"}`);
      break;
    }
  }
  revalidatePath("/", "layout");
  return { ok: true, message: label };
}

/** A model's photos, in order. The first is the main photo. */
export async function setGallery(productId: string, ids: string[]): Promise<ImageResult> {
  const user = await requireAdmin("products");
  const list = [...new Set((ids ?? []).map(String).filter((x) => UUID.test(x)))].slice(0, 20);
  if (list.length) {
    const found = await db.select({ id: schema.media.id }).from(schema.media).where(inArray(schema.media.id, list));
    if (found.length !== list.length) return { ok: false, message: "One of those photos couldn't be found. Refresh and try again." };
  }
  const p = await db.query.products.findFirst({ where: eq(schema.products.id, productId) });
  if (!p) return { ok: false, message: "That model no longer exists." };
  if (JSON.stringify(p.imageIds) === JSON.stringify(list)) return { ok: true, message: "No change" };
  await snapshot("product", p.id, p.name, "update", user.id);
  await db.update(schema.products).set({ imageIds: list }).where(eq(schema.products.id, p.id));
  revalidateTag("catalogue");
  revalidatePath("/", "layout");
  await audit(user.id, "update", "image", `${p.name}: photos updated (${list.length})`, p.id);
  return { ok: true, message: list.length ? `${list.length} photo${list.length === 1 ? "" : "s"} saved` : "Photos removed. The drawing shows instead." };
}
