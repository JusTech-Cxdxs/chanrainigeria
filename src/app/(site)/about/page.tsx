import Link from "next/link";
import { PageHead } from "@/components/site/PageHead";
import { pageMetadata, siteContent } from "@/components/site/site-content";
import { Icon } from "@/components/ui/Icon";
import { getBrands, getCategories } from "@/lib/catalogue";
import { renderMarkdown } from "@/lib/markdown";

export const generateMetadata = () => pageMetadata("about");
export const dynamic = "force-dynamic";

const VALUE_ICONS = ["truck", "verified", "users", "tool", "shield", "clock"];

export default async function About() {
  const [c, nav, categories, brands] = await Promise.all([siteContent("about"), siteContent("header"), getCategories(), getBrands()]);
  const s = c.settings;
  const body = c.t("body");
  const stats = c.list("stats");
  const values = c.list("values");

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
                      {cat.brand ? cat.brand.name : null}
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
    </>
  );
}
