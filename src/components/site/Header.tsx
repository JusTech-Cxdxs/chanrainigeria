import Link from "next/link";
import type { CategoryWithFamilies } from "@/lib/catalogue";
import type { Settings } from "@/lib/settings";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function Header({ settings, categories }: { settings: Settings; categories: CategoryWithFamilies[] }) {
  const links = [
    { href: "/services", label: "Services" },
    { href: "/book-service", label: "Book a technician" },
    { href: "/parts", label: "Parts" },
    { href: "/news", label: "News" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-concrete/95 backdrop-blur supports-[backdrop-filter]:bg-concrete/80">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 btn btn-primary">
        Skip to content
      </a>
      <div className="wrap flex h-16 items-center gap-6">
        <Logo settings={settings} />

        <nav aria-label="Main" className="ml-auto hidden items-center gap-1 lg:flex">
          <div className="group relative">
            <Link href="/products" className="rounded px-3 py-2 font-semibold hover:text-brand">
              Products
            </Link>
            {categories.length > 0 ? (
              <div className="invisible absolute left-0 top-full w-[36rem] translate-y-1 rounded-md border border-line bg-surface p-4 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="grid grid-cols-3 gap-4">
                  {categories.map((c) => (
                    <div key={c.id}>
                      <Link href={`/products/${c.slug}`} className="heading text-[0.95rem] hover:text-brand">
                        {c.name}
                      </Link>
                      <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                        {c.families.slice(0, 7).map((f) => (
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
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded px-3 py-2 font-semibold hover:text-brand">
              {l.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>

        <details className="relative ml-auto lg:hidden">
          <summary className="btn btn-outline list-none [&::-webkit-details-marker]:hidden" aria-label="Menu">
            Menu
          </summary>
          <nav
            aria-label="Main"
            className="fixed inset-x-0 top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-line bg-surface px-4 pb-6 pt-2 shadow-lg"
          >
            <ul className="divide-y divide-line-soft">
              <li>
                <Link href="/products" className="block py-3 font-semibold">
                  All products
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/products/${c.slug}`} className="block py-3 pl-3 text-ink-soft">
                    {c.name}
                  </Link>
                </li>
              ))}
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="block py-3 font-semibold">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <ThemeToggle withLabel />
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}
