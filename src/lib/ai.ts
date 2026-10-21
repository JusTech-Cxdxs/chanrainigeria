import "server-only";

/**
 * The AI connection used by Enyo on the website and the assistant in the dashboard. It is the same
 * setup as EJO 100, so the same server variables work in both:
 *
 *   ENYO_LLM_BASE_URL     any OpenAI-compatible endpoint, e.g. https://api.groq.com/openai/v1
 *   ENYO_LLM_API_KEY      the key (not needed for a model on the company's own server)
 *   ENYO_LLM_MODEL        the main model (must support tool calling)
 *   ENYO_LLM_FAST_MODEL   optional smaller model for greetings and short how-to questions
 *   ENYO_LLM_FALLBACK_MODELS  optional, comma separated; "off" for none (Groq gets a chain by default)
 *   ENYO_LLM_PROVIDER_LABEL   optional name shown to administrators
 *   ENYO_LLM_TIMEOUT_MS   optional, 5000 to 120000
 *   ENYO_LLM_ROUTING      "off" sends everything to the main model
 *
 * The older ENYO_API_KEY / ENYO_API_URL names still work. Keys stay on the server.
 */

export type AiConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  fastModel: string;
  providerLabel: string;
  timeoutMs: number;
  fallbackModels?: string[];
  /** Where the settings came from, for the settings page */
  source: "ENYO_LLM_*" | "ENYO_API_*";
};

/** Groq's production chat models, strongest first. Each has its own free-tier budget. */
export const GROQ_CHAIN = ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "openai/gpt-oss-20b", "llama-3.1-8b-instant"];

