import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { setup } from "@/app/admin/actions/auth";
import { Field, Flash, SubmitButton } from "@/components/admin/ui";
import { db, schema } from "@/db";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

// Only reachable while no staff accounts exist.
export default async function Setup({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [{ n }] = await db.select({ n: count() }).from(schema.adminUsers);
  if (n > 0) redirect("/admin/login");
  const s = await getSettings();
  return (
    <>
      <h1 className="heading text-2xl">Set up the website</h1>
      <p className="mt-1 mb-6 text-ink-soft">Create the first administrator account. You can add the rest of the team afterwards.</p>
      <Flash sp={await searchParams} />
      <form action={setup} className="grid gap-4">
        <Field label="Company name" name="company" defaultValue={s.company.name} required />
        <Field label="Your full name" name="name" required />
        <Field label="Your work email" name="email" type="email" required />
        <Field label="Password" name="password" type="password" required hint="At least 10 characters, with letters and numbers." />
        <Field label="Confirm password" name="confirm" type="password" required />
        <SubmitButton pendingText="Setting up…">Create account and continue</SubmitButton>
      </form>
    </>
  );
}
