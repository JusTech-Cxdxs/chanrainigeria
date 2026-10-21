// Shapes for the page-content registry (src/lib/content-registry.ts). Safe for client components:
// the dashboard's page editor builds its forms from these definitions.

export type TextField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "markdown";
  default: string;
  hint?: string;
  /** Character guide shown under the field; not enforced */
  max?: number;
};

export type LinkField = {
  key: string;
  label: string;
  type: "link";
  /** A site path (/contact) or a full https:// address */
  default: string;
  hint?: string;
};

export type ImageField = {
  key: string;
  label: string;
  type: "image";
  /** An image slot from src/lib/image-slots.ts (e.g. "page-contact"), used until a picture is chosen */
  default: string;
  hint?: string;
};

export type ToggleField = { key: string; label: string; type: "toggle"; default: boolean; hint?: string };

/** A repeatable group, e.g. the steps in "How field service works". */
export type ListField = {
  key: string;
  label: string;
  type: "list";
  /** Name for one entry, e.g. "Step" */
  itemLabel: string;
  fields: (TextField | LinkField | ImageField)[];
  default: Record<string, string>[];
  min?: number;
  max?: number;
  hint?: string;
};

export type ContentField = TextField | LinkField | ImageField | ToggleField | ListField;

export type ContentSection = { label: string; hint?: string; fields: ContentField[] };

export type PageDef = {
  key: string;
  label: string;
  /** Where the page lives on the site; null for site-wide parts (header, footer, forms) */
  path: string | null;
  group: "Main pages" | "Products and services" | "Customer forms" | "Site-wide" | "Legal";
  description: string;
  icon: string;
  sections: ContentSection[];
};

export type ContentValue = string | boolean | Record<string, string>[];
export type ContentValues = Record<string, ContentValue>;
