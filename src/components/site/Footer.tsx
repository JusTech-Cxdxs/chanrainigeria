import Link from "next/link";
import type { CategoryWithFamilies } from "@/lib/catalogue";
import { telHref, waHref } from "@/lib/format";
import type { Settings } from "@/lib/settings";
import { CookieSettingsLink } from "./CookieBanner";

type BranchLite = { id: string; name: string; address: string; city: string; state: string; phone: string | null };

export function Footer({
  settings,
  categories,
  branches,
}: {
  settings: Settings;
  categories: CategoryWithFamilies[];
  branches: BranchLite[];
}) {
  const s = settings;
  const desks = Object.entries(s.desks).filter(([, d]) => d.email || d.phone);
  const social = Object.entries(s.social).filter(([, v]) => v);
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="wrap grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="heading text-xl">{s.company.name}</p>
          <p className="mt-3 text-ink-soft measure">{s.company.heritage}</p>
          {s.company.groupUrl ? (
            <a href={s.company.groupUrl} className="btn-quiet mt-2 inline-block px-0" rel="noopener" target="_blank">
              {s.company.groupName}
            </a>
          ) : null}
          {social.length ? (
            <ul className="mt-5 flex flex-wrap gap-4 text-sm">
              {social.map(([k, v]) => (
                <li key={k}>
                  <a href={v} target="_blank" rel="noopener" className="capitalize hover:text-brand">
                    {k === "x" ? "X" : k === "linkedin" ? "LinkedIn" : k === "youtube" ? "YouTube" : k}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <nav aria-label="Products" className="md:col-span-3">
          <p className="font-semibold">Products</p>
          <ul className="mt-3 space-y-2 text-ink-soft">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/products/${c.slug}`} className="hover:text-brand">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/services" className="hover:text-brand">
                Services
              </Link>
            </li>
            <li>
              <Link href="/parts" className="hover:text-brand">
                Parts
              </Link>
            </li>
          </ul>
        </nav>

        <div className="md:col-span-5">
          <p className="font-semibold">Talk to the right desk</p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {desks.map(([k, d]) => (
              <div key={k}>
                <dt className="text-sm text-ink-soft">{d.label}</dt>
                <dd className="text-[0.95rem]">
                  {d.phone ? (
                    <a href={telHref(d.phone)} className="block hover:text-brand num">
                      {d.phone}
                    </a>
                  ) : null}
                  {d.email ? (
                    <a href={`mailto:${d.email}`} className="block break-all hover:text-brand">
                      {d.email}
                    </a>
                  ) : null}
                  {d.whatsapp ? (
                    <a href={waHref(d.whatsapp)} className="block hover:text-brand" target="_blank" rel="noopener">
                      WhatsApp
                    </a>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
          {branches.length ? (
            <address className="mt-6 not-italic text-ink-soft">
              {branches.slice(0, 2).map((b) => (
                <p key={b.id} className="mt-1">
                  <span className="font-semibold text-ink">{b.name}:</span> {b.address}, {b.city}, {b.state}
                </p>
              ))}
              <Link href="/contact#branches" className="btn-quiet mt-1 inline-block px-0">
                All locations
              </Link>
            </address>
          ) : null}
        </div>
      </div>
      <div className="border-t border-line-soft">
        <div className="wrap flex flex-col gap-3 py-5 text-sm text-ink-soft sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {s.company.name}
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 sm:ml-auto">
            <li>
              <Link href="/privacy" className="hover:text-brand">
                Privacy notice
              </Link>
            </li>
            <li>
              <Link href="/cookies" className="hover:text-brand">
                Cookie notice
              </Link>
            </li>
            <li>
              <CookieSettingsLink />
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
