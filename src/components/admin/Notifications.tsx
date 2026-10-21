"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getNotifications, muteNotifications, readAllNotifications, readNotifications } from "@/app/admin/actions/notifications";
import { Icon } from "@/components/ui/Icon";
import type { NotificationSummary } from "@/lib/notifications";

// The dashboard's live notifications, built the way EJO 100 does it: a tiny change check every few
// seconds while the tab is in use, the full list only when something changed, a chime made in the
// browser (no sound files), a repeating ring while urgent work waits, the count in the browser tab,
// and a desktop alert when the dashboard is in a background tab.

const PULSE_MS = 12_000;
const IDLE_PULSE_MS = 60_000;
const IDLE_AFTER_MS = 5 * 60_000;
const RING_MS = 120_000;
const EMPTY: NotificationSummary = { actions: [], activity: [], total: 0, signature: "", muted: false };

type Ctx = {
  summary: NotificationSummary;
  state: "loading" | "ready" | "error";
  muted: boolean;
  toggleMute: () => void;
  markRead: (keys: string[]) => void;
  markAll: () => void;
};
const NotificationContext = createContext<Ctx>({ summary: EMPTY, state: "loading", muted: false, toggleMute: () => {}, markRead: () => {}, markAll: () => {} });
export const useNotifications = () => useContext(NotificationContext);

// ---------- Sound ----------
let master: AudioNode | null = null;
function out(ctx: AudioContext) {
  if (master) return master;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 8;
  const gain = ctx.createGain();
  gain.gain.value = 1.4;
  comp.connect(gain).connect(ctx.destination);
  master = comp;
  return master;
}
function note(ctx: AudioContext, freq: number, at: number, length: number, volume: number) {
  for (const [mult, type, vol] of [
    [1, "sine", 1],
    [2, "triangle", 0.4],
  ] as const) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq * mult;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(volume * vol, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + length);
    o.connect(g).connect(out(ctx));
    o.start(at);
    o.stop(at + length + 0.02);
  }
}
/** A soft three-note chime for news; a brighter ring, played three times, for urgent work. */
function chime(ctx: AudioContext | null, urgent: boolean) {
  if (!ctx || ctx.state !== "running") return;
  const t = ctx.currentTime + 0.02;
  if (!urgent) {
    note(ctx, 1046.5, t, 0.3, 0.8);
    note(ctx, 1318.5, t + 0.13, 0.3, 0.8);
    note(ctx, 1568, t + 0.26, 0.6, 0.8);
    return;
  }
  for (const rep of [0, 0.7, 1.4]) {
    note(ctx, 880, t + rep, 0.2, 0.9);
    note(ctx, 1108.7, t + rep + 0.15, 0.2, 0.9);
    note(ctx, 1318.5, t + rep + 0.3, 0.35, 0.9);
  }
}

async function fetchPulse(): Promise<string | "out" | ""> {
  try {
    const r = await fetch("/api/admin/notifications/pulse", { cache: "no-store", credentials: "same-origin", signal: AbortSignal.timeout(8000) });
    if (r.status === 401) return "out";
    if (!r.ok) return "";
    return String(((await r.json()) as { pulse?: string }).pulse ?? "");
  } catch {
    return "";
  }
}

const typing = () => {
  const el = document.activeElement as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
};

