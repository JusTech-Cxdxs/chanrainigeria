// Every picture the site uses by name. Each slot has a default file in /public/images.
// Replace a picture either by uploading in Dashboard → Site images, or by putting a file with the
// same name in /public/images and redeploying.
export type ImageSlot = { key: string; file: string; label: string; size: string; usedOn: string };

export const IMAGE_SLOTS: ImageSlot[] = [
  { key: "hero-1", file: "hero-1.jpg", label: "Home slide 1", size: "2400 × 1350", usedOn: "Home page slider" },
  { key: "hero-2", file: "hero-2.jpg", label: "Home slide 2", size: "2400 × 1350", usedOn: "Home page slider" },
  { key: "hero-3", file: "hero-3.jpg", label: "Home slide 3", size: "2400 × 1350", usedOn: "Home page slider" },
  { key: "page-products", file: "page-products.jpg", label: "Products banner", size: "2400 × 900", usedOn: "Products pages" },
  { key: "page-services", file: "page-services.jpg", label: "Services banner", size: "2400 × 900", usedOn: "Services page" },
  { key: "page-book-service", file: "page-book-service.jpg", label: "Book a technician banner", size: "2400 × 900", usedOn: "Book a technician page" },
  { key: "page-parts", file: "page-parts.jpg", label: "Parts banner", size: "2400 × 900", usedOn: "Parts page" },
  { key: "page-contact", file: "page-contact.jpg", label: "Contact banner", size: "2400 × 900", usedOn: "Contact page" },
  { key: "page-about", file: "page-about.jpg", label: "About banner", size: "2400 × 900", usedOn: "About page" },
  { key: "page-news", file: "page-news.jpg", label: "News banner", size: "2400 × 900", usedOn: "News pages" },
  { key: "about-1", file: "about-1.jpg", label: "About: CNG photo", size: "2400 × 1400", usedOn: "About page, beside our story (large photo)" },
  { key: "about-2", file: "about-2.jpg", label: "About: construction photo", size: "1600 × 1200", usedOn: "About page, beside our story (small photo)" },
  { key: "about-3", file: "about-3.jpg", label: "About: forklift photo", size: "1600 × 1200", usedOn: "About page, beside our story (small photo)" },
  { key: "category-cng-gas-equipment", file: "category-cng-gas-equipment.jpg", label: "CNG refueling, compression, storage and dispensing equipment", size: "1600 × 1000", usedOn: "Line page banner and home cards" },
  { key: "category-construction-equipment", file: "category-construction-equipment.jpg", label: "Construction equipment", size: "1600 × 1000", usedOn: "Line page banner and home cards" },
  { key: "category-forklifts-material-handling", file: "category-forklifts-material-handling.jpg", label: "Forklifts", size: "1600 × 1000", usedOn: "Line page banner and home cards" },
  { key: "og-image", file: "og-image.jpg", label: "Link preview", size: "1200 × 630", usedOn: "When the site is shared on WhatsApp, LinkedIn and others" },
];
