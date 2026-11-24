import { Leaf } from "./Leaf";

/**
 * The company lockup, the same family as the group's own stationery: the leaf, the first word of
 * the name large and heavy, and the rest of the name beneath, pushed to the right-hand end by a thin
 * rule in the logo green. "Chanrai Nigeria" gives Chanrai above ——— NIGERIA.
 * If an uploaded logo is set in the dashboard, that image is used instead.
 */
export function Wordmark({
  name,
  logoUrl,
  logoDarkUrl,
  size = "md",
  tone = "default",
}: {
  name: string;
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "default" | "onDark";
}) {
  const box = { sm: "h-8", md: "h-10", lg: "h-12", xl: "h-16" }[size];
  // The company's own lockup, drawn to the group's logo standard, is used unless a logo is uploaded.
  if (!logoUrl && name.trim().toLowerCase() === "chanrai nigeria") {
    logoUrl = "/brand/chanrai-nigeria-lockup.png";
    logoDarkUrl = "/brand/chanrai-nigeria-lockup-white.png";
  }
  if (logoUrl) {
    return logoDarkUrl ? (
      <span className="inline-flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={name} className={`${box} w-auto ${tone === "onDark" ? "hidden" : "dark-hide"}`} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoDarkUrl} alt={name} className={`${box} w-auto ${tone === "onDark" ? "" : "dark-show"}`} />
      </span>
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={name} className={`${box} w-auto`} />
    );
  }

  const words = name.trim().split(/\s+/);
  const top = words[0] ?? name;
  const bottom = words.slice(1).join(" ");
  const t = {
    sm: { leaf: "h-8", top: "text-[19px]", bottom: "text-[9px] tracking-[0.32em]", gap: "mt-[3px]", rule: 1 },
    md: { leaf: "h-10", top: "text-[24px]", bottom: "text-[10px] tracking-[0.34em]", gap: "mt-1", rule: 1.25 },
    lg: { leaf: "h-12", top: "text-[30px]", bottom: "text-[12px] tracking-[0.36em]", gap: "mt-1.5", rule: 1.5 },
    xl: { leaf: "h-16", top: "text-[40px]", bottom: "text-[15px] tracking-[0.38em]", gap: "mt-2", rule: 2 },
  }[size];
  const topColour = tone === "onDark" ? "text-white" : "text-ink";
  const bottomColour = tone === "onDark" ? "text-white/80" : "text-ink-soft";
  return (
    <span className="inline-flex min-w-0 items-center gap-2" aria-label={name} role="img">
      <Leaf className={`${t.leaf} w-auto shrink-0`} />
      <span className="inline-flex min-w-0 flex-col items-stretch" aria-hidden>
        <span className={`font-extrabold leading-none tracking-[0.005em] ${topColour} ${t.top}`} style={{ fontStretch: "108%" }}>
          {top}
        </span>
        {bottom ? (
          <span className={`flex items-center ${t.gap}`}>
            <span className="mr-1.5 min-w-[10px] flex-1" style={{ borderBottom: `${t.rule}px solid var(--leaf)` }} />
            <span className={`font-semibold uppercase leading-none ${bottomColour} ${t.bottom}`} style={{ marginRight: "-0.34em" }}>
              {bottom}
            </span>
          </span>
        ) : null}
      </span>
    </span>
  );
}
