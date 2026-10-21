import { count, desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHead, Badge, Empty, Pager } from "@/components/admin/ui";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";

const PER = 30;

export default async function Chats({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireAdmin("chats");
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const C = schema.chatSessions;
  const M = schema.chatMessages;
  const E = schema.enquiries;
  const [[{ n }], rows] = await Promise.all([
    db.select({ n: count() }).from(C),
    db
      .select({
        id: C.id,
        page: C.page,
        updatedAt: C.updatedAt,
        messages: sql<number>`(select count(*)::int from ${M} where ${M.sessionId} = ${C.id})`,
        first: sql<string>`(select ${M.content} from ${M} where ${M.sessionId} = ${C.id} and ${M.role} = 'user' order by ${M.createdAt} limit 1)`,
        ref: E.ref,
        enquiryId: E.id,
      })
      .from(C)
      .leftJoin(E, eq(E.chatId, C.id))
      .orderBy(desc(C.updatedAt))
      .limit(PER)
      .offset((page - 1) * PER),
  ]);
  return (
    <>
      <AdminHead title="Enyo chats" lead="Conversations visitors had with the assistant. Read them to see what people ask and where Enyo's answers need better content." />
      {rows.length ? (
        <ul className="divide-y divide-line-soft rounded-lg border border-line bg-surface">
          {rows.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/chats/${c.id}`} className="grid gap-1 px-4 py-3 hover:bg-concrete/60 md:grid-cols-[1fr_auto] md:items-center md:gap-4">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{c.first ?? "(no messages)"}</span>
                  <span className="text-sm text-ink-soft">
                    {c.messages} messages{c.page ? ` · started on ${c.page}` : ""}
                  </span>
                </span>
                <span className="flex items-center gap-3 text-sm text-ink-soft">
                  {c.ref ? <Badge tone="brand">Request {c.ref}</Badge> : null}
                  {formatDate(c.updatedAt, true)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No conversations yet.</Empty>
      )}
      <Pager page={page} pages={Math.ceil(n / PER)} href={(p) => `/admin/chats?page=${p}`} />
    </>
  );
}
