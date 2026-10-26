import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Machine, machineForSlug } from "@/components/Machine";
import { Framed } from "@/components/site/FamilyPicture";
import { PageHead } from "@/components/site/PageHead";
import { siteContent } from "@/components/site/site-content";
import { SpecTable } from "@/components/site/SpecTable";
import { Icon } from "@/components/ui/Icon";
import { getFamily, getProduct } from "@/lib/catalogue";
import { imageUrl, mediaUrl } from "@/lib/settings";
import { modelFallbackImage } from "@/lib/type-images";

type P = { params: Promise<{ category: string; family: string; product: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getProduct((await params).product);
  return p ? { title: [p.brand?.name, p.name].filter(Boolean).join(" "), description: p.summary } : {};
}

export default async function ProductPage({ params }: P) {
  const { category, family, product } = await params;
  const p = await getProduct(product);
  if (!p || p.family.slug !== family || p.family.category.slug !== category) notFound();
  const [f, L, nav, prod] = await Promise.all([getFamily(family), siteContent("model"), siteContent("header"), siteContent("products")]);
  const c = p.family.category;
  const title = [p.brand?.name, p.name].filter(Boolean).join(" ");
  const own = p.imageIds.map((id) => mediaUrl(id)!);
  const borrowed = own.length ? null : modelFallbackImage(p.family, p.slug);
  const [first, ...rest] = own.length ? own : borrowed ? [borrowed] : [];

  return (
    <>
      <PageHead
        crumbs={[
          { href: "/", label: nav.t("crumbHome") },
          { href: "/products", label: prod.t("crumb") },
          { href: `/products/${c.slug}`, label: c.name },
          { href: `/products/${c.slug}/${p.family.slug}`, label: p.family.name },
          { label: p.name },
        ]}
        title={title}
        lead={p.summary}
        image={imageUrl(L.settings, `category-${c.slug}`)}
      />
      <div className="wrap grid gap-12 py-14 lg:grid-cols-[1.2fr_1fr]">
        <div>
          {first ? (
            <div className="grid gap-3">
              <Framed src={first} alt={title} ratio="aspect-[4/3]" shade="soft" zoom={false} eager />
              {rest.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {rest.map((src) => (
                    <Framed key={src} src={src} alt={title} ratio="aspect-[4/3]" zoom={false} />
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <Machine kind={p.family.illustration || machineForSlug(p.family.slug, c.illustration)} className="w-full" />
          )}
          {p.highlights.length ? (
            <ul className="mt-8 space-y-3">
              {p.highlights.map((h) => (
                <li key={h} className="flex gap-3">
                  <Icon name="check" size={18} className="mt-0.5 shrink-0 text-brand-ink" />
                  {h}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div>
          <h2 className="heading text-2xl">{L.t("specsTitle")}</h2>
          <div className="mt-4">
            <SpecTable fields={f?.specFields ?? []} specs={p.specs} verified={p.specsVerified} empty={L.t("specsEmpty")} indicative={L.t("specsIndicative")} />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/contact?type=QUOTE&product=${p.slug}`} className="btn btn-primary">
              <Icon name="file" />
              {L.t("quoteButton")}
            </Link>
            <Link href={`/book-service?category=${c.slug}&machine=${encodeURIComponent(title)}`} className="btn btn-outline">
              <Icon name="calendar" />
              {L.t("bookButton")}
            </Link>
            {p.brochureId ? (
              <a href={mediaUrl(p.brochureId)!} className="btn btn-outline" target="_blank" rel="noopener">
                <Icon name="download" />
                {L.t("brochureButton")}
              </a>
            ) : null}
          </div>
          <p className="mt-8 text-ink-soft">
            {L.t("learnText")}{" "}
            <Link href={`/products/${c.slug}/${p.family.slug}#how`} className="font-semibold text-brand-ink underline underline-offset-2">
              {L.f("learnLink", { type: p.family.name.toLowerCase() })}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
