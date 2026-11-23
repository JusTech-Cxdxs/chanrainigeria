import Link from "next/link";
import { PageHead } from "@/components/site/PageHead";
import { pageMetadata, siteContent } from "@/components/site/site-content";
import { Icon } from "@/components/ui/Icon";
import { getCategories, getServices } from "@/lib/catalogue";

export const generateMetadata = () => pageMetadata("services");
export const dynamic = "force-dynamic";

export default async function Services() {
  const [c, nav, services, categories] = await Promise.all([siteContent("services"), siteContent("header"), getServices(), getCategories()]);
  const byCat = categories.map((cat) => ({ cat, list: services.filter((x) => x.category?.slug === cat.slug) })).filter((g) => g.list.length);
  const general = services.filter((x) => !x.category);

  return (
    <>
      <PageHead image={c.img("image")} crumbs={[{ href: "/", label: nav.t("crumbHome") }, { label: c.t("crumb") }]} title={c.t("title")} lead={c.t("lead")}>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={c.t("bookLink")} className="btn btn-primary">
            <Icon name="calendar" />
            {c.t("bookButton")}
          </Link>
          <Link href={c.t("partsLink")} className="btn btn-glass">
            <Icon name="package" />
            {c.t("partsButton")}
          </Link>
        </div>
      </PageHead>
      <div className="wrap space-y-16 py-14">
        {[...byCat, ...(general.length ? [{ cat: null, list: general }] : [])].map(({ cat, list }) => (
          <section key={cat?.id ?? "general"} className="reveal">
            <h2 className="heading border-b-2 border-ink pb-3 text-2xl">{cat ? cat.name : c.t("generalTitle")}</h2>
            <ul className="mt-6 grid gap-5 md:grid-cols-2">
              {list.map((x) => (
                <li key={x.id} className="card p-6">
                  <h3 className="heading flex items-center gap-3 text-lg">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/10 text-brand-ink">
                      <Icon name="tool" size={17} />
                    </span>
                    {x.name}
                  </h3>
                  <p className="mt-3 text-ink-soft">{x.summary}</p>
                  {x.includes.length ? (
                    <ul className="mt-3 space-y-1.5 text-[0.95rem]">
                      {x.includes.map((i) => (
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
            {cat ? (
              <Link href={`/request-service?category=${cat.slug}`} className="btn btn-outline mt-8">
                <Icon name="calendar" />
                {c.f("lineButton", { line: cat.name.toLowerCase() })}
              </Link>
            ) : null}
          </section>
        ))}
      </div>
    </>
  );
}
