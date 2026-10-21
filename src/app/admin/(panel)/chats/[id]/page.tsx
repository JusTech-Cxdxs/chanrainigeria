import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHead, Panel } from "@/components/admin/ui";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export default async function Chat({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("chats");
  const { id } = await params;
  const [c, settings] = await Promise.all([
    db.query.chatSessions.findFirst({
      where: eq(schema.chatSessions.id, id),
      with: { messages: { orderBy: [asc(schema.chatMessages.createdAt)] } },
    }),
    getSettings(),
  ]);
  if (!c) notFound();
  const enquiry = await db.query.enquiries.findFirst({ where: eq(schema.enquiries.chatId, id), columns: { id: true, ref: true } });
  return (
    <>
      <AdminHead
        back={{ href: "/admin/chats", label: "Enyo chats" }}
        title={`Conversation on ${formatDate(c.createdAt, true)}`}
        lead={c.page ? `Started on ${c.page}` : undefined}
        actions={
          enquiry ? (
            <Link href={`/admin/enquiries/${enquiry.id}`} className="btn btn-primary">
              Open request {enquiry.ref}
            </Link>
          ) : null
        }
      />
      <Panel>
        <ol className="space-y-3">
          {c.messages.map((m) => (
            <li key={m.id} className={`max-w-[80%] ${m.role === "user" ? "ml-auto text-right" : ""}`}>
              <p className="text-xs text-ink-soft">
                {m.role === "user" ? "Visitor" : settings.enyo.name} · {formatDate(m.createdAt, true)}
              </p>
              <p className={`mt-1 inline-block whitespace-pre-wrap rounded-lg px-3 py-2 text-left ${m.role === "user" ? "bg-brand/10" : "bg-concrete"}`}>{m.content}</p>
            </li>
          ))}
        </ol>
      </Panel>
    </>
  );
}
