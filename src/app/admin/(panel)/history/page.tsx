import { and, count, desc, eq, ilike, type SQL } from "drizzle-orm";
import Link from "next/link";
import { EmptyState } from "@/components/admin/cms";
import { actorName, ENTITY_ICON } from "@/components/admin/ItemHistory";
import { AdminHead, Flash, Pager } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { ENTITIES, isEntity, revisionVerb, type EntityKey } from "@/lib/history";

export const dynamic = "force-dynamic";
const PER = 40;
const R = schema.revisions;

export default async function HistoryPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const me = await requireAdmin("history");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const type = sp.type && isEntity(sp.type) ? (sp.type as EntityKey) : null;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const where: SQL[] = [];
  if (type) where.push(eq(R.entity, type));
  if (sp.item) where.push(eq(R.entityId, sp.item));
  if (q) where.push(ilike(R.label, `%${q}%`));
  const cond = where.length ? and(...where) : undefined;
  const [[{ n }], rows] = await Promise.all([
    db.select({ n: count() }).from(R).where(cond),
    db.query.revisions.findMany({
      where: cond,
      orderBy: [desc(R.createdAt)],
      limit: PER,
      offset: (page - 1) * PER,
      columns: { data: false },
      with: { actor: { columns: { name: true, role: true } } },
    }),
  ]);
  const qs = (over: Record<string, string | number | null>) => {
    const p = new URLSearchParams();
    const cur: Record<string, string | number | null> = { type, q: q || null, item: sp.item ?? null, ...over };
    for (const [k, v] of Object.entries(cur)) if (v !== null && v !== "" && v !== undefined) p.set(k, String(v));
    const s = p.toString();
    return `/admin/history${s ? `?${s}` : ""}`;
  };
  const types = Object.entries(ENTITIES) as [EntityKey, (typeof ENTITIES)[EntityKey]][];

  return (
    <>
      <AdminHead
        title="History and undo"
        lead="A copy of every page, product, brand, post, file and setting is kept just before it is changed or deleted. Open a version to see what it held and put it back. Restoring never loses anything: the version it replaces is kept here too."
      />
      <Flash sp={sp} />
      <form className="mb-4 flex flex-wrap gap-2" role="search">
        {type ? <input type="hidden" name="type" value={type} /> : null}
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search history</span>
          <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input name="q" defaultValue={q} placeholder="Search by name, e.g. 856H or Home page" className="input !pl-9" />
        </label>
        <button className="btn btn-outline">Search</button>
      </form>
      <nav aria-label="Filter by type" className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
        <Link href={qs({ type: null, page: null, item: null })} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold ${!type ? "border-brand bg-brand/10 text-brand" : "border-line bg-surface hover:border-brand"}`}>
          Everything
        </Link>
        {types.map(([k, e]) => (
          <Link
            key={k}
            href={qs({ type: k, page: null, item: null })}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${type === k ? "border-brand bg-brand/10 text-brand" : "border-line bg-surface hover:border-brand"}`}
          >
            <Icon name={ENTITY_ICON[k]} size={14} /> {e.label}
          </Link>
        ))}
      </nav>
      {sp.item ? (
        <p className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          Showing one item only.
          <Link href={qs({ item: null, page: null })} className="font-semibold text-brand">
            Show all
          </Link>
        </p>
      ) : null}
      {rows.length ? (
        <ol className="divide-y divide-line-soft overflow-hidden rounded-2xl border border-line bg-surface">
          {rows.map((r) => {
            const k = isEntity(r.entity) ? (r.entity as EntityKey) : null;
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                  <Icon name={k ? ENTITY_ICON[k] : "box"} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {r.label}
                    <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">{k ? ENTITIES[k].label : r.entity}</span>
                  </p>
                  <p className="text-sm text-ink-soft">
                    {revisionVerb(r.action)} by {actorName(r.actor, me)} · <span className="num">{formatDate(r.createdAt, true)}</span>
                  </p>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                  {k && r.action !== "delete" ? (
                    <Link href={ENTITIES[k].href(r.entityId)} className="btn btn-outline !min-h-9 flex-1 !px-3 text-sm sm:flex-none">
                      Open item
                    </Link>
                  ) : null}
                  <Link href={`/admin/history/${r.id}`} className="btn btn-primary !min-h-9 flex-1 !px-3 text-sm sm:flex-none">
                    <Icon name="undo" size={15} /> {r.action === "delete" ? "Bring back" : "View and restore"}
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <EmptyState icon="history" title={q || type ? "Nothing matches" : "No history yet"}>
          {q || type ? "Try another search or type." : "A version is kept here the first time anything on the website is changed or deleted."}
        </EmptyState>
      )}
      <Pager page={page} pages={Math.ceil(n / PER)} href={(p) => qs({ page: p })} />
    </>
  );
}
