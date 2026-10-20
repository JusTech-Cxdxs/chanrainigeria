"use server";
import { and, count, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { audit, currentAdmin, hashPassword, passwordProblem, requireAdmin, ROLE_LABEL, type Role } from "@/lib/auth";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const ROLES: Role[] = ["ADMIN", "EDITOR", "COORDINATOR"];
const fail = (m: string) => redirect(`/admin/team?error=${encodeURIComponent(m)}`);

export async function addMember(f: FormData) {
  const me = await requireAdmin(["ADMIN"]);
  const email = s(f, "email").toLowerCase();
  const name = s(f, "name");
  const role = s(f, "role") as Role;
  const password = String(f.get("password") ?? "");
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) fail("Enter a name and a valid email.");
  if (!ROLES.includes(role)) fail("Choose a role.");
  const problem = passwordProblem(password);
  if (problem) fail(problem);
  if (await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, email) })) fail("Someone with that email already has an account.");
  const [u] = await db.insert(schema.adminUsers).values({ email, name, role, passwordHash: await hashPassword(password) }).returning();
  await audit(me.id, "create", "admin_user", `Added ${name} as ${ROLE_LABEL[role]}`, u.id);
  redirect(`/admin/team?saved=${encodeURIComponent(`${name} can now sign in. Share the temporary password privately.`)}`);
}

async function otherActiveAdmins(exceptId: string) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(schema.adminUsers)
    .where(and(eq(schema.adminUsers.role, "ADMIN"), eq(schema.adminUsers.active, true), ne(schema.adminUsers.id, exceptId)));
  return n;
}

export async function updateMember(id: string, f: FormData) {
  const me = await requireAdmin(["ADMIN"]);
  const u = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, id) });
  if (!u) fail("That account no longer exists.");
  const role = s(f, "role") as Role;
  const active = f.get("active") === "on";
  if (!ROLES.includes(role)) fail("Choose a role.");
  // Never leave the site without an active administrator.
  if (u!.role === "ADMIN" && (role !== "ADMIN" || !active) && (await otherActiveAdmins(id)) === 0) fail("There must always be at least one active administrator.");
  const password = String(f.get("password") ?? "");
  let hash: string | undefined;
  if (password) {
    const problem = passwordProblem(password);
    if (problem) fail(problem);
    hash = await hashPassword(password);
  }
  await db
    .update(schema.adminUsers)
    .set({ role, active, ...(hash ? { passwordHash: hash } : {}) })
    .where(eq(schema.adminUsers.id, id));
  const changes = [
    role !== u!.role && `role → ${ROLE_LABEL[role]}`,
    active !== u!.active && (active ? "reactivated" : "deactivated"),
    hash && "password reset",
  ].filter(Boolean);
  if (changes.length) await audit(me.id, "update", "admin_user", `${u!.name}: ${changes.join(", ")}`, id);
  redirect("/admin/team?saved=");
}

export async function changeOwnPassword(f: FormData) {
  const me = await currentAdmin();
  if (!me) redirect("/admin/login");
  const password = String(f.get("password") ?? "");
  const problem = passwordProblem(password);
  if (problem) redirect(`/admin/account?error=${encodeURIComponent(problem)}`);
  if (password !== String(f.get("confirm") ?? "")) redirect("/admin/account?error=The%20two%20passwords%20don%27t%20match.");
  await db.update(schema.adminUsers).set({ passwordHash: await hashPassword(password) }).where(eq(schema.adminUsers.id, me!.id));
  await audit(me!.id, "update", "admin_user", `${me!.name} changed their password`, me!.id);
  redirect("/admin/account?saved=Password%20changed.");
}
