import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Machine, machineForSlug } from "@/components/Machine";
import { ModelStage } from "@/components/site/Showroom";
import { PageHead } from "@/components/site/PageHead";
import { siteContent } from "@/components/site/site-content";
import { SpecTable } from "@/components/site/SpecTable";
import { Icon } from "@/components/ui/Icon";
import { getFamily, getProduct } from "@/lib/catalogue";
import { fileSize, isStudio, officialModel } from "@/lib/official-media";
import { imageUrl, mediaUrl } from "@/lib/settings";
import { familyImage, modelPictures } from "@/lib/type-images";

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
  // Uploaded photos come first; the manufacturer's studio pictures and working photos follow.
  const official = officialModel(p.slug);
  const own = p.imageIds.map((id) => mediaUrl(id)!);
  const shipped = modelPictures(p.family, p.slug);
  // With uploads in place the type's borrowed picture is not needed.
  const borrowed = familyImage(p.family);
  const shots = [...own, ...(own.length ? shipped.filter((x) => x !== borrowed) : shipped)].map((src) => ({ src, studio: isStudio(src) }));
  const brochure = p.brochureId ? { href: mediaUrl(p.brochureId)!, size: null } : official?.brochure ? { href: official.brochure.href, size: fileSize(official.brochure.kb) } : null;
  const sheet = !p.brochureId && official?.brochure?.sheet ? official.brochure : null;
  const stage = { turn: L.t("stageTurn"), full: L.t("stageFull"), close: L.t("stageClose"), prev: L.t("stagePrev"), next: L.t("stageNext"), count: L.t("stageCount"), play: "" };

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
        image={official?.banner ?? imageUrl(L.settings, `category-${c.slug}`)}
      />
      <div className="wrap grid gap-12 py-14 lg:grid-cols-[1.2fr_1fr]">
        <div>
          {shots.length ? (
            <>
              <ModelStage shots={shots} alt={title} labels={stage} />
              {official ? <p className="mt-2 text-xs text-ink-soft">{L.f("creditText", { brand: official.brand })}</p> : null}
            </>
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
            {brochure ? (
              <a href={brochure.href} className="btn btn-outline" target="_blank" rel="noopener">
                <Icon name="download" />
                {L.t("brochureButton")}
                {brochure.size ? <span className="num text-xs font-normal text-ink-soft">PDF · {brochure.size}</span> : null}
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
      {sheet && official ? (
        <section className="wrap pb-16" aria-labelledby="sheet-h">
          <h2 id="sheet-h" className="heading text-2xl">
            {L.t("sheetTitle")}
          </h2>
          <p className="mt-2 text-ink-soft">{L.f("sheetText", { brand: official.brand })}</p>
          <a href={sheet.href} target="_blank" rel="noopener" className="group mt-5 block max-w-4xl overflow-hidden rounded-2xl bg-white ring-1 ring-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sheet.sheet}
              width={sheet.sheetSize?.[0]}
              height={sheet.sheetSize?.[1]}
              alt={`${title}: ${L.t("sheetTitle").toLowerCase()}`}
              loading="lazy"
              decoding="async"
              className="h-auto w-full"
            />
          </a>
          <a href={sheet.href} target="_blank" rel="noopener" className="btn btn-outline mt-5">
            <Icon name="download" />
            {L.f("sheetOpen", { size: fileSize(sheet.kb) })}
          </a>
        </section>
      ) : null}
    </>
  );
}
