"use server";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { audit, requireAdmin } from "@/lib/auth";
import type { Permission } from "@/lib/permissions";
import { clearEnyoCache } from "@/lib/enyo";
import { slugify } from "@/lib/format";
import { fromFaq, fromFields, fromIntervals, fromLines, fromPairs, fromSpecs } from "@/lib/lines";
import { saveUpload } from "@/lib/media";

const IMAGE = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/avif"];
const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const on = (f: FormData, k: string) => f.get(k) === "on";
const num = (f: FormData, k: string) => Number(f.get(k) ?? 0) || 0;

async function editor(perm: Permission) {
  return requireAdmin(perm);
}

function refresh() {
  revalidateTag("catalogue");
  revalidatePath("/", "layout");
  clearEnyoCache();
}

async function upload(f: FormData, key: string) {
  const file = f.get(key);
  if (!(file instanceof File) || file.size === 0) return undefined;
  const r = await saveUpload(file, { allowed: [...IMAGE, "application/pdf"] });
  if (!r.ok) throw new Error(r.error);
  return r.id;
}

async function uniqueSlug(table: "families" | "products" | "categories" | "services", wanted: string, exceptId?: string) {
  const t = schema[table];
  let slug = slugify(wanted) || "item";
  for (let i = 2; ; i++) {
    const clash = await db.select({ id: t.id }).from(t).where(exceptId ? and(eq(t.slug, slug), ne(t.id, exceptId)) : eq(t.slug, slug)).limit(1);
    if (!clash.length) return slug;
    slug = `${slugify(wanted)}-${i}`;
  }
}

const fail = (path: string, e: unknown) => redirect(`${path}?error=${encodeURIComponent(e instanceof Error ? e.message : "Something went wrong")}`);

// ---------- Categories ----------
export async function saveCategory(id: string, f: FormData) {
  const user = await editor("products");
  const path = `/admin/catalogue/lines/${id}`;
  let imageId: string | undefined;
  try {
    imageId = await upload(f, "image");
  } catch (e) {
    fail(path, e);
  }
  await db
    .update(schema.categories)
    .set({
      name: s(f, "name"),
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
      ...(imageId ? { imageId } : on(f, "removeImage") ? { imageId: null } : {}),
    })
    .where(eq(schema.categories.id, id));
  await audit(user.id, "update", "category", `Updated product line ${s(f, "name")}`, id);
  refresh();
  redirect(`${path}?saved=`);
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
  redirect(`/admin/catalogue/lines/${row.id}?saved=${encodeURIComponent("Line created as a draft. Fill it in and publish it.")}`);
}

// ---------- Brands ----------
export async function saveBrand(id: string, f: FormData) {
  const user = await editor("brands");
  let logoId: string | undefined;
  try {
    logoId = await upload(f, "logo");
  } catch (e) {
    fail("/admin/catalogue/brands", e);
  }
  const vals = {
    name: s(f, "name"),
    website: s(f, "website") || null,
    about: s(f, "about"),
    highlights: fromLines(s(f, "highlights")),
    showOnHome: on(f, "showOnHome"),
    order: num(f, "order"),
    ...(logoId ? { logoId } : on(f, "removeLogo") ? { logoId: null } : {}),
  };
  if (id === "new") {
    if (!vals.name) redirect("/admin/catalogue/brands?error=Enter%20a%20name");
    const [row] = await db.insert(schema.brands).values({ ...vals, slug: slugify(vals.name) }).returning();
    await audit(user.id, "create", "brand", `Added manufacturer ${vals.name}`, row.id);
  } else {
    await db.update(schema.brands).set(vals).where(eq(schema.brands.id, id));
    await audit(user.id, "update", "brand", `Updated manufacturer ${vals.name}`, id);
  }
  refresh();
  redirect("/admin/catalogue/brands?saved=");
}

