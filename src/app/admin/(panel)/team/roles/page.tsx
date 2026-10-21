import { asc, count } from "drizzle-orm";
import { deleteRole, saveRole } from "@/app/admin/actions/team";
import { AdminHead, Badge, Field, Flash, Panel, SubmitButton } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { PERMISSION_GROUPS, PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

function PermissionGrid({ chosen }: { chosen: string[] }) {
  return (
    <div className="grid gap-5 sm:col-span-2 lg:grid-cols-2">
      {PERMISSION_GROUPS.map((g) => (
        <fieldset key={g} className="rounded-xl border border-line p-4">
          <legend className="px-1 text-sm font-semibold">{g}</legend>
          <div className="space-y-3">
            {PERMISSIONS.filter((p) => p.group === g).map((p) => (
              <label key={p.key} className="flex gap-3">
                <input type="checkbox" name="perm" value={p.key} defaultChecked={chosen.includes(p.key)} className="mt-1 h-4 w-4 accent-[var(--brand)]" />
                <span>
                  <span className="font-semibold">{p.label}</span>
                  <small className="block text-ink-soft">{p.help}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

export default async function Roles({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin("team");
  const sp = await searchParams;
  const [roles, usage] = await Promise.all([
    db.query.roles.findMany({ orderBy: [asc(schema.roles.order), asc(schema.roles.name)] }),
    db.select({ roleId: schema.adminUsers.roleId, n: count() }).from(schema.adminUsers).groupBy(schema.adminUsers.roleId),
  ]);
  const people = (id: string) => usage.find((u) => u.roleId === id)?.n ?? 0;

  return (
    <>
      <AdminHead
        title="Roles and permissions"
        lead="A role is a set of dashboard sections. People only see the sections their role includes, so the sidebar stays short and nobody opens what they shouldn't."
        back={{ href: "/admin/team", label: "← Team" }}
      />
      <Flash sp={sp} />
      <div className="space-y-3">
        {roles.map((r) => (
          <details key={r.id} className="group rounded-2xl border border-line bg-surface">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-5 py-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
                <Icon name={r.permissions.includes("team") ? "shield" : "user-cog"} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 font-semibold">
                  {r.name}
                  {r.isSystem ? <Badge>Built in</Badge> : null}
                </span>
                <span className="block text-sm text-ink-soft">{r.description || `${r.permissions.length} sections`}</span>
              </span>
              <span className="text-sm text-ink-soft">
                {people(r.id)} {people(r.id) === 1 ? "person" : "people"} · {r.permissions.length} of {PERMISSIONS.length} sections
              </span>
              <Icon name="chevron-down" className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-line px-5 py-5">
              <form action={saveRole.bind(null, r.id)} className="grid gap-4 sm:grid-cols-2">
                <Field label="Role name" name="name" defaultValue={r.name} required />
                <Field label="What this role is for" name="description" defaultValue={r.description} />
                <PermissionGrid chosen={r.permissions} />
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <SubmitButton>Save role</SubmitButton>
                </div>
              </form>
              {!r.isSystem ? (
                <form action={deleteRole.bind(null, r.id)} className="mt-3">
                  <SubmitButton variant="outline" pendingText="Deleting…">
                    Delete role
                  </SubmitButton>
                </form>
              ) : null}
            </div>
          </details>
        ))}
      </div>
      <Panel title="Create a role" className="mt-6">
        <form action={saveRole.bind(null, "new")} className="grid gap-4 sm:grid-cols-2">
          <Field label="Role name" name="name" required placeholder="e.g. Parts desk" />
          <Field label="What this role is for" name="description" placeholder="One line staff will understand" />
          <PermissionGrid chosen={[]} />
          <div>
            <SubmitButton>Create role</SubmitButton>
          </div>
        </form>
      </Panel>
    </>
  );
}
