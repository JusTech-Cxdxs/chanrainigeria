"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { PoweredByEjo } from "@/components/ejo/PoweredByEjo";
import { SearchDialog } from "@/components/site/SearchDialog";
import { openSearch } from "@/components/site/search-events";
import { ThemeToggle } from "@/components/site/ThemeToggle";

export type NavItem = { href: string; label: string; icon: string; badge?: number; urgent?: boolean };
export type NavGroup = { label: string; items: NavItem[] };

const ICON: Record<string, string> = {
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  inbox: "M3 13h5l1 3h6l1-3h5M5 4h14l2 9v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z",
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  star: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
  chart: "M3 3v18h18M7 15l4-4 3 3 5-6",
  box: "M21 8 12 3 3 8v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8",
  tool: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z",
  news: "M4 4h13v16H6a2 2 0 0 1-2-2zM17 8h3v10a2 2 0 0 1-2 2M8 8h5M8 12h5M8 16h3",
  image: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15 9.5a1.5 1.5 0 1 0 0-.01",
  pin: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  folder: "M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.8 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3.1 14H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1A2 2 0 1 1 7 4.2l.1.1A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 20.9 10H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  log: "M9 12h6M9 16h6M9 8h2M6 3h9l4 4v14H6z",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-3.5-3.5",
  menu: "M4 7h16M4 12h16M4 17h10",
};

export function Icon({ name, size = 19 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICON[name] ?? ICON.folder} />
    </svg>
  );
}

