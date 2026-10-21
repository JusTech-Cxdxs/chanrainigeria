"use client";
// Client parts of Email and alerts: the password box, the test email button and the email preview.
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { TestState } from "@/app/admin/actions/email";
import { Icon } from "@/components/ui/Icon";

/** A password box that never shows the saved value; empty means "keep what is saved". */
export function SecretInput({ name, saved, label, hint }: { name: string; saved: boolean; label: string; hint?: string }) {
  const [shown, setShown] = useState(false);
  return (
    <label className="field">
      <span>{label}</span>
      <span className="relative block">
        <input
          name={name}
          type={shown ? "text" : "password"}
          autoComplete="new-password"
          spellCheck={false}
          autoCapitalize="off"
          maxLength={500}
          placeholder={saved ? "Saved. Leave empty to keep it" : "Not set"}
          className="input pr-12"
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink-soft hover:text-ink"
        >
          <Icon name={shown ? "eye-off" : "eye"} size={18} />
        </button>
      </span>
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function TestButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-outline" disabled={pending}>
      <Icon name="send" size={17} />
      {pending ? "Sending…" : "Send a test email"}
    </button>
  );
}

/** Sends a test to the signed-in person and shows the mail server's answer. */
export function TestEmailForm({ action, to, disabled }: { action: (s: TestState, f: FormData) => Promise<TestState>; to: string; disabled?: string }) {
  const [state, run] = useActionState(action, { status: "idle" } as TestState);
  return (
    <form action={run} className="grid gap-4">
      <p className="text-ink-soft">
        Sends a short email to <strong className="text-ink">{to}</strong> using the saved settings. Save any changes above first.
      </p>
      {disabled ? (
        <p className="rounded-xl border border-line bg-concrete px-4 py-3 text-sm">{disabled}</p>
      ) : (
        <div>
          <TestButton />
        </div>
      )}
      <div aria-live="polite">
        {state.status === "sent" ? (
          <p key={state.at} role="status" className="flex gap-3 rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm">
            <Icon name="check" size={18} className="mt-0.5 shrink-0 text-brand" />
            <span>
              <strong>Sent to {state.to}.</strong> The mail server accepted it. Check the inbox (and the spam folder) in the next minute or two.
            </span>
          </p>
        ) : state.status === "error" ? (
          <div key={state.at} role="alert" className="rounded-xl border border-danger/40 bg-danger/5 px-4 py-3 text-sm">
            <p className="flex gap-3">
              <Icon name="alert" size={18} className="mt-0.5 shrink-0 text-danger" />
              <strong className="text-danger">The test email was not sent.</strong>
            </p>
            <p className="mt-2 pl-[30px] text-ink-soft">The mail server said:</p>
            <pre className="mt-1 ml-[30px] overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-concrete px-3 py-2 font-mono text-xs text-ink">{state.message}</pre>
            <p className="mt-2 pl-[30px] text-ink-soft">
              Check the server name, port, security and password. Microsoft 365 and Google accounts with two-step sign-in usually need an app password.
            </p>
          </div>
        ) : null}
      </div>
    </form>
  );
}

/** Pick an email and see it with sample details, at phone or desktop width. */
export function EmailPreview({ emails }: { emails: { key: string; label: string; to: string; subject: string; html: string }[] }) {
  const [pick, setPick] = useState(emails[0]?.key);
  const [narrow, setNarrow] = useState(false);
  const cur = emails.find((e) => e.key === pick) ?? emails[0];
  if (!cur) return null;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Email to preview">
        {emails.map((e) => (
          <button
            key={e.key}
            type="button"
            role="tab"
            aria-selected={e.key === cur.key}
            onClick={() => setPick(e.key)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${e.key === cur.key ? "border-brand bg-brand text-on-brand" : "border-line bg-surface text-ink hover:border-brand"}`}
          >
            {e.label}
          </button>
        ))}
        <span className="ml-auto inline-flex rounded-full border border-line bg-surface p-0.5 text-sm">
          {[
            [false, "Desktop"],
            [true, "Phone"],
          ].map(([v, l]) => (
            <button
              key={String(l)}
              type="button"
              aria-pressed={narrow === v}
              onClick={() => setNarrow(v as boolean)}
              className={`rounded-full px-3 py-1 font-semibold ${narrow === v ? "bg-concrete text-ink" : "text-ink-soft"}`}
            >
              {l as string}
            </button>
          ))}
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-concrete">
        <div className="border-b border-line bg-surface px-4 py-3 text-sm">
          <p className="truncate">
            <span className="text-ink-soft">Subject: </span>
            <strong>{cur.subject}</strong>
          </p>
          <p className="text-ink-soft">To: {cur.to}</p>
        </div>
        <div className="flex justify-center p-3 sm:p-5">
          <iframe
            title={`Preview: ${cur.label}`}
            srcDoc={cur.html}
            sandbox=""
            className="h-[760px] rounded-lg border border-line bg-white transition-[width] duration-300"
            style={{ width: narrow ? 380 : "100%", maxWidth: "100%" }}
          />
        </div>
      </div>
      <p className="text-sm text-ink-soft">Sample details only. Real emails use the enquiry, the desk and your settings. Images load from the live website address.</p>
    </div>
  );
}
