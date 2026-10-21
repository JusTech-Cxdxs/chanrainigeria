import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { deletePost, savePost } from "@/app/admin/actions/content";
import { AdminHead, Check, Field, Flash, Panel, SubmitButton } from "@/components/admin/ui";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { mediaUrl } from "@/lib/settings";

export default async function EditPost({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  await requireAdmin("news");
  const { id } = await params;
  const p = id === "new" ? null : await db.query.posts.findFirst({ where: eq(schema.posts.id, id) });
  if (id !== "new" && !p) notFound();
  const date = p?.publishedAt ? new Date(p.publishedAt).toISOString().slice(0, 10) : "";
  return (
    <>
      <AdminHead
        back={{ href: "/admin/news", label: "News" }}
        title={p?.title ?? "New post"}
        actions={
          p?.published ? (
            <a href={`/news/${p.slug}`} target="_blank" className="btn btn-outline">
              View on site
            </a>
          ) : null
        }
      />
      <Flash sp={await searchParams} />
      <form action={savePost.bind(null, id)} className="grid gap-6">
        <Panel>
          <div className="grid gap-4">
            <Field label="Title" name="title" defaultValue={p?.title} required />
            <Field label="Short summary" name="excerpt" defaultValue={p?.excerpt} textarea rows={2} hint="Shown in lists and when the link is shared." />
            <Field
              label="Story"
              name="body"
              defaultValue={p?.body}
              textarea
              rows={16}
              hint="Leave a blank line between paragraphs. ## makes a heading, **text** makes bold, - starts a bullet, [text](https://link) makes a link."
            />
          </div>
        </Panel>
        <Panel title="Cover photo">
          <input type="file" name="cover" accept="image/*" className="input py-2" />
          {p?.coverId ? (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(p.coverId)!} alt="" className="h-36 rounded object-cover" />
              <Check label="Remove cover photo" name="removeCover" />
            </div>
          ) : null}
        </Panel>
        <Panel>
          <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
            <Field label="Web address" name="slug" defaultValue={p?.slug} hint="Leave blank to use the title." />
            <Field label="Date" name="publishedAt" type="date" defaultValue={date} hint="Defaults to the day you publish." />
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <Check label="Published" name="published" defaultChecked={p?.published ?? false} />
              <SubmitButton>Save</SubmitButton>
            </div>
          </div>
        </Panel>
      </form>
      {p ? (
        <form action={deletePost.bind(null, p.id)} className="mt-6">
          <SubmitButton variant="danger" confirm="Delete this post permanently?" pendingText="Deleting…">
            Delete post
          </SubmitButton>
        </form>
      ) : null}
    </>
  );
}
