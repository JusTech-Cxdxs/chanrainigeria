import { count, countDistinct, desc, gte, sql } from "drizzle-orm";
import Link from "next/link";
import { AdminHead, Panel } from "@/components/admin/ui";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";

const RANGES = { "7": "7 days", "30": "30 days", "90": "90 days" } as const;

export default async function Visitors({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin("visitors");
  const sp = await searchParams;
  const days = (sp.days && sp.days in RANGES ? sp.days : "30") as keyof typeof RANGES;
  const since = new Date(Date.now() - Number(days) * 86_400_000);
  const V = schema.pageViews;
  const C = schema.consentRecords;

  const [[totals], pages, sources, devices, [consent]] = await Promise.all([
    db.select({ visitors: countDistinct(V.visitorId), views: count() }).from(V).where(gte(V.createdAt, since)),
    db.select({ path: V.path, views: count(), visitors: countDistinct(V.visitorId) }).from(V).where(gte(V.createdAt, since)).groupBy(V.path).orderBy(desc(count())).limit(25),
    db.select({ source: V.source, n: countDistinct(V.visitorId) }).from(V).where(gte(V.createdAt, since)).groupBy(V.source).orderBy(desc(countDistinct(V.visitorId))).limit(12),
    db.select({ device: V.device, n: countDistinct(V.visitorId) }).from(V).where(gte(V.createdAt, since)).groupBy(V.device),
    db
      .select({ accepted: sql<number>`count(*) filter (where ${C.analytics})::int`, total: count() })
      .from(C)
      .where(gte(C.createdAt, since)),
  ]);
  const devTotal = devices.reduce((a, d) => a + d.n, 0) || 1;
  const rate = consent.total ? Math.round((consent.accepted / consent.total) * 100) : null;

  return (
    <>
      <AdminHead
        title="Visitors"
        lead="Counted only for people who accept statistics cookies, so real traffic is higher. No IP addresses are stored."
        actions={Object.entries(RANGES).map(([k, v]) => (
          <Link key={k} href={`/admin/visitors?days=${k}`} className={`btn !min-h-9 text-sm ${k === days ? "btn-primary" : "btn-outline"}`}>
            {v}
          </Link>
        ))}
      />
      <ul className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Visitors", totals.visitors],
          ["Page views", totals.views],
          ["Pages per visitor", totals.visitors ? (totals.views / totals.visitors).toFixed(1) : "–"],
          ["Accepted statistics", rate === null ? "–" : `${rate}%`],
        ].map(([l, v]) => (
          <li key={l} className="rounded-lg border border-line bg-surface p-4">
            <span className="block text-sm text-ink-soft">{l}</span>
            <span className="display num mt-1 block text-3xl">{v}</span>
          </li>
        ))}
      </ul>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Pages">
          {pages.length ? (
            <table className="w-full text-[0.95rem]">
              <thead className="text-left text-sm text-ink-soft">
                <tr>
                  <th className="pb-2 font-semibold">Page</th>
                  <th className="pb-2 text-right font-semibold">Views</th>
                  <th className="pb-2 text-right font-semibold">Visitors</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.path} className="border-t border-line-soft">
                    <td className="max-w-0 truncate py-1.5 pr-3">
                      <a href={p.path} target="_blank" className="hover:text-brand">
                        {p.path}
                      </a>
                    </td>
                    <td className="py-1.5 text-right num">{p.views}</td>
                    <td className="py-1.5 text-right num">{p.visitors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-ink-soft">No visits recorded in this period.</p>
          )}
        </Panel>
        <div className="space-y-6">
          <Panel title="Where visitors came from">
            {sources.length ? (
              <ul className="space-y-1.5">
                {sources.map((s) => (
                  <li key={s.source ?? "internal"} className="flex justify-between gap-3">
                    <span className="truncate">{s.source === "direct" ? "Typed the address or a bookmark" : s.source ?? "Moving between pages"}</span>
                    <span className="num">{s.n}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-soft">Nothing yet.</p>
            )}
          </Panel>
          <Panel title="Devices">
            <ul className="space-y-2">
              {devices.map((d) => (
                <li key={d.device ?? "?"}>
                  <div className="flex justify-between text-[0.95rem]">
                    <span className="capitalize">{d.device ?? "Unknown"}</span>
                    <span className="num">{Math.round((d.n / devTotal) * 100)}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded bg-line-soft">
                    <div className="h-2 rounded bg-brand" style={{ width: `${(d.n / devTotal) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
