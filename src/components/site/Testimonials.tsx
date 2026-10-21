export type TestimonialCard = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  rating: number;
  quote: string;
  isExample: boolean;
};

/** Star rating in the brand green (the site keeps amber for urgency only). */
export function Stars({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 text-leaf ${className}`} role="img" aria-label={`${n} / 5`}>
      {[1, 2, 3, 4, 5].map((k) => (
        <svg key={k} width="16" height="16" viewBox="0 0 24 24" fill={k <= n ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  );
}

function Card({ t, hidden, exampleLabel }: { t: TestimonialCard; hidden?: boolean; exampleLabel: string }) {
  const initials = t.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <figure aria-hidden={hidden} className="card flex h-full w-[min(22rem,82vw)] shrink-0 flex-col p-6">
      <div className="flex items-center justify-between">
        <Stars n={t.rating} />
        {t.isExample ? <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-semibold text-ink-soft">{exampleLabel}</span> : null}
      </div>
      <svg width="28" height="28" viewBox="0 0 24 24" className="mt-4 text-brand/25" fill="currentColor" aria-hidden>
        <path d="M9 7H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v2a2 2 0 0 1-2 2v2a4 4 0 0 0 4-4V9a2 2 0 0 0-2-2Zm12 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v2a2 2 0 0 1-2 2v2a4 4 0 0 0 4-4V9a2 2 0 0 0-2-2Z" />
      </svg>
      <blockquote className="mt-2 line-clamp-6 flex-1 text-[0.98rem] leading-relaxed">{t.quote}</blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t border-line-soft pt-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/12 text-sm font-bold text-brand-ink">{initials}</span>
        <span className="min-w-0">
          <span className="block truncate font-semibold">{t.name}</span>
          <span className="block truncate text-sm text-ink-soft">{[t.role, t.company].filter(Boolean).join(", ")}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/** Approved testimonials drifting sideways on their own; hover or focus to pause and read. */
export function TestimonialsMarquee({ items, exampleLabel = "Example" }: { items: TestimonialCard[]; exampleLabel?: string }) {
  if (!items.length) return null;
  const base = items.length < 4 ? [...items, ...items] : items;
  const track = [...base, ...base];
  return (
    <div className="marquee relative overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,black_5%,black_95%,transparent)]" tabIndex={0} aria-label="Customer testimonials, scrolling">
      <ul className="marquee-track flex w-max gap-5" style={{ ["--marquee-speed" as string]: `${Math.max(40, track.length * 7)}s` }}>
        {track.map((t, k) => (
          <li key={`${t.id}-${k}`}>
            <Card t={t} hidden={k >= base.length} exampleLabel={exampleLabel} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TestimonialGrid({ items, exampleLabel = "Example" }: { items: TestimonialCard[]; exampleLabel?: string }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((t, k) => (
        <li key={t.id} className="reveal [&_figure]:w-full" style={{ ["--i" as string]: k % 6 }}>
          <Card t={t} exampleLabel={exampleLabel} />
        </li>
      ))}
    </ul>
  );
}
