import type { Metadata } from "next";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { PageHead } from "@/components/site/PageHead";
import { getCategories } from "@/lib/catalogue";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Parts",
  description: "Request genuine parts for construction equipment, CNG equipment and forklifts.",
};
export const dynamic = "force-dynamic";

type P = { searchParams: Promise<Record<string, string | undefined>> };

export default async function Parts({ searchParams }: P) {
  const q = await searchParams;
  const [s, categories] = await Promise.all([getSettings(), getCategories()]);
  return (
    <>
      <PageHead
        crumbs={[{ href: "/", label: "Home" }, { label: "Parts" }]}
        title="Parts"
        lead="Filters, wear parts, hydraulic components, batteries and station spares. Send the machine's serial number and the part numbers if you have them, and we'll confirm availability."
      />
      <div className="wrap max-w-4xl py-14">
        <EnquiryForm
          mode="parts"
          companyName={s.company.shortName}
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
          defaults={{ category: q.category, machine: q.machine }}
        />
      </div>
    </>
  );
}
