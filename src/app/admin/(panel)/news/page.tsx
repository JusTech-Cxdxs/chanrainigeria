import { desc } from "drizzle-orm";
import Link from "next/link";
import { EmptyState, Pill } from "@/components/admin/cms";
import { CHECKER } from "@/components/admin/MediaDialog";
import { AdminHead, Flash } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NewsAdmin({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin("news");
  const sp = await searchParams;
  const all = await db.query.posts.findMany({ orderBy: [desc(schema.posts.publishedAt), desc(schema.posts.createdAt)], columns: { body: false } });
  const categories = [...new Set(all.map((p) => p.category))].sort();
  const cat = sp.category && categories.includes(sp.category) ? sp.category : null;
  const status = sp.status === "draft" || sp.status === "published" ? sp.status : null;
  const posts = all.filter((p) => (!cat || p.category === cat) && (!status || (status === "published") === p.published));
  const chip = (label: string, href: string, on: boolean) => (
    <Link key={href} href={href} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold ${on ? "border-brand bg-brand/10 text-brand" : "border-line bg-surface hover:border-brand"}`}>
      {label}
    </Link>
  );
  const qs = (o: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const cur = { category: cat, status, ...o };
    for (const [k, v] of Object.entries(cur)) if (v) p.set(k, v);
    return `/admin/news${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <AdminHead
        title="Blog"
        lead="Deliveries, handovers, new models and events. Published posts appear on the website's News page and the latest three on the home page. Drafts stay here until you tick Published."
        actions={
          <Link href="/admin/news/new" className="btn btn-primary">
            <Icon name="plus" size={17} /> Write a post
          </Link>
        }
      />
      <Flash sp={sp} />
      {all.length ? (
        <>
          <nav aria-label="Filter posts" className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
            {chip("All", qs({ category: null, status: null }), !cat && !status)}
            {chip("Published", qs({ status: "published" }), status === "published")}
            {chip("Drafts", qs({ status: "draft" }), status === "draft")}
            {categories.map((c) => chip(c, qs({ category: cat === c ? null : c }), cat === c))}
          </nav>
          {posts.length ? (
            <ul className="divide-y divide-line-soft overflow-hidden rounded-2xl border border-line bg-surface">
              {posts.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/news/${p.id}`} className="flex items-center gap-3 px-3 py-3 hover:bg-concrete/60 sm:px-4">
                    <span className={`grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-line ${CHECKER}`}>
                      {p.coverId ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/media/${p.coverId}?w=480`} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Icon name="news" size={20} className="text-ink-soft" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 font-semibold">{p.title}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                        <span className="inline-flex items-center gap-1 rounded-full bg-concrete px-2 py-0.5 font-semibold ring-1 ring-line">
                          <Icon name="tag" size={11} /> {p.category}
                        </span>
                        <Pill on={p.published} yes="Published" no="Draft" />
                        <span className="num">{formatDate(p.publishedAt ?? p.createdAt)}</span>
                      </span>
                    </span>
                    <Icon name="chevron-right" size={16} className="shrink-0 text-ink-soft" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="filter" title="No posts match">
              Try another filter.
            </EmptyState>
          )}
        </>
      ) : (
        <EmptyState
          icon="news"
          title="No posts yet"
          action={
            <Link href="/admin/news/new" className="btn btn-primary">
              <Icon name="plus" size={17} /> Write the first post
            </Link>
          }
        >
          A first post announcing the equipment lines you now carry is a good start.
        </EmptyState>
      )}
    </>
  );
}
