import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import type { CategoryWithFamilies } from "@/lib/catalogue";
import { telHref, waHref } from "@/lib/format";
import type { Settings } from "@/lib/settings";
import { mediaUrl } from "@/lib/settings";
import { Icon } from "@/components/ui/Icon";
import { CookieSettingsLink } from "./CookieBanner";
import { siteContent } from "./site-content";

type BranchLite = { id: string; name: string; address: string; city: string; state: string; phone: string | null };
type BrandLite = { id: string; name: string; logoId: string | null; website: string | null };

const SOCIAL_ICONS: Record<string, string> = {
  linkedin: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3zM9 9h3.8v1.7h.1c.5-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21H9z",
  facebook: "M14 9h3V5h-3c-2.8 0-4 1.7-4 4.3V11H7v4h3v7h4v-7h3l1-4h-4V9.6c0-.4.3-.6.7-.6Z",
  instagram: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.5-1.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z",
  x: "M4 4h4.5l4 5.6L17 4h3l-6 7.3L20.5 20H16l-4.3-6-5 6H4l6.4-7.6Z",
  youtube: "M22 12s0-3.3-.4-4.8a2.5 2.5 0 0 0-1.8-1.8C18.3 5 12 5 12 5s-6.3 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.7 2 12 2 12s0 3.3.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.7 19 12 19 12 19s6.3 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.5.4-4.8.4-4.8ZM10 15V9l5 3Z",
};

export async function Footer({
  settings: s,
  categories,
  branches,
  brands,
}: {
  settings: Settings;
  categories: CategoryWithFamilies[];
  branches: BranchLite[];
  brands: BrandLite[];
}) {
  const ft = await siteContent("footer");
  const social = Object.entries(s.social).filter(([, v]) => v);
  return (
    <footer className="ambient relative overflow-hidden bg-deep text-white">
      <div className="wrap grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Wordmark name={s.company.shortName} logoUrl={mediaUrl(s.branding.logoDarkId) ?? mediaUrl(s.branding.logoId)} size="lg" tone="onDark" />
          <p className="mt-5 max-w-sm text-white/75">{s.company.tagline}</p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm text-white/85">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" aria-hidden />
            {s.company.groupLine}
          </p>
          {social.length ? (
            <ul className="mt-6 flex gap-2">
              {social.map(([k, v]) => (
                <li key={k}>
                  <a
                    href={v}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={k === "x" ? "X" : k[0].toUpperCase() + k.slice(1)}
                    className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-brand"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d={SOCIAL_ICONS[k]} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <nav aria-label="Products" className="lg:col-span-2">
          <p className="font-semibold">{ft.t("productsHeading")}</p>
          <ul className="mt-4 space-y-2.5 text-white/70">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/products/${c.slug}`} className="transition-colors hover:text-mint">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Company" className="lg:col-span-2">
          <p className="font-semibold">{ft.t("companyHeading")}</p>
          <ul className="mt-4 space-y-2.5 text-white/70">
            {ft.list("companyLinks").map(({ href, label }, i) => (
              <li key={`${href}-${i}`}>
                <Link href={href} className="transition-colors hover:text-mint">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-4">
          <p className="font-semibold">{ft.t("talkHeading")}</p>
          <address className="mt-4 space-y-3 not-italic text-white/80">
            {s.contact.phone ? (
              <a href={telHref(s.contact.phone)} className="group flex items-center gap-3 transition-colors hover:text-white">
                <Row icon="phone" />
                <span className="num">{s.contact.phone}</span>
              </a>
            ) : null}
            {s.contact.whatsapp ? (
              <a href={waHref(s.contact.whatsapp)} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 transition-colors hover:text-white">
                <Row icon="whatsapp" />
                {ft.t("whatsappLabel")}
              </a>
            ) : null}
            {s.contact.email ? (
              <a href={`mailto:${s.contact.email}`} className="group flex items-center gap-3 break-all transition-colors hover:text-white">
                <Row icon="mail" />
                {s.contact.email}
              </a>
            ) : null}
            {s.contact.address ? (
              <p className="flex items-start gap-3">
                <Row icon="pin" />
                <span className="pt-1.5">{s.contact.address}</span>
              </p>
            ) : null}
            {s.contact.hours ? (
              <p className="flex items-center gap-3 text-sm text-white/65">
                <Row icon="clock" />
                {s.contact.hours}
              </p>
            ) : null}
          </address>
          {branches.length > 1 ? (
            <Link href="/contact#branches" className="mt-4 inline-flex items-center gap-1.5 pl-12 text-sm font-semibold text-mint hover:underline">
              {ft.t("allLocations")}
              <Icon name="arrow" size={15} />
            </Link>
          ) : null}
        </div>
      </div>

      {brands.length ? (
        <div className="border-t border-white/10">
          <div className="wrap flex flex-wrap items-center gap-x-8 gap-y-3 py-6">
            <span className="text-sm text-white/60">{ft.t("brandsLabel")}</span>
            {brands.map((b) =>
              b.logoId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={b.id} src={mediaUrl(b.logoId)!} alt={b.name} className="h-7 w-auto rounded bg-white px-2 py-1" />
              ) : (
                <span key={b.id} className="text-lg font-extrabold tracking-wide text-white/85" style={{ fontStretch: "115%" }}>
                  {b.name}
                </span>
              ),
            )}
          </div>
        </div>
      ) : null}

      <div className="border-t border-white/10">
        <div className="wrap flex flex-col gap-3 py-5 text-sm text-white/60 sm:flex-row sm:items-center" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
          <p>
            © {new Date().getFullYear()} {s.company.name}.{" "}
            {s.company.groupUrl ? (
              <a href={s.company.groupUrl} target="_blank" rel="noopener noreferrer" className="hover:text-mint">
                {s.company.groupName}
              </a>
            ) : null}
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 sm:ml-auto">
            <li>
              <Link href="/privacy" className="hover:text-mint">
                {ft.t("privacyLabel")}
              </Link>
            </li>
            <li>
              <Link href="/cookies" className="hover:text-mint">
                {ft.t("cookiesLabel")}
              </Link>
            </li>
            <li>
              <CookieSettingsLink label={ft.t("cookieSettingsLabel")} className="hover:text-mint" />
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

/** The round mint icon at the start of each contact row. */
function Row({ icon }: { icon: string }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.08] text-mint transition-colors group-hover:bg-mint group-hover:text-deep">
      <Icon name={icon} size={17} />
    </span>
  );
}
