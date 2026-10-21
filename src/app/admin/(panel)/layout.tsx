import { and, count, eq, inArray, lt, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { logout } from "@/app/admin/actions/auth";
import { AdminShell, type NavGroup } from "@/components/admin/AdminShell";
import { AssistantMount } from "@/components/admin/AssistantMount";
import { NavProgress } from "@/components/ejo/NavProgress";
import { db, schema } from "@/db";
import { has, requireAdmin } from "@/lib/auth";
import type { Permission } from "@/lib/permissions";
import { getSettings, mediaUrl } from "@/lib/settings";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const s = await getSettings();
  const E = schema.enquiries;
  const overdueBefore = new Date(Date.now() - s.enquiries.overdueHours * 3600_000);
  const [[{ n: newCount }], [{ n: overdue }], [{ n: pending }]] = await Promise.all([
    db.select({ n: count() }).from(E).where(eq(E.status, "NEW")),
    db
      .select({ n: count() })
      .from(E)
      .where(and(inArray(E.status, ["NEW", "IN_PROGRESS"]), sql`(${lt(E.createdAt, overdueBefore)} or ${E.details}->>'urgency' = 'machine_down')`)),
    db.select({ n: count() }).from(schema.testimonials).where(eq(schema.testimonials.status, "PENDING")),
  ]);

  // The sidebar is the permission map: a section that isn't listed is a section you can't open.
  const item = (perm: Permission | null, it: NavGroup["items"][number]) => (perm === null || has(user, perm) ? [it] : []);
  const groups: NavGroup[] = [
    {
      label: "Desk",
      items: [
        { href: "/admin", label: "Overview", icon: "home" },
        ...item("enquiries", { href: "/admin/enquiries", label: "Enquiries", icon: "inbox", badge: newCount || undefined, urgent: overdue > 0 }),
        ...item("chats", { href: "/admin/chats", label: "Enyo chats", icon: "chat" }),
        ...item("testimonials", { href: "/admin/testimonials", label: "Testimonials", icon: "quote", badge: pending || undefined }),
        ...item("visitors", { href: "/admin/visitors", label: "Visitors", icon: "chart" }),
      ],
    },
    {
      label: "Website",
      items: [
        ...item("pages", { href: "/admin/pages", label: "Pages and text", icon: "pages" }),
        ...item("pages", { href: "/admin/appearance", label: "Home slider", icon: "images" }),
        ...item("products", { href: "/admin/catalogue", label: "Products", icon: "package" }),
        ...item("brands", { href: "/admin/catalogue/brands", label: "Brands", icon: "verified" }),
        ...item("services", { href: "/admin/services", label: "Services", icon: "tool" }),
        ...item("news", { href: "/admin/news", label: "News", icon: "news" }),
        ...item("locations", { href: "/admin/branches", label: "Locations", icon: "pin" }),
        ...item("media", { href: "/admin/media", label: "Media library", icon: "folder" }),
      ],
    },
    {
      label: "Administration",
      items: [
        ...item("settings", { href: "/admin/settings", label: "Company settings", icon: "gear" }),
        ...item("email", { href: "/admin/email", label: "Email and alerts", icon: "mail" }),
        ...item("team", { href: "/admin/team", label: "Team and roles", icon: "users" }),
        ...item("history", { href: "/admin/history", label: "History and undo", icon: "history" }),
        ...item("audit", { href: "/admin/audit", label: "Activity log", icon: "log" }),
      ],
    },
  ].filter((g) => g.items.length);

  return (
    <>
      <Suspense>
        <NavProgress />
      </Suspense>
      <AssistantMount />
      <AdminShell
        groups={groups}
        user={{ name: user.name, email: user.email, role: user.roleName }}
        company={{ shortName: s.company.shortName, logoUrl: mediaUrl(s.branding.logoId) }}
        logout={logout}
        enquiryBadge={newCount || undefined}
      >
        {children}
      </AdminShell>
    </>
  );
}
