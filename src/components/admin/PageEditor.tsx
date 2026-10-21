"use client";
import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import type { ContentField, ContentValue, ContentValues, ImageField, LinkField, ListField, PageDef, TextField } from "@/lib/content-types";
import { renderMarkdown } from "@/lib/markdown";
import { SaveBar, Section } from "./cms";
import { MediaPicker } from "./MediaPicker";

type Item = Record<string, string>;
const LINK = /^(\/(?![/\\])[^\s<>"']*|https:\/\/[^\s<>"']+)$/;
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const SECTION_ICONS = ["layout", "text", "list", "image", "star", "news", "chat", "pin"];

export function linkProblem(v: string) {
  if (!v) return null;
  if (LINK.test(v.trim())) return null;
  if (/^www\./i.test(v)) return "Add https:// at the start, e.g. https://" + v;
  if (/^http:\/\//i.test(v)) return "Use https:// rather than http:// so the link is secure.";
  return "Use a page on this site starting with / (like /contact) or a full address starting with https://";
}

function fieldIcon(f: ContentField) {
  return { text: "input", textarea: "text", markdown: "file", link: "link", image: "image", toggle: "toggle", list: "list" }[f.type];
}

function Counter({ v, max }: { v: string; max?: number }) {
  if (!max) return <span className="num">{v.length} characters</span>;
  const over = v.length > max;
  return (
    <span className={`num ${over ? "font-semibold text-[color-mix(in_oklab,var(--accent)_70%,var(--ink))]" : ""}`}>
      {v.length} / {max} characters{over ? " (longer than suggested)" : ""}
    </span>
  );
}

/** Label row shared by every field: name, "Changed" marker and "Reset to original". */
function Head({ f, changed, onReset, htmlFor }: { f: { label: string; type: string }; changed: boolean; onReset: () => void; htmlFor?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor={htmlFor} className="flex items-center gap-2 font-semibold">
        <Icon name={fieldIcon(f as ContentField) ?? "input"} size={15} className="text-ink-soft" />
        {f.label}
      </label>
      {changed ? (
        <>
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[color-mix(in_oklab,var(--accent)_60%,var(--ink))]">
            Changed
          </span>
          <button type="button" onClick={onReset} className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
            <Icon name="undo" size={14} /> Reset to original
          </button>
        </>
      ) : null}
    </div>
  );
}

function TextInput({
  f,
  id,
  value,
  onChange,
  original,
  inList,
}: {
  f: TextField | LinkField;
  id: string;
  value: string;
  onChange: (v: string) => void;
  original: string;
  inList?: boolean;
}) {
  const [preview, setPreview] = useState(false);
  const isLink = f.type === "link";
  const problem = isLink ? linkProblem(value) : null;
  const multi = f.type === "textarea" || f.type === "markdown";
  const max = "max" in f ? f.max : undefined;
  return (
    <div className="grid gap-1.5">
      {f.type === "markdown" ? (
        <div className="flex gap-1 text-sm" role="tablist">
          {["Write", "Preview"].map((t, i) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={preview === (i === 1)}
              onClick={() => setPreview(i === 1)}
              className={`rounded-lg px-3 py-1 font-semibold ${preview === (i === 1) ? "bg-brand/10 text-brand" : "text-ink-soft hover:bg-concrete"}`}
            >
              {t}
            </button>
          ))}
        </div>
      ) : null}
      {preview ? (
        <div
          className="prose-admin min-h-28 rounded-xl border border-line bg-concrete/50 px-4 py-3 text-[0.95rem] [&_a]:text-brand [&_a]:underline [&_h2]:mt-3 [&_h2]:font-bold [&_h2]:text-lg [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value || original) }}
        />
      ) : multi ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={f.type === "markdown" ? 8 : 3}
          className="input"
          placeholder={original || (inList ? "" : "Leave empty to use the original")}
        />
      ) : (
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input"
          inputMode={isLink ? "url" : undefined}
          placeholder={original || (isLink ? "/contact or https://…" : inList ? "" : "Leave empty to use the original")}
          aria-invalid={!!problem}
          style={problem ? { borderColor: "var(--danger)" } : undefined}
        />
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-ink-soft">
        {problem ? (
          <span role="alert" className="font-semibold text-danger">
            {problem}
          </span>
        ) : isLink ? (
          <span>A page on this site, like /contact, or a full address starting with https://</span>
        ) : (
          <Counter v={value} max={max} />
        )}
        {f.type === "markdown" ? <span>**bold**, ## heading, - bullet, [text](/link). Leave a blank line between paragraphs.</span> : null}
        {isLink && value && !problem ? (
          <a href={value} target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-semibold text-brand">
            Test link <Icon name="external" size={13} />
          </a>
        ) : null}
      </div>
    </div>
  );
}

function Toggle({ id, on, onChange }: { id: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="inline-flex items-center gap-3 rounded-xl py-1 text-left font-semibold"
    >
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-brand" : "bg-line"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left] ${on ? "left-6" : "left-1"}`} />
      </span>
      {on ? "On" : "Off"}
    </button>
  );
}

function ImageInput({ f, value, onChange, slotUrls }: { f: ImageField; value: string; onChange: (v: string) => void; slotUrls: Record<string, string> }) {
  return <MediaPicker value={value} onChange={onChange} folder="Page banners" originalUrl={slotUrls[f.default] ?? ""} resolve={slotUrls} />;
}

/** Page pictures are changed under Images; here they're shown for context with a link there. */
function ImageLink({ value, original }: { value: string; original: string }) {
  const url = /^[0-9a-f-]{36}$/i.test(value) ? `/media/${value}?w=480` : original;
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-concrete/40 p-3">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="aspect-[16/7] w-44 rounded-lg object-cover" />
      ) : null}
      <div className="min-w-0 flex-1 text-sm text-ink-soft">
        <p>{value ? "Your own picture." : "The original picture."} Pictures are changed in one place, with every other picture on the site.</p>
        <a href="/admin/images#banners" className="mt-1 inline-flex items-center gap-1 font-semibold text-brand">
          <Icon name="images" size={15} /> Change it under Images
        </a>
      </div>
    </div>
  );
}

function ListInput({ f, items, onChange, slotUrls, idBase }: { f: ListField; items: Item[]; onChange: (v: Item[]) => void; slotUrls: Record<string, string>; idBase: string }) {
  const max = f.max ?? 50;
  const min = f.min ?? 0;
  const blank = () => Object.fromEntries(f.fields.map((sf) => [sf.key, ""])) as Item;
  const set = (i: number, k: string, v: string) => onChange(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const move = (i: number, d: number) => {
    const next = [...items];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <ol className="grid grid-cols-[minmax(0,1fr)] gap-3">
        {items.map((it, i) => (
          <li key={i} className="rounded-xl border border-line bg-concrete/40 p-3 sm:p-4">
            <div className="mb-3 flex items-center gap-1">
              <span className="grid h-7 min-w-7 place-items-center rounded-full bg-brand/10 px-2 text-xs font-bold text-brand num">{i + 1}</span>
              <span className="ml-1 flex-1 truncate text-sm font-semibold">
                {f.itemLabel} {i + 1}
                {it[f.fields[0]?.key] ? <span className="font-normal text-ink-soft">: {it[f.fields[0].key]}</span> : null}
              </span>
              <button type="button" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${f.itemLabel.toLowerCase()} ${i + 1} up`}>
                <Icon name="arrow-up" size={16} />
              </button>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface disabled:opacity-30"
                disabled={i === items.length - 1}
                onClick={() => move(i, 1)}
                aria-label={`Move ${f.itemLabel.toLowerCase()} ${i + 1} down`}
              >
                <Icon name="arrow-down" size={16} />
              </button>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-lg text-danger hover:bg-surface disabled:opacity-30"
                disabled={items.length <= min}
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                aria-label={`Remove ${f.itemLabel.toLowerCase()} ${i + 1}`}
                title={items.length <= min ? `Keep at least ${min}` : "Remove"}
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
              {f.fields.map((sf) => {
                const id = `${idBase}-${i}-${sf.key}`;
                const v = it[sf.key] ?? "";
                const wide = sf.type === "textarea" || sf.type === "markdown" || sf.type === "image";
                return (
                  <div key={sf.key} className={`grid gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
                    <label htmlFor={id} className="text-sm font-semibold">
                      {sf.label}
                    </label>
                    {sf.hint ? <small className="-mt-1 text-[0.8125rem] text-ink-soft">{sf.hint}</small> : null}
                    {sf.type === "image" ? (
                      <ImageInput f={sf} value={v} onChange={(x) => set(i, sf.key, x)} slotUrls={slotUrls} />
                    ) : (
                      <TextInput f={sf} id={id} value={v} onChange={(x) => set(i, sf.key, x)} original="" inList />
                    )}
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-outline !min-h-9 text-sm" disabled={items.length >= max} onClick={() => onChange([...items, blank()])}>
          <Icon name="plus" size={16} /> Add {f.itemLabel.toLowerCase()}
        </button>
        <span className="text-[0.8125rem] text-ink-soft num">
          {items.length} of {max === 50 ? "any number" : `up to ${max}`}
          {min ? `, at least ${min}` : ""}
        </span>
      </div>
    </div>
  );
}

function SubmitSave({ dirty, invalid }: { dirty: boolean; invalid: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending || !dirty || invalid}>
      <Icon name="save" size={17} />
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

/**
 * The editor for one page, generated from its definition in the content registry. Every field shows its
 * label, hint and a character guide; changed fields are marked and can be reset one at a time.
 */
export function PageEditor({
  def,
  defaults,
  stored,
  slotUrls,
  action,
}: {
  def: PageDef;
  defaults: ContentValues;
  stored: ContentValues;
  slotUrls: Record<string, string>;
  action: (f: FormData) => void | Promise<void>;
}) {
  const initial = useMemo(() => {
    const v: ContentValues = { ...defaults };
    for (const [k, x] of Object.entries(stored)) if (x !== "" && x !== undefined) v[k] = x;
    return v;
  }, [defaults, stored]);
  const [values, setValues] = useState<ContentValues>(initial);
  const set = (k: string, v: ContentValue) => setValues((cur) => ({ ...cur, [k]: v }));
  const fields = def.sections.flatMap((s) => s.fields);
  const unsaved = fields.filter((f) => !same(values[f.key], initial[f.key])).length;
  const changedFromOriginal = fields.filter((f) => !same(values[f.key], defaults[f.key]) && !(typeof values[f.key] === "string" && values[f.key] === "")).length;
  const invalid = fields.some((f) => {
    if (f.type === "link") return !!linkProblem(String(values[f.key] ?? ""));
    if (f.type === "list") return (values[f.key] as Item[]).some((it) => f.fields.some((sf) => sf.type === "link" && !!linkProblem(it[sf.key] ?? "")));
    return false;
  });

  useEffect(() => {
    if (!unsaved) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  return (
    <form action={action} className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <input type="hidden" name="values" value={JSON.stringify(values)} />
      {def.sections.length > 2 ? (
        <nav aria-label="Sections on this page" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {def.sections.map((s, i) => (
            <a key={i} href={`#sec-${i}`} className="shrink-0 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:border-brand hover:text-brand">
              {s.label}
            </a>
          ))}
        </nav>
      ) : null}
      {def.sections.map((sec, si) => (
        <Section key={si} id={`sec-${si}`} title={sec.label} hint={sec.hint} icon={SECTION_ICONS[si % SECTION_ICONS.length]}>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
            {sec.fields.map((f) => {
              const id = `f-${f.key}`;
              const v = values[f.key];
              const changed = !same(v, defaults[f.key]) && !(typeof v === "string" && v === "");
              const reset = () => set(f.key, defaults[f.key]);
              return (
                <div key={f.key} className={`grid min-w-0 gap-2 ${changed ? "-mx-3 rounded-xl border-l-4 border-accent bg-accent/5 px-3 py-2" : ""}`}>
                  <Head f={f} changed={changed} onReset={reset} htmlFor={f.type === "image" || f.type === "list" ? undefined : id} />
                  {f.hint ? <small className="-mt-1 text-[0.8125rem] text-ink-soft">{f.hint}</small> : null}
                  {f.type === "toggle" ? (
                    <Toggle id={id} on={!!v} onChange={(x) => set(f.key, x)} />
                  ) : f.type === "image" ? (
                    <ImageLink value={String(v ?? "")} original={slotUrls[f.default] ?? ""} />
                  ) : f.type === "list" ? (
                    <ListInput f={f} items={(v as Item[]) ?? []} onChange={(x) => set(f.key, x)} slotUrls={slotUrls} idBase={id} />
                  ) : (
                    <TextInput f={f} id={id} value={String(v ?? "")} onChange={(x) => set(f.key, x)} original={String(defaults[f.key] ?? "")} />
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      ))}
      <SaveBar
        note={
          unsaved ? (
            <span className="font-semibold text-ink">
              {unsaved} unsaved change{unsaved === 1 ? "" : "s"}
            </span>
          ) : changedFromOriginal ? (
            `All saved. ${changedFromOriginal} ${changedFromOriginal === 1 ? "field differs" : "fields differ"} from the original.`
          ) : (
            "All saved. Every field shows the original wording."
          )
        }
      >
        {unsaved ? (
          <button type="button" className="btn btn-outline" onClick={() => setValues(initial)}>
            Discard
          </button>
        ) : null}
        <SubmitSave dirty={unsaved > 0} invalid={invalid} />
      </SaveBar>
    </form>
  );
}
