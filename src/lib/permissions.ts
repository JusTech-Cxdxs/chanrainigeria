// Dashboard sections a role can be given. The sidebar shows only the sections a person's role
// includes, so "not in my sidebar" always means "not allowed". Safe to import in client components.

export const PERMISSIONS = [
  // Desk
  { key: "enquiries", label: "Enquiries", group: "Desk", help: "Read, assign, reply to and close enquiries and service requests." },
  { key: "chats", label: "Enyo chats", group: "Desk", help: "Read the website assistant's conversations." },
  { key: "testimonials", label: "Testimonials", group: "Desk", help: "Approve, edit, add and remove customer testimonials." },
  { key: "visitors", label: "Visitors", group: "Desk", help: "See website traffic figures." },
  // Website
  { key: "pages", label: "Pages and text", group: "Website", help: "Edit the words and pictures on every page, the home slider and the menus." },
  { key: "products", label: "Products", group: "Website", help: "Product lines, machine types, models, specifications and brochures." },
  { key: "brands", label: "Brands", group: "Website", help: "Manufacturer logos shown on the site and in emails." },
  { key: "services", label: "Services", group: "Website", help: "The services list." },
  { key: "news", label: "Blog", group: "Website", help: "Blog posts and their categories." },
  { key: "locations", label: "Locations", group: "Website", help: "Offices, branches and depots." },
  { key: "media", label: "Media library", group: "Website", help: "Upload, organise, replace and remove images and files." },
  // Administration
  { key: "settings", label: "Company settings", group: "Administration", help: "Company details, contacts, desks, colours, languages, Enyo and privacy." },
  { key: "email", label: "Email and notifications", group: "Administration", help: "Mail server, sender, and who receives which emails." },
  { key: "team", label: "Team and roles", group: "Administration", help: "Add staff, set their roles, create and change roles. This is full control of the dashboard, so give it only to administrators." },
  { key: "audit", label: "Activity log", group: "Administration", help: "Who did what, and when." },
  { key: "history", label: "History and undo", group: "Administration", help: "See earlier versions of anything and restore them." },
  // Tools
  { key: "assistant", label: "Dashboard assistant", group: "Tools", help: "The AI helper inside the dashboard." },
] as const;

export type Permission = (typeof PERMISSIONS)[number]["key"];
export const ALL_PERMISSIONS = PERMISSIONS.map((p) => p.key) as Permission[];
export const PERMISSION_GROUPS = ["Desk", "Website", "Administration", "Tools"] as const;

export function isPermission(v: string): v is Permission {
  return (ALL_PERMISSIONS as string[]).includes(v);
}

/** Roles created on first run. Staff can edit them and add their own. */
export const SYSTEM_ROLES: { name: string; description: string; permissions: Permission[]; legacy: string }[] = [
  { name: "Administrator", description: "Everything, including team, roles and settings.", permissions: ALL_PERMISSIONS, legacy: "ADMIN" },
  {
    name: "Manager",
    description: "Runs the desk and the website day to day. Cannot change the team, roles or mail settings.",
    permissions: ["enquiries", "chats", "testimonials", "visitors", "pages", "products", "brands", "services", "news", "locations", "media", "audit", "history", "assistant"],
    legacy: "",
  },
  {
    name: "Content editor",
    description: "Keeps the website up to date: pages, products, blog posts, pictures and testimonials.",
    permissions: ["testimonials", "pages", "products", "brands", "services", "news", "locations", "media", "assistant"],
    legacy: "EDITOR",
  },
  {
    name: "Service coordinator",
    description: "Handles enquiries, service requests and Enyo chats.",
    permissions: ["enquiries", "chats", "testimonials", "assistant"],
    legacy: "COORDINATOR",
  },
];
