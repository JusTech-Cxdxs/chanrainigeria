// Long settings pages: titled sections with an icon, and an in-page section list that follows the scroll.
import { Icon } from "@/components/ui/Icon";
import { SectionNavLinks } from "./SectionNavLinks";

export type SectionLink = { id: string; label: string; icon: string };

export function Section({
  id,
  icon,
  title,
  lead,
  aside,
  children,
}: {
  id: string;
  icon: string;
  title: string;
  lead?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 rounded-2xl border border-line bg-surface">
      <header className="flex flex-wrap items-start gap-3 border-b border-line-soft px-5 py-4 sm:px-6">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand" aria-hidden>
          <Icon name={icon} size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-title`} className="heading text-lg">
            {title}
          </h2>
          {lead ? <p className="mt-0.5 max-w-[70ch] text-sm text-ink-soft">{lead}</p> : null}
        </div>
        {aside ? <div className="w-full sm:w-auto">{aside}</div> : null}
      </header>
      <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
    </section>
  );
}

/** Two columns on wide screens: the section list on the left (sticky), the sections on the right. */
export function SectionedPage({ links, children }: { links: SectionLink[]; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] xl:gap-8">
      <SectionNavLinks links={links} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** A small coloured state line, e.g. "Connected". */
export function StatusPill({ tone, children }: { tone: "ok" | "warn" | "off"; children: React.ReactNode }) {
  const cls = {
    ok: "border-brand/40 bg-brand/10 text-brand",
    warn: "border-accent/60 bg-accent/10 text-[color-mix(in_oklab,var(--accent)_60%,var(--ink))]",
    off: "border-line bg-concrete text-ink-soft",
  }[tone];
  const dot = { ok: "bg-brand", warn: "bg-accent", off: "bg-ink-soft/60" }[tone];
  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
      {children}
    </span>
  );
}
