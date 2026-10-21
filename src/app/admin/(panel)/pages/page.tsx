import Link from "next/link";
import { EmptyState } from "@/components/admin/cms";
import { actorName } from "@/components/admin/ItemHistory";
import { AdminHead, Flash } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { db } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { PAGES } from "@/lib/content-registry";
import type { PageDef } from "@/lib/content-types";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const GROUPS: PageDef["group"][] = ["Main pages", "Products and services", "Customer forms", "Site-wide", "Legal"];

export default async function PagesIndex({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const me = await requireAdmin("pages");
  const rows = await db.query.pageContent.findMany({ columns: { page: true, data: true, updatedAt: true, updatedById: true } });
  const users = await db.query.adminUsers.findMany({ columns: { id: true, name: true, role: true } });
  const byPage = new Map(rows.map((r) => [r.page, r]));
  const groups = [...GROUPS, ...new Set(PAGES.map((p) => p.group).filter((g) => !GROUPS.includes(g)))];

  return (
    <>
      <AdminHead
        title="Pages and text"
        lead="Every heading, paragraph, button and picture on the public website, page by page. Open a page, change what you need and save. The original wording is always one click away, and every save can be undone from History."
        actions={
          <Link href="/admin/images" className="btn btn-outline">
            <Icon name="images" size={17} /> Images
          </Link>
        }
      />
      <Flash sp={await searchParams} />
      {PAGES.length ? (
        <div className="space-y-8">
          {groups.map((g) => {
            const list = PAGES.filter((p) => p.group === g);
            if (!list.length) return null;
            return (
              <section key={g}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">{g}</h2>
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {list.map((p) => {
                    const row = byPage.get(p.key);
                    const changed = row ? Object.keys(row.data ?? {}).length : 0;
                    const who = row?.updatedById ? users.find((u) => u.id === row.updatedById) : null;
                    const fields = p.sections.reduce((a, s) => a + s.fields.length, 0);
                    return (
                      <li key={p.key} className="flex flex-col rounded-2xl border border-line bg-surface transition-colors hover:border-brand">
                        <Link href={`/admin/pages/${p.key}`} className="flex flex-1 gap-3 p-4">
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                            <Icon name={p.icon} size={20} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="heading text-base">{p.label}</span>
                              {changed ? (
                                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-bold text-[color-mix(in_oklab,var(--accent)_60%,var(--ink))]">
                                  {changed} changed
                                </span>
                              ) : null}
                            </span>
                            <span className="mt-1 line-clamp-2 block text-sm text-ink-soft">{p.description}</span>
                            <span className="mt-2 block text-xs text-ink-soft">
                              {fields} editable field{fields === 1 ? "" : "s"} in {p.sections.length} section{p.sections.length === 1 ? "" : "s"}
                            </span>
                          </span>
                        </Link>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line-soft px-4 py-2.5 text-xs text-ink-soft">
                          <span className="flex items-center gap-1">
                            <Icon name="clock" size={13} />
                            {row ? `Edited ${formatDate(row.updatedAt, true)} by ${actorName(who ?? null, me)}` : "Original wording"}
                          </span>
                          {p.path ? (
                            <a href={p.path} target="_blank" rel="noopener" className="ml-auto inline-flex items-center gap-1 font-semibold text-brand">
                              View on site <Icon name="external" size={13} />
                            </a>
                          ) : (
                            <span className="ml-auto">Shown on every page</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyState icon="pages" title="No pages are set up for editing yet" />
      )}
    </>
  );
}
