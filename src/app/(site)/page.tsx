import Link from "next/link";
import { Machine } from "@/components/Machine";
import { getBrands, getCategories, getPosts } from "@/lib/catalogue";
import { formatDate } from "@/lib/format";
import { getSettings, mediaUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [s, categories, brands, posts] = await Promise.all([getSettings(), getCategories(), getBrands(), getPosts(3)]);
  const lineup = categories.slice(0, 3);
  const shownBrands = brands.filter((b) => b.showOnHome);

  return (
    <>
      {/* Hero: the three divisions standing on one ground line, drawn as an elevation. */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="wrap pt-14 sm:pt-20">
          <h1 className="display max-w-[18ch] text-[2.4rem] sm:text-6xl lg:text-7xl">{s.home.heroTitle}</h1>
          <p className="mt-6 max-w-[56ch] text-lg text-ink-soft sm:text-xl">{s.home.heroText}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/products" className="btn btn-primary">
              Browse equipment
            </Link>
            <Link href="/book-service" className="btn btn-outline">
              Book a technician
            </Link>
          </div>
        </div>

        {lineup.length ? (
          <div className="wrap mt-12">
            <ul className="draw-in grid grid-cols-1 gap-x-10 gap-y-2 sm:grid-cols-3">
              {lineup.map((c, i) => (
                <li key={c.id} className={i === 1 ? "delay-1" : i === 2 ? "delay-2" : undefined}>
                  <Link href={`/products/${c.slug}`} className="group block">
                    {c.imageId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(c.imageId)!}
                        alt={c.name}
                        className="aspect-[12/7] w-full object-contain"
                      />
                    ) : (
                      <Machine kind={c.illustration} className="w-full" dimensions={false} />
                    )}
                    <span className="flex items-baseline justify-between gap-3 border-t-2 border-ink py-3">
                      <span className="heading text-lg group-hover:text-brand">{c.name}</span>
                      {c.brand ? <span className="text-sm text-ink-soft">{c.brand.name}</span> : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* The client's own model: every category gets sales, on-site service and parts. */}
      {categories.length ? (
        <section className="wrap py-20" aria-labelledby="matrix-h">
          <div className="max-w-3xl">
            <h2 id="matrix-h" className="heading text-3xl sm:text-4xl">
              One team for the whole life of the machine
            </h2>
            <p className="mt-4 text-lg text-ink-soft">
              Each line we carry comes with the same three things: the right machine, a technician who comes to it,
              and the parts to keep it running.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-lg border border-line bg-surface">
            <div className="hidden grid-cols-[1.1fr_1fr_1fr_1fr] border-b border-line bg-concrete/60 text-sm font-semibold text-ink-soft md:grid">
              <div className="px-5 py-3" />
              <div className="px-5 py-3">Sales</div>
              <div className="px-5 py-3">On-site service</div>
              <div className="px-5 py-3">Parts</div>
            </div>
            {categories.map((c) => (
              <div
                key={c.id}
                className="grid border-b border-line last:border-b-0 md:grid-cols-[1.1fr_1fr_1fr_1fr] md:divide-x md:divide-line-soft"
              >
                <div className="px-5 pb-2 pt-5 md:py-5">
                  <Link href={`/products/${c.slug}`} className="heading text-xl hover:text-brand">
                    {c.name}
                  </Link>
                  <p className="mt-1 text-sm text-ink-soft">{c.families.map((f) => f.name).join(", ")}</p>
                </div>
                {[
                  ["Sales", c.salesBlurb, `/products/${c.slug}`, "See the range"],
                  ["On-site service", c.serviceBlurb, `/book-service?category=${c.slug}`, "Book a visit"],
                  ["Parts", c.partsBlurb, `/parts?category=${c.slug}`, "Ask for parts"],
                ].map(([label, text, href, cta]) => (
                  <div key={label} className="px-5 py-3 md:py-5">
                    <p className="text-sm font-semibold text-ink-soft md:hidden">{label}</p>
                    <p className="text-[0.95rem]">{text}</p>
                    <Link href={href} className="btn-quiet mt-2 inline-block px-0 font-semibold">
                      {cta}
                    </Link>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Field service: the real difference from a workshop business. */}
      <section className="border-y border-line bg-surface">
        <div className="wrap grid gap-10 py-20 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <h2 className="heading text-3xl sm:text-4xl">{s.home.fieldServiceTitle}</h2>
            <p className="mt-4 text-lg text-ink-soft measure">{s.home.fieldServiceText}</p>
            <Link href="/book-service" className="btn btn-primary mt-8">
              Book a technician
            </Link>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
            {[
              ["Tell us about the machine", "Model, serial number, hour meter reading, what's wrong and where it is."],
              ["We confirm the visit", "The service desk calls back to agree a time and what to bring."],
              ["A technician comes to site", "Diagnosis and repair at the machine, with genuine parts."],
              ["You get a service record", "What was found, what was done and when the next service is due."],
            ].map(([t, d], i) => (
              <li key={t} className="bg-surface p-6">
                <span className="num text-sm font-semibold text-brand">Step {i + 1}</span>
                <p className="heading mt-1 text-lg">{t}</p>
                <p className="mt-2 text-[0.95rem] text-ink-soft">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {shownBrands.length ? (
        <section className="wrap py-20" aria-labelledby="brands-h">
          <h2 id="brands-h" className="heading text-3xl">
            Equipment we supply
          </h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {shownBrands.map((b) => (
              <li key={b.id} className="border-t-2 border-ink pt-4">
                {b.logoId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(b.logoId)!} alt={b.name} className="h-10 w-auto" />
                ) : (
                  <p className="display text-2xl">{b.name}</p>
                )}
                <p className="mt-3 line-clamp-4 text-[0.95rem] text-ink-soft">{b.about}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {posts.length ? (
        <section className="wrap pb-4" aria-labelledby="news-h">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="news-h" className="heading text-3xl">
              News
            </h2>
            <Link href="/news" className="btn-quiet font-semibold">
              All news
            </Link>
          </div>
          <ul className="mt-6 grid gap-8 md:grid-cols-3">
            {posts.map((p) => (
              <li key={p.id}>
                <Link href={`/news/${p.slug}`} className="group block">
                  <p className="text-sm text-ink-soft">{formatDate(p.publishedAt)}</p>
                  <p className="heading mt-1 text-xl group-hover:text-brand">{p.title}</p>
                  <p className="mt-2 text-ink-soft">{p.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
