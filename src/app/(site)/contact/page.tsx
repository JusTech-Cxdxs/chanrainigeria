import { EnquiryForm } from "@/components/site/EnquiryForm";
import { PageHead } from "@/components/site/PageHead";
import { pageMetadata, siteContent } from "@/components/site/site-content";
import { Icon } from "@/components/ui/Icon";
import { getBranches, getCategories, getProductIndex } from "@/lib/catalogue";
import { telHref, waHref } from "@/lib/format";

export const generateMetadata = () => pageMetadata("contact");
export const dynamic = "force-dynamic";

type P = { searchParams: Promise<Record<string, string | undefined>> };

export default async function Contact({ searchParams }: P) {
  const q = await searchParams;
  const [c, forms, nav, products, branches, lines] = await Promise.all([siteContent("contact"), siteContent("forms"), siteContent("header"), getProductIndex(), getBranches(), getCategories()]);
  const types = lines.flatMap((l) => l.families.map((f) => ({ slug: f.slug, name: f.name, line: l.name, lineSlug: l.slug })));
  const s = c.settings;
  const desks = Object.entries(s.desks).filter(([, d]) => d.email || d.phone || d.whatsapp);
  // Presets from links such as "Ask for a quote" on a model page. Without them nothing is chosen.
  const type = q.type === "QUOTE" || q.type === "CALLBACK" || q.type === "GENERAL" ? q.type : q.product ? "QUOTE" : undefined;

  return (
    <>
      <PageHead image={c.img("image")} crumbs={[{ href: "/", label: nav.t("crumbHome") }, { label: c.t("crumb") }]} title={c.t("title")} lead={c.t("lead")} />
      <div className="wrap grid gap-14 py-14 lg:grid-cols-[1.5fr_1fr]">
        <EnquiryForm mode="contact" labels={forms.labels()} products={products} types={types} defaults={{ type, product: q.product, category: q.category }} />
        <aside className="space-y-10">
          {desks.length ? (
            <section aria-labelledby="desks-h">
              <h2 id="desks-h" className="heading text-xl">
                {c.t("desksTitle")}
              </h2>
              <ul className="mt-4 grid gap-3">
                {desks.map(([k, d]) => (
                  <li key={k} className="card p-5">
                    <p className="font-semibold">{d.label}</p>
                    <ul className="mt-2 space-y-1.5 text-[0.95rem]">
                      {d.phone ? (
                        <li>
                          <a className="inline-flex items-center gap-2.5 hover:text-brand-ink" href={telHref(d.phone)}>
                            <Icon name="phone" size={16} className="shrink-0 text-brand-ink" />
                            <span className="num">{d.phone}</span>
                          </a>
                        </li>
                      ) : null}
                      {d.email ? (
                        <li>
                          <a className="inline-flex items-center gap-2.5 break-all hover:text-brand-ink" href={`mailto:${d.email}`}>
                            <Icon name="mail" size={16} className="shrink-0 text-brand-ink" />
                            {d.email}
                          </a>
                        </li>
                      ) : null}
                      {d.whatsapp ? (
                        <li>
                          <a className="inline-flex items-center gap-2.5 hover:text-brand-ink" href={waHref(d.whatsapp)} target="_blank" rel="noopener">
                            <Icon name="whatsapp" size={16} className="shrink-0 text-brand-ink" />
                            {c.t("whatsappLink")}
                          </a>
                        </li>
                      ) : null}
                    </ul>
                  </li>
                ))}
              </ul>
              {s.contact.hours ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
                  <Icon name="clock" size={15} className="shrink-0" />
                  {s.contact.hours}
                </p>
              ) : null}
            </section>
          ) : null}

          {branches.length ? (
            <section id="branches" className="scroll-mt-24" aria-labelledby="branches-h">
              <h2 id="branches-h" className="heading text-xl">
                {c.t("branchesTitle")}
              </h2>
              <ul className="mt-4 grid gap-3">
                {branches.map((b) => (
                  <li key={b.id} className="card flex gap-4 p-5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand-ink">
                      <Icon name={b.isHeadOffice ? "building" : "pin"} size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {b.name}
                        {b.isHeadOffice ? <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand-ink">{c.t("headOffice")}</span> : null}
                      </p>
                      <address className="not-italic text-ink-soft">
                        {b.address}, {b.city}, {b.state}
                      </address>
                      {b.hours ? (
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                          <Icon name="clock" size={14} className="shrink-0" />
                          {b.hours}
                        </p>
                      ) : null}
                      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.95rem]">
                        {b.phone ? (
                          <a className="inline-flex items-center gap-1.5 hover:text-brand-ink" href={telHref(b.phone)}>
                            <Icon name="phone" size={15} className="text-brand-ink" />
                            <span className="num">{b.phone}</span>
                          </a>
                        ) : null}
                        {b.mapUrl ? (
                          <a className="inline-flex items-center gap-1.5 font-semibold text-brand-ink underline-offset-2 hover:underline" href={b.mapUrl} target="_blank" rel="noopener">
                            <Icon name="external" size={15} />
                            {c.t("directions")}
                          </a>
                        ) : null}
                      </p>
                    </div>
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
