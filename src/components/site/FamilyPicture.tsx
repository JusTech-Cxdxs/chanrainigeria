/**
 * Every uploaded picture on the public site sits in one of these frames: a fixed shape, cropped to fill
 * (object-cover), with the same soft dark green shade at the bottom. A tall, small or very bright photo
 * therefore lands exactly where the placeholder drawing was and never overpowers the page.
 */
export function Framed({
  src,
  alt = "",
  ratio = "aspect-[12/7]",
  className = "",
  shade = "soft",
  fallback,
  eager,
  zoom = true,
}: {
  src: string | null | undefined;
  alt?: string;
  /** A Tailwind aspect class; the default matches the line drawings (240 × 140) */
  ratio?: string;
  className?: string;
  /** soft: a light shade at the bottom; strong: for text laid over the picture; none: no shade */
  shade?: "soft" | "strong" | "none";
  /** Shown in the same frame when there is no picture, e.g. the line drawing */
  fallback?: React.ReactNode;
  eager?: boolean;
  /** Slow zoom on hover when the frame sits inside a link with the "group" class */
  zoom?: boolean;
}) {
  if (!src) {
    return fallback ? <span className={`grid ${ratio} w-full place-items-center overflow-hidden ${className}`}>{fallback}</span> : null;
  }
  return (
    <span className={`relative block ${ratio} w-full overflow-hidden rounded-2xl bg-deep ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={`absolute inset-0 h-full w-full object-cover ${zoom ? "transition-transform duration-700 group-hover:scale-105" : ""}`}
      />
      {shade === "none" ? null : (
        <span
          aria-hidden
          className={`absolute inset-0 ${
            shade === "strong" ? "bg-gradient-to-t from-[#06120a] via-[#06120a]/45 to-transparent" : "bg-gradient-to-t from-[#06120a]/40 via-[#06120a]/5 to-transparent"
          }`}
        />
      )}
    </span>
  );
}

/** A machine type's picture, or its line drawing when none is uploaded. */
export function FamilyPicture({ src, fallback, alt }: { src: string | null; fallback: React.ReactNode; alt?: string }) {
  return <Framed src={src} alt={alt} fallback={fallback} />;
}
