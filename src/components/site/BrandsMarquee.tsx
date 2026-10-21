/**
 * "Equipment we supply": the manufacturers' logos drifting slowly across a white band
 * (white in both themes so brand logos always sit on the background they were designed for).
 * Until a logo file is uploaded, the brand name is shown as plain text.
 */
export function BrandsMarquee({ title, brands }: { title: string; brands: { name: string; logo: string | null; website: string | null }[] }) {
  if (!brands.length) return null;
  // Repeat short lists so the band is always full, then double it for a seamless loop.
  const base = Array.from({ length: Math.max(1, Math.ceil(8 / brands.length)) }, () => brands).flat();
  const track = [...base, ...base];
  return (
    <section aria-label={title} className="border-y border-line bg-white py-10 text-[#0f172a]" style={{ colorScheme: "light" }}>
      <div className="wrap mb-6 flex items-center gap-4">
        <h2 className="text-sm font-semibold text-[#475569]">{title}</h2>
        <span className="h-px flex-1 bg-[#e2e8f0]" aria-hidden />
      </div>
      <div className="marquee relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <ul className="marquee-track flex w-max items-center gap-16 sm:gap-24" style={{ ["--marquee-speed" as string]: `${Math.max(30, track.length * 4)}s` }}>
          {track.map((b, k) => (
            <li key={k} aria-hidden={k >= base.length} className="shrink-0">
              {b.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.logo} alt={b.name} className="h-10 w-auto object-contain opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0 sm:h-14" loading="lazy" />
              ) : (
                <span className="text-2xl font-extrabold tracking-wide text-[#334155] opacity-80 sm:text-3xl" style={{ fontStretch: "118%" }}>
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
