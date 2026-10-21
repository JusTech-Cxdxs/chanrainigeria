import { eq, getTableColumns } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { restoreVersion } from "@/app/admin/actions/history";
import { Crumbs } from "@/components/admin/cms";
import { actorName, ENTITY_ICON } from "@/components/admin/ItemHistory";
import { AdminHead, Flash, SubmitButton } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { db, schema } from "@/db";
import { has, requireAdmin } from "@/lib/auth";
import { pageDef } from "@/lib/content-registry";
import { formatDate } from "@/lib/format";
import { ENTITIES, isEntity, revisionVerb, type EntityKey } from "@/lib/history";

export const dynamic = "force-dynamic";

const SKIP = new Set(["id", "updatedAt", "createdAt", "updatedById", "bytesId", "data", "passwordHash", "uploadedById", "reviewedById", "reviewedAt"]);
const MEDIA_KEYS = new Set(["imageId", "logoId", "coverId", "brochureId", "imageIds", "logoDarkId", "faviconId"]);
const NAMES: Record<string, string> = {
  showOnHome: "Show on the website",
  showInEmail: "Show in emails",
  imageIds: "Photos",
  imageId: "Picture",
  logoId: "Logo",
  coverId: "Cover photo",
  brochureId: "Brochure",
  brandId: "Brand",
  categoryId: "Product line",
  familyId: "Machine type",
  specsVerified: "Specifications checked",
  publishedAt: "Publish date",
  deletedAt: "Removed",
  mimeType: "File type",
  slug: "Web address",
  size: "File size (bytes)",
  width: "Width (pixels)",
  height: "Height (pixels)",
  alt: "Description",
  filename: "File name",
};
const human = (k: string) =>
  NAMES[k] ??
  k
    .replace(/\./g, ": ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/: (.)/g, (_, c: string) => `: ${c.toUpperCase()}`);

function show(v: unknown): string {
  if (v === null || v === undefined || v === "") return "Empty";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "string") return v.length > 400 ? `${v.slice(0, 400)}…` : v;
  if (typeof v === "number") return String(v);
  if (Array.isArray(v)) {
    if (!v.length) return "None";
    if (v.every((x) => typeof x === "string")) return v.join(" · ");
    return v.map((x) => (x && typeof x === "object" ? Object.values(x).filter((y) => typeof y === "string" || typeof y === "number").join(": ") : String(x))).join(" · ");
  }
  if (typeof v === "object") {
    const s = Object.entries(v as Record<string, unknown>)
      .map(([k, x]) => `${human(k)}: ${show(x)}`)
      .join("; ");
    return s.length > 400 ? `${s.slice(0, 400)}…` : s || "Empty";
  }
  return String(v);
}
const eqv = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function Value({ k, v }: { k: string; v: unknown }) {
  const ids = MEDIA_KEYS.has(k.split(".").pop() ?? "") ? (Array.isArray(v) ? v : v ? [v] : []).filter((x): x is string => typeof x === "string") : [];
  if (ids.length) {
    return (
      <span className="flex flex-wrap gap-2">
        {ids.map((id) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={id} src={`/media/${id}?w=480`} alt="" className="h-14 w-20 rounded-lg border border-line bg-concrete object-contain" />
        ))}
      </span>
    );
  }
  return <span className="whitespace-pre-line break-words">{show(v)}</span>;
}

/** Flatten a record to comparable rows; page and settings JSON are opened one level so changes are specific. */
function rows(entity: EntityKey, entityId: string, then: Record<string, unknown>, now: Record<string, unknown> | null) {
  if (entity === "page") {
    const def = pageDef(entityId);
    const a = (then.data ?? {}) as Record<string, unknown>;
    const b = (now?.data ?? {}) as Record<string, unknown>;
    const fields = def?.sections.flatMap((s) => s.fields) ?? [];
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
    return keys.map((k) => {
      const f = fields.find((x) => x.key === k);
      return { key: k, label: f?.label ?? human(k), then: k in a ? a[k] : (f?.default ?? ""), now: k in b ? b[k] : (f?.default ?? ""), original: !(k in a) };
    });
  }
  if (entity === "settings") {
    const a = (then.data ?? {}) as Record<string, Record<string, unknown>>;
    const b = (now?.data ?? {}) as Record<string, Record<string, unknown>>;
    const out: { key: string; label: string; then: unknown; now: unknown; original?: boolean }[] = [];
    for (const g of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const ga = a[g] ?? {};
      const gb = b[g] ?? {};
      if (ga && typeof ga === "object" && !Array.isArray(ga)) {
        for (const k of new Set([...Object.keys(ga), ...Object.keys(gb ?? {})])) out.push({ key: `${g}.${k}`, label: human(`${g}.${k}`), then: ga[k], now: gb?.[k] });
      } else out.push({ key: g, label: human(g), then: ga, now: gb });
    }
    return out;
  }
  return Object.keys(then)
    .filter((k) => !SKIP.has(k))
    .map((k) => ({ key: k, label: human(k), then: then[k], now: now ? now[k] : undefined }));
}

