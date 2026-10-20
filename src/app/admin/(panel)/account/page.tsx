import { changeOwnPassword } from "@/app/admin/actions/team";
import { AdminHead, Field, Flash, Panel, SubmitButton } from "@/components/admin/ui";
import { requireAdmin, ROLE_LABEL } from "@/lib/auth";

export default async function Account({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const me = await requireAdmin();
  return (
    <>
      <AdminHead title="Your account" lead={`${me.name} · ${me.email} · ${ROLE_LABEL[me.role]}`} />
      <Flash sp={await searchParams} />
      <Panel title="Change password" className="max-w-xl">
        <form action={changeOwnPassword} className="grid gap-4">
          <Field label="New password" name="password" type="password" required hint="At least 10 characters with letters and numbers." />
          <Field label="Confirm new password" name="confirm" type="password" required />
          <div>
            <SubmitButton>Change password</SubmitButton>
          </div>
        </form>
      </Panel>
    </>
  );
}
