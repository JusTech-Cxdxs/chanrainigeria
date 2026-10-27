import Link from "next/link";
import { Machine, machineForSlug } from "@/components/Machine";
import { FamilyPicture } from "@/components/site/FamilyPicture";
import { PageHead } from "@/components/site/PageHead";
import { pageMetadata, siteContent } from "@/components/site/site-content";
import { Icon } from "@/components/ui/Icon";
import { getCategories } from "@/lib/catalogue";
import { familyImage } from "@/lib/type-images";

export const generateMetadata = () => pageMetadata("products");
export const dynamic = "force-dynamic";

export default async function Products() {
  const [c, nav, categories] = await Promise.all([siteContent("products"), siteContent("header"), getCategories()]);
  return (
    <>
      <PageHead crumbs={[{ href: "/", label: nav.t("crumbHome") }, { label: c.t("crumb") }]} title={c.t("title")} lead={c.t("lead")} image={c.img("image")} />
      <div className="wrap space-y-20 py-14">
        {categories.length === 0 ? <p className="text-ink-soft">{c.t("empty")}</p> : null}
        {categories.map((cat) => (
          <section key={cat.id} aria-labelledby={`c-${cat.slug}`} className="reveal">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-3">
              <h2 id={`c-${cat.slug}`} className="heading text-3xl">
                <Link href={`/products/${cat.slug}`} className="hover:text-brand-ink">
                  {cat.name}
                </Link>
              </h2>
              <span className="flex items-center gap-4">
                {cat.brands.length ? <span className="text-ink-soft">{cat.brands.map((b) => b.name).join(" · ")}</span> : null}
                <Link href={`/products/${cat.slug}`} className="btn-quiet inline-flex items-center gap-1.5 font-semibold">
                  {c.t("lineLink")}
                  <Icon name="arrow" size={16} />
                </Link>
              </span>
            </div>
            <p className="mt-4 max-w-[62ch] text-ink-soft">{cat.tagline}</p>
            <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
              {cat.families.map((f) => (
                <li key={f.id}>
                  <Link href={`/products/${cat.slug}/${f.slug}`} className="group block">
                    <FamilyPicture src={familyImage(f)} alt={f.name} fallback={<Machine kind={f.illustration || machineForSlug(f.slug, cat.illustration)} className="w-full" />} />
                    <span className="heading mt-3 block text-lg group-hover:text-brand-ink">{f.name}</span>
                    <span className="mt-1 line-clamp-2 text-sm text-ink-soft">{f.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
