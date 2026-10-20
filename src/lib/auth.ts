import "server-only";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "@/db";

export const SESSION_COOKIE = "cn_admin";
const SESSION_HOURS = 12;
export type Role = "ADMIN" | "EDITOR" | "COORDINATOR";

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
  if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) return "Use both letters and numbers.";
  return null;
}

export async function startSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
  await db.update(schema.adminUsers).set({ lastLoginAt: new Date() }).where(eq(schema.adminUsers.id, userId));
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The signed-in staff member, or null. Deactivated accounts are signed out immediately. */
export const currentAdmin = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const user = await db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.id, String(payload.sub)),
      columns: { passwordHash: false },
    });
    return user?.active ? user : null;
  } catch {
    return null;
  }
});

export async function requireAdmin(roles?: Role[]) {
  const user = await currentAdmin();
  if (!user) redirect("/admin/login");
  if (roles && !roles.includes(user.role)) redirect("/admin?denied=1");
  return user;
}

export const can = {
  catalogue: (r: Role) => r === "ADMIN" || r === "EDITOR",
  content: (r: Role) => r === "ADMIN" || r === "EDITOR",
  enquiries: (r: Role) => r === "ADMIN" || r === "COORDINATOR",
  settings: (r: Role) => r === "ADMIN",
  team: (r: Role) => r === "ADMIN",
};

export async function audit(actorId: string | null, action: string, entity: string, summary: string, entityId?: string) {
  await db.insert(schema.auditLogs).values({ actorId, action, entity, entityId: entityId ?? null, summary }).catch((e) => console.error("[audit]", e));
}

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  EDITOR: "Content editor",
  COORDINATOR: "Enquiry coordinator",
};
