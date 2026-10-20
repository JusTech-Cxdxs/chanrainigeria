import { desc } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHead, Badge, Empty, Flash } from "@/components/admin/ui";
import { db, schema } from "@/db";
import { can, requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export default async function NewsAdmin({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireAdmin();
  if (!can.content(user.role)) redirect("/admin?denied=1");
  const posts = await db.query.posts.findMany({ orderBy: [desc(schema.posts.createdAt)], columns: { body: false } });
  return (
    <>
      <AdminHead
        title="News"
        lead="Deliveries, handovers, new models and events. Published posts appear on the home page and the News page."
        actions={
          <Link href="/admin/news/new" className="btn btn-primary">
            Write a post
          </Link>
        }
      />
      <Flash sp={await searchParams} />
      {posts.length ? (
        <ul className="divide-y divide-line-soft rounded-lg border border-line bg-surface">
          {posts.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/news/${p.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-concrete/60">
                <span className="font-semibold">{p.title}</span>
                <span className="ml-auto flex items-center gap-3 text-sm text-ink-soft">
                  {p.published ? <Badge tone="brand">Published</Badge> : <Badge>Draft</Badge>}
                  {formatDate(p.publishedAt ?? p.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No posts yet. A first post announcing the new equipment lines is a good start.</Empty>
      )}
    </>
  );
}
