import Link from "next/link";

export type Crumb = { href?: string; label: string };

export function PageHead({
  crumbs = [],
  title,
  lead,
  children,
}: {
  crumbs?: Crumb[];
  title: string;
  lead?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-line">
      <div className="wrap py-10 sm:py-14">
        {crumbs.length ? (
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink-soft">
            <ol className="flex flex-wrap gap-x-2">
              {crumbs.map((c, i) => (
                <li key={i} className="flex gap-2">
                  {c.href ? (
                    <Link href={c.href} className="hover:text-brand">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current="page">{c.label}</span>
                  )}
                  {i < crumbs.length - 1 ? <span aria-hidden>/</span> : null}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <h1 className="display max-w-[22ch] text-4xl sm:text-5xl">{title}</h1>
        {lead ? <p className="mt-4 max-w-[60ch] text-lg text-ink-soft">{lead}</p> : null}
        {children}
      </div>
    </div>
  );
}
