import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { saveCategory } from "@/app/admin/actions/catalogue";
import { AdminHead, Check, Field, Flash, Panel, SubmitButton } from "@/components/admin/ui";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings, mediaUrl } from "@/lib/settings";

const DRAWINGS = ["excavator", "loader", "dozer", "grader", "roller", "forklift", "pallet", "stacker", "compressor", "dispenser", "cascade", "skid", "station"];

export default async function EditLine({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  await requireAdmin("products");
  const { id } = await params;
  const [c, brands, settings] = await Promise.all([
    db.query.categories.findFirst({ where: eq(schema.categories.id, id) }),
    db.query.brands.findMany({ orderBy: [asc(schema.brands.name)] }),
    getSettings(),
  ]);
  if (!c) notFound();
  return (
    <>
      <AdminHead back={{ href: "/admin/catalogue", label: "Products" }} title={c.name} lead={`Shown at /products/${c.slug}`} />
      <Flash sp={await searchParams} />
      <form action={saveCategory.bind(null, c.id)} className="grid gap-6">
        <Panel title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" name="name" defaultValue={c.name} required />
            <label className="field">
              <span>Manufacturer</span>
              <select name="brandId" defaultValue={c.brandId ?? ""} className="input">
                <option value="">None</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Tagline" name="tagline" defaultValue={c.tagline} className="sm:col-span-2" />
            <Field label="Introduction" name="intro" defaultValue={c.intro} textarea className="sm:col-span-2" />
            <label className="field">
              <span>Enquiries go to</span>
              <select name="desk" defaultValue={c.desk} className="input">
                {Object.entries(settings.desks).map(([k, d]) => (
                  <option key={k} value={k}>
                    {d.label}
                  </option>
                ))}
              </select>
              <small>Quotes and general questions for this line. Service bookings and parts go to their own desks unless this is the CNG desk.</small>
            </label>
            <Field label="Order on the site" name="order" type="number" defaultValue={c.order} />
          </div>
        </Panel>
        <Panel title="Sales, service and parts">
          <div className="grid gap-4">
            <Field label="Sales" name="salesBlurb" defaultValue={c.salesBlurb} textarea rows={3} />
            <Field label="On-site service" name="serviceBlurb" defaultValue={c.serviceBlurb} textarea rows={3} />
            <Field label="Parts" name="partsBlurb" defaultValue={c.partsBlurb} textarea rows={3} />
          </div>
        </Panel>
        <Panel title="Picture">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              <span>Line drawing (used when there&apos;s no photo)</span>
              <select name="illustration" defaultValue={c.illustration} className="input">
                {DRAWINGS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Photo (replaces the drawing)</span>
              <input type="file" name="image" accept="image/*" className="input py-2" />
              <small>Use a high-resolution image from the manufacturer&apos;s dealer media kit, cut out on a plain background.</small>
            </label>
            {c.imageId ? (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(c.imageId)!} alt="" className="h-32 rounded border border-line object-contain" />
                <Check label="Remove photo" name="removeImage" />
              </div>
            ) : null}
          </div>
        </Panel>
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Check label="Show on the website" name="published" defaultChecked={c.published} />
            <SubmitButton>Save line</SubmitButton>
          </div>
        </Panel>
      </form>
    </>
  );
}
