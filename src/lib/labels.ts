// Readable labels for stored codes — staff never see raw enum values.
export const TYPE_LABEL: Record<string, string> = {
  GENERAL: "General enquiry",
  QUOTE: "Quote request",
  SERVICE_BOOKING: "Service booking",
  PARTS: "Parts request",
  CALLBACK: "Call-back",
};
export const STATUS_LABEL: Record<string, string> = {
  NEW: "New",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};
export const SOURCE_LABEL: Record<string, string> = { FORM: "Website form", ENYO: "Enyo chat" };
export const URGENCY_LABEL: Record<string, string> = {
  machine_down: "Machine down",
  soon: "This week",
  planned: "Planned",
};
export const statusTone = (s: string) => (s === "NEW" ? "brand" : s === "IN_PROGRESS" ? "warn" : "neutral") as "brand" | "warn" | "neutral";
