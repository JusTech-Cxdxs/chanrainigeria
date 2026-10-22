import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteFamily, deleteProduct, moveItem, saveFamily, toggleProduct } from "@/app/admin/actions/catalogue";
import { Crumbs, SaveBar, Section } from "@/components/admin/cms";
import { ItemHistory } from "@/components/admin/ItemHistory";
import { CHECKER } from "@/components/admin/MediaDialog";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { RowsEditor } from "@/components/admin/RowsEditor";
import { AdminHead, Badge, Check, Field, Flash, SubmitButton } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { toLines } from "@/lib/lines";

export const dynamic = "force-dynamic";

const DRAWINGS = ["", "compressor", "dispenser", "cascade", "skid", "station", "excavator", "loader", "dozer", "grader", "skidsteer", "backhoe", "roller", "forklift", "pallet", "stacker", "tractor"];

export default async function EditType({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const me = await requireAdmin("products");
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
            products: { orderBy: [asc(schema.products.order), asc(schema.products.name)], with: { brand: { columns: { name: true } } } },
          },
        });
  if (id !== "new" && !f) notFound();
  const categoryId = f?.categoryId ?? sp.category ?? lines[0]?.id;
  const line = lines.find((l) => l.id === categoryId);
  if (!line) redirect("/admin/catalogue?error=Add%20a%20product%20line%20first.");
  const m = f?.maintenance ?? {};
  const back = `/admin/catalogue/types/${id}`;

  return (
    <>
      <Crumbs items={[{ href: "/admin/catalogue", label: "Products" }, { href: `/admin/catalogue/lines/${line!.id}`, label: line!.name }, { label: f?.name ?? "New machine type" }]} />
      <AdminHead
        title={f?.name ?? "New machine type"}
        lead={f ? `Machine type. On the website at /products/${f.category.slug}/${f.slug}` : "A kind of machine within the line, for example CNG dispensers, wheel loaders or pallet trucks. Its models are added after you create it."}
        actions={
          f ? (
            <a href={`/products/${f.category.slug}/${f.slug}`} target="_blank" rel="noopener" className="btn btn-outline">
              <Icon name="external" size={17} /> View on site
            </a>
          ) : null
        }
      />
      <Flash sp={sp} />

      {f ? (
        <Section
          title="Models"
          icon="forklift"
          hint="The machines you supply of this type. Use the arrows to set the order they appear in."
          className="mb-6"
          aside={
            <Link href={`/admin/catalogue/models/new?family=${f.id}`} className="btn btn-primary !min-h-9 !px-3 text-sm">
              <Icon name="plus" size={16} /> Add model
            </Link>
          }
        >
          {f.products.length ? (
            <ul className="divide-y divide-line-soft">
              {f.products.map((p, i) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <Link href={`/admin/catalogue/models/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3 hover:text-brand">
                    <span className={`grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-line ${CHECKER}`}>
                      {p.imageIds[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/media/${p.imageIds[0]}?w=480`} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <Icon name="image" size={18} className="text-ink-soft" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {p.brand?.name} {p.name}
                      </span>
                      <span className="flex flex-wrap gap-1.5 pt-0.5">
                        {!p.published ? <Badge>Hidden</Badge> : null}
                        {p.specsVerified ? <Badge tone="brand">Specs checked</Badge> : <Badge tone="warn">Specs to check</Badge>}
                      </span>
                    </span>
                  </Link>
                  <span className="flex items-center gap-1">
                    <form action={toggleProduct.bind(null, p.id)}>
                      <SubmitButton variant="outline" className="!min-h-8 !px-2.5 text-xs" pendingText="…">
                        <Icon name={p.published ? "eye-off" : "eye"} size={14} /> {p.published ? "Hide" : "Show"}
                      </SubmitButton>
                    </form>
                    <form action={moveItem.bind(null, "products", p.id, "up", back)}>
                      <button className="grid h-9 w-9 place-items-center rounded-lg hover:bg-concrete disabled:opacity-30" disabled={i === 0} aria-label={`Move ${p.name} up`}>
                        <Icon name="arrow-up" size={16} />
                      </button>
                    </form>
                    <form action={moveItem.bind(null, "products", p.id, "down", back)}>
                      <button className="grid h-9 w-9 place-items-center rounded-lg hover:bg-concrete disabled:opacity-30" disabled={i === f.products.length - 1} aria-label={`Move ${p.name} down`}>
                        <Icon name="arrow-down" size={16} />
                      </button>
                    </form>
                    <form action={deleteProduct.bind(null, p.id)}>
                      <SubmitButton variant="outline" className="!min-h-9 !w-9 !p-0 text-danger" confirm={`Delete ${p.name}? You can bring it back from History.`} pendingText="…">
                        <Icon name="trash" size={15} />
                        <span className="sr-only">Delete {p.name}</span>
                      </SubmitButton>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-soft">
              <Icon name="forklift" size={28} />
              No models yet. Until you add one, the page invites visitors to ask for a recommendation.
            </div>
          )}
        </Section>
      ) : null}

      <form action={saveFamily.bind(null, id)} className="grid gap-6">
        <Section title="Basics" icon="box">
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Field label="Name" name="name" defaultValue={f?.name} required placeholder="e.g. Wheel loaders" hint="Plural, as it appears in the menu." />
            <label className="field">
              <span>Product line</span>
              <select name="categoryId" defaultValue={categoryId} className="input">
                {lines.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <small>Moving it to another line moves its models with it.</small>
            </label>
            <Field label="Summary" name="summary" defaultValue={f?.summary} textarea rows={2} className="sm:col-span-2" hint="One or two sentences shown on cards and at the top of the page." />
          </div>
        </Section>

        <Section title="How it works" icon="cog" hint="A plain explanation for buyers who are new to this kind of machine.">
          <Field label="Explanation" name="howItWorks" defaultValue={f?.howItWorks} textarea rows={10} hint="Leave a blank line between paragraphs. **bold** works." />
          <div className="mt-5 grid gap-1.5">
            <span className="font-semibold">Key components</span>
            <small className="-mt-1 text-[0.8125rem] text-ink-soft">The main parts and what each one does.</small>
            <RowsEditor
              name="keyComponents"
              mode="pairs"
              itemLabel="component"
              columns={[
                { key: "name", label: "Part", placeholder: "e.g. Boom" },
                { key: "role", label: "What it does", placeholder: "e.g. The main lifting arm" },
              ]}
              initial={(f?.keyComponents ?? []).map((c) => ({ name: c.name, role: c.role }))}
            />
          </div>
        </Section>

        <Section title="Buying guidance" icon="checklist">
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Field label="Where it's used" name="applications" defaultValue={toLines(f?.applications)} textarea rows={6} hint="One use per line, e.g. Quarries." />
            <Field label="Choosing the right one" name="choosingTips" defaultValue={toLines(f?.choosingTips)} textarea rows={6} hint="One tip per line." />
          </div>
        </Section>

        <Section title="Specification fields" icon="list" hint="The figures every model of this type has, in the order they show in the spec table. The first two with values also show on model cards.">
          <RowsEditor
            name="specFields"
            mode="specFields"
            itemLabel="field"
            note="Removing a field hides that figure on every model; the numbers are kept if you add it back with the same name."
            columns={[
              { key: "key", label: "Key", hidden: true },
              { key: "label", label: "Name of the figure", placeholder: "e.g. Operating weight" },
              { key: "unit", label: "Unit", placeholder: "e.g. kg", narrow: true },
            ]}
            initial={(f?.specFields ?? []).map((x) => ({ key: x.key, label: x.label, unit: x.unit ?? "" }))}
          />
        </Section>

        <Section title="Maintenance and safety" icon="tool">
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Field label="Daily checks" name="dailyChecks" defaultValue={toLines(m.dailyChecks)} textarea rows={6} hint="One check per line." />
            <Field label="Safety points" name="safety" defaultValue={toLines(f?.safety)} textarea rows={6} hint="One point per line." />
            <div className="grid gap-1.5 sm:col-span-2">
              <span className="font-semibold">Service intervals</span>
              <small className="-mt-1 text-[0.8125rem] text-ink-soft">Separate tasks with a semicolon, e.g. Change engine oil; Replace fuel filter.</small>
              <RowsEditor
                name="intervals"
                mode="intervals"
                itemLabel="interval"
                columns={[
                  { key: "hours", label: "Every (hours)", placeholder: "250", narrow: true },
                  { key: "tasks", label: "Tasks", placeholder: "Grease pins; Check oil level" },
                ]}
                initial={(m.intervals ?? []).map((x) => ({ hours: String(x.hours), tasks: x.tasks.join("; ") }))}
              />
            </div>
            <Field label="Maintenance note" name="maintenanceNote" defaultValue={m.note} textarea rows={2} className="sm:col-span-2" hint="Shown under the intervals, e.g. Always follow the operator's manual for your machine." />
          </div>
        </Section>

        <Section title="Questions people ask" icon="help" hint="Shown as a list of questions with answers. Write the answers you give customers on the phone.">
          <RowsEditor
            name="faq"
            mode="faq"
            itemLabel="question"
            columns={[
              { key: "q", label: "Question", placeholder: "e.g. How often does it need a service?" },
              { key: "a", label: "Answer", textarea: true },
            ]}
            initial={(f?.faq ?? []).map((x) => ({ q: x.q, a: x.a }))}
          />
        </Section>

        <Section title="Picture" icon="image" hint="A photo for the top of the page and the cards. Until one is chosen, a line drawing is used.">
          <div className="grid gap-5">
            <MediaPicker name="imageId" defaultValue={f?.imageId ?? ""} folder="Products" />
            <label className="field max-w-sm">
              <span>Line drawing</span>
              <select name="illustration" defaultValue={f?.illustration ?? ""} className="input">
                {DRAWINGS.map((d) => (
                  <option key={d} value={d}>
                    {d ? d[0].toUpperCase() + d.slice(1) : "Pick automatically"}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Section>

        <SaveBar
          note={
            <span className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Check label="Show on the website" name="published" defaultChecked={f?.published ?? false} />
              <label className="flex items-center gap-2">
                <span className="font-semibold text-ink">Order</span>
                <input name="order" type="number" defaultValue={f?.order ?? 0} className="input !min-h-9 w-20" />
              </label>
            </span>
          }
        >
          <SubmitButton>
            <Icon name="save" size={17} /> {f ? "Save machine type" : "Create machine type"}
          </SubmitButton>
        </SaveBar>
      </form>

      {f ? (
        <>
          <ItemHistory entity="family" id={f.id} viewer={me} />
          <form action={deleteFamily.bind(null, f.id)} className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-line p-4 text-sm">
            <span className="flex-1 text-ink-soft">
              {f.products.length ? "To delete this type, first delete or move its models. To take it off the site for now, untick Show on the website." : "Delete this machine type? You can bring it back from History."}
            </span>
            <SubmitButton variant="danger" confirm={`Delete ${f.name}?`} pendingText="Deleting…">
              <Icon name="trash" size={16} /> Delete type
            </SubmitButton>
          </form>
        </>
      ) : null}
    </>
  );
}
