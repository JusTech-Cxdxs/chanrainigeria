import { asc } from "drizzle-orm";
import { addMember, updateMember } from "@/app/admin/actions/team";
import { AdminHead, Badge, Check, Field, Flash, Panel, SubmitButton } from "@/components/admin/ui";
import { db, schema } from "@/db";
import { requireAdmin, ROLE_LABEL } from "@/lib/auth";
import { formatDate } from "@/lib/format";

const ROLE_HELP = {
  ADMIN: "Everything, including settings and team.",
  EDITOR: "Products, services, news, locations and media.",
  COORDINATOR: "Enquiries and Enyo chats.",
};

export default async function Team({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const me = await requireAdmin(["ADMIN"]);
  const users = await db.query.adminUsers.findMany({ orderBy: [asc(schema.adminUsers.name)], columns: { passwordHash: false } });
  const RoleSelect = ({ value }: { value?: string }) => (
    <label className="field">
      <span>Role</span>
      <select name="role" defaultValue={value ?? "COORDINATOR"} className="input">
        {Object.entries(ROLE_LABEL).map(([k, v]) => (
          <option key={k} value={k}>
            {v} — {ROLE_HELP[k as keyof typeof ROLE_HELP]}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <>
      <AdminHead title="Team" lead="People who can sign in to this dashboard. Accounts are deactivated rather than deleted, so their history stays readable." />
      <Flash sp={await searchParams} />
      <div className="space-y-4">
        {users.map((u) => (
          <details key={u.id} className="rounded-lg border border-line bg-surface">
            <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-5 py-4">
              <span className="font-semibold">{u.name}</span>
              <span className="text-ink-soft">{u.email}</span>
              <span className="ml-auto flex items-center gap-2 text-sm text-ink-soft">
                {u.id === me.id ? <Badge tone="brand">You</Badge> : null}
                {!u.active ? <Badge tone="danger">Deactivated</Badge> : null}
                {ROLE_LABEL[u.role]} · last sign-in {u.lastLoginAt ? formatDate(u.lastLoginAt, true) : "never"}
              </span>
            </summary>
            <form action={updateMember.bind(null, u.id)} className="grid gap-4 border-t border-line px-5 py-4 sm:grid-cols-2">
              <RoleSelect value={u.role} />
              <Field label="New password (optional)" name="password" type="password" hint="Fill this in only to reset their password." />
              <Check label="Account active" name="active" defaultChecked={u.active} />
              <div className="sm:text-right">
                <SubmitButton>Save</SubmitButton>
              </div>
            </form>
          </details>
        ))}
      </div>
      <Panel title="Add someone" className="mt-6">
        <form action={addMember} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" name="name" required />
          <Field label="Work email" name="email" type="email" required />
          <RoleSelect />
          <Field label="Temporary password" name="password" type="password" required hint="At least 10 characters with letters and numbers. They can change it after signing in." />
          <div>
            <SubmitButton>Add to team</SubmitButton>
          </div>
        </form>
      </Panel>
    </>
  );
}
