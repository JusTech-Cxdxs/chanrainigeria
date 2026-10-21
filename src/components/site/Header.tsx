"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { LanguagePicker } from "./LanguagePicker";
import { openSearch } from "./search-events";
import { ThemeToggle } from "./ThemeToggle";

type NavCategory = { id: string; slug: string; name: string; families: { id: string; slug: string; name: string }[] };

const LINKS = [
  { href: "/services", label: "Services" },
  { href: "/parts", label: "Parts" },
  { href: "/news", label: "News" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header({
  name,
  logoUrl,
  logoDarkUrl,
  categories,
  languages,
  translate,
}: {
  name: string;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  categories: NavCategory[];
  languages: string[];
  translate: boolean;
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
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  // Every public page opens on a dark image banner, so the bar starts see-through with white text.
  const glass = !scrolled && !mega;
  const active = (href: string) => path === href || path.startsWith(`${href}/`);
  const linkCls = (on: boolean) =>
    `relative rounded-full px-3 py-2 text-[0.95rem] font-semibold transition-colors ${
      glass ? (on ? "text-white" : "text-white/85 hover:text-white") : on ? "text-brand" : "text-ink hover:text-brand"
    }`;

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
          Skip to content
        </a>
        <div className="wrap flex h-[var(--header-h)] items-center gap-3">
          <Link href="/" className="mr-auto shrink-0 lg:mr-4" aria-label={`${name} home`}>
            <Wordmark name={name} logoUrl={logoUrl} logoDarkUrl={logoDarkUrl} size="md" tone={glass ? "onDark" : "default"} />
          </Link>

          <nav aria-label="Main" className="mr-auto hidden items-center lg:flex">
            <div className="relative" onMouseEnter={() => setMega(true)} onMouseLeave={() => setMega(false)}>
              <Link href="/products" className={linkCls(active("/products"))} aria-expanded={mega} onFocus={() => setMega(true)}>
                Products
              </Link>
              {mega && categories.length ? (
                <div className="pop absolute left-0 top-full w-[44rem] pt-3" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setMega(false)}>
                  <div className="grid grid-cols-3 gap-6 rounded-2xl border border-line bg-surface p-6 text-ink shadow-2xl">
                    {categories.map((c) => (
                      <div key={c.id}>
                        <Link href={`/products/${c.slug}`} className="heading text-[0.98rem] hover:text-brand">
                          {c.name}
                        </Link>
                        <ul className="mt-3 space-y-1.5 text-[0.92rem] text-ink-soft">
                          {c.families.slice(0, 8).map((f) => (
                            <li key={f.id}>
                              <Link href={`/products/${c.slug}/${f.slug}`} className="hover:text-brand">
                                {f.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={linkCls(active(l.href))}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={openSearch}
              className="inline-flex h-10 items-center gap-2 rounded-full px-2.5 transition-colors hover:bg-current/10 lg:border lg:border-current/20 lg:px-3.5"
              aria-label="Search the site"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <span className="hidden text-sm font-semibold opacity-80 xl:inline">Search</span>
              <kbd className="hidden rounded border border-current/25 px-1.5 text-[11px] font-semibold opacity-60 xl:inline">Ctrl K</kbd>
            </button>
            {translate ? <LanguagePicker languages={languages} /> : null}
            <ThemeToggle className="hidden sm:inline-flex" />
            <Link href="/book-service" className="btn btn-primary ml-2 hidden !min-h-10 !px-4 text-[0.92rem] md:inline-flex">
              Book a technician
            </Link>
            <button
              type="button"
              className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-current/10 lg:hidden"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h10" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="fade absolute inset-0 bg-black/50 backdrop-blur-[2px]" aria-label="Close menu" onClick={() => setOpen(false)} />
          <nav
            aria-label="Main"
            className="slide-in-right absolute inset-y-0 right-0 flex w-[min(24rem,92vw)] flex-col bg-surface text-ink shadow-2xl"
            style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex h-[var(--header-h)] items-center justify-between border-b border-line px-5">
              <Wordmark name={name} logoUrl={logoUrl} logoDarkUrl={logoDarkUrl} size="sm" />
              <button type="button" onClick={() => setOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-concrete" aria-label="Close menu">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div className="scroll-thin flex-1 overflow-y-auto px-5 py-4">
              <Link href="/products" className="block py-2.5 text-lg font-semibold">
                Products
              </Link>
              <ul className="mb-2 border-l-2 border-line-soft pl-4">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link href={`/products/${c.slug}`} className="block py-2 text-ink-soft">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className={`block py-2.5 text-lg font-semibold ${active(l.href) ? "text-brand" : ""}`}>
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="grid gap-3 border-t border-line p-5">
              <Link href="/book-service" className="btn btn-primary w-full">
                Book a technician
              </Link>
              <div className="flex items-center justify-between">
                <ThemeToggle withLabel />
              </div>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
