"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { audit, can, requireAdmin } from "@/lib/auth";
import { staffReply } from "@/lib/email-templates";
import { STATUS_LABEL } from "@/lib/labels";
import { sendMail } from "@/lib/mail";
import { getSettings } from "@/lib/settings";

const STATUSES = ["NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

async function load(id: string) {
  const user = await requireAdmin();
  if (!can.enquiries(user.role)) redirect("/admin?denied=1");
  const e = await db.query.enquiries.findFirst({ where: eq(schema.enquiries.id, id) });
  if (!e) redirect("/admin/enquiries?error=" + encodeURIComponent("That enquiry no longer exists."));
  return { user, e: e! };
}

export async function updateEnquiry(id: string, form: FormData) {
  const { user, e } = await load(id);
  const status = String(form.get("status") ?? e.status) as (typeof STATUSES)[number];
  const assigneeId = String(form.get("assigneeId") ?? "") || null;
  if (!STATUSES.includes(status)) redirect(`/admin/enquiries/${id}?error=Unknown%20status`);
  await db.update(schema.enquiries).set({ status, assigneeId }).where(eq(schema.enquiries.id, id));
  const changes: string[] = [];
  if (status !== e.status) changes.push(`status ${STATUS_LABEL[e.status]} → ${STATUS_LABEL[status]}`);
  if (assigneeId !== e.assigneeId) {
    const a = assigneeId ? await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, assigneeId) }) : null;
    changes.push(a ? `assigned to ${a.name}` : "unassigned");
  }
  if (changes.length) await audit(user.id, "update", "enquiry", `${e.ref}: ${changes.join(", ")}`, id);
  revalidatePath("/admin", "layout");
  redirect(`/admin/enquiries/${id}?saved=`);
}

export async function addNote(id: string, form: FormData) {
  const { user, e } = await load(id);
  const body = String(form.get("body") ?? "").trim();
  if (!body) redirect(`/admin/enquiries/${id}?error=${encodeURIComponent("Write a note first.")}`);
  await db.insert(schema.enquiryNotes).values({ enquiryId: id, authorId: user.id, body: body.slice(0, 5000) });
  if (e.status === "NEW") await db.update(schema.enquiries).set({ status: "IN_PROGRESS" }).where(eq(schema.enquiries.id, id));
  await audit(user.id, "note", "enquiry", `${e.ref}: internal note added`, id);
  redirect(`/admin/enquiries/${id}?saved=Note%20added.`);
}

/** Emails the customer from the company (never shows the staff member's name) and logs it as a note. */
export async function replyToCustomer(id: string, form: FormData) {
  const { user, e } = await load(id);
  const message = String(form.get("message") ?? "").trim();
  if (message.length < 2) redirect(`/admin/enquiries/${id}?error=${encodeURIComponent("Write a reply first.")}`);
  const settings = await getSettings();
  const desk = settings.desks[e.desk];
  const sent = await sendMail(settings, { to: e.email, ...staffReply(settings, e.ref, e.name, message), replyTo: desk?.email || undefined });
  if (!sent) redirect(`/admin/enquiries/${id}?error=${encodeURIComponent("The email could not be sent. Check the email connection, or reply from your own mailbox.")}`);
  await db.insert(schema.enquiryNotes).values({ enquiryId: id, authorId: user.id, body: `Emailed the customer:\n\n${message}` });
  if (e.status === "NEW") await db.update(schema.enquiries).set({ status: "IN_PROGRESS" }).where(eq(schema.enquiries.id, id));
  await audit(user.id, "reply", "enquiry", `${e.ref}: reply emailed to customer`, id);
  redirect(`/admin/enquiries/${id}?saved=Reply%20sent.`);
}
