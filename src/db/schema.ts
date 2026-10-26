// Chanrai Nigeria website — data model (Drizzle ORM, PostgreSQL).
// Everything the public site shows comes from these tables; nothing about the company is hard-coded.
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSequence,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());
const json = <T>(name: string, fallback: string) =>
  jsonb(name).$type<T>().notNull().default(sql.raw(`'${fallback}'::jsonb`));

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

// ---------- Shared JSON shapes ----------
export type SpecField = { key: string; label: string; unit?: string };
export type Component = { name: string; role: string };
export type Faq = { q: string; a: string };
export type Maintenance = {
  dailyChecks?: string[];
  intervals?: { hours: number; tasks: string[] }[];
  note?: string;
};

// ---------- Settings ----------
/** Single row (id = 1). Shape validated by src/lib/settings.ts */
export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  data: jsonb("data").notNull(),
  updatedAt: updatedAt(),
});

export const branches = pgTable("branches", {
  id: id(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  phone: text("phone"),
  email: text("email"),
  mapUrl: text("map_url"),
  hours: text("hours"),
  isHeadOffice: boolean("is_head_office").notNull().default(false),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

// ---------- Catalogue ----------
export const brands = pgTable("brands", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  website: text("website"),
  about: text("about").notNull().default(""),
  highlights: json<string[]>("highlights", "[]"),
  logoId: text("logo_id"),
  showOnHome: boolean("show_on_home").notNull().default(true),
  /** Shown in the "Authorised dealer for" strip at the foot of every email. */
  showInEmail: boolean("show_in_email").notNull().default(true),
  /** e.g. "Authorised dealer", "Distributor". Shown under the logo where space allows. */
  relationship: text("relationship").notNull().default(""),
  order: integer("order").notNull().default(0),
});

export const categories = pgTable("categories", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull().default(""),
  intro: text("intro").notNull().default(""),
  salesBlurb: text("sales_blurb").notNull().default(""),
  serviceBlurb: text("service_blurb").notNull().default(""),
  partsBlurb: text("parts_blurb").notNull().default(""),
  /** Which enquiry desk receives this category's enquiries (settings.desks key) */
  desk: text("desk").notNull().default("sales"),
  /** Line drawing used until a photo is uploaded: excavator | forklift | compressor */
  illustration: text("illustration").notNull().default("excavator"),
  imageId: text("image_id"),
  order: integer("order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  brandId: text("brand_id").references(() => brands.id, { onDelete: "set null" }),
  /** Other brands supplied in this line, shown after the main brand (brand ids, in order). */
  moreBrandIds: json<string[]>("more_brand_ids", "[]"),
});

export const families = pgTable("families", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  summary: text("summary").notNull().default(""),
  howItWorks: text("how_it_works").notNull().default(""),
  keyComponents: json<Component[]>("key_components", "[]"),
  applications: json<string[]>("applications", "[]"),
  choosingTips: json<string[]>("choosing_tips", "[]"),
  maintenance: json<Maintenance>("maintenance", "{}"),
  safety: json<string[]>("safety", "[]"),
  specFields: json<SpecField[]>("spec_fields", "[]"),
  faq: json<Faq[]>("faq", "[]"),
  illustration: text("illustration"),
  imageId: text("image_id"),
  order: integer("order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
});

export const products = pgTable("products", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  summary: text("summary").notNull().default(""),
  highlights: json<string[]>("highlights", "[]"),
  specs: json<Record<string, string | number>>("specs", "{}"),
  /** Staff tick this once every figure has been checked against the official spec sheet */
  specsVerified: boolean("specs_verified").notNull().default(false),
  sources: json<string[]>("sources", "[]"),
  imageIds: json<string[]>("image_ids", "[]"),
  brochureId: text("brochure_id"),
  order: integer("order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  brandId: text("brand_id").references(() => brands.id, { onDelete: "set null" }),
  updatedAt: updatedAt(),
});

export const services = pgTable("services", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  summary: text("summary").notNull().default(""),
  includes: json<string[]>("includes", "[]"),
  order: integer("order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
});

// ---------- Content ----------
export const posts = pgTable("posts", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  /** News, Projects, Events, Announcements... free text so staff can add their own. */
  category: text("category").notNull().default("News"),
  excerpt: text("excerpt").notNull().default(""),
  body: text("body").notNull().default(""),
  coverId: text("cover_id"),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** Uploaded files are stored in the database so one backup holds everything and any host works. */
export const media = pgTable("media", {
  id: id(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  alt: text("alt").notNull().default(""),
  /** Customer uploads (fault photos, data plates) are only served to signed-in staff. */
  isPrivate: boolean("is_private").notNull().default(false),
  data: bytea("data").notNull(),
  /** Library folder, e.g. "Home slider", "Products", "Logos". Empty = Unsorted. */
  folder: text("folder").notNull().default(""),
  width: integer("width"),
  height: integer("height"),
  uploadedById: text("uploaded_by_id"),
  /** Soft delete: kept for 30 days so it can be restored from History. */
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ---------- Page content (every editable word and picture on the public pages) ----------
/** One row per page key from src/lib/content.ts; data holds only the fields staff have changed. */
export const pageContent = pgTable("page_content", {
  page: text("page").primaryKey(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
  updatedById: text("updated_by_id"),
  updatedAt: updatedAt(),
});

// ---------- History (undo) ----------
/**
 * A copy of a record as it was just before each change or delete, so any edit can be reverted.
 * entity is a key from src/lib/history.ts; data is the full row (or settings / page JSON).
 */
export const revisions = pgTable(
  "revisions",
  {
    id: id(),
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull(),
    label: text("label").notNull(),
    action: text("action").notNull(),
    data: jsonb("data").notNull(),
    actorId: text("actor_id"),
    createdAt: createdAt(),
  },
  (t) => [index("revisions_entity").on(t.entity, t.entityId, t.createdAt), index("revisions_created").on(t.createdAt)],
);

// ---------- Enquiries (the form and Enyo share this) ----------
/** Running number behind enquiry references (CN-2026-000123). */
export const enquiryRefSeq = pgSequence("enquiry_ref_seq", { startWith: 1 });

export const enquiryType = pgEnum("enquiry_type", [
  "GENERAL",
  "QUOTE",
  "SERVICE_BOOKING",
  "PARTS",
  "CALLBACK",
]);
export const enquirySource = pgEnum("enquiry_source", ["FORM", "ENYO"]);
export const enquiryStatus = pgEnum("enquiry_status", ["NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"]);

export type EnquiryDetails = {
  machine?: string;
  serialNumber?: string;
  hourMeter?: string;
  siteLocation?: string;
  siteState?: string;
  urgency?: "machine_down" | "soon" | "planned";
  preferredDate?: string;
  partNumbers?: string;
  quantity?: string;
  [k: string]: unknown;
};

export const enquiries = pgTable(
  "enquiries",
  {
    id: id(),
    ref: text("ref").notNull().unique(),
    type: enquiryType("type").notNull(),
    source: enquirySource("source").notNull(),
    status: enquiryStatus("status").notNull().default("NEW"),
    desk: text("desk").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    company: text("company"),
    message: text("message").notNull(),
    details: json<EnquiryDetails>("details", "{}"),
    attachmentIds: json<string[]>("attachment_ids", "[]"),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    chatId: text("chat_id").unique(),
    assigneeId: text("assignee_id").references(() => adminUsers.id, { onDelete: "set null" }),
    customerMailSent: boolean("customer_mail_sent").notNull().default(false),
    teamMailSent: boolean("team_mail_sent").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("enquiries_status_created").on(t.status, t.createdAt)],
);

export const enquiryNotes = pgTable("enquiry_notes", {
  id: id(),
  body: text("body").notNull(),
  enquiryId: text("enquiry_id")
    .notNull()
    .references(() => enquiries.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => adminUsers.id),
  createdAt: createdAt(),
});

// ---------- Enyo ----------
export const chatSessions = pgTable("chat_sessions", {
  id: id(),
  visitorId: text("visitor_id"),
  page: text("page"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: id(),
    role: text("role").notNull(),
    content: text("content").notNull(),
    sessionId: text("session_id")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [index("chat_messages_session").on(t.sessionId, t.createdAt)],
);

// ---------- Visitors (recorded only after analytics consent) ----------
export const pageViews = pgTable(
  "page_views",
  {
    id: id(),
    path: text("path").notNull(),
    referrer: text("referrer"),
    source: text("source"),
    device: text("device"),
    /** Random id kept in a first-party cookie; no IP address is stored */
    visitorId: text("visitor_id").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("page_views_created").on(t.createdAt), index("page_views_path").on(t.path)],
);

export const consentRecords = pgTable("consent_records", {
  id: id(),
  visitorId: text("visitor_id").notNull(),
  analytics: boolean("analytics").notNull(),
  createdAt: createdAt(),
});

// ---------- Testimonials (visitors submit, staff approve) ----------
export const testimonialStatus = pgEnum("testimonial_status", ["PENDING", "APPROVED", "REJECTED"]);

export const testimonials = pgTable(
  "testimonials",
  {
    id: id(),
    name: text("name").notNull(),
    role: text("role"),
    company: text("company"),
    email: text("email"),
    rating: integer("rating").notNull().default(5),
    quote: text("quote").notNull(),
    status: testimonialStatus("status").notNull().default("PENDING"),
    /** Placeholder content shipped with the preview; shown with an "Example" label. */
    isExample: boolean("is_example").notNull().default(false),
    source: text("source").notNull().default("website"),
    order: integer("order").notNull().default(0),
    reviewedById: text("reviewed_by_id"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("testimonials_status").on(t.status, t.createdAt)],
);

// ---------- Dashboard notifications ----------
/** Items a person has opened or dismissed in the bell (key like "enq:<id>"). Older than 30 days are pruned. */
export const notificationReads = pgTable(
  "notification_reads",
  {
    userId: text("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.key] })],
);

// ---------- Rate limiting (shared by every server instance) ----------
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Staff ----------
/** MASTER is the platform owner (JusTech support). It is never shown to the organisation's staff. */
export const role = pgEnum("role", ["MASTER", "ADMIN", "EDITOR", "COORDINATOR"]);

/**
 * Roles the organisation defines. Each lists the dashboard sections it can open; the sidebar shows
 * only those. System roles can be edited but not deleted. The platform (MASTER) account sits above all.
 */
export const roles = pgTable("roles", {
  id: id(),
  name: text("name").notNull().unique(),
  description: text("description").notNull().default(""),
  permissions: json<string[]>("permissions", "[]"),
  isSystem: boolean("is_system").notNull().default(false),
  order: integer("order").notNull().default(0),
  createdAt: createdAt(),
});

export const adminUsers = pgTable("admin_users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  /** MASTER marks the platform account. Everyone else's access comes from roleId. */
  role: role("role").notNull().default("EDITOR"),
  roleId: text("role_id").references(() => roles.id, { onDelete: "set null" }),
  jobTitle: text("job_title").notNull().default(""),
  /** Receives new-enquiry and reminder emails for the desks they cover (empty = all desks). */
  notify: boolean("notify").notNull().default(false),
  notifyDesks: json<string[]>("notify_desks", "[]"),
  /** Dashboard bell: sounds off, and everything before this time counts as read. */
  notificationsMuted: boolean("notifications_muted").notNull().default(false),
  notificationsReadAt: timestamp("notifications_read_at", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  /** Bumped on password change or deactivation so every existing session stops working. */
  sessionVersion: integer("session_version").notNull().default(1),
  failedLogins: integer("failed_logins").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: createdAt(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    summary: text("summary").notNull(),
    actorId: text("actor_id").references(() => adminUsers.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("audit_logs_created").on(t.createdAt)],
);

// ---------- Relations ----------
export const categoriesRelations = relations(categories, ({ many, one }) => ({
  families: many(families),
  services: many(services),
  brand: one(brands, { fields: [categories.brandId], references: [brands.id] }),
}));
export const familiesRelations = relations(families, ({ many, one }) => ({
  products: many(products),
  category: one(categories, { fields: [families.categoryId], references: [categories.id] }),
}));
export const productsRelations = relations(products, ({ one }) => ({
  family: one(families, { fields: [products.familyId], references: [families.id] }),
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
}));
export const servicesRelations = relations(services, ({ one }) => ({
  category: one(categories, { fields: [services.categoryId], references: [categories.id] }),
}));
export const enquiriesRelations = relations(enquiries, ({ one, many }) => ({
  product: one(products, { fields: [enquiries.productId], references: [products.id] }),
  assignee: one(adminUsers, { fields: [enquiries.assigneeId], references: [adminUsers.id] }),
  notes: many(enquiryNotes),
}));
export const enquiryNotesRelations = relations(enquiryNotes, ({ one }) => ({
  enquiry: one(enquiries, { fields: [enquiryNotes.enquiryId], references: [enquiries.id] }),
  author: one(adminUsers, { fields: [enquiryNotes.authorId], references: [adminUsers.id] }),
}));
export const chatSessionsRelations = relations(chatSessions, ({ many }) => ({
  messages: many(chatMessages),
}));
export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, { fields: [chatMessages.sessionId], references: [chatSessions.id] }),
}));
export const adminUsersRelations = relations(adminUsers, ({ one }) => ({
  roleRef: one(roles, { fields: [adminUsers.roleId], references: [roles.id] }),
}));
export const revisionsRelations = relations(revisions, ({ one }) => ({
  actor: one(adminUsers, { fields: [revisions.actorId], references: [adminUsers.id] }),
}));
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(adminUsers, { fields: [auditLogs.actorId], references: [adminUsers.id] }),
}));
