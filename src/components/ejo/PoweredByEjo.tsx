/**
 * "Powered by EJO 100": the platform mark (the EJO hexagon, its core gently pulsing, a dashed orbit
 * turning slowly around it) beside the shimmering credit. Dashboard only.
 */
import { PLATFORM } from "@/lib/platform";

export function PoweredByEjo({ tone = "default", size = "md" }: { tone?: "default" | "onDark"; size?: "md" | "lg" }) {
  const dark = tone === "onDark";
  const px = size === "lg" ? 30 : 22;
  return (
    <a href={PLATFORM.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5" aria-label={PLATFORM.poweredBy}>
      <svg width={px} height={px} viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
        <circle className="ejo-orbit" cx="12" cy="12" r="11" stroke="var(--ejo-accent)" strokeOpacity={dark ? 0.6 : 0.45} strokeWidth="1" strokeDasharray="3 3" />
        <path d="M12 4 L19 8 V16 L12 20 L5 16 V8 Z" stroke="var(--ejo-accent)" strokeWidth="1.5" fill="var(--ejo-accent)" fillOpacity="0.14" />
        <circle className="ejo-core" cx="12" cy="12" r="2.6" fill="var(--ejo-accent)" />
      </svg>
      <span className="leading-tight">
        <span className={`block text-[10px] font-medium uppercase tracking-[0.14em] ${dark ? "text-white/55" : "text-ink-soft"}`}>Powered by</span>
        <span className={`${dark ? "ejo-shimmer" : "ejo-shimmer-soft"} block font-bold ${size === "lg" ? "text-sm" : "text-xs"}`}>{PLATFORM.name}</span>
      </span>
    </a>
  );
}

/** The EJO hexagon loader, used while dashboard pages load. */
export function EjoLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid min-h-[50vh] place-items-center" role="status" aria-live="polite">
      <div className="grid justify-items-center gap-4">
        <div className="relative h-24 w-24">
          <span className="absolute inset-0 rounded-full bg-[var(--ejo-accent)] opacity-20 blur-2xl" style={{ animation: "core 1.8s ease-in-out infinite" }} />
          <span className="absolute inset-2 rounded-full border-2 border-dashed border-[var(--ejo-accent)]/60" style={{ animation: "orbit 2.2s linear infinite" }} />
          <span className="absolute inset-0 rounded-full border border-line" style={{ animation: "orbit 3s linear infinite reverse" }} />
          <svg viewBox="0 0 24 24" className="absolute inset-[30%]" aria-hidden>
            <path d="M12 2 L21 7 V17 L12 22 L3 17 V7 Z" fill="rgba(34,197,94,0.15)" stroke="var(--ejo-accent)" strokeWidth="1.4" />
            <circle className="ejo-core" cx="12" cy="12" r="3" fill="var(--ejo-accent)" />
          </svg>
        </div>
        <span className="ejo-shimmer-soft text-sm font-semibold">{label}</span>
      </div>
    </div>
  );
}
