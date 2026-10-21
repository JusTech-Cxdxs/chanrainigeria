import type { Metadata } from "next";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { PageHead } from "@/components/site/PageHead";
import { getCategories } from "@/lib/catalogue";
import { telHref } from "@/lib/format";
import { deskFor, getSettings, imageUrl } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Book a technician",
  description: "Book an on-site service visit for construction equipment, CNG equipment or forklifts anywhere in Nigeria.",
};
export const dynamic = "force-dynamic";

type P = { searchParams: Promise<Record<string, string | undefined>> };

export default async function BookService({ searchParams }: P) {
  const q = await searchParams;
  const [s, categories] = await Promise.all([getSettings(), getCategories()]);
  const svc = deskFor(s, "service");
  return (
    <>
      <PageHead
        crumbs={[{ href: "/", label: "Home" }, { label: "Book a technician" }]}
        title="Book a technician"
        lead="Our technicians come to the machine: on the job site, at the station or in your warehouse. Tell us what it is, where it is and what's happening."
        image={imageUrl(s, "page-book-service")}
      >
        {svc?.phone ? (
          <p className="mt-6 inline-flex flex-wrap items-center gap-x-3 rounded-xl border-l-4 border-accent bg-white/10 px-4 py-3 backdrop-blur">
            <span className="font-semibold">Machine down right now?</span>
            <span>
              Call the service desk on{" "}
              <a href={telHref(svc.phone)} className="num font-semibold text-white underline underline-offset-2">
                {svc.phone}
              </a>
            </span>
          </p>
        ) : null}
      </PageHead>
      <div className="wrap max-w-4xl py-14">
        <EnquiryForm
          mode="service"
          companyName={s.company.shortName}
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
          defaults={{ category: q.category, machine: q.machine }}
        />
      </div>
    </>
  );
}
