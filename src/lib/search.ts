import "server-only";
import { and, eq, ilike, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSettings } from "./settings";

export type SearchHit = { title: string; text?: string; href: string };
export type SearchGroup = { label: string; hits: SearchHit[] };

const PAGES: { title: string; href: string; words: string }[] = [
  { title: "Home", href: "/", words: "home start welcome" },
  { title: "Products", href: "/products", words: "products equipment machines range catalogue" },
  { title: "Services", href: "/services", words: "services maintenance repair field service support training installation" },
  { title: "Book a technician", href: "/book-service", words: "book technician service visit repair breakdown machine down site" },
  { title: "Parts", href: "/parts", words: "parts spares filters genuine order" },
  { title: "News", href: "/news", words: "news updates stories" },
  { title: "About us", href: "/about", words: "about company history group kewalram chanrai" },
  { title: "Contact", href: "/contact", words: "contact phone email address location call whatsapp quote" },
  { title: "Share your experience", href: "/testimonials#share", words: "review testimonial feedback rate experience" },
  { title: "Privacy notice", href: "/privacy", words: "privacy data protection ndpa" },
  { title: "Cookie notice", href: "/cookies", words: "cookies consent" },
];

/** Everything public that matches, grouped by kind. Published content only. */
export async function searchSite(raw: string): Promise<SearchGroup[]> {
  const q = raw.trim().slice(0, 80);
  if (q.length < 2) return [];
  const like = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
  const lower = q.toLowerCase();
  const { products, families, categories, services, posts, branches, brands } = schema;

  const [models, types, lines, svc, news, places, settings] = await Promise.all([
    db
      .select({ name: products.name, summary: products.summary, slug: products.slug, fam: families.slug, cat: categories.slug, brand: brands.name })
      .from(products)
      .innerJoin(families, eq(products.familyId, families.id))
      .innerJoin(categories, eq(families.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(and(eq(products.published, true), eq(families.published, true), or(ilike(products.name, like), ilike(products.summary, like), ilike(brands.name, like), ilike(families.name, like))))
      .limit(8),
    db
      .select({ name: families.name, summary: families.summary, slug: families.slug, cat: categories.slug })
      .from(families)
      .innerJoin(categories, eq(families.categoryId, categories.id))
      .where(and(eq(families.published, true), or(ilike(families.name, like), ilike(families.summary, like), ilike(families.howItWorks, like))))
      .limit(6),
    db.query.categories.findMany({
      where: and(eq(categories.published, true), or(ilike(categories.name, like), ilike(categories.intro, like))),
      columns: { name: true, tagline: true, slug: true },
      limit: 4,
    }),
    db.query.services.findMany({
      where: and(eq(services.published, true), or(ilike(services.name, like), ilike(services.summary, like))),
      columns: { name: true, summary: true },
      limit: 6,
    }),
    db.query.posts.findMany({
      where: and(eq(posts.published, true), or(ilike(posts.title, like), ilike(posts.excerpt, like))),
      columns: { title: true, excerpt: true, slug: true },
      limit: 5,
    }),
    db.query.branches.findMany({
      where: and(eq(branches.active, true), or(ilike(branches.name, like), ilike(branches.city, like), ilike(branches.state, like), ilike(branches.address, like))),
      limit: 4,
    }),
    getSettings(),
  ]);

  const contact: SearchHit[] = [];
  if (/(phone|call|number|tel|whatsapp|contact|reach|talk)/.test(lower) || q.replace(/\D/g, "").length >= 4) {
    if (settings.contact.phone) contact.push({ title: `Call ${settings.contact.phone}`, text: settings.contact.hours, href: `tel:${settings.contact.phone.replace(/\s/g, "")}` });
  }
  if (/(mail|email|contact|write)/.test(lower) && settings.contact.email) contact.push({ title: `Email ${settings.contact.email}`, href: `mailto:${settings.contact.email}` });
  if (/(address|where|location|office|isolo|lagos|find|visit|direction)/.test(lower) && settings.contact.address) contact.push({ title: settings.contact.address, text: "Our address", href: "/contact#branches" });

  const pages = PAGES.filter((p) => p.title.toLowerCase().includes(lower) || p.words.includes(lower)).slice(0, 5);

  const groups: SearchGroup[] = [
    { label: "Contact", hits: contact },
    { label: "Models", hits: models.map((m) => ({ title: [m.brand, m.name].filter(Boolean).join(" "), text: m.summary, href: `/products/${m.cat}/${m.fam}/${m.slug}` })) },
    { label: "Machine types", hits: types.map((t) => ({ title: t.name, text: t.summary, href: `/products/${t.cat}/${t.slug}` })) },
    { label: "Product lines", hits: lines.map((l) => ({ title: l.name, text: l.tagline, href: `/products/${l.slug}` })) },
    { label: "Services", hits: svc.map((s) => ({ title: s.name, text: s.summary, href: "/services" })) },
    { label: "News", hits: news.map((n) => ({ title: n.title, text: n.excerpt, href: `/news/${n.slug}` })) },
    { label: "Locations", hits: places.map((b) => ({ title: b.name, text: `${b.address}, ${b.city}, ${b.state}`, href: "/contact#branches" })) },
    { label: "Pages", hits: pages.map((p) => ({ title: p.title, href: p.href })) },
  ];
  return groups.filter((g) => g.hits.length);
}
