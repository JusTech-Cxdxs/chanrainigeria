import { and, asc, count, desc, eq, ilike, isNotNull, isNull, like, ne, or, type SQL } from "drizzle-orm";
import Link from "next/link";
import { deleteMedia, moveMedia, undeleteMedia, updateMedia } from "@/app/admin/actions/media";
import { EmptyState } from "@/components/admin/cms";
import { actorName, ItemHistory } from "@/components/admin/ItemHistory";
import { CHECKER } from "@/components/admin/MediaDialog";
import { CopyButton, FolderSelect, MediaUploader, ReplaceFile, SelectAll } from "@/components/admin/MediaTools";
import { AdminHead, Flash, Pager, SubmitButton } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { formatBytes, HISTORY_FOLDER, libraryFolders, mediaUsage } from "@/lib/media";

export const dynamic = "force-dynamic";
const PER = 48;
const M = schema.media;
const SORTS = { new: { label: "Newest first", by: [desc(M.createdAt)] }, old: { label: "Oldest first", by: [asc(M.createdAt)] }, name: { label: "Name A to Z", by: [asc(M.filename)] }, size: { label: "Largest first", by: [desc(M.size)] } };
type SortKey = keyof typeof SORTS;
const folderLabel = (f: string) => f || "Unsorted";
const ver = (d: Date) => new Date(d).getTime().toString(36);
const typeLabel = (m: string) => (m === "application/pdf" ? "PDF" : m.replace("image/", "").replace("svg+xml", "SVG").toUpperCase());

