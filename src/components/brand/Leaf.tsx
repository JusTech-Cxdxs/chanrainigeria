import { LEAF_PATHS, LEAF_VIEWBOX } from "./leaf-paths";

/** The Kewalram Chanrai leaf as a vector, in the logo green unless a colour is given. */
export function Leaf({ className = "", color = "var(--leaf)", animated = false, title }: { className?: string; color?: string; animated?: boolean; title?: string }) {
  return (
    <svg
      viewBox={LEAF_VIEWBOX}
      className={`${animated ? "leaf-loader " : ""}${className}`}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      fill={color}
    >
      {title ? <title>{title}</title> : null}
      {LEAF_PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
