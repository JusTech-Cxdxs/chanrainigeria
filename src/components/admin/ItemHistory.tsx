import "server-only";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { StaffUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { ENTITIES, itemRevisions, revisionVerb, type EntityKey } from "@/lib/history";

export const ENTITY_ICON: Record<EntityKey, string> = {
  settings: "gear",
  page: "pages",
  category: "package",
  family: "box",
  product: "forklift",
  brand: "verified",
  service: "tool",
  post: "news",
  branch: "pin",
  testimonial: "quote",
  role: "users",
  media: "image",
};

export function actorName(actor: { name: string; role: string } | null | undefined, viewer: Pick<StaffUser, "isMaster">) {
  if (!actor) return "System";
  return actor.role === "MASTER" && !viewer.isMaster ? "System" : actor.name;
}

/**
 * Earlier versions of one item, shown at the foot of its editor. Each opens the restore screen, which
 * shows what will change and asks to confirm.
 */
export async function ItemHistory({ entity, id, viewer, title = "Earlier versions" }: { entity: EntityKey; id: string; viewer: StaffUser; title?: string }) {
  const perm = ENTITIES[entity].perm;
  if (!viewer.permissions.includes("history") && !viewer.permissions.includes(perm)) return null;
  const revs = await itemRevisions(entity, id, 6);
  return (
    <section className="mt-8 rounded-2xl border border-line bg-surface p-4 sm:p-6" aria-labelledby={`h-${id}`}>
      <header className="mb-3 flex flex-wrap items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
          <Icon name="history" size={19} />
        </span>
        <div className="flex-1">
          <h2 id={`h-${id}`} className="heading text-lg">
            {title}
          </h2>
          <p className="text-sm text-ink-soft">A copy is kept every time this is saved. Open one to see it and put it back.</p>
        </div>
        {viewer.permissions.includes("history") ? (
          <Link href={`/admin/history?type=${entity}&item=${encodeURIComponent(id)}`} className="text-sm font-semibold text-brand">
            Full history
          </Link>
        ) : null}
      </header>
      {revs.length ? (
        <ol className="divide-y divide-line-soft">
          {revs.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/history/${r.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2.5 hover:text-brand">
                <Icon name="undo" size={15} className="text-ink-soft" />
                <span className="font-semibold">{revisionVerb(r.action)}</span>
                <span className="text-sm text-ink-soft">by {actorName(r.actor, viewer)}</span>
                <span className="num ml-auto text-sm text-ink-soft">{formatDate(r.createdAt, true)}</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-ink-soft">No earlier versions yet. One is kept the next time this is saved.</p>
      )}
    </section>
  );
}
