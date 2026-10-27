import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Framed } from "@/components/site/FamilyPicture";
import { PageHead } from "@/components/site/PageHead";
import { siteContent } from "@/components/site/site-content";
import { Icon } from "@/components/ui/Icon";
import { getPost } from "@/lib/catalogue";
import { formatDate } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { postCover } from "@/lib/type-images";

type P = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getPost((await params).slug);
  return p ? { title: p.title, description: p.excerpt, openGraph: { images: postCover(p) ? [postCover(p)!] : undefined } } : {};
}

export default async function Post({ params }: P) {
  const p = await getPost((await params).slug);
  if (!p) notFound();
  const [c, list, nav] = await Promise.all([siteContent("news-post"), siteContent("news"), siteContent("header")]);
  return (
    <>
      <PageHead
        crumbs={[{ href: "/", label: nav.t("crumbHome") }, { href: "/news", label: list.t("crumb") }, { label: p.title }]}
        title={p.title}
        image={postCover(p) ?? list.img("image")}
      >
        <p className="mt-4 flex items-center gap-2 text-white/80">
          <Icon name="calendar" size={16} />
          {c.f("published", { date: formatDate(p.publishedAt) })}
        </p>
      </PageHead>
      <article className="wrap max-w-4xl py-12">
        {postCover(p) ? <Framed src={postCover(p)} ratio="aspect-[16/9]" shade="none" zoom={false} className="mb-10 rounded-[22px]" /> : null}
        <div className="prose-site text-lg" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body) }} />
        <Link href="/news" className="btn btn-outline mt-10">
          <Icon name="arrow" size={16} className="rotate-180" />
          {c.t("back")}
        </Link>
      </article>
    </>
  );
}
