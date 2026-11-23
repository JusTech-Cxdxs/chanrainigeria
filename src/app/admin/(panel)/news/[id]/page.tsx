import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { deletePost, savePost } from "@/app/admin/actions/content";
import { Crumbs, SaveBar, Section } from "@/components/admin/cms";
import { ItemHistory } from "@/components/admin/ItemHistory";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { AdminHead, Check, Field, Flash, SubmitButton } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SUGGESTED = ["News", "Projects", "Deliveries", "Events", "Announcements"];

export default async function EditPost({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const me = await requireAdmin("news");
  const { id } = await params;
  const p = id === "new" ? null : await db.query.posts.findFirst({ where: eq(schema.posts.id, id) });
  if (id !== "new" && !p) notFound();
  const used = (await db.selectDistinct({ c: schema.posts.category }).from(schema.posts)).map((r) => r.c);
  const categories = [...new Set([...used, ...SUGGESTED])].sort();
  const date = p?.publishedAt
    ? new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(p.publishedAt))
    : "";

  return (
    <>
      <Crumbs items={[{ href: "/admin/news", label: "Blog" }, { label: p?.title ?? "New post" }]} />
      <AdminHead
        title={p?.title ?? "Write a post"}
        lead={p ? (p.published ? `Published. On the website at /news/${p.slug}` : "Draft. Only staff can see it until you tick Published.") : "Write it here and save as a draft. Tick Published when it is ready."}
        actions={
          p?.published ? (
            <a href={`/news/${p.slug}`} target="_blank" rel="noopener" className="btn btn-outline">
              <Icon name="external" size={17} /> View on site
            </a>
          ) : null
        }
      />
      <Flash sp={await searchParams} />
      <form action={savePost.bind(null, id)} className="grid gap-6">
        <Section title="The story" icon="news">
          <div className="grid gap-4">
            <Field label="Title" name="title" defaultValue={p?.title} required hint="Clear and specific, about 60 to 80 characters. e.g. Ten LiuGong loaders delivered to a quarry in Ogun State" />
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <label className="field">
                <span>Category</span>
                <input name="category" list="news-categories" defaultValue={p?.category ?? "News"} className="input" maxLength={40} />
                <datalist id="news-categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <small>Pick one already in use or type a new one. Visitors can filter by it.</small>
              </label>
              <Field label="Date" name="publishedAt" type="date" defaultValue={date} hint="The date shown on the post. Leave empty to use the day you publish." />
            </div>
            <Field label="Short summary" name="excerpt" defaultValue={p?.excerpt} textarea rows={2} hint="One or two sentences shown in lists and when the link is shared on WhatsApp or LinkedIn." />
            <Field
              label="Story"
              name="body"
              defaultValue={p?.body}
              textarea
              rows={16}
              hint="Leave a blank line between paragraphs. ## makes a heading, **text** makes bold, - starts a bullet, [text](https://link) makes a link. To add a picture, copy it from the Media library with Copy for a blog post."
            />
          </div>
        </Section>
        <Section title="Cover photo" icon="image" hint="Shown at the top of the post and on blog cards. A landscape photo, at least 1600 pixels wide.">
          <MediaPicker name="coverId" defaultValue={p?.coverId ?? ""} folder="News" />
        </Section>
        <Section title="Web address" icon="link">
          <Field label="Address" name="slug" defaultValue={p?.slug} hint="The end of the link, e.g. loaders-delivered-ogun. Leave empty to make one from the title. Changing it breaks links people already shared." />
        </Section>
        <SaveBar note={<Check label="Published" name="published" defaultChecked={p?.published ?? false} hint="Untick to take it off the site." />}>
          <SubmitButton>
            <Icon name="save" size={17} /> Save
          </SubmitButton>
        </SaveBar>
      </form>
      {p ? (
        <>
          <ItemHistory entity="post" id={p.id} viewer={me} />
          <form action={deletePost.bind(null, p.id)} className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-line p-4 text-sm">
            <span className="flex-1 text-ink-soft">Delete this post? You can bring it back from History. To take it off the site for now, untick Published instead.</span>
            <SubmitButton variant="danger" confirm="Delete this post?" pendingText="Deleting…">
              <Icon name="trash" size={16} /> Delete post
            </SubmitButton>
          </form>
        </>
      ) : null}
    </>
  );
}
