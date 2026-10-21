import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { saveBrand } from "@/app/admin/actions/catalogue";
import { AdminHead, Check, Field, Flash, Panel, SubmitButton } from "@/components/admin/ui";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { toLines } from "@/lib/lines";
import { mediaUrl } from "@/lib/settings";

export default async function Brands({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireAdmin("brands");
  const brands = await db.query.brands.findMany({ orderBy: [asc(schema.brands.order)] });
  const blank = { id: "new", name: "", website: "", about: "", highlights: [] as string[], showOnHome: true, order: 9, logoId: null as string | null };
  return (
    <>
      <AdminHead
        back={{ href: "/admin/catalogue", label: "Products" }}
        title="Manufacturers"
        lead="Shown in “Equipment we supply” and on each product line. Upload logos from the manufacturer's dealer kit and follow their logo rules."
      />
      <Flash sp={await searchParams} />
      <div className="space-y-6">
        {[...brands, blank].map((b) => (
          <Panel key={b.id} title={b.id === "new" ? "Add a manufacturer" : b.name}>
            <form action={saveBrand.bind(null, b.id)} className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" name="name" defaultValue={b.name} required />
              <Field label="Website" name="website" type="url" defaultValue={b.website} />
              <Field label="About" name="about" defaultValue={b.about} textarea className="sm:col-span-2" />
              <Field label="Highlights" name="highlights" defaultValue={toLines(b.highlights)} textarea hint="One per line." className="sm:col-span-2" />
              <label className="field">
                <span>Logo</span>
                <input type="file" name="logo" accept="image/*" className="input py-2" />
                {b.logoId ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaUrl(b.logoId)!} alt="" className="mt-2 h-10 w-auto" />
                    <Check label="Remove logo" name="removeLogo" />
                  </>
                ) : null}
              </label>
              <Field label="Order" name="order" type="number" defaultValue={b.order} />
              <div className="flex flex-wrap items-center justify-between gap-4 sm:col-span-2">
                <Check label="Show on the home page" name="showOnHome" defaultChecked={b.showOnHome} />
                <SubmitButton>{b.id === "new" ? "Add manufacturer" : "Save"}</SubmitButton>
              </div>
            </form>
          </Panel>
        ))}
      </div>
    </>
  );
}
