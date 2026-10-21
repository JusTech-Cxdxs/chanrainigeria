// Layout pieces for the content editors (pages, products, brands, news, media). Server- and client-safe.
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/** "Products / Construction equipment / Excavators" trail above an editor's title. */
export function Crumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-2 text-sm text-ink-soft">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((c, i) => (
          <li key={i} className="flex min-w-0 items-center gap-1">
            {i > 0 ? <Icon name="chevron-right" size={14} className="shrink-0 opacity-60" /> : null}
            {c.href ? (
              <Link href={c.href} className="truncate hover:text-brand">
                {c.label}
              </Link>
            ) : (
              <span className="truncate font-semibold text-ink" aria-current="page">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** A card section with an icon, title and a short explanation of what it controls. */
export function Section({
  title,
  hint,
  icon,
  children,
  aside,
  id,
  className = "",
}: {
  title: string;
  hint?: React.ReactNode;
  icon?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-6 rounded-2xl border border-line bg-surface p-4 sm:p-6 ${className}`}>
      <header className="mb-5 flex flex-wrap items-start gap-3">
        {icon ? (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
            <Icon name={icon} size={19} />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 className="heading text-lg">{title}</h2>
          {hint ? <p className="mt-0.5 text-sm text-ink-soft">{hint}</p> : null}
        </div>
        {aside ? <div className="flex flex-wrap items-center gap-2">{aside}</div> : null}
      </header>
      {children}
    </section>
  );
}

/** Save bar that stays in view at the bottom of long forms (above the phone tab bar). */
export function SaveBar({ children, note }: { children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 mt-6 mr-[4.5rem] lg:bottom-4 lg:mr-20">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-[0_12px_32px_-12px_rgb(6_18_10/0.35)] backdrop-blur">
        <div className="min-w-0 flex-1 text-sm text-ink-soft">{note}</div>
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      </div>
    </div>
  );
}

/** Friendly empty state with an icon and an optional action. */
export function EmptyState({ icon = "box", title, children, action }: { icon?: string; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-line bg-surface/50 px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
        <Icon name={icon} size={26} />
      </span>
      <p className="heading text-lg">{title}</p>
      {children ? <div className="max-w-[48ch] text-sm text-ink-soft">{children}</div> : null}
      {action}
    </div>
  );
}

/** Status pill used in list rows. */
export function Pill({ on, yes = "On the site", no = "Hidden" }: { on: boolean; yes?: string; no?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${on ? "bg-brand/10 text-brand" : "bg-concrete text-ink-soft ring-1 ring-line"}`}
    >
      <Icon name={on ? "eye" : "eye-off"} size={12} />
      {on ? yes : no}
    </span>
  );
}

/** Explains a field in plain words, under its label. */
export function Hint({ children }: { children: React.ReactNode }) {
  return <small className="block text-[0.8125rem] text-ink-soft">{children}</small>;
}
