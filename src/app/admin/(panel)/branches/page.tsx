import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { saveBranch } from "@/app/admin/actions/content";
import { AdminHead, Check, Field, Flash, Panel, SubmitButton } from "@/components/admin/ui";
import { NG_STATES } from "@/lib/ng-states";
import { db, schema } from "@/db";
import { can, requireAdmin } from "@/lib/auth";

export default async function Branches({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireAdmin();
  if (!can.content(user.role)) redirect("/admin?denied=1");
  const rows = await db.query.branches.findMany({ orderBy: [asc(schema.branches.order)] });
  const blank = { id: "new", name: "", address: "", city: "", state: "Lagos", phone: "", email: "", mapUrl: "", hours: "", isHeadOffice: false, active: true, order: 9 };
  return (
    <>
      <AdminHead title="Locations" lead="Offices, yards and service bases. Shown on the contact page, in the footer and to Enyo." />
      <Flash sp={await searchParams} />
      <div className="space-y-6">
        {[...rows, blank].map((b) => (
          <Panel key={b.id} title={b.id === "new" ? "Add a location" : b.name}>
            <form action={saveBranch.bind(null, b.id)} className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" name="name" defaultValue={b.name} required placeholder="e.g. Isolo, Abuja service base" />
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
              <Field label="Phone" name="phone" defaultValue={b.phone} />
              <Field label="Email" name="email" type="email" defaultValue={b.email} />
              <Field label="Google Maps link" name="mapUrl" defaultValue={b.mapUrl} placeholder="https://maps.app.goo.gl/…" />
              <Field label="Opening hours" name="hours" defaultValue={b.hours} placeholder="Mon–Fri 8:00–17:00" />
              <Field label="Order" name="order" type="number" defaultValue={b.order} />
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-2">
                  <Check label="Head office" name="isHeadOffice" defaultChecked={b.isHeadOffice} />
                  <Check label="Show on the website" name="active" defaultChecked={b.active} />
                </div>
                <SubmitButton>{b.id === "new" ? "Add location" : "Save"}</SubmitButton>
              </div>
            </form>
          </Panel>
        ))}
      </div>
    </>
  );
}
