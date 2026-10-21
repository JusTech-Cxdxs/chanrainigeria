"use server";
import { and, asc, eq, isNull, ne, type SQL } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { audit, requireAdmin } from "@/lib/auth";
import { clearEnyoCache } from "@/lib/enyo";
import { slugify } from "@/lib/format";
import { snapshot } from "@/lib/history";
import { fromFaq, fromFields, fromIntervals, fromLines, fromPairs, fromSpecs } from "@/lib/lines";
import type { Permission } from "@/lib/permissions";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const on = (f: FormData, k: string) => f.get(k) === "on";
const num = (f: FormData, k: string) => Number(f.get(k) ?? 0) || 0;
const UUID = /^[0-9a-f-]{36}$/i;
/** A library file id from a picker field, or null. */
const mediaId = (f: FormData, k: string) => (UUID.test(s(f, k)) ? s(f, k) : null);

async function editor(perm: Permission) {
  return requireAdmin(perm);
}

function refresh() {
  revalidateTag("catalogue");
  revalidatePath("/", "layout");
  clearEnyoCache();
}

type Sluggable = "families" | "products" | "categories" | "services" | "brands";
async function uniqueSlug(table: Sluggable, wanted: string, exceptId?: string) {
  const t = schema[table];
  const base = slugify(wanted) || "item";
  let slug = base;
  for (let i = 2; ; i++) {
    const clash = await db.select({ id: t.id }).from(t).where(exceptId ? and(eq(t.slug, slug), ne(t.id, exceptId)) : eq(t.slug, slug)).limit(1);
    if (!clash.length) return slug;
    slug = `${base}-${i}`;
  }
}

function withParam(path: string, key: string, msg: string) {
  const [p, hash] = path.split("#");
  return `${p}${p.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(msg)}${hash ? `#${hash}` : ""}`;
}
const fail = (path: string, e: unknown) => redirect(withParam(path, "error", e instanceof Error ? e.message : String(e || "Something went wrong")));
const done = (path: string, msg = "Saved.") => redirect(withParam(path, "saved", msg));

// ---------- Ordering ----------
type Orderable = "categories" | "families" | "products" | "services" | "brands";
const ORDER_PERM: Record<Orderable, Permission> = { categories: "products", families: "products", products: "products", services: "services", brands: "brands" };

/** Move an item one place up or down among its siblings, and renumber them 1, 2, 3… */
export async function moveItem(kind: Orderable, id: string, dir: "up" | "down", back: string) {
  if (!(kind in ORDER_PERM) || (dir !== "up" && dir !== "down")) redirect("/admin/catalogue");
  const user = await editor(ORDER_PERM[kind]);
  const t = schema[kind];
  const row = (await db.select().from(t).where(eq(t.id, id)).limit(1))[0] as Record<string, unknown> | undefined;
  if (!row) redirect(back);
  let scope: SQL | undefined;
  if (kind === "families") scope = eq(schema.families.categoryId, String(row!.categoryId));
  if (kind === "products") scope = eq(schema.products.familyId, String(row!.familyId));
  if (kind === "services") scope = row!.categoryId ? eq(schema.services.categoryId, String(row!.categoryId)) : isNull(schema.services.categoryId);
  const sibs = await db.select({ id: t.id, name: t.name }).from(t).where(scope).orderBy(asc(t.order), asc(t.name));
  const i = sibs.findIndex((x) => x.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i >= 0 && j >= 0 && j < sibs.length) {
    [sibs[i], sibs[j]] = [sibs[j], sibs[i]];
    for (const [k, x] of sibs.entries()) await db.update(t).set({ order: k + 1 }).where(eq(t.id, x.id));
    await audit(user.id, "reorder", kind, `Moved ${String(row!.name)} ${dir}`, id);
    refresh();
  }
  redirect(back.startsWith("/admin/") ? back : "/admin/catalogue");
}

// ---------- Product lines ----------
export async function saveCategory(id: string, f: FormData) {
  const user = await editor("products");
  const path = `/admin/catalogue/lines/${id}`;
  const name = s(f, "name");
  if (!name) fail(path, "Give the line a name.");
  await snapshot("category", id, name, "update", user.id);
  await db
    .update(schema.categories)
    .set({
      name,
      tagline: s(f, "tagline"),
      intro: s(f, "intro"),
      salesBlurb: s(f, "salesBlurb"),
      serviceBlurb: s(f, "serviceBlurb"),
      partsBlurb: s(f, "partsBlurb"),
      desk: s(f, "desk") || "sales",
      illustration: s(f, "illustration") || "excavator",
      order: num(f, "order"),
      published: on(f, "published"),
      brandId: s(f, "brandId") || null,
      imageId: mediaId(f, "imageId"),
    })
    .where(eq(schema.categories.id, id));
  await audit(user.id, "update", "category", `Updated product line ${name}`, id);
  refresh();
  done(path);
}

