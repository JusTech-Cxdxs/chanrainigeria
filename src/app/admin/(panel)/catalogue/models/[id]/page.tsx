import { asc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { saveProduct } from "@/app/admin/actions/catalogue";
import { AdminHead, Check, Field, Flash, Panel, SubmitButton } from "@/components/admin/ui";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { toLines, toSpecs } from "@/lib/lines";
import { mediaUrl } from "@/lib/settings";

export default async function EditModel({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  await requireAdmin("products");
  const { id } = await params;
  const sp = await searchParams;
  const p =
    id === "new"
      ? null
      : await db.query.products.findFirst({ where: eq(schema.products.id, id), with: { family: { with: { category: true } } } });
  if (id !== "new" && !p) notFound();
  const familyId = p?.familyId ?? sp.family;
  const family = familyId ? await db.query.families.findFirst({ where: eq(schema.families.id, familyId), with: { category: true } }) : null;
  if (!family) redirect("/admin/catalogue?error=Choose%20a%20machine%20type%20first");
  const [families, brands] = await Promise.all([
    db.query.families.findMany({ orderBy: [asc(schema.families.name)], columns: { id: true, name: true } }),
    db.query.brands.findMany({ orderBy: [asc(schema.brands.name)] }),
  ]);
  const brandId = p?.brandId ?? family!.category.brandId ?? "";
  const fieldHint = family!.specFields.map((f) => `${f.key}${f.unit ? ` (${f.unit})` : ""}`).join(", ");

  return (
    <>
      <AdminHead
        back={{ href: `/admin/catalogue/types/${family!.id}`, label: family!.name }}
        title={p ? p.name : "New model"}
        lead={p ? `Shown at /products/${family!.category.slug}/${family!.slug}/${p.slug}` : `Adding to ${family!.name}`}
        actions={
          p ? (
            <a href={`/products/${family!.category.slug}/${family!.slug}/${p.slug}`} target="_blank" className="btn btn-outline">
              View on site
            </a>
          ) : null
        }
      />
      <Flash sp={sp} />
      <form action={saveProduct.bind(null, id)} className="grid gap-6">
        <input type="hidden" name="brandSlug" value={brands.find((b) => b.id === brandId)?.slug ?? ""} />
        <Panel title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Model name" name="name" defaultValue={p?.name} required placeholder="e.g. 856H" />
            <label className="field">
              <span>Manufacturer</span>
              <select name="brandId" defaultValue={brandId} className="input">
                <option value="">None</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Machine type</span>
              <select name="familyId" defaultValue={family!.id} className="input">
                {families.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Order" name="order" type="number" defaultValue={p?.order ?? 0} />
            <Field label="Summary" name="summary" defaultValue={p?.summary} textarea rows={2} className="sm:col-span-2" />
            <Field label="Highlights" name="highlights" defaultValue={toLines(p?.highlights)} textarea rows={4} hint="One per line." className="sm:col-span-2" />
          </div>
        </Panel>

        <Panel title="Specifications">
          <Field
            label="Figures"
            name="specs"
            defaultValue={toSpecs(p?.specs ?? {})}
            textarea
            rows={10}
            hint={`One per line, as  key: value. Write plain numbers without units; the unit comes from the machine type. Keys for this type: ${fieldHint || "none set yet"}.`}
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Sources" name="sources" defaultValue={toLines(p?.sources)} textarea rows={3} hint="Links to the official spec sheets, one per line. Staff only." />
            <div className="rounded-md border-l-4 border-accent bg-concrete/60 p-4">
              <Check
                label="Specifications checked"
                name="specsVerified"
                defaultChecked={p?.specsVerified ?? false}
                hint="Tick once every figure matches the manufacturer's official sheet for the configuration you sell. This removes the “indicative” note on the site."
              />
            </div>
          </div>
        </Panel>

        <Panel title="Photos and brochure">
          {p?.imageIds.length ? (
            <ul className="mb-4 flex flex-wrap gap-4">
              {p.imageIds.map((img) => (
                <li key={img} className="grid gap-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl(img)!} alt="" className="h-28 w-40 rounded border border-line object-contain" />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="removeImage" value={img} /> Remove
                  </label>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              <span>Add photos</span>
              <input type="file" name="images" accept="image/*" multiple className="input py-2" />
              <small>High-resolution images from the manufacturer&apos;s dealer media kit. The first photo is used on cards.</small>
            </label>
            <label className="field">
              <span>Brochure (PDF)</span>
              <input type="file" name="brochure" accept="application/pdf" className="input py-2" />
              {p?.brochureId ? (
                <>
                  <a href={mediaUrl(p.brochureId)!} target="_blank" className="text-sm text-brand underline">
                    Current brochure
                  </a>
                  <Check label="Remove brochure" name="removeBrochure" />
                </>
              ) : null}
            </label>
          </div>
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Check label="Show on the website" name="published" defaultChecked={p?.published ?? true} />
            <SubmitButton>{p ? "Save model" : "Create model"}</SubmitButton>
          </div>
        </Panel>
      </form>
    </>
  );
}
