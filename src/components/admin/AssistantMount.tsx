import { createHash } from "node:crypto";
import { PlatformBridge } from "@/components/ejo/PlatformBridge";
import { assistantAiReady, starterPrompts } from "@/lib/assistant";
import { currentAdmin, has } from "@/lib/auth";
import { PLATFORM } from "@/lib/platform";
import { getSettings } from "@/lib/settings";
import { AssistantPanel } from "./AssistantPanel";

/**
 * Mounted once by the dashboard layout, ahead of the dashboard shell. Hands the platform details to
 * the browser (for the footer credit) and shows the assistant to people whose role includes it.
 */
export async function AssistantMount() {
  const [user, s] = await Promise.all([currentAdmin(), getSettings()]);
  const show = !!user && has(user, "assistant");
  return (
    <>
      <PlatformBridge info={PLATFORM} />
      {show && user ? (
        <AssistantPanel
          // A per-person key, so two people sharing a browser never see each other's chat.
          storageKey={createHash("sha256").update(`${user.id}:${user.sessionVersion}`).digest("base64url").slice(0, 16)}
          firstName={user.name.trim().split(/\s+/)[0] ?? ""}
          name={s.enyo.name || "Enyo"}
          aiReady={assistantAiReady(s)}
          starters={starterPrompts(user, assistantAiReady(s))}
        />
      ) : null}
    </>
  );
}
