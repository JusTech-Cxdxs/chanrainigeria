import Link from "next/link";
import { SetupChecklist } from "@/components/admin/SetupChecklist";
import { AdminHead, Badge, Empty, Flash, Panel } from "@/components/admin/ui";
import { overview } from "@/lib/admin-queries";
import { has, requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { TYPE_LABEL, SOURCE_LABEL, STATUS_LABEL, statusTone } from "@/lib/labels";
import { getSettings } from "@/lib/settings";

export default async function Overview({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireAdmin();
  const s = await getSettings();
  const o = await overview(s.enquiries.overdueHours);
  const maxDay = Math.max(1, ...o.daily.map((d) => Math.max(d.enquiries, d.visitors)));
  // Each figure only for people whose role includes that section.
  const stats = [
    ...(has(user, "enquiries")
      ? [
          { label: "New enquiries", value: o.newCount, href: "/admin/enquiries?status=NEW" },
          { label: "Machines down, still open", value: o.downCount, href: "/admin/enquiries?urgency=machine_down", warn: o.downCount > 0 },
          { label: "Open (new + in progress)", value: o.openCount, href: "/admin/enquiries?status=open" },
          { label: "Enquiries this week", value: o.week, href: "/admin/enquiries" },
        ]
      : []),
    ...(has(user, "visitors") ? [{ label: "Visitors this week", value: o.visitors, href: "/admin/visitors" }] : []),
    ...(has(user, "testimonials") ? [{ label: "Testimonials to approve", value: o.pendingTestimonials, href: "/admin/testimonials", warn: o.pendingTestimonials > 0 }] : []),
  ];

  return (
    <>
      <AdminHead title={`Hello, ${user.name.split(" ")[0]}`} lead="What's happening on the website and at the enquiry desk." />
      <Flash sp={await searchParams} />

      <SetupChecklist user={user} />

      {has(user, "enquiries") && o.overdue.length ? (
        <Panel title="Needs attention now" className="mb-6 !border-accent" aside={<Link href="/admin/enquiries?status=open" className="text-sm font-semibold text-brand">All open</Link>}>
          <ul className="divide-y divide-line-soft">
            {o.overdue.map((e) => {
              const hours = Math.floor((Date.now() - new Date(e.createdAt).getTime()) / 3600_000);
              return (
                <li key={e.id}>
                  <Link href={`/admin/enquiries/${e.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:text-brand">
                    <span className="num font-semibold">{e.ref}</span>
                    <span>{e.name}</span>
                    <span className="text-ink-soft">{TYPE_LABEL[e.type]}</span>
                    <span className="ml-auto flex items-center gap-2">
                      {e.details.urgency === "machine_down" ? <Badge tone="warn">Machine down</Badge> : null}
                      <span className="text-sm text-ink-soft num">{hours < 1 ? "just now" : `${hours} h waiting`}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      ) : null}

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {stats.map((s) => (
          <li key={s.label}>
            <Link
              href={s.href}
              className={`block rounded-lg border bg-surface p-4 hover:border-brand ${s.warn ? "border-accent" : "border-line"}`}
            >
              <span className="block text-sm text-ink-soft">{s.label}</span>
              <span className="display num mt-1 block text-3xl">{s.value}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {has(user, "enquiries") && has(user, "visitors") ? (
        <Panel title="Last 14 days" aside={<span className="text-sm text-ink-soft">Enquiries and visitors per day</span>}>
          <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Daily enquiries and visitors for the last 14 days">
            {o.daily.map((d) => (
              <div key={d.day} className="flex flex-1 items-end justify-center gap-0.5" title={`${formatDate(d.day)}: ${d.enquiries} enquiries, ${d.visitors} visitors`}>
                <span className="w-1/2 rounded-t bg-line" style={{ height: `${(d.visitors / maxDay) * 100}%`, minHeight: d.visitors ? 2 : 0 }} />
                <span className="w-1/2 rounded-t bg-brand" style={{ height: `${(d.enquiries / maxDay) * 100}%`, minHeight: d.enquiries ? 2 : 0 }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-ink-soft num">
            <span>{formatDate(o.daily[0]?.day)}</span>
            <span className="flex gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-brand" /> Enquiries
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-line" /> Visitors
              </span>
            </span>
            <span>Today</span>
          </div>
        </Panel>
        ) : null}

        {has(user, "enquiries") ? (
        <Panel title="Enquiries, last 30 days">
          {o.byType.length ? (
            <dl className="space-y-2">
              {o.byType.map((t) => (
                <div key={t.type} className="flex justify-between gap-3">
                  <dt>
                    <Link href={`/admin/enquiries?type=${t.type}`} className="hover:text-brand">
                      {TYPE_LABEL[t.type]}
                    </Link>
                  </dt>
                  <dd className="num font-semibold">{t.n}</dd>
                </div>
              ))}
              <div className="border-t border-line-soft pt-2 text-sm text-ink-soft">
                {o.bySource.map((s) => `${SOURCE_LABEL[s.source]}: ${s.n}`).join(" · ")}
              </div>
            </dl>
          ) : (
            <p className="text-ink-soft">No enquiries yet.</p>
          )}
        </Panel>
        ) : null}
      </div>

      {has(user, "enquiries") ? (
        <Panel title="Latest enquiries" className="mt-6" aside={<Link href="/admin/enquiries" className="text-sm font-semibold text-brand">All enquiries</Link>}>
          {o.recent.length ? (
            <ul className="divide-y divide-line-soft">
              {o.recent.map((e) => (
                <li key={e.id}>
                  <Link href={`/admin/enquiries/${e.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:text-brand">
                    <span className="num font-semibold">{e.ref}</span>
                    <span>{e.name}</span>
                    <span className="text-ink-soft">{TYPE_LABEL[e.type]}{e.product ? ` · ${e.product.name}` : ""}</span>
                    <span className="ml-auto flex items-center gap-2">
                      {e.details.urgency === "machine_down" && e.status !== "RESOLVED" && e.status !== "CLOSED" ? <Badge tone="warn">Machine down</Badge> : null}
                      <Badge tone={statusTone(e.status)}>{STATUS_LABEL[e.status]}</Badge>
                      <span className="text-sm text-ink-soft">{formatDate(e.createdAt, true)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Enquiries from the website and Enyo will appear here.</Empty>
          )}
        </Panel>
      ) : null}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {has(user, "visitors") ? (
        <Panel title="Most viewed pages, 30 days">
          {o.topPages.length ? (
            <ol className="space-y-1.5">
              {o.topPages.map((p) => (
                <li key={p.path} className="flex justify-between gap-3">
                  <a href={p.path} target="_blank" className="truncate hover:text-brand">
                    {p.path}
                  </a>
                  <span className="num">{p.n}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-ink-soft">Visits are counted only for people who accept statistics cookies.</p>
          )}
        </Panel>
        ) : null}
        {has(user, "products") ? (
          <Panel title="Catalogue checks">
            <p>
              <span className="display num text-3xl">{o.unverified}</span>{" "}
              <span className="text-ink-soft">models have specifications not yet checked against the official sheet.</span>
            </p>
            <Link href="/admin/catalogue?unverified=1" className="btn btn-outline mt-4">
              Review specifications
            </Link>
          </Panel>
        ) : null}
      </div>
    </>
  );
}
