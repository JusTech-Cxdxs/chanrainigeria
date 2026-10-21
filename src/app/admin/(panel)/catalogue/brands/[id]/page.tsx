import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { deleteBrand, saveBrand } from "@/app/admin/actions/catalogue";
import { Crumbs, SaveBar, Section } from "@/components/admin/cms";
import { ItemHistory } from "@/components/admin/ItemHistory";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { AdminHead, Check, Field, Flash, SubmitButton } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { db, schema } from "@/db";
import { brandLogo } from "@/lib/brand-logos";
import { requireAdmin } from "@/lib/auth";
import { toLines } from "@/lib/lines";

export const dynamic = "force-dynamic";

const RELATIONSHIPS = ["Authorised dealer", "Authorised distributor", "Sole distributor", "Service partner", "Parts supplier"];

export default async function EditBrand({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const me = await requireAdmin("brands");
  const { id } = await params;
  const b = id === "new" ? null : await db.query.brands.findFirst({ where: eq(schema.brands.id, id) });
  if (id !== "new" && !b) notFound();

  return (
    <>
      <Crumbs items={[{ href: "/admin/catalogue", label: "Products" }, { href: "/admin/catalogue/brands", label: "Brands" }, { label: b?.name ?? "New brand" }]} />
      <AdminHead title={b?.name ?? "Add a brand"} lead={b ? "Changes show on the website and in new emails straight away." : "A manufacturer you sell or service. You can link product lines and models to it afterwards."} />
      <Flash sp={await searchParams} />
      <form action={saveBrand.bind(null, id)} className="grid gap-6">
        <Section title="About the brand" icon="verified">
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Field label="Name" name="name" defaultValue={b?.name} required placeholder="e.g. LiuGong" hint="As the manufacturer writes it." />
            <label className="field">
              <span>Your relationship with them</span>
              <input name="relationship" list="relationships" defaultValue={b?.relationship ?? "Authorised dealer"} className="input" maxLength={60} />
              <datalist id="relationships">
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
              <small>Shown under the logo, e.g. &quot;Authorised dealer&quot;. Only claim what your agreement with them says.</small>
            </label>
            <Field label="Website" name="website" defaultValue={b?.website} placeholder="https://www.liugong.com" hint="The manufacturer's official site. Leave empty if you'd rather not link to it." />
            <Field label="Order" name="order" type="number" defaultValue={b?.order ?? 9} hint="Lower numbers show first. You can also use the arrows on the Brands list." />
            <Field label="Short about" name="about" defaultValue={b?.about} textarea rows={3} className="sm:col-span-2" hint="One or two sentences about the manufacturer. Shown on product line pages." />
            <Field label="Highlights" name="highlights" defaultValue={toLines(b?.highlights)} textarea rows={4} className="sm:col-span-2" hint="One fact per line, e.g. Founded in 1958. Keep each one short and checkable." />
          </div>
        </Section>
        <Section title="Logo" icon="image" hint="Use the official logo, ideally an SVG or a PNG with a transparent background. It is shown at about 40 pixels high, on light and dark backgrounds.">
          <MediaPicker name="logoId" defaultValue={b?.logoId ?? ""} folder="Brands and logos" originalUrl={b ? (brandLogo({ slug: b.slug }) ?? undefined) : undefined} />
        </Section>
        <Section title="Where it appears" icon="eye">
          <div className="grid gap-4">
            <Check label="Show on the website" name="showOnHome" defaultChecked={b?.showOnHome ?? true} hint="In the brands strip on the home page and on product line pages." />
            <Check label="Show in emails" name="showInEmail" defaultChecked={b?.showInEmail ?? true} hint="In the &quot;Authorised dealer for&quot; strip at the foot of every email the site sends." />
          </div>
        </Section>
        <SaveBar note={b ? "Saving keeps the previous version in History." : "The brand is added as soon as you save."}>
          <SubmitButton>
            <Icon name="save" size={17} /> {b ? "Save brand" : "Add brand"}
          </SubmitButton>
        </SaveBar>
      </form>
      {b ? (
        <>
          <ItemHistory entity="brand" id={b.id} viewer={me} />
          <form action={deleteBrand.bind(null, b.id)} className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-line p-4 text-sm">
            <span className="flex-1 text-ink-soft">Delete this brand? Models and lines linked to it stay, without a brand. You can bring it back from History.</span>
            <SubmitButton variant="danger" confirm={`Delete ${b.name}?`} pendingText="Deleting…">
              <Icon name="trash" size={16} /> Delete brand
            </SubmitButton>
          </form>
        </>
      ) : null}
    </>
  );
}
