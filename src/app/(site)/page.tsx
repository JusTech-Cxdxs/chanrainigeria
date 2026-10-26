import { inArray } from "drizzle-orm";
import Link from "next/link";
import { Leaf } from "@/components/brand/Leaf";
import { db, schema } from "@/db";
import { BrandsMarquee } from "@/components/site/BrandsMarquee";
import { brandLogo, logoAspect, logoScale } from "@/lib/brand-logos";
import { srcSetFor } from "@/lib/responsive-image";
import { Framed } from "@/components/site/FamilyPicture";
import { HeroSlider } from "@/components/site/HeroSlider";
import { TestimonialsMarquee } from "@/components/site/Testimonials";
import { Icon } from "@/components/ui/Icon";
import { getBrands, getCategories, getPosts, getTestimonials } from "@/lib/catalogue";
import { getContent } from "@/lib/content";
import { siteContent } from "@/components/site/site-content";
import { formatDate, telHref } from "@/lib/format";
import { getSettings, imageUrl, mediaUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Icons for the quick action cards, in order. */
const QUICK_ICONS = ["tool", "file", "package", "phone"];

export default async function Home() {
  const [s, c, categories, brands, posts, testimonials, tPage, newsPage] = await Promise.all([
    getSettings(),
    getContent("home"),
    getCategories(),
    getBrands(),
    getPosts(3),
    getTestimonials(),
    siteContent("testimonials"),
    siteContent("news"),
  ]);
  const slides = s.home.slides.map((sl) => ({ ...sl, image: imageUrl(s, sl.image) }));
  // Each logo's shape, so the brands band can size every logo before it has loaded (a band that
  // changes width while it moves is what makes it jump).
  const homeBrands = brands.filter((b) => b.showOnHome);
  const logoIds = homeBrands.map((b) => b.logoId).filter((x): x is string => !!x);
  const shapes = new Map<string, number>();
  if (logoIds.length) {
    const rows = await db
      .select({ id: schema.media.id, width: schema.media.width, height: schema.media.height })
      .from(schema.media)
      .where(inArray(schema.media.id, logoIds))
      .catch(() => []);
    for (const r of rows) if (r.width && r.height) shapes.set(r.id, r.width / r.height);
  }

  return (
    <>
      <HeroSlider slides={slides} eyebrow={s.company.groupLine} secondary={{ label: c.t("sliderSecondaryLabel"), href: c.t("sliderSecondaryLink") }} />

      {/* Quick actions, lifted over the bottom of the slider */}
      <section aria-label="Quick actions" className="relative z-10 -mt-10 sm:-mt-14">
        <div className="wrap">
          <ul className="grid gap-3 rounded-[22px] border border-line bg-surface p-3 shadow-[0_24px_60px_-30px_rgba(6,18,10,0.45)] sm:grid-cols-3">
            {c.list("quickActions").map((q, i) => (
              <li key={`${q.href}-${i}`}>
                <Link href={q.href} className="group flex items-center gap-4 rounded-2xl p-4 transition-colors hover:bg-concrete">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand text-on-brand transition-transform group-hover:scale-105">
                    <Icon name={QUICK_ICONS[i % QUICK_ICONS.length]} size={22} />
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
                {c.t("linesTitle")}
              </h2>
              <p className="mt-4 text-lg text-ink-soft">{c.t("linesText") || s.company.tagline}</p>
            </div>
            <Link href="/products" className="btn btn-outline">
              {c.t("linesButton")}
            </Link>
          </div>
          <ul className="mt-10 grid gap-5 lg:grid-cols-3">
            {categories.map((cat, k) => (
              <li key={cat.id} className="reveal" style={{ ["--i" as string]: k }}>
                <Link href={`/products/${cat.slug}`} className="group relative block h-[22rem] overflow-hidden rounded-[22px] bg-deep text-white sm:h-[26rem]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.imageId ? mediaUrl(cat.imageId)! : imageUrl(s, `category-${cat.slug}`)}
                    srcSet={srcSetFor(cat.imageId ? mediaUrl(cat.imageId) : imageUrl(s, `category-${cat.slug}`))}
                    sizes="(min-width: 1024px) 34vw, 100vw"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    // The supplied forklift picture keeps its BYD sign and tow tractor on the right; aim the card there.
                    style={!cat.imageId && cat.slug === "forklifts-material-handling" ? { objectPosition: "78% 50%" } : undefined}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-[#06120a]/95 via-[#06120a]/35 via-45% to-transparent" aria-hidden />
                  <span className="absolute inset-x-0 bottom-0 p-6">
                    {cat.brands.length ? <span className="text-sm font-semibold text-mint">{cat.brands.map((b) => b.name).join(" · ")}</span> : null}
                    <span className="heading mt-1 block text-2xl">{cat.name}</span>
                    <span className="mt-2 line-clamp-2 text-white/80">{cat.families.map((f) => f.name).join(", ")}</span>
                    <span className="mt-4 inline-flex items-center gap-2 font-semibold">
                      {c.t("linesCardLink")}
                      <Icon name="arrow" className="transition-transform group-hover:translate-x-1" />
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
              {c.t("matrixTitle")}
            </h2>
            <p className="mt-4 text-lg text-ink-soft">{c.t("matrixText")}</p>
          </div>
          <div className="reveal mt-10 overflow-hidden rounded-[22px] border border-line bg-surface">
            <div className="hidden grid-cols-[1.1fr_1fr_1fr_1fr] border-b border-line bg-concrete/60 text-sm font-semibold text-ink-soft md:grid">
              <div className="px-6 py-3" />
              <div className="px-6 py-3">{c.t("matrixSales")}</div>
              <div className="px-6 py-3">{c.t("matrixService")}</div>
              <div className="px-6 py-3">{c.t("matrixParts")}</div>
            </div>
            {categories.map((cat) => (
              <div key={cat.id} className="grid border-b border-line last:border-b-0 md:grid-cols-[1.1fr_1fr_1fr_1fr] md:divide-x md:divide-line-soft">
                <div className="px-6 pb-2 pt-6 md:py-6">
                  <Link href={`/products/${cat.slug}`} className="heading text-xl hover:text-brand-ink">
                    {cat.name}
                  </Link>
                  {cat.brands.length ? <p className="mt-1 text-sm text-ink-soft">{cat.brands.map((b) => b.name).join(" · ")}</p> : null}
                </div>
                {[
                  [c.t("matrixSales"), cat.salesBlurb, `/contact?type=QUOTE&category=${cat.slug}`, c.t("matrixSalesCta")],
                  [c.t("matrixService"), cat.serviceBlurb, `/book-service?category=${cat.slug}`, c.t("matrixServiceCta")],
                  [c.t("matrixParts"), cat.partsBlurb, `/parts?category=${cat.slug}`, c.t("matrixPartsCta")],
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
            <h2 className="heading text-3xl sm:text-5xl">{c.t("fieldTitle")}</h2>
            <p className="mt-5 max-w-[52ch] text-lg text-white/80">{c.t("fieldText")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/book-service" className="btn btn-primary">
                <Icon name="calendar" />
                {c.t("fieldButton")}
              </Link>
              {s.contact.phone ? (
                <a href={telHref(s.contact.phone)} className="btn btn-glass">
                  <Icon name="phone" />
                  {c.t("fieldCallPrefix")} {s.contact.phone}
                </a>
              ) : null}
            </div>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {c.list("fieldSteps").map(({ title: t, text: d }, i) => (
              <li key={`${t}-${i}`} className="reveal rounded-[20px] border border-white/10 bg-white/5 p-6 backdrop-blur" style={{ ["--i" as string]: i }}>
                <span className="num grid h-9 w-9 place-items-center rounded-full bg-mint text-sm font-bold text-deep">{i + 1}</span>
                <p className="heading mt-4 text-lg">{t}</p>
                <p className="mt-2 text-[0.95rem] text-white/70">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <BrandsMarquee
        title={c.t("brandsTitle")}
        brands={homeBrands.map((b) => {
          const aspect = logoAspect(b, b.logoId ? shapes.get(b.logoId) : undefined);
          return { name: b.name, logo: brandLogo(b), website: b.website, scale: logoScale(b, aspect), aspect };
        })}
      />

      {c.on("showTestimonials") && s.home.showTestimonials && testimonials.length ? (
        <section className="py-20 sm:py-24" aria-labelledby="t-h">
          <div className="wrap reveal mb-10 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h2 id="t-h" className="heading text-3xl sm:text-4xl">
                {c.t("testimonialsTitle")}
              </h2>
              <p className="mt-3 text-lg text-ink-soft">{c.t("testimonialsText")}</p>
            </div>
            <Link href="/testimonials#share" className="btn btn-outline">
              <Icon name="quote" />
              {c.t("testimonialsButton")}
            </Link>
          </div>
          <TestimonialsMarquee items={testimonials} exampleLabel={tPage.t("exampleBadge")} />
        </section>
      ) : null}

      {posts.length ? (
        <section className="wrap pb-20 sm:pb-24" aria-labelledby="news-h">
          <div className="reveal flex items-baseline justify-between gap-4">
            <h2 id="news-h" className="heading text-3xl">
              {c.t("newsTitle")}
            </h2>
            <Link href="/news" className="btn-quiet inline-flex items-center gap-1.5 font-semibold">
              {c.t("newsLink")}
              <Icon name="arrow" size={16} />
            </Link>
          </div>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {posts.map((p, k) => (
              <li key={p.id} className="reveal" style={{ ["--i" as string]: k }}>
                <Link href={`/news/${p.slug}`} className="card card-hover group block h-full overflow-hidden">
                  <Framed src={p.coverId ? mediaUrl(p.coverId) : newsPage.img("image")} ratio="aspect-[16/9]" className="!rounded-none" />
                  <span className="block p-5">
                    <span className="text-sm text-ink-soft">{formatDate(p.publishedAt)}</span>
                    <span className="heading mt-1 block text-xl group-hover:text-brand-ink">{p.title}</span>
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
            <h2 className="heading text-3xl sm:text-4xl">{c.t("ctaTitle")}</h2>
            <p className="mt-4 text-lg text-white/80">{c.t("ctaText")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={c.t("ctaButtonLink")} className="btn btn-primary">
                <Icon name="send" />
                {c.t("ctaButton")}
              </Link>
              {s.contact.email ? (
                <a href={`mailto:${s.contact.email}`} className="btn btn-glass">
                  <Icon name="mail" />
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
