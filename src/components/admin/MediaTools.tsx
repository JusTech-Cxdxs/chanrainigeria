"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { replaceMedia } from "@/app/admin/actions/media";
import { Icon } from "@/components/ui/Icon";
import { acceptAttr, uploadFiles } from "./MediaDialog";

const label = (f: string) => f || "Unsorted";

/** Folder dropdown with a "New folder" option that reveals a name box. */
export function FolderSelect({ folders, defaultValue = "", name = "folder" }: { folders: string[]; defaultValue?: string; name?: string }) {
  const [v, setV] = useState(defaultValue);
  const list = folders.includes(defaultValue) ? folders : [...folders, defaultValue];
  return (
    <div className="grid gap-2">
      <select name={name} value={v} onChange={(e) => setV(e.target.value)} className="input">
        {list.map((f) => (
          <option key={f || "_"} value={f}>
            {label(f)}
          </option>
        ))}
        <option value="__new">New folder…</option>
      </select>
      {v === "__new" ? <input name="newFolder" className="input" placeholder="Folder name, e.g. Trade show 2026" maxLength={60} required autoFocus /> : null}
    </div>
  );
}

/** Drag-and-drop or pick several files; each uploads separately with its own progress line. */
export function MediaUploader({ folders, folder }: { folders: string[]; folder: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState(folder);
  const [newName, setNewName] = useState("");
  const [alt, setAlt] = useState("");
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState("");
  const [result, setResult] = useState<{ ok: number; errors: string[] } | null>(null);
  const list = folders.includes(folder) ? folders : [...folders, folder];

  async function send(files: File[]) {
    if (!files.length) return;
    setResult(null);
    const dest = target === "__new" ? newName.trim() : target;
    const r = await uploadFiles(files, { folder: dest, alt, accept: "any" }, (d, t, n) => setBusy(n ? `Uploading ${n} (${d + 1} of ${t})…` : ""));
    setBusy("");
    setResult({ ok: r.items.length, errors: r.errors });
    if (input.current) input.current.value = "";
    if (r.items.length) {
      setAlt("");
      router.refresh();
    }
  }

  return (
    <div className="grid gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5 lg:grid-cols-[1fr_22rem]">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void send([...e.dataTransfer.files]);
        }}
        className={`grid place-items-center content-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${over ? "border-brand bg-brand/5" : "border-line"}`}
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
          <Icon name="upload" size={22} />
        </span>
        <p className="font-semibold">{busy || "Drop pictures or PDFs here"}</p>
        <p className="max-w-[56ch] text-sm text-ink-soft">
          JPG, PNG, WebP, SVG or PDF. Photos are turned the right way up, cleaned of camera and location data, and resized to 2400 px wide so pages stay fast.
        </p>
        <button type="button" className="btn btn-primary mt-1" onClick={() => input.current?.click()} disabled={!!busy || (target === "__new" && !newName.trim())}>
          <Icon name="file-up" size={17} /> Choose files
        </button>
        <input ref={input} type="file" multiple hidden accept={acceptAttr("any")} onChange={(e) => send([...(e.target.files ?? [])])} />
      </div>
      <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <label className="field content-start">
          <span>Put them in</span>
          <select value={target} onChange={(e) => setTarget(e.target.value)} className="input">
            {list.map((f) => (
              <option key={f || "_"} value={f}>
                {label(f)}
              </option>
            ))}
            <option value="__new">New folder…</option>
          </select>
          {target === "__new" ? <input value={newName} onChange={(e) => setNewName(e.target.value)} className="input" placeholder="Folder name" maxLength={60} /> : null}
        </label>
        <label className="field content-start">
          <span>Description (alt text)</span>
          <input value={alt} onChange={(e) => setAlt(e.target.value)} className="input" placeholder="e.g. LiuGong 856H loader on a quarry site" maxLength={200} />
          <small>Read aloud to blind visitors and shown if the picture can&apos;t load. You can change it per file later.</small>
        </label>
      </div>
      {result ? (
        <div role="status" className={`rounded-xl border-l-4 lg:col-span-2 px-4 py-3 text-sm ${result.errors.length ? "border-danger" : "border-brand"} bg-concrete/60`}>
          {result.ok ? (
            <p className="font-semibold">
              {result.ok} file{result.ok === 1 ? "" : "s"} uploaded.
            </p>
          ) : null}
          {result.errors.map((e) => (
            <p key={e} className="text-danger">
              {e}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Upload a new version of a file under the same link. The old one stays in History. */
export function ReplaceFile({ id, pdf }: { id: string; pdf: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function go(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    const fd = new FormData();
    fd.set("file", file);
    try {
      const r = await replaceMedia(id, fd);
      setMsg(r.ok ? { ok: true, text: "Replaced. Every page using this file now shows the new one. The old version is in History if you need it back." } : { ok: false, text: r.error });
      if (r.ok) router.refresh();
    } catch {
      setMsg({ ok: false, text: "The upload failed. Check the connection and try again." });
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  }
  return (
    <div className="grid gap-2">
      <button type="button" className="btn btn-outline" onClick={() => input.current?.click()} disabled={busy}>
        <Icon name="replace" size={17} /> {busy ? "Replacing…" : "Replace file"}
      </button>
      <input ref={input} type="file" hidden accept={acceptAttr(pdf ? "pdf" : "image")} onChange={(e) => go(e.target.files?.[0])} />
      {msg ? (
        <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-brand" : "text-danger"}`}>
          {msg.text}
        </p>
      ) : (
        <small className="text-[0.8125rem] text-ink-soft">Keeps the same link, so every page using it updates at once.</small>
      )}
    </div>
  );
}

/** Copies a ready-to-paste snippet. */
export function CopyButton({ text, children }: { text: string; children: React.ReactNode }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text.startsWith("/") ? new URL(text, window.location.origin).toString() : text.replace("](/", `](${window.location.origin}/`));
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {}
      }}
    >
      <Icon name={done ? "check" : "copy"} size={15} />
      {done ? "Copied" : children}
    </button>
  );
}

/** "Select all" for the bulk move form. */
export function SelectAll({ form }: { form: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm font-semibold">
      <input
        type="checkbox"
        className="h-4 w-4 accent-[var(--brand)]"
        onChange={(e) => document.querySelectorAll<HTMLInputElement>(`input[form="${form}"][name="ids"]`).forEach((c) => (c.checked = e.target.checked))}
      />
      Select all
    </label>
  );
}
