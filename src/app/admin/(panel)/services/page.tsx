import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { saveService } from "@/app/admin/actions/catalogue";
import { AdminHead, Check, Field, Flash, Panel, SubmitButton } from "@/components/admin/ui";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { toLines } from "@/lib/lines";

export default async function Services({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireAdmin("services");
  const [services, lines] = await Promise.all([
    db.query.services.findMany({ orderBy: [asc(schema.services.categoryId), asc(schema.services.order)] }),
    db.query.categories.findMany({ orderBy: [asc(schema.categories.order)], columns: { id: true, name: true } }),
  ]);
  const blank = { id: "new", name: "", summary: "", includes: [] as string[], order: 9, published: true, categoryId: null as string | null };
  return (
    <>
      <AdminHead title="Services" lead="Shown on the Services page and on each product line. Avoid promising response times or warranty terms you can't guarantee." />
      <Flash sp={await searchParams} />
      <div className="space-y-4">
        {[...services, blank].map((x) => (
          <details key={x.id} className="rounded-lg border border-line bg-surface" open={x.id === "new" ? false : undefined}>
            <summary className="cursor-pointer px-5 py-4 font-semibold">
              {x.id === "new" ? "Add a service" : x.name}
              <span className="ml-2 text-sm font-normal text-ink-soft">{lines.find((l) => l.id === x.categoryId)?.name ?? (x.id === "new" ? "" : "All lines")}</span>
            </summary>
            <Panel className="!rounded-t-none !border-0 !border-t">
              <form action={saveService.bind(null, x.id)} className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" name="name" defaultValue={x.name} required />
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
                </label>
                <Field label="Summary" name="summary" defaultValue={x.summary} textarea rows={3} className="sm:col-span-2" />
                <Field label="What's included" name="includes" defaultValue={toLines(x.includes)} textarea rows={5} hint="One per line." className="sm:col-span-2" />
                <Field label="Order" name="order" type="number" defaultValue={x.order} />
                <div className="flex items-end justify-between gap-4">
                  <Check label="Show on the website" name="published" defaultChecked={x.published} />
                  <SubmitButton>{x.id === "new" ? "Add" : "Save"}</SubmitButton>
                </div>
              </form>
            </Panel>
          </details>
        ))}
      </div>
    </>
  );
}
