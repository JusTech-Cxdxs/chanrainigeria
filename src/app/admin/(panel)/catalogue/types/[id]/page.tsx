import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { saveFamily, toggleProduct } from "@/app/admin/actions/catalogue";
import { AdminHead, Badge, Check, Field, Flash, Panel, SubmitButton } from "@/components/admin/ui";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { toFaq, toFields, toIntervals, toLines, toPairs } from "@/lib/lines";
import { mediaUrl } from "@/lib/settings";

const DRAWINGS = ["", "excavator", "loader", "dozer", "grader", "skidsteer", "backhoe", "roller", "forklift", "pallet", "stacker", "tractor", "compressor", "dispenser", "cascade", "skid", "station"];

export default async function EditType({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const user = await requireAdmin("products");
  const { id } = await params;
  const sp = await searchParams;
  const lines = await db.query.categories.findMany({ orderBy: [asc(schema.categories.order)], columns: { id: true, name: true, slug: true } });

  const f =
    id === "new"
      ? null
      : await db.query.families.findFirst({
          where: eq(schema.families.id, id),
          with: {
            category: true,
            products: { orderBy: [asc(schema.products.order)], with: { brand: { columns: { name: true } } } },
          },
        });
  if (id !== "new" && !f) notFound();
  const categoryId = f?.categoryId ?? sp.category ?? lines[0]?.id;
  const m = f?.maintenance ?? {};

  return (
    <>
      <AdminHead
        back={{ href: "/admin/catalogue", label: "Products" }}
        title={f?.name ?? "New machine type"}
        lead={f ? `Shown at /products/${f.category.slug}/${f.slug}` : "For example: excavators, pallet trucks, CNG dispensers."}
        actions={
          f ? (
            <a href={`/products/${f.category.slug}/${f.slug}`} target="_blank" className="btn btn-outline">
              View on site
            </a>
          ) : null
        }
      />
      <Flash sp={sp} />

      {f ? (
        <Panel
          title="Models"
          className="mb-6"
          aside={
            <Link href={`/admin/catalogue/models/new?family=${f.id}`} className="btn btn-primary !min-h-9 text-sm">
              Add model
            </Link>
          }
        >
          {f.products.length ? (
            <ul className="divide-y divide-line-soft">
              {f.products.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <Link href={`/admin/catalogue/models/${p.id}`} className="font-semibold hover:text-brand">
                    {p.brand?.name} {p.name}
                  </Link>
                  <span className="ml-auto flex items-center gap-2">
                    {p.specsVerified ? <Badge tone="brand">Specs checked</Badge> : <Badge tone="warn">Specs to check</Badge>}
                    {!p.published ? <Badge>Hidden</Badge> : null}
                    <form action={toggleProduct.bind(null, p.id)}>
                      <SubmitButton variant="outline" className="!min-h-8 !px-3 text-sm" pendingText="…">
                        {p.published ? "Hide" : "Show"}
                      </SubmitButton>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-soft">No models yet. The page invites visitors to ask for a recommendation.</p>
          )}
        </Panel>
      ) : null}

      <form action={saveFamily.bind(null, id)} className="grid gap-6">
        <Panel title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" name="name" defaultValue={f?.name} required />
            <label className="field">
              <span>Product line</span>
              <select name="categoryId" defaultValue={categoryId} className="input">
                {lines.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Summary" name="summary" defaultValue={f?.summary} textarea rows={2} className="sm:col-span-2" />
          </div>
        </Panel>

        <Panel title="How it works">
          <Field
            label="Explanation"
            name="howItWorks"
            defaultValue={f?.howItWorks}
            textarea
            rows={12}
            hint="Plain text. Leave a blank line between paragraphs. **bold** works."
          />
          <div className="mt-4">
            <Field label="Key components" name="keyComponents" defaultValue={toPairs(f?.keyComponents ?? [])} textarea rows={6} hint="One per line, as  Name: what it does" />
          </div>
        </Panel>

        <Panel title="Buying guidance">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Where it's used" name="applications" defaultValue={toLines(f?.applications)} textarea rows={6} hint="One per line." />
            <Field label="Choosing the right one" name="choosingTips" defaultValue={toLines(f?.choosingTips)} textarea rows={6} hint="One tip per line." />
          </div>
        </Panel>

        <Panel title="Specifications shown for models">
          <Field
            label="Specification fields"
            name="specFields"
            defaultValue={toFields(f?.specFields ?? [])}
            textarea
            rows={8}
            hint="One per line, as  key | Label | unit. The first two with values show on the model cards."
          />
        </Panel>

        <Panel title="Maintenance and safety">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Daily checks" name="dailyChecks" defaultValue={toLines(m.dailyChecks)} textarea rows={6} hint="One per line." />
            <Field label="Service intervals" name="intervals" defaultValue={toIntervals(m)} textarea rows={6} hint="One per line, as  250: task; task; task" />
            <Field label="Maintenance note" name="maintenanceNote" defaultValue={m.note} textarea rows={2} className="sm:col-span-2" />
            <Field label="Safety points" name="safety" defaultValue={toLines(f?.safety)} textarea rows={6} hint="One per line." className="sm:col-span-2" />
          </div>
        </Panel>

        <Panel title="Questions people ask">
          <Field label="FAQ" name="faq" defaultValue={toFaq(f?.faq ?? [])} textarea rows={10} hint="Write  Q: question  on one line and  A: answer  on the next. Leave a blank line between questions." />
        </Panel>

        <Panel title="Picture">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              <span>Line drawing</span>
              <select name="illustration" defaultValue={f?.illustration ?? ""} className="input">
                {DRAWINGS.map((d) => (
                  <option key={d} value={d}>
                    {d || "Pick automatically"}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Photo</span>
              <input type="file" name="image" accept="image/*" className="input py-2" />
            </label>
            {f?.imageId ? (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(f.imageId)!} alt="" className="h-32 rounded border border-line object-contain" />
                <Check label="Remove photo" name="removeImage" />
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              <Check label="Show on the website" name="published" defaultChecked={f?.published ?? false} />
              <label className="flex items-center gap-2">
                <span className="font-semibold">Order</span>
                <input name="order" type="number" defaultValue={f?.order ?? 0} className="input w-24" />
              </label>
            </div>
            <SubmitButton>{f ? "Save machine type" : "Create machine type"}</SubmitButton>
          </div>
        </Panel>
      </form>
    </>
  );
}
