// Plain-text formats for editing structured content in the dashboard, so editors never touch JSON.
import type { Component, Faq, Maintenance, SpecField } from "@/db/schema";

export const toLines = (a: string[] | undefined) => (a ?? []).join("\n");
export const fromLines = (t: string) =>
  t
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

/** "Boom: The main lifting arm" */
export const toPairs = (a: Component[]) => a.map((c) => `${c.name}: ${c.role}`).join("\n");
export const fromPairs = (t: string): Component[] =>
  fromLines(t).map((l) => {
    const i = l.indexOf(":");
    return i > 0 ? { name: l.slice(0, i).trim(), role: l.slice(i + 1).trim() } : { name: l, role: "" };
  });

/** Blocks of "Q: …" then "A: …", separated by a blank line */
export const toFaq = (a: Faq[]) => a.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n");
export const fromFaq = (t: string): Faq[] =>
  t
    .split(/\r?\n\s*\r?\n/)
    .map((b) => {
      const q = b.match(/^\s*Q:\s*([\s\S]*?)(?=\n\s*A:|$)/i)?.[1]?.trim();
      const a = b.match(/\n\s*A:\s*([\s\S]*)$/i)?.[1]?.trim();
      return q && a ? { q, a } : null;
    })
    .filter((x): x is Faq => !!x);

/** "operatingWeight | Operating weight | kg" */
export const toFields = (a: SpecField[]) => a.map((f) => [f.key, f.label, f.unit].filter((x) => x !== undefined).join(" | ")).join("\n");
export const fromFields = (t: string): SpecField[] =>
  fromLines(t)
    .map((l) => l.split("|").map((x) => x.trim()))
    .filter(([k, label]) => k && label)
    .map(([key, label, unit]) => ({ key: key.replace(/\s+/g, ""), label, ...(unit ? { unit } : {}) }));

/** "operatingWeight: 22000" — plain numbers are stored as numbers so they format with separators */
export const toSpecs = (o: Record<string, string | number>) =>
  Object.entries(o)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
export const fromSpecs = (t: string): Record<string, string | number> =>
  Object.fromEntries(
    fromLines(t)
      .map((l) => {
        const i = l.indexOf(":");
        if (i <= 0) return null;
        const k = l.slice(0, i).trim().replace(/\s+/g, "");
        const raw = l.slice(i + 1).trim();
        const v = /^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : raw;
        return raw ? ([k, v] as const) : null;
      })
      .filter((x): x is readonly [string, string | number] => !!x),
  );

/** "250: Grease pins; Check oil" per line */
export const toIntervals = (m: Maintenance) => (m.intervals ?? []).map((i) => `${i.hours}: ${i.tasks.join("; ")}`).join("\n");
export const fromIntervals = (t: string) =>
  fromLines(t)
    .map((l) => {
      const m = l.match(/^([\d,]+)\s*(?:h|hours)?\s*:\s*(.+)$/i);
      return m ? { hours: Number(m[1].replace(/,/g, "")), tasks: m[2].split(";").map((x) => x.trim()).filter(Boolean) } : null;
    })
    .filter((x): x is { hours: number; tasks: string[] } => !!x)
    .sort((a, b) => a.hours - b.hours);
