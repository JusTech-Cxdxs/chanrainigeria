import { and, count, eq, inArray, lt, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { logout } from "@/app/admin/actions/auth";
import { AdminShell, type NavGroup } from "@/components/admin/AdminShell";
import { NavProgress } from "@/components/ejo/NavProgress";
import { db, schema } from "@/db";
import { can, requireAdmin, ROLE_LABEL } from "@/lib/auth";
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

  const r = user.role;
  const groups: NavGroup[] = [
    {
      label: "Desk",
      items: [
        { href: "/admin", label: "Overview", icon: "home" },
        ...(can.enquiries(r)
          ? [
              { href: "/admin/enquiries", label: "Enquiries", icon: "inbox", badge: newCount || undefined, urgent: overdue > 0 },
              { href: "/admin/chats", label: "Enyo chats", icon: "chat" },
            ]
          : []),
        { href: "/admin/testimonials", label: "Testimonials", icon: "star", badge: pending || undefined },
        { href: "/admin/visitors", label: "Visitors", icon: "chart" },
      ],
    },
    ...(can.catalogue(r)
      ? [
          {
            label: "Website",
            items: [
              { href: "/admin/catalogue", label: "Products", icon: "box" },
              { href: "/admin/services", label: "Services", icon: "tool" },
              { href: "/admin/news", label: "News", icon: "news" },
              { href: "/admin/appearance", label: "Slider and images", icon: "image" },
              { href: "/admin/branches", label: "Locations", icon: "pin" },
              { href: "/admin/media", label: "Media library", icon: "folder" },
            ],
          },
        ]
      : []),
    ...(can.settings(r)
      ? [
          {
            label: "Administration",
            items: [
              { href: "/admin/settings", label: "Settings", icon: "gear" },
              { href: "/admin/team", label: "Team", icon: "users" },
              { href: "/admin/audit", label: "Activity log", icon: "log" },
            ],
          },
        ]
      : []),
  ];

  return (
    <>
      <Suspense>
        <NavProgress />
      </Suspense>
      <AdminShell
        groups={groups}
        user={{ name: user.name, email: user.email, role: ROLE_LABEL[user.role] }}
        company={{ shortName: s.company.shortName, logoUrl: mediaUrl(s.branding.logoId) }}
        logout={logout}
        enquiryBadge={newCount || undefined}
      >
        {children}
      </AdminShell>
    </>
  );
}