export async function createCategory(f: FormData) {
  const user = await editor("products");
  const name = s(f, "name");
  if (!name) redirect("/admin/catalogue?error=Give%20the%20line%20a%20name");
  const [row] = await db
    .insert(schema.categories)
    .values({ name, slug: await uniqueSlug("categories", name), published: false, order: 99 })
    .returning();
  await audit(user.id, "create", "category", `Added product line ${name}`, row.id);
  refresh();
  done(`/admin/catalogue/lines/${row.id}`, "Line created as a draft. Fill it in, then tick Show on the website.");
}

export async function deleteCategory(id: string) {
  const user = await editor("products");
  const c = await db.query.categories.findFirst({ where: eq(schema.categories.id, id), with: { families: { columns: { id: true } } } });
  if (!c) redirect("/admin/catalogue");
  if (c!.families.length) fail(`/admin/catalogue/lines/${id}`, `This line still has ${c!.families.length} machine type${c!.families.length === 1 ? "" : "s"}. Move or delete them first, or untick Show on the website to hide the whole line.`);
  await snapshot("category", id, c!.name, "delete", user.id);
  await db.delete(schema.categories).where(eq(schema.categories.id, id));
  await audit(user.id, "delete", "category", `Deleted product line ${c!.name}`, id);
  refresh();
  done("/admin/catalogue", `${c!.name} deleted. You can bring it back from History.`);
}

