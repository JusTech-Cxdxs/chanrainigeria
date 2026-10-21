"use client";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

type Col = { key: string; label: string; placeholder?: string; textarea?: boolean; narrow?: boolean; hidden?: boolean };
type Mode = "specFields" | "faq" | "pairs" | "intervals";
type Row = Record<string, string>;

const camel = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)?/g, (_, c: string | undefined) => (c ? c.toUpperCase() : ""))
    .replace(/^[0-9]+/, "")
    .slice(0, 40);

/** Turns rows back into the plain-text format the server already understands (see src/lib/lines.ts). */
function serialize(mode: Mode, rows: Row[]) {
  const clean = (v: string | undefined) => (v ?? "").replace(/\s*\n\s*/g, " ").trim();
  const filled = rows.filter((r) => Object.values(r).some((v) => v.trim()));
  if (mode === "specFields")
    return filled
      .filter((r) => clean(r.label))
      .map((r) => [r.key || camel(r.label), clean(r.label).replace(/\|/g, "/"), clean(r.unit).replace(/\|/g, "/")].filter(Boolean).join(" | "))
      .join("\n");
  if (mode === "faq")
    return filled
      .filter((r) => clean(r.q) && (r.a ?? "").trim())
      .map((r) => `Q: ${clean(r.q)}\nA: ${(r.a ?? "").trim().replace(/\n\s*\n/g, "\n")}`)
      .join("\n\n");
  if (mode === "intervals")
    return filled
      .filter((r) => /\d/.test(r.hours ?? ""))
      .map((r) => `${(r.hours ?? "").replace(/[^\d]/g, "")}: ${clean(r.tasks)}`)
      .join("\n");
  return filled
    .filter((r) => clean(r.name))
    .map((r) => `${clean(r.name).replace(/:/g, " ")}: ${clean(r.role)}`)
    .join("\n");
}

/**
 * A small table editor (add, remove, reorder rows) for structured lists such as specification fields,
 * FAQs, key components and service intervals. Staff never have to learn a text format.
 */
export function RowsEditor({ name, mode, columns, initial, itemLabel, note }: { name: string; mode: Mode; columns: Col[]; initial: Row[]; itemLabel: string; note?: string }) {
  const [rows, setRows] = useState<Row[]>(initial.length ? initial : []);
  const blank = () => Object.fromEntries(columns.map((c) => [c.key, ""]));
  const set = (i: number, k: string, v: string) => setRows((cur) => cur.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const move = (i: number, d: number) =>
    setRows((cur) => {
      const next = [...cur];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });
  const visible = columns.filter((c) => !c.hidden);
  return (
    <div className="grid gap-2">
      <input type="hidden" name={name} value={serialize(mode, rows)} />
      {rows.length ? (
        <ol className="grid gap-2">
          {rows.map((r, i) => (
            <li key={i} className="flex items-start gap-2 rounded-xl border border-line bg-concrete/40 p-2 sm:p-3">
              <span className="mt-2 grid h-6 min-w-6 place-items-center rounded-full bg-brand/10 px-1.5 text-xs font-bold text-brand num">{i + 1}</span>
              <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                {visible.map((c) => (
                  <label key={c.key} className={`grid gap-1 ${c.narrow ? "w-full sm:w-32" : c.textarea ? "w-full" : "min-w-[min(100%,12rem)] flex-1"}`}>
                    <span className="text-xs font-semibold text-ink-soft">{c.label}</span>
                    {c.textarea ? (
                      <textarea value={r[c.key] ?? ""} onChange={(e) => set(i, c.key, e.target.value)} className="input !min-h-20 text-[0.95rem]" placeholder={c.placeholder} />
                    ) : (
                      <input value={r[c.key] ?? ""} onChange={(e) => set(i, c.key, e.target.value)} className="input !min-h-10 text-[0.95rem]" placeholder={c.placeholder} />
                    )}
                  </label>
                ))}
              </div>
              <div className="flex flex-col">
                <button type="button" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${itemLabel} ${i + 1} up`}>
                  <Icon name="arrow-up" size={15} />
                </button>
                <button
                  type="button"
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface disabled:opacity-30"
                  disabled={i === rows.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={`Move ${itemLabel} ${i + 1} down`}
                >
                  <Icon name="arrow-down" size={15} />
                </button>
                <button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-danger hover:bg-surface" onClick={() => setRows((cur) => cur.filter((_, j) => j !== i))} aria-label={`Remove ${itemLabel} ${i + 1}`}>
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-xl border border-dashed border-line px-4 py-4 text-sm text-ink-soft">None yet.</p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-outline !min-h-9 !px-3 text-sm" onClick={() => setRows((cur) => [...cur, blank()])}>
          <Icon name="plus" size={16} /> Add {itemLabel}
        </button>
        {note ? <small className="text-[0.8125rem] text-ink-soft">{note}</small> : null}
      </div>
    </div>
  );
}
