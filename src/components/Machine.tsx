// Original line drawings of generic machines, drawn in the style of an engineering elevation.
// They stand in for photography until the brand's official images are uploaded in Admin.
import type { SVGProps } from "react";

export type MachineKind =
  | "excavator"
  | "loader"
  | "dozer"
  | "grader"
  | "skidsteer"
  | "backhoe"
  | "roller"
  | "forklift"
  | "pallet"
  | "stacker"
  | "tractor"
  | "compressor"
  | "dispenser"
  | "cascade"
  | "skid"
  | "station";

const S = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" } as const;

function Wheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} {...S} />
      <circle cx={cx} cy={cy} r={r * 0.45} {...S} strokeWidth={1.5} />
    </g>
  );
}

function Track({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  const h = 20;
  return (
    <g>
      <rect x={x1} y={y - h} width={x2 - x1} height={h} rx={h / 2} {...S} />
      {Array.from({ length: Math.max(2, Math.floor((x2 - x1 - h) / 22) + 1) }, (_, i) => (
        <circle key={i} cx={x1 + h / 2 + i * ((x2 - x1 - h) / Math.max(1, Math.floor((x2 - x1 - h) / 22)))} cy={y - h / 2} r={5} {...S} strokeWidth={1.5} />
      ))}
    </g>
  );
}

const drawings: Record<MachineKind, React.ReactNode> = {
  excavator: (
    <g>
      <Track x1={96} x2={206} y={126} />
      <path d="M102 106 V86 H198 a8 8 0 0 1 8 8 V106 Z" {...S} />
      <path d="M150 86 V56 H176 L188 86" {...S} />
      <path d="M156 62 H172 L180 82 H156 Z" {...S} strokeWidth={1.5} />
      <path d="M128 86 L112 42 L96 28 L88 34 L102 48 L116 86" {...S} />
      <path d="M124 74 L104 44" {...S} strokeWidth={3} />
      <path d="M92 30 L58 94 L66 98 L98 36" {...S} />
      <path d="M58 94 Q44 98 42 114 L62 116 L68 98" {...S} />
      <path d="M86 50 L70 86" {...S} strokeWidth={3} />
    </g>
  ),
  loader: (
    <g>
      <Wheel cx={112} cy={108} r={18} />
      <Wheel cx={190} cy={108} r={18} />
      <path d="M96 100 V82 H136 L146 92 H170 V74 H210 V100" {...S} />
      <path d="M150 74 V44 H178 L184 74" {...S} />
      <path d="M154 50 H174 L178 70 H154 Z" {...S} strokeWidth={1.5} />
      <path d="M140 84 L82 70 L78 78 L136 92" {...S} />
      <path d="M84 62 Q56 60 50 76 L54 96 L86 90 L82 70" {...S} />
      <path d="M128 76 L96 62" {...S} strokeWidth={3} />
    </g>
  ),
  dozer: (
    <g>
      <Track x1={86} x2={196} y={126} />
      <path d="M92 106 V80 H170 V60 H196 V106" {...S} />
      <path d="M150 80 V50 H178 L186 60" {...S} />
      <path d="M154 56 H174 V76 H154 Z" {...S} strokeWidth={1.5} />
      <path d="M58 70 Q48 96 58 124 L72 124 Q64 96 70 70 Z" {...S} />
      <path d="M70 108 L96 100" {...S} strokeWidth={3} />
      <path d="M72 82 L100 88" {...S} strokeWidth={3} />
      <path d="M196 96 L214 112 L210 124" {...S} />
    </g>
  ),
  grader: (
    <g>
      <Wheel cx={38} cy={112} r={14} />
      <Wheel cx={170} cy={112} r={14} />
      <Wheel cx={204} cy={112} r={14} />
      <path d="M38 98 V82 H150 V90" {...S} />
      <path d="M150 90 V50 H176 L180 90 H214 V100" {...S} />
      <path d="M154 56 H172 L174 84 H154 Z" {...S} strokeWidth={1.5} />
      <path d="M92 116 Q100 104 116 104 L120 118 Z" {...S} />
      <path d="M104 106 L104 82" {...S} strokeWidth={3} />
    </g>
  ),
  skidsteer: (
    <g>
      <Wheel cx={108} cy={112} r={14} />
      <Wheel cx={158} cy={112} r={14} />
      <path d="M96 102 V64 H156 L170 80 V102 Z" {...S} />
      <path d="M110 64 V40 H152 L156 64" {...S} />
      <path d="M118 46 H146 V62 H118 Z" {...S} strokeWidth={1.5} />
      <path d="M160 62 L176 70 L90 92 L84 84 Z" {...S} />
      <path d="M86 76 Q62 76 60 92 L64 110 L92 104 L90 88" {...S} />
    </g>
  ),
  backhoe: (
    <g>
      <Wheel cx={92} cy={106} r={14} />
      <Wheel cx={160} cy={102} r={22} />
      <path d="M76 98 V80 H130 V60 H176 V96" {...S} />
      <path d="M130 60 V34 H168 L172 60" {...S} />
      <path d="M78 82 L48 76 L44 84 L74 92" {...S} />
      <path d="M50 70 Q30 70 28 84 L32 100 L54 96 L50 78" {...S} />
      <path d="M176 70 L206 34 L220 40 L196 80" {...S} />
      <path d="M212 38 L226 92 L216 96" {...S} />
      <path d="M226 92 Q236 104 226 116 L212 108 Z" {...S} />
    </g>
  ),
  roller: (
    <g>
      <circle cx={70} cy={102} r={24} {...S} />
      <path d="M50 96 H90" {...S} strokeWidth={1.5} />
      <Wheel cx={180} cy={106} r={20} />
      <path d="M58 74 H96 L106 86 H160 V64 H206 V100" {...S} />
      <path d="M164 64 V36 H194 L198 64" {...S} />
      <path d="M168 42 H190 V60 H168 Z" {...S} strokeWidth={1.5} />
    </g>
  ),
  forklift: (
    <g>
      <Wheel cx={92} cy={110} r={16} />
      <Wheel cx={172} cy={112} r={14} />
      <path d="M78 100 V78 H112 L120 60 H160 V78 H196 V104 H186" {...S} />
      <path d="M120 60 L114 30 H158 L162 60" {...S} />
      <path d="M118 36 H156" {...S} strokeWidth={1.5} />
      <path d="M62 24 V124" {...S} strokeWidth={3} />
      <path d="M70 24 V124" {...S} />
      <path d="M62 24 H70" {...S} />
      <path d="M58 122 H18 V126 H66" {...S} />
      <path d="M58 100 H66" {...S} />
      <rect x="150" y="80" width="40" height="18" rx="2" {...S} strokeWidth={1.5} />
      <path d="M156 86 h8 M160 82 v8 M176 86 h8" {...S} strokeWidth={1.5} />
    </g>
  ),
  pallet: (
    <g>
      <path d="M40 116 H150 V108 H48 Z" {...S} />
      <Wheel cx={56} cy={120} r={5} />
      <Wheel cx={136} cy={120} r={5} />
      <path d="M150 116 V80 H186 V116 Z" {...S} />
      <Wheel cx={170} cy={120} r={8} />
      <path d="M176 80 L196 34 M190 30 h14" {...S} strokeWidth={3} />
      <rect x="156" y="88" width="24" height="14" rx="2" {...S} strokeWidth={1.5} />
    </g>
  ),
  stacker: (
    <g>
      <path d="M100 20 V120 M108 20 V120 M100 20 H108" {...S} />
      <path d="M96 116 H50 V120 H104" {...S} />
      <path d="M96 92 H104" {...S} />
      <path d="M108 120 V60 H150 V120 Z" {...S} />
      <Wheel cx={130} cy={122} r={6} />
      <path d="M150 70 L172 40 M166 36 h14" {...S} strokeWidth={3} />
      <path d="M60 120 H96" {...S} strokeWidth={1.5} />
      <Wheel cx={58} cy={124} r={3} />
    </g>
  ),
  tractor: (
    <g>
      <Wheel cx={88} cy={110} r={16} />
      <Wheel cx={168} cy={110} r={16} />
      <path d="M66 102 V72 H126 V48 H164 V72 H192 V102" {...S} />
      <path d="M130 54 H160 V70 H130 Z" {...S} strokeWidth={1.5} />
      <path d="M192 96 H212 M212 90 v12" {...S} />
    </g>
  ),
  compressor: (
    <g>
      <path d="M24 122 H216" {...S} strokeWidth={3} />
      <rect x="32" y="40" width="176" height="78" rx="3" {...S} />
      {[52, 62, 72, 82, 92].map((y) => (
        <path key={y} d={`M44 ${y} H96`} {...S} strokeWidth={1.5} />
      ))}
      <rect x="110" y="52" width="34" height="56" rx="4" {...S} />
      <rect x="152" y="58" width="22" height="50" rx="4" {...S} />
      <path d="M144 70 H152 M127 52 V40 M163 58 V40" {...S} />
      <rect x="184" y="50" width="16" height="22" rx="2" {...S} strokeWidth={1.5} />
      <path d="M208 84 H226 V122" {...S} />
    </g>
  ),
  dispenser: (
    <g>
      <path d="M70 122 H170" {...S} strokeWidth={3} />
      <rect x="92" y="20" width="56" height="102" rx="4" {...S} />
      <rect x="100" y="30" width="40" height="22" rx="2" {...S} strokeWidth={1.5} />
      <path d="M106 41 h12 M124 41 h10" {...S} strokeWidth={1.5} />
      <path d="M100 64 h40 M100 72 h40" {...S} strokeWidth={1.5} />
      <path d="M148 82 Q186 84 182 112 L176 118" {...S} />
      <path d="M170 116 h12 v6 h-12 Z" {...S} strokeWidth={1.5} />
      <path d="M92 82 Q58 86 62 112" {...S} />
      <path d="M56 112 h12 v6 h-12 Z" {...S} strokeWidth={1.5} />
    </g>
  ),
  cascade: (
    <g>
      <path d="M24 122 H216" {...S} strokeWidth={3} />
      <rect x="30" y="40" width="180" height="76" rx="3" {...S} />
      {[50, 64, 78, 92, 106].map((y) => (
        <g key={y}>
          <rect x="40" y={y - 5} width="150" height="10" rx="5" {...S} strokeWidth={1.5} />
          <path d={`M190 ${y} H200`} {...S} strokeWidth={1.5} />
        </g>
      ))}
      <path d="M200 50 V106" {...S} />
    </g>
  ),
  skid: (
    <g>
      <path d="M24 122 H216" {...S} strokeWidth={3} />
      <path d="M30 116 H210" {...S} />
      <path d="M20 84 H220" {...S} strokeWidth={3} />
      <path d="M60 84 V116 M180 84 V116" {...S} />
      <circle cx={90} cy={84} r={12} {...S} />
      <path d="M84 84 h12 M90 78 v12" {...S} strokeWidth={1.5} />
      <rect x="120" y="70" width="30" height="28" rx="3" {...S} />
      <circle cx={135} cy={56} r={10} {...S} />
      <path d="M135 66 V70" {...S} />
      <path d="M164 74 v20 M174 74 v20" {...S} />
      <path d="M160 74 h18 M160 94 h18" {...S} strokeWidth={1.5} />
    </g>
  ),
  station: (
    <g>
      <path d="M8 122 H232" {...S} strokeWidth={3} />
      <path d="M20 40 H220 V50 H20 Z" {...S} />
      <path d="M40 50 V122 M200 50 V122" {...S} />
      <rect x="96" y="64" width="44" height="58" rx="3" {...S} />
      <rect x="104" y="72" width="28" height="14" rx="2" {...S} strokeWidth={1.5} />
      <path d="M140 92 Q164 94 160 116" {...S} />
      <path d="M96 92 Q72 94 76 116" {...S} />
    </g>
  ),
};

export function Machine({
  kind,
  title,
  dimensions = true,
  className,
  ...rest
}: { kind: MachineKind | string; title?: string; dimensions?: boolean } & SVGProps<SVGSVGElement>) {
  const k = (kind in drawings ? kind : "excavator") as MachineKind;
  return (
    <svg
      viewBox="0 0 240 140"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      className={`drawing ${className ?? ""}`}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {dimensions ? (
        <g className="dim" fill="none" stroke="currentColor" strokeWidth={1}>
          <path d="M8 132 H232" />
          <path d="M8 128 V136 M232 128 V136" />
          <path d="M236 14 V128" strokeDasharray="2 4" />
        </g>
      ) : null}
      {drawings[k]}
    </svg>
  );
}

/** Pick a drawing from a family slug when no illustration is set. */
export function machineForSlug(slug: string, fallback: string = "excavator"): MachineKind | string {
  const s = slug.toLowerCase();
  const map: [RegExp, MachineKind][] = [
    [/excavat/, "excavator"],
    [/backhoe/, "backhoe"],
    [/skid-?steer/, "skidsteer"],
    [/loader/, "loader"],
    [/doz/, "dozer"],
    [/grader/, "grader"],
    [/roller|compact/, "roller"],
    [/pallet/, "pallet"],
    [/stacker|reach/, "stacker"],
    [/tow|tractor/, "tractor"],
    [/forklift|counterbalance/, "forklift"],
    [/dispens/, "dispenser"],
    [/cascade|storage/, "cascade"],
    [/skid/, "skid"],
    [/station/, "station"],
    [/compress|booster/, "compressor"],
  ];
  return map.find(([re]) => re.test(s))?.[1] ?? fallback;
}
