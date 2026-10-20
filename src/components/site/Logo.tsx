import Link from "next/link";
import type { Settings } from "@/lib/settings";
import { mediaUrl } from "@/lib/settings";

/** Uploaded logo when set (with an optional dark-mode version); otherwise the company name as a wordmark. */
export function Logo({ settings, className = "" }: { settings: Settings; className?: string }) {
  const light = mediaUrl(settings.branding.logoId);
  const dark = mediaUrl(settings.branding.logoDarkId) ?? light;
  return (
    <Link href="/" className={`inline-flex items-center gap-3 no-underline ${className}`} aria-label={`${settings.company.name} home`}>
      {light && settings.branding.logoDarkId ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={light} alt="" className="h-9 w-auto dark-hide" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dark!} alt="" className="h-9 w-auto dark-show" />
        </>
      ) : light ? (
        // No dark-mode version uploaded: sit the logo on a light plate in dark mode so it stays legible.
        <span className="logo-plate">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={light} alt="" className="h-9 w-auto" />
        </span>
      ) : (
        <span className="heading text-xl leading-none">
          {settings.company.shortName}
        </span>
      )}
    </Link>
  );
}
