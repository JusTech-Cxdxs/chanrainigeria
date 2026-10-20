import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { createEnquiry } from "@/lib/enquiries";
import { enyoReply } from "@/lib/enyo";
import { clientKey, rateLimit } from "@/lib/guard";
import { getSettings } from "@/lib/settings";

const chatBody = z.object({
  action: z.literal("message"),
  sessionId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(1500),
  page: z.string().max(300).optional(),
});

const handoffBody = z.object({
  action: z.literal("handoff"),
  sessionId: z.string().uuid().optional(),
  name: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  message: z.string(),
  consent: z.boolean(),
});

async function ensureSession(id: string | undefined, page?: string) {
  if (id) {
    const s = await db.query.chatSessions.findFirst({ where: eq(schema.chatSessions.id, id) });
    if (s) return s.id;
  }
  const [s] = await db.insert(schema.chatSessions).values({ page: page ?? null }).returning({ id: schema.chatSessions.id });
  return s.id;
}

export async function POST(req: Request) {
  const settings = await getSettings();
  if (!settings.enyo.enabled) return Response.json({ error: "The assistant is switched off." }, { status: 503 });
  if (!rateLimit(`enyo:${await clientKey()}`, 30, 5 * 60_000)) {
    return Response.json({ error: "You're sending messages quickly. Please wait a minute and try again." }, { status: 429 });
  }
  const json = await req.json().catch(() => null);

  const handoff = handoffBody.safeParse(json);
  if (handoff.success) {
    const h = handoff.data;
    const sessionId = await ensureSession(h.sessionId);
    const transcript = (
      await db.query.chatMessages.findMany({ where: eq(schema.chatMessages.sessionId, sessionId), orderBy: [asc(schema.chatMessages.createdAt)], limit: 30 })
    )
      .map((m) => `${m.role === "user" ? "Customer" : settings.enyo.name}: ${m.content}`)
      .join("\n");
    const existing = await db.query.enquiries.findFirst({ where: and(eq(schema.enquiries.chatId, sessionId)) });
    const r = await createEnquiry(
      {
        type: "GENERAL",
        name: h.name,
        email: h.email,
        phone: h.phone,
        message: transcript ? `${h.message}\n\n--- Chat so far ---\n${transcript}` : h.message,
        consent: h.consent,
      },
      { source: "ENYO", chatId: existing ? undefined : sessionId },
    );
    if (!r.ok) return Response.json({ sessionId, errors: r.errors }, { status: 422 });
    const reply = `Thanks, ${h.name.split(/\s+/)[0]}. Your request is logged as ${r.ref} and our ${r.desk.label.toLowerCase()} team will reply by email.`;
    await db.insert(schema.chatMessages).values({ sessionId, role: "assistant", content: reply });
    return Response.json({ sessionId, reply, enquiryRef: r.ref });
  }

  const parsed = chatBody.safeParse(json);
  if (!parsed.success) return Response.json({ error: "Invalid message" }, { status: 400 });
  const { message, page } = parsed.data;
  const sessionId = await ensureSession(parsed.data.sessionId, page);

  await db.insert(schema.chatMessages).values({ sessionId, role: "user", content: message });
  const history = (
    await db.query.chatMessages.findMany({
      where: eq(schema.chatMessages.sessionId, sessionId),
      orderBy: [asc(schema.chatMessages.createdAt)],
      limit: 40,
    })
  ).map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const turn = await enyoReply(settings, history, { chatId: sessionId, page });
  await db.insert(schema.chatMessages).values({ sessionId, role: "assistant", content: turn.reply });
  await db.update(schema.chatSessions).set({ updatedAt: new Date() }).where(eq(schema.chatSessions.id, sessionId));
  return Response.json({ sessionId, reply: turn.reply, enquiryRef: turn.enquiryRef });
}
