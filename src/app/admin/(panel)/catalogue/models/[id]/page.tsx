import { asc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { deleteProduct, saveProduct } from "@/app/admin/actions/catalogue";
import { Crumbs, SaveBar, Section } from "@/components/admin/cms";
import { ItemHistory } from "@/components/admin/ItemHistory";
import { MediaPicker, MultiMediaPicker } from "@/components/admin/MediaPicker";
import { AdminHead, Check, Field, Flash, SubmitButton } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { toLines, toSpecs } from "@/lib/lines";

export const dynamic = "force-dynamic";

export default async function EditModel({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const me = await requireAdmin("products");
  const { id } = await params;
  const sp = await searchParams;
  const p = id === "new" ? null : await db.query.products.findFirst({ where: eq(schema.products.id, id) });
  if (id !== "new" && !p) notFound();
  const familyId = p?.familyId ?? sp.family;
  const family = familyId ? await db.query.families.findFirst({ where: eq(schema.families.id, familyId), with: { category: true } }) : null;
  if (!family) redirect("/admin/catalogue?error=Choose%20a%20machine%20type%20first");
  const [families, brands] = await Promise.all([
    db.query.families.findMany({ orderBy: [asc(schema.families.name)], columns: { id: true, name: true }, with: { category: { columns: { name: true } } } }),
    db.query.brands.findMany({ orderBy: [asc(schema.brands.name)] }),
  ]);
  const fam = family!;
  const brandId = p?.brandId ?? fam.category.brandId ?? "";
  const specs = p?.specs ?? {};
  const known = new Set(fam.specFields.map((x) => x.key));
  const extra = Object.fromEntries(Object.entries(specs).filter(([k]) => !known.has(k)));
  const url = p ? `/products/${fam.category.slug}/${fam.slug}/${p.slug}` : null;

  return (
    <>
      <Crumbs
        items={[
          { href: "/admin/catalogue", label: "Products" },
          { href: `/admin/catalogue/lines/${fam.categoryId}`, label: fam.category.name },
          { href: `/admin/catalogue/types/${fam.id}`, label: fam.name },
          { label: p?.name ?? "New model" },
        ]}
      />
      <AdminHead
        title={p ? p.name : "Add a model"}
        lead={url ? `Model. On the website at ${url}` : `A new ${fam.name.toLowerCase().replace(/s$/, "")} model. Fill in what you have; you can come back to add photos and figures.`}
        actions={
          url ? (
            <a href={url} target="_blank" rel="noopener" className="btn btn-outline">
              <Icon name="external" size={17} /> View on site
            </a>
          ) : null
        }
      />
      <Flash sp={sp} />
      <form action={saveProduct.bind(null, id)} className="grid gap-6">
        <Section title="Basics" icon="forklift">
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Field label="Model name" name="name" defaultValue={p?.name} required placeholder="e.g. 936E or EL25 PRO" hint="As the manufacturer writes it, without the brand name." />
            <label className="field">
              <span>Brand</span>
              <select name="brandId" defaultValue={brandId} className="input">
                <option value="">None</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <small>Shown before the model name, e.g. LiuGong 936E.</small>
            </label>
            <label className="field">
              <span>Machine type</span>
              <select name="familyId" defaultValue={fam.id} className="input">
                {families.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.category.name})
                  </option>
                ))}
              </select>
              <small>Where this model is listed.</small>
            </label>
            <Field label="Order" name="order" type="number" defaultValue={p?.order ?? 0} hint="Lower numbers show first. You can also use the arrows on the machine type." />
            <Field label="Size group" name="sizeClass" defaultValue={p?.sizeClass} className="sm:col-span-2" hint="Models with the same size group sit together under that heading, e.g. Large excavators (over 40 tonnes). Leave empty for none." />
            <Field label="Summary" name="summary" defaultValue={p?.summary} textarea rows={2} className="sm:col-span-2" hint="One or two sentences on what it is best at. Shown on cards and at the top of the page." />
            <Field label="Highlights" name="highlights" defaultValue={toLines(p?.highlights)} textarea rows={4} className="sm:col-span-2" hint="One selling point per line, e.g. Cummins engine, Tier 3. Three to five works best." />
          </div>
        </Section>

        <Section title="Photos" icon="images" hint="Use high-resolution photos from the manufacturer's dealer media kit. The first photo is the main one, used on cards; use the arrows to change the order.">
          <MultiMediaPicker name="imageIds" defaultValue={p?.imageIds ?? []} folder="Products" />
        </Section>

        <Section title="Specifications" icon="list" hint={`The figures for this model. Units come from the machine type (${fam.name}), so write plain numbers. Leave a box empty if you don't have the figure.`}>
          {fam.specFields.length ? (
            <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fam.specFields.map((sf) => (
                <label key={sf.key} className="field">
                  <span>{sf.label}</span>
                  <span className="relative">
                    <input name={`spec_${sf.key}`} defaultValue={specs[sf.key] !== undefined ? String(specs[sf.key]) : ""} className={`input ${sf.unit ? "!pr-14" : ""}`} inputMode="text" />
                    {sf.unit ? <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-soft">{sf.unit}</span> : null}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-line px-4 py-4 text-sm text-ink-soft">
              This machine type has no specification fields yet. Add them on the{" "}
              <a href={`/admin/catalogue/types/${fam.id}`} className="font-semibold text-brand">
                {fam.name}
              </a>{" "}
              page so every model shows the same figures.
            </p>
          )}
          <details className="mt-5 rounded-xl border border-line p-3" open={Object.keys(extra).length > 0}>
            <summary className="cursor-pointer text-sm font-semibold">Other figures not in the list above</summary>
            <Field
              label="Other figures"
              name="specsExtra"
              defaultValue={toSpecs(extra)}
              textarea
              rows={4}
              className="mt-3"
              hint="One per line as  name: value, e.g. tyreSize: 23.5-25. These are kept but only show if the machine type gets a matching field."
            />
          </details>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Sources" name="sources" defaultValue={toLines(p?.sources)} textarea rows={3} hint="Links to the official spec sheets, one per line. Only staff see these." />
            <div className="rounded-xl border-l-4 border-accent bg-concrete/60 p-4">
              <Check
                label="Specifications checked"
                name="specsVerified"
                defaultChecked={p?.specsVerified ?? false}
                hint="Tick once every figure matches the manufacturer's official sheet for the configuration you sell. This removes the indicative note on the site."
              />
            </div>
          </div>
        </Section>

        <Section title="Brochure" icon="file" hint="A PDF visitors can download from the model page. Leave empty if there isn't one.">
          <MediaPicker name="brochureId" defaultValue={p?.brochureId ?? ""} accept="pdf" folder="Documents" />
        </Section>

        <SaveBar note={<Check label="Show on the website" name="published" defaultChecked={p?.published ?? true} />}>
          <SubmitButton>
            <Icon name="save" size={17} /> {p ? "Save model" : "Create model"}
          </SubmitButton>
        </SaveBar>
      </form>
      {p ? (
        <>
          <ItemHistory entity="product" id={p.id} viewer={me} />
          <form action={deleteProduct.bind(null, p.id)} className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-line p-4 text-sm">
            <span className="flex-1 text-ink-soft">Delete this model? Enquiries that mention it keep their text. You can bring it back from History. To take it off the site for now, untick Show on the website instead.</span>
            <SubmitButton variant="danger" confirm={`Delete ${p.name}?`} pendingText="Deleting…">
              <Icon name="trash" size={16} /> Delete model
            </SubmitButton>
          </form>
        </>
      ) : null}
    </>
  );
}
