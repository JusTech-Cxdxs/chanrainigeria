"use client";
import type { PlatformInfo } from "@/lib/platform";
import { setPlatformInfo } from "./platform-store";

/**
 * Passes the server's platform details to the browser. Rendered ahead of the dashboard shell, so the
 * footer credit hydrates with the same text the server sent (the value is the same for every visitor).
 */
export function PlatformBridge({ info }: { info: PlatformInfo }) {
  setPlatformInfo(info);
  return null;
}
