"use server";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { audit, requireAdmin } from "@/lib/auth";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const back = (msg: string) => redirect(`/admin/testimonials?saved=${encodeURIComponent(msg)}`);

function refresh() {
  revalidateTag("testimonials");
  revalidatePath("/", "layout");
}

export async function reviewTestimonial(id: string, decision: "APPROVED" | "REJECTED" | "PENDING") {
  if (!["APPROVED", "REJECTED", "PENDING"].includes(decision)) return;
  const user = await requireAdmin();
  const t = await db.query.testimonials.findFirst({ where: eq(schema.testimonials.id, id) });
  if (!t) redirect("/admin/testimonials?error=That%20testimonial%20no%20longer%20exists.");
  await db.update(schema.testimonials).set({ status: decision, reviewedById: user.id, reviewedAt: new Date() }).where(eq(schema.testimonials.id, id));
  const verb = decision === "APPROVED" ? "Approved" : decision === "REJECTED" ? "Rejected" : "Moved back to waiting";
  await audit(user.id, decision.toLowerCase(), "testimonial", `${verb} testimonial from ${t!.name}`, id);
  refresh();
  back(`${verb}.`);
}

export async function deleteTestimonial(id: string) {
  const user = await requireAdmin();
  const t = await db.query.testimonials.findFirst({ where: eq(schema.testimonials.id, id) });
  if (t) {
    await db.delete(schema.testimonials).where(eq(schema.testimonials.id, id));
    await audit(user.id, "delete", "testimonial", `Deleted testimonial from ${t.name}`, id);
  }
  refresh();
  back("Deleted.");
}

/** Staff add or correct a testimonial (e.g. one received by email or in person). */
export async function saveTestimonial(id: string, f: FormData) {
  const user = await requireAdmin();
  const name = s(f, "name").slice(0, 80);
  const quote = s(f, "quote").slice(0, 800);
  if (name.length < 2 || quote.length < 10) redirect("/admin/testimonials?error=Enter%20a%20name%20and%20the%20testimonial%20text.");
  const vals = {
    name,
    quote,
    role: s(f, "role").slice(0, 80) || null,
    company: s(f, "company").slice(0, 120) || null,
    rating: Math.min(5, Math.max(1, Number(f.get("rating")) || 5)),
    isExample: f.get("isExample") === "on",
    order: Number(f.get("order")) || 0,
  };
  if (id === "new") {
    const [row] = await db
      .insert(schema.testimonials)
      .values({ ...vals, status: "APPROVED", source: "staff", reviewedById: user.id, reviewedAt: new Date() })
      .returning();
    await audit(user.id, "create", "testimonial", `Added testimonial from ${name}`, row.id);
  } else {
    await db.update(schema.testimonials).set(vals).where(eq(schema.testimonials.id, id));
    await audit(user.id, "update", "testimonial", `Edited testimonial from ${name}`, id);
  }
  refresh();
  back("Saved.");
}
