import "server-only";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "@/db";
import { ALL_PERMISSIONS, isPermission, SYSTEM_ROLES, type Permission } from "./permissions";

/** In production the cookie uses the __Host- prefix: HTTPS only, this exact host, never readable by subdomains. */
export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-cn_admin" : "cn_admin";
const SHORT_HOURS = 12;
const LONG_DAYS = 14;
export type Role = "MASTER" | "ADMIN" | "EDITOR" | "COORDINATOR";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters.");
  return new TextEncoder().encode(s);
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}

export function passwordProblem(pw: string) {
  if (pw.length < 10) return "Use at least 10 characters.";
  if (pw.length > 128) return "Use 128 characters or fewer.";
  if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) return "Use both letters and numbers.";
  if (/^(password|qwerty|123456|chanrai|admin)/i.test(pw)) return "That password is too easy to guess.";
  return null;
}

export async function startSession(user: { id: string; sessionVersion: number }, remember: boolean) {
  const maxAge = remember ? LONG_DAYS * 86400 : SHORT_HOURS * 3600;
  const token = await new SignJWT({ sub: user.id, v: user.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAge)
    .sign(secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  await db
    .update(schema.adminUsers)
    .set({ lastLoginAt: new Date(), failedLogins: 0, lockedUntil: null })
    .where(eq(schema.adminUsers.id, user.id));
}

/** Signing out also retires the token on the server, so a copied cookie stops working too. */
export async function endSession() {
  const user = await currentAdmin();
  if (user) {
    await db
      .update(schema.adminUsers)
      .set({ sessionVersion: sql`${schema.adminUsers.sessionVersion} + 1` })
      .where(eq(schema.adminUsers.id, user.id));
  }
  (await cookies()).delete(SESSION_COOKIE);
}

/** Access for a role row; legacy enum values map onto the matching system role names. */
const LEGACY_PERMS: Record<string, Permission[]> = Object.fromEntries(SYSTEM_ROLES.filter((r) => r.legacy).map((r) => [r.legacy, r.permissions]));

/**
 * The signed-in staff member with their permissions, or null. A session stops working as soon as the
 * account is deactivated or its password changes (the version in the token no longer matches).
 */
export const currentAdmin = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    const user = await db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.id, String(payload.sub)),
      columns: { passwordHash: false },
      with: { roleRef: true },
    });
    if (!user?.active || user.sessionVersion !== Number(payload.v)) return null;
    const permissions: Permission[] =
      user.role === "MASTER" ? ALL_PERMISSIONS : user.roleRef ? user.roleRef.permissions.filter(isPermission) : (LEGACY_PERMS[user.role] ?? []);
    const roleName = user.role === "MASTER" ? "Platform support" : (user.roleRef?.name ?? ROLE_LABEL[user.role]);
    return { ...user, permissions, roleName, isMaster: user.role === "MASTER" };
  } catch {
    return null;
  }
});

export type StaffUser = NonNullable<Awaited<ReturnType<typeof currentAdmin>>>;

export const has = (user: { permissions: readonly string[] } | null | undefined, p: Permission) => !!user?.permissions.includes(p);

/** Signed-in staff only; with a permission, people without it are sent to the overview. */
export async function requireAdmin(perm?: Permission | Permission[]) {
  const user = await currentAdmin();
  if (!user) redirect("/admin/login");
  if (perm) {
    const list = Array.isArray(perm) ? perm : [perm];
    if (!list.some((p) => user.permissions.includes(p))) redirect("/admin?denied=1");
  }
  return user;
}

export async function audit(actorId: string | null, action: string, entity: string, summary: string, entityId?: string) {
  await db
    .insert(schema.auditLogs)
    .values({ actorId, action, entity, entityId: entityId ?? null, summary })
    .catch((e) => console.error("[audit]", e));
}

/** Organisation-facing role names. The platform owner appears only as "Platform support" to itself. */
export const ROLE_LABEL: Record<Role, string> = {
  MASTER: "Platform support",
  ADMIN: "Administrator",
  EDITOR: "Content editor",
  COORDINATOR: "Enquiry coordinator",
};


/** Failed sign-ins before an account is locked, and for how long. */
export const LOCKOUT = { attempts: 6, minutes: 15 };
