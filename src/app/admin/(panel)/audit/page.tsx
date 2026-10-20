import { count, desc } from "drizzle-orm";
import { AdminHead, Empty, Pager } from "@/components/admin/ui";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";

const PER = 50;

export default async function Audit({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin(["ADMIN"]);
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [[{ n }], rows] = await Promise.all([
    db.select({ n: count() }).from(schema.auditLogs),
    db.query.auditLogs.findMany({
      orderBy: [desc(schema.auditLogs.createdAt)],
      limit: PER,
      offset: (page - 1) * PER,
      with: { actor: { columns: { name: true } } },
    }),
  ]);
  return (
    <>
      <AdminHead title="Activity log" lead="Who did what in the dashboard, and when. Kept for accountability; entries can't be edited." />
      {rows.length ? (
        <ol className="divide-y divide-line-soft rounded-lg border border-line bg-surface">
          {rows.map((r) => (
            <li key={r.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_10rem_1fr] sm:gap-4">
              <span className="text-sm text-ink-soft num">{formatDate(r.createdAt, true)}</span>
              <span className="font-semibold">{r.actor?.name ?? "System"}</span>
              <span>{r.summary}</span>
            </li>
          ))}
        </ol>
      ) : (
        <Empty>Nothing yet.</Empty>
      )}
      <Pager page={page} pages={Math.ceil(n / PER)} href={(p) => `/admin/audit?page=${p}`} />
    </>
  );
}
