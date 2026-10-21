import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Machine, machineForSlug } from "@/components/Machine";
import { PageHead } from "@/components/site/PageHead";
import { getCategory } from "@/lib/catalogue";
import { plural } from "@/lib/format";
import { getSettings, imageUrl, mediaUrl } from "@/lib/settings";

type P = { params: Promise<{ category: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const c = await getCategory((await params).category);
  return c ? { title: c.name, description: c.tagline || c.intro.slice(0, 160) } : {};
}

export default async function CategoryPage({ params }: P) {
  const c = await getCategory((await params).category);
  if (!c) notFound();

  return (
    <>
      <PageHead
        crumbs={[{ href: "/", label: "Home" }, { href: "/products", label: "Products" }, { label: c.name }]}
        title={c.name}
        lead={c.intro}
        image={c.imageId ? mediaUrl(c.imageId) : imageUrl(await getSettings(), `category-${c.slug}`)}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/contact?type=QUOTE&category=${c.slug}`} className="btn btn-primary">
            Ask for a quote
          </Link>
          <Link href={`/book-service?category=${c.slug}`} className="btn btn-outline">
            Book a technician
          </Link>
        </div>
      </PageHead>

      <div className="wrap py-14">
        <h2 className="heading text-2xl">Machine types</h2>
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {c.families.map((f) => (
            <li key={f.id}>
              <Link
                href={`/products/${c.slug}/${f.slug}`}
                className="group grid items-center gap-4 py-6 sm:grid-cols-[12rem_1fr_auto] sm:gap-8"
              >
                {f.imageId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(f.imageId)!} alt="" className="aspect-[12/7] w-48 object-contain" />
                ) : (
                  <Machine kind={f.illustration || machineForSlug(f.slug, c.illustration)} className="w-48" />
                )}
                <span>
                  <span className="heading block text-xl group-hover:text-brand">{f.name}</span>
                  <span className="mt-1 block max-w-[60ch] text-ink-soft">{f.summary}</span>
                </span>
                <span className="text-sm text-ink-soft num">
                  {f.products.length ? plural(f.products.length, "model") : "Ask for models"}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {[
            ["Sales", c.salesBlurb, `/contact?type=QUOTE&category=${c.slug}`, "Ask for a quote"],
            ["On-site service", c.serviceBlurb, `/book-service?category=${c.slug}`, "Book a technician"],
            ["Parts", c.partsBlurb, `/parts?category=${c.slug}`, "Ask for parts"],
          ].map(([t, d, href, cta]) => (
            <div key={t} className="border-t-2 border-ink pt-4">
              <h2 className="heading text-xl">{t}</h2>
              <p className="mt-2 text-ink-soft">{d}</p>
              <Link href={href} className="btn-quiet mt-3 inline-block px-0 font-semibold">
                {cta}
              </Link>
            </div>
          ))}
        </div>

        {c.services.length ? (
          <section className="mt-16" aria-labelledby="svc-h">
            <h2 id="svc-h" className="heading text-2xl">
              Services for {c.name.toLowerCase()}
            </h2>
            <ul className="mt-6 grid gap-6 md:grid-cols-2">
              {c.services.map((s) => (
                <li key={s.id} className="rounded-lg border border-line bg-surface p-6">
                  <p className="heading text-lg">{s.name}</p>
                  <p className="mt-2 text-ink-soft">{s.summary}</p>
                  {s.includes.length ? (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-[0.95rem]">
                      {s.includes.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {c.brand ? (
          <section className="mt-16 max-w-3xl" aria-labelledby="brand-h">
            <h2 id="brand-h" className="heading text-2xl">
              About {c.brand.name}
            </h2>
            <p className="mt-3 text-ink-soft">{c.brand.about}</p>
            {c.brand.highlights.length ? (
              <ul className="mt-4 list-disc space-y-1 pl-5">
                {c.brand.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            ) : null}
            {c.brand.website ? (
              <a href={c.brand.website} target="_blank" rel="noopener" className="btn-quiet mt-3 inline-block px-0">
                Manufacturer&apos;s website
              </a>
            ) : null}
          </section>
        ) : null}
      </div>
    </>
  );
}
