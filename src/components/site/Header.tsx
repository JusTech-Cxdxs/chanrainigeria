"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Icon } from "@/components/ui/Icon";
import type { Labels } from "./fill";
import { LanguagePicker } from "./LanguagePicker";
import { openSearch } from "./search-events";
import { ThemeToggle } from "./ThemeToggle";

type NavCategory = { id: string; slug: string; name: string; families: { id: string; slug: string; name: string }[] };
export type NavLink = { label: string; href: string };

/** The section a link belongs to: /products/... marks Products, /news/x marks News. */
function isActive(path: string, href: string) {
  const clean = href.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  if (!clean.startsWith("/")) return false;
  if (clean === "/") return path === "/";
  return path === clean || path.startsWith(`${clean}/`);
}

export function Header({
  name,
  logoUrl,
  logoDarkUrl,
  categories,
  languages,
  translate,
  labels: L,
  links,
}: {
  name: string;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  categories: NavCategory[];
  languages: string[];
  translate: boolean;
  /** The "header" page text */
  labels: Labels;
  links: NavLink[];
}) {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    setOpen(false);
    setMega(false);
  }, [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      setMega(false);
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  // Every public page opens on a dark image banner, so the bar starts see-through with white text.
  const glass = !scrolled && !mega;
  const productsOn = isActive(path, "/products");
  const bookOn = isActive(path, L.bookLink || "/book-service");

  /** Desktop link: green when current, with a short bar under it; mint on the see-through bar. */
  const linkCls = (on: boolean) =>
    `group/nav relative inline-flex items-center gap-1 rounded-full px-3 py-2 text-[0.95rem] font-semibold transition-colors ${
      glass ? (on ? "text-white" : "text-white/85 hover:text-mint") : on ? "text-brand-ink" : "text-ink hover:text-brand-ink"
    }`;
  const bar = (on: boolean) => (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-x-3 -bottom-0.5 h-[3px] origin-center rounded-full transition-transform duration-300 ${glass ? "bg-mint" : "bg-brand-ink"} ${
        on ? "scale-x-100" : "scale-x-0 group-hover/nav:scale-x-50 group-hover/nav:opacity-50"
      }`}
    />
  );

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,color] duration-300 ${
          glass
            ? "bg-gradient-to-b from-black/55 to-transparent text-white"
            : "bg-surface/90 text-ink shadow-[0_1px_0_var(--line)] backdrop-blur-md supports-[backdrop-filter]:bg-surface/80"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <a href="#main" className="btn btn-primary sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3">
          {L.skipLabel}
        </a>
        <div className="wrap flex h-[var(--header-h)] items-center gap-3">
          <Link href="/" className="mr-auto shrink-0 lg:mr-4" aria-label={`${name}, ${L.crumbHome}`}>
            {/* The smallest phones (under 360px) get the compact logo so every header button fits. */}
            <span className="max-[359px]:hidden">
              <Wordmark name={name} logoUrl={logoUrl} logoDarkUrl={logoDarkUrl} size="md" tone={glass ? "onDark" : "default"} />
            </span>
            <span className="hidden max-[359px]:inline-flex">
              <Wordmark name={name} logoUrl={logoUrl} logoDarkUrl={logoDarkUrl} size="sm" tone={glass ? "onDark" : "default"} />
            </span>
          </Link>

          <nav aria-label="Main" className="mr-auto hidden items-center lg:flex">
            <div className="relative" onMouseEnter={() => setMega(true)} onMouseLeave={() => setMega(false)}>
              <Link
                href="/products"
                className={linkCls(productsOn)}
                aria-expanded={mega}
                aria-current={productsOn ? "page" : undefined}
                onFocus={() => setMega(true)}
              >
                {L.productsLabel}
                <Icon name="chevron-down" size={15} className={`transition-transform ${mega ? "rotate-180" : ""}`} />
                {bar(productsOn)}
              </Link>
              {mega && categories.length ? (
                <div className="pop absolute left-0 top-full w-[46rem] pt-3" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setMega(false)}>
                  <div className="overflow-hidden rounded-2xl border border-line bg-surface text-ink shadow-2xl">
                    <div className="grid grid-cols-3 gap-6 p-6">
                      {categories.map((c) => {
                        const lineOn = isActive(path, `/products/${c.slug}`);
                        return (
                          <div key={c.id} className={`-m-3 rounded-xl p-3 ${lineOn ? "bg-brand/[0.07]" : ""}`}>
                            <Link
                              href={`/products/${c.slug}`}
                              aria-current={path === `/products/${c.slug}` ? "page" : undefined}
                              className={`heading flex items-center gap-2 text-[0.98rem] hover:text-brand-ink ${lineOn ? "text-brand-ink" : ""}`}
                            >
                              {lineOn ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-ink" aria-hidden /> : null}
                              {c.name}
                            </Link>
                            <ul className="mt-3 space-y-1.5 text-[0.92rem] text-ink-soft">
                              {c.families.slice(0, 8).map((f) => {
                                const famOn = isActive(path, `/products/${c.slug}/${f.slug}`);
                                return (
                                  <li key={f.id}>
                                    <Link
                                      href={`/products/${c.slug}/${f.slug}`}
                                      aria-current={famOn ? "page" : undefined}
                                      className={`hover:text-brand-ink ${famOn ? "font-semibold text-brand-ink" : ""}`}
                                    >
                                      {f.name}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                    <Link
                      href="/products"
                      className="flex items-center justify-between border-t border-line bg-concrete/60 px-6 py-3.5 text-sm font-semibold text-brand-ink hover:bg-concrete"
                    >
                      {L.productsAll}
                      <Icon name="arrow" size={16} />
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
            {links.map((l) => {
              const on = isActive(path, l.href);
              return (
                <Link key={`${l.href}-${l.label}`} href={l.href} className={linkCls(on)} aria-current={on ? "page" : undefined}>
                  {l.label}
                  {bar(on)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={openSearch}
              className={`inline-flex h-10 items-center gap-2 rounded-full px-2.5 transition-colors lg:border lg:px-3.5 ${
                glass ? "hover:bg-white/10 lg:border-white/25" : "hover:bg-brand/10 hover:text-brand-ink lg:border-line"
              }`}
              aria-label={L.searchAria}
            >
              <Icon name="search" size={19} strokeWidth={2.1} />
              <span className="hidden text-sm font-semibold opacity-80 xl:inline">{L.searchLabel}</span>
              <kbd className="hidden rounded border border-current/25 px-1.5 text-[11px] font-semibold opacity-60 xl:inline">Ctrl K</kbd>
            </button>
            {translate ? <LanguagePicker languages={languages} note={L.translateNote} /> : null}
            <ThemeToggle className="hidden sm:inline-flex" labels={{ system: L.themeAuto, light: L.themeLight, dark: L.themeDark }} />
            <Link
              href={L.bookLink || "/book-service"}
              aria-current={bookOn ? "page" : undefined}
              className={`btn btn-primary ml-2 hidden !min-h-10 !px-4 text-[0.92rem] md:inline-flex ${bookOn ? "ring-2 ring-offset-2 ring-offset-transparent " + (glass ? "ring-mint" : "ring-brand/40") : ""}`}
            >
              <Icon name="calendar" size={16} />
              {L.bookLabel}
            </Link>
            <button
              type="button"
              className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-current/10 lg:hidden"
              aria-label={L.menuOpen}
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Icon name="menu" size={22} strokeWidth={2.1} />
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={L.menuOpen}>
          <button className="fade absolute inset-0 bg-black/50 backdrop-blur-[2px]" aria-label={L.menuClose} onClick={() => setOpen(false)} />
          <nav
            aria-label="Main"
            className="slide-in-right absolute inset-y-0 right-0 flex w-[min(24rem,92vw)] flex-col bg-surface text-ink shadow-2xl"
            style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex h-[var(--header-h)] items-center justify-between border-b border-line px-5">
              <Wordmark name={name} logoUrl={logoUrl} logoDarkUrl={logoDarkUrl} size="sm" />
              <button type="button" onClick={() => setOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-concrete" aria-label={L.menuClose}>
                <Icon name="x" size={22} strokeWidth={2.1} />
              </button>
            </div>
            <div className="scroll-thin flex-1 overflow-y-auto px-3 py-4">
              <MobileLink href="/products" on={productsOn}>
                {L.productsLabel}
              </MobileLink>
              <ul className="mb-2 ml-5 border-l-2 border-line-soft pl-2">
                {categories.map((c) => {
                  const on = isActive(path, `/products/${c.slug}`);
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/products/${c.slug}`}
                        aria-current={on ? "page" : undefined}
                        className={`relative flex items-center gap-2 rounded-lg px-3 py-2 ${on ? "font-semibold text-brand-ink" : "text-ink-soft hover:text-brand-ink"}`}
                      >
                        {on ? <span className="absolute -left-[0.6rem] top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand-ink" aria-hidden /> : null}
                        {c.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {links.map((l) => (
                <MobileLink key={`${l.href}-${l.label}`} href={l.href} on={isActive(path, l.href)}>
                  {l.label}
                </MobileLink>
              ))}
            </div>
            <div className="grid gap-3 border-t border-line p-5">
              <Link href={L.bookLink || "/book-service"} className="btn btn-primary w-full">
                <Icon name="calendar" size={16} />
                {L.bookLabel}
              </Link>
              <div className="flex items-center justify-between">
                <ThemeToggle withLabel labels={{ system: L.themeAuto, light: L.themeLight, dark: L.themeDark }} />
              </div>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}

function MobileLink({ href, on, children }: { href: string; on: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={on ? "page" : undefined}
      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-lg font-semibold transition-colors ${
        on ? "bg-brand/10 text-brand-ink" : "hover:bg-concrete hover:text-brand-ink"
      }`}
    >
      <span className="flex items-center gap-3">
        <span className={`h-2 w-2 rounded-full ${on ? "bg-brand-ink" : "bg-transparent"}`} aria-hidden />
        {children}
      </span>
      <Icon name="chevron-right" size={18} className={on ? "" : "text-ink-soft"} />
    </Link>
  );
}
