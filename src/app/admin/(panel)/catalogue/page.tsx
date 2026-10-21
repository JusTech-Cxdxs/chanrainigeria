import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { createCategory, moveItem, togglePublished } from "@/app/admin/actions/catalogue";
import { EmptyState, Pill } from "@/components/admin/cms";
import { AdminHead, Badge, Flash, SubmitButton } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { plural } from "@/lib/format";

export const dynamic = "force-dynamic";

const LINE_ICON: Record<string, string> = { forklift: "forklift", pallet: "forklift", stacker: "forklift", compressor: "fuel", dispenser: "fuel", cascade: "fuel", skid: "fuel", station: "fuel" };

function Arrows({ kind, id, first, last, name, back }: { kind: "categories" | "families"; id: string; first: boolean; last: boolean; name: string; back: string }) {
  return (
    <span className="flex">
      <form action={moveItem.bind(null, kind, id, "up", back)}>
        <button className="grid h-9 w-9 place-items-center rounded-lg hover:bg-concrete disabled:opacity-30" disabled={first} aria-label={`Move ${name} up`}>
          <Icon name="arrow-up" size={16} />
        </button>
      </form>
      <form action={moveItem.bind(null, kind, id, "down", back)}>
        <button className="grid h-9 w-9 place-items-center rounded-lg hover:bg-concrete disabled:opacity-30" disabled={last} aria-label={`Move ${name} down`}>
          <Icon name="arrow-down" size={16} />
        </button>
      </form>
    </span>
  );
}

export default async function Catalogue({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin("products");
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
          lead="Open each model, compare its figures with the manufacturer's official spec sheet for the Nigerian configuration, correct anything that differs, then tick Specifications checked. Until then the site notes that figures are indicative."
        />
        {rows.length ? (
          <ul className="divide-y divide-line-soft overflow-hidden rounded-2xl border border-line bg-surface">
            {rows.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/catalogue/models/${p.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-concrete/60">
                  <Icon name="alert" size={16} className="text-accent" />
                  <span className="font-semibold">
                    {p.brand?.name} {p.name}
                  </span>
                  <span className="ml-auto text-sm text-ink-soft">{p.family.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="done" title="All checked">
            Every model&apos;s specifications have been checked.
          </EmptyState>
        )}
      </>
    );
  }

  const lines = await db.query.categories.findMany({
    orderBy: [asc(schema.categories.order), asc(schema.categories.name)],
    with: {
      brand: true,
      families: {
        orderBy: [asc(schema.families.order), asc(schema.families.name)],
        with: { products: { columns: { id: true, published: true, specsVerified: true } } },
      },
    },
  });
  const unchecked = lines.flatMap((l) => l.families.flatMap((f) => f.products)).filter((p) => !p.specsVerified).length;

  return (
    <>
      <AdminHead
        title="Products"
        lead="Your catalogue in three levels: product lines (e.g. Forklifts), the machine types inside each line (e.g. Electric counterbalance forklifts), and the models you supply (e.g. BYD ECB25). Changes show on the website within a minute."
        actions={
          <>
            <Link href="/admin/catalogue/brands" className="btn btn-outline">
              <Icon name="verified" size={17} /> Brands
            </Link>
            <Link href="/admin/catalogue?unverified=1" className="btn btn-outline">
              <Icon name="checklist" size={17} /> Specs to check{unchecked ? ` (${unchecked})` : ""}
            </Link>
          </>
        }
      />
      <Flash sp={sp} />
      {lines.length ? (
        <div className="space-y-6">
          {lines.map((c, ci) => (
            <section key={c.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
              <header className="flex flex-wrap items-center gap-3 border-b border-line-soft p-4 sm:px-6">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                  <Icon name={LINE_ICON[c.illustration] ?? "hardhat"} size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/catalogue/lines/${c.id}`} className="heading text-lg hover:text-brand">
                    {c.name}
                  </Link>
                  <p className="text-sm text-ink-soft">
                    Product line · {c.brand?.name ?? "No brand set"} · {plural(c.families.length, "machine type")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <Pill on={c.published} />
                  <Arrows kind="categories" id={c.id} first={ci === 0} last={ci === lines.length - 1} name={c.name} back="/admin/catalogue" />
                  <Link href={`/admin/catalogue/lines/${c.id}`} className="btn btn-outline !min-h-9 !px-3 text-sm">
                    <Icon name="edit" size={15} /> Edit line
                  </Link>
                </div>
              </header>
              {c.families.length ? (
                <ul className="divide-y divide-line-soft">
                  {c.families.map((f, fi) => {
                    const toCheck = f.products.filter((p) => !p.specsVerified).length;
                    const live = f.products.filter((p) => p.published).length;
                    return (
                      <li key={f.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 sm:px-6">
                        <Icon name="box" size={16} className="text-ink-soft" />
                        <Link href={`/admin/catalogue/types/${f.id}`} className="min-w-0 flex-1 font-semibold hover:text-brand">
                          {f.name}
                          <span className="ml-2 text-sm font-normal text-ink-soft num">
                            {plural(f.products.length, "model")}
                            {live !== f.products.length ? `, ${live} on the site` : ""}
                          </span>
                        </Link>
                        <span className="flex items-center gap-1">
                          {!f.published ? <Badge>Hidden</Badge> : null}
                          {toCheck ? <Badge tone="warn">{toCheck} to check</Badge> : null}
                          <form action={togglePublished.bind(null, "families", f.id, "/admin/catalogue")}>
                            <SubmitButton variant="outline" className="!min-h-8 !px-2.5 text-xs" pendingText="…">
                              <Icon name={f.published ? "eye-off" : "eye"} size={14} /> {f.published ? "Hide" : "Show"}
                            </SubmitButton>
                          </form>
                          <Arrows kind="families" id={f.id} first={fi === 0} last={fi === c.families.length - 1} name={f.name} back="/admin/catalogue" />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="px-4 py-4 text-sm text-ink-soft sm:px-6">No machine types in this line yet.</p>
              )}
              <div className="border-t border-line-soft px-4 py-3 sm:px-6">
                <Link href={`/admin/catalogue/types/new?category=${c.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                  <Icon name="plus" size={16} /> Add a machine type to {c.name}
                </Link>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState icon="package" title="No product lines yet">
          Add your first line below, for example Construction equipment.
        </EmptyState>
      )}
      <section className="mt-6 rounded-2xl border border-dashed border-line p-4 sm:p-6">
        <h2 className="heading text-lg">Add a product line</h2>
        <p className="mb-3 text-sm text-ink-soft">A whole new range, like Generators. It starts hidden so you can fill it in first.</p>
        <form action={createCategory} className="flex flex-wrap gap-3">
          <input name="name" className="input max-w-sm flex-1" placeholder="e.g. Generators" required aria-label="Name of the new line" />
          <SubmitButton variant="outline">
            <Icon name="plus" size={16} /> Add line
          </SubmitButton>
        </form>
      </section>
    </>
  );
}
