import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/site/PageHead";
import { getBrands, getCategories } from "@/lib/catalogue";
import { getSettings, imageUrl } from "@/lib/settings";

export const metadata: Metadata = { title: "About us" };
export const dynamic = "force-dynamic";

export default async function About() {
  const [s, categories, brands] = await Promise.all([getSettings(), getCategories(), getBrands()]);
  return (
    <>
      <PageHead crumbs={[{ href: "/", label: "Home" }, { label: "About" }]} title={`About ${s.company.shortName}`} lead={s.company.tagline} image={imageUrl(s, "page-about")} />
      <div className="wrap grid gap-14 py-14 lg:grid-cols-[1.4fr_1fr]">
        <div className="prose-site text-lg">
          {s.company.about.split(/\n{2,}/).map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p>{s.company.heritage}</p>
          {s.company.groupUrl ? (
            <p>
              <a href={s.company.groupUrl} target="_blank" rel="noopener">
                Visit the {s.company.groupName} website
              </a>
            </p>
          ) : null}
        </div>
        <aside className="space-y-8">
          <section>
            <h2 className="heading text-xl">What we supply</h2>
            <ul className="mt-3 divide-y divide-line-soft border-y border-line">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/products/${c.slug}`} className="flex justify-between gap-3 py-3 hover:text-brand">
                    <span className="font-semibold">{c.name}</span>
                    {c.brand ? <span className="text-ink-soft">{c.brand.name}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          {brands.length ? (
            <section>
              <h2 className="heading text-xl">Manufacturers</h2>
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
    </>
  );
}
