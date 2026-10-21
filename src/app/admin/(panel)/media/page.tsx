import { count, desc, eq } from "drizzle-orm";
import { uploadMedia } from "@/app/admin/actions/content";
import { CopyLink } from "@/components/admin/CopyLink";
import { AdminHead, Empty, Flash, Pager, Panel, SubmitButton } from "@/components/admin/ui";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";

const PER = 48;

export default async function MediaLibrary({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin("media");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const M = schema.media;
  const [[{ n }], rows] = await Promise.all([
    db.select({ n: count() }).from(M).where(eq(M.isPrivate, false)),
    db
      .select({ id: M.id, filename: M.filename, mimeType: M.mimeType, size: M.size, createdAt: M.createdAt })
      .from(M)
      .where(eq(M.isPrivate, false))
      .orderBy(desc(M.createdAt))
      .limit(PER)
      .offset((page - 1) * PER),
  ]);
  return (
    <>
      <AdminHead title="Media library" lead="Images and PDFs used on the site. Copy a link to use an image inside a news post: ![description](link)" />
      <Flash sp={sp} />
      <Panel title="Upload" className="mb-6">
        <form action={uploadMedia} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="field">
            <span>Files</span>
            <input type="file" name="files" multiple accept="image/*,application/pdf" className="input py-2" required />
          </label>
          <label className="field">
            <span>Description</span>
            <input name="alt" className="input" placeholder="What the image shows" />
          </label>
          <SubmitButton pendingText="Uploading…">Upload</SubmitButton>
        </form>
      </Panel>
      {rows.length ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((m) => (
            <li key={m.id} className="rounded-lg border border-line bg-surface p-2">
              {m.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/media/${m.id}`} alt="" className="aspect-[4/3] w-full rounded object-contain" loading="lazy" />
              ) : (
                <div className="grid aspect-[4/3] place-items-center rounded bg-concrete text-sm text-ink-soft">PDF</div>
              )}
              <p className="mt-2 truncate text-sm font-semibold" title={m.filename}>
                {m.filename}
              </p>
              <p className="text-xs text-ink-soft">
                {(m.size / 1024).toFixed(0)} KB · {formatDate(m.createdAt)}
              </p>
              <CopyLink path={`/media/${m.id}`} />
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No files yet.</Empty>
      )}
      <Pager page={page} pages={Math.ceil(n / PER)} href={(p) => `/admin/media?page=${p}`} />
    </>
  );
}
