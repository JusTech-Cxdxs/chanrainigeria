"use server";
import bcrypt from "bcryptjs";
import { count, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { audit, endSession, hashPassword, passwordProblem, startSession } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/guard";
import { normaliseSettings } from "@/lib/settings";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const back = (path: string, error: string) => redirect(`${path}?error=${encodeURIComponent(error)}`);

export async function login(form: FormData) {
  const email = s(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!rateLimit(`login:${await clientKey()}`, 8, 15 * 60_000) || !rateLimit(`login:${email}`, 8, 15 * 60_000)) {
    back("/admin/login", "Too many attempts. Wait 15 minutes and try again.");
  }
  const user = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, email) });
  // Compare even when the user doesn't exist, so timing doesn't reveal which emails are registered.
  const ok = await bcrypt.compare(password, user?.passwordHash ?? "$2a$12$0000000000000000000000000000000000000000000000000000");
  if (!user || !ok || !user.active) {
    await audit(user?.id ?? null, "login_failed", "session", `Failed sign-in for ${email}`);
    back("/admin/login", "That email and password don't match an active account.");
  }
  await startSession(user!.id);
  await audit(user!.id, "login", "session", `${user!.name} signed in`);
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

/** First run only: creates the first administrator and the company name. Refuses once anyone exists. */
export async function setup(form: FormData) {
  const [{ n }] = await db.select({ n: count() }).from(schema.adminUsers);
  if (n > 0) redirect("/admin/login");
  const name = s(form, "name");
  const email = s(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  const company = s(form, "company");
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) back("/admin/setup", "Enter your name and a valid email.");
  const problem = passwordProblem(password);
  if (problem) back("/admin/setup", problem);
  if (password !== String(form.get("confirm") ?? "")) back("/admin/setup", "The two passwords don't match.");

  const [user] = await db
    .insert(schema.adminUsers)
    .values({ name, email, role: "ADMIN", passwordHash: await hashPassword(password) })
    .returning();

  if (company) {
    const row = await db.query.siteSettings.findFirst();
    const current = normaliseSettings(row?.data);
    const data = { ...current, company: { ...current.company, name: company } };
    await db
      .insert(schema.siteSettings)
      .values({ id: 1, data })
      .onConflictDoUpdate({ target: schema.siteSettings.id, set: { data } });
    revalidateTag("settings");
  }
  await audit(user.id, "setup", "admin_user", `${name} completed first-run setup`);
  await startSession(user.id);
  redirect("/admin/settings?welcome=1");
}
