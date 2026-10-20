// Small building blocks shared by the dashboard pages.
import Link from "next/link";
import { SubmitButton } from "./SubmitButton";

export { SubmitButton };

export function Flash({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const saved = sp.saved !== undefined;
  if (!error && !saved && sp.denied === undefined) return null;
  return (
    <p
      role={error || sp.denied ? "alert" : "status"}
      className={`mb-6 rounded-md border-l-4 px-4 py-3 ${error || sp.denied ? "border-danger bg-surface text-danger" : "border-brand bg-surface"}`}
    >
      {error ?? (sp.denied !== undefined ? "Your role doesn't include that section." : typeof sp.saved === "string" && sp.saved ? sp.saved : "Saved.")}
    </p>
  );
}

export function AdminHead({ title, lead, actions, back }: { title: string; lead?: string; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8">
      {back ? (
        <Link href={back.href} className="text-sm text-ink-soft hover:text-brand">
          {back.label}
        </Link>
      ) : null}
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="heading text-3xl">{title}</h1>
          {lead ? <p className="mt-1 max-w-[70ch] text-ink-soft">{lead}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function Panel({ title, children, className = "", aside }: { title?: string; children: React.ReactNode; className?: string; aside?: React.ReactNode }) {
  return (
    <section className={`rounded-lg border border-line bg-surface p-5 sm:p-6 ${className}`}>
      {title ? (
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="heading text-lg">{title}</h2>
          {aside}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Field({
  label,
  name,
  defaultValue,
  hint,
  type = "text",
  required,
  textarea,
  rows,
  placeholder,
  className = "",
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  hint?: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      {textarea ? (
        <textarea name={name} defaultValue={defaultValue ?? ""} rows={rows ?? 4} className="input" required={required} placeholder={placeholder} />
      ) : (
        <input name={name} type={type} defaultValue={defaultValue ?? ""} className="input" required={required} placeholder={placeholder} />
      )}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export function Check({ label, name, defaultChecked, hint }: { label: string; name: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex gap-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 h-4 w-4 accent-[var(--brand)]" />
      <span>
        <span className="font-semibold">{label}</span>
        {hint ? <small className="block text-ink-soft">{hint}</small> : null}
      </span>
    </label>
  );
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "brand" | "warn" | "danger" }) {
  const cls = {
    neutral: "border-line text-ink-soft",
    brand: "border-brand text-brand",
    warn: "border-accent text-[color-mix(in_oklab,var(--accent)_65%,var(--ink))]",
    danger: "border-danger text-danger",
  }[tone];
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{children}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-line px-5 py-10 text-center text-ink-soft">{children}</p>;
}

export function Pager({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pages" className="mt-6 flex items-center justify-between gap-3 text-sm">
      {page > 1 ? (
        <Link className="btn btn-outline" href={href(page - 1)}>
          Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="text-ink-soft num">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link className="btn btn-outline" href={href(page + 1)}>
          Older
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
