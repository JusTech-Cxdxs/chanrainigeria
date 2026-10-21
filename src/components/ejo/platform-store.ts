// The platform details as the server sees them, for components that also render in the browser.
// The browser build can't read server environment variables, so the dashboard layout hands them
// over through <PlatformBridge> before anything that shows the brand renders.
import { PLATFORM, type PlatformInfo } from "@/lib/platform";

let current: PlatformInfo = PLATFORM;

export function setPlatformInfo(p: PlatformInfo) {
  current = p;
}

export function platformInfo(): PlatformInfo {
  return typeof window === "undefined" ? PLATFORM : current;
}
