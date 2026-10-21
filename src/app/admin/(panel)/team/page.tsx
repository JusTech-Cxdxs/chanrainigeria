import { asc, ne } from "drizzle-orm";
import { addMember, unlockMember, updateMember } from "@/app/admin/actions/team";
import { AdminHead, Badge, Check, Field, Flash, Panel, SubmitButton } from "@/components/admin/ui";
import { db, schema } from "@/db";
import { requireAdmin, ROLE_HELP, ROLE_LABEL } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function RoleSelect({ value }: { value?: string }) {
  return (
    <label className="field">
      <span>Role</span>
      <select name="role" defaultValue={value ?? "COORDINATOR"} className="input">
        {(["ADMIN", "EDITOR", "COORDINATOR"] as const).map((k) => (
          <option key={k} value={k}>
            {ROLE_LABEL[k]}: {ROLE_HELP[k]}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function Team({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const me = await requireAdmin(["ADMIN"]);
  const sp = await searchParams;
  const users = await db.query.adminUsers.findMany({
    where: me.role === "MASTER" ? undefined : ne(schema.adminUsers.role, "MASTER"),
    orderBy: [asc(schema.adminUsers.name)],
    columns: { passwordHash: false },
  });
  const orgAdmins = users.filter((u) => u.role === "ADMIN" && u.active).length;

  return (
    <>
      <AdminHead title="Team" lead="People who can sign in to this dashboard. Accounts are deactivated rather than deleted, so their history stays readable." />
      {sp.welcome !== undefined || (me.role === "MASTER" && orgAdmins === 0) ? (
        <p className="mb-6 rounded-xl border-l-4 border-brand bg-surface px-4 py-3">
          Next step: add the company&apos;s own administrator below. They can then add the rest of their team and run the site day to day.
        </p>
      ) : null}
      <Flash sp={sp} />
      <div className="space-y-3">
        {users.map((u) => {
          const locked = u.lockedUntil && u.lockedUntil > new Date();
          return (
            <details key={u.id} className="rounded-2xl border border-line bg-surface">
              <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-5 py-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                  {u.name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <span className="font-semibold">{u.name}</span>
                <span className="text-ink-soft">{u.email}</span>
                <span className="flex flex-wrap items-center gap-2 text-sm text-ink-soft sm:ml-auto">
                  {u.id === me.id ? <Badge tone="brand">You</Badge> : null}
                  {!u.active ? <Badge tone="danger">Deactivated</Badge> : null}
                  {locked ? <Badge tone="warn">Locked</Badge> : null}
                  {ROLE_LABEL[u.role]} · last sign-in {u.lastLoginAt ? formatDate(u.lastLoginAt, true) : "never"}
                </span>
              </summary>
              <div className="border-t border-line px-5 py-4">
                <form action={updateMember.bind(null, u.id)} className="grid gap-4 sm:grid-cols-2">
                  {u.role === "MASTER" ? <p className="text-sm text-ink-soft">Platform support account. Not visible to the company&apos;s staff.</p> : <RoleSelect value={u.role} />}
                  <Field label="New password (optional)" name="password" type="password" hint="Fill this in only to reset their password." />
                  <Check label="Account active" name="active" defaultChecked={u.active} />
                  <div className="sm:text-right">
                    <SubmitButton>Save</SubmitButton>
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
          <RoleSelect value={me.role === "MASTER" && orgAdmins === 0 ? "ADMIN" : undefined} />
          <Field label="Temporary password" name="password" type="password" required hint="At least 10 characters with letters and numbers. They can change it after signing in." />
          <div>
            <SubmitButton>Add to team</SubmitButton>
          </div>
        </form>
      </Panel>
    </>
  );
}
