"use client";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { timeAgo, useNotifications } from "./Notifications";

const AREA: Record<string, { icon: string; label: string }> = {
  enquiry: { icon: "inbox", label: "Enquiries" },
  testimonial: { icon: "quote", label: "Testimonials" },
  team: { icon: "activity", label: "Team activity" },
};

/** The full list behind the bell, in the dashboard's own layout. */
export function NotificationCenter() {
  const { summary: s, state, muted, toggleMute, markRead, markAll } = useNotifications();
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-line bg-surface">
        <header className="flex items-center gap-3 border-b border-line-soft px-5 py-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-danger/10 text-danger">
            <Icon name="alert" />
          </span>
          <div className="flex-1">
            <h2 className="heading text-lg">Needs you</h2>
            <p className="text-sm text-ink-soft">Clears by itself when the work is done.</p>
          </div>
          <button type="button" onClick={toggleMute} className="btn btn-outline !min-h-9 text-sm">
            <Icon name={muted ? "volume-off" : "volume"} size={16} /> {muted ? "Sounds off" : "Sounds on"}
          </button>
        </header>
        {s.actions.length ? (
          <ul className="divide-y divide-line-soft">
            {s.actions.map((a) => (
              <li key={a.id}>
                <Link href={a.url} className="flex items-center gap-3 px-5 py-3.5 hover:bg-concrete/60">
                  <Icon name={a.kind === "machine_down" ? "alert" : a.kind === "overdue" ? "clock" : a.kind === "assigned" ? "user-cog" : "quote"} className={a.kind === "machine_down" ? "text-danger" : "text-ink-soft"} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{a.title}</span>
                    <span className="block text-sm text-ink-soft">{a.detail}</span>
                  </span>
                  <Icon name="chevron-right" size={16} className="text-ink-soft" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-ink-soft">{state === "loading" ? "Loading…" : "Nothing is waiting for you."}</p>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-surface">
        <header className="flex items-center gap-3 border-b border-line-soft px-5 py-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
            <Icon name="bell" />
          </span>
          <div className="flex-1">
            <h2 className="heading text-lg">New</h2>
            <p className="text-sm text-ink-soft">The last 14 days, until you open or dismiss them.</p>
          </div>
          {s.activity.length ? (
            <button type="button" onClick={markAll} className="btn btn-quiet !min-h-9 text-sm">
              <Icon name="check" size={16} /> Mark all read
            </button>
          ) : null}
        </header>
        {s.activity.length ? (
          <ul className="divide-y divide-line-soft">
            {s.activity.map((a) => (
              <li key={a.key} className="flex items-center gap-3 px-5 py-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                  <Icon name={AREA[a.area]?.icon ?? "activity"} size={17} />
                </span>
                <Link href={a.url} onClick={() => markRead([a.key])} className="min-w-0 flex-1 hover:text-brand">
                  <span className="block">{a.title}</span>
                  <span className="block text-xs text-ink-soft">
                    {AREA[a.area]?.label} · {a.actor ?? "System"} · {timeAgo(a.at)}
                  </span>
                </Link>
                <button type="button" onClick={() => markRead([a.key])} className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-concrete hover:text-ink" aria-label="Mark as read">
                  <Icon name="check" size={16} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-ink-soft">{state === "loading" ? "Loading…" : "You're all caught up."}</p>
        )}
      </section>
    </div>
  );
}
