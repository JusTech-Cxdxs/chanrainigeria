/** Nigerian numbers: 0911 186 7252 → +2349111867252 */
export function toE164(phone: string) {
  const d = phone.replace(/[^\d+]/g, "");
  if (!d) return "";
  if (d.startsWith("+")) return d;
  if (d.startsWith("234")) return `+${d}`;
  if (d.startsWith("0")) return `+234${d.slice(1)}`;
  return `+${d}`;
}
export const telHref = (phone: string) => (phone ? `tel:${toE164(phone)}` : "");
export const waHref = (phone: string, text?: string) =>
  phone ? `https://wa.me/${toE164(phone).replace("+", "")}${text ? `?text=${encodeURIComponent(text)}` : ""}` : "";

export function formatDate(d: Date | string | null | undefined, withTime = false) {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(d));
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Number with thousands separators; strings pass through. */
export function formatSpec(v: string | number | undefined) {
  if (v === undefined || v === null || v === "") return "";
  return typeof v === "number" ? new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2 }).format(v) : v;
}

export const plural = (n: number, w: string, p = `${w}s`) => `${n} ${n === 1 ? w : p}`;

/** Spec value with its unit: numbers always get the unit; text gets it unless it already includes it. */
export function specValue(v: string | number | undefined, unit?: string) {
  const s = formatSpec(v);
  if (!s || !unit) return s;
  if (typeof v === "number") return `${s} ${unit}`;
  return s.toLowerCase().includes(unit.toLowerCase()) || !/\d/.test(s) ? s : `${s} ${unit}`;
}
