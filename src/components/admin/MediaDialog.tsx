"use client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { listMedia, uploadOne, type MediaItem } from "@/app/admin/actions/media";
import { Icon } from "@/components/ui/Icon";

export type Accept = "image" | "pdf" | "any";

export const thumbUrl = (m: { id: string; v?: string }, w = 480) => `/media/${m.id}?w=${w}${m.v ? `&v=${m.v}` : ""}`;
export const isImage = (m: { mimeType: string }) => m.mimeType.startsWith("image/");
export const acceptAttr = (a: Accept) =>
  a === "image" ? "image/jpeg,image/png,image/webp,image/avif,image/svg+xml,image/heic" : a === "pdf" ? "application/pdf" : "image/*,application/pdf";

/** Chequered backdrop so transparent logos are visible in both themes. */
export const CHECKER = "bg-[repeating-conic-gradient(var(--line-soft)_0_25%,var(--surface)_0_50%)] bg-[length:16px_16px]";

const folderLabel = (f: string) => f || "Unsorted";

/** Uploads files one by one through the server action. Returns the stored items and any errors. */
export async function uploadFiles(files: File[], opts: { folder?: string; alt?: string; accept: Accept }, onProgress?: (done: number, total: number, name: string) => void) {
  const items: MediaItem[] = [];
  const errors: string[] = [];
  for (const [i, file] of files.entries()) {
    onProgress?.(i, files.length, file.name);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("folder", opts.folder ?? "");
    fd.set("alt", opts.alt ?? "");
    fd.set("accept", opts.accept);
    try {
      const r = await uploadOne(fd);
      if (r.ok) items.push(r.item);
      else errors.push(r.error);
    } catch {
      errors.push(`${file.name}: the upload failed. Check the connection and try again.`);
    }
  }
  onProgress?.(files.length, files.length, "");
  return { items, errors };
}

/**
 * The library in a dialog: search, folders, upload, pick. Used by every picture and file field in the
 * dashboard so staff choose files the same way everywhere.
 */
export function MediaDialog({
  open,
  onClose,
  onPick,
  accept = "image",
  folder: startFolder,
  title = "Choose from the library",
}: {
  open: boolean;
  onClose: () => void;
  onPick: (item: MediaItem) => void;
  accept?: Accept;
  folder?: string;
  title?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState<string | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<{ name: string; n: number }[]>([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(
    (p: number, append: boolean) => {
      start(async () => {
        try {
          const r = await listMedia({ search, folder, type: accept, page: p });
          setItems((prev) => (append ? [...prev, ...r.items] : r.items));
          setMore(r.more);
          setFolders(r.folders);
          setPage(p);
        } catch {
          setError("The library couldn't be loaded. Refresh the page and try again.");
        }
      });
    },
    [search, folder, accept],
  );

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => load(1, false), search ? 250 : 0);
    return () => clearTimeout(t);
  }, [open, load, search]);

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setError("");
    const r = await uploadFiles([...list], { folder: folder ?? startFolder ?? "", accept }, (d, t, name) => setBusy(name ? `Uploading ${name} (${d + 1} of ${t})…` : ""));
    setBusy("");
    if (fileRef.current) fileRef.current.value = "";
    if (r.errors.length) setError(r.errors.join(" "));
    if (r.items.length === 1 && !r.errors.length) {
      onPick(r.items[0]);
      onClose();
    } else if (r.items.length) {
      setItems((prev) => [...r.items, ...prev]);
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      aria-label={title}
      className="m-0 h-[100dvh] max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-deep/60 backdrop:backdrop-blur-sm sm:m-auto sm:h-[min(88dvh,52rem)] sm:w-[min(94vw,68rem)] sm:rounded-2xl"
    >
      <div className="flex h-full flex-col overflow-hidden bg-surface text-ink sm:rounded-2xl sm:border sm:border-line">
        <header className="flex items-center gap-3 border-b border-line px-4 py-3">
          <h2 className="heading flex-1 text-lg">{title}</h2>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-xl hover:bg-concrete" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </header>
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search files</span>
            <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or description" className="input !min-h-10 !pl-9" />
          </label>
          <select
            value={folder ?? "__all"}
            onChange={(e) => setFolder(e.target.value === "__all" ? null : e.target.value)}
            className="input !min-h-10 !w-auto md:hidden"
            aria-label="Folder"
          >
            <option value="__all">All folders</option>
            {folders.map((f) => (
              <option key={f.name || "_"} value={f.name}>
                {folderLabel(f.name)} ({f.n})
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-primary !min-h-10 text-sm" onClick={() => fileRef.current?.click()} disabled={!!busy}>
            <Icon name="upload" size={16} /> Upload new
          </button>
          <input ref={fileRef} type="file" hidden multiple accept={acceptAttr(accept)} onChange={(e) => onFiles(e.target.files)} />
        </div>
        {busy || error ? (
          <p role={error ? "alert" : "status"} className={`px-4 py-2 text-sm ${error ? "text-danger" : "text-ink-soft"}`}>
            {busy || error}
          </p>
        ) : null}
        <div className="flex min-h-0 flex-1">
          <nav aria-label="Folders" className="hidden w-52 shrink-0 overflow-y-auto border-r border-line p-2 md:block">
            {[{ name: "__all", n: folders.reduce((a, f) => a + f.n, 0) }, ...folders].map((f) => {
              const val = f.name === "__all" ? null : f.name;
              const on = folder === val;
              return (
                <button
                  key={f.name || "_"}
                  type="button"
                  onClick={() => setFolder(val)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold ${on ? "bg-brand/10 text-brand" : "hover:bg-concrete"}`}
                >
                  <Icon name={on ? "folder-open" : "folder"} size={16} />
                  <span className="flex-1 truncate">{f.name === "__all" ? "All files" : folderLabel(f.name)}</span>
                  <span className="num text-xs text-ink-soft">{f.n}</span>
                </button>
              );
            })}
          </nav>
          <div className="min-w-0 flex-1 overflow-y-auto p-4" aria-busy={pending}>
            {items.length ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onPick(m);
                        onClose();
                      }}
                      className="group block w-full overflow-hidden rounded-xl border border-line bg-concrete text-left hover:border-brand focus-visible:border-brand"
                    >
                      {isImage(m) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumbUrl(m)} alt="" loading="lazy" className={`${CHECKER} aspect-[4/3] w-full object-contain`} />
                      ) : (
                        <span className="grid aspect-[4/3] place-items-center text-ink-soft">
                          <Icon name="file" size={32} />
                        </span>
                      )}
                      <span className="block truncate bg-surface px-2.5 py-2 text-xs font-semibold group-hover:text-brand">{m.filename}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : pending ? (
              <p className="py-16 text-center text-ink-soft">Loading…</p>
            ) : (
              <div className="grid place-items-center gap-3 py-16 text-center text-ink-soft">
                <Icon name="images" size={36} />
                <p>{search ? "Nothing matches that search." : "No files here yet. Use Upload new to add one."}</p>
              </div>
            )}
            {more ? (
              <div className="mt-4 text-center">
                <button type="button" className="btn btn-outline" onClick={() => load(page + 1, true)} disabled={pending}>
                  Show more
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </dialog>
  );
}
