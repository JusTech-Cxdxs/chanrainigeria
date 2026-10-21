import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { resetPage, savePage } from "@/app/admin/actions/pages";
import { Crumbs } from "@/components/admin/cms";
import { actorName, ItemHistory } from "@/components/admin/ItemHistory";
import { PageEditor } from "@/components/admin/PageEditor";
import { AdminHead, Flash, SubmitButton } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { cleanValues, pageDefaults } from "@/lib/content";
import { pageDef } from "@/lib/content-registry";
import { formatDate } from "@/lib/format";
import { IMAGE_SLOTS } from "@/lib/image-slots";
import { getSettings, imageUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function EditPage({ params, searchParams }: { params: Promise<{ key: string }>; searchParams: Promise<Record<string, string>> }) {
  const me = await requireAdmin("pages");
  const { key } = await params;
  const def = pageDef(key);
  if (!def) notFound();
  const [row, settings] = await Promise.all([db.query.pageContent.findFirst({ where: eq(schema.pageContent.page, key) }), getSettings()]);
  const who = row?.updatedById ? await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, row.updatedById), columns: { name: true, role: true } }) : null;
  const stored = cleanValues(def, row?.data ?? {});
  // Previews for the pictures the site ships with, so "Use original" shows what it means.
  const slotUrls = Object.fromEntries(IMAGE_SLOTS.map((s) => [s.key, imageUrl(settings, s.key)]));

  return (
    <>
      <Crumbs items={[{ href: "/admin/pages", label: "Pages and text" }, { label: def.label }]} />
      <AdminHead
        title={def.label}
        lead={def.description}
        actions={
          <>
            {def.path ? (
              <a href={def.path} target="_blank" rel="noopener" className="btn btn-outline">
                <Icon name="external" size={17} /> View on site
              </a>
            ) : null}
            <a href="#history" className="btn btn-outline">
              <Icon name="history" size={17} /> History
            </a>
          </>
        }
      />
      <Flash sp={await searchParams} />
      <p className="-mt-4 mb-6 flex items-center gap-1.5 text-sm text-ink-soft">
        <Icon name="clock" size={14} />
        {row ? `Last saved ${formatDate(row.updatedAt, true)} by ${actorName(who ?? null, me)}` : "Not edited yet: every field shows the original wording."}
      </p>
      <PageEditor key={row ? new Date(row.updatedAt).getTime() : 0} def={def} defaults={pageDefaults(def)} stored={stored} slotUrls={slotUrls} action={savePage.bind(null, key)} />
      <div id="history" className="scroll-mt-6">
        <ItemHistory entity="page" id={key} viewer={me} title="Earlier versions of this page" />
      </div>
      {row && Object.keys(stored).length ? (
        <form action={resetPage.bind(null, key)} className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-line p-4 text-sm">
          <span className="flex-1 text-ink-soft">Start over? This puts every field on this page back to the original wording. You can undo it from the history above.</span>
          <SubmitButton variant="danger" confirm="Put every field on this page back to the original wording?" pendingText="Resetting…">
            Reset whole page
          </SubmitButton>
        </form>
      ) : null}
    </>
  );
}
