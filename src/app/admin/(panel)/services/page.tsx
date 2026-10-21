import { asc } from "drizzle-orm";
import { deleteService, moveItem, saveService, togglePublished } from "@/app/admin/actions/catalogue";
import { EmptyState, Pill } from "@/components/admin/cms";
import { AdminHead, Check, Field, Flash, SubmitButton } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { toLines } from "@/lib/lines";

export const dynamic = "force-dynamic";

type Svc = { id: string; name: string; summary: string; includes: string[]; order: number; published: boolean; categoryId: string | null };

function ServiceForm({ x, lines }: { x: Svc; lines: { id: string; name: string }[] }) {
  return (
    <form action={saveService.bind(null, x.id)} className="grid items-start gap-4 sm:grid-cols-2">
      <Field label="Name" name="name" defaultValue={x.name} required placeholder="e.g. Planned maintenance" />
      <label className="field">
        <span>Product line</span>
        <select name="categoryId" defaultValue={x.categoryId ?? ""} className="input">
          <option value="">All lines</option>
          {lines.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <small>Shown on that line&apos;s page as well as the Services page.</small>
      </label>
      <Field label="Summary" name="summary" defaultValue={x.summary} textarea rows={3} className="sm:col-span-2" hint="Two or three sentences. Avoid promising response times or warranty terms you can't guarantee." />
      <Field label="What's included" name="includes" defaultValue={toLines(x.includes)} textarea rows={5} hint="One item per line." className="sm:col-span-2" />
      <Field label="Order" name="order" type="number" defaultValue={x.order} hint="Lower numbers show first." />
      <div className="flex flex-wrap items-end justify-between gap-4 self-end">
        <Check label="Show on the website" name="published" defaultChecked={x.published} />
        <SubmitButton>
          <Icon name="save" size={16} /> {x.id === "new" ? "Add service" : "Save"}
        </SubmitButton>
      </div>
    </form>
  );
}

export default async function Services({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin("services");
  const [services, lines] = await Promise.all([
    db.query.services.findMany({ orderBy: [asc(schema.services.order), asc(schema.services.name)] }),
    db.query.categories.findMany({ orderBy: [asc(schema.categories.order)], columns: { id: true, name: true } }),
  ]);
  const groups = [...lines.map((l) => ({ id: l.id as string | null, name: l.name })), { id: null, name: "All lines" }]
    .map((g) => ({ ...g, items: services.filter((s) => s.categoryId === g.id) }))
    .filter((g) => g.items.length);
  const blank: Svc = { id: "new", name: "", summary: "", includes: [], order: 9, published: true, categoryId: null };

  return (
    <>
      <AdminHead title="Services" lead="What you do after the sale: installation, maintenance, repairs, training. Each service shows on the Services page and on the page of its product line. Open one to edit it." />
      <Flash sp={await searchParams} />
      {groups.length ? (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.id ?? "all"}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">{g.name}</h2>
              <ul className="space-y-2">
                {g.items.map((x, i) => (
                  <li key={x.id} id={`s-${x.id}`} className="scroll-mt-6">
                    <details className="group rounded-2xl border border-line bg-surface open:border-brand/40">
                      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                          <Icon name="tool" size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{x.name}</span>
                          <span className="block truncate text-sm text-ink-soft">{x.summary || "No summary yet"}</span>
                        </span>
                        <Pill on={x.published} />
                        <Icon name="chevron-down" size={18} className="shrink-0 text-ink-soft transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="border-t border-line-soft p-4 sm:p-5">
                        <ServiceForm x={x} lines={lines} />
                        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line-soft pt-4">
                          <form action={moveItem.bind(null, "services", x.id, "up", "/admin/services")}>
                            <SubmitButton variant="outline" className="!min-h-9 !px-3 text-sm" pendingText="…">
                              <Icon name="arrow-up" size={15} /> Up
                            </SubmitButton>
                          </form>
                          <form action={moveItem.bind(null, "services", x.id, "down", "/admin/services")}>
                            <SubmitButton variant="outline" className="!min-h-9 !px-3 text-sm" pendingText="…">
                              <Icon name="arrow-down" size={15} /> Down
                            </SubmitButton>
                          </form>
                          <form action={togglePublished.bind(null, "services", x.id, "/admin/services")}>
                            <SubmitButton variant="outline" className="!min-h-9 !px-3 text-sm" pendingText="…">
                              <Icon name={x.published ? "eye-off" : "eye"} size={15} /> {x.published ? "Hide" : "Show"}
                            </SubmitButton>
                          </form>
                          <form action={deleteService.bind(null, x.id)} className="ml-auto">
                            <SubmitButton variant="danger" className="!min-h-9 !px-3 text-sm" confirm={`Delete ${x.name}?`} pendingText="Deleting…">
                              <Icon name="trash" size={15} /> Delete
                            </SubmitButton>
                          </form>
                          <span className="sr-only">Position {i + 1}</span>
                        </div>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState icon="tool" title="No services yet">
          Add the first one below.
        </EmptyState>
      )}
      <section className="mt-8 rounded-2xl border border-dashed border-line bg-surface/50 p-4 sm:p-6">
        <h2 className="heading mb-4 flex items-center gap-2 text-lg">
          <Icon name="plus" size={18} /> Add a service
        </h2>
        <ServiceForm x={blank} lines={lines} />
      </section>
    </>
  );
}
