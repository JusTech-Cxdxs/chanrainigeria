import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { setup } from "@/app/admin/actions/auth";
import { AuthShell } from "@/components/admin/AuthShell";
import { SetupForm } from "@/components/admin/LoginForm";
import { Flash } from "@/components/admin/ui";
import { db, schema } from "@/db";
import { getSettings, mediaUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

// Only reachable while no accounts exist, and only with the SETUP_TOKEN from the server settings.
export default async function Setup({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [{ n }] = await db.select({ n: count() }).from(schema.adminUsers);
  if (n > 0) redirect("/admin/login");
  const s = await getSettings();
  return (
    <AuthShell
      company={{ name: s.company.name, shortName: s.company.shortName, logoUrl: mediaUrl(s.branding.logoId) }}
      title="Set up the dashboard"
      subtitle="This creates the platform account that looks after the site. You then add the company's own administrators."
    >
      <Flash sp={await searchParams} />
      {(process.env.SETUP_TOKEN ?? "").length < 12 ? (
        <p role="alert" className="rounded-xl border-l-4 border-danger bg-concrete px-4 py-3 text-danger">
          Setup is locked. Add a SETUP_TOKEN of at least 12 characters to the server settings, then reload this page.
        </p>
      ) : (
        <SetupForm action={setup} company={s.company.name} />
      )}
    </AuthShell>
  );
}
