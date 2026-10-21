import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { login } from "@/app/admin/actions/auth";
import { AuthShell } from "@/components/admin/AuthShell";
import { LoginForm } from "@/components/admin/LoginForm";
import { Flash } from "@/components/admin/ui";
import { db, schema } from "@/db";
import { currentAdmin } from "@/lib/auth";
import { getSettings, mediaUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [{ n }] = await db.select({ n: count() }).from(schema.adminUsers);
  if (n === 0) redirect("/admin/setup");
  if (await currentAdmin()) redirect("/admin");
  const s = await getSettings();
  return (
    <AuthShell
      company={{ name: s.company.name, shortName: s.company.shortName, logoUrl: mediaUrl(s.branding.logoId) }}
      title="Welcome back"
      subtitle="Sign in to your staff account to continue."
    >
      <Flash sp={await searchParams} />
      <LoginForm action={login} />
    </AuthShell>
  );
}