// ---------- Brands ----------
export async function saveBrand(id: string, f: FormData) {
  const user = await editor("brands");
  const path = id === "new" ? "/admin/catalogue/brands/new" : `/admin/catalogue/brands/${id}`;
  const website = s(f, "website");
  const vals = {
    name: s(f, "name").slice(0, 80),
    website: website ? (/^https?:\/\//i.test(website) ? website : `https://${website}`) : null,
    relationship: s(f, "relationship").slice(0, 60),
    about: s(f, "about"),
    highlights: fromLines(s(f, "highlights")),
    showOnHome: on(f, "showOnHome"),
    showInEmail: on(f, "showInEmail"),
    order: num(f, "order"),
    logoId: mediaId(f, "logoId"),
  };
  if (!vals.name) fail(path, "Enter the brand's name.");
  if (vals.website && !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(vals.website)) fail(path, "The website doesn't look right. Use the full address, e.g. https://www.liugong.com");
  if (id === "new") {
    const [row] = await db
      .insert(schema.brands)
      .values({ ...vals, slug: await uniqueSlug("brands", vals.name) })
      .returning();
    await audit(user.id, "create", "brand", `Added brand ${vals.name}`, row.id);
    refresh();
    done(`/admin/catalogue/brands/${row.id}`, "Brand added.");
  }
  await snapshot("brand", id, vals.name, "update", user.id);
  await db.update(schema.brands).set(vals).where(eq(schema.brands.id, id));
  await audit(user.id, "update", "brand", `Updated brand ${vals.name}`, id);
  refresh();
  done(path);
}

export async function deleteBrand(id: string) {
  const user = await editor("brands");
  const b = await db.query.brands.findFirst({ where: eq(schema.brands.id, id) });
  if (b) {
    await snapshot("brand", id, b.name, "delete", user.id);
    await db.delete(schema.brands).where(eq(schema.brands.id, id));
    await audit(user.id, "delete", "brand", `Deleted brand ${b.name}`, id);
    refresh();
  }
  done("/admin/catalogue/brands", `${b?.name ?? "Brand"} deleted. You can bring it back from History.`);
}

// ---------- Machine types ----------
export async function saveFamily(id: string, f: FormData) {
  const user = await editor("products");
  const name = s(f, "name");
  const path = id === "new" ? `/admin/catalogue/types/new?category=${s(f, "categoryId")}` : `/admin/catalogue/types/${id}`;
  if (!name) fail(path, "Give the machine type a name.");
  if (!s(f, "categoryId")) fail(path, "Choose the product line it belongs to.");
  const vals = {
    name,
    summary: s(f, "summary"),
    howItWorks: s(f, "howItWorks"),
    keyComponents: fromPairs(s(f, "keyComponents")),
    applications: fromLines(s(f, "applications")),
    choosingTips: fromLines(s(f, "choosingTips")),
    maintenance: { dailyChecks: fromLines(s(f, "dailyChecks")), intervals: fromIntervals(s(f, "intervals")), note: s(f, "maintenanceNote") },
    safety: fromLines(s(f, "safety")),
    specFields: fromFields(s(f, "specFields")),
    faq: fromFaq(String(f.get("faq") ?? "")),
    illustration: s(f, "illustration") || null,
    order: num(f, "order"),
    published: on(f, "published"),
    categoryId: s(f, "categoryId"),
    imageId: mediaId(f, "imageId"),
  };
  if (id === "new") {
    const [row] = await db
      .insert(schema.families)
      .values({ ...vals, slug: await uniqueSlug("families", name) })
      .returning();
    await audit(user.id, "create", "family", `Added machine type ${name}`, row.id);
    refresh();
    done(`/admin/catalogue/types/${row.id}`, "Machine type created. Add its models below.");
  }
  await snapshot("family", id, name, "update", user.id);
  await db.update(schema.families).set(vals).where(eq(schema.families.id, id));
  await audit(user.id, "update", "family", `Updated machine type ${name}`, id);
  refresh();
  done(path);
}

export async function deleteFamily(id: string) {
  const user = await editor("products");
  const fam = await db.query.families.findFirst({ where: eq(schema.families.id, id), with: { products: { columns: { id: true } } } });
  if (!fam) redirect("/admin/catalogue");
  if (fam!.products.length) fail(`/admin/catalogue/types/${id}`, `This type still has ${fam!.products.length} model${fam!.products.length === 1 ? "" : "s"}. Delete or move them first, or untick Show on the website to hide it.`);
  await snapshot("family", id, fam!.name, "delete", user.id);
  await db.delete(schema.families).where(eq(schema.families.id, id));
  await audit(user.id, "delete", "family", `Deleted machine type ${fam!.name}`, id);
  refresh();
  done(`/admin/catalogue/lines/${fam!.categoryId}`, `${fam!.name} deleted. You can bring it back from History.`);
}

/** Show or hide a line, type or service straight from a list. */
export async function togglePublished(kind: "categories" | "families" | "services", id: string, back: string) {
  if (!["categories", "families", "services"].includes(kind)) redirect("/admin/catalogue");
  const user = await editor(kind === "services" ? "services" : "products");
  const t = schema[kind];
  const row = (await db.select({ id: t.id, name: t.name, published: t.published }).from(t).where(eq(t.id, id)).limit(1))[0];
  if (row) {
    await snapshot(kind === "categories" ? "category" : kind === "families" ? "family" : "service", id, row.name, "update", user.id);
    await db.update(t).set({ published: !row.published }).where(eq(t.id, id));
    await audit(user.id, row.published ? "hide" : "publish", kind, `${row.published ? "Hid" : "Published"} ${row.name}`, id);
    refresh();
  }
  done(back.startsWith("/admin/") ? back : "/admin/catalogue", row?.published ? `${row.name} is now hidden.` : `${row?.name} is now on the website.`);
}

// ---------- Models ----------
export async function saveProduct(id: string, f: FormData) {
  const user = await editor("products");
  const name = s(f, "name");
  const familyId = s(f, "familyId");
  const path = id === "new" ? `/admin/catalogue/models/new?family=${familyId}` : `/admin/catalogue/models/${id}`;
  if (!name) fail(path, "Give the model a name.");
  const family = await db.query.families.findFirst({ where: eq(schema.families.id, familyId) });
  if (!family) fail(path, "Choose the machine type this model belongs to.");
  const existing = id === "new" ? null : await db.query.products.findFirst({ where: eq(schema.products.id, id) });

  // Figures: one box per specification field of the type, plus free "key: value" lines for anything else.
  const specs: Record<string, string | number> = {};
  for (const [k, v] of f.entries()) {
    if (!k.startsWith("spec_") || typeof v !== "string") continue;
    const key = k.slice(5).replace(/[^\w]/g, "").slice(0, 60);
    const raw = v.trim().slice(0, 200);
    if (key && raw) specs[key] = /^-?\d+(\.\d+)?$/.test(raw.replace(/,/g, "")) ? Number(raw.replace(/,/g, "")) : raw;
  }
  Object.assign(specs, fromSpecs(s(f, "specsExtra")));

  const verified = on(f, "specsVerified");
  const vals = {
    name,
    summary: s(f, "summary"),
    highlights: fromLines(s(f, "highlights")),
    specs,
    specsVerified: verified,
    sources: fromLines(s(f, "sources")),
    imageIds: [...new Set(f.getAll("imageIds").map(String).filter((x) => UUID.test(x)))],
    brochureId: mediaId(f, "brochureId"),
    order: num(f, "order"),
    published: on(f, "published"),
    familyId,
    brandId: s(f, "brandId") || null,
  };
  if (id === "new") {
    const brand = vals.brandId ? await db.query.brands.findFirst({ where: eq(schema.brands.id, vals.brandId) }) : null;
    const [row] = await db
      .insert(schema.products)
      .values({ ...vals, slug: await uniqueSlug("products", `${brand?.slug ?? ""} ${name}`) })
      .returning();
    await audit(user.id, "create", "product", `Added model ${name}`, row.id);
    refresh();
    done(`/admin/catalogue/models/${row.id}`, vals.published ? "Model created and on the website." : "Model created as hidden.");
  }
  await snapshot("product", id, name, "update", user.id);
  await db.update(schema.products).set(vals).where(eq(schema.products.id, id));
  const note = existing && existing.specsVerified !== verified ? (verified ? " and marked specs as checked" : " and marked specs as unchecked") : "";
  await audit(user.id, "update", "product", `Updated model ${name}${note}`, id);
  refresh();
  done(path);
}

export async function toggleProduct(id: string) {
  const user = await editor("products");
  const p = await db.query.products.findFirst({ where: eq(schema.products.id, id) });
  if (!p) redirect("/admin/catalogue");
  await snapshot("product", id, p!.name, "update", user.id);
  await db.update(schema.products).set({ published: !p!.published }).where(eq(schema.products.id, id));
  await audit(user.id, p!.published ? "hide" : "publish", "product", `${p!.published ? "Hid" : "Published"} model ${p!.name}`, id);
  refresh();
  done(`/admin/catalogue/types/${p!.familyId}`, p!.published ? `${p!.name} is now hidden.` : `${p!.name} is now on the website.`);
}

/** Enquiries that mention a deleted model keep their text; their link to it is cleared. */
export async function deleteProduct(id: string) {
  const user = await editor("products");
  const p = await db.query.products.findFirst({ where: eq(schema.products.id, id) });
  if (!p) redirect("/admin/catalogue");
  await snapshot("product", id, p!.name, "delete", user.id);
  await db.delete(schema.products).where(eq(schema.products.id, id));
  await audit(user.id, "delete", "product", `Deleted model ${p!.name}`, id);
  refresh();
  done(`/admin/catalogue/types/${p!.familyId}`, `${p!.name} deleted. You can bring it back from History.`);
}

// ---------- Services ----------
export async function saveService(id: string, f: FormData) {
  const user = await editor("services");
  const name = s(f, "name");
  if (!name) redirect("/admin/services?error=Enter%20a%20name");
  const vals = {
    name,
    summary: s(f, "summary"),
    includes: fromLines(s(f, "includes")),
    order: num(f, "order"),
    published: on(f, "published"),
    categoryId: s(f, "categoryId") || null,
  };
  if (id === "new") {
    const [row] = await db.insert(schema.services).values({ ...vals, slug: await uniqueSlug("services", name) }).returning();
    await audit(user.id, "create", "service", `Added service ${name}`, row.id);
  } else {
    await snapshot("service", id, name, "update", user.id);
    await db.update(schema.services).set(vals).where(eq(schema.services.id, id));
    await audit(user.id, "update", "service", `Updated service ${name}`, id);
  }
  refresh();
  done(`/admin/services#s-${id}`, `${name} saved.`);
}

export async function deleteService(id: string) {
  const user = await editor("services");
  const x = await db.query.services.findFirst({ where: eq(schema.services.id, id) });
  if (x) {
    await snapshot("service", id, x.name, "delete", user.id);
    await db.delete(schema.services).where(eq(schema.services.id, id));
    await audit(user.id, "delete", "service", `Deleted service ${x.name}`, id);
    refresh();
  }
  done("/admin/services", `${x?.name ?? "Service"} deleted. You can bring it back from History.`);
}
