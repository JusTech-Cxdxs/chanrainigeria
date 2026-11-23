// First-run content: settings, head office, brands, catalogue and services from content/seed/*.json.
// Safe to re-run: existing rows (matched by slug) are left alone so staff edits are never overwritten.
// Pass --update to refresh catalogue text and specs from the JSON files (settings, branches and
// anything not in the files are still untouched).
import "./load-env";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import bcrypt from "bcryptjs";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import { SYSTEM_ROLES } from "../src/lib/permissions";

type SeedFile = {
  order?: number;
  category: { slug: string; name: string; tagline: string; intro: string; salesBlurb: string; serviceBlurb: string; partsBlurb: string };
  brand: { slug: string; name: string; website?: string; about: string; highlights: string[] };
  services: { slug: string; name: string; summary: string; includes: string[] }[];
  families: (Omit<typeof schema.families.$inferInsert, "categoryId" | "id"> & {
    models: { slug: string; name: string; summary: string; highlights: string[]; specs: Record<string, string | number>; specsVerified?: boolean; sizeClass?: string; sources: string[] }[];
  })[];
};

// How each line behaves on the site. Order follows the client's own list: CNG first.
// `prefix` keeps service addresses stable whatever the order; `brandOrder` is the order of the logos
// (SOPAN, Fornovo Gas, LiuGong, BYD).
const LINE: Record<string, { order: number; desk: string; illustration: string; prefix: string; brandOrder: number }> = {
  "cng-gas-equipment": { order: 1, desk: "cng", illustration: "compressor", prefix: "cng", brandOrder: 1 },
  "construction-equipment": { order: 2, desk: "sales", illustration: "excavator", prefix: "construction", brandOrder: 3 },
  "forklifts-material-handling": { order: 3, desk: "sales", illustration: "forklift", prefix: "forklift", brandOrder: 4 },
};

const update = process.argv.includes("--update");

