import { PageHead } from "@/components/site/PageHead";
import { pageMetadata, siteContent } from "@/components/site/site-content";
import { TestimonialGrid } from "@/components/site/Testimonials";
import { getTestimonials } from "@/lib/catalogue";
import { ShareForm } from "./ShareForm";

export const generateMetadata = () => pageMetadata("testimonials");
export const dynamic = "force-dynamic";

export default async function Testimonials() {
  const [c, forms, nav, items] = await Promise.all([siteContent("testimonials"), siteContent("forms"), siteContent("header"), getTestimonials()]);
  return (
    <>
      <PageHead crumbs={[{ href: "/", label: nav.t("crumbHome") }, { label: c.t("crumb") }]} title={c.t("title")} lead={c.t("lead")} image={c.img("image")} />
      <div className="wrap grid grid-cols-1 gap-16 py-16">
        {items.length ? <TestimonialGrid items={items} exampleLabel={c.t("exampleBadge")} /> : <p className="text-ink-soft">{c.t("empty")}</p>}
        <section id="share" className="grid scroll-mt-28 grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <h2 className="heading text-3xl">{c.t("shareTitle")}</h2>
            <p className="mt-3 text-ink-soft measure">{c.t("shareText")}</p>
          </div>
          <ShareForm labels={forms.labels()} />
        </section>
      </div>
    </>
  );
}
