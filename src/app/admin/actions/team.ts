"use server";
import bcrypt from "bcryptjs";
import { count, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { rateLimit } from "@/lib/guard";
import { audit, currentAdmin, hashPassword, passwordProblem, requireAdmin, startSession } from "@/lib/auth";
import { recordRevision } from "@/lib/history";
import { isPermission } from "@/lib/permissions";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const fail = (m: string, to = "/admin/team") => redirect(`${to}?error=${encodeURIComponent(m)}`);

async function roleById(id: string) {
  return id ? db.query.roles.findFirst({ where: eq(schema.roles.id, id) }) : undefined;
}

/** Active people (other than exceptId) whose role can manage the team. There must always be one. */
async function otherTeamManagers(exceptId: string) {
  const r = await db.execute<{ n: number }>(sql`
    select count(*)::int as n from ${schema.adminUsers} u
    left join ${schema.roles} r on r.id = u.role_id
    where u.active and u.id <> ${exceptId} and u.role <> 'MASTER'
      and (r.permissions ? 'team' or (u.role_id is null and u.role = 'ADMIN'))`);
  return Number(r.rows[0]?.n ?? 0);
}

function notifySettings(f: FormData) {
  const desks = f.getAll("notifyDesks").map(String).filter(Boolean).slice(0, 20);
  return { notify: f.get("notify") === "on", notifyDesks: desks };
}

export async function addMember(f: FormData) {
  const me = await requireAdmin("team");
  const email = s(f, "email").toLowerCase();
  const name = s(f, "name");
  const role = await roleById(s(f, "roleId"));
  const password = String(f.get("password") ?? "");
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) fail("Enter a name and a valid email.");
  if (!role) fail("Choose a role.");
  const problem = passwordProblem(password);
  if (problem) fail(problem);
  if (await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, email) })) fail("Someone with that email already has an account.");
  const [u] = await db
    .insert(schema.adminUsers)
    .values({ email, name, role: "EDITOR", roleId: role!.id, jobTitle: s(f, "jobTitle").slice(0, 80), ...notifySettings(f), passwordHash: await hashPassword(password) })
    .returning();
  await audit(me.id, "create", "admin_user", `Added ${name} as ${role!.name}`, u.id);
  redirect(`/admin/team?saved=${encodeURIComponent(`${name} can now sign in. Share the temporary password with them privately.`)}`);
}

export async function updateMember(id: string, f: FormData) {
  const me = await requireAdmin("team");
  const u = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, id), with: { roleRef: true } });
  if (!u) fail("That account no longer exists.");
  // The organisation's administrators can't see or change the platform account.
  if (u!.role === "MASTER" && !me.isMaster) fail("That account no longer exists.");
  const isMasterAcct = u!.role === "MASTER";
  const role = isMasterAcct ? null : await roleById(s(f, "roleId"));
  if (!isMasterAcct && !role) fail("Choose a role.");
  const active = f.get("active") === "on";
  if (u!.id === me.id && !active) fail("You can't deactivate your own account.");
  // Nobody changes their own role; another person with Team and roles does it.
  if (u!.id === me.id && !isMasterAcct && role!.id !== u!.roleId) fail("You can't change your own role. Ask another administrator.");
  const managedTeam = !isMasterAcct && !!u!.roleRef?.permissions.includes("team");
  const stillManages = !!role?.permissions.includes("team") && active;
  if (managedTeam && !stillManages && (await otherTeamManagers(id)) === 0) fail("At least one active person must be able to manage the team.");
  const password = String(f.get("password") ?? "");
  let hash: string | undefined;
  if (password) {
    const problem = passwordProblem(password);
    if (problem) fail(problem);
    hash = await hashPassword(password);
  }
  const roleChanged = !isMasterAcct && role!.id !== u!.roleId;
  const signOut = !!hash || roleChanged || active !== u!.active;
  await db
    .update(schema.adminUsers)
    .set({
      ...(isMasterAcct ? {} : { roleId: role!.id }),
      active,
      name: s(f, "name") || u!.name,
      jobTitle: s(f, "jobTitle").slice(0, 80),
      ...notifySettings(f),
      ...(hash ? { passwordHash: hash, failedLogins: 0, lockedUntil: null } : {}),
      ...(signOut ? { sessionVersion: sql`${schema.adminUsers.sessionVersion} + 1` } : {}),
    })
    .where(eq(schema.adminUsers.id, id));
  const changes = [roleChanged && `role changed to ${role!.name}`, active !== u!.active && (active ? "reactivated" : "deactivated"), hash && "password reset"].filter(Boolean);
  await audit(me.id, "update", "admin_user", `${u!.name}: ${changes.length ? changes.join(", ") : "details updated"}`, id);
  redirect(`/admin/team?saved=${encodeURIComponent(signOut ? "Saved. Their open sessions have been signed out." : "Saved.")}`);
}

