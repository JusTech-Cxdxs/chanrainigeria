import Link from "next/link";
import { PageHead } from "@/components/site/PageHead";
import { pageMetadata, siteContent } from "@/components/site/site-content";
import { Icon } from "@/components/ui/Icon";
import { getBrands, getCategories } from "@/lib/catalogue";
import { renderMarkdown } from "@/lib/markdown";
import { srcSetFor } from "@/lib/responsive-image";

export const generateMetadata = () => pageMetadata("about");
export const dynamic = "force-dynamic";

const VALUE_ICONS = ["truck", "verified", "users", "tool", "shield", "clock"];

export default async function About() {
  const [c, nav, categories, brands] = await Promise.all([siteContent("about"), siteContent("header"), getCategories(), getBrands()]);
  const s = c.settings;
  const body = c.t("body");
  const stats = c.list("stats");
  const values = c.list("values");
  const safetyCommitments = c.list("safetyCommitments");
  const safetyRules = c.list("safetyRules");

  return (
    <>
      <PageHead crumbs={[{ href: "/", label: nav.t("crumbHome") }, { label: c.t("crumb") }]} title={c.t("title")} lead={c.t("lead") || s.company.tagline} image={c.img("image")} />

      {c.on("showStats") && stats.length ? (
        <section aria-label={c.t("crumb")} className="relative z-10 -mt-8 sm:-mt-10">
          <div className="wrap">
            <dl className="grid gap-px overflow-hidden rounded-[22px] border border-line bg-line shadow-[0_24px_60px_-30px_rgba(6,18,10,0.45)] sm:grid-cols-3">
              {stats.map((x, i) => (
                <div key={`${x.value}-${i}`} className="bg-surface p-6 sm:p-7">
                  <dt className="sr-only">{x.label}</dt>
                  <dd>
                    <span className="display block text-3xl text-brand-ink sm:text-4xl">{x.value}</span>
                    <span className="mt-2 block text-[0.95rem] text-ink-soft" aria-hidden>
                      {x.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ) : null}

      <div className="wrap grid gap-14 py-14 lg:grid-cols-[1.4fr_1fr]">
        <div className="reveal">
          {body ? (
            <div className="prose-site text-lg" dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} />
          ) : (
            <div className="prose-site text-lg">
              {s.company.about.split(/\n{2,}/).map((p) => (
                <p key={p}>{p}</p>
              ))}
              <p>{s.company.heritage}</p>
            </div>
          )}
          {s.company.groupUrl ? (
            <a href={s.company.groupUrl} target="_blank" rel="noopener" className="btn btn-outline mt-4">
              {c.t("groupLink")}
              <Icon name="external" size={16} />
            </a>
          ) : null}
          {c.on("showStoryPhotos") ? (
            <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:sticky lg:top-28">
              {["storyPhoto1", "storyPhoto2", "storyPhoto3"].map((key, i) => {
                const src = c.img(key);
                const cat = categories[i];
                if (!src) return null;
                const inner = (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      srcSet={srcSetFor(src)}
                      sizes={i === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                      alt={cat ? cat.name : ""}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    {cat ? (
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 text-[0.8rem] font-semibold leading-tight text-white sm:px-4 sm:pb-3 sm:text-sm">
                        {cat.name}
                      </span>
                    ) : null}
                  </>
                );
                const cls = `group relative block overflow-hidden rounded-[18px] bg-line ${i === 0 ? "col-span-2 aspect-[12/7]" : "aspect-[4/3]"}`;
                return cat ? (
                  <Link key={key} href={`/products/${cat.slug}`} className={cls}>
                    {inner}
                  </Link>
                ) : (
                  <div key={key} className={cls}>
                    {inner}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
        <aside className="space-y-8">
          <section className="card p-6">
            <h2 className="heading text-xl">{c.t("suppliesTitle")}</h2>
            <ul className="mt-3 divide-y divide-line-soft">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/products/${cat.slug}`} className="group flex items-center justify-between gap-3 py-3 hover:text-brand-ink">
                    <span className="font-semibold">{cat.name}</span>
                    <span className="flex items-center gap-2 text-sm text-ink-soft">
                      {cat.brands.map((b) => b.name).join(" · ")}
                      <Icon name="chevron-right" size={16} className="text-brand-ink transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          {brands.length ? (
            <section>
              <h2 className="heading text-xl">{c.t("makersTitle")}</h2>
              <ul className="mt-3 space-y-4">
                {brands.map((b) => (
                  <li key={b.id}>
                    <p className="font-semibold">{b.name}</p>
                    <p className="text-[0.95rem] text-ink-soft">{b.about}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>

      {c.on("showValues") && values.length ? (
        <section className="wrap pb-20 sm:pb-24" aria-labelledby="values-h">
          <div className="mesh relative overflow-hidden rounded-[28px] px-6 py-12 text-white sm:px-12 sm:py-16">
            <h2 id="values-h" className="heading reveal text-3xl sm:text-4xl">
              {c.t("valuesTitle")}
            </h2>
            <ul className="mt-10 grid gap-4 md:grid-cols-3">
              {values.map((v, i) => (
                <li key={`${v.title}-${i}`} className="reveal rounded-[20px] border border-white/10 bg-white/5 p-6 backdrop-blur" style={{ ["--i" as string]: i }}>
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mint text-deep">
                    <Icon name={VALUE_ICONS[i % VALUE_ICONS.length]} size={20} />
                  </span>
                  <p className="heading mt-4 text-lg">{v.title}</p>
                  <p className="mt-2 text-[0.95rem] text-white/75">{v.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {c.on("showSafety") ? (
        <section className="wrap pb-20 sm:pb-24" aria-labelledby="safety-h">
          <div className="overflow-hidden rounded-[28px] border border-line bg-surface">
            <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[0.9fr_1.4fr] lg:gap-14 lg:p-12">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-brand-ink">
                  <Icon name="shield" size={18} />
                  {c.t("safetyEyebrow")}
                </p>
                <h2 id="safety-h" className="heading reveal mt-3 text-3xl sm:text-4xl">
                  {c.t("safetyTitle")}
                </h2>
                {c.t("safetyLead") ? <p className="mt-4 text-ink-soft">{c.t("safetyLead")}</p> : null}
                {safetyCommitments.length ? (
                  <ul className="mt-8 grid gap-3">
                    {safetyCommitments.map((k, i) => (
                      <li key={`${k.text}-${i}`} className="flex items-center gap-3 rounded-2xl bg-brand/10 px-4 py-3 font-semibold text-ink">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-on-brand">
                          <Icon name="check" size={16} strokeWidth={3} />
                        </span>
                        {k.text}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {safetyRules.length ? (
                <div>
                  <p className="heading text-xl">{c.t("safetyRulesTitle")}</p>
                  <ul className="mt-5 grid gap-x-8 sm:grid-cols-2">
                    {safetyRules.map((r, i) => (
                      <li key={`${r.title}-${i}`} className="flex gap-3 border-b border-line-soft py-4">
                        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand-ink">
                          <Icon name="check-circle" size={16} />
                        </span>
                        <span>
                          <span className="block font-semibold text-ink">{r.title}</span>
                          {r.text ? <span className="block text-[0.95rem] text-ink-soft">{r.text}</span> : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            {c.t("safetyFooter") ? (
              <p className="bg-deep px-6 py-4 text-center font-semibold tracking-wide text-white sm:px-10">{c.t("safetyFooter")}</p>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}
