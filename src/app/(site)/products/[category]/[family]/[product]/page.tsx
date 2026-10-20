import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Machine, machineForSlug } from "@/components/Machine";
import { PageHead } from "@/components/site/PageHead";
import { SpecTable } from "@/components/site/SpecTable";
import { getFamily, getProduct } from "@/lib/catalogue";
import { mediaUrl } from "@/lib/settings";

type P = { params: Promise<{ category: string; family: string; product: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getProduct((await params).product);
  return p ? { title: [p.brand?.name, p.name].filter(Boolean).join(" "), description: p.summary } : {};
}

export default async function ProductPage({ params }: P) {
  const { category, family, product } = await params;
  const p = await getProduct(product);
  if (!p || p.family.slug !== family || p.family.category.slug !== category) notFound();
  const f = await getFamily(family);
  const c = p.family.category;
  const title = [p.brand?.name, p.name].filter(Boolean).join(" ");

  return (
    <>
      <PageHead
        crumbs={[
          { href: "/products", label: "Products" },
          { href: `/products/${c.slug}`, label: c.name },
          { href: `/products/${c.slug}/${p.family.slug}`, label: p.family.name },
          { label: p.name },
        ]}
        title={title}
        lead={p.summary}
      />
      <div className="wrap grid gap-12 py-14 lg:grid-cols-[1.2fr_1fr]">
        <div>
          {p.imageIds.length ? (
            <div className="grid gap-3">
              {p.imageIds.map((id) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={id} src={mediaUrl(id)!} alt={title} className="w-full rounded" />
              ))}
            </div>
          ) : (
            <Machine kind={p.family.illustration || machineForSlug(p.family.slug, c.illustration)} className="w-full" />
          )}
          {p.highlights.length ? (
            <ul className="mt-8 space-y-3">
              {p.highlights.map((h) => (
                <li key={h} className="border-l-2 border-brand pl-4">
                  {h}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div>
          <h2 className="heading text-2xl">Specifications</h2>
          <div className="mt-4">
            <SpecTable fields={f?.specFields ?? []} specs={p.specs} verified={p.specsVerified} />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/contact?type=QUOTE&product=${p.slug}`} className="btn btn-primary">
              Ask for a quote
            </Link>
            <Link href={`/book-service?category=${c.slug}&machine=${encodeURIComponent(title)}`} className="btn btn-outline">
              Book a technician
            </Link>
            {p.brochureId ? (
              <a href={mediaUrl(p.brochureId)!} className="btn btn-outline" target="_blank" rel="noopener">
                Download brochure
              </a>
            ) : null}
          </div>
          <p className="mt-8 text-ink-soft">
            Want to understand how it works first?{" "}
            <Link href={`/products/${c.slug}/${p.family.slug}#how`} className="text-brand underline underline-offset-2">
              Read about {p.family.name.toLowerCase()}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
