import { asc, ne } from "drizzle-orm";
import Link from "next/link";
import { addMember, unlockMember, updateMember } from "@/app/admin/actions/team";
import { AdminHead, Badge, Check, Field, Flash, Panel, SubmitButton } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

type RoleOpt = { id: string; name: string; description: string };

function RoleSelect({ roles, value }: { roles: RoleOpt[]; value?: string | null }) {
  return (
    <label className="field">
      <span>Role</span>
      <select name="roleId" defaultValue={value ?? ""} className="input" required>
        <option value="" disabled>
          Choose a role
        </option>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      <small>
        What each role can open is set under{" "}
        <Link href="/admin/team/roles" className="text-brand underline">
          Roles and permissions
        </Link>
        .
      </small>
    </label>
  );
}

function NotifyFields({ desks, notify, chosen }: { desks: [string, string][]; notify?: boolean; chosen?: string[] }) {
  return (
    <fieldset className="rounded-xl border border-line p-4 sm:col-span-2">
      <legend className="px-1 text-sm font-semibold">Email alerts</legend>
      <Check label="Email this person about new enquiries and overdue reminders" name="notify" defaultChecked={notify} />
      <p className="mt-3 text-sm text-ink-soft">Only for these desks (leave all unticked for every desk):</p>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
        {desks.map(([k, label]) => (
          <label key={k} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="notifyDesks" value={k} defaultChecked={chosen?.includes(k)} className="h-4 w-4 accent-[var(--brand)]" />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default async function Team({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const me = await requireAdmin("team");
  const sp = await searchParams;
  const [users, roles, s] = await Promise.all([
    db.query.adminUsers.findMany({
      where: me.isMaster ? undefined : ne(schema.adminUsers.role, "MASTER"),
      orderBy: [asc(schema.adminUsers.name)],
      columns: { passwordHash: false },
      with: { roleRef: true },
    }),
    db.query.roles.findMany({ orderBy: [asc(schema.roles.order), asc(schema.roles.name)] }),
    getSettings(),
  ]);
  const desks = Object.entries(s.desks).map(([k, d]) => [k, d.label] as [string, string]);
  const managers = users.filter((u) => u.role !== "MASTER" && u.active && u.roleRef?.permissions.includes("team")).length;
  const adminRole = roles.find((r) => r.name === "Administrator");

  return (
    <>
      <AdminHead
        title="Team"
        lead="Everyone who can sign in to this dashboard. Each person's role decides which sections appear in their sidebar."
        actions={
          <Link href="/admin/team/roles" className="btn btn-outline">
            <Icon name="user-cog" />
            Roles and permissions
          </Link>
        }
      />
      {sp.welcome !== undefined || (me.isMaster && managers === 0) ? (
        <p className="mb-6 flex gap-3 rounded-xl border-l-4 border-brand bg-surface px-4 py-3">
          <Icon name="help" className="mt-0.5 shrink-0 text-brand" />
          Next step: add the company&apos;s own administrator below. They can then add the rest of their team and run the site day to day.
        </p>
      ) : null}
      <Flash sp={sp} />
      <div className="space-y-3">
        {users.map((u) => {
          const locked = u.lockedUntil && u.lockedUntil > new Date();
          const roleName = u.role === "MASTER" ? "Platform support" : (u.roleRef?.name ?? "No role");
          return (
            <details key={u.id} className="group rounded-2xl border border-line bg-surface">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-5 py-4">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                  {u.name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{u.name}</span>
                  <span className="block truncate text-sm text-ink-soft">
                    {u.email}
                    {u.jobTitle ? ` · ${u.jobTitle}` : ""}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-2 text-sm text-ink-soft sm:ml-auto">
                  {u.id === me.id ? <Badge tone="brand">You</Badge> : null}
                  {!u.active ? <Badge tone="danger">Deactivated</Badge> : null}
                  {locked ? <Badge tone="warn">Locked</Badge> : null}
                  {u.notify ? (
                    <span title="Gets enquiry emails" className="text-brand">
                      <Icon name="bell" size={16} />
                    </span>
                  ) : null}
                  <Badge>{roleName}</Badge>
                  <span className="hidden md:inline">last sign-in {u.lastLoginAt ? formatDate(u.lastLoginAt, true) : "never"}</span>
                  <Icon name="chevron-down" className="transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <div className="border-t border-line px-5 py-5">
                <form action={updateMember.bind(null, u.id)} className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" name="name" defaultValue={u.name} />
                  <Field label="Job title (optional)" name="jobTitle" defaultValue={u.jobTitle} placeholder="e.g. Service manager" />
                  {u.role === "MASTER" ? (
                    <p className="text-sm text-ink-soft sm:col-span-2">Platform support account. Not visible to the company&apos;s staff.</p>
                  ) : (
                    <RoleSelect roles={roles} value={u.roleId} />
                  )}
                  <Field label="New password (optional)" name="password" type="password" hint="Fill this in only to reset their password." />
                  <NotifyFields desks={desks} notify={u.notify} chosen={u.notifyDesks} />
                  <Check label="Account active" name="active" defaultChecked={u.active} hint="Deactivated people can't sign in. Their history stays readable." />
                  <div className="sm:text-right">
                    <SubmitButton>Save changes</SubmitButton>
                  </div>
                </form>
                {locked ? (
                  <form action={unlockMember.bind(null, u.id)} className="mt-3">
                    <SubmitButton variant="outline" pendingText="…">
                      Unlock now
                    </SubmitButton>
                  </form>
                ) : null}
              </div>
            </details>
          );
        })}
      </div>
      <Panel title="Add someone" className="mt-6">
        <form action={addMember} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" name="name" required />
          <Field label="Work email" name="email" type="email" required />
          <Field label="Job title (optional)" name="jobTitle" placeholder="e.g. Parts coordinator" />
          <RoleSelect roles={roles} value={me.isMaster && managers === 0 ? adminRole?.id : undefined} />
          <Field label="Temporary password" name="password" type="password" required hint="At least 10 characters with letters and numbers. They can change it after signing in." />
          <NotifyFields desks={desks} />
          <div>
            <SubmitButton>Add to team</SubmitButton>
          </div>
        </form>
      </Panel>
    </>
  );
}
