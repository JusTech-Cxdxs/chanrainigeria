// Short, plain names for the "which equipment?" list on the quote form. Types not listed here use
// their own name without the part in brackets.
const TYPE: Record<string, string> = {
  "reciprocating-compressors": "Online compressors (mother stations)",
  "hydraulic-booster-compressors": "Booster compressors (daughter stations)",
  "station-solutions": "Integrated CNG station solutions (end to end)",
  "cng-dispensers": "CNG dispensers",
  "cascades-storage": "Storage cascades",
  "gas-utility-skids": "PRS and metering skids",
  "cng-tube-trailer-skids": "Tube trailer skids",
  "el-pro-counterbalance-forklifts": "EL-PRO series electric forklifts",
  "g-series-counterbalance-forklifts": "G series electric forklifts",
  "heavy-duty-counterbalance-forklifts": "Heavy-duty electric forklifts",
};
const LINE: Record<string, string> = {
  "cng-gas-equipment": "CNG equipment",
  "construction-equipment": "Construction equipment",
  "forklifts-material-handling": "Electric forklifts",
};

export const shortTypeName = (slug: string, name: string) => TYPE[slug] ?? name.replace(/\s*\(.*\)\s*$/, "");
export const shortLineName = (slug: string, name: string) => LINE[slug] ?? name;
/** Value the quote form sends for an equipment type (a model sends its own slug). */
export const TYPE_PREFIX = "type:";
