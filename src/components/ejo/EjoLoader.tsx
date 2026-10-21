import { platformInfo } from "./platform-store";

/** The platform's hexagon loader, shown while dashboard pages load, with the platform name under it. */
export function EjoLoader({ label = "Loading" }: { label?: string }) {
  const p = platformInfo();
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
        <span className="grid justify-items-center gap-1">
          <span className="ejo-shimmer-soft text-sm font-semibold">{label}</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-soft">{p.name}</span>
        </span>
      </div>
    </div>
  );
}
