import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Machine, machineForSlug } from "@/components/Machine";
import { FamilyPicture } from "@/components/site/FamilyPicture";
import { PageHead } from "@/components/site/PageHead";
import { FilmCard } from "@/components/site/Showroom";
import { siteContent } from "@/components/site/site-content";
import { Icon } from "@/components/ui/Icon";
import { getCategory } from "@/lib/catalogue";
import { fileSize, officialLine } from "@/lib/official-media";
import { imageUrl, mediaUrl } from "@/lib/settings";
import { familyImage } from "@/lib/type-images";

type P = { params: Promise<{ category: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const c = await getCategory((await params).category);
  return c ? { title: c.name, description: c.tagline || c.intro.slice(0, 160) } : {};
}

export default async function CategoryPage({ params }: P) {
  const cat = await getCategory((await params).category);
  if (!cat) notFound();
  const [c, nav, prod] = await Promise.all([siteContent("product-line"), siteContent("header"), siteContent("products")]);

  const official = officialLine(cat.slug);

  const trio = [
    { icon: "file", title: c.t("salesTitle"), text: cat.salesBlurb, href: `/contact?type=QUOTE&category=${cat.slug}`, cta: c.t("salesLink") },
    { icon: "tool", title: c.t("serviceTitle"), text: cat.serviceBlurb, href: `/request-service?category=${cat.slug}`, cta: c.t("serviceLink") },
    { icon: "package", title: c.t("partsTitle"), text: cat.partsBlurb, href: `/parts?category=${cat.slug}`, cta: c.t("partsLink") },
  ];

  return (
    <>
      <PageHead
        crumbs={[{ href: "/", label: nav.t("crumbHome") }, { href: "/products", label: prod.t("crumb") }, { label: cat.name }]}
        title={cat.name}
        lead={cat.intro}
        image={cat.imageId ? mediaUrl(cat.imageId) : imageUrl(c.settings, `category-${cat.slug}`)}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/contact?type=QUOTE&category=${cat.slug}`} className="btn btn-primary">
            <Icon name="file" />
            {c.t("quoteButton")}
          </Link>
          <Link href={`/request-service?category=${cat.slug}`} className="btn btn-glass">
            <Icon name="calendar" />
            {c.t("bookButton")}
          </Link>
        </div>
      </PageHead>

      <div className="wrap py-14">
        <h2 className="heading text-2xl">{c.t("typesTitle")}</h2>
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {cat.families.map((f) => (
            <li key={f.id}>
              <Link href={`/products/${cat.slug}/${f.slug}`} className="group grid items-center gap-4 py-6 sm:grid-cols-[12rem_1fr_auto] sm:gap-8">
                <span className="block w-48">
                  <FamilyPicture src={familyImage(f)} alt={f.name} fallback={<Machine kind={f.illustration || machineForSlug(f.slug, cat.illustration)} className="w-full" />} />
                </span>
                <span>
                  <span className="heading block text-xl group-hover:text-brand-ink">{f.name}</span>
                  <span className="mt-1 block max-w-[60ch] text-ink-soft">{f.summary}</span>
                </span>
                <span className="num inline-flex items-center gap-2 text-sm text-ink-soft">
                  {f.products.length === 1 ? c.t("modelCountOne") : f.products.length ? c.f("modelCountMany", { n: f.products.length }) : c.t("noModels")}
                  <Icon name="arrow" size={16} className="text-brand-ink transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {trio.map((x) => (
            <div key={x.title} className="card flex flex-col p-6">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-on-brand">
                <Icon name={x.icon} size={20} />
              </span>
              <h2 className="heading mt-4 text-xl">{x.title}</h2>
              <p className="mt-2 flex-1 text-ink-soft">{x.text}</p>
              <Link href={x.href} className="btn-quiet mt-4 inline-flex items-center gap-1.5 self-start px-0 font-semibold">
                {x.cta}
                <Icon name="arrow" size={16} />
              </Link>
            </div>
          ))}
        </div>

        {cat.services.length ? (
          <section className="mt-16" aria-labelledby="svc-h">
            <h2 id="svc-h" className="heading text-2xl">
              {c.f("servicesTitle", { line: cat.name.toLowerCase() })}
            </h2>
            <ul className="mt-6 grid gap-6 md:grid-cols-2">
              {cat.services.map((s) => (
                <li key={s.id} className="card p-6">
                  <p className="heading text-lg">{s.name}</p>
                  <p className="mt-2 text-ink-soft">{s.summary}</p>
                  {s.includes.length ? (
                    <ul className="mt-3 space-y-1.5 text-[0.95rem]">
                      {s.includes.map((i) => (
                        <li key={i} className="flex gap-2">
                          <Icon name="check" size={16} className="mt-1 shrink-0 text-brand-ink" />
                          {i}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {official?.films.length ? (
          <section className="mt-16" aria-labelledby="films-h">
            <h2 id="films-h" className="heading text-2xl">
              {c.t("filmsTitle")}
            </h2>
            <div className={`mt-6 grid gap-6 ${official.films.length > 1 ? "md:grid-cols-2" : "max-w-3xl"}`}>
              {official.films.map((film) => (
                <FilmCard key={film.title} film={film} playLabel={c.t("filmPlay")} />
              ))}
            </div>
            {official.brochures?.length ? (
              <>
                <h3 className="heading mt-8 text-lg">{c.t("downloadsTitle")}</h3>
                <ul className="mt-3 flex flex-wrap gap-3">
                  {official.brochures.map((b) => (
                    <li key={b.href}>
                      <a href={b.href} target="_blank" rel="noopener" className="btn btn-outline">
                        <Icon name="download" />
                        {c.f("downloadItem", { label: b.label ?? "", size: fileSize(b.kb) })}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        ) : null}

        {cat.brands.length ? (
          <div className={`mt-16 grid gap-10 ${cat.brands.length > 1 ? "lg:grid-cols-2 lg:gap-14" : "max-w-3xl"}`}>
            {cat.brands.map((brand, i) => (
              <section key={brand.id} aria-labelledby={`brand-h-${i}`}>
                <h2 id={`brand-h-${i}`} className="heading text-2xl">
                  {c.f("brandTitle", { brand: brand.name })}
                </h2>
                <p className="mt-3 text-ink-soft">{brand.about}</p>
                {brand.highlights.length ? (
                  <ul className="mt-4 space-y-1.5">
                    {brand.highlights.map((h) => (
                      <li key={h} className="flex gap-2">
                        <Icon name="check" size={16} className="mt-1 shrink-0 text-brand-ink" />
                        {h}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {brand.website ? (
                  <a href={brand.website} target="_blank" rel="noopener" className="btn-quiet mt-4 inline-flex items-center gap-1.5 px-0 font-semibold">
                    {c.t("brandWebsite")}
                    <Icon name="external" size={16} />
                  </a>
                ) : null}
              </section>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
