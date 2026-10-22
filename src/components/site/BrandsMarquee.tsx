type Brand = { name: string; logo: string | null; website: string | null; scale?: number; aspect?: number };

/**
 * The brands Chanrai supplies, as a full-width light band in both themes (the logos are in the brands' own
 * colours, so a dark band would hide the navy and black ones). No boxes or backgrounds behind the logos:
 * they sit straight on the band, centred title above, gliding slowly and pausing on hover.
 *
 * Why it never jumps: the track is two identical halves and slides left by exactly one half, then starts
 * again, which looks continuous only if both halves are exactly the same width at all times. So
 *  - every logo box has a fixed size worked out from the logo's shape, before the picture has loaded
 *    (a lazy-loaded logo that pops in later would widen the track mid-glide and make it jump);
 *  - the space between logos is padding inside each item, not a gap between items (with a gap the two
 *    halves differ by half a gap, which shows as a small hitch every loop);
 *  - each half is wider than the widest screen, so the end of a half is never on screen.
 */
export function BrandsMarquee({ title, brands }: { title: string; brands: Brand[] }) {
  if (!brands.length) return null;
  const base = Array.from({ length: Math.max(2, Math.ceil(14 / brands.length)) }, () => brands).flat();
  const track = [...base, ...base];
  return (
    <section aria-label={title} className="w-full overflow-hidden bg-white py-10 text-[#0f172a] sm:py-14" style={{ colorScheme: "light" }} data-testid="brands-band">
      <p className="mb-7 px-6 text-center text-sm font-semibold text-[#334155] sm:mb-10 sm:text-base">{title}</p>
      <div className="marquee relative">
        <ul
          className="marquee-track flex w-max items-center [--logo-h:3rem] sm:[--logo-h:4rem] lg:[--logo-h:5rem]"
          style={{ ["--marquee-speed" as string]: `${Math.max(40, base.length * 4)}s` }}
          aria-hidden="true"
        >
          {track.map((b, i) => {
            const s = b.scale ?? 1;
            const a = b.aspect ?? 3;
            return (
              <li key={i} className="flex shrink-0 items-center pr-12 sm:pr-20">
                {b.logo ? (
                  <span
                    className="block"
                    style={{
                      height: `calc(var(--logo-h) * ${s})`,
                      width: `min(calc(var(--logo-h) * ${s * a}), 20rem)`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- small logos with a fixed box; eager so the loop never waits on one */}
                    <img src={b.logo} alt="" loading="eager" decoding="async" draggable={false} className="block h-full w-full object-contain" />
                  </span>
                ) : (
                  <span className="whitespace-nowrap text-2xl font-extrabold tracking-tight text-[#334155] sm:text-3xl">{b.name}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <ul className="sr-only">
        {brands.map((b) => (
          <li key={b.name}>{b.name}</li>
        ))}
      </ul>
    </section>
  );
}
