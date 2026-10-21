import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";
import { getCategories, getPosts, getProductIndex } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [cats, products, posts] = await Promise.all([getCategories(), getProductIndex(), getPosts(200)]);
  const pages = ["", "/products", "/services", "/book-service", "/parts", "/news", "/testimonials", "/about", "/contact", "/privacy", "/cookies"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...cats.flatMap((c) => [
      { url: `${base}/products/${c.slug}`, priority: 0.8 },
      ...c.families.map((f) => ({ url: `${base}/products/${c.slug}/${f.slug}`, priority: 0.7 })),
    ]),
    ...products.map((p) => ({ url: `${base}/products/${p.categorySlug}/${p.familySlug}/${p.slug}`, priority: 0.6 })),
    ...posts.map((p) => ({ url: `${base}/news/${p.slug}`, lastModified: p.publishedAt ?? undefined, priority: 0.5 })),
  ];
}
