"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; badge?: number; urgent?: boolean };

export function AdminNav({ groups }: { groups: { label: string; items: Item[] }[] }) {
  const path = usePathname();
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  return (
    <nav aria-label="Dashboard" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-5 lg:overflow-visible lg:pb-6">
      {groups.map((g) => (
        <div key={g.label} className="contents lg:block">
          <p className="hidden px-2 pb-1 text-xs font-semibold text-ink-soft lg:block">{g.label}</p>
          <ul className="contents lg:block lg:space-y-0.5">
            {g.items.map((i) => (
              <li key={i.href} className="shrink-0">
                <Link
                  href={i.href}
                  aria-current={active(i.href) ? "page" : undefined}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-[0.95rem] font-semibold ${
                    active(i.href) ? "bg-brand text-on-brand" : "text-ink hover:bg-concrete"
                  }`}
                >
                  {i.label}
                  {i.badge ? (
                    <span
                      className={`ml-auto rounded-full px-2 text-xs num ${
                        active(i.href) ? "bg-white/20" : i.urgent ? "bg-accent text-ink" : "bg-brand text-on-brand"
                      }`}
                    >
                      {i.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
