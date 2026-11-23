import { asc, desc } from "drizzle-orm";
import Link from "next/link";
import { saveSlides } from "@/app/admin/actions/appearance";
import { GalleryCard, ImageCard } from "@/components/admin/ImageCards";
import { Section, SectionedPage, type SectionLink } from "@/components/admin/Sections";
import { SlidesEditor } from "@/components/admin/SlidesEditor";
import { AdminHead, Flash } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { db, schema } from "@/db";
import { has, requireAdmin } from "@/lib/auth";
import { brandLogo } from "@/lib/brand-logos";
import { bundledTypeImage } from "@/lib/type-images";
import { PAGES } from "@/lib/content-registry";
import { IMAGE_SLOTS } from "@/lib/image-slots";
import { getSettings, imageUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

const slotSize = (key: string) => IMAGE_SLOTS.find((s) => s.key === key)?.size;
const slotFile = (key: string) => {
  const s = IMAGE_SLOTS.find((x) => x.key === key);
  return s ? `/images/${s.file}` : undefined;
};

/** Every picture on the website in one place, grouped the way visitors meet them. Words live under Pages and text. */
export default async function Images({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const me = await requireAdmin(["pages", "products", "brands", "news", "settings"]);
  const sp = await searchParams;
  const s = await getSettings();
  const can = { pages: has(me, "pages"), products: has(me, "products"), brands: has(me, "brands"), news: has(me, "news"), settings: has(me, "settings") };

  const [pageRows, lines, brands, posts] = await Promise.all([
    can.pages ? db.query.pageContent.findMany() : [],
    can.products
      ? db.query.categories.findMany({
          orderBy: [asc(schema.categories.order)],
          with: { families: { orderBy: [asc(schema.families.order)], with: { products: { orderBy: [asc(schema.products.order)] } } } },
        })
      : [],
    can.brands ? db.query.brands.findMany({ orderBy: [asc(schema.brands.order), asc(schema.brands.name)] }) : [],
    can.news ? db.query.posts.findMany({ orderBy: [desc(schema.posts.publishedAt), desc(schema.posts.createdAt)], limit: 30 }) : [],
  ]);
  const stored = (page: string) => (pageRows.find((r) => r.page === page)?.data ?? {}) as Record<string, unknown>;
  const slotUrls = Object.fromEntries(IMAGE_SLOTS.map((x) => [x.key, imageUrl(s, x.key)]));

  // Page pictures from the content registry (banners, About picture, and so on).
  const pagePictures = PAGES.flatMap((p) =>
    p.sections.flatMap((sec) =>
      sec.fields
        .filter((f) => f.type === "image")
        .map((f) => ({ page: p, field: f, section: sec.label })),
    ),
  );

  const links: SectionLink[] = [
    ...(can.pages ? [{ id: "slides", label: "Home page slides", icon: "images" }, { id: "banners", label: "Page banners", icon: "pages" }] : []),
    ...(can.products ? lines.map((l) => ({ id: `line-${l.slug}`, label: l.name, icon: l.slug.includes("fork") ? "forklift" : l.slug.includes("cng") ? "fuel" : "hardhat" })) : []),
    ...(can.brands ? [{ id: "brands", label: "Brand logos", icon: "verified" }] : []),
    ...(can.news ? [{ id: "news", label: "Blog pictures", icon: "news" }] : []),
    ...(can.settings ? [{ id: "company", label: "Logo and icons", icon: "building" }] : []),
  ];

  return (
    <>
      <AdminHead
        title="Images"
        lead="Every picture on the website, in one place. Choose a picture from the library or upload a new one and it is saved straight away. The words on each page are under Pages and text. Every change is kept in History, so any picture can be put back."
        actions={
          <Link href="/admin/media" className="btn btn-outline">
            <Icon name="folder" size={17} /> Media library
          </Link>
        }
      />
      <Flash sp={sp} />
      <p className="mb-6 flex gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
        <Icon name="info" className="mt-0.5 shrink-0 text-brand" />
        Pictures are cropped to fill their frame and get the same green shade as the rest of the site, so any good photo will look right. Landscape photos at least 1600 pixels wide work best.
      </p>

      <SectionedPage links={links}>
        <div className="space-y-6">
          {can.pages ? (
            <>
              <Section id="slides" icon="images" title="Home page slides" lead="The large photos that rotate at the top of the home page, each with its headline and button. The first slide is the one most visitors see.">
                <SlidesEditor initial={s.home.slides} slotUrls={slotUrls} action={saveSlides} />
              </Section>

              <Section id="banners" icon="pages" title="Page banners and page pictures" lead="The wide photo at the top of each page, and other pictures that belong to a page.">
                <ul className="grid gap-4 md:grid-cols-2">
                  {pagePictures.map(({ page, field, section }) => {
                    const v = stored(page.key)[field.key];
                    return (
                      <ImageCard
                        key={`${page.key}.${field.key}`}
                        target={{ kind: "page", page: page.key, field: field.key }}
                        title={`${page.label}: ${field.label.toLowerCase()}`}
                        where={section}
                        size={slotSize(field.default)}
                        value={typeof v === "string" ? v : ""}
                        originalUrl={imageUrl(s, field.default)}
                        folder="Page banners"
                        href={page.path ?? undefined}
                      />
                    );
                  })}
                  <ImageCard
                    target={{ kind: "slot", key: "og-image" }}
                    title="Link preview"
                    where="Shown when the website is shared on WhatsApp, LinkedIn, Facebook and others"
                    size="1200 × 630"
                    value={s.images["og-image"] ?? ""}
                    originalUrl={slotFile("og-image")}
                    folder="Page banners"
                  />
                </ul>
              </Section>
            </>
          ) : null}

          {lines.map((line) => (
            <Section
              key={line.id}
              id={`line-${line.slug}`}
              icon={line.slug.includes("fork") ? "forklift" : line.slug.includes("cng") ? "fuel" : "hardhat"}
              title={line.name}
              lead="The product line's picture, each machine type's picture, and each model's photos. Machine types and models without a photo show a line drawing."
              aside={
                <Link href={`/admin/catalogue/lines/${line.id}`} className="btn btn-quiet !min-h-9 text-sm">
                  <Icon name="edit" size={15} /> Edit the words
                </Link>
              }
            >
              <ul className="grid gap-4 md:grid-cols-2">
                <ImageCard
                  target={{ kind: "category", id: line.id }}
                  title={`${line.name}: line picture`}
                  where="Banner on the line's page and its card on the home and products pages"
                  size={slotSize(`category-${line.slug}`)}
                  value={line.imageId ?? ""}
                  originalUrl={imageUrl(s, `category-${line.slug}`)}
                  folder="Products"
                  href={`/products/${line.slug}`}
                />
              </ul>
              {line.families.map((fam) => (
                <details key={fam.id} className="group mt-4 rounded-2xl border border-line-soft bg-concrete/40">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 p-3 sm:p-4">
                    <span className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-surface text-ink-soft">
                      {fam.imageId || bundledTypeImage(fam.slug) || fam.products.some((p) => p.imageIds.length) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={fam.imageId ? `/media/${fam.imageId}?w=480` : (bundledTypeImage(fam.slug) ?? `/media/${fam.products.find((p) => p.imageIds.length)!.imageIds[0]}?w=480`)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Icon name="image" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="heading block text-base">{fam.name}</span>
                      <span className="block text-sm text-ink-soft">
                        {fam.imageId ? "Own picture" : bundledTypeImage(fam.slug) ? "Supplied picture" : "Line drawing"} · {fam.products.length} model{fam.products.length === 1 ? "" : "s"},{" "}
                        {fam.products.filter((p) => p.imageIds.length).length} with photos
                      </span>
                    </span>
                    <Link href={`/admin/catalogue/types/${fam.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                      <Icon name="edit" size={14} /> Edit the words
                    </Link>
                    <Icon name="chevron-down" className="transition-transform group-open:rotate-180" />
                  </summary>
                  <ul className="grid gap-4 border-t border-line-soft p-3 sm:p-4 md:grid-cols-2">
                    <ImageCard
                      target={{ kind: "family", id: fam.id }}
                      title={`${fam.name}: main picture`}
                      where="Shown on the machine type's page and in product lists"
                      size="1600 × 1000"
                      value={fam.imageId ?? ""}
                      originalUrl={bundledTypeImage(fam.slug) ?? undefined}
                      folder="Products"
                      href={`/products/${line.slug}/${fam.slug}`}
                    />
                    {fam.products.map((p) => (
                      <GalleryCard
                        key={p.id}
                        productId={p.id}
                        title={p.name}
                        where="Model photos. The first is the main photo; use the arrows to change the order."
                        ids={p.imageIds}
                        href={`/products/${line.slug}/${fam.slug}/${p.slug}`}
                      />
                    ))}
                  </ul>
                </details>
              ))}
            </Section>
          ))}

          {can.brands ? (
            <Section
              id="brands"
              icon="verified"
              title="Brand logos"
              lead="Shown in the brands strip on the website and at the foot of every email. PNG or SVG with a see-through background looks best."
              aside={
                <Link href="/admin/catalogue/brands" className="btn btn-quiet !min-h-9 text-sm">
                  <Icon name="plus" size={15} /> Add a brand
                </Link>
              }
            >
              <ul className="grid gap-4 md:grid-cols-2">
                {brands.map((b) => (
                  <ImageCard
                    key={b.id}
                    target={{ kind: "brand", id: b.id }}
                    title={b.name}
                    where={b.relationship || "Brand"}
                    size="600 × 240"
                    value={b.logoId ?? ""}
                    originalUrl={brandLogo({ slug: b.slug }) ?? undefined}
                    folder="Brands and logos"
                  />
                ))}
              </ul>
            </Section>
          ) : null}

          {can.news ? (
            <Section id="news" icon="news" title="Blog pictures" lead="The cover picture of each blog post. Posts without one use the News banner.">
              {posts.length ? (
                <ul className="grid gap-4 md:grid-cols-2">
                  {posts.map((p) => (
                    <ImageCard
                      key={p.id}
                      target={{ kind: "post", id: p.id }}
                      title={p.title}
                      where={`${p.category}${p.published ? "" : " · not published"}`}
                      size="1600 × 900"
                      value={p.coverId ?? ""}
                      folder="News"
                      href={p.published ? `/news/${p.slug}` : undefined}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-ink-soft">No blog posts yet.</p>
              )}
            </Section>
          ) : null}

          {can.settings ? (
            <Section id="company" icon="building" title="Logo and icons" lead="The company logo in the header, footer, emails and dashboard, and the small icon in browser tabs.">
              <ul className="grid gap-4 md:grid-cols-2">
                <ImageCard
                  target={{ kind: "company", key: "logoId" }}
                  title="Company logo"
                  where="Header, emails and dashboard. Until one is uploaded, the Chanrai wordmark is used."
                  value={s.branding.logoId ?? ""}
                  folder="Brands and logos"
                />
                <ImageCard
                  target={{ kind: "company", key: "logoDarkId" }}
                  title="Logo for dark backgrounds"
                  where="Footer and dark mode. Optional: a white or light version of the logo."
                  value={s.branding.logoDarkId ?? ""}
                  folder="Brands and logos"
                />
                <ImageCard
                  target={{ kind: "company", key: "faviconId" }}
                  title="Browser tab icon"
                  where="The small square icon in browser tabs and bookmarks"
                  size="512 × 512"
                  value={s.branding.faviconId ?? ""}
                  folder="Brands and logos"
                />
              </ul>
            </Section>
          ) : null}
        </div>
      </SectionedPage>
    </>
  );
}