async function main() {
  const url =
    process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    if (process.env.VERCEL_ENV === "preview") {
      console.warn("No database for this preview build. Skipping the seed.");
      return;
    }
    throw new Error("DATABASE_URL is not set. On Vercel: Storage > connect the Neon database to this environment, then redeploy.");
  }
  const pool = new Pool({ connectionString: url, ssl: /sslmode=require|supabase|neon\.tech/.test(url) ? { rejectUnauthorized: false } : undefined });
  const db = drizzle(pool, { schema });

  // Settings: created once; defaults fill anything missing at read time.
  const existing = await db.query.siteSettings.findFirst();
  if (!existing) {
    await db.insert(schema.siteSettings).values({ id: 1, data: {} });
    console.log("settings: created (defaults)");
  }

  // Head office from the business card.
  const anyBranch = await db.query.branches.findFirst();
  if (!anyBranch) {
    await db.insert(schema.branches).values({
      name: "Isolo",
      address: "122–132 Oshodi Apapa Expressway",
      city: "Isolo",
      state: "Lagos",
      isHeadOffice: true,
      order: 1,
    });
    console.log("branches: added Isolo");
  }

  const dir = join(process.cwd(), "content", "seed");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const seed = JSON.parse(readFileSync(join(dir, file), "utf8")) as SeedFile;
    const line = LINE[seed.category.slug] ?? { order: 9, desk: "sales", illustration: "excavator", prefix: seed.category.slug, brandOrder: 9 };

    // Brand
    let brand = await db.query.brands.findFirst({ where: eq(schema.brands.slug, seed.brand.slug) });
    const brandVals = { name: seed.brand.name, website: seed.brand.website ?? null, about: seed.brand.about, highlights: seed.brand.highlights ?? [], order: line.brandOrder };
    if (!brand) [brand] = await db.insert(schema.brands).values({ slug: seed.brand.slug, ...brandVals }).returning();
    else if (update) await db.update(schema.brands).set(brandVals).where(eq(schema.brands.id, brand.id));

    // Category
    let cat = await db.query.categories.findFirst({ where: eq(schema.categories.slug, seed.category.slug) });
    const c = seed.category;
    const catVals = {
      name: c.name,
      tagline: c.tagline,
      intro: c.intro,
      salesBlurb: c.salesBlurb,
      serviceBlurb: c.serviceBlurb,
      partsBlurb: c.partsBlurb,
      brandId: brand.id,
    };
    if (!cat)
      [cat] = await db
        .insert(schema.categories)
        .values({ slug: c.slug, ...catVals, desk: line.desk, illustration: line.illustration, order: line.order })
        .returning();
    else if (update) await db.update(schema.categories).set(catVals).where(eq(schema.categories.id, cat.id));

    // Services
    for (const [i, s] of seed.services.entries()) {
      const slug = `${line.prefix}-${s.slug}`;
      const vals = { name: s.name, summary: s.summary, includes: s.includes ?? [], order: i, categoryId: cat.id };
      const row = await db.query.services.findFirst({ where: eq(schema.services.slug, slug) });
      if (!row) await db.insert(schema.services).values({ slug, ...vals });
      else if (update) await db.update(schema.services).set(vals).where(eq(schema.services.id, row.id));
    }

    // Families and models
    let fCount = 0;
    let pCount = 0;
    for (const [i, f] of seed.families.entries()) {
      const { models, ...fam } = f;
      const vals = {
        name: fam.name,
        summary: fam.summary ?? "",
        howItWorks: fam.howItWorks ?? "",
        keyComponents: fam.keyComponents ?? [],
        applications: fam.applications ?? [],
        choosingTips: fam.choosingTips ?? [],
        maintenance: fam.maintenance ?? {},
        safety: fam.safety ?? [],
        specFields: fam.specFields ?? [],
        faq: fam.faq ?? [],
        order: i,
        categoryId: cat.id,
      };
      let row = await db.query.families.findFirst({ where: eq(schema.families.slug, fam.slug) });
      if (!row) {
        [row] = await db.insert(schema.families).values({ slug: fam.slug, ...vals }).returning();
        fCount++;
      } else if (update) await db.update(schema.families).set(vals).where(eq(schema.families.id, row.id));

      for (const [j, m] of models.entries()) {
        const mv = {
          name: m.name,
          summary: m.summary ?? "",
          sizeClass: m.sizeClass ?? "",
          highlights: m.highlights ?? [],
          specs: m.specs ?? {},
          sources: m.sources ?? [],
          order: j,
          familyId: row.id,
          brandId: brand.id,
        };
        const prod = await db.query.products.findFirst({ where: eq(schema.products.slug, m.slug) });
        // New models start unverified: staff confirm figures against the official sheet in the dashboard.
        if (!prod) {
          await db.insert(schema.products).values({ slug: m.slug, ...mv, specsVerified: m.specsVerified === true });
          pCount++;
        } else if (update) await db.update(schema.products).set(mv).where(eq(schema.products.id, prod.id));
      }
    }
    console.log(`${c.name}: ${fCount} new types, ${pCount} new models${update ? " (existing refreshed)" : ""}`);
  }

  // Brand partners with no product line file of their own (logo shipped in /public/brand/logos).
  // Fornovo Gas sits second, right after SOPAN: both are CNG partners and CNG leads the site.
  const partners = [
    {
      slug: "fornovogas",
      name: "Fornovo Gas",
      website: "https://www.fornovogas.it",
      about: "Fornovo Gas is an Italian natural gas compression specialist, founded in 1969 near Parma. It began by running natural gas refuelling stations, has moved natural gas by road in cylinder and tube trailers since 1985, and has built its own CNG and natural gas compressors since 2004. Its reciprocating compressors run CNG refuelling stations, biomethane plants and industrial gas services, with more than 3,500 units installed in more than 60 countries.",
      highlights: ["Founded in 1969 in Italy", "Moving natural gas by road in cylinder and tube trailers since 1985", "Own range of CNG and natural gas reciprocating compressors since 2004", "More than 3,500 compressors installed in more than 60 countries", "Quality and environmental management certified to ISO 9001 and ISO 14001"],
      order: 2,
      line: "cng-gas-equipment",
    },
  ];
  for (const { line, ...p } of partners) {
    let has = await db.query.brands.findFirst({ where: eq(schema.brands.slug, p.slug) });
    if (!has) {
      [has] = await db.insert(schema.brands).values({ ...p, relationship: "Brand partner" }).returning();
      console.log(`brands: added ${p.name}`);
    }
    // Show the partner beside the line's main brand, unless staff have already chosen the line's brands.
    const cat = await db.query.categories.findFirst({ where: eq(schema.categories.slug, line) });
    if (cat && !cat.moreBrandIds.length) {
      await db.update(schema.categories).set({ moreBrandIds: [has.id] }).where(eq(schema.categories.id, cat.id));
      console.log(`${cat.name}: ${p.name} added beside the main brand`);
    }
  }

  // The three manufacturers Chanrai represents are authorised dealerships. Fill the relationship only
  // where staff haven't set one, so re-running never overwrites their wording.
  const dealer = await db
    .update(schema.brands)
    .set({ relationship: "Authorised dealer" })
    .where(and(eq(schema.brands.relationship, ""), inArray(schema.brands.slug, ["liugong", "sopan", "byd"])))
    .returning({ name: schema.brands.name });
  if (dealer.length) console.log(`brands: relationship set for ${dealer.map((b) => b.name).join(", ")}`);

  // Example testimonials for the preview. They show an "Example" label on the site until the
  // company replaces them with real ones (Dashboard → Testimonials).
  const anyTestimonial = await db.query.testimonials.findFirst();
  if (!anyTestimonial) {
    const examples = [
      { name: "Site manager", company: "Road construction contractor, Ogun", rating: 5, quote: "The technician came to our site the day after we called, found the hydraulic fault and had the loader working again before evening. That is the kind of support we need." },
      { name: "Operations lead", company: "CNG station operator, Lagos", rating: 5, quote: "From the first site survey to commissioning, the team explained every step. Our booster compressor has run smoothly since handover." },
      { name: "Warehouse supervisor", company: "FMCG distributor, Lagos", rating: 4, quote: "Moving to electric forklifts cut our noise and fumes inside the warehouse. Planned maintenance visits are on time and well recorded." },
      { name: "Plant engineer", company: "Quarry operator, Abeokuta", rating: 5, quote: "Genuine parts arrived quickly and the advice on service intervals has already reduced our downtime." },
    ];
    await db.insert(schema.testimonials).values(examples.map((e, i) => ({ ...e, status: "APPROVED" as const, isExample: true, source: "staff", order: i })));
    console.log("testimonials: added 4 examples");
  }

  // Starter articles (practical guides, no company news is invented). Only when there are no posts yet.
  const anyPost = await db.query.posts.findFirst();
  if (!anyPost) {
    const newsDir = join(process.cwd(), "content", "news");
    const files = readdirSync(newsDir).filter((f) => f.endsWith(".md")).sort();
    for (const [i, file] of files.entries()) {
      const raw = readFileSync(join(newsDir, file), "utf8");
      const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!m) continue;
      const meta = Object.fromEntries(m[1].split("\n").map((l) => [l.slice(0, l.indexOf(":")).trim(), l.slice(l.indexOf(":") + 1).trim()]));
      await db.insert(schema.posts).values({
        slug: meta.slug,
        title: meta.title,
        category: meta.category || "News",
        excerpt: meta.excerpt ?? "",
        body: m[2].trim(),
        published: true,
        publishedAt: new Date(Date.now() - i * 86400_000),
      });
    }
    console.log(`news: added ${files.length} starter articles`);
  }

  // Built-in roles, and a role for anyone who signed up before roles existed.
  for (const [i, r] of SYSTEM_ROLES.entries()) {
    const existing = await db.query.roles.findFirst({ where: eq(schema.roles.name, r.name) });
    if (!existing) {
      await db.insert(schema.roles).values({ name: r.name, description: r.description, permissions: [...r.permissions], isSystem: true, order: i });
      console.log(`roles: added ${r.name}`);
    }
  }
  const allRoles = await db.query.roles.findMany();
  for (const r of SYSTEM_ROLES.filter((x) => x.legacy)) {
    const target = allRoles.find((x) => x.name === r.name);
    if (!target) continue;
    await db
      .update(schema.adminUsers)
      .set({ roleId: target.id })
      .where(and(isNull(schema.adminUsers.roleId), eq(schema.adminUsers.role, r.legacy as "ADMIN" | "EDITOR" | "COORDINATOR")));
  }

  // Optional first admin from the environment (otherwise use /admin/setup in the browser).
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const admin = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, email) });
    const weak = password.length < 10 || !/[a-zA-Z]/.test(password) || !/\d/.test(password) || /^(password|qwerty|123456|chanrai|admin)/i.test(password);
    if (!admin && weak) {
      console.warn("admin: ADMIN_PASSWORD is too weak (10+ characters, letters and numbers). Account not created.");
    } else if (!admin) {
      await db.insert(schema.adminUsers).values({ email, name: process.env.ADMIN_NAME || "Platform support", role: "MASTER", passwordHash: await bcrypt.hash(password, 12) });
      console.log(`admin: created ${email}`);
    }
  }

  await pool.end();
  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
