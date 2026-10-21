import { asc } from "drizzle-orm";
import { deleteBranch, moveBranch, saveBranch } from "@/app/admin/actions/content";
import { EmptyState, Pill } from "@/components/admin/cms";
import { AdminHead, Check, Field, Flash, SubmitButton } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { NG_STATES } from "@/lib/ng-states";

export const dynamic = "force-dynamic";

type Branch = { id: string; name: string; address: string; city: string; state: string; phone: string | null; email: string | null; mapUrl: string | null; hours: string | null; isHeadOffice: boolean; active: boolean; order: number };

function BranchForm({ b }: { b: Branch }) {
  return (
    <form action={saveBranch.bind(null, b.id)} className="grid items-start gap-4 sm:grid-cols-2">
      <Field label="Name" name="name" defaultValue={b.name} required placeholder="e.g. Isolo head office, Abuja service base" />
      <Field label="Street address" name="address" defaultValue={b.address} required />
      <Field label="Town or area" name="city" defaultValue={b.city} required />
      <label className="field">
        <span>State</span>
        <select name="state" defaultValue={b.state} className="input">
          {NG_STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <Field label="Phone" name="phone" defaultValue={b.phone} placeholder="0911 186 7252" hint="Leave empty to use the main company number." />
      <Field label="Email" name="email" type="email" defaultValue={b.email} />
      <Field label="Google Maps link" name="mapUrl" defaultValue={b.mapUrl} placeholder="https://maps.app.goo.gl/…" hint="In Google Maps, tap Share and copy the link." />
      <Field label="Opening hours" name="hours" defaultValue={b.hours} placeholder="Mon to Fri 8:00 to 17:00" />
      <Field label="Order" name="order" type="number" defaultValue={b.order} hint="Lower numbers show first." />
      <div className="flex flex-wrap items-end justify-between gap-4 self-end">
        <div className="space-y-2">
          <Check label="Head office" name="isHeadOffice" defaultChecked={b.isHeadOffice} />
          <Check label="Show on the website" name="active" defaultChecked={b.active} />
        </div>
        <SubmitButton>
          <Icon name="save" size={16} /> {b.id === "new" ? "Add location" : "Save"}
        </SubmitButton>
      </div>
    </form>
  );
}

export default async function Branches({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin("locations");
  const rows = await db.query.branches.findMany({ orderBy: [asc(schema.branches.order), asc(schema.branches.name)] });
  const blank: Branch = { id: "new", name: "", address: "", city: "", state: "Lagos", phone: "", email: "", mapUrl: "", hours: "", isHeadOffice: false, active: true, order: 9 };
  return (
    <>
      <AdminHead title="Locations" lead="Offices, yards and service bases. Shown on the Contact page, in the footer and to Enyo, the website assistant. Open one to edit it." />
      <Flash sp={await searchParams} />
      {rows.length ? (
        <ul className="space-y-2">
          {rows.map((b, i) => (
            <li key={b.id}>
              <details className="group rounded-2xl border border-line bg-surface open:border-brand/40">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                    <Icon name={b.isHeadOffice ? "building" : "pin"} size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {b.name}
                      {b.isHeadOffice ? <span className="ml-2 text-xs font-semibold text-brand">Head office</span> : null}
                    </span>
                    <span className="block truncate text-sm text-ink-soft">
                      {b.address}, {b.city}, {b.state}
                    </span>
                  </span>
                  <Pill on={b.active} />
                  <Icon name="chevron-down" size={18} className="shrink-0 text-ink-soft transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-line-soft p-4 sm:p-5">
                  <BranchForm b={b} />
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line-soft pt-4">
                    <form action={moveBranch.bind(null, b.id, "up")}>
                      <SubmitButton variant="outline" className="!min-h-9 !px-3 text-sm" pendingText="…">
                        <Icon name="arrow-up" size={15} /> Up
                      </SubmitButton>
                    </form>
                    <form action={moveBranch.bind(null, b.id, "down")}>
                      <SubmitButton variant="outline" className="!min-h-9 !px-3 text-sm" pendingText="…">
                        <Icon name="arrow-down" size={15} /> Down
                      </SubmitButton>
                    </form>
                    <form action={deleteBranch.bind(null, b.id)} className="ml-auto">
                      <SubmitButton variant="danger" className="!min-h-9 !px-3 text-sm" confirm={`Delete ${b.name}?`} pendingText="Deleting…">
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
      ) : (
        <EmptyState icon="pin" title="No locations yet">
          Add the head office first.
        </EmptyState>
      )}
      <section className="mt-8 rounded-2xl border border-dashed border-line bg-surface/50 p-4 sm:p-6">
        <h2 className="heading mb-4 flex items-center gap-2 text-lg">
          <Icon name="plus" size={18} /> Add a location
        </h2>
        <BranchForm b={blank} />
      </section>
    </>
  );
}
