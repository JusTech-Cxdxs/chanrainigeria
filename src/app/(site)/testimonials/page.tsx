import type { Metadata } from "next";
import { PageHead } from "@/components/site/PageHead";
import { TestimonialGrid } from "@/components/site/Testimonials";
import { getTestimonials } from "@/lib/catalogue";
import { getSettings, imageUrl } from "@/lib/settings";
import { ShareForm } from "./ShareForm";

export const metadata: Metadata = { title: "What customers say" };
export const dynamic = "force-dynamic";

export default async function Testimonials() {
  const [s, items] = await Promise.all([getSettings(), getTestimonials()]);
  return (
    <>
      <PageHead
        crumbs={[{ href: "/", label: "Home" }, { label: "Testimonials" }]}
        title="What customers say"
        lead="Feedback from contractors, station operators and warehouse teams we work with. Every testimonial is checked by our team before it appears."
        image={imageUrl(s, "page-about")}
      />
      <div className="wrap grid gap-16 py-16">
        {items.length ? <TestimonialGrid items={items} /> : <p className="text-ink-soft">Be the first to share your experience.</p>}
        <section id="share" className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="heading text-3xl">Share your experience</h2>
            <p className="mt-3 text-ink-soft measure">
              Worked with us on a machine, a station or a fleet? Tell others how it went. Your email stays private and your words appear only after our team approves them.
            </p>
          </div>
          <ShareForm companyName={s.company.shortName} />
        </section>
      </div>
    </>
  );
}
