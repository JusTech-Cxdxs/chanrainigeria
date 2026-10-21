import { desc } from "drizzle-orm";
import Link from "next/link";
import { deleteTestimonial, reviewTestimonial, saveTestimonial } from "@/app/admin/actions/testimonials";
import { AdminHead, Badge, Check, Empty, Field, Flash, Panel, SubmitButton } from "@/components/admin/ui";
import { Stars } from "@/components/site/Testimonials";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";

const TABS = [
  ["PENDING", "Waiting for approval"],
  ["APPROVED", "On the website"],
  ["REJECTED", "Rejected"],
] as const;

export default async function TestimonialsAdmin({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = (TABS.find(([k]) => k === sp.tab)?.[0] ?? "PENDING") as (typeof TABS)[number][0];
  const all = await db.query.testimonials.findMany({ orderBy: [desc(schema.testimonials.createdAt)] });
  const rows = all.filter((t) => t.status === tab);
  const count = (k: string) => all.filter((t) => t.status === k).length;

  return (
    <>
      <AdminHead
        title="Testimonials"
        lead="Visitors share their experience on the website. Nothing appears on the site until someone here approves it."
        actions={
          <a href="/testimonials" target="_blank" rel="noopener" className="btn btn-outline">
            View on site
          </a>
        }
      />
      <Flash sp={sp} />
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {TABS.map(([k, label]) => (
          <Link key={k} href={`/admin/testimonials?tab=${k}`} className={`btn !min-h-9 shrink-0 text-sm ${tab === k ? "btn-primary" : "btn-outline"}`}>
            {label} <span className="num opacity-80">{count(k)}</span>
          </Link>
        ))}
      </div>

      {rows.length ? (
        <ul className="grid gap-4 lg:grid-cols-2">
          {rows.map((t) => (
            <li key={t.id} id={t.id} className={`rounded-2xl border bg-surface p-5 ${sp.focus === t.id ? "border-brand ring-2 ring-brand/20" : "border-line"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <Stars n={t.rating} />
                {t.isExample ? <Badge>Example</Badge> : null}
                <Badge tone={t.source === "website" ? "brand" : "neutral"}>{t.source === "website" ? "From the website" : "Added by staff"}</Badge>
                <span className="ml-auto text-sm text-ink-soft">{formatDate(t.createdAt, true)}</span>
              </div>
              <blockquote className="mt-3 whitespace-pre-wrap">{t.quote}</blockquote>
              <p className="mt-3 text-sm">
                <span className="font-semibold">{t.name}</span>
                <span className="text-ink-soft">{[t.role, t.company].filter(Boolean).map((x) => `, ${x}`).join("")}</span>
                {t.email ? <span className="block text-ink-soft">{t.email}</span> : null}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line-soft pt-4">
                {t.status !== "APPROVED" ? (
                  <form action={reviewTestimonial.bind(null, t.id, "APPROVED")}>
                    <SubmitButton pendingText="…">Approve</SubmitButton>
                  </form>
                ) : (
                  <form action={reviewTestimonial.bind(null, t.id, "PENDING")}>
                    <SubmitButton variant="outline" pendingText="…">
                      Take off the site
                    </SubmitButton>
                  </form>
                )}
                {t.status !== "REJECTED" ? (
                  <form action={reviewTestimonial.bind(null, t.id, "REJECTED")}>
                    <SubmitButton variant="outline" pendingText="…">
                      Reject
                    </SubmitButton>
                  </form>
                ) : null}
                <form action={deleteTestimonial.bind(null, t.id)}>
                  <SubmitButton variant="danger" confirm="Delete this testimonial permanently?" pendingText="…">
                    Delete
                  </SubmitButton>
                </form>
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-brand">Edit</summary>
                <form action={saveTestimonial.bind(null, t.id)} className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Name" name="name" defaultValue={t.name} required />
                  <Field label="Rating (1 to 5)" name="rating" type="number" defaultValue={t.rating} />
                  <Field label="Job title" name="role" defaultValue={t.role} />
                  <Field label="Company" name="company" defaultValue={t.company} />
                  <Field label="Testimonial" name="quote" defaultValue={t.quote} textarea rows={4} className="sm:col-span-2" />
                  <Field label="Order" name="order" type="number" defaultValue={t.order} />
                  <div className="flex items-end justify-between gap-3">
                    <Check label="Example (shows an Example label)" name="isExample" defaultChecked={t.isExample} />
                    <SubmitButton>Save</SubmitButton>
                  </div>
                </form>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>{tab === "PENDING" ? "Nothing waiting. New testimonials from the website appear here." : "None here yet."}</Empty>
      )}

      <Panel title="Add a testimonial" className="mt-8">
        <p className="-mt-2 mb-4 text-sm text-ink-soft">For feedback received by email, letter or in person, with the customer&apos;s permission. It goes straight onto the site.</p>
        <form action={saveTestimonial.bind(null, "new")} className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" name="name" required />
          <Field label="Rating (1 to 5)" name="rating" type="number" defaultValue={5} />
          <Field label="Job title" name="role" />
          <Field label="Company" name="company" />
          <Field label="Testimonial" name="quote" textarea rows={4} required className="sm:col-span-2" />
          <div className="sm:col-span-2">
            <SubmitButton>Add and publish</SubmitButton>
          </div>
        </form>
      </Panel>
    </>
  );
}

export const dynamic = "force-dynamic";
