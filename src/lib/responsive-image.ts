// Responsive picture sources, so a phone downloads a sharp picture its own size instead of
// shrinking (or worse, stretching) one big file. Server- and client-safe.

/** Widths of the ready-made copies kept next to every site picture in /public/images (name-800.jpg …). */
const STATIC_WIDTHS = [800, 1200, 1600] as const;
/** Widths the /media route can resize uploads to (see THUMB_WIDTHS in lib/media). */
const MEDIA_WIDTHS = [960, 1600] as const;

export function srcSetFor(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^\/images\/[\w-]+\.jpg$/.test(url)) {
    const base = url.slice(0, -4);
    return [...STATIC_WIDTHS.map((w) => `${base}-${w}.jpg ${w}w`), `${url} 2400w`].join(", ");
  }
  if (/^\/media\/[0-9a-f-]{36}$/i.test(url)) {
    return [...MEDIA_WIDTHS.map((w) => `${url}?w=${w} ${w}w`), `${url} 2400w`].join(", ");
  }
  return undefined;
}
