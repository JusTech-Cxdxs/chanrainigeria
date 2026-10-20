import type { Metadata } from "next";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { PageHead } from "@/components/site/PageHead";
import { getBranches, getProductIndex } from "@/lib/catalogue";
import { telHref, waHref } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Contact", description: "Talk to Chanrai Nigeria's sales, service, parts or CNG desk." };
export const dynamic = "force-dynamic";

type P = { searchParams: Promise<Record<string, string | undefined>> };

export default async function Contact({ searchParams }: P) {
  const q = await searchParams;
  const [s, products, branches] = await Promise.all([getSettings(), getProductIndex(), getBranches()]);
  const desks = Object.entries(s.desks).filter(([, d]) => d.email || d.phone || d.whatsapp);

  return (
    <>
      <PageHead
        crumbs={[{ href: "/", label: "Home" }, { label: "Contact" }]}
        title="Talk to us"
        lead="Send a message and it goes straight to the right desk. You'll get a reference number by email."
      />
      <div className="wrap grid gap-14 py-14 lg:grid-cols-[1.5fr_1fr]">
        <EnquiryForm
          mode="contact"
          companyName={s.company.shortName}
          products={products}
          defaults={{ type: q.type === "QUOTE" || q.type === "CALLBACK" ? q.type : q.product ? "QUOTE" : undefined, product: q.product, category: q.category }}
        />
        <aside className="space-y-10">
          {desks.length ? (
            <section>
              <h2 className="heading text-xl">Desks</h2>
              <dl className="mt-4 divide-y divide-line-soft border-y border-line">
                {desks.map(([k, d]) => (
                  <div key={k} className="py-4">
                    <dt className="font-semibold">{d.label}</dt>
                    <dd className="mt-1 space-y-0.5 text-[0.95rem]">
                      {d.phone ? <a className="block num hover:text-brand" href={telHref(d.phone)}>{d.phone}</a> : null}
                      {d.email ? <a className="block break-all hover:text-brand" href={`mailto:${d.email}`}>{d.email}</a> : null}
                      {d.whatsapp ? (
                        <a className="block hover:text-brand" href={waHref(d.whatsapp)} target="_blank" rel="noopener">
                          Chat on WhatsApp
                        </a>
                      ) : null}
                    </dd>
                  </div>
                ))}
              </dl>
              {s.contact.hours ? <p className="mt-3 text-sm text-ink-soft">{s.contact.hours}</p> : null}
            </section>
          ) : null}

          {branches.length ? (
            <section id="branches" className="scroll-mt-24">
              <h2 className="heading text-xl">Where to find us</h2>
              <ul className="mt-4 space-y-5">
                {branches.map((b) => (
                  <li key={b.id}>
                    <p className="font-semibold">
                      {b.name}
                      {b.isHeadOffice ? <span className="ml-2 text-sm font-normal text-ink-soft">Head office</span> : null}
                    </p>
                    <address className="not-italic text-ink-soft">
                      {b.address}, {b.city}, {b.state}
                    </address>
                    {b.hours ? <p className="text-sm text-ink-soft">{b.hours}</p> : null}
                    <p className="mt-1 flex flex-wrap gap-x-4 text-[0.95rem]">
                      {b.phone ? <a className="num hover:text-brand" href={telHref(b.phone)}>{b.phone}</a> : null}
                      {b.mapUrl ? (
                        <a className="text-brand underline-offset-2 hover:underline" href={b.mapUrl} target="_blank" rel="noopener">
                          Directions
                        </a>
                      ) : null}
                    </p>
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
