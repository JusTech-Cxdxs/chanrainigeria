/**
 * The platform credit (from src/lib/platform.ts): the hexagon mark, its core gently pulsing and a
 * dashed orbit turning slowly around it, beside the shimmering name. Dashboard only: the sign-in
 * page, the dashboard footer and the loader. Never on the public website or in emails.
 */
import { poweredByLead } from "@/lib/platform";
import { platformInfo } from "./platform-store";

export { EjoLoader } from "./EjoLoader";

export function PoweredByEjo({ tone = "default", size = "md" }: { tone?: "default" | "onDark"; size?: "md" | "lg" }) {
  const p = platformInfo();
  const dark = tone === "onDark";
  const px = size === "lg" ? 30 : 22;
  return (
    <a href={p.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5" aria-label={`${p.poweredBy}, by ${p.maker}`} title={p.maker}>
      <svg width={px} height={px} viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
        <circle className="ejo-orbit" cx="12" cy="12" r="11" stroke="var(--ejo-accent)" strokeOpacity={dark ? 0.6 : 0.45} strokeWidth="1" strokeDasharray="3 3" />
        <path d="M12 4 L19 8 V16 L12 20 L5 16 V8 Z" stroke="var(--ejo-accent)" strokeWidth="1.5" fill="var(--ejo-accent)" fillOpacity="0.14" />
        <circle className="ejo-core" cx="12" cy="12" r="2.6" fill="var(--ejo-accent)" />
      </svg>
      <span className="leading-tight">
        <span className={`block text-[10px] font-medium uppercase tracking-[0.14em] ${dark ? "text-white/55" : "text-ink-soft"}`}>{poweredByLead(p)}</span>
        <span className={`${dark ? "ejo-shimmer" : "ejo-shimmer-soft"} block font-bold ${size === "lg" ? "text-sm" : "text-xs"}`}>{p.name}</span>
      </span>
    </a>
  );
}