export default async function MediaLibrary({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const me = await requireAdmin("media");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const removed = sp.view === "removed";
  const folder = sp.folder === undefined ? null : sp.folder === "Unsorted" ? "" : sp.folder;
  const type = sp.type === "image" || sp.type === "pdf" ? sp.type : "";
  const sort: SortKey = sp.sort && sp.sort in SORTS ? (sp.sort as SortKey) : "new";
  const q = (sp.q ?? "").trim().slice(0, 80);

  const where: SQL[] = [eq(M.isPrivate, false), ne(M.folder, HISTORY_FOLDER), removed ? isNotNull(M.deletedAt) : isNull(M.deletedAt)];
  if (folder !== null && !removed) where.push(eq(M.folder, folder));
  if (type === "image") where.push(like(M.mimeType, "image/%"));
  if (type === "pdf") where.push(eq(M.mimeType, "application/pdf"));
  if (q) where.push(or(ilike(M.filename, `%${q}%`), ilike(M.alt, `%${q}%`))!);
  const cols = { id: M.id, filename: M.filename, alt: M.alt, mimeType: M.mimeType, size: M.size, width: M.width, height: M.height, folder: M.folder, createdAt: M.createdAt, updatedAt: M.updatedAt, deletedAt: M.deletedAt };

  const [[{ n }], rows, folders, [{ n: removedCount }], usage, selected] = await Promise.all([
    db.select({ n: count() }).from(M).where(and(...where)),
    db.select(cols).from(M).where(and(...where)).orderBy(...SORTS[sort].by).limit(PER).offset((page - 1) * PER),
    libraryFolders(),
    db.select({ n: count() }).from(M).where(and(eq(M.isPrivate, false), ne(M.folder, HISTORY_FOLDER), isNotNull(M.deletedAt))),
    mediaUsage(),
    sp.file && /^[0-9a-f-]{36}$/i.test(sp.file)
      ? db.query.media.findFirst({ where: and(eq(M.id, sp.file), ne(M.folder, HISTORY_FOLDER), eq(M.isPrivate, false)), columns: { data: false } })
      : Promise.resolve(undefined),
  ]);
  const uploader = selected?.uploadedById ? await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, selected.uploadedById), columns: { name: true, role: true } }) : null;
  const total = folders.reduce((a, f) => a + f.n, 0);
  const folderNames = folders.map((f) => f.name);

  const qs = (over: Record<string, string | number | null>) => {
    const cur: Record<string, string | number | null> = {
      view: removed ? "removed" : null,
      folder: folder === null ? null : folderLabel(folder),
      type: type || null,
      sort: sort === "new" ? null : sort,
      q: q || null,
      page: page > 1 ? page : null,
      file: sp.file ?? null,
      ...over,
    };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(cur)) if (v !== null && v !== "") p.set(k, String(v));
    const s = p.toString();
    return `/admin/media${s ? `?${s}` : ""}`;
  };
  const used = selected ? (usage.get(selected.id.toLowerCase()) ?? []) : [];
  const isImg = selected?.mimeType.startsWith("image/");

  const sidebarLink = (label: string, icon: string, href: string, on: boolean, num?: number) => (
    <Link
      key={label + href}
      href={href}
      className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${on ? "bg-brand/10 text-brand" : "bg-surface hover:bg-concrete lg:bg-transparent"} border border-line lg:border-0`}
    >
      <Icon name={icon} size={16} />
      <span className="truncate lg:flex-1">{label}</span>
      {num !== undefined ? <span className="num text-xs text-ink-soft">{num}</span> : null}
    </Link>
  );

  return (
    <>
      <AdminHead
        title="Media library"
        lead="Every picture and PDF the website uses, sorted into folders. Open a file to rename it, describe it, move it, see where it is used, or replace it everywhere at once."
      />
      <Flash sp={sp} />
      {!removed ? (
        <div className="mb-6">
          <MediaUploader folders={folderNames} folder={folder ?? ""} />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[13rem_1fr]">
        <aside aria-label="Folders" className="min-w-0">
          <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:sticky lg:top-0 lg:mx-0 lg:grid lg:gap-0.5 lg:overflow-visible lg:p-0">
            {sidebarLink("All files", "images", qs({ folder: null, view: null, page: null, file: null }), folder === null && !removed, total)}
            {folders.map((f) =>
              sidebarLink(folderLabel(f.name), folder === f.name && !removed ? "folder-open" : "folder", qs({ folder: folderLabel(f.name), view: null, page: null, file: null }), folder === f.name && !removed, f.n),
            )}
            {folder !== null && !folderNames.includes(folder) && !removed ? sidebarLink(folder, "folder-open", qs({}), true, 0) : null}
            <form action="/admin/media" className="hidden gap-1 pt-2 lg:flex">
              <label className="sr-only" htmlFor="new-folder">
                New folder name
              </label>
              <input id="new-folder" name="folder" className="input !min-h-9 text-sm" placeholder="New folder" maxLength={60} required />
              <button className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line hover:border-brand" aria-label="Create folder">
                <Icon name="folder-plus" size={16} />
              </button>
            </form>
            <div className="lg:mt-3 lg:border-t lg:border-line lg:pt-3">{sidebarLink("Recently removed", "trash", qs({ view: "removed", folder: null, page: null, file: null }), removed, removedCount)}</div>
          </nav>
        </aside>

        <div className="min-w-0">
          <form className="mb-4 flex flex-wrap gap-2" role="search" action="/admin/media">
            {removed ? <input type="hidden" name="view" value="removed" /> : null}
            {folder !== null ? <input type="hidden" name="folder" value={folderLabel(folder)} /> : null}
            <label className="relative min-w-[12rem] flex-1">
              <span className="sr-only">Search</span>
              <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input name="q" defaultValue={q} placeholder="Search name or description" className="input !pl-9" />
            </label>
            <select name="type" defaultValue={type} className="input !w-auto" aria-label="File type">
              <option value="">All types</option>
              <option value="image">Pictures</option>
              <option value="pdf">PDFs</option>
            </select>
            <select name="sort" defaultValue={sort} className="input !w-auto" aria-label="Sort">
              {Object.entries(SORTS).map(([k, s]) => (
                <option key={k} value={k}>
                  {s.label}
                </option>
              ))}
            </select>
            <button className="btn btn-outline">Apply</button>
          </form>

          <p className="mb-3 text-sm text-ink-soft">
            <span className="font-semibold text-ink">{removed ? "Recently removed" : folder === null ? "All files" : folderLabel(folder)}</span> · {n} file{n === 1 ? "" : "s"}
            {removed ? ". Removed files are kept for 30 days, then deleted for good." : ""}
          </p>

          {rows.length ? (
            <>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {rows.map((m) => {
                  const on = sp.file === m.id;
                  const inUse = usage.get(m.id.toLowerCase())?.length ?? 0;
                  return (
                    <li key={m.id} className={`group relative overflow-hidden rounded-2xl border bg-surface transition-colors ${on ? "border-brand ring-2 ring-brand/30" : "border-line hover:border-brand"}`}>
                      <Link href={qs({ file: m.id })} scroll={false} className="block">
                        <div className={`aspect-[4/3] ${CHECKER}`}>
                          {m.mimeType.startsWith("image/") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={`/media/${m.id}?w=480&v=${ver(m.updatedAt)}`} alt={m.alt} loading="lazy" className="h-full w-full object-contain" />
                          ) : (
                            <span className="grid h-full place-items-center bg-concrete text-ink-soft">
                              <Icon name="file" size={36} />
                            </span>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="truncate text-sm font-semibold" title={m.filename}>
                            {m.filename}
                          </p>
                          <p className="flex items-center gap-1.5 text-xs text-ink-soft">
                            <span>{typeLabel(m.mimeType)}</span>·<span className="num">{formatBytes(m.size)}</span>
                            {inUse ? <span className="ml-auto rounded-full bg-brand/10 px-1.5 font-semibold text-brand">In use</span> : null}
                          </p>
                        </div>
                      </Link>
                      {!removed ? (
                        <label className="absolute left-2 top-2 grid h-8 w-8 cursor-pointer place-items-center rounded-lg bg-surface/90 shadow-sm">
                          <span className="sr-only">Select {m.filename}</span>
                          <input type="checkbox" name="ids" value={m.id} form="bulk" className="h-4 w-4 accent-[var(--brand)]" />
                        </label>
                      ) : (
                        <form action={undeleteMedia.bind(null, m.id)} className="border-t border-line p-2">
                          <SubmitButton variant="outline" className="!min-h-9 w-full text-sm" pendingText="Bringing back…">
                            <Icon name="restore" size={15} /> Bring back
                          </SubmitButton>
                        </form>
                      )}
                    </li>
                  );
                })}
              </ul>
              {!removed ? (
                <form id="bulk" action={moveMedia} className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-3 sm:p-4">
                  <SelectAll form="bulk" />
                  <div className="min-w-[12rem] flex-1">
                    <span className="mb-1 block text-sm font-semibold">Move selected files to</span>
                    <FolderSelect folders={folderNames} defaultValue={folder ?? ""} />
                  </div>
                  <SubmitButton variant="outline" pendingText="Moving…">
                    <Icon name="folder" size={16} /> Move
                  </SubmitButton>
                </form>
              ) : null}
            </>
          ) : (
            <EmptyState icon={removed ? "trash" : "images"} title={removed ? "Nothing removed recently" : q || type ? "Nothing matches" : "This folder is empty"}>
              {removed ? "Files you remove wait here for 30 days." : q || type ? "Try another search, or clear the filters." : "Drop files into the upload box above and they will go into this folder."}
            </EmptyState>
          )}
          <Pager page={page} pages={Math.ceil(n / PER)} href={(p) => qs({ page: p })} />
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-deep/50 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={`File details: ${selected.filename}`}>
          <Link href={qs({ file: null })} scroll={false} className="absolute inset-0" aria-label="Close file details" />
          <div className="relative h-full w-full max-w-xl overflow-y-auto bg-concrete shadow-2xl sm:border-l sm:border-line" style={{ paddingTop: "env(safe-area-inset-top)" }}>
            <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur">
              <h2 className="heading min-w-0 flex-1 truncate text-lg">{selected.filename}</h2>
              <Link href={qs({ file: null })} scroll={false} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-concrete" aria-label="Close">
                <Icon name="x" />
              </Link>
            </header>
            <div className="grid gap-4 p-4 pb-28 lg:pb-8">
              {selected.deletedAt ? (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border-l-4 border-accent bg-surface p-4 text-sm">
                  <span className="flex-1">Removed on {formatDate(selected.deletedAt, true)}. It no longer shows on the website.</span>
                  <form action={undeleteMedia.bind(null, selected.id)}>
                    <SubmitButton variant="outline" pendingText="Bringing back…">
                      <Icon name="restore" size={16} /> Bring back
                    </SubmitButton>
                  </form>
                </div>
              ) : null}
              <div className={`grid min-h-48 place-items-center overflow-hidden rounded-2xl border border-line ${CHECKER}`}>
                {isImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/media/${selected.id}?w=960&v=${ver(selected.updatedAt)}`} alt={selected.alt} className="max-h-[50vh] w-full object-contain" />
                ) : (
                  <a href={`/media/${selected.id}`} target="_blank" className="grid h-48 place-items-center bg-surface text-ink-soft">
                    <span className="grid place-items-center gap-2">
                      <Icon name="file" size={40} />
                      <span className="text-sm font-semibold text-brand">Open the PDF</span>
                    </span>
                  </a>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-2xl border border-line bg-surface p-4 text-sm">
                <dt className="text-ink-soft">Type</dt>
                <dd className="font-semibold">{typeLabel(selected.mimeType)}</dd>
                {selected.width && selected.height ? (
                  <>
                    <dt className="text-ink-soft">Size in pixels</dt>
                    <dd className="num font-semibold">
                      {selected.width} × {selected.height}
                    </dd>
                  </>
                ) : null}
                <dt className="text-ink-soft">File size</dt>
                <dd className="num font-semibold">{formatBytes(selected.size)}</dd>
                <dt className="text-ink-soft">Added</dt>
                <dd className="font-semibold">
                  {formatDate(selected.createdAt)}
                  {selected.uploadedById ? ` by ${actorName(uploader ?? null, me)}` : ""}
                </dd>
                {+new Date(selected.updatedAt) - +new Date(selected.createdAt) > 5000 ? (
                  <>
                    <dt className="text-ink-soft">Last changed</dt>
                    <dd className="font-semibold">{formatDate(selected.updatedAt, true)}</dd>
                  </>
                ) : null}
              </dl>
              <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-2xl border border-line bg-surface p-4">
                <CopyButton text={`/media/${selected.id}`}>Copy link</CopyButton>
                {isImg ? <CopyButton text={`![${selected.alt || selected.filename}](/media/${selected.id})`}>Copy for a news story</CopyButton> : null}
                <a href={`/media/${selected.id}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                  <Icon name="external" size={15} /> Open full size
                </a>
              </div>

              <form action={updateMedia.bind(null, selected.id)} className="grid gap-4 rounded-2xl border border-line bg-surface p-4">
                <h3 className="heading">Details</h3>
                <label className="field">
                  <span>File name</span>
                  <input name="filename" defaultValue={selected.filename} className="input" required maxLength={200} />
                  <small>Only staff see this. Use words that help you find it later.</small>
                </label>
                <label className="field">
                  <span>Description (alt text)</span>
                  <textarea name="alt" defaultValue={selected.alt} className="input !min-h-20" maxLength={200} />
                  <small>Describe what the picture shows, e.g. &quot;CNG dispenser at a filling station in Lagos&quot;. Read aloud to blind visitors.</small>
                </label>
                <div className="field">
                  <span>Folder</span>
                  <FolderSelect folders={folderNames} defaultValue={selected.folder} />
                </div>
                <div>
                  <SubmitButton>
                    <Icon name="save" size={16} /> Save details
                  </SubmitButton>
                </div>
              </form>

              {!selected.deletedAt ? (
                <div className="rounded-2xl border border-line bg-surface p-4">
                  <h3 className="heading mb-3">Replace</h3>
                  <ReplaceFile id={selected.id} pdf={!isImg} />
                </div>
              ) : null}

              <div className="rounded-2xl border border-line bg-surface p-4">
                <h3 className="heading mb-2">Where this is used</h3>
                {used.length ? (
                  <ul className="grid gap-1">
                    {used.map((u) => (
                      <li key={u.where}>
                        <Link href={u.href} className="flex items-center gap-2 rounded-lg py-1 text-sm hover:text-brand">
                          <Icon name="link" size={14} className="text-ink-soft" />
                          {u.where}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-soft">Not used anywhere on the website at the moment.</p>
                )}
              </div>

              {!selected.deletedAt ? (
                <form action={deleteMedia.bind(null, selected.id, qs({ file: null }))} className="rounded-2xl border border-line bg-surface p-4">
                  <h3 className="heading mb-1">Remove</h3>
                  <p className="mb-3 text-sm text-ink-soft">
                    {used.length
                      ? `This file is used in ${used.length} place${used.length === 1 ? "" : "s"}. Removing it leaves a gap there (or the original picture where there is one).`
                      : "The file is kept under Recently removed for 30 days in case you need it back."}
                  </p>
                  <SubmitButton
                    variant="danger"
                    pendingText="Removing…"
                    confirm={used.length ? `This file is used in ${used.length} place${used.length === 1 ? "" : "s"} on the website. Remove it anyway?` : "Remove this file?"}
                  >
                    <Icon name="trash" size={16} /> Remove file
                  </SubmitButton>
                </form>
              ) : null}

              <ItemHistory entity="media" id={selected.id} viewer={me} title="Earlier versions of this file" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
