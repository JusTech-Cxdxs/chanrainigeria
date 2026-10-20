import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { login } from "@/app/admin/actions/auth";
import { Field, Flash, SubmitButton } from "@/components/admin/ui";
import { db, schema } from "@/db";
import { currentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [{ n }] = await db.select({ n: count() }).from(schema.adminUsers);
  if (n === 0) redirect("/admin/setup");
  if (await currentAdmin()) redirect("/admin");
  return (
    <>
      <h1 className="heading text-2xl">Staff sign-in</h1>
      <p className="mt-1 mb-6 text-ink-soft">For the enquiry desk and website editors.</p>
      <Flash sp={await searchParams} />
      <form action={login} className="grid gap-4">
        <Field label="Email" name="email" type="email" required />
        <Field label="Password" name="password" type="password" required />
        <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
      </form>
      <p className="mt-6 text-sm text-ink-soft">Forgotten your password? Ask an administrator to reset it.</p>
    </>
  );
}
