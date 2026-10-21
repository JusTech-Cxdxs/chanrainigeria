"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { PasswordField } from "@/components/ejo/PasswordField";

const inputCls =
  "w-full rounded-[var(--ejo-radius-md)] border border-line bg-surface px-4 py-3 text-[16px] text-ink outline-none transition-colors placeholder:text-ink-soft/70 focus:border-brand focus:ring-2 focus:ring-brand/20";

function Submit({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-[var(--ejo-radius-md)] bg-brand py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
    >
      {pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden /> : null}
      {pending ? busy : idle}
    </button>
  );
}

export function LoginForm({ action }: { action: (f: FormData) => Promise<void> }) {
  const [pw, setPw] = useState("");
  return (
    <form action={action} className="grid gap-5">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
          Work email
        </label>
        <input id="email" name="email" type="email" required autoComplete="username" placeholder="name@company.com" className={inputCls} maxLength={200} />
      </div>
      <div>
        <PasswordField id="password" label="Password" value={pw} onChange={setPw} autoComplete="current-password" />
        <input type="hidden" name="password" value={pw} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="remember" defaultChecked className="h-4 w-4 accent-[var(--brand)]" />
        Keep me signed in on this device
      </label>
      <Submit idle="Sign in" busy="Signing in…" />
      <p className="text-sm text-ink-soft">New here? Your administrator creates your account. Forgotten your password? Ask them to reset it.</p>
    </form>
  );
}

export function SetupForm({ action, company }: { action: (f: FormData) => Promise<void>; company: string }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  return (
    <form action={action} className="grid gap-4">
      <div>
        <label htmlFor="token" className="mb-1.5 block text-sm font-medium">
          Setup code
        </label>
        <input id="token" name="token" required autoComplete="off" className={inputCls} placeholder="SETUP_TOKEN from the server settings" />
      </div>
      <div>
        <label htmlFor="company" className="mb-1.5 block text-sm font-medium">
          Company name
        </label>
        <input id="company" name="company" required defaultValue={company} className={inputCls} />
      </div>
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          Your full name
        </label>
        <input id="name" name="name" required autoComplete="name" className={inputCls} />
      </div>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
          Your email
        </label>
        <input id="email" name="email" type="email" required autoComplete="username" className={inputCls} />
      </div>
      <PasswordField id="password" label="Password" value={pw} onChange={setPw} autoComplete="new-password" minLength={10} />
      <input type="hidden" name="password" value={pw} />
      <PasswordField id="confirm" label="Confirm password" value={pw2} onChange={setPw2} autoComplete="new-password" minLength={10} />
      <input type="hidden" name="confirm" value={pw2} />
      <Submit idle="Create the platform account" busy="Setting up…" />
    </form>
  );
}
