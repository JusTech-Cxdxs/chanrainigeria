import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Machine, machineForSlug } from "@/components/Machine";
import { Framed } from "@/components/site/FamilyPicture";
import { ModelGrid, type ModelCard } from "@/components/site/ModelGrid";
import { PageHead } from "@/components/site/PageHead";
import { PhotoGrid } from "@/components/site/Showroom";
import { siteContent } from "@/components/site/site-content";
import { Icon } from "@/components/ui/Icon";
import { getFamily } from "@/lib/catalogue";
import { renderMarkdown } from "@/lib/markdown";
import { fileSize, isStudio, officialModel, officialType } from "@/lib/official-media";
import { imageUrl, mediaUrl } from "@/lib/settings";
import { familyImage, modelPictures } from "@/lib/type-images";

type P = { params: Promise<{ category: string; family: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const f = await getFamily((await params).family);
  return f ? { title: f.name, description: f.summary } : {};
}

export default async function FamilyPage({ params }: P) {
  const { category, family } = await params;
  const f = await getFamily(family);
  if (!f || f.category.slug !== category) notFound();
  const c = f.category;
  const [L, nav, prod] = await Promise.all([siteContent("machine-type"), siteContent("header"), siteContent("products")]);
  const kind = f.illustration || machineForSlug(f.slug, c.illustration);

  const models: ModelCard[] = f.products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand?.name ?? null,
    summary: p.summary,
    group: p.sizeClass,
    highlights: p.highlights,
    specs: p.specs,
    specsVerified: p.specsVerified,
    images: p.imageIds.length ? p.imageIds.map((i) => mediaUrl(i)!) : modelPictures(f, p.slug),
    brochure: mediaUrl(p.brochureId) ?? officialModel(p.slug)?.brochure?.href ?? null,
    href: `/products/${c.slug}/${f.slug}/${p.slug}`,
  }));

  const official = officialType(f.slug);
  const gallery = (official?.gallery ?? []).map((g) => ({ src: g.src, caption: g.caption, studio: isStudio(g.src) }));
  const stage = { turn: L.t("stageTurn"), full: L.t("stageFull"), close: L.t("stageClose"), prev: L.t("stagePrev"), next: L.t("stageNext"), count: L.t("stageCount"), play: "" };
  const m = f.maintenance;
  const sections = [
    { id: "how", label: L.t("navHow"), show: !!f.howItWorks },
    { id: "gallery", label: L.t("navGallery"), show: gallery.length > 0 },
    { id: "models", label: L.t("navModels"), show: true },
    { id: "choosing", label: L.t("navChoosing"), show: f.choosingTips.length > 0 },
    { id: "care", label: L.t("navCare"), show: !!(m.dailyChecks?.length || m.intervals?.length) },
    { id: "safety", label: L.t("navSafety"), show: f.safety.length > 0 },
    { id: "faq", label: L.t("navFaq"), show: f.faq.length > 0 },
  ].filter((s) => s.show);

  return (
    <>
      <PageHead
        crumbs={[
          { href: "/", label: nav.t("crumbHome") },
          { href: "/products", label: prod.t("crumb") },
          { href: `/products/${c.slug}`, label: c.name },
          { label: f.name },
        ]}
        title={f.name}
        lead={f.summary}
        image={c.imageId ? mediaUrl(c.imageId) : imageUrl(L.settings, `category-${c.slug}`)}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/contact?type=QUOTE&category=${c.slug}&family=${f.slug}`} className="btn btn-primary">
            <Icon name="file" />
            {L.t("quoteButton")}
          </Link>
          <Link href={`/request-service?category=${c.slug}&machine=${encodeURIComponent(f.name)}`} className="btn btn-glass">
            <Icon name="calendar" />
            {L.t("bookButton")}
          </Link>
        </div>
      </PageHead>

      <nav aria-label={L.t("navAria")} className="sticky top-[var(--header-h)] z-30 border-b border-line bg-concrete/95 backdrop-blur">
        <ul className="wrap flex gap-1 overflow-x-auto py-2 text-sm">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="block whitespace-nowrap rounded px-3 py-1.5 font-semibold text-ink-soft hover:bg-surface hover:text-brand-ink">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="wrap py-14">
        {f.howItWorks ? (
          <section id="how" className="scroll-mt-36 grid gap-10 lg:grid-cols-[1.25fr_1fr]">
            <div>
              <h2 className="heading text-3xl">{L.t("howTitle")}</h2>
              <div className="prose-site mt-5" dangerouslySetInnerHTML={{ __html: renderMarkdown(f.howItWorks) }} />
            </div>
            <div className="lg:pt-14">
              <Framed
                src={familyImage(f)}
                alt={f.name}
                zoom={false}
                fallback={<Machine kind={kind} className="w-full" title={L.f("drawingTitle", { type: f.name.toLowerCase().replace(/s$/, "") })} />}
              />
              {f.keyComponents.length ? (
                <dl className="mt-6 divide-y divide-line-soft border-y border-line">
                  {f.keyComponents.map((k) => (
                    <div key={k.name} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
                      <dt className="font-semibold">{k.name}</dt>
                      <dd className="text-[0.95rem] text-ink-soft">{k.role}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          </section>
        ) : null}

        {f.applications.length ? (
          <section className="mt-16" aria-labelledby="apps-h">
            <h2 id="apps-h" className="heading text-2xl">
              {L.t("appsTitle")}
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {f.applications.map((a) => (
                <li key={a} className="rounded-full border border-line bg-surface px-4 py-1.5 text-[0.95rem]">
                  {a}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {gallery.length ? (
          <section id="gallery" className="mt-16 scroll-mt-36">
            <h2 className="heading text-3xl">{L.t("galleryTitle")}</h2>
            <div className="mt-6">
              <PhotoGrid shots={gallery} alt={f.name} labels={stage} />
            </div>
            {official?.brochures?.length ? (
              <div className="mt-8">
                <h3 className="heading text-lg">{L.t("downloadsTitle")}</h3>
                <ul className="mt-3 flex flex-wrap gap-3">
                  {official.brochures.map((b) => (
                    <li key={b.href}>
                      <a href={b.href} target="_blank" rel="noopener" className="btn btn-outline">
                        <Icon name="download" />
                        {L.f("downloadItem", { label: b.label ?? "", size: fileSize(b.kb) })}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        <section id="models" className="mt-16 scroll-mt-36">
          <h2 className="heading text-3xl">{L.t("modelsTitle")}</h2>
          {models.length ? (
            <div className="mt-6">
              <ModelGrid models={models} fields={f.specFields} illustration={kind} familyName={f.name} labels={L.labels()} />
            </div>
          ) : (
            <p className="mt-4 text-ink-soft measure">
              {L.t("noModelsText")}{" "}
              <Link href={`/contact?type=QUOTE&family=${f.slug}`} className="font-semibold text-brand-ink underline underline-offset-2">
                {L.t("noModelsLink")}
              </Link>
            </p>
          )}
        </section>

        {f.choosingTips.length ? (
          <section id="choosing" className="mt-16 scroll-mt-36 max-w-3xl">
            <h2 className="heading text-3xl">{L.t("choosingTitle")}</h2>
            <ul className="mt-5 space-y-3">
              {f.choosingTips.map((t) => (
                <li key={t} className="border-l-2 border-brand pl-4">
                  {t}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {m.dailyChecks?.length || m.intervals?.length ? (
          <section id="care" className="mt-16 scroll-mt-36">
            <h2 className="heading text-3xl">{L.t("careTitle")}</h2>
            <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
              {m.dailyChecks?.length ? (
                <div className="rounded-lg border border-line bg-surface p-6">
                  <h3 className="heading flex items-center gap-2 text-lg">
                    <Icon name="checklist" size={18} className="text-brand-ink" />
                    {L.t("dailyTitle")}
                  </h3>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.95rem]">
                    {m.dailyChecks.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {m.intervals?.length ? (
                <ol className="relative border-l-2 border-line pl-6">
                  {m.intervals.map((iv) => (
                    <li key={iv.hours} className="relative pb-6 last:pb-0">
                      <span className="absolute -left-[1.95rem] top-1 h-3.5 w-3.5 rounded-full border-2 border-brand bg-concrete" />
                      <p className="num heading text-lg">
                        {L.f("intervalHours", { n: new Intl.NumberFormat("en-NG").format(iv.hours) })}
                      </p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-[0.95rem] text-ink-soft">
                        {iv.tasks.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
            {m.note ? <p className="mt-4 text-sm text-ink-soft measure">{m.note}</p> : null}
            <Link href={`/request-service?category=${c.slug}&machine=${encodeURIComponent(f.name)}`} className="btn btn-outline mt-6">
              <Icon name="calendar" />
              {L.t("careButton")}
            </Link>
          </section>
        ) : null}

        {f.safety.length ? (
          <section id="safety" className="mt-16 scroll-mt-36 max-w-3xl">
            <h2 className="heading text-3xl">{L.t("safetyTitle")}</h2>
            <ul className="mt-5 space-y-3">
              {f.safety.map((t) => (
                <li key={t} className="flex gap-3">
                  <Icon name="shield" size={18} className="mt-0.5 shrink-0 text-brand-ink" />
                  {t}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {f.faq.length ? (
          <section id="faq" className="mt-16 scroll-mt-36 max-w-3xl">
            <h2 className="heading text-3xl">{L.t("faqTitle")}</h2>
            <div className="mt-5 divide-y divide-line border-y border-line">
              {f.faq.map((q) => (
                <details key={q.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                    {q.q}
                    <Icon name="plus" size={20} className="shrink-0 text-brand-ink transition-transform group-open:rotate-45" />
                  </summary>
                  <p className="mt-3 text-ink-soft">{q.a}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
