"use client";
import { useState, useTransition } from "react";
import { testAiConnection } from "@/app/admin/actions/settings";
import { Icon } from "@/components/ui/Icon";

export type AiInfo = { on: boolean; provider: string; model: string; fastModel: string; source: string; fallbacks: string[] } | null;

/** What Enyo is connected to, and a button that checks it works. Shown under Company settings → Enyo. */
export function AiConnection({ info }: { info: AiInfo }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  return (
    <div className="rounded-xl border border-line bg-concrete/40 p-4 sm:col-span-2">
      <div className="flex flex-wrap items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${info ? "bg-brand/10 text-brand" : "bg-concrete text-ink-soft"}`}>
          <Icon name="bot" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{info ? `Connected to ${info.provider}` : "AI is not switched on"}</p>
          {info ? (
            <dl className="mt-1 grid gap-x-4 gap-y-0.5 text-sm text-ink-soft sm:grid-cols-[auto_1fr]">
              <dt>Main model</dt>
              <dd className="font-mono text-ink">{info.model}</dd>
              <dt>Fast model</dt>
              <dd className="font-mono text-ink">{info.fastModel === info.model ? "same as main" : info.fastModel}</dd>
              {info.fallbacks.length ? (
                <>
                  <dt>If busy, tries</dt>
                  <dd className="font-mono text-ink">{info.fallbacks.join(", ")}</dd>
                </>
              ) : null}
              <dt>Set by</dt>
              <dd>server settings ({info.source})</dd>
            </dl>
          ) : (
            <p className="mt-1 text-sm text-ink-soft">
              Enyo and the dashboard assistant work in basic mode: they point people to the right page and look up figures. To switch on full answers, your IT team adds
              ENYO_LLM_BASE_URL, ENYO_LLM_API_KEY and ENYO_LLM_MODEL (optionally ENYO_LLM_FAST_MODEL) on the server, the same settings EJO uses.
            </p>
          )}
        </div>
        <button
          type="button"
          className="btn btn-outline"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setResult(null);
              setResult(await testAiConnection());
            })
          }
        >
          <Icon name={pending ? "refresh" : "check-circle"} className={pending ? "animate-spin" : ""} />
          {pending ? "Testing…" : "Test connection"}
        </button>
      </div>
      {result ? (
        <p role="status" className={`mt-3 rounded-lg border-l-4 bg-surface px-3 py-2 text-sm ${result.ok ? "border-brand" : "border-danger text-danger"}`}>
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
