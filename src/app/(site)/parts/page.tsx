import { EnquiryForm } from "@/components/site/EnquiryForm";
import { PageHead } from "@/components/site/PageHead";
import { pageMetadata, siteContent } from "@/components/site/site-content";
import { getCategories } from "@/lib/catalogue";

export const generateMetadata = () => pageMetadata("parts");
export const dynamic = "force-dynamic";

type P = { searchParams: Promise<Record<string, string | undefined>> };

export default async function Parts({ searchParams }: P) {
  const q = await searchParams;
  const [c, forms, nav, categories] = await Promise.all([siteContent("parts"), siteContent("forms"), siteContent("header"), getCategories()]);
  return (
    <>
      <PageHead image={c.img("image")} crumbs={[{ href: "/", label: nav.t("crumbHome") }, { label: c.t("crumb") }]} title={c.t("title")} lead={c.t("lead")} />
      <div className="wrap max-w-4xl py-14">
        <EnquiryForm
          mode="parts"
          labels={forms.labels()}
          categories={categories.map((x) => ({ slug: x.slug, name: x.name }))}
          defaults={{ category: q.category, machine: q.machine }}
        />
      </div>
    </>
  );
}
