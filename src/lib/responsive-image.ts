// Responsive picture sources, so a phone downloads a sharp picture its own size instead of
// shrinking (or worse, stretching) one big file. Server- and client-safe.

/**
 * Ready-made copies kept next to each shipped picture (name-800.jpg …), by folder, and the width of the
 * original. Site pictures and model photos are 2400 wide, machine types 1440, article covers 1600.
 */
const STATIC_SETS: { test: RegExp; widths: number[]; full: number }[] = [
  { test: /^\/images\/types\//, widths: [800], full: 1440 },
  { test: /^\/images\/news\//, widths: [800, 1200], full: 1600 },
  { test: /^\/images\//, widths: [800, 1200, 1600], full: 2400 },
];
/** Widths the /media route can resize uploads to (see THUMB_WIDTHS in lib/media). */
const MEDIA_WIDTHS = [960, 1600] as const;

export function srcSetFor(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^\/images\/(?:[\w-]+\/)?[\w-]+\.jpg$/.test(url)) {
    const set = STATIC_SETS.find((s) => s.test.test(url))!;
    const base = url.slice(0, -4);
    return [...set.widths.map((w) => `${base}-${w}.jpg ${w}w`), `${url} ${set.full}w`].join(", ");
  }
  if (/^\/media\/[0-9a-f-]{36}$/i.test(url)) {
    return [...MEDIA_WIDTHS.map((w) => `${url}?w=${w} ${w}w`), `${url} 2400w`].join(", ");
  }
  return undefined;
}
