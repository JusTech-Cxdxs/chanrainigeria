import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, schema } from "@/db";

const { categories, families, products, brands, services, branches, posts } = schema;

// Each query is cached and tagged so admin saves refresh the site immediately.
// Failures are caught OUTSIDE the cache, so a database outage is never remembered as "no products".
function cached<A extends unknown[], R>(name: string, tag: string, revalidate: number, fn: (...a: A) => Promise<R>, fallback: R) {
  const c = unstable_cache(fn, [name], { tags: [tag], revalidate });
  return async (...a: A): Promise<R> => {
    try {
      return await c(...a);
    } catch (e) {
      console.error(`[catalogue:${name}]`, e);
      return fallback;
    }
  };
}

async function loadCategories() {
  return db.query.categories.findMany({
    where: eq(categories.published, true),
    orderBy: [asc(categories.order), asc(categories.name)],
    with: {
      brand: true,
      families: {
        where: eq(families.published, true),
        orderBy: [asc(families.order), asc(families.name)],
        columns: { id: true, slug: true, name: true, summary: true, illustration: true, imageId: true },
      },
    },
  });
}
export type CategoryWithFamilies = Awaited<ReturnType<typeof loadCategories>>[number];

export const getCategories = cached("categories", "catalogue", 600, loadCategories, []);

export const getCategory = cached(
  "category",
  "catalogue",
  600,
  async (slug: string) =>
    (await db.query.categories.findFirst({
      where: and(eq(categories.slug, slug), eq(categories.published, true)),
      with: {
        brand: true,
        families: {
          where: eq(families.published, true),
          orderBy: [asc(families.order), asc(families.name)],
          with: {
            products: {
              where: eq(products.published, true),
              orderBy: [asc(products.order), asc(products.name)],
              columns: { id: true, slug: true, name: true, imageIds: true },
            },
          },
        },
        services: { where: eq(services.published, true), orderBy: [asc(services.order)] },
      },
    })) ?? null,
  null,
);

export const getFamily = cached(
  "family",
  "catalogue",
  600,
  async (slug: string) =>
    (await db.query.families.findFirst({
      where: and(eq(families.slug, slug), eq(families.published, true)),
      with: {
        category: { with: { brand: true } },
        products: {
          where: eq(products.published, true),
          orderBy: [asc(products.order), asc(products.name)],
          with: { brand: true },
        },
      },
    })) ?? null,
  null,
);

export const getProduct = cached(
  "product",
  "catalogue",
  600,
  async (slug: string) =>
    (await db.query.products.findFirst({
      where: and(eq(products.slug, slug), eq(products.published, true)),
      with: { brand: true, family: { with: { category: true } } },
    })) ?? null,
  null,
);

export const getBrands = cached("brands", "catalogue", 600, () => db.query.brands.findMany({ orderBy: [asc(brands.order), asc(brands.name)] }), []);

export const getServices = cached(
  "services",
  "catalogue",
  600,
  () =>
    db.query.services.findMany({
      where: eq(services.published, true),
      orderBy: [asc(services.order), asc(services.name)],
      with: { category: { columns: { slug: true, name: true } } },
    }),
  [],
);

export const getBranches = cached(
  "branches",
  "branches",
  600,
  () =>
    db.query.branches.findMany({
      where: eq(branches.active, true),
      orderBy: [desc(branches.isHeadOffice), asc(branches.order)],
    }),
  [],
);

export const getPosts = cached(
  "posts",
  "posts",
  300,
  (limit: number = 50) =>
    db.query.posts.findMany({
      where: eq(posts.published, true),
      orderBy: [desc(posts.publishedAt)],
      limit,
      columns: { body: false },
    }),
  [],
);

export const getPost = cached(
  "post",
  "posts",
  300,
  async (slug: string) => (await db.query.posts.findFirst({ where: and(eq(posts.slug, slug), eq(posts.published, true)) })) ?? null,
  null,
);

/** Products with family/category for pickers (enquiry forms, Enyo). */
export const getProductIndex = cached(
  "product-index",
  "catalogue",
  600,
  () =>
    db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        family: families.name,
        familySlug: families.slug,
        category: categories.name,
        categorySlug: categories.slug,
        desk: categories.desk,
        brand: brands.name,
      })
      .from(products)
      .innerJoin(families, eq(products.familyId, families.id))
      .innerJoin(categories, eq(families.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(and(eq(products.published, true), eq(families.published, true), eq(categories.published, true)))
      .orderBy(asc(categories.order), asc(families.order), asc(products.order)),
  [],
);

/** Approved testimonials, newest first (examples last). */
export const getTestimonials = cached(
  "testimonials",
  "testimonials",
  300,
  () =>
    db.query.testimonials.findMany({
      where: eq(schema.testimonials.status, "APPROVED"),
      orderBy: [asc(schema.testimonials.isExample), asc(schema.testimonials.order), desc(schema.testimonials.createdAt)],
      columns: { id: true, name: true, role: true, company: true, rating: true, quote: true, isExample: true },
      limit: 40,
    }),
  [],
);