export function NotificationProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const router = useRouter();
  const cacheKey = `cn.notifications.${userId}`;
  const [summary, setSummary] = useState<NotificationSummary>(EMPTY);
  const [state, setState] = useState<Ctx["state"]>("loading");
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const sig = useRef<string | null>(null);
  const pulse = useRef<string | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const busy = useRef(false);
  const lastActivity = useRef(Date.now());
  const pendingRefresh = useRef(false);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const refreshPage = useCallback(() => {
    if (typing()) {
      pendingRefresh.current = true;
      return;
    }
    pendingRefresh.current = false;
    router.refresh();
  }, [router]);

  const apply = useCallback(
    (next: NotificationSummary) => {
      const first = sig.current === null;
      const changed = !first && next.signature !== sig.current;
      if (changed && next.total > 0 && !mutedRef.current) chime(audio.current, next.actions.some((a) => a.kind === "machine_down" || a.kind === "assigned"));
      sig.current = next.signature;
      setSummary(next);
      if (first) setMuted(next.muted);
      setState("ready");
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(next));
      } catch {
        /* storage blocked */
      }
      if (changed) refreshPage();
    },
    [cacheKey, refreshPage],
  );

  const load = useCallback(async () => {
    const next = await getNotifications().catch(() => null);
    if (!next) {
      if (sig.current === null) setState("error");
      return;
    }
    apply(next);
  }, [apply]);

  const check = useCallback(async () => {
    if (busy.current || document.visibilityState === "hidden") return;
    busy.current = true;
    try {
      const p = await fetchPulse();
      if (p === "out") {
        if (!typing()) window.location.assign("/admin/login");
        return;
      }
      if (!p) return;
      if (pulse.current === null) pulse.current = p;
      else if (p !== pulse.current) {
        pulse.current = p;
        await load();
      }
    } finally {
      busy.current = false;
    }
  }, [load]);

  // First paint: last known state from this tab, then fresh data.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (raw) {
        const cached = JSON.parse(raw) as NotificationSummary;
        sig.current = cached.signature;
        setSummary(cached);
        setMuted(cached.muted);
        setState("ready");
      }
    } catch {
      /* ignore */
    }
    void load().then(check);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Regular checks: often while someone is using the page, rarely when idle, never in a hidden tab.
  useEffect(() => {
    const touch = () => {
      lastActivity.current = Date.now();
    };
    const evs = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    evs.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const next = () => {
      if (stopped) return;
      const idle = Date.now() - lastActivity.current > IDLE_AFTER_MS;
      timer = setTimeout(async () => {
        await check();
        next();
      }, idle ? IDLE_PULSE_MS : PULSE_MS);
    };
    next();
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        lastActivity.current = Date.now();
        void check();
      }
    };
    const onLeaveField = () => {
      if (pendingRefresh.current) setTimeout(() => !typing() && refreshPage(), 300);
    };
    document.addEventListener("visibilitychange", onVisible);
    document.addEventListener("focusout", onLeaveField);
    return () => {
      stopped = true;
      clearTimeout(timer);
      evs.forEach((e) => window.removeEventListener(e, touch));
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("focusout", onLeaveField);
    };
  }, [check, refreshPage]);

  // Error state: retry until it loads.
  useEffect(() => {
    if (state !== "error") return;
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [state, load]);

  // Browsers allow sound only after the first tap or click. Ask once for desktop alerts at the same time.
  useEffect(() => {
    const unlock = () => {
      if (!audio.current) {
        const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (C) audio.current = new C();
      }
      void audio.current?.resume();
      if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission().catch(() => undefined);
    };
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  // Urgent work waiting (a machine down, an enquiry assigned to you): ring again every 2 minutes.
  const urgent = summary.actions.some((a) => a.kind === "machine_down" || a.kind === "assigned");
  useEffect(() => {
    if (!urgent || muted) return;
    const t = setInterval(() => chime(audio.current, true), RING_MS);
    return () => clearInterval(t);
  }, [urgent, muted]);

  // "(3) Dashboard" in the browser tab.
  useEffect(() => {
    const set = () => {
      const base = document.title.replace(/^\(\d+\+?\) /, "");
      const want = summary.total > 0 ? `(${summary.total > 99 ? "99+" : summary.total}) ${base}` : base;
      if (document.title !== want) document.title = want;
    };
    set();
    const t = setInterval(set, 1000);
    return () => clearInterval(t);
  }, [summary.total]);

  // Desktop alert when the dashboard is in a background tab.
  const lastTop = useRef<string | null>(null);
  useEffect(() => {
    const top = summary.actions[0]?.id ?? summary.activity[0]?.key ?? "";
    if (lastTop.current === null) {
      lastTop.current = top;
      return;
    }
    if (!top || top === lastTop.current) return;
    lastTop.current = top;
    if (document.visibilityState === "visible" || mutedRef.current || !("Notification" in window) || Notification.permission !== "granted") return;
    const item = summary.actions[0] ?? summary.activity[0];
    try {
      const n = new Notification(item.title, { body: summary.total > 1 ? `${summary.total} things need your attention` : "Open the dashboard to see it", tag: "chanrai-dashboard" });
      n.onclick = () => {
        window.focus();
        router.push(item.url);
        n.close();
      };
    } catch {
      /* some browsers only allow this from a service worker */
    }
  }, [summary, router]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      void muteNotifications(!m).catch(() => undefined);
      return !m;
    });
  }, []);
  const markRead = useCallback((keys: string[]) => {
    if (!keys.length) return;
    const gone = new Set(keys);
    setSummary((s) => {
      const activity = s.activity.filter((a) => !gone.has(a.key));
      return { ...s, activity, total: s.actions.length + activity.length };
    });
    void readNotifications(keys).catch(() => undefined);
  }, []);
  const markAll = useCallback(() => {
    setSummary((s) => ({ ...s, activity: [], total: s.actions.length }));
    void readAllNotifications().catch(() => undefined);
  }, []);

  return <NotificationContext.Provider value={{ summary, state, muted, toggleMute, markRead, markAll }}>{children}</NotificationContext.Provider>;
}

