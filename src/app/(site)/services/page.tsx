import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/site/PageHead";
import { getCategories, getServices } from "@/lib/catalogue";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Services",
  description: "On-site field service, maintenance contracts, CNG station installation, parts and training.",
};
export const dynamic = "force-dynamic";

export default async function Services() {
  const [s, services, categories] = await Promise.all([getSettings(), getServices(), getCategories()]);
  const byCat = categories
    .map((c) => ({ c, list: services.filter((x) => x.category?.slug === c.slug) }))
    .filter((g) => g.list.length);
  const general = services.filter((x) => !x.category);

  return (
    <>
      <PageHead
        crumbs={[{ href: "/", label: "Home" }, { label: "Services" }]}
        title={s.home.fieldServiceTitle}
        lead={s.home.fieldServiceText}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/book-service" className="btn btn-primary">
            Book a technician
          </Link>
          <Link href="/parts" className="btn btn-outline">
            Ask for parts
          </Link>
        </div>
      </PageHead>
      <div className="wrap space-y-16 py-14">
        {[...byCat, ...(general.length ? [{ c: null, list: general }] : [])].map(({ c, list }) => (
          <section key={c?.id ?? "general"}>
            <h2 className="heading border-b-2 border-ink pb-3 text-2xl">{c ? c.name : "For every line"}</h2>
            <ul className="mt-6 grid gap-x-10 gap-y-8 md:grid-cols-2">
              {list.map((x) => (
                <li key={x.id}>
                  <h3 className="heading text-lg">{x.name}</h3>
                  <p className="mt-2 text-ink-soft">{x.summary}</p>
                  {x.includes.length ? (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-[0.95rem]">
                      {x.includes.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
            {c ? (
              <Link href={`/book-service?category=${c.slug}`} className="btn btn-outline mt-8">
                Book a {c.name.toLowerCase()} technician
              </Link>
            ) : null}
          </section>
        ))}
      </div>
    </>
  );
}
