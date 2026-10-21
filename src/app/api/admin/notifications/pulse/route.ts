import { currentAdmin } from "@/lib/auth";
import { notificationPulse } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/** "Has anything changed?" for the dashboard bell: one small read query, signed-in staff only. */
export async function GET() {
  const user = await currentAdmin();
  if (!user) return Response.json({ reason: "signed-out" }, { status: 401, headers: { "cache-control": "no-store" } });
  return Response.json({ pulse: await notificationPulse() }, { headers: { "cache-control": "no-store" } });
}
