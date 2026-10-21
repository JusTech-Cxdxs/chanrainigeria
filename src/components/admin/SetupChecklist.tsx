import { and, count, eq, isNotNull, isNull, ne } from "drizzle-orm";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { db, schema } from "@/db";
import { has, type StaffUser } from "@/lib/auth";
import type { Permission } from "@/lib/permissions";
import { aiReady as aiReadyFor } from "@/lib/ai";
import { mailConfigured } from "@/lib/mail";
import { getSettings } from "@/lib/settings";

type Step = { done: boolean; title: string; text: string; href: string; perm: Permission };

/** "Getting started" list on the overview. Disappears once everything is done. */
export async function SetupChecklist({ user }: { user: StaffUser }) {
  const s = await getSettings();
  const [[{ staff }], [{ logos }], [{ uploads }], [{ examples }]] = await Promise.all([
    db.select({ staff: count() }).from(schema.adminUsers).where(and(ne(schema.adminUsers.role, "MASTER"), eq(schema.adminUsers.active, true))),
    db.select({ logos: count() }).from(schema.brands).where(isNotNull(schema.brands.logoId)),
    db.select({ uploads: count() }).from(schema.media).where(and(eq(schema.media.isPrivate, false), isNull(schema.media.deletedAt))),
    db.select({ examples: count() }).from(schema.testimonials).where(and(eq(schema.testimonials.isExample, true), eq(schema.testimonials.status, "APPROVED"))),
  ]);
  const mailReady = mailConfigured(s);
  const aiReady = aiReadyFor(s.enyo.model);

  const all: Step[] = [
    { done: staff >= 2, title: "Add your team", text: "Give each person their own sign-in and a role.", href: "/admin/team", perm: "team" },
    { done: mailReady, title: "Connect email", text: "So customers get confirmations and your desks get new enquiries.", href: "/admin/email", perm: "email" },
    { done: !!s.branding.logoId, title: "Upload the company logo", text: "Shown in the header, emails and dashboard.", href: "/admin/settings", perm: "settings" },
    { done: logos > 0, title: "Add brand logos", text: "LiuGong, SOPAN, BYD and any others you supply.", href: "/admin/catalogue/brands", perm: "brands" },
    { done: uploads >= 5, title: "Replace the placeholder photos", text: "Slider, page banners and product pictures.", href: "/admin/pages", perm: "pages" },
    { done: !!(s.privacy.dpoName && s.privacy.dpoEmail), title: "Name your Data Protection Officer", text: "Required for the privacy notice.", href: "/admin/settings", perm: "settings" },
    { done: examples === 0, title: "Swap the example testimonials for real ones", text: "Take down the examples once customers have shared theirs.", href: "/admin/testimonials", perm: "testimonials" },
    { done: aiReady, title: "Switch on Enyo's full answers", text: "Add an AI key on the server. Until then Enyo points visitors to the right page.", href: "/admin/settings#enyo", perm: "settings" },
  ];
  const steps = all.filter((st) => has(user, st.perm));

  const left = steps.filter((st) => !st.done);
  if (!left.length) return null;
  const pct = Math.round(((steps.length - left.length) / steps.length) * 100);

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-4 border-b border-line px-5 py-4 sm:px-6">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
          <Icon name="checklist" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="heading text-lg">Getting started</h2>
          <p className="text-sm text-ink-soft">
            {steps.length - left.length} of {steps.length} done. Finish these and the site is fully yours.
          </p>
        </div>
        <div className="h-2 w-40 overflow-hidden rounded-full bg-concrete" aria-hidden>
          <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <ul className="grid divide-y divide-line-soft sm:grid-cols-2 sm:divide-y-0">
        {steps.map((st) => (
          <li key={st.title} className="sm:border-b sm:border-line-soft sm:odd:border-r">
            <Link href={st.href} className={`flex gap-3 px-5 py-4 transition-colors hover:bg-concrete sm:px-6 ${st.done ? "opacity-60" : ""}`}>
              <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${st.done ? "border-brand bg-brand text-on-brand" : "border-line"}`}>
                {st.done ? <Icon name="check" size={14} strokeWidth={3} /> : null}
              </span>
              <span>
                <span className={`block font-semibold ${st.done ? "line-through" : ""}`}>{st.title}</span>
                <span className="block text-sm text-ink-soft">{st.text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