function Nav({ groups, onPick }: { groups: NavGroup[]; onPick?: () => void }) {
  const path = usePathname();
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`));
  return (
    <nav aria-label="Dashboard" className="space-y-6 px-3">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">{g.label}</p>
          <ul className="space-y-0.5">
            {g.items.map((i) => {
              const on = active(i.href);
              return (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    onClick={onPick}
                    aria-current={on ? "page" : undefined}
                    className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-semibold transition-colors ${on ? "bg-brand/10 text-brand" : "text-ink hover:bg-concrete"}`}
                  >
                    {on ? <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-brand" aria-hidden /> : null}
                    <Icon name={i.icon} />
                    {i.label}
                    {i.badge ? (
                      <span className={`ml-auto min-w-6 rounded-full px-1.5 text-center text-xs leading-5 num ${i.urgent ? "bg-accent text-[#1a1203]" : "bg-brand text-on-brand"}`}>
                        {i.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({
  groups,
  user,
  company,
  logout,
  children,
  enquiryBadge,
}: {
  groups: NavGroup[];
  user: { name: string; role: string; email: string };
  company: { shortName: string; logoUrl: string | null };
  logout: () => Promise<void>;
  children: React.ReactNode;
  enquiryBadge?: number;
}) {
  const path = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setDrawer(false);
    setMenu(false);
  }, [path]);
  useEffect(() => {
    const close = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setMenu(false);
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawer(false);
        setMenu(false);
      }
    };
    document.addEventListener("click", close);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("click", close);
      window.removeEventListener("keydown", esc);
    };
  }, []);
  const initials = user.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sidebar = (onPick?: () => void) => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link href="/admin" onClick={onPick}>
          <Wordmark name={company.shortName} logoUrl={company.logoUrl} size="sm" />
        </Link>
      </div>
      <div className="scroll-thin flex-1 overflow-y-auto py-3">
        <Nav groups={groups} onPick={onPick} />
      </div>
      <div className="shrink-0 border-t border-line px-5 py-4">
        <PoweredByEjo />
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-concrete" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <aside className="hidden w-64 shrink-0 border-r border-line bg-surface lg:block">{sidebar()}</aside>

      {drawer ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="fade absolute inset-0 bg-[#06120a]/50 backdrop-blur-[2px]" aria-label="Close menu" onClick={() => setDrawer(false)} />
          <div className="slide-in absolute inset-y-0 left-0 w-72 max-w-[86vw] bg-surface shadow-2xl" style={{ paddingTop: "env(safe-area-inset-top)" }}>
            {sidebar(() => setDrawer(false))}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line bg-[color-mix(in_srgb,var(--surface)_92%,var(--brand))] px-3 sm:px-6">
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full hover:bg-concrete lg:hidden" aria-label="Open menu" onClick={() => setDrawer(true)}>
            <Icon name="menu" size={22} />
          </button>
          <div className="lg:hidden">
            <Wordmark name={company.shortName} logoUrl={company.logoUrl} size="sm" />
          </div>
          <button
            type="button"
            onClick={openSearch}
            className="ml-auto hidden h-10 w-full max-w-md items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm text-ink-soft hover:border-brand sm:flex lg:ml-0"
          >
            <Icon name="search" size={17} />
            Search enquiries, products, people…
            <kbd className="ml-auto rounded border border-line px-1.5 text-[11px]">Ctrl K</kbd>
          </button>
          <button type="button" onClick={openSearch} className="ml-auto grid h-10 w-10 place-items-center rounded-full hover:bg-concrete sm:hidden" aria-label="Search">
            <Icon name="search" />
          </button>
          <div className="flex items-center gap-1 sm:ml-auto">
            <a href="/" target="_blank" rel="noopener" className="hidden rounded-full px-3 py-2 text-sm font-semibold text-brand hover:bg-brand/10 md:inline">
              View website
            </a>
            <ThemeToggle />
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenu((m) => !m)}
                aria-expanded={menu}
                aria-label="Account"
                className="grid h-10 w-10 place-items-center rounded-full bg-brand text-sm font-bold text-on-brand"
              >
                {initials}
              </button>
              {menu ? (
                <div className="pop fixed inset-x-3 top-16 z-50 rounded-2xl border border-line bg-surface p-2 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-72">
                  <div className="px-3 py-2.5">
                    <p className="font-semibold">{user.name}</p>
                    <p className="truncate text-sm text-ink-soft">{user.email}</p>
                    <p className="mt-1 text-xs font-semibold text-brand">{user.role}</p>
                  </div>
                  <Link href="/admin/account" className="block rounded-xl px-3 py-2.5 hover:bg-concrete">
                    Your account
                  </Link>
                  <a href="/" target="_blank" rel="noopener" className="block rounded-xl px-3 py-2.5 hover:bg-concrete md:hidden">
                    View website
                  </a>
                  <form action={logout}>
                    <button className="w-full rounded-xl px-3 py-2.5 text-left text-danger hover:bg-concrete">Sign out</button>
                  </form>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="scroll-thin flex-1 overflow-y-auto pb-24 lg:pb-0">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">{children}</div>
          <footer className="mx-auto flex max-w-6xl justify-center px-4 pb-8 pt-4 sm:px-8">
            <PoweredByEjo />
          </footer>
        </main>

        {/* App-style tab bar on phones */}
        <nav
          aria-label="Quick"
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {[
            { href: "/admin", label: "Overview", icon: "home" },
            { href: "/admin/enquiries", label: "Enquiries", icon: "inbox", badge: enquiryBadge },
          ].map((t) => {
            const on = t.href === "/admin" ? path === "/admin" : path.startsWith(t.href);
            return (
              <Link key={t.href} href={t.href} className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${on ? "text-brand" : "text-ink-soft"}`}>
                <Icon name={t.icon} size={22} />
                {t.label}
                {t.badge ? <span className="absolute right-[calc(50%-22px)] top-1.5 min-w-5 rounded-full bg-accent px-1 text-center text-[10px] leading-5 text-[#1a1203]">{t.badge}</span> : null}
              </Link>
            );
          })}
          <button type="button" onClick={openSearch} className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold text-ink-soft">
            <Icon name="search" size={22} />
            Search
          </button>
          <button type="button" onClick={() => setDrawer(true)} className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold text-ink-soft">
            <Icon name="menu" size={22} />
            Menu
          </button>
        </nav>
      </div>

      <SearchDialog endpoint="/api/admin/search" placeholder="Search enquiries, customers, products, people…" />
    </div>
  );
}