export default async function RevisionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const me = await requireAdmin();
  const { id } = await params;
  const rev = await db.query.revisions.findFirst({ where: eq(schema.revisions.id, id), with: { actor: { columns: { name: true, role: true } } } });
  if (!rev || !isEntity(rev.entity)) notFound();
  const entity = rev.entity as EntityKey;
  const e = ENTITIES[entity];
  if (!has(me, "history") && !has(me, e.perm)) redirect("/admin?denied=1");
  const cols = getTableColumns(e.table as PgTable) as Record<string, never>;
  const now = ((await db.select().from(e.table as PgTable).where(eq(cols[e.key], rev.entityId)).limit(1))[0] ?? null) as Record<string, unknown> | null;
  const then = rev.data as Record<string, unknown>;
  const all = rows(entity, rev.entityId, then, now);
  const changed = all.filter((r) => !eqv(r.then, r.now));
  const same = all.length - changed.length;
  const gone = !now || (entity === "media" && !!now.deletedAt);
  const bytesId = entity === "media" && typeof then.bytesId === "string" ? then.bytesId : null;

  return (
    <>
      <Crumbs items={[...(has(me, "history") ? [{ href: "/admin/history", label: "History and undo" }] : []), { href: e.href(rev.entityId), label: rev.label }, { label: "Earlier version" }]} />
      <AdminHead title={rev.label} lead={`${e.label}. ${revisionVerb(rev.action)} by ${actorName(rev.actor, me)} on ${formatDate(rev.createdAt, true)}.`} />
      <Flash sp={await searchParams} />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <section className="overflow-hidden rounded-2xl border border-line bg-surface">
          <header className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 sm:px-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
              <Icon name={ENTITY_ICON[entity]} size={19} />
            </span>
            <div className="flex-1">
              <h2 className="heading text-lg">What restoring will change</h2>
              <p className="text-sm text-ink-soft">
                {gone
                  ? "This item has been deleted. Restoring brings it back as it was."
                  : changed.length || bytesId
                    ? `${changed.length + (bytesId ? 1 : 0)} difference${changed.length + (bytesId ? 1 : 0) === 1 ? "" : "s"} from what is live now${same ? `; ${same} other field${same === 1 ? "" : "s"} are the same` : ""}.`
                    : "This version is the same as what is live now."}
              </p>
            </div>
          </header>
          {bytesId ? (
            <div className="grid grid-cols-2 gap-4 border-b border-line-soft p-4 sm:p-6">
              <figure>
                <figcaption className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">This version</figcaption>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/media/${bytesId}?w=960`} alt="" className="aspect-[4/3] w-full rounded-xl border border-line bg-concrete object-contain" />
              </figure>
              <figure>
                <figcaption className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Live now</figcaption>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/media/${rev.entityId}?w=960&v=${now ? new Date(now.updatedAt as string).getTime().toString(36) : "0"}`} alt="" className="aspect-[4/3] w-full rounded-xl border border-line bg-concrete object-contain" />
              </figure>
            </div>
          ) : null}
          {(gone ? all : changed).length ? (
            <div className="divide-y divide-line-soft">
              <div className="hidden grid-cols-[12rem_1fr_1fr] gap-4 bg-concrete/50 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-ink-soft md:grid">
                <span>Field</span>
                <span>This version</span>
                <span>Live now</span>
              </div>
              {(gone ? all : changed).map((r) => (
                <div key={r.key} className="grid gap-1 px-4 py-3 text-sm sm:px-6 md:grid-cols-[12rem_1fr_1fr] md:gap-4">
                  <span className="font-semibold">{r.label}</span>
                  <div className="rounded-lg bg-brand/5 px-2 py-1 md:bg-transparent md:p-0">
                    <span className="mr-1 text-xs font-semibold text-brand md:hidden">This version: </span>
                    <Value k={r.key} v={r.then} />
                    {"original" in r && r.original ? <span className="ml-1 text-xs text-ink-soft">(original)</span> : null}
                  </div>
                  {!gone ? (
                    <div className="px-2 text-ink-soft md:p-0">
                      <span className="mr-1 text-xs font-semibold md:hidden">Live now: </span>
                      <Value k={r.key} v={r.now} />
                    </div>
                  ) : (
                    <span className="hidden text-ink-soft md:block">Deleted</span>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <aside className="rounded-2xl border border-line bg-surface p-4 sm:p-6 lg:sticky lg:top-4">
          <h2 className="heading text-lg">{gone ? "Bring it back?" : "Restore this version?"}</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {entity === "media" && bytesId
              ? "The file goes back to how it looked in this version everywhere it is used. The current file is kept, so you can switch back."
              : "What is live now is kept as a version first, so you can undo this restore too."}
          </p>
          <form action={restoreVersion.bind(null, rev.id)} className="mt-4 grid gap-2">
            <SubmitButton pendingText="Restoring…">
              <Icon name="undo" size={17} /> {gone ? "Bring it back" : "Restore this version"}
            </SubmitButton>
            <Link href={has(me, "history") ? "/admin/history" : e.href(rev.entityId)} className="btn btn-outline">
              Cancel
            </Link>
          </form>
        </aside>
      </div>
    </>
  );
}
