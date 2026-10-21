import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/site/PageHead";
import { getPosts } from "@/lib/catalogue";
import { formatDate } from "@/lib/format";
import { getSettings, imageUrl, mediaUrl } from "@/lib/settings";

export const metadata: Metadata = { title: "News" };
export const dynamic = "force-dynamic";

export default async function News() {
  const [s, posts] = await Promise.all([getSettings(), getPosts(100)]);
  return (
    <>
      <PageHead crumbs={[{ href: "/", label: "Home" }, { label: "News" }]} title="News" lead="Deliveries, projects and updates from our teams." image={imageUrl(s, "page-news")} />
      <div className="wrap py-14">
        {posts.length === 0 ? (
          <p className="text-ink-soft">No news yet. Check back soon.</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {posts.map((p) => (
              <li key={p.id}>
                <Link href={`/news/${p.slug}`} className="group grid gap-4 py-8 md:grid-cols-[14rem_1fr]">
                  {p.coverId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(p.coverId)!} alt="" className="aspect-[4/3] w-full rounded object-cover" />
                  ) : (
                    <span className="text-sm text-ink-soft md:pt-1">{formatDate(p.publishedAt)}</span>
                  )}
                  <span>
                    {p.coverId ? <span className="block text-sm text-ink-soft">{formatDate(p.publishedAt)}</span> : null}
                    <span className="heading block text-2xl group-hover:text-brand">{p.title}</span>
                    <span className="mt-2 block max-w-[65ch] text-ink-soft">{p.excerpt}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