export async function unlockMember(id: string) {
  const me = await requireAdmin("team");
  const u = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, id) });
  if (!u || (u.role === "MASTER" && !me.isMaster)) fail("That account no longer exists.");
  await db.update(schema.adminUsers).set({ failedLogins: 0, lockedUntil: null }).where(eq(schema.adminUsers.id, id));
  await audit(me.id, "update", "admin_user", `Unlocked ${u!.name}`, id);
  redirect("/admin/team?saved=Unlocked.");
}

// ---------- Roles ----------
const ROLES_PAGE = "/admin/team/roles";

export async function saveRole(id: string, f: FormData) {
  const me = await requireAdmin("team");
  const name = s(f, "name").slice(0, 60);
  const description = s(f, "description").slice(0, 240);
  const permissions = f.getAll("perm").map(String).filter(isPermission);
  if (name.length < 2) fail("Give the role a name.", ROLES_PAGE);
  const clash = await db.query.roles.findFirst({ where: eq(schema.roles.name, name) });
  if (clash && clash.id !== id) fail("Another role already has that name.", ROLES_PAGE);
  if (id === "new") {
    const [r] = await db.insert(schema.roles).values({ name, description, permissions }).returning();
    await audit(me.id, "create", "role", `Created the role ${name}`, r.id);
    redirect(`${ROLES_PAGE}?saved=${encodeURIComponent(`${name} created.`)}`);
  }
  const cur = await db.query.roles.findFirst({ where: eq(schema.roles.id, id) });
  if (!cur) fail("That role no longer exists.", ROLES_PAGE);
  // Removing "team" from the last role that has it would lock everyone out of Team.
  if (cur!.permissions.includes("team") && !permissions.includes("team")) {
    const r = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from ${schema.adminUsers} u join ${schema.roles} r on r.id = u.role_id
      where u.active and u.role <> 'MASTER' and r.permissions ? 'team' and r.id <> ${id}`);
    // (Accounts from before roles existed, with no role set, are counted by the seed's role assignment.)
    if (Number(r.rows[0]?.n ?? 0) === 0) fail("This is the only role that can manage the team. Give another role that permission first.", ROLES_PAGE);
  }
  await recordRevision("role", id, cur!.name, "update", cur, me.id);
  await db.update(schema.roles).set({ name, description, permissions }).where(eq(schema.roles.id, id));
  // People with this role pick up the change on their next page; force a fresh sign-in if access shrank.
  if (cur!.permissions.some((p) => !permissions.includes(p as never))) {
    await db.update(schema.adminUsers).set({ sessionVersion: sql`${schema.adminUsers.sessionVersion} + 1` }).where(eq(schema.adminUsers.roleId, id));
  }
  await audit(me.id, "update", "role", `Updated the role ${name}`, id);
  redirect(`${ROLES_PAGE}?saved=${encodeURIComponent(`${name} saved.`)}`);
}

export async function deleteRole(id: string) {
  const me = await requireAdmin("team");
  const cur = await db.query.roles.findFirst({ where: eq(schema.roles.id, id) });
  if (!cur) fail("That role no longer exists.", ROLES_PAGE);
  if (cur!.isSystem) fail("Built-in roles can be edited but not deleted.", ROLES_PAGE);
  const [{ n }] = await db.select({ n: count() }).from(schema.adminUsers).where(eq(schema.adminUsers.roleId, id));
  if (n > 0) fail(`${n} ${n === 1 ? "person has" : "people have"} this role. Give them another role first.`, ROLES_PAGE);
  await recordRevision("role", id, cur!.name, "delete", cur, me.id);
  await db.delete(schema.roles).where(eq(schema.roles.id, id));
  await audit(me.id, "delete", "role", `Deleted the role ${cur!.name}`, id);
  redirect(`${ROLES_PAGE}?saved=${encodeURIComponent("Role deleted.")}`);
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
