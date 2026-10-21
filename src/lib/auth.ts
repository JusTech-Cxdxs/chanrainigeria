import "server-only";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "@/db";

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

/**
 * The signed-in staff member, or null. A session stops working as soon as the account is
 * deactivated or its password changes (the version in the token no longer matches).
 */
export const currentAdmin = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    const user = await db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.id, String(payload.sub)),
      columns: { passwordHash: false },
    });
    if (!user?.active || user.sessionVersion !== Number(payload.v)) return null;
    return user;
  } catch {
    return null;
  }
});

/** The platform owner counts as an administrator everywhere. */
export const isAdmin = (r: Role) => r === "MASTER" || r === "ADMIN";

export async function requireAdmin(roles?: Role[]) {
  const user = await currentAdmin();
  if (!user) redirect("/admin/login");
  if (roles && !roles.includes(user.role) && !(user.role === "MASTER" && roles.includes("ADMIN"))) redirect("/admin?denied=1");
  return user;
}

export const can = {
  catalogue: (r: Role) => isAdmin(r) || r === "EDITOR",
  content: (r: Role) => isAdmin(r) || r === "EDITOR",
  enquiries: (r: Role) => isAdmin(r) || r === "COORDINATOR",
  settings: (r: Role) => isAdmin(r),
  team: (r: Role) => isAdmin(r),
  testimonials: () => true,
};

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

export const ROLE_HELP: Record<Exclude<Role, "MASTER">, string> = {
  ADMIN: "Everything: settings, team, content and enquiries.",
  EDITOR: "Products, services, news, testimonials, images and locations.",
  COORDINATOR: "Enquiries, Enyo chats and testimonials to approve.",
};

/** Failed sign-ins before an account is locked, and for how long. */
export const LOCKOUT = { attempts: 6, minutes: 15 };
