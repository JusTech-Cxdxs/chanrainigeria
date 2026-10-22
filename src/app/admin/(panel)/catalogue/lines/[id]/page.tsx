import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCategory, saveCategory } from "@/app/admin/actions/catalogue";
import { Crumbs, SaveBar, Section } from "@/components/admin/cms";
import { ItemHistory } from "@/components/admin/ItemHistory";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { AdminHead, Check, Field, Flash, SubmitButton } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { plural } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const DRAWINGS = ["compressor", "dispenser", "cascade", "skid", "station", "excavator", "loader", "dozer", "grader", "roller", "forklift", "pallet", "stacker"];

export default async function EditLine({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const me = await requireAdmin("products");
  const { id } = await params;
  const [c, brands, settings] = await Promise.all([
    db.query.categories.findFirst({
      where: eq(schema.categories.id, id),
      with: { families: { orderBy: [asc(schema.families.order), asc(schema.families.name)], with: { products: { columns: { id: true } } } } },
    }),
    db.query.brands.findMany({ orderBy: [asc(schema.brands.name)] }),
    getSettings(),
  ]);
  if (!c) notFound();
  return (
    <>
      <Crumbs items={[{ href: "/admin/catalogue", label: "Products" }, { label: c.name }]} />
      <AdminHead
        title={c.name}
        lead={`Product line. On the website at /products/${c.slug}`}
        actions={
          <a href={`/products/${c.slug}`} target="_blank" rel="noopener" className="btn btn-outline">
            <Icon name="external" size={17} /> View on site
          </a>
        }
      />
      <Flash sp={await searchParams} />

      <Section
        title="Machine types in this line"
        icon="box"
        className="mb-6"
        aside={
          <Link href={`/admin/catalogue/types/new?category=${c.id}`} className="btn btn-primary !min-h-9 !px-3 text-sm">
            <Icon name="plus" size={16} /> Add machine type
          </Link>
        }
      >
        {c.families.length ? (
          <ul className="divide-y divide-line-soft">
            {c.families.map((f) => (
              <li key={f.id}>
                <Link href={`/admin/catalogue/types/${f.id}`} className="flex items-center gap-3 py-2.5 hover:text-brand">
                  <Icon name="box" size={16} className="text-ink-soft" />
                  <span className="flex-1 font-semibold">{f.name}</span>
                  <span className="text-sm text-ink-soft num">{plural(f.products.length, "model")}</span>
                  {!f.published ? <span className="text-xs font-semibold text-ink-soft">Hidden</span> : null}
                  <Icon name="chevron-right" size={16} className="text-ink-soft" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-soft">None yet. Add the first type of machine you sell in this line.</p>
        )}
      </Section>

      <form action={saveCategory.bind(null, c.id)} className="grid gap-6">
        <Section title="Basics" icon="package">
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Field label="Name" name="name" defaultValue={c.name} required hint="Shown in the menu and as the page heading." />
            <label className="field">
              <span>Brand</span>
              <select name="brandId" defaultValue={c.brandId ?? ""} className="input">
                <option value="">None</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <small>The manufacturer whose logo shows on this line&apos;s page.</small>
            </label>
            <Field label="Tagline" name="tagline" defaultValue={c.tagline} className="sm:col-span-2" hint="One short line under the heading, about 80 characters." />
            <Field label="Introduction" name="intro" defaultValue={c.intro} textarea className="sm:col-span-2" hint="Two or three sentences on what the line covers and who it is for." />
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
            <Field label="Order on the site" name="order" type="number" defaultValue={c.order} hint="Lower numbers show first. You can also use the arrows on the Products page." />
          </div>
        </Section>
        <Section title="Sales, service and parts" icon="tool" hint="The three short paragraphs in the table on this line's page.">
          <div className="grid gap-4">
            <Field label="Sales" name="salesBlurb" defaultValue={c.salesBlurb} textarea rows={3} />
            <Field label="On-site service" name="serviceBlurb" defaultValue={c.serviceBlurb} textarea rows={3} />
            <Field label="Parts" name="partsBlurb" defaultValue={c.partsBlurb} textarea rows={3} />
          </div>
        </Section>
        <Section title="Picture" icon="image" hint="A photo shows at the top of the line page and on the home page cards. Until one is chosen, a line drawing is used.">
          <div className="grid gap-5">
            <MediaPicker name="imageId" defaultValue={c.imageId ?? ""} folder="Products" />
            <label className="field max-w-sm">
              <span>Line drawing (used when there is no photo)</span>
              <select name="illustration" defaultValue={c.illustration} className="input">
                {DRAWINGS.map((d) => (
                  <option key={d} value={d}>
                    {d[0].toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Section>
        <SaveBar note={<Check label="Show on the website" name="published" defaultChecked={c.published} />}>
          <SubmitButton>
            <Icon name="save" size={17} /> Save line
          </SubmitButton>
        </SaveBar>
      </form>

      <ItemHistory entity="category" id={c.id} viewer={me} />
      <form action={deleteCategory.bind(null, c.id)} className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-line p-4 text-sm">
        <span className="flex-1 text-ink-soft">
          {c.families.length ? "To delete this line, first delete or move its machine types. To take it off the site for now, untick Show on the website." : "Delete this line? You can bring it back from History."}
        </span>
        <SubmitButton variant="danger" confirm={`Delete ${c.name}?`} pendingText="Deleting…">
          <Icon name="trash" size={16} /> Delete line
        </SubmitButton>
      </form>
    </>
  );
}
