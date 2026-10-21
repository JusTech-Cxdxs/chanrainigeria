"use server";
import { createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { count, eq, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { audit, endSession, hashPassword, LOCKOUT, passwordProblem, startSession } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/guard";
import { normaliseSettings } from "@/lib/settings";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const back = (path: string, error: string) => redirect(`${path}?error=${encodeURIComponent(error)}`);
// Compared when the email is unknown, so response timing doesn't reveal which emails exist.
let dummy: string | undefined;
const dummyHash = async () => (dummy ??= await bcrypt.hash("not-a-real-password", 12));
const GENERIC = "That email and password don't match an active account.";

export async function login(form: FormData) {
  const email = s(form, "email").toLowerCase().slice(0, 200);
  const password = String(form.get("password") ?? "").slice(0, 128);
  const remember = form.get("remember") === "on";
  const ip = await clientKey();
  const busy = "Too many attempts. Wait 15 minutes and try again.";
  if (!(await rateLimit(`login-ip:${ip}`, 20, 15 * 60_000, { failClosed: true }))) back("/admin/login", busy);
  const acct = createHash("sha256").update(email).digest("base64url").slice(0, 22);
  if (!(await rateLimit(`login-acct:${acct}`, 10, 15 * 60_000, { failClosed: true }))) back("/admin/login", busy);

  const user = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, email) });
  // A locked account gets the same message as a wrong password, so the page never confirms an email exists.
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    await bcrypt.compare(password, await dummyHash());
    back("/admin/login", GENERIC);
  }
  const ok = await bcrypt.compare(password, user?.passwordHash ?? (await dummyHash()));
  if (!user || !ok || !user.active) {
    if (user) {
      // Counted inside the database in one statement, so parallel attempts can't skip the lockout.
      const r = await db.execute<{ failed: number }>(sql`
        update ${schema.adminUsers}
        set failed_logins = failed_logins + 1,
            locked_until = case when failed_logins + 1 >= ${LOCKOUT.attempts} then now() + make_interval(mins => ${LOCKOUT.minutes}) else locked_until end
        where id = ${user.id}
        returning failed_logins as failed`);
      const failed = Number(r.rows[0]?.failed ?? 0);
      await audit(user.id, "login_failed", "session", failed >= LOCKOUT.attempts ? `Account locked after ${failed} failed sign-ins` : "Failed sign-in");
    }
    back("/admin/login", GENERIC);
  }
  await startSession(user!, remember);
  await audit(user!.id, "login", "session", "Signed in");
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

function tokenMatches(given: string) {
  const expected = process.env.SETUP_TOKEN ?? "";
  if (expected.length < 12) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * First run only. Creates the platform owner's account (the master account, which the organisation
 * never sees) and the company name. Needs SETUP_TOKEN from the server environment, so nobody who
 * finds a fresh site first can claim it. Refuses once any account exists.
 */
export async function setup(form: FormData) {
  const [{ n }] = await db.select({ n: count() }).from(schema.adminUsers);
  if (n > 0) redirect("/admin/login");
  if (!(await rateLimit(`setup:${await clientKey()}`, 10, 15 * 60_000, { failClosed: true }))) back("/admin/setup", "Too many attempts. Wait 15 minutes.");
  if (!tokenMatches(s(form, "token"))) back("/admin/setup", "The setup code is not correct. It is the SETUP_TOKEN value in the server settings.");
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
    .values({ name, email, role: "MASTER", passwordHash: await hashPassword(password) })
    .returning();

  if (company) {
    const row = await db.query.siteSettings.findFirst();
    const current = normaliseSettings(row?.data);
    const data = { ...current, company: { ...current.company, name: company } };
    await db.insert(schema.siteSettings).values({ id: 1, data }).onConflictDoUpdate({ target: schema.siteSettings.id, set: { data } });
    revalidateTag("settings");
  }
  await audit(user.id, "setup", "admin_user", "Completed first-run setup");
  await startSession(user, false);
  redirect("/admin/team?welcome=1");
}
