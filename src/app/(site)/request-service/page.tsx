import { EnquiryForm } from "@/components/site/EnquiryForm";
import { withNode } from "@/components/site/fill";
import { PageHead } from "@/components/site/PageHead";
import { pageMetadata, siteContent } from "@/components/site/site-content";
import { Icon } from "@/components/ui/Icon";
import { getCategories } from "@/lib/catalogue";
import { telHref } from "@/lib/format";
import { deskFor } from "@/lib/settings";

export const generateMetadata = () => pageMetadata("book-service");
export const dynamic = "force-dynamic";

type P = { searchParams: Promise<Record<string, string | undefined>> };

export default async function BookService({ searchParams }: P) {
  const q = await searchParams;
  const [c, forms, nav, categories] = await Promise.all([siteContent("book-service"), siteContent("forms"), siteContent("header"), getCategories()]);
  const svc = deskFor(c.settings, "service");
  return (
    <>
      <PageHead crumbs={[{ href: "/", label: nav.t("crumbHome") }, { label: c.t("crumb") }]} title={c.t("title")} lead={c.t("lead")} image={c.img("image")}>
        {svc?.phone ? (
          // Amber here is deliberate: it is the one urgency colour on the site.
          <p className="mt-6 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border-l-4 border-accent bg-white/10 px-4 py-3 backdrop-blur">
            <Icon name="alert" size={18} className="text-accent" />
            <span className="font-semibold">{c.t("downTitle")}</span>
            <span>
              {withNode(
                c.t("downText"),
                "phone",
                <a href={telHref(svc.phone)} className="num font-semibold text-white underline underline-offset-2">
                  {svc.phone}
                </a>,
              )}
            </span>
          </p>
        ) : null}
      </PageHead>
      <div className="wrap max-w-4xl py-14">
        <EnquiryForm
          mode="service"
          labels={forms.labels()}
          categories={categories.map((x) => ({ slug: x.slug, name: x.name }))}
          defaults={{ category: q.category, machine: q.machine }}
        />
      </div>
    </>
  );
}
