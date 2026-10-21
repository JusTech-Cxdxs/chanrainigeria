"use server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { audit, has, requireAdmin } from "@/lib/auth";
import { ENTITIES, isEntity, restoreRevision } from "@/lib/history";

/** Put an earlier version back. Allowed with History and undo, or with the section the item belongs to. */
export async function restoreVersion(revisionId: string) {
  const user = await requireAdmin();
  const rev = await db.query.revisions.findFirst({ where: eq(schema.revisions.id, revisionId), columns: { entity: true, entityId: true, label: true } });
  if (!rev || !isEntity(rev.entity)) redirect("/admin/history?error=That%20version%20no%20longer%20exists.");
  const entity = rev!.entity as keyof typeof ENTITIES;
  if (!has(user, "history") && !has(user, ENTITIES[entity].perm)) redirect("/admin?denied=1");
  let href = "";
  try {
    const r = await restoreRevision(revisionId, user.id);
    href = r.href;
  } catch (e) {
    redirect(`/admin/history/${revisionId}?error=${encodeURIComponent(e instanceof Error ? e.message : "This version couldn't be restored.")}`);
  }
  await audit(user.id, "restore", rev!.entity, `Restored an earlier version of ${ENTITIES[entity].label.toLowerCase()} "${rev!.label}"`, rev!.entityId);
  redirect(`${href}${href.includes("?") ? "&" : "?"}saved=${encodeURIComponent("Earlier version restored. The version it replaced is kept in History too.")}`);
}