// ---------- Families (machine types) ----------
export async function saveFamily(id: string, f: FormData) {
  const user = await editor("products");
  const name = s(f, "name");
  const path = id === "new" ? "/admin/catalogue" : `/admin/catalogue/types/${id}`;
  if (!name) fail(path, new Error("Give the machine type a name."));
  let imageId: string | undefined;
  try {
    imageId = await upload(f, "image");
  } catch (e) {
    fail(path, e);
  }
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
    ...(imageId ? { imageId } : on(f, "removeImage") ? { imageId: null } : {}),
  };
  if (id === "new") {
    const [row] = await db
      .insert(schema.families)
      .values({ ...vals, slug: await uniqueSlug("families", name) })
      .returning();
    await audit(user.id, "create", "family", `Added machine type ${name}`, row.id);
    refresh();
    redirect(`/admin/catalogue/types/${row.id}?saved=`);
  }
  await db.update(schema.families).set(vals).where(eq(schema.families.id, id));
  await audit(user.id, "update", "family", `Updated machine type ${name}`, id);
  refresh();
  redirect(`${path}?saved=`);
}

// ---------- Products (models) ----------
export async function saveProduct(id: string, f: FormData) {
  const user = await editor("products");
  const name = s(f, "name");
  const familyId = s(f, "familyId");
  const path = id === "new" ? `/admin/catalogue/types/${familyId}` : `/admin/catalogue/models/${id}`;
  if (!name) fail(path, new Error("Give the model a name."));

  const existing = id === "new" ? null : await db.query.products.findFirst({ where: eq(schema.products.id, id) });
  let images = existing?.imageIds ?? [];
  const remove = new Set(f.getAll("removeImage").map(String));
  images = images.filter((x) => !remove.has(x));
  let brochureId: string | null | undefined;
  try {
    for (const file of f.getAll("images")) {
      if (file instanceof File && file.size) {
        const r = await saveUpload(file, { allowed: IMAGE, alt: name });
        if (!r.ok) throw new Error(r.error);
        images.push(r.id);
      }
    }
    brochureId = await upload(f, "brochure");
  } catch (e) {
    fail(path, e);
  }
  if (on(f, "removeBrochure")) brochureId = null;

  const verified = on(f, "specsVerified");
  const vals = {
    name,
    summary: s(f, "summary"),
    highlights: fromLines(s(f, "highlights")),
    specs: fromSpecs(s(f, "specs")),
    specsVerified: verified,
    sources: fromLines(s(f, "sources")),
    imageIds: images,
    order: num(f, "order"),
    published: on(f, "published"),
    familyId,
    brandId: s(f, "brandId") || null,
    ...(brochureId !== undefined ? { brochureId } : {}),
  };
  if (id === "new") {
    const [row] = await db
      .insert(schema.products)
      .values({ ...vals, slug: await uniqueSlug("products", `${s(f, "brandSlug")} ${name}`) })
      .returning();
    await audit(user.id, "create", "product", `Added model ${name}`, row.id);
    refresh();
    redirect(`/admin/catalogue/models/${row.id}?saved=`);
  }
  await db.update(schema.products).set(vals).where(eq(schema.products.id, id));
  const note = existing && existing.specsVerified !== verified ? (verified ? " and marked specs as checked" : " and marked specs as unchecked") : "";
  await audit(user.id, "update", "product", `Updated model ${name}${note}`, id);
  refresh();
  redirect(`${path}?saved=`);
}

/** Models are hidden rather than deleted, so enquiries that mention them keep their link. */
export async function toggleProduct(id: string) {
  const user = await editor("products");
  const p = await db.query.products.findFirst({ where: eq(schema.products.id, id) });
  if (!p) redirect("/admin/catalogue");
  await db.update(schema.products).set({ published: !p!.published }).where(eq(schema.products.id, id));
  await audit(user.id, p!.published ? "hide" : "publish", "product", `${p!.published ? "Hid" : "Published"} model ${p!.name}`, id);
  refresh();
  redirect(`/admin/catalogue/types/${p!.familyId}?saved=`);
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
    await db.update(schema.services).set(vals).where(eq(schema.services.id, id));
    await audit(user.id, "update", "service", `Updated service ${name}`, id);
  }
  refresh();
  redirect("/admin/services?saved=");
}
