import { z } from "zod";
import { assistantReply } from "@/lib/assistant";
import { currentAdmin, has } from "@/lib/auth";
import { rateLimit, sameOriginJson } from "@/lib/guard";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const body = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(6000) }))
    .min(1)
    .max(40)
    .refine((m) => m.at(-1)?.role === "user", "The last message must be a question."),
  // Only a plain dashboard path, so nothing odd can reach the assistant's instructions.
  path: z.string().regex(/^\/admin[a-z0-9/_-]{0,120}$/i).optional().catch(undefined),
});

/**
 * The dashboard assistant. Signed-in staff whose role includes "Dashboard assistant" only.
 * Stateless: the conversation lives in the person's browser tab and is sent with each question.
 * Read-only: nothing here writes to the database (apart from the shared rate-limit counter).
 */
export async function POST(req: Request) {
  if (!sameOriginJson(req, siteUrl())) return Response.json({ error: "Not allowed." }, { status: 403 });
  const user = await currentAdmin();
  if (!user) return Response.json({ error: "Please sign in again." }, { status: 401 });
  if (!has(user, "assistant")) return Response.json({ error: "Your role doesn't include the dashboard assistant." }, { status: 403 });
  if (!(await rateLimit(`assistant:${user.id}`, 30, 5 * 60_000))) {
    return Response.json({ error: "That's a lot of questions in a few minutes. Please wait a minute and try again." }, { status: 429 });
  }
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "That message couldn't be read. Please try again." }, { status: 400 });

  const settings = await getSettings();
  const answer = await assistantReply(user, settings, parsed.data.messages, parsed.data.path);
  return Response.json(answer, { headers: { "cache-control": "no-store" } });
}
