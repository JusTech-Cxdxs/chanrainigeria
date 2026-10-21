import { asc, eq, inArray } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { addNote, replyToCustomer, updateEnquiry } from "@/app/admin/actions/enquiries";
import { AdminHead, Badge, Flash, Panel, SubmitButton } from "@/components/admin/ui";
import { db, schema } from "@/db";
import { can, requireAdmin } from "@/lib/auth";
import { formatDate, telHref, waHref } from "@/lib/format";
import { SOURCE_LABEL, STATUS_LABEL, TYPE_LABEL, URGENCY_LABEL, statusTone } from "@/lib/labels";
import { mailConfigured } from "@/lib/mail";
import { getSettings } from "@/lib/settings";

const DETAIL: Record<string, string> = {
  category: "Equipment line",
  machine: "Machine",
  serialNumber: "Serial number",
  hourMeter: "Hour meter",
  siteLocation: "Site location",
  siteState: "State",
  urgency: "Urgency",
  preferredDate: "Preferred date",
  partNumbers: "Part numbers",
  quantity: "Quantity",
};

export default async function EnquiryDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const user = await requireAdmin();
  if (!can.enquiries(user.role)) redirect("/admin?denied=1");
  const { id } = await params;
  const e = await db.query.enquiries.findFirst({
    where: eq(schema.enquiries.id, id),
    with: {
      product: { with: { family: { with: { category: true } } } },
      notes: { orderBy: [asc(schema.enquiryNotes.createdAt)], with: { author: { columns: { name: true } } } },
    },
  });
  if (!e) notFound();
  const [settings, staff, files, chat] = await Promise.all([
    getSettings(),
    db.query.adminUsers.findMany({ where: eq(schema.adminUsers.active, true), columns: { id: true, name: true, role: true } }).then((l) => l.filter((u) => u.role !== "MASTER" || user.role === "MASTER")),
    e.attachmentIds.length
      ? db.query.media.findMany({ where: inArray(schema.media.id, e.attachmentIds), columns: { id: true, filename: true, mimeType: true } })
      : [],
    e.chatId
      ? db.query.chatMessages.findMany({ where: eq(schema.chatMessages.sessionId, e.chatId), orderBy: [asc(schema.chatMessages.createdAt)] })
      : [],
  ]);
  const details = Object.entries(e.details).filter(([k, v]) => v && DETAIL[k]);

  return (
    <>
      <AdminHead
        back={{ href: "/admin/enquiries", label: "All enquiries" }}
        title={`${e.ref} · ${e.name}`}
        lead={`${TYPE_LABEL[e.type]} via ${SOURCE_LABEL[e.source].toLowerCase()} on ${formatDate(e.createdAt, true)}`}
        actions={
          <>
            {e.details.urgency === "machine_down" ? <Badge tone="warn">Machine down</Badge> : null}
            <Badge tone={statusTone(e.status)}>{STATUS_LABEL[e.status]}</Badge>
          </>
        }
      />
      <Flash sp={await searchParams} />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel title="Request">
            <p className="whitespace-pre-wrap">{e.message}</p>
            {e.product ? (
              <p className="mt-4">
                <span className="text-ink-soft">Product: </span>
                <a
                  className="font-semibold text-brand underline"
                  target="_blank"
                  href={`/products/${e.product.family.category.slug}/${e.product.family.slug}/${e.product.slug}`}
                >
                  {e.product.name}
                </a>
              </p>
            ) : null}
            {details.length ? (
              <dl className="mt-4 grid gap-x-6 gap-y-2 border-t border-line-soft pt-4 sm:grid-cols-2">
                {details.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-sm text-ink-soft">{DETAIL[k]}</dt>
                    <dd className="font-semibold whitespace-pre-wrap">{k === "urgency" ? URGENCY_LABEL[String(v)] ?? String(v) : String(v)}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {files.length ? (
              <div className="mt-4 border-t border-line-soft pt-4">
                <p className="text-sm text-ink-soft">Files from the customer</p>
                <ul className="mt-2 flex flex-wrap gap-3">
                  {files.map((f) => (
                    <li key={f.id}>
                      <a href={`/media/${f.id}`} target="_blank" className="block rounded border border-line p-1 hover:border-brand">
                        {f.mimeType.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`/media/${f.id}`} alt={f.filename} className="h-28 w-28 object-cover" />
                        ) : (
                          <span className="block px-3 py-2 text-sm">{f.filename}</span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Panel>

          <Panel title="Reply to the customer">
            <form action={replyToCustomer.bind(null, e.id)} className="grid gap-3">
              <textarea name="message" rows={6} className="input" placeholder={`Hello ${e.name.split(" ")[0]}, …`} required />
              <p className="text-sm text-ink-soft">
                Sent from {settings.email.fromName || settings.company.shortName}, with replies going to the {settings.desks[e.desk]?.label.toLowerCase() ?? "desk"} address. Your name isn&apos;t shown to the customer; the reply is saved below.
              </p>
              <div>
                <SubmitButton pendingText="Sending…">{mailConfigured() ? "Send reply" : "Send reply (email not connected)"}</SubmitButton>
              </div>
            </form>
          </Panel>

          <Panel title="Notes and history">
            {e.notes.length ? (
              <ol className="mb-5 space-y-4">
                {e.notes.map((n) => (
                  <li key={n.id} className="border-l-2 border-line pl-4">
                    <p className="text-sm text-ink-soft">
                      {n.author.name} · {formatDate(n.createdAt, true)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{n.body}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mb-4 text-ink-soft">No notes yet. Notes are for staff only.</p>
            )}
            <form action={addNote.bind(null, e.id)} className="grid gap-3">
              <textarea name="body" rows={3} className="input" placeholder="Called the customer, technician booked for Thursday…" required />
              <div>
                <SubmitButton variant="outline">Add note</SubmitButton>
              </div>
            </form>
          </Panel>

          {chat.length ? (
            <Panel title="Enyo conversation">
              <ol className="space-y-2">
                {chat.map((m) => (
                  <li key={m.id} className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-[0.95rem] ${m.role === "user" ? "ml-auto bg-brand/10" : "bg-concrete"}`}>
                    {m.content}
                  </li>
                ))}
              </ol>
            </Panel>
          ) : null}
        </div>

        <div className="space-y-6">
          <Panel title="Customer">
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-ink-soft">Name</dt>
                <dd className="font-semibold">{e.name}</dd>
              </div>
              {e.company ? (
                <div>
                  <dt className="text-sm text-ink-soft">Company</dt>
                  <dd>{e.company}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-sm text-ink-soft">Email</dt>
                <dd>
                  <a href={`mailto:${e.email}?subject=${encodeURIComponent(`Re: ${e.ref}`)}`} className="break-all text-brand underline">
                    {e.email}
                  </a>
                </dd>
              </div>
              {e.phone ? (
                <div>
                  <dt className="text-sm text-ink-soft">Phone</dt>
                  <dd className="flex flex-wrap gap-x-4">
                    <a href={telHref(e.phone)} className="num text-brand underline">
                      {e.phone}
                    </a>
                    <a href={waHref(e.phone)} target="_blank" className="text-brand underline">
                      WhatsApp
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </Panel>

          <Panel title="Handling">
            <form action={updateEnquiry.bind(null, e.id)} className="grid gap-4">
              <label className="field">
                <span>Status</span>
                <select name="status" defaultValue={e.status} className="input">
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Assigned to</span>
                <select name="assigneeId" defaultValue={e.assigneeId ?? ""} className="input">
                  <option value="">Nobody yet</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-sm text-ink-soft">
                Desk: {settings.desks[e.desk]?.label ?? e.desk}
                <br />
                Emails sent: customer {e.customerMailSent ? "yes" : "no"}, team {e.teamMailSent ? "yes" : "no"}
              </p>
              <div>
                <SubmitButton>Save</SubmitButton>
              </div>
            </form>
          </Panel>
        </div>
      </div>
    </>
  );
}