// ---------- The bell ----------

const ACTION_ICON: Record<string, string> = { machine_down: "alert", overdue: "clock", assigned: "user-cog", testimonials: "quote" };
const AREA_ICON: Record<string, string> = { enquiry: "inbox", testimonial: "quote", team: "activity" };
const AREA_LABEL: Record<string, string> = { enquiry: "Enquiries", testimonial: "Testimonials", team: "Team activity" };

export function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

export function NotificationBell() {
  const { summary: s, state, muted, toggleMute, markRead, markAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outside = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  const urgent = s.actions.some((a) => a.kind === "machine_down" || a.kind === "assigned");
  const heading = "flex items-center gap-2 px-4 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft";

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${s.total ? `, ${s.total} new` : ""}`}
        aria-expanded={open}
        className={`relative grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-concrete ${open ? "bg-concrete" : ""}`}
      >
        <span className={urgent && !muted ? "cn-bell-ring inline-flex" : "inline-flex"}>
          <Icon name={muted ? "bell-off" : "bell"} size={20} />
        </span>
        {s.total > 0 ? (
          <span className={`absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-surface px-1 text-[10px] font-bold leading-none text-white num ${s.actions.length ? "bg-danger" : "bg-brand"}`}>
            {s.total > 99 ? "99+" : s.total}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="fixed inset-x-2 top-[calc(4.25rem+env(safe-area-inset-top))] z-50 flex max-h-[78vh] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/15 [animation:pop_.16s_ease-out] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[25rem]">
          <div className="flex items-start justify-between gap-3 border-b border-line bg-concrete/60 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Notifications</p>
              <p className="text-xs text-ink-soft">
                {state === "loading" ? "Loading…" : state === "error" && !s.total ? "Couldn't load. Trying again…" : !s.total ? "You're all caught up." : `${s.total} ${s.total === 1 ? "item needs" : "items need"} your attention`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {s.activity.length ? (
                <button type="button" onClick={markAll} className="rounded-full px-2.5 py-1 text-xs font-semibold text-brand hover:bg-brand/10">
                  Mark all read
                </button>
              ) : null}
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Turn notification sounds on" : "Mute notification sounds"}
                title={muted ? "Sounds off. Tap to turn on" : "Sounds on. Tap to mute"}
                className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-surface hover:text-ink"
              >
                <Icon name={muted ? "volume-off" : "volume"} size={16} />
              </button>
            </div>
          </div>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto pb-1">
            {!s.total && state !== "loading" ? (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
                  <Icon name="check-circle" size={22} />
                </span>
                <p className="text-sm font-semibold">All caught up</p>
                <p className="mt-1 text-xs text-ink-soft">New enquiries, machines down and testimonials to approve will appear here, with a sound.</p>
              </div>
            ) : null}
            {s.actions.length ? (
              <div>
                <p className={`${heading} !text-danger`}>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-danger" /> Needs you ({s.actions.length})
                </p>
                {s.actions.map((a) => (
                  <Link key={a.id} href={a.url} onClick={() => setOpen(false)} className="group flex gap-3 px-4 py-2.5 transition-colors hover:bg-concrete">
                    <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${a.kind === "machine_down" ? "bg-danger/10 text-danger" : "bg-accent/15 text-[color-mix(in_oklab,var(--accent)_60%,var(--ink))]"}`}>
                      <Icon name={ACTION_ICON[a.kind] ?? "bell"} size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{a.title}</span>
                      <span className="line-clamp-2 block text-xs text-ink-soft">{a.detail}</span>
                    </span>
                    <Icon name="chevron-right" size={15} className="self-center text-ink-soft opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            ) : null}
            {s.activity.length ? (
              <div>
                <p className={heading}>New ({s.activity.length})</p>
                {s.activity.slice(0, 12).map((a) => (
                  <Link
                    key={a.key}
                    href={a.url}
                    onClick={() => {
                      setOpen(false);
                      markRead([a.key]);
                    }}
                    className="group flex gap-3 px-4 py-2.5 transition-colors hover:bg-concrete"
                  >
                    <span className="relative mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                      <Icon name={AREA_ICON[a.area] ?? "activity"} size={16} />
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-brand" aria-label="Unread" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block text-sm">{a.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-ink-soft">
                        {AREA_LABEL[a.area]} · {a.actor ?? "System"} · {timeAgo(a.at)}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          <Link href="/admin/notifications" onClick={() => setOpen(false)} className="flex items-center justify-center gap-1.5 border-t border-line bg-concrete/60 px-4 py-2.5 text-xs font-semibold text-brand hover:bg-brand/5">
            Open all notifications <Icon name="arrow" size={13} />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
