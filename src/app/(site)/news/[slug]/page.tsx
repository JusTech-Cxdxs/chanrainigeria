import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/site/PageHead";
import { getPost } from "@/lib/catalogue";
import { formatDate } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { getSettings, imageUrl, mediaUrl } from "@/lib/settings";

type P = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getPost((await params).slug);
  return p ? { title: p.title, description: p.excerpt, openGraph: { images: p.coverId ? [mediaUrl(p.coverId)!] : undefined } } : {};
}

export default async function Post({ params }: P) {
  const p = await getPost((await params).slug);
  if (!p) notFound();
  return (
    <>
      <PageHead crumbs={[{ href: "/", label: "Home" }, { href: "/news", label: "News" }, { label: p.title }]} title={p.title} image={p.coverId ? mediaUrl(p.coverId) : imageUrl(await getSettings(), "page-news")}>
        <p className="mt-4 text-ink-soft">{formatDate(p.publishedAt)}</p>
      </PageHead>
      <article className="wrap py-12">
        {p.coverId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(p.coverId)!} alt="" className="mb-10 max-h-[32rem] w-full rounded object-cover" />
        ) : null}
        <div className="prose-site text-lg" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body) }} />
      </article>
    </>
  );
}
