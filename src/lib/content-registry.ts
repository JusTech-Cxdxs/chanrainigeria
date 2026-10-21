// Every editable word and picture on the public site, page by page. The dashboard's "Pages and text"
// section is generated from this list, so adding a field here makes it editable with no other work.
// Defaults are the wording the site ships with; staff changes are stored in the page_content table.
import type { PageDef } from "./content-types";

const home: PageDef = {
  key: "home",
  label: "Home page",
  path: "/",
  group: "Main pages",
  icon: "home",
  description: "The first page visitors see. The photo slider at the top has its own section: Home slider.",
  sections: [
    {
      label: "Under the slider",
      fields: [
        { key: "sliderSecondaryLabel", label: "Second button on every slide", type: "text", default: "Book a technician" },
        { key: "sliderSecondaryLink", label: "Second button goes to", type: "link", default: "/book-service" },
        {
          key: "quickActions",
          label: "Quick action cards",
          type: "list",
          itemLabel: "Card",
          min: 1,
          max: 4,
          hint: "The white bar that overlaps the bottom of the slider.",
          fields: [
            { key: "title", label: "Title", type: "text", default: "" },
            { key: "text", label: "Short line", type: "text", default: "" },
            { key: "href", label: "Goes to", type: "link", default: "/" },
          ],
          default: [
            { title: "Book a technician", text: "On-site service for a machine, station or fleet", href: "/book-service" },
            { title: "Ask for a quote", text: "Tell us the job and we'll recommend a machine", href: "/contact?type=QUOTE" },
            { title: "Order parts", text: "Genuine parts by serial or part number", href: "/parts" },
          ],
        },
      ],
    },
    {
      label: "Product lines",
      fields: [
        { key: "linesTitle", label: "Heading", type: "text", default: "Three lines, one team" },
        { key: "linesText", label: "Intro", type: "textarea", default: "", hint: "Leave empty to use the company tagline from Company settings." },
        { key: "linesButton", label: "Button", type: "text", default: "All products" },
        { key: "linesCardLink", label: "Link text on each card", type: "text", default: "Explore the range" },
      ],
    },
    {
      label: "Sales, service and parts table",
      fields: [
        { key: "matrixTitle", label: "Heading", type: "text", default: "One team for the whole life of the machine" },
        {
          key: "matrixText",
          label: "Intro",
          type: "textarea",
          default: "Each line comes with the same three things: the right machine, a technician who comes to it, and the parts to keep it running.",
        },
        { key: "matrixSales", label: "Column 1 heading", type: "text", default: "Sales" },
        { key: "matrixService", label: "Column 2 heading", type: "text", default: "On-site service" },
        { key: "matrixParts", label: "Column 3 heading", type: "text", default: "Parts" },
        { key: "matrixSalesCta", label: "Column 1 link", type: "text", default: "Ask for a quote" },
        { key: "matrixServiceCta", label: "Column 2 link", type: "text", default: "Book a visit" },
        { key: "matrixPartsCta", label: "Column 3 link", type: "text", default: "Ask for parts" },
      ],
    },
    {
      label: "Field service band",
      hint: "The dark green section.",
      fields: [
        { key: "fieldTitle", label: "Heading", type: "text", default: "We come to the machine" },
        {
          key: "fieldText",
          label: "Text",
          type: "textarea",
          default:
            "Excavators don't drive to workshops and compressors don't leave the station. Book a visit and a technician comes to your site with the tools and parts the job needs.",
        },
        { key: "fieldButton", label: "Button", type: "text", default: "Book a technician" },
        { key: "fieldCallPrefix", label: "Call button starts with", type: "text", default: "Call" },
        {
          key: "fieldSteps",
          label: "Steps",
          type: "list",
          itemLabel: "Step",
          min: 2,
          max: 6,
          fields: [
            { key: "title", label: "Title", type: "text", default: "" },
            { key: "text", label: "Text", type: "textarea", default: "" },
          ],
          default: [
            { title: "Tell us about the machine", text: "Model, serial number, hour meter reading, what's wrong and where it is." },
            { title: "We confirm the visit", text: "The service desk calls back to agree a time and what to bring." },
            { title: "A technician comes to site", text: "Diagnosis and repair at the machine, with genuine parts." },
            { title: "You get a service record", text: "What was found, what was done and when the next service is due." },
          ],
        },
      ],
    },
    {
      label: "Brands strip",
      hint: "Logos are managed under Brands.",
      fields: [{ key: "brandsTitle", label: "Heading", type: "text", default: "Equipment we supply" }],
    },
    {
      label: "Testimonials",
      fields: [
        { key: "showTestimonials", label: "Show testimonials on the home page", type: "toggle", default: true },
        { key: "testimonialsTitle", label: "Heading", type: "text", default: "What customers say" },
        { key: "testimonialsText", label: "Line under the heading", type: "text", default: "Checked by our team before they appear here." },
        { key: "testimonialsButton", label: "Button", type: "text", default: "Share your experience" },
      ],
    },
    {
      label: "News",
      fields: [
        { key: "newsTitle", label: "Heading", type: "text", default: "News" },
        { key: "newsLink", label: "Link", type: "text", default: "All news" },
      ],
    },
    {
      label: "Closing call to action",
      fields: [
        { key: "ctaTitle", label: "Heading", type: "text", default: "Tell us about the job" },
        {
          key: "ctaText",
          label: "Text",
          type: "textarea",
          default: "A machine to buy, a station to build, a fleet to keep running. Send the details and the right desk gets straight back to you.",
        },
        { key: "ctaButton", label: "Button", type: "text", default: "Contact us" },
        { key: "ctaButtonLink", label: "Button goes to", type: "link", default: "/contact" },
      ],
    },
  ],
};

/**
 * All editable pages. Keep each page's fields in the order they appear on screen, and give every
 * field a label a non-technical person understands.
 */
export const PAGES: PageDef[] = [home];

export const pageDef = (key: string) => PAGES.find((p) => p.key === key);
