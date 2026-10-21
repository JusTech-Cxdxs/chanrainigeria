"use server";
import bcrypt from "bcryptjs";
import { and, count, eq, inArray, ne, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { rateLimit } from "@/lib/guard";
import { audit, currentAdmin, hashPassword, isAdmin, passwordProblem, requireAdmin, ROLE_LABEL, startSession, type Role } from "@/lib/auth";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
/** Roles the organisation can hand out. The platform role is never assignable from the dashboard. */
const ROLES: Role[] = ["ADMIN", "EDITOR", "COORDINATOR"];
const fail = (m: string) => redirect(`/admin/team?error=${encodeURIComponent(m)}`);

export async function addMember(f: FormData) {
  const me = await requireAdmin(["ADMIN"]);
  const email = s(f, "email").toLowerCase();
  const name = s(f, "name");
  const role = s(f, "role") as Role;
  const password = String(f.get("password") ?? "");
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) fail("Enter a name and a valid email.");
  if (!ROLES.includes(role)) fail("Choose a role.");
  const problem = passwordProblem(password);
  if (problem) fail(problem);
  if (await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, email) })) fail("Someone with that email already has an account.");
  const [u] = await db.insert(schema.adminUsers).values({ email, name, role, passwordHash: await hashPassword(password) }).returning();
  await audit(me.id, "create", "admin_user", `Added ${name} as ${ROLE_LABEL[role]}`, u.id);
  redirect(`/admin/team?saved=${encodeURIComponent(`${name} can now sign in. Share the temporary password with them privately.`)}`);
}

async function otherActiveAdmins(exceptId: string) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(schema.adminUsers)
    .where(and(inArray(schema.adminUsers.role, ["ADMIN", "MASTER"]), eq(schema.adminUsers.active, true), ne(schema.adminUsers.id, exceptId)));
  return n;
}

export async function updateMember(id: string, f: FormData) {
  const me = await requireAdmin(["ADMIN"]);
  const u = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, id) });
  if (!u) fail("That account no longer exists.");
  // The organisation's administrators can't see or change the platform account.
  if (u!.role === "MASTER" && me.role !== "MASTER") fail("That account no longer exists.");
  const role = (u!.role === "MASTER" ? "MASTER" : s(f, "role")) as Role;
  const active = f.get("active") === "on";
  if (u!.role !== "MASTER" && !ROLES.includes(role)) fail("Choose a role.");
  if (u!.id === me.id && !active) fail("You can't deactivate your own account.");
  if (isAdmin(u!.role) && (!isAdmin(role) || !active) && (await otherActiveAdmins(id)) === 0) fail("There must always be at least one active administrator.");
  const password = String(f.get("password") ?? "");
  let hash: string | undefined;
  if (password) {
    const problem = passwordProblem(password);
    if (problem) fail(problem);
    hash = await hashPassword(password);
  }
  const signOut = !!hash || role !== u!.role || active !== u!.active;
  await db
    .update(schema.adminUsers)
    .set({
      role,
      active,
      ...(hash ? { passwordHash: hash, failedLogins: 0, lockedUntil: null } : {}),
      ...(signOut ? { sessionVersion: sql`${schema.adminUsers.sessionVersion} + 1` } : {}),
    })
    .where(eq(schema.adminUsers.id, id));
  const changes = [
    role !== u!.role && `role changed to ${ROLE_LABEL[role]}`,
    active !== u!.active && (active ? "reactivated" : "deactivated"),
    hash && "password reset",
  ].filter(Boolean);
  if (changes.length) await audit(me.id, "update", "admin_user", `${u!.name}: ${changes.join(", ")}`, id);
  redirect(`/admin/team?saved=${encodeURIComponent(signOut ? "Saved. Their open sessions have been signed out." : "Saved.")}`);
}

export async function unlockMember(id: string) {
  const me = await requireAdmin(["ADMIN"]);
  const u = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, id) });
  if (!u || (u.role === "MASTER" && me.role !== "MASTER")) fail("That account no longer exists.");
  await db.update(schema.adminUsers).set({ failedLogins: 0, lockedUntil: null }).where(eq(schema.adminUsers.id, id));
  await audit(me.id, "update", "admin_user", `Unlocked ${u!.name}`, id);
  redirect("/admin/team?saved=Unlocked.");
}

export async function changeOwnPassword(f: FormData) {
  const me = await currentAdmin();
  if (!me) redirect("/admin/login");
  if (!(await rateLimit(`pwchange:${me!.id}`, 5, 15 * 60_000))) redirect("/admin/account?error=Too%20many%20attempts.%20Wait%2015%20minutes.");
  const stored = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, me!.id), columns: { passwordHash: true } });
  if (!stored || !(await bcrypt.compare(String(f.get("current") ?? ""), stored.passwordHash))) {
    redirect("/admin/account?error=Your%20current%20password%20is%20not%20correct.");
  }
  const password = String(f.get("password") ?? "");
  const problem = passwordProblem(password);
  if (problem) redirect(`/admin/account?error=${encodeURIComponent(problem)}`);
  if (password !== String(f.get("confirm") ?? "")) redirect("/admin/account?error=The%20two%20passwords%20don%27t%20match.");
  const [u] = await db
    .update(schema.adminUsers)
    .set({ passwordHash: await hashPassword(password), sessionVersion: sql`${schema.adminUsers.sessionVersion} + 1` })
    .where(eq(schema.adminUsers.id, me!.id))
    .returning();
  // Every other device is signed out; this one stays signed in.
  await startSession(u, false);
  await audit(me!.id, "update", "admin_user", "Changed their password", me!.id);
  redirect("/admin/account?saved=Password%20changed.%20You%27ve%20been%20signed%20out%20everywhere%20else.");
}