const clean = (v: string | undefined) =>
  (v ?? "")
    .trim()
    .replace(/^(['"`])([\s\S]*)\1$/, "$2")
    .trim();

function hostLabel(baseUrl: string) {
  try {
    const host = new URL(baseUrl).hostname;
    if (host.includes("groq")) return "Groq";
    if (host.includes("openrouter")) return "OpenRouter";
    if (host.includes("googleapis")) return "Google";
    if (host.includes("openai")) return "OpenAI";
    if (host === "localhost" || host === "127.0.0.1") return "Local model server";
    return "Model server";
  } catch {
    return "Model server";
  }
}

/**
 * The configured connection, or null when AI is off (Enyo and the assistant then run in basic mode).
 * `settingsModel` is the optional model chosen under Company settings; the server's ENYO_LLM_MODEL wins.
 */
export function aiConfig(settingsModel?: string, env: Record<string, string | undefined> = process.env): AiConfig | null {
  const modern = !!clean(env.ENYO_LLM_BASE_URL) || !!clean(env.ENYO_LLM_API_KEY);
  const baseUrl = clean(modern ? env.ENYO_LLM_BASE_URL : env.ENYO_API_URL || (clean(env.ENYO_API_KEY) ? "https://api.groq.com/openai/v1" : "")).replace(/\/+$/, "");
  const apiKey = clean(modern ? env.ENYO_LLM_API_KEY : env.ENYO_API_KEY);
  const groq = /groq\.com/i.test(baseUrl);
  const model = clean(env.ENYO_LLM_MODEL) || clean(settingsModel) || (groq ? "llama-3.3-70b-versatile" : "");
  if (!baseUrl || !model || !/^https?:\/\//.test(baseUrl)) return null;
  const local = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?/.test(baseUrl);
  if (!apiKey && !local) return null;
  const timeout = Number(clean(env.ENYO_LLM_TIMEOUT_MS));
  const fb = clean(env.ENYO_LLM_FALLBACK_MODELS);
  return {
    baseUrl,
    apiKey,
    model,
    fastModel: clean(env.ENYO_LLM_FAST_MODEL) || model,
    providerLabel: clean(env.ENYO_LLM_PROVIDER_LABEL) || hostLabel(baseUrl),
    timeoutMs: Number.isFinite(timeout) && timeout >= 5_000 && timeout <= 120_000 ? timeout : 45_000,
    source: modern ? "ENYO_LLM_*" : "ENYO_API_*",
    ...(fb
      ? {
          fallbackModels: /^(off|none|false|0)$/i.test(fb)
            ? []
            : fb
                .split(",")
                .map((m) => m.trim())
                .filter((m) => /^[\w./:-]{1,120}$/.test(m))
                .slice(0, 6),
        }
      : {}),
  };
}

export const aiReady = (settingsModel?: string) => aiConfig(settingsModel) !== null;

function fallbacksFor(c: AiConfig, primary: string) {
  const list = c.fallbackModels ?? (/groq\.com/i.test(c.baseUrl) ? GROQ_CHAIN : []);
  return [...new Set(list.filter((m) => m && m !== primary))];
}

// ---------- Choosing a model per turn (as EJO 100 does) ----------

const SMALL_TALK =
  /^(hi+|hello+|hey+|good (morning|afternoon|evening|night)|morning|afternoon|evening|thanks?( you)?( so much)?|thank u|ok(ay)?|alright|cool|great|nice|bye|goodbye|see you|how are you( doing)?|who are you|what('?s| is) your name|what can you do|are you there)\b[\s!.,?]*$/i;
const HOW_TO = /^(how (do|can|should) (i|we)|where (do|can) i|how to|what are the steps|walk me through|show me how|explain how)\b/i;
const NEEDS_RECORDS =
  /\bCN-\d{4}-\d+|\b(how (much|many)|count|total|compare|summar(y|ise|ize)|waiting|pending|overdue|late|which|enquir|quote|booking|order|serial|spec|model|price|draft|write|reply|this|that|my|our)\b/i;

/** The fast model for small talk and short how-to questions; the main model for everything else. */
export function pickModel(c: AiConfig, message: string, env: Record<string, string | undefined> = process.env) {
  if ((env.ENYO_LLM_ROUTING ?? "").trim().toLowerCase() === "off" || c.fastModel === c.model) return c.model;
  const m = message.trim();
  if (NEEDS_RECORDS.test(m)) return c.model;
  if (m.length <= 120 && SMALL_TALK.test(m)) return c.fastModel;
  if (m.length <= 200 && HOW_TO.test(m)) return c.fastModel;
  return c.model;
}

// ---------- Errors ----------

export type AiErrorKind = "timeout" | "rate_limited" | "unavailable" | "rejected" | "auth" | "not_found" | "bad_response";

export class AiError extends Error {
  constructor(
    public readonly kind: AiErrorKind,
    message: string,
    public readonly status?: number,
    public readonly detail?: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "AiError";
  }
}

const redact = (t: string) =>
  t
    .replace(/\b(gsk|sk|sk-proj|sk-or|xai|pk|rk|key|AIza)[-_][A-Za-z0-9_-]{8,}/g, "[key hidden]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [hidden]")
    .replace(/\b[A-Za-z0-9_-]{40,}\b/g, "[hidden]");

function kindForStatus(status: number): AiErrorKind {
  if (status === 401 || status === 403) return "auth";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "unavailable";
  return "rejected";
}

function readErrorBody(text: string) {
  let detail = text;
  let code: string | undefined;
  try {
    const j = JSON.parse(text) as { error?: { message?: unknown; code?: unknown; type?: unknown } | string; message?: unknown };
    const e = typeof j.error === "object" && j.error ? j.error : undefined;
    detail = String(e?.message ?? (typeof j.error === "string" ? j.error : j.message) ?? text);
    const c = e?.code ?? e?.type;
    code = typeof c === "string" && /^[a-z0-9_.-]{1,60}$/i.test(c) ? c : undefined;
  } catch {
    /* not JSON */
  }
  return { detail: redact(detail.replace(/\s+/g, " ").trim()).slice(0, 240) || undefined, code };
}

function retryAfterMs(detail: string | undefined, header?: string | null) {
  const h = Number(header);
  if (Number.isFinite(h) && h > 0) return Math.round(h * 1000);
  const m = /try again in\s+((?:\d+(?:\.\d+)?\s*(?:ms|h|m|s)\s*)+)/i.exec(detail ?? "");
  if (!m) return undefined;
  let ms = 0;
  for (const p of m[1].matchAll(/(\d+(?:\.\d+)?)\s*(h|ms|m|s)/gi)) {
    const n = Number(p[1]);
    const u = p[2].toLowerCase();
    ms += u === "h" ? n * 3_600_000 : u === "m" ? n * 60_000 : u === "s" ? n * 1000 : n;
  }
  return ms > 0 ? Math.round(ms) : undefined;
}

/** For administrators: what is wrong and what to change. Never includes the key. */
export function aiAdminMessage(err: unknown) {
  if (!(err instanceof AiError)) return "Something unexpected went wrong. Try again in a minute.";
  const why = err.detail ? ` The model server said: "${err.detail}"` : "";
  const status = err.status ? ` (HTTP ${err.status})` : "";
  switch (err.kind) {
    case "auth":
      return `The model server refused the key${status}. Check ENYO_LLM_API_KEY: paste it again with no quotes or spaces, make sure it hasn't been deleted, then redeploy.${why}`;
    case "not_found":
      return `The model or the address was not found${status}. Check ENYO_LLM_MODEL (the exact model id) and ENYO_LLM_BASE_URL (usually ends in /v1), then redeploy.${why}`;
    case "rejected":
      return `The model server rejected the request${status}. The model id may not exist for this provider.${why}`;
    case "rate_limited":
      return `The model server says too many requests${status}. Wait a minute and test again. On a free tier, check its limits.${why}`;
    case "unavailable":
      return `The model server could not be reached or had an error${status}. Check ENYO_LLM_BASE_URL and that the provider is up.${why}`;
    case "timeout":
      return "The model server took too long to answer. Try again, choose a faster model, or raise ENYO_LLM_TIMEOUT_MS.";
    default:
      return `The model server answered in an unexpected format. Check ENYO_LLM_BASE_URL points at an OpenAI-compatible endpoint.${why}`;
  }
}

// ---------- Calling the model ----------

/** OpenAI wire format, as both assistants already build their messages. */
export type WireToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
export type WireMessage = { role: "system" | "user" | "assistant" | "tool"; content: string | null; tool_calls?: WireToolCall[]; tool_call_id?: string };
export type WireTool = { name: string; description: string; parameters: Record<string, unknown> };

const isReasoning = (model: string) => /(^|\/)gpt-oss|(^|\/)o[134](-|$)/i.test(model);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Models that said "too many" recently, and until when to leave them alone. */
const limitedUntil = new Map<string, number>();

function payload(model: string, req: { messages: WireMessage[]; tools?: WireTool[]; temperature?: number; maxTokens?: number }) {
  const reasoning = isReasoning(model);
  return {
    model,
    messages: req.messages,
    ...(req.tools?.length ? { tools: req.tools.map((t) => ({ type: "function", function: t })), tool_choice: "auto" } : {}),
    temperature: req.temperature ?? 0.3,
    ...(req.maxTokens ? { max_tokens: reasoning ? req.maxTokens + 1024 : req.maxTokens } : {}),
    ...(reasoning ? { reasoning_effort: (req.maxTokens ?? 2000) <= 1200 ? "low" : "medium", include_reasoning: false } : {}),
  };
}

async function post(c: AiConfig, body: Record<string, unknown>, quickFail: boolean) {
  let last = new AiError("unavailable", "No attempt made");
  let toolRetry = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${c.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", ...(c.apiKey ? { authorization: `Bearer ${c.apiKey}` } : {}) },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(c.timeoutMs),
      });
      if (res.ok) return res;
      const { detail, code } = readErrorBody((await res.text().catch(() => "")).slice(0, 4000));
      const kind = kindForStatus(res.status);
      last = new AiError(kind, `Model server answered ${res.status}`, res.status, detail, code);
      if (kind === "rejected" && /reasoning/i.test(detail ?? "") && "reasoning_effort" in body) {
        delete body.reasoning_effort;
        delete body.include_reasoning;
        continue;
      }
      if (kind === "rejected" && code === "tool_use_failed" && !toolRetry) {
        toolRetry = true;
        continue;
      }
      if (kind !== "rate_limited" && kind !== "unavailable") throw last;
      const asked = retryAfterMs(detail, res.headers.get("retry-after"));
      if (kind === "rate_limited") limitedUntil.set(String(body.model), Date.now() + Math.min(Math.max(asked ?? 20_000, 5_000), 600_000));
      if (kind === "rate_limited" && quickFail) throw last;
      if (asked !== undefined && asked > 12_000) throw last;
      await sleep(asked !== undefined ? Math.max(asked + 250, 500) : 600 * (attempt + 1));
    } catch (e) {
      if (e instanceof AiError) {
        if (e.kind !== "unavailable" || e === last) throw e;
        last = e;
      } else if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) {
        throw new AiError("timeout", "The model took too long");
      } else {
        last = new AiError("unavailable", "Could not reach the model server");
        await sleep(600 * (attempt + 1));
      }
    }
  }
  throw last;
}

/**
 * One request with tool calling. When the chosen model is out of budget or withdrawn, the next model
 * in the chain answers instead, so a busy free tier means a slightly different model, not an error.
 */
export async function complete(
  c: AiConfig,
  req: { messages: WireMessage[]; tools?: WireTool[]; model?: string; temperature?: number; maxTokens?: number },
): Promise<{ content: string; tool_calls: WireToolCall[]; model: string }> {
  const primary = req.model ?? c.model;
  const chain = [primary, ...fallbacksFor(c, primary)];
  const now = Date.now();
  const ready = chain.filter((m) => (limitedUntil.get(m) ?? 0) <= now);
  const order = ready.length ? ready : [...chain].sort((a, b) => (limitedUntil.get(a) ?? 0) - (limitedUntil.get(b) ?? 0)).slice(0, 1);
  let lastErr: unknown = new AiError("unavailable", "No model tried");
  for (let i = 0; i < order.length; i++) {
    const model = order[i];
    const more = i < order.length - 1;
    try {
      const res = await post(c, payload(model, req), more);
      const json = (await res.json().catch(() => null)) as { choices?: { message?: { content?: string | null; tool_calls?: WireToolCall[] } }[]; model?: string } | null;
      const msg = json?.choices?.[0]?.message;
      if (!msg) throw new AiError("bad_response", "The model server sent no answer");
      const calls = (msg.tool_calls ?? [])
        .filter((t) => t?.function?.name)
        .map((t, k) => ({ id: t.id || `call_${k}`, type: "function" as const, function: { name: t.function.name, arguments: t.function.arguments || "{}" } }));
      return { content: msg.content ?? "", tool_calls: calls, model: json?.model ?? model };
    } catch (e) {
      lastErr = e;
      if (!(e instanceof AiError) || !more) throw e;
      const next =
        e.kind === "rate_limited" ||
        e.kind === "not_found" ||
        e.kind === "unavailable" ||
        (e.kind === "rejected" && (e.code === "tool_use_failed" || (/model/i.test(e.detail ?? "") && /decommission|not exist|not found|deprecat/i.test(e.detail ?? ""))));
      if (!next) throw e;
    }
  }
  throw lastErr;
}

/** For the "Test connection" button: a tiny request to both models. */
export async function testConnection(settingsModel?: string) {
  const c = aiConfig(settingsModel);
  if (!c) return { ok: false as const, message: "AI is not switched on. Add ENYO_LLM_BASE_URL, ENYO_LLM_API_KEY and ENYO_LLM_MODEL on the server, then redeploy." };
  const started = Date.now();
  try {
    const r = await complete(c, { messages: [{ role: "user", content: "Reply with the single word: ready" }], maxTokens: 20, temperature: 0 });
    let fast = "";
    if (c.fastModel !== c.model) {
      try {
        await complete(c, { model: c.fastModel, messages: [{ role: "user", content: "Reply with the single word: ready" }], maxTokens: 20, temperature: 0 });
        fast = ` The fast model (${c.fastModel}) works too.`;
      } catch (e) {
        fast = ` The fast model (${c.fastModel}) failed: ${aiAdminMessage(e)}`;
      }
    }
    return { ok: true as const, message: `Connected to ${c.providerLabel}. ${r.model} answered in ${((Date.now() - started) / 1000).toFixed(1)} s.${fast}` };
  } catch (e) {
    return { ok: false as const, message: aiAdminMessage(e) };
  }
}
