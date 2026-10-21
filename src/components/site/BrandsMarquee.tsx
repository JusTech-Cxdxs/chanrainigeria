type Brand = { name: string; logo: string | null; website: string | null; scale?: number };

/**
 * The brands Chanrai supplies, as a full-width light band in both themes (the logos are in the brands' own
 * colours, so a dark band would hide the navy and black ones). No boxes or backgrounds behind the logos:
 * they sit straight on the band, centred title above, gliding slowly and pausing on hover.
 */
export function BrandsMarquee({ title, brands }: { title: string; brands: Brand[] }) {
  if (!brands.length) return null;
  // Enough copies that one half of the track is always wider than the screen, so the loop never shows a gap.
  const base = Array.from({ length: Math.max(2, Math.ceil(12 / brands.length)) }, () => brands).flat();
  const track = [...base, ...base];
  return (
    <section aria-label={title} className="w-full overflow-hidden bg-white py-10 text-[#0f172a] sm:py-14" style={{ colorScheme: "light" }} data-testid="brands-band">
      <p className="mb-7 px-6 text-center text-sm font-semibold text-[#334155] sm:mb-10 sm:text-base">{title}</p>
      <div className="marquee relative">
        <div
          className="marquee-track flex w-max items-center gap-12 sm:gap-20"
          style={{ ["--marquee-speed" as string]: `${Math.max(36, base.length * 4)}s` }}
          aria-hidden="true"
        >
          {track.map((b, i) =>
            b.logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- many small logos, fixed height, no layout shift
              <img
                key={i}
                src={b.logo}
                alt=""
                loading={i < 6 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                className="h-[calc(3rem*var(--s))] w-auto max-w-[11rem] shrink-0 bg-transparent object-contain sm:h-[calc(4rem*var(--s))] sm:max-w-[16rem] lg:h-[calc(5rem*var(--s))] lg:max-w-[20rem]"
                style={{ ["--s" as string]: b.scale ?? 1 }}
              />
            ) : (
              <span key={i} className="shrink-0 whitespace-nowrap text-2xl font-extrabold tracking-tight text-[#334155] sm:text-3xl">
                {b.name}
              </span>
            ),
          )}
        </div>
      </div>
      <ul className="sr-only">
        {brands.map((b) => (
          <li key={b.name}>{b.name}</li>
        ))}
      </ul>
    </section>
  );
}
