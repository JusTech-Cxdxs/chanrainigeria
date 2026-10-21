"use server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentAdmin } from "@/lib/auth";
import { markAllRead, markRead, notificationSummary, type NotificationSummary } from "@/lib/notifications";

/** The bell's data for the signed-in person. Null when signed out. */
export async function getNotifications(): Promise<NotificationSummary | null> {
  const user = await currentAdmin();
  return user ? notificationSummary(user) : null;
}

export async function readNotifications(keys: string[]) {
  const user = await currentAdmin();
  if (user) await markRead(user.id, Array.isArray(keys) ? keys.map(String) : []);
}

export async function readAllNotifications() {
  const user = await currentAdmin();
  if (user) await markAllRead(user.id);
}

export async function muteNotifications(muted: boolean) {
  const user = await currentAdmin();
  if (user) await db.update(schema.adminUsers).set({ notificationsMuted: !!muted }).where(eq(schema.adminUsers.id, user.id));
}
