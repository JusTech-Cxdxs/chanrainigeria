import Link from "next/link";
import { Framed } from "@/components/site/FamilyPicture";
import { PageHead } from "@/components/site/PageHead";
import { pageMetadata, siteContent } from "@/components/site/site-content";
import { Icon } from "@/components/ui/Icon";
import { getPosts } from "@/lib/catalogue";
import { formatDate } from "@/lib/format";
import { postCover } from "@/lib/type-images";

export const generateMetadata = () => pageMetadata("news");
export const dynamic = "force-dynamic";

export default async function News() {
  const [c, nav, posts] = await Promise.all([siteContent("news"), siteContent("header"), getPosts(100)]);
  const fallback = c.img("image");
  return (
    <>
      <PageHead crumbs={[{ href: "/", label: nav.t("crumbHome") }, { label: c.t("crumb") }]} title={c.t("title")} lead={c.t("lead")} image={fallback} />
      <div className="wrap py-14">
        {posts.length === 0 ? (
          <p className="text-ink-soft">{c.t("empty")}</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {posts.map((p) => (
              <li key={p.id} className="reveal">
                <Link href={`/news/${p.slug}`} className="group grid gap-5 py-8 md:grid-cols-[16rem_1fr] md:gap-8">
                  <Framed src={postCover(p) ?? fallback} ratio="aspect-[16/10]" />
                  <span>
                    <span className="flex items-center gap-1.5 text-sm text-ink-soft">
                      <Icon name="calendar" size={15} />
                      {formatDate(p.publishedAt)}
                    </span>
                    <span className="heading mt-1 block text-2xl group-hover:text-brand-ink">{p.title}</span>
                    <span className="mt-2 block max-w-[65ch] text-ink-soft">{p.excerpt}</span>
                    <span className="mt-3 inline-flex items-center gap-1.5 font-semibold text-brand-ink">
                      {c.t("readMore")}
                      <Icon name="arrow" size={16} className="transition-transform group-hover:translate-x-1" />
                    </span>
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
