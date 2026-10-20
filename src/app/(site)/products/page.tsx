import type { Metadata } from "next";
import Link from "next/link";
import { Machine, machineForSlug } from "@/components/Machine";
import { PageHead } from "@/components/site/PageHead";
import { getCategories } from "@/lib/catalogue";
import { mediaUrl } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Products",
  description: "Construction equipment, CNG and gas equipment, and electric forklifts available from Chanrai Nigeria.",
};
export const dynamic = "force-dynamic";

export default async function Products() {
  const categories = await getCategories();
  return (
    <>
      <PageHead
        crumbs={[{ href: "/", label: "Home" }, { label: "Products" }]}
        title="Products"
        lead="Choose a line to see each machine type, how it works and the models we supply. Ask for a quote on any of them."
      />
      <div className="wrap space-y-20 py-14">
        {categories.length === 0 ? (
          <p className="text-ink-soft">The catalogue is being prepared. Contact us and we&apos;ll tell you what&apos;s available.</p>
        ) : null}
        {categories.map((c) => (
          <section key={c.id} aria-labelledby={`c-${c.slug}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-3">
              <h2 id={`c-${c.slug}`} className="heading text-3xl">
                <Link href={`/products/${c.slug}`} className="hover:text-brand">
                  {c.name}
                </Link>
              </h2>
              {c.brand ? <span className="text-ink-soft">{c.brand.name}</span> : null}
            </div>
            <p className="mt-4 max-w-[62ch] text-ink-soft">{c.tagline}</p>
            <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
              {c.families.map((f) => (
                <li key={f.id}>
                  <Link href={`/products/${c.slug}/${f.slug}`} className="group block">
                    {f.imageId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaUrl(f.imageId)!} alt="" className="aspect-[12/7] w-full object-contain" />
                    ) : (
                      <Machine kind={f.illustration || machineForSlug(f.slug, c.illustration)} className="w-full" />
                    )}
                    <span className="heading mt-2 block text-lg group-hover:text-brand">{f.name}</span>
                    <span className="mt-1 line-clamp-2 block text-sm text-ink-soft">{f.summary}</span>
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
