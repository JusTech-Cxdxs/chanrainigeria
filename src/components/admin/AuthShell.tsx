import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { PoweredByEjo } from "@/components/ejo/PoweredByEjo";
import { ThemeToggle } from "@/components/site/ThemeToggle";

const MODULES: { title: string; text: string; d: string }[] = [
  { title: "Enquiries and bookings", text: "Quotes, field-service visits and parts requests, each with a reference.", d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { title: "Products", text: "Lines, machine types, models, specifications and photos.", d: "M21 8 12 3 3 8v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8" },
  { title: "Testimonials", text: "Visitors share; your team approves before anything shows.", d: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" },
  { title: "News and pages", text: "Stories, banners, the home slider and every image.", d: "M4 4h16v16H4zM8 8h8M8 12h8M8 16h5" },
  { title: "Visitors", text: "Who comes, from where and what they read, with consent.", d: "M3 3v18h18M7 15l4-4 3 3 5-6" },
  { title: "Enyo, the assistant", text: "Answers customers, logs requests and hands over to people.", d: "M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4zM19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" },
];
const ROLES = ["Management", "Sales", "Field service", "Parts", "CNG desk", "Marketing", "IT"];
const PROMISES = ["Access follows your role", "Every action on the activity log", "Sessions end when access ends", "Locked after repeated failed sign-ins"];

export function AuthShell({ company, title, subtitle, children, footer }: { company: { name: string; shortName: string; logoUrl: string | null }; title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  const year = new Date().getFullYear();
  return (
    <main className="flex min-h-dvh bg-surface">
      <section className="relative hidden w-[46%] flex-col justify-between gap-8 overflow-hidden bg-deep p-10 text-white lg:flex xl:p-14" aria-label={company.name}>
        <div className="mesh absolute inset-0 opacity-60" aria-hidden />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-leaf/25 blur-3xl" aria-hidden />
        <div className="rise relative flex items-center justify-between gap-4">
          <Wordmark name={company.shortName} logoUrl={company.logoUrl} size="lg" tone="onDark" />
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/75">Staff dashboard</span>
        </div>

        <div className="rise relative max-w-xl" style={{ animationDelay: "80ms" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ejo-accent)]">Website and enquiry desk</p>
          <h2 className="mt-3 text-[1.9rem] font-bold leading-tight xl:text-[2.2rem]">Everything the website does, in one place.</h2>
          <ul className="mt-7 grid grid-cols-2 gap-x-5 gap-y-4">
            {MODULES.map((m) => (
              <li key={m.title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ejo-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={m.d} />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{m.title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-white/60">{m.text}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-7 [@media(max-height:820px)]:hidden">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">Built for</p>
            <p className="mt-2 flex flex-wrap gap-1.5">
              {ROLES.map((r) => (
                <span key={r} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-white/75">
                  {r}
                </span>
              ))}
            </p>
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-white/60">
            {PROMISES.map((p) => (
              <li key={p} className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ejo-accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12l5 5 9-10" />
                </svg>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="rise relative flex items-end justify-between gap-6" style={{ animationDelay: "160ms" }}>
          <PoweredByEjo tone="onDark" size="lg" />
          <p className="text-xs text-white/45">
            © {year} {company.name}
          </p>
        </div>
      </section>

      <section className="relative flex w-full flex-col lg:w-[54%]">
        <div className="flex items-center justify-between px-6 pt-6 sm:px-10" style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))" }}>
          <div className="lg:hidden">
            <Wordmark name={company.shortName} logoUrl={company.logoUrl} size="sm" />
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="rise w-full max-w-[400px]">
            <h1 className="text-[1.75rem] font-bold tracking-tight">{title}</h1>
            {subtitle ? <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{subtitle}</p> : null}
            <div className="mt-8">{children}</div>
            {footer ? <div className="mt-6">{footer}</div> : null}
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 px-6 pb-8 text-center sm:px-10" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}>
          <p className="flex items-center gap-1.5 text-xs text-ink-soft">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Staff only. Access follows your role and every action is recorded.
          </p>
          <div className="lg:hidden">
            <PoweredByEjo />
          </div>
        </div>
      </section>
    </main>
  );
}
