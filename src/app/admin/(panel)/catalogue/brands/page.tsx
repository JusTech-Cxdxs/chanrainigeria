import { asc } from "drizzle-orm";
import Link from "next/link";
import { moveItem } from "@/app/admin/actions/catalogue";
import { EmptyState, Pill } from "@/components/admin/cms";
import { CHECKER } from "@/components/admin/MediaDialog";
import { AdminHead, Flash } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { db, schema } from "@/db";
import { brandLogo } from "@/lib/brand-logos";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Brands({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin("brands");
  const brands = await db.query.brands.findMany({ orderBy: [asc(schema.brands.order), asc(schema.brands.name)] });
  const products = await db.select({ brandId: schema.products.brandId }).from(schema.products);
  const count = (id: string) => products.filter((p) => p.brandId === id).length;

  return (
    <>
      <AdminHead
        title="Brands"
        lead="The manufacturers you represent. Their logos appear in the brands strip on the home page, on each product line and at the foot of every email. Use the logo files from each manufacturer's dealer kit."
        actions={
          <Link href="/admin/catalogue/brands/new" className="btn btn-primary">
            <Icon name="plus" size={17} /> Add a brand
          </Link>
        }
      />
      <Flash sp={await searchParams} />
      {brands.length ? (
        <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {brands.map((b, i) => (
            <li key={b.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-brand">
              <Link href={`/admin/catalogue/brands/${b.id}`} className="flex flex-1 flex-col">
                <div className={`grid h-28 place-items-center border-b border-line-soft p-4 ${CHECKER}`}>
                  {brandLogo(b) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logoId ? `/media/${b.logoId}?w=480` : brandLogo(b)!} alt={`${b.name} logo`} className="max-h-16 max-w-[80%] object-contain" />
                  ) : (
                    <span className="grid place-items-center gap-1 text-center text-xs text-ink-soft">
                      <Icon name="image-plus" size={24} />
                      No logo yet
                    </span>
                  )}
                </div>
                <div className="grid flex-1 gap-1.5 p-4">
                  <p className="heading text-lg">{b.name}</p>
                  <p className="text-sm text-ink-soft">{b.relationship || "No relationship set"}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Pill on={b.showOnHome} yes="On the website" no="Not on the website" />
                    <Pill on={b.showInEmail} yes="In emails" no="Not in emails" />
                    <span className="inline-flex items-center gap-1 rounded-full bg-concrete px-2.5 py-0.5 text-xs font-semibold text-ink-soft ring-1 ring-line">
                      <Icon name="package" size={12} /> {count(b.id)} model{count(b.id) === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-1 border-t border-line-soft px-2 py-1.5">
                <form action={moveItem.bind(null, "brands", b.id, "up", "/admin/catalogue/brands")}>
                  <button className="grid h-9 w-9 place-items-center rounded-lg hover:bg-concrete disabled:opacity-30" disabled={i === 0} aria-label={`Move ${b.name} earlier`}>
                    <Icon name="arrow-up" size={16} />
                  </button>
                </form>
                <form action={moveItem.bind(null, "brands", b.id, "down", "/admin/catalogue/brands")}>
                  <button className="grid h-9 w-9 place-items-center rounded-lg hover:bg-concrete disabled:opacity-30" disabled={i === brands.length - 1} aria-label={`Move ${b.name} later`}>
                    <Icon name="arrow-down" size={16} />
                  </button>
                </form>
                <span className="ml-1 text-xs text-ink-soft">Order on the site</span>
                <Link href={`/admin/catalogue/brands/${b.id}`} className="ml-auto inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-brand hover:bg-brand/10">
                  <Icon name="edit" size={15} /> Edit
                </Link>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState
          icon="verified"
          title="No brands yet"
          action={
            <Link href="/admin/catalogue/brands/new" className="btn btn-primary">
              <Icon name="plus" size={17} /> Add the first brand
            </Link>
          }
        >
          Add each manufacturer you sell or service, with its logo.
        </EmptyState>
      )}
    </>
  );
}
