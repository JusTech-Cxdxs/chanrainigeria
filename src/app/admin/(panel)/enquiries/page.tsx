import { and, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import Link from "next/link";
import { AdminHead, Badge, Empty, Flash, Pager } from "@/components/admin/ui";
import { db, schema } from "@/db";
import { can, requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { SOURCE_LABEL, STATUS_LABEL, TYPE_LABEL, statusTone } from "@/lib/labels";
import { getSettings } from "@/lib/settings";
import { redirect } from "next/navigation";

const PER = 25;
type SP = Record<string, string | undefined>;

export default async function Enquiries({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireAdmin();
  if (!can.enquiries(user.role)) redirect("/admin?denied=1");
  const sp = await searchParams;
  const settings = await getSettings();
  const E = schema.enquiries;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: SQL[] = [];
  if (sp.status === "open") where.push(inArray(E.status, ["NEW", "IN_PROGRESS"]));
  else if (sp.status && sp.status in STATUS_LABEL) where.push(eq(E.status, sp.status as "NEW"));
  if (sp.type && sp.type in TYPE_LABEL) where.push(eq(E.type, sp.type as "QUOTE"));
  if (sp.desk) where.push(eq(E.desk, sp.desk));
  if (sp.source === "FORM" || sp.source === "ENYO") where.push(eq(E.source, sp.source));
  if (sp.urgency === "machine_down") where.push(sql`${E.details}->>'urgency' = 'machine_down'`, inArray(E.status, ["NEW", "IN_PROGRESS"]));
  if (sp.mine) where.push(eq(E.assigneeId, user.id));
  if (sp.q) {
    const q = `%${sp.q.trim()}%`;
    where.push(or(ilike(E.ref, q), ilike(E.name, q), ilike(E.email, q), ilike(E.company, q), ilike(E.phone, q), ilike(E.message, q))!);
  }
  const cond = where.length ? and(...where) : undefined;

  const [[{ n }], rows] = await Promise.all([
    db.select({ n: count() }).from(E).where(cond),
    db.query.enquiries.findMany({
      where: cond,
      orderBy: [desc(E.createdAt)],
      limit: PER,
      offset: (page - 1) * PER,
      with: { product: { columns: { name: true } }, assignee: { columns: { name: true } } },
    }),
  ]);
  const pages = Math.ceil(n / PER);
  const qs = (over: SP) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...over }).filter(([, v]) => v) as [string, string][]);
    return `/admin/enquiries?${p}`;
  };

  return (
    <>
      <AdminHead title="Enquiries" lead="Everything that came in through the website forms and Enyo, newest first." />
      <Flash sp={sp} />

      <form className="mb-6 grid gap-3 rounded-lg border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-6" role="search">
        <label className="field lg:col-span-2">
          <span>Search</span>
          <input name="q" defaultValue={sp.q} className="input" placeholder="Reference, name, email, company…" />
        </label>
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue={sp.status ?? ""} className="input">
            <option value="">Any</option>
            <option value="open">Open</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Request</span>
          <select name="type" defaultValue={sp.type ?? ""} className="input">
            <option value="">Any</option>
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Desk</span>
          <select name="desk" defaultValue={sp.desk ?? ""} className="input">
            <option value="">Any</option>
            {Object.entries(settings.desks).map(([k, d]) => (
              <option key={k} value={k}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button className="btn btn-primary flex-1">Filter</button>
          <Link href="/admin/enquiries" className="btn btn-outline">
            Clear
          </Link>
        </div>
      </form>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link className="btn btn-outline !min-h-9" href={qs({ urgency: "machine_down", page: undefined })}>
          Machines down
        </Link>
        <Link className="btn btn-outline !min-h-9" href={qs({ mine: "1", page: undefined })}>
          Assigned to me
        </Link>
        <Link className="btn btn-outline !min-h-9" href={qs({ source: "ENYO", page: undefined })}>
          From Enyo
        </Link>
        <span className="ml-auto self-center text-ink-soft num">{n} found</span>
      </div>

      {rows.length ? (
        <ul className="divide-y divide-line-soft rounded-lg border border-line bg-surface">
          {rows.map((e) => (
            <li key={e.id}>
              <Link href={`/admin/enquiries/${e.id}`} className="grid gap-1 px-4 py-3 hover:bg-concrete/60 md:grid-cols-[9rem_1fr_auto] md:items-center md:gap-4">
                <span className="num font-semibold">{e.ref}</span>
                <span className="min-w-0">
                  <span className="font-semibold">{e.name}</span>
                  {e.company ? <span className="text-ink-soft">, {e.company}</span> : null}
                  <span className="block truncate text-sm text-ink-soft">
                    {TYPE_LABEL[e.type]} · {settings.desks[e.desk]?.label ?? e.desk} · {SOURCE_LABEL[e.source]}
                    {e.product ? ` · ${e.product.name}` : ""}
                    {e.assignee ? ` · ${e.assignee.name}` : ""}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-2 md:justify-end">
                  {e.details.urgency === "machine_down" && (e.status === "NEW" || e.status === "IN_PROGRESS") ? <Badge tone="warn">Machine down</Badge> : null}
                  <Badge tone={statusTone(e.status)}>{STATUS_LABEL[e.status]}</Badge>
                  <span className="text-sm text-ink-soft">{formatDate(e.createdAt, true)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No enquiries match these filters.</Empty>
      )}
      <Pager page={page} pages={pages} href={(p) => qs({ page: String(p) })} />
    </>
  );
}
