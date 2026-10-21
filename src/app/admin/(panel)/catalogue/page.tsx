import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createCategory } from "@/app/admin/actions/catalogue";
import { AdminHead, Badge, Empty, Flash, Panel, SubmitButton } from "@/components/admin/ui";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { plural } from "@/lib/format";

export default async function Catalogue({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireAdmin("products");
  const sp = await searchParams;

  if (sp.unverified) {
    const rows = await db.query.products.findMany({
      where: eq(schema.products.specsVerified, false),
      orderBy: [asc(schema.products.name)],
      with: { family: { columns: { name: true } }, brand: { columns: { name: true } } },
    });
    return (
      <>
        <AdminHead
          back={{ href: "/admin/catalogue", label: "Products" }}
          title="Specifications to check"
          lead="Open each model, compare its figures with the manufacturer's official spec sheet for the Nigerian configuration, correct anything that differs, then tick “Specifications checked”. Until then the site shows a note that figures are indicative."
        />
        {rows.length ? (
          <ul className="divide-y divide-line-soft rounded-lg border border-line bg-surface">
            {rows.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/catalogue/models/${p.id}`} className="flex flex-wrap justify-between gap-2 px-4 py-3 hover:bg-concrete/60">
                  <span className="font-semibold">
                    {p.brand?.name} {p.name}
                  </span>
                  <span className="text-ink-soft">{p.family.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Every model&apos;s specifications have been checked.</Empty>
        )}
      </>
    );
  }

  const lines = await db.query.categories.findMany({
    orderBy: [asc(schema.categories.order)],
    with: {
      brand: true,
      families: {
        orderBy: [asc(schema.families.order)],
        with: { products: { columns: { id: true, published: true, specsVerified: true } } },
      },
    },
  });

  return (
    <>
      <AdminHead
        title="Products"
        lead="Product lines, the machine types inside them, and the models you supply. Changes show on the website within a minute."
        actions={
          <>
            <Link href="/admin/catalogue/brands" className="btn btn-outline">
              Manufacturers
            </Link>
            <Link href="/admin/catalogue?unverified=1" className="btn btn-outline">
              Specs to check
            </Link>
          </>
        }
      />
      <Flash sp={sp} />
      <div className="space-y-6">
        {lines.map((c) => (
          <Panel
            key={c.id}
            title={c.name}
            aside={
              <span className="flex items-center gap-3">
                {!c.published ? <Badge>Hidden</Badge> : null}
                <Link href={`/admin/catalogue/lines/${c.id}`} className="text-sm font-semibold text-brand">
                  Edit line
                </Link>
              </span>
            }
          >
            <p className="-mt-2 mb-4 text-sm text-ink-soft">
              {c.brand?.name ?? "No manufacturer set"} · enquiries go to the {c.desk} desk
            </p>
            <ul className="divide-y divide-line-soft border-y border-line-soft">
              {c.families.map((f) => {
                const unchecked = f.products.filter((p) => !p.specsVerified).length;
                return (
                  <li key={f.id}>
                    <Link href={`/admin/catalogue/types/${f.id}`} className="flex flex-wrap items-center gap-3 py-2.5 hover:text-brand">
                      <span className="font-semibold">{f.name}</span>
                      <span className="text-sm text-ink-soft num">{plural(f.products.length, "model")}</span>
                      <span className="ml-auto flex gap-2">
                        {!f.published ? <Badge>Hidden</Badge> : null}
                        {unchecked ? <Badge tone="warn">{unchecked} to check</Badge> : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link href={`/admin/catalogue/types/new?category=${c.id}`} className="btn btn-outline mt-4 !min-h-9 text-sm">
              Add a machine type
            </Link>
          </Panel>
        ))}
      </div>
      <Panel title="Add a product line" className="mt-6">
        <form action={createCategory} className="flex flex-wrap gap-3">
          <input name="name" className="input max-w-sm" placeholder="e.g. Generators" required />
          <SubmitButton variant="outline">Add line</SubmitButton>
        </form>
      </Panel>
    </>
  );
}
