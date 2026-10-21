import { NotificationCenter } from "@/components/admin/NotificationCenter";
import { AdminHead } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Notifications" };

export default async function Notifications() {
  await requireAdmin();
  return (
    <>
      <AdminHead
        title="Notifications"
        lead="Work waiting for you and what's new since you last looked. Items under Needs you clear by themselves when the work is done. The bell plays a sound when something arrives; turn sounds off with the speaker button."
      />
      <NotificationCenter />
    </>
  );
}
