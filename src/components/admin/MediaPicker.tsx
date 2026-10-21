"use client";
import { useEffect, useRef, useState } from "react";
import { mediaInfo, type MediaItem } from "@/app/admin/actions/media";
import { Icon } from "@/components/ui/Icon";
import { acceptAttr, CHECKER, isImage, MediaDialog, thumbUrl, uploadFiles, type Accept } from "./MediaDialog";

const UUID = /^[0-9a-f-]{36}$/i;

/** Short info cache shared by every picker on the page. */
const infoCache = new Map<string, MediaItem>();

function useInfo(ids: string[]) {
  const [, bump] = useState(0);
  const key = ids.join(",");
  useEffect(() => {
    const missing = key.split(",").filter((x) => UUID.test(x) && !infoCache.has(x));
    if (!missing.length) return;
    let live = true;
    mediaInfo(missing)
      .then((rows) => {
        rows.forEach((r) => infoCache.set(r.id, r));
        if (live) bump((n) => n + 1);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [key]);
  return (id: string) => infoCache.get(id);
}

/**
 * One picture or file. Shows a preview, and lets staff choose from the library, upload a new file, or
 * go back to the original. Works inside a plain form (pass `name`) or controlled (pass `value` and `onChange`).
 */
export function MediaPicker({
  name,
  value,
  defaultValue = "",
  onChange,
  accept = "image",
  folder,
  originalUrl,
  originalLabel = "Use original",
  resolve,
  removable = true,
  stacked,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
  accept?: Accept;
  /** Folder new uploads go into */
  folder?: string;
  /** Preview shown when nothing is chosen (the picture the site ships with) */
  originalUrl?: string;
  originalLabel?: string;
  /** URLs for values that aren't library ids, e.g. named site pictures */
  resolve?: Record<string, string>;
  removable?: boolean;
  /** Preview above the buttons, for narrow columns */
  stacked?: boolean;
}) {
  const [inner, setInner] = useState(defaultValue);
  const v = value ?? inner;
  const set = (x: string) => {
    if (value === undefined) setInner(x);
    onChange?.(x);
  };
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const info = useInfo([v]);
  const item = UUID.test(v) ? info(v) : undefined;
  const url = UUID.test(v) ? (item && !isImage(item) ? "" : thumbUrl({ id: v, v: item?.v })) : v ? (resolve?.[v] ?? "") : (originalUrl ?? "");
  const pdfLike = accept === "pdf" || (item && !isImage(item));

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setError("");
    const r = await uploadFiles([list[0]], { folder, accept }, (_, __, n) => setBusy(n ? `Uploading ${n}…` : ""));
    setBusy("");
    if (fileRef.current) fileRef.current.value = "";
    if (r.errors.length) setError(r.errors[0]);
    if (r.items[0]) {
      infoCache.set(r.items[0].id, r.items[0]);
      set(r.items[0].id);
    }
  }

  const status = !v ? (originalUrl ? "Original picture" : "Nothing chosen") : UUID.test(v) ? (item?.filename ?? "From the library") : "Site picture";

  return (
    <div className={`flex ${stacked ? "flex-col" : "flex-col sm:flex-row sm:items-start"} gap-3`}>
      {name ? <input type="hidden" name={name} value={v} /> : null}
      <div className={`${stacked ? "aspect-video w-full" : "aspect-[4/3] w-full sm:w-44"} shrink-0 overflow-hidden rounded-xl border border-line ${CHECKER}`}>
        {pdfLike && v ? (
          <a href={`/media/${v}`} target="_blank" className="grid h-full place-items-center gap-1 bg-concrete p-2 text-center text-xs text-ink-soft">
            <Icon name="file" size={28} />
            <span className="line-clamp-2 break-all">{item?.filename ?? "PDF"}</span>
          </a>
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-contain" />
        ) : (
          <span className="grid h-full place-items-center bg-concrete text-ink-soft">
            <Icon name={accept === "pdf" ? "file" : "image"} size={26} />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="truncate text-sm text-ink-soft">{status}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-outline !min-h-9 !px-3 text-sm" onClick={() => setOpen(true)}>
            <Icon name="images" size={16} /> Choose from library
          </button>
          <button type="button" className="btn btn-outline !min-h-9 !px-3 text-sm" onClick={() => fileRef.current?.click()} disabled={!!busy}>
            <Icon name="upload" size={16} /> {busy ? "Uploading…" : "Upload new"}
          </button>
          {v && (originalUrl || removable) ? (
            <button type="button" className="btn btn-quiet !min-h-9 text-sm" onClick={() => set("")}>
              <Icon name={originalUrl ? "undo" : "x"} size={16} /> {originalUrl ? originalLabel : "Remove"}
            </button>
          ) : null}
        </div>
        <input ref={fileRef} type="file" hidden accept={acceptAttr(accept)} onChange={(e) => onFiles(e.target.files)} />
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>
      <MediaDialog
        open={open}
        onClose={() => setOpen(false)}
        accept={accept}
        folder={folder}
        title={accept === "pdf" ? "Choose a PDF" : "Choose a picture"}
        onPick={(m) => {
          infoCache.set(m.id, m);
          set(m.id);
        }}
      />
    </div>
  );
}

/** Several pictures in order (e.g. a model's photos). The first one is used on cards. */
export function MultiMediaPicker({ name, defaultValue = [], folder, max = 20 }: { name: string; defaultValue?: string[]; folder?: string; max?: number }) {
  const [ids, setIds] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const info = useInfo(ids);
  const move = (i: number, d: number) =>
    setIds((cur) => {
      const next = [...cur];
      const j = i + d;
      if (j < 0 || j >= next.length) return cur;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setError("");
    const files = [...list].slice(0, Math.max(0, max - ids.length));
    const r = await uploadFiles(files, { folder, accept: "image" }, (d, t, n) => setBusy(n ? `Uploading ${d + 1} of ${t}…` : ""));
    setBusy("");
    if (fileRef.current) fileRef.current.value = "";
    r.items.forEach((m) => infoCache.set(m.id, m));
    setIds((cur) => [...cur, ...r.items.map((m) => m.id)]);
    if (r.errors.length) setError(r.errors.join(" "));
  }

  return (
    <div className="space-y-3">
      {ids.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      {ids.length ? (
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ids.map((id, i) => (
            <li key={id} className="overflow-hidden rounded-xl border border-line bg-surface">
              <div className={`relative aspect-[4/3] ${CHECKER}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbUrl({ id, v: info(id)?.v })} alt="" className="h-full w-full object-contain" />
                {i === 0 ? <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-on-brand">Main photo</span> : null}
              </div>
              <div className="flex items-center gap-1 border-t border-line p-1.5">
                <button type="button" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-concrete disabled:opacity-30" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier">
                  <Icon name="chevron-left" size={16} />
                </button>
                <button
                  type="button"
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-concrete disabled:opacity-30"
                  onClick={() => move(i, 1)}
                  disabled={i === ids.length - 1}
                  aria-label="Move later"
                >
                  <Icon name="chevron-right" size={16} />
                </button>
                <span className="min-w-0 flex-1 truncate px-1 text-xs text-ink-soft">{info(id)?.filename ?? ""}</span>
                <button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-danger hover:bg-concrete" onClick={() => setIds((c) => c.filter((x) => x !== id))} aria-label="Remove from this model">
                  <Icon name="x" size={16} />
                </button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-line px-4 py-8 text-center text-ink-soft">
          <Icon name="image-plus" size={28} />
          <p className="text-sm">No photos yet. Until one is added, the site shows a line drawing.</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-outline !min-h-9 !px-3 text-sm" onClick={() => setOpen(true)} disabled={ids.length >= max}>
          <Icon name="images" size={16} /> Add from library
        </button>
        <button type="button" className="btn btn-outline !min-h-9 !px-3 text-sm" onClick={() => fileRef.current?.click()} disabled={!!busy || ids.length >= max}>
          <Icon name="upload" size={16} /> {busy || "Upload photos"}
        </button>
        <input ref={fileRef} type="file" hidden multiple accept={acceptAttr("image")} onChange={(e) => onFiles(e.target.files)} />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <MediaDialog
        open={open}
        onClose={() => setOpen(false)}
        folder={folder}
        title="Add a photo"
        onPick={(m) => {
          infoCache.set(m.id, m);
          setIds((cur) => (cur.includes(m.id) ? cur : [...cur, m.id]));
        }}
      />
    </div>
  );
}
