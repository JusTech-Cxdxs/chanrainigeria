import Link from "next/link";

export type Crumb = { href?: string; label: string };

/** Page banner: a background image under a dark green wash, breadcrumbs, title and intro. */
export function PageHead({
  crumbs = [],
  title,
  lead,
  image,
  children,
}: {
  crumbs?: Crumb[];
  title: string;
  lead?: string;
  image?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-deep text-white">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover"
          style={{ animation: "kenburns 14s ease-out both" }}
          fetchPriority="high"
        />
      ) : (
        <div className="mesh absolute inset-0 -z-20" aria-hidden />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#06120a]/90 via-[#06120a]/65 to-[#06120a]/25" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-[#06120a]/60 to-transparent" aria-hidden />
      <div className="wrap pb-12 pt-[calc(var(--header-h)+2.5rem)] sm:pb-16 sm:pt-[calc(var(--header-h)+4rem)]">
        {crumbs.length ? (
          <nav aria-label="Breadcrumb" className="rise mb-4 text-sm text-white/75">
            <ol className="flex flex-wrap gap-x-2">
              {crumbs.map((c, i) => (
                <li key={i} className="flex gap-2">
                  {c.href ? (
                    <Link href={c.href} className="hover:text-white">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-white">
                      {c.label}
                    </span>
                  )}
                  {i < crumbs.length - 1 ? <span aria-hidden>/</span> : null}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <h1 className="display rise max-w-[20ch] text-[2.4rem] sm:text-5xl lg:text-6xl" style={{ animationDelay: "60ms" }}>
          {title}
        </h1>
        {lead ? (
          <p className="rise mt-4 max-w-[60ch] text-lg text-white/85 sm:text-xl" style={{ animationDelay: "120ms" }}>
            {lead}
          </p>
        ) : null}
        {children ? (
          <div className="rise" style={{ animationDelay: "180ms" }}>
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}
