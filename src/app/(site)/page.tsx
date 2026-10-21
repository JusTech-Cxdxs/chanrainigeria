import Link from "next/link";
import { Leaf } from "@/components/brand/Leaf";
import { BrandsMarquee } from "@/components/site/BrandsMarquee";
import { HeroSlider } from "@/components/site/HeroSlider";
import { TestimonialsMarquee } from "@/components/site/Testimonials";
import { getBrands, getCategories, getPosts, getTestimonials } from "@/lib/catalogue";
import { formatDate, telHref } from "@/lib/format";
import { getSettings, imageUrl, mediaUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

const QUICK = [
  { href: "/book-service", title: "Book a technician", text: "On-site service for a machine, station or fleet", d: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" },
  { href: "/contact?type=QUOTE", title: "Ask for a quote", text: "Tell us the job and we'll recommend a machine", d: "M9 12h6M9 16h6M9 8h2M6 3h9l4 4v14H6z" },
  { href: "/parts", title: "Order parts", text: "Genuine parts by serial or part number", d: "M21 8 12 3 3 8v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8" },
];

export default async function Home() {
  const [s, categories, brands, posts, testimonials] = await Promise.all([getSettings(), getCategories(), getBrands(), getPosts(3), getTestimonials()]);
  const slides = s.home.slides.map((sl) => ({ ...sl, image: imageUrl(s, sl.image) }));

  return (
    <>
      <HeroSlider slides={slides} eyebrow={s.company.groupLine} secondary={{ label: "Book a technician", href: "/book-service" }} />

      {/* Quick actions, lifted over the bottom of the slider */}
      <section aria-label="Quick actions" className="relative z-10 -mt-10 sm:-mt-14">
        <div className="wrap">
          <ul className="grid gap-3 rounded-[22px] border border-line bg-surface p-3 shadow-[0_24px_60px_-30px_rgba(6,18,10,0.45)] sm:grid-cols-3">
            {QUICK.map((q) => (
              <li key={q.href}>
                <Link href={q.href} className="group flex items-center gap-4 rounded-2xl p-4 transition-colors hover:bg-concrete">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand text-on-brand transition-transform group-hover:scale-105">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d={q.d} />
                    </svg>
                  </span>
                  <span>
                    <span className="block font-semibold">{q.title}</span>
                    <span className="block text-sm text-ink-soft">{q.text}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Product lines */}
      {categories.length ? (
        <section className="wrap py-20 sm:py-24" aria-labelledby="lines-h">
          <div className="reveal flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h2 id="lines-h" className="heading text-3xl sm:text-5xl">
                Three lines, one team
              </h2>
              <p className="mt-4 text-lg text-ink-soft">{s.company.tagline}</p>
            </div>
            <Link href="/products" className="btn btn-outline">
              All products
            </Link>
          </div>
          <ul className="mt-10 grid gap-5 lg:grid-cols-3">
            {categories.map((c, k) => (
              <li key={c.id} className="reveal" style={{ ["--i" as string]: k }}>
                <Link href={`/products/${c.slug}`} className="group relative block h-[26rem] overflow-hidden rounded-[22px] bg-deep text-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.imageId ? mediaUrl(c.imageId)! : imageUrl(s, `category-${c.slug}`)}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-[#06120a] via-[#06120a]/45 to-transparent" aria-hidden />
                  <span className="absolute inset-x-0 bottom-0 p-6">
                    {c.brand ? <span className="text-sm font-semibold text-mint">{c.brand.name}</span> : null}
                    <span className="heading mt-1 block text-2xl">{c.name}</span>
                    <span className="mt-2 line-clamp-2 text-white/80">{c.families.map((f) => f.name).join(", ")}</span>
                    <span className="mt-4 inline-flex items-center gap-2 font-semibold">
                      Explore the range
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="transition-transform group-hover:translate-x-1" aria-hidden>
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* The client's own model: every line gets sales, on-site service and parts */}
      {categories.length ? (
        <section className="wrap pb-20 sm:pb-24" aria-labelledby="matrix-h">
          <div className="reveal max-w-3xl">
            <h2 id="matrix-h" className="heading text-3xl sm:text-4xl">
              One team for the whole life of the machine
            </h2>
            <p className="mt-4 text-lg text-ink-soft">Each line comes with the same three things: the right machine, a technician who comes to it, and the parts to keep it running.</p>
          </div>
          <div className="reveal mt-10 overflow-hidden rounded-[22px] border border-line bg-surface">
            <div className="hidden grid-cols-[1.1fr_1fr_1fr_1fr] border-b border-line bg-concrete/60 text-sm font-semibold text-ink-soft md:grid">
              <div className="px-6 py-3" />
              <div className="px-6 py-3">Sales</div>
              <div className="px-6 py-3">On-site service</div>
              <div className="px-6 py-3">Parts</div>
            </div>
            {categories.map((c) => (
              <div key={c.id} className="grid border-b border-line last:border-b-0 md:grid-cols-[1.1fr_1fr_1fr_1fr] md:divide-x md:divide-line-soft">
                <div className="px-6 pb-2 pt-6 md:py-6">
                  <Link href={`/products/${c.slug}`} className="heading text-xl hover:text-brand">
                    {c.name}
                  </Link>
                  {c.brand ? <p className="mt-1 text-sm text-ink-soft">{c.brand.name}</p> : null}
                </div>
                {[
                  ["Sales", c.salesBlurb, `/contact?type=QUOTE&category=${c.slug}`, "Ask for a quote"],
                  ["On-site service", c.serviceBlurb, `/book-service?category=${c.slug}`, "Book a visit"],
                  ["Parts", c.partsBlurb, `/parts?category=${c.slug}`, "Ask for parts"],
                ].map(([label, text, href, cta]) => (
                  <div key={label} className="px-6 py-3 md:py-6">
                    <p className="text-sm font-semibold text-ink-soft md:hidden">{label}</p>
                    <p className="line-clamp-5 text-[0.95rem]">{text}</p>
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

      {/* Field service */}
      <section className="ambient overflow-hidden bg-deep text-white">
        <div className="wrap grid gap-12 py-20 sm:py-24 lg:grid-cols-[1fr_1.15fr] lg:items-center">
          <div className="reveal">
            <h2 className="heading text-3xl sm:text-5xl">{s.home.fieldServiceTitle}</h2>
            <p className="mt-5 max-w-[52ch] text-lg text-white/80">{s.home.fieldServiceText}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/book-service" className="btn btn-primary">
                Book a technician
              </Link>
              {s.contact.phone ? (
                <a href={telHref(s.contact.phone)} className="btn btn-glass">
                  Call {s.contact.phone}
                </a>
              ) : null}
            </div>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {[
              ["Tell us about the machine", "Model, serial number, hour meter reading, what's wrong and where it is."],
              ["We confirm the visit", "The service desk calls back to agree a time and what to bring."],
              ["A technician comes to site", "Diagnosis and repair at the machine, with genuine parts."],
              ["You get a service record", "What was found, what was done and when the next service is due."],
            ].map(([t, d], i) => (
              <li key={t} className="reveal rounded-[20px] border border-white/10 bg-white/5 p-6 backdrop-blur" style={{ ["--i" as string]: i }}>
                <span className="num grid h-9 w-9 place-items-center rounded-full bg-mint text-sm font-bold text-deep">{i + 1}</span>
                <p className="heading mt-4 text-lg">{t}</p>
                <p className="mt-2 text-[0.95rem] text-white/70">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <BrandsMarquee
        title="Equipment we supply"
        brands={brands.filter((b) => b.showOnHome).map((b) => ({ name: b.name, logo: mediaUrl(b.logoId), website: b.website }))}
      />

      {s.home.showTestimonials && testimonials.length ? (
        <section className="py-20 sm:py-24" aria-labelledby="t-h">
          <div className="wrap reveal mb-10 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h2 id="t-h" className="heading text-3xl sm:text-4xl">
                What customers say
              </h2>
              <p className="mt-3 text-lg text-ink-soft">Checked by our team before they appear here.</p>
            </div>
            <Link href="/testimonials#share" className="btn btn-outline">
              Share your experience
            </Link>
          </div>
          <TestimonialsMarquee items={testimonials} />
        </section>
      ) : null}

      {posts.length ? (
        <section className="wrap pb-20 sm:pb-24" aria-labelledby="news-h">
          <div className="reveal flex items-baseline justify-between gap-4">
            <h2 id="news-h" className="heading text-3xl">
              News
            </h2>
            <Link href="/news" className="btn-quiet font-semibold">
              All news
            </Link>
          </div>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {posts.map((p, k) => (
              <li key={p.id} className="reveal" style={{ ["--i" as string]: k }}>
                <Link href={`/news/${p.slug}`} className="card card-hover group block h-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.coverId ? mediaUrl(p.coverId)! : imageUrl(s, "page-news")} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />
                  <span className="block p-5">
                    <span className="text-sm text-ink-soft">{formatDate(p.publishedAt)}</span>
                    <span className="heading mt-1 block text-xl group-hover:text-brand">{p.title}</span>
                    <span className="mt-2 line-clamp-3 text-ink-soft">{p.excerpt}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Closing call to action */}
      <section className="wrap pb-20 sm:pb-24">
        <div className="reveal mesh relative overflow-hidden rounded-[28px] px-6 py-12 text-white sm:px-12 sm:py-16">
          <Leaf className="pointer-events-none absolute -right-10 -top-6 h-72 w-auto opacity-15" color="#ffffff" />
          <div className="relative max-w-2xl">
            <h2 className="heading text-3xl sm:text-4xl">Tell us about the job</h2>
            <p className="mt-4 text-lg text-white/80">
              A machine to buy, a station to build, a fleet to keep running. Send the details and the right desk gets straight back to you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="btn btn-primary">
                Contact us
              </Link>
              {s.contact.email ? (
                <a href={`mailto:${s.contact.email}`} className="btn btn-glass">
                  {s.contact.email}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
