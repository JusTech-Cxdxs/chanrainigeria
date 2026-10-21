/**
 * "Equipment we supply": the manufacturers' logos in their own colours, drifting across a full-width
 * white band (white in both themes, so every logo sits on the background it was designed for).
 * A brand without a logo shows its name.
 */
export function BrandsMarquee({ title, brands }: { title: string; brands: { name: string; logo: string | null; website: string | null; scale?: number }[] }) {
  if (!brands.length) return null;
  // Repeat short lists so the band is always full, then double it for a seamless loop.
  const base = Array.from({ length: Math.max(1, Math.ceil(10 / brands.length)) }, () => brands).flat();
  const track = [...base, ...base];
  return (
    <section aria-label={title} className="w-full overflow-hidden border-y border-[#e2e8f0] bg-white text-[#0f172a]" style={{ colorScheme: "light" }}>
      <div className="wrap flex items-center gap-4 pt-8 sm:pt-10">
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#475569] sm:text-sm">{title}</h2>
        <span className="h-px flex-1 bg-[#e2e8f0]" aria-hidden />
      </div>
      <div className="marquee relative w-full py-5 sm:py-7">
        <ul className="marquee-track flex w-max items-center" style={{ ["--marquee-speed" as string]: `${Math.max(30, track.length * 4)}s` }}>
          {track.map((b, k) => (
            <li key={k} aria-hidden={k >= base.length} className="flex h-16 shrink-0 items-center px-8 sm:h-24 sm:px-14">
              {b.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={b.logo}
                  alt={k < base.length ? b.name : ""}
                  className="h-[calc(3.25rem*var(--s))] w-auto max-w-[260px] object-contain sm:h-[calc(4.75rem*var(--s))] sm:max-w-[380px]"
                  style={{ ["--s" as string]: b.scale ?? 1 }}
                  loading="lazy"
                  draggable={false}
                />
              ) : (
                <span className="text-2xl font-extrabold tracking-wide text-[#334155] sm:text-3xl" style={{ fontStretch: "118%" }}>
                  {b.name}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
