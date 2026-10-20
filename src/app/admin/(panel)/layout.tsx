import { and, count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/admin/actions/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { db, schema } from "@/db";
import { can, requireAdmin, ROLE_LABEL } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const s = await getSettings();
  const [{ n: newCount }] = await db.select({ n: count() }).from(schema.enquiries).where(eq(schema.enquiries.status, "NEW"));
  const [{ n: downCount }] = await db
    .select({ n: count() })
    .from(schema.enquiries)
    .where(and(eq(schema.enquiries.status, "NEW"), eq(schema.enquiries.type, "SERVICE_BOOKING")));

  const r = user.role;
  const groups = [
    {
      label: "Desk",
      items: [
        { href: "/admin", label: "Overview" },
        ...(can.enquiries(r)
          ? [
              { href: "/admin/enquiries", label: "Enquiries", badge: newCount || undefined, urgent: downCount > 0 },
              { href: "/admin/chats", label: "Enyo chats" },
            ]
          : []),
        { href: "/admin/visitors", label: "Visitors" },
      ],
    },
    ...(can.catalogue(r)
      ? [
          {
            label: "Website",
            items: [
              { href: "/admin/catalogue", label: "Products" },
              { href: "/admin/services", label: "Services" },
              { href: "/admin/news", label: "News" },
              { href: "/admin/branches", label: "Locations" },
              { href: "/admin/media", label: "Media library" },
            ],
          },
        ]
      : []),
    ...(can.settings(r)
      ? [
          {
            label: "Administration",
            items: [
              { href: "/admin/settings", label: "Settings" },
              { href: "/admin/team", label: "Team" },
              { href: "/admin/audit", label: "Activity log" },
            ],
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-5 py-4">
          <Link href="/admin" className="heading text-lg leading-tight">
            {s.company.shortName}
          </Link>
          <span className="ml-auto lg:hidden">
            <ThemeToggle />
          </span>
        </div>
        <AdminNav groups={groups} />
        <div className="hidden border-t border-line px-5 py-4 text-sm lg:block">
          <Link href="/admin/account" className="font-semibold hover:text-brand">
            {user.name}
          </Link>
          <p className="text-ink-soft">{ROLE_LABEL[user.role]}</p>
          <div className="mt-3 flex items-center gap-2">
            <form action={logout}>
              <button className="btn btn-outline !min-h-9 !px-3 text-sm">Sign out</button>
            </form>
            <Link href="/" target="_blank" className="btn btn-quiet text-sm">
              View site
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</div>
        <div className="border-t border-line px-4 py-4 text-sm lg:hidden">
          <span className="font-semibold">{user.name}</span> · {ROLE_LABEL[user.role]}
          <form action={logout} className="mt-2">
            <button className="btn btn-outline !min-h-9 !px-3 text-sm">Sign out</button>
          </form>
        </div>
      </div>
    </div>
  );
}
