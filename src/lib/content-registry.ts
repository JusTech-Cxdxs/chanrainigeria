// Every editable word and picture on the public site, page by page. The dashboard's "Pages and text"
// section is generated from this list, so adding a field here makes it editable with no other work.
// Defaults are the wording the site ships with; staff changes are stored in the page_content table.
import type { ContentSection, ImageField, LinkField, PageDef, TextField, ToggleField } from "./content-types";

const home: PageDef = {
  key: "home",
  label: "Home page",
  path: "/",
  group: "Main pages",
  icon: "home",
  description: "The first page visitors see. The photo slider and every picture are changed under Images.",
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
            "Compressors don't leave the station and excavators don't drive to workshops. Book a visit and a technician comes to your site with the tools and parts the job needs.",
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
      fields: [{ key: "brandsTitle", label: "Heading", type: "text", default: "Trusted by Leading Brands" }],
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

// ---------- Small builders so each field reads as one line ----------
// Words in {curly brackets} are filled in by the site. Every page understands {company} (short company
// name), {companyFull} (legal name), {group} (group name) and {enyo} (the assistant's name), all taken
// from Company settings. Some fields add their own, listed in the field's hint.

const PLACEHOLDER_HINT = "You can write {company} for the company name.";

const text = (key: string, label: string, def: string, hint?: string): TextField => ({ key, label, type: "text", default: def, ...(hint ? { hint } : {}) });
const area = (key: string, label: string, def: string, hint?: string): TextField => ({ key, label, type: "textarea", default: def, ...(hint ? { hint } : {}) });
const md = (key: string, label: string, def: string, hint?: string): TextField => ({ key, label, type: "markdown", default: def, ...(hint ? { hint } : {}) });
const link = (key: string, label: string, def: string, hint?: string): LinkField => ({ key, label, type: "link", default: def, ...(hint ? { hint } : {}) });
const image = (key: string, label: string, slot: string, hint?: string): ImageField => ({ key, label, type: "image", default: slot, ...(hint ? { hint } : {}) });
const toggle = (key: string, label: string, def: boolean, hint?: string): ToggleField => ({ key, label, type: "toggle", default: def, ...(hint ? { hint } : {}) });

/** The photo banner every inner page opens with. */
function banner(o: { slot: string; crumb: string; title: string; lead: string; titleHint?: string; leadHint?: string }): ContentSection {
  return {
    label: "Banner at the top",
    hint: "The photo sits under the same dark green shade on every page, so the words stay easy to read.",
    fields: [
      image("image", "Banner picture", o.slot, "A wide landscape photo works best (2400 × 900)."),
      text("crumb", "Name in the trail above the heading", o.crumb, "The small Home / Page links over the heading."),
      text("title", "Heading", o.title, o.titleHint),
      area("lead", "Line under the heading", o.lead, o.leadHint),
    ],
  };
}

/** Browser tab title and the description Google and WhatsApp previews show. */
function seo(title: string, description: string): ContentSection {
  return {
    label: "Search engines and browser tab",
    hint: "Not shown on the page itself.",
    fields: [
      text("metaTitle", "Title in the browser tab", title, "The company name is added after it automatically."),
      area("metaDescription", "Description for Google and link previews", description, "About 150 characters. Leave empty to use the site description from Company settings."),
    ],
  };
}

// ---------- Site-wide ----------

const header: PageDef = {
  key: "header",
  label: "Header and menu",
  path: null,
  group: "Site-wide",
  icon: "menu",
  description: "The bar across the top of every page, the mobile menu and the search box.",
  sections: [
    {
      label: "Menu links",
      hint: "Product lines appear under Products automatically from the catalogue.",
      fields: [
        text("productsLabel", "Products menu", "Products"),
        text("productsAll", "Link at the bottom of the products menu", "See all products"),
        {
          key: "links",
          label: "Other menu links",
          type: "list",
          itemLabel: "Link",
          min: 1,
          max: 7,
          fields: [text("label", "Label", ""), link("href", "Goes to", "/")],
          default: [
            { label: "Services", href: "/services" },
            { label: "Parts", href: "/parts" },
            { label: "News", href: "/news" },
            { label: "About", href: "/about" },
            { label: "Contact", href: "/contact" },
          ],
        },
      ],
    },
    {
      label: "Buttons",
      fields: [
        text("bookLabel", "Button", "Book a technician"),
        link("bookLink", "Button goes to", "/book-service"),
        text("searchLabel", "Search button", "Search"),
        text("searchAria", "Search button, read aloud by screen readers", "Search the site"),
      ],
    },
    {
      label: "Mobile menu",
      fields: [
        text("menuOpen", "Menu button, read aloud by screen readers", "Open menu"),
        text("menuClose", "Close button, read aloud by screen readers", "Close menu"),
        text("themeAuto", "Theme button: automatic", "Theme: automatic"),
        text("themeLight", "Theme button: light", "Theme: light"),
        text("themeDark", "Theme button: dark", "Theme: dark"),
      ],
    },
    {
      label: "Search box",
      fields: [
        text("searchPlaceholder", "Text inside the empty search box", "Search machines, services, parts, contacts…"),
        text("searchTry", "Heading over the suggestions", "Try"),
        {
          key: "searchSuggestions",
          label: "Suggestions",
          type: "list",
          itemLabel: "Suggestion",
          min: 1,
          max: 8,
          fields: [text("text", "Words", "")],
          default: [{ text: "CNG compressor" }, { text: "Excavator" }, { text: "Forklift" }, { text: "Book a technician" }, { text: "Parts" }, { text: "Phone number" }],
        },
        text("searchEmpty", "When nothing matches", "Nothing matches “{q}”. Try a machine type, a model number or a service.", "{q} is what the visitor typed."),
        text("searchHelp", "Keyboard help at the bottom", "↑ ↓ to move, Enter to open, Esc to close"),
        text("searchClose", "Close button", "Esc"),
      ],
    },
    {
      label: "Other",
      fields: [
        text("skipLabel", "Skip link for keyboard users", "Skip to content"),
        text("crumbHome", "First link in the trail above page headings", "Home"),
        text("translateNote", "Note under the language list", "Translated by Google. Some terms may be imperfect."),
      ],
    },
  ],
};

const footer: PageDef = {
  key: "footer",
  label: "Footer",
  path: null,
  group: "Site-wide",
  icon: "layout",
  description: "The dark green band at the bottom of every page. Contacts, tagline and social links come from Company settings.",
  sections: [
    {
      label: "Columns",
      fields: [
        text("productsHeading", "Products column heading", "Products"),
        text("companyHeading", "Company column heading", "Company"),
        {
          key: "companyLinks",
          label: "Company column links",
          type: "list",
          itemLabel: "Link",
          min: 1,
          max: 10,
          fields: [text("label", "Label", ""), link("href", "Goes to", "/")],
          default: [
            { label: "Services", href: "/services" },
            { label: "Book a technician", href: "/book-service" },
            { label: "Parts", href: "/parts" },
            { label: "News", href: "/news" },
            { label: "Testimonials", href: "/testimonials" },
            { label: "About us", href: "/about" },
            { label: "Contact", href: "/contact" },
          ],
        },
        text("talkHeading", "Contact column heading", "Talk to us"),
        text("whatsappLabel", "WhatsApp link", "WhatsApp"),
        text("allLocations", "Link to all branches", "All locations"),
      ],
    },
    {
      label: "Brands strip",
      fields: [text("brandsLabel", "Line before the brand logos", "Equipment we supply")],
    },
    {
      label: "Bottom line",
      fields: [
        text("privacyLabel", "Privacy link", "Privacy notice"),
        text("cookiesLabel", "Cookie notice link", "Cookie notice"),
        text("cookieSettingsLabel", "Cookie settings button", "Cookie settings"),
      ],
    },
  ],
};

const cookieBanner: PageDef = {
  key: "cookie-banner",
  label: "Cookie banner",
  path: null,
  group: "Site-wide",
  icon: "shield",
  description: "The bar that asks first-time visitors about cookies, and the Cookie settings window.",
  sections: [
    {
      label: "Banner",
      fields: [
        area("text", "Text", "We use essential cookies to run this site. With your permission we also count page visits to improve it. No advertising cookies."),
        text("noticeLink", "Link to the cookie notice", "Cookie notice"),
        text("reject", "Reject button", "Reject optional"),
        text("accept", "Accept button", "Accept all"),
        text("customise", "Button that opens the choices", "Choose"),
      ],
    },
    {
      label: "Cookie settings window",
      hint: "Opens from Cookie settings in the footer and on the cookie notice page.",
      fields: [
        text("prefsTitle", "Heading", "Your cookie choices"),
        area("prefsIntro", "Text", "Choose which cookies we may use. You can change this at any time from Cookie settings at the bottom of every page."),
        text("essentialTitle", "Essential cookies: name", "Essential"),
        area("essentialText", "Essential cookies: what they do", "Needed for the site to work, such as remembering this choice and keeping your chat with our assistant."),
        text("alwaysOn", "Label for always-on cookies", "Always on"),
        text("statsTitle", "Statistics cookies: name", "Visit statistics"),
        area("statsText", "Statistics cookies: what they do", "Counts page visits with a random ID so we can improve the site. We do not store your IP address."),
        text("currentGranted", "Current choice: accepted", "Your current choice: statistics allowed."),
        text("currentDenied", "Current choice: rejected", "Your current choice: essential cookies only."),
        text("currentNone", "No choice yet", "You have not made a choice yet."),
        text("save", "Save button", "Save my choice"),
        text("close", "Close button", "Close"),
      ],
    },
  ],
};

const enyo: PageDef = {
  key: "enyo",
  label: "Website assistant",
  path: null,
  group: "Site-wide",
  icon: "bot",
  description: "The words around the chat window. The assistant's name and greeting are in Company settings under Enyo. Write {enyo} for its name.",
  sections: [
    {
      label: "Chat button",
      fields: [
        text("launcher", "Button", "Ask {enyo}"),
        text("launcherAria", "Button, read aloud by screen readers", "Ask {enyo}, our assistant"),
        area("nudge", "Bubble that pops up after a few seconds", "Hi, I'm {enyo}. Need a quote, a technician or parts? I can help."),
        text("dismiss", "Close the bubble, read aloud", "Dismiss"),
      ],
    },
    {
      label: "Window",
      fields: [
        text("status", "Line under the name", "AI assistant, replies straight away"),
        text("tabChat", "Chat tab", "Chat"),
        text("tabContact", "Contact tab", "Contact us"),
        text("callAria", "Call button, read aloud", "Call us"),
        text("closeChat", "Close button, read aloud", "Close chat"),
      ],
    },
    {
      label: "Before the chat starts",
      fields: [
        area(
          "consentText",
          "Notice",
          "{enyo} is an automated assistant. Conversations are saved so our team can follow up, as described in our {privacy}. Please don't share bank or ID details.",
          "{privacy} becomes the link below.",
        ),
        text("privacyLink", "Privacy link", "privacy notice"),
        text("startChat", "Start button", "Start chat"),
        text("talkPerson", "Second button", "Talk to a person instead"),
      ],
    },
    {
      label: "Chatting",
      fields: [
        {
          key: "suggestions",
          label: "Starter questions",
          type: "list",
          itemLabel: "Question",
          min: 0,
          max: 5,
          fields: [text("text", "Question", "")],
          default: [{ text: "What does a CNG station need?" }, { text: "How do I book a technician?" }, { text: "Which forklift for a warehouse?" }, { text: "Where are you located?" }],
        },
        text("leaveRequest", "Leave a request chip", "Leave a request"),
        text("talkPersonChip", "Talk to a person chip", "Talk to a person"),
        text("inputPlaceholder", "Text inside the message box", "Type your question"),
        text("inputLabel", "Message box, read aloud", "Message {enyo}"),
        text("send", "Send button, read aloud", "Send"),
        text("typing", "While it is thinking", "{enyo} is thinking…"),
        text("errorNetwork", "When the connection fails", "I couldn't reach the server. Check your connection and try again."),
      ],
    },
    {
      label: "Leave a request form",
      fields: [
        text("handoffIntro", "Heading", "Leave your details and our team will reply by email."),
        text("handoffName", "Name box", "Full name"),
        text("handoffEmail", "Email box", "Email"),
        text("handoffPhone", "Phone box", "Phone (optional)"),
        text("handoffMessage", "Message box", "What do you need?"),
        text("handoffConsent", "Small print", "By sending, you agree we can use these details to reply, as in our privacy notice."),
        text("handoffSend", "Send button", "Send request"),
        text("handoffCancel", "Cancel button", "Cancel"),
        text("handoffError", "When details are missing", "Please check your details."),
      ],
    },
    {
      label: "Contact tab",
      fields: [
        text("contactIntro", "Intro", "Prefer a person? Reach our team directly."),
        text("callTitle", "Phone card", "Call us"),
        text("whatsappTitle", "WhatsApp card", "WhatsApp"),
        text("emailTitle", "Email card", "Email"),
        text("visitTitle", "Address card", "Visit us"),
        text("bookButton", "Button", "Book a technician"),
        link("bookLink", "Button goes to", "/book-service"),
      ],
    },
  ],
};

const notFound: PageDef = {
  key: "not-found",
  label: "Page not found",
  path: null,
  group: "Site-wide",
  icon: "alert",
  description: "Shown when a link is broken or a page has been removed.",
  sections: [
    {
      label: "Page",
      fields: [
        text("eyebrow", "Small line above the heading", "Error 404"),
        text("title", "Heading", "We couldn't find that page"),
        area("text", "Text", "The link may be old, or the page has moved. Try the products list or get in touch."),
        text("primary", "First button", "See products"),
        link("primaryLink", "First button goes to", "/products"),
        text("secondary", "Second button", "Contact us"),
        link("secondaryLink", "Second button goes to", "/contact"),
        text("helpTitle", "Heading over the quick links", "Or go straight to"),
        {
          key: "quickLinks",
          label: "Quick links",
          type: "list",
          itemLabel: "Link",
          min: 0,
          max: 4,
          fields: [text("label", "Label", ""), link("href", "Goes to", "/")],
          default: [
            { label: "Book a technician", href: "/book-service" },
            { label: "Order parts", href: "/parts" },
            { label: "Home page", href: "/" },
          ],
        },
      ],
    },
  ],
};

// ---------- Customer forms ----------

const forms: PageDef = {
  key: "forms",
  label: "Forms",
  path: null,
  group: "Customer forms",
  icon: "inbox",
  description:
    "Every label, hint, button and message in the contact, booking, parts and testimonial forms. Write {company} for the company name.",
  sections: [
    {
      label: "Your details (all forms)",
      fields: [
        text("detailsLegend", "Heading", "Your details"),
        text("nameLabel", "Name", "Full name"),
        text("companyLabel", "Company", "Company (optional)"),
        text("emailLabel", "Email", "Email"),
        text("emailHelp", "Help under email", "We send your reference number here."),
        text("phoneLabel", "Phone (booking and parts)", "Phone"),
        text("phoneOptionalLabel", "Phone (contact form)", "Phone (optional)"),
        area("consentText", "Agreement tick box", "I agree that {company} may use these details to respond to this request, as described in the {privacy}.", "{privacy} becomes the link below."),
        text("consentLink", "Privacy link", "privacy notice"),
        text("submitting", "Button while sending", "Sending…"),
        text("spamLabel", "Hidden trap for robots", "Leave this empty", "Visitors never see this."),
      ],
    },
    {
      label: "Picking from a list",
      hint: "The searchable lists for product, equipment line and state.",
      fields: [
        text("searchPlaceholder", "Text while typing to filter", "Type to search"),
        text("noMatches", "When nothing matches", "Nothing matches. Try another word."),
        text("clearLabel", "Clear button, read aloud", "Clear choice"),
      ],
    },
    {
      label: "Contact form",
      fields: [
        text("typeLabel", "First question", "What do you need?"),
        text("typePlaceholder", "Before a choice is made", "Choose what you need"),
        text("typeQuote", "Choice 1", "A quote for equipment"),
        text("typeGeneral", "Choice 2", "General question"),
        text("typeCallback", "Choice 3", "Please call me back"),
        text("productLabel", "Product", "Product (optional)"),
        text("productPlaceholder", "Before a product is chosen", "Choose a product"),
        text("messageLabel", "Message", "Your message"),
        text("contactSubmit", "Send button", "Send message"),
      ],
    },
    {
      label: "Booking and parts forms: the machine",
      fields: [
        text("machineLegend", "Heading", "The machine"),
        text("lineLabel", "Equipment line", "Equipment line"),
        text("linePlaceholder", "Before a line is chosen", "Choose one"),
        text("modelLabel", "Make and model", "Make and model"),
        text("modelPlaceholder", "Example inside the box", "e.g. LiuGong 856H"),
        text("serialLabel", "Serial number", "Serial number"),
        text("serialHelp", "Help under serial number", "On the data plate, usually near the operator's seat or on the frame."),
        text("photosLabel", "Photos", "Photos (optional)"),
        text("photosHelp", "Help under photos", "Up to 4 files: the fault, the data plate or the part. JPG, PNG, WebP or PDF."),
      ],
    },
    {
      label: "Booking form",
      fields: [
        text("hoursLabel", "Hour meter", "Hour meter reading"),
        text("hoursPlaceholder", "Example inside the box", "e.g. 4,250"),
        text("whereLegend", "Heading", "Where and when"),
        text("siteLabel", "Site location", "Site location"),
        text("sitePlaceholder", "Example inside the box", "Site name, address or nearest landmark"),
        text("siteHelp", "Help under site location", "A Google Maps link helps the technician find you."),
        text("stateLabel", "State", "State"),
        text("statePlaceholder", "Before a state is chosen", "Choose a state"),
        text("dateLabel", "Preferred date", "Preferred date"),
        text("urgencyLabel", "Urgency question", "How urgent is it?"),
        text("urgentDownTitle", "Urgency 1", "Machine is down"),
        text("urgentDownText", "Urgency 1, small line", "It can't work until it's fixed"),
        text("urgentSoonTitle", "Urgency 2", "This week"),
        text("urgentSoonText", "Urgency 2, small line", "Working, but needs attention"),
        text("urgentPlannedTitle", "Urgency 3", "Planned service"),
        text("urgentPlannedText", "Urgency 3, small line", "Routine maintenance"),
        text("faultLabel", "Fault description", "What's wrong?"),
        text("faultPlaceholder", "Example inside the box", "Symptoms, warning lights or error codes, when it started"),
        text("serviceSubmit", "Send button", "Book the visit"),
      ],
    },
    {
      label: "Parts form",
      fields: [
        text("quantityLabel", "Quantity", "Quantity"),
        text("partsLabel", "Parts", "Part numbers or descriptions"),
        text("partsPlaceholder", "Example inside the box", "One per line. If you don't have part numbers, describe the part."),
        text("partsMessageLabel", "Message", "Anything else we should know?"),
        text("partsSubmit", "Send button", "Send parts request"),
      ],
    },
    {
      label: "After sending",
      fields: [
        text("sentTitle", "Heading", "Thank you. We have your request."),
        text("sentRef", "Reference line", "Your reference is {ref}.", "{ref} is the reference number."),
        area("sentDesk", "Next line", "It has gone to our {desk} desk and a copy is on its way to your email.", "{desk} is the desk that handles it, for example field service."),
        text("sentUrgent", "Urgent line", "If it's urgent, call {phone}.", "{phone} is the desk's phone number."),
        text("sentButton", "Button", "Back to home"),
        link("sentButtonLink", "Button goes to", "/"),
      ],
    },
    {
      label: "Error messages",
      hint: "Shown next to a field when something is missing or wrong.",
      fields: [
        text("errorGeneric", "At the top of the form", "Please check the highlighted fields. If you attached photos, add them again."),
        text("nameError", "Name missing", "Enter your name"),
        text("emailError", "Email not valid", "Enter a valid email address"),
        text("phoneError", "Phone not valid", "Enter a valid phone number"),
        text("phoneRequiredError", "Phone missing (booking and parts)", "Enter a phone number so we can reach you"),
        text("messageError", "Message missing", "Tell us a little about what you need"),
        text("consentError", "Agreement not ticked", "Please agree so we can use your details to reply"),
        text("typeError", "Contact form: nothing chosen", "Choose what you need"),
        text("lineError", "Equipment line not chosen", "Choose the equipment line"),
        text("siteError", "Site location missing", "Tell us where the machine is"),
        text("urgencyError", "Urgency not chosen", "Choose how urgent it is"),
        text("errorTooMany", "Too many requests", "Too many requests from this connection. Please wait a few minutes and try again."),
        text("errorLinks", "Links in the message", "Please remove web links and code from your message, then send it again."),
        text("errorLinksField", "Links in the message, next to the field", "Please remove links from your message."),
        text("errorPhotosSize", "Photos too large", "The photos add up to more than 12 MB. Please send fewer or smaller photos."),
        text("errorPhotosField", "Photos too large, next to the field", "Too large in total."),
        text("errorPhotosDaily", "Too many photos today", "You've sent a lot of photos today. Please send this request without photos, or call us."),
      ],
    },
    {
      label: "Testimonial form",
      fields: [
        text("ratingLegend", "Rating", "Your rating"),
        text("starOne", "One star, read aloud", "1 star"),
        text("starMany", "Several stars, read aloud", "{n} stars", "{n} is the number of stars."),
        text("quoteLabel", "Experience", "Your experience"),
        text("quotePlaceholder", "Example inside the box", "What did we supply or fix, and how did it go?"),
        text("tEmailHelp", "Help under email", "Never shown on the site."),
        text("roleLabel", "Job title", "Job title (optional)"),
        area("tConsent", "Agreement tick box", "{company} may publish my words, name, job title and company on its website. I can ask for them to be removed at any time."),
        text("tSubmit", "Send button", "Send for review"),
        text("tSentTitle", "Heading after sending", "Thank you for sharing."),
        area("tSentText", "Text after sending", "Our team reads every message before it goes on the site. Yours will appear once it has been approved."),
        text("tErrorGeneric", "At the top of the form", "Please check the highlighted fields."),
        text("ratingError", "Rating not chosen", "Choose a star rating"),
        text("quoteError", "Experience too short", "Write at least a sentence or two"),
        text("quoteLongError", "Experience too long", "Keep it under 800 characters"),
        text("tEmailError", "Email not valid", "Enter a valid email so we can confirm it's you"),
        text("tConsentError", "Agreement not ticked", "Tick the box so we may publish your name with your words"),
        text("tTooMany", "Too many sent", "You've already sent a few. Please try again later."),
        text("tLinks", "Links in the message", "Please remove links or code from your message."),
      ],
    },
  ],
};

// ---------- Main pages ----------

const about: PageDef = {
  key: "about",
  label: "About us",
  path: "/about",
  group: "Main pages",
  icon: "building",
  description: "Who the company is. " + PLACEHOLDER_HINT,
  sections: [
    banner({
      slot: "page-about",
      crumb: "About",
      title: "About {company}",
      lead: "",
      leadHint: "Leave empty to use the company tagline from Company settings.",
    }),
    {
      label: "Our story",
      fields: [
        md("body", "Story", "", "Leave empty to use the About text and heritage line from Company settings. Headings, lists and links are allowed."),
        text("groupLink", "Link to the group website", "Visit the {group} website", "{group} is the group name from Company settings. Hidden when no group website is set."),
      ],
    },
    {
      label: "Figures",
      fields: [
        toggle("showStats", "Show the figures", true),
        {
          key: "stats",
          label: "Figures",
          type: "list",
          itemLabel: "Figure",
          min: 1,
          max: 4,
          fields: [text("value", "Big figure", ""), text("label", "What it means", "")],
          default: [
            { value: "Since 1900", label: "The Kewalram Chanrai Group in Nigeria" },
            { value: "3", label: "Equipment lines: CNG and gas, construction, forklifts" },
            { value: "1 team", label: "For sales, on-site service and genuine parts" },
          ],
        },
      ],
    },
    {
      label: "How we work",
      fields: [
        toggle("showValues", "Show this section", true),
        text("valuesTitle", "Heading", "How we work"),
        {
          key: "values",
          label: "Points",
          type: "list",
          itemLabel: "Point",
          min: 1,
          max: 6,
          fields: [text("title", "Title", ""), area("text", "Text", "")],
          default: [
            { title: "We come to the machine", text: "Our technicians work at the station, on the job site or in the warehouse, so your equipment stays where it earns." },
            { title: "Genuine parts", text: "Parts from the manufacturers we represent, matched to your machine by serial number." },
            { title: "One team for the whole life of the machine", text: "Sales, field service and parts from people who know the equipment." },
          ],
        },
      ],
    },
    {
      label: "Side column",
      fields: [text("suppliesTitle", "Product lines heading", "What we supply"), text("makersTitle", "Manufacturers heading", "Manufacturers")],
    },
    seo("About us", ""),
  ],
};

const contact: PageDef = {
  key: "contact",
  label: "Contact",
  path: "/contact",
  group: "Main pages",
  icon: "mail",
  description: "The contact page. Desks, phone numbers and branches come from Company settings and Branches. Form wording is under Forms.",
  sections: [
    banner({ slot: "page-contact", crumb: "Contact", title: "Talk to us", lead: "Send a message and it goes straight to the right desk. You'll get a reference number by email." }),
    {
      label: "Side column",
      fields: [
        text("desksTitle", "Desks heading", "Desks"),
        text("whatsappLink", "WhatsApp link", "Chat on WhatsApp"),
        text("branchesTitle", "Branches heading", "Where to find us"),
        text("headOffice", "Head office label", "Head office"),
        text("directions", "Directions link", "Directions"),
      ],
    },
    seo("Contact", "Talk to {company}'s sales, service, parts or CNG desk."),
  ],
};

const news: PageDef = {
  key: "news",
  label: "News",
  path: "/news",
  group: "Main pages",
  icon: "news",
  description: "The list of news posts. Posts themselves are written under News.",
  sections: [
    banner({ slot: "page-news", crumb: "News", title: "News", lead: "Deliveries, projects and updates from our teams." }),
    {
      label: "List",
      fields: [text("empty", "When there are no posts", "No news yet. Check back soon."), text("readMore", "Link on each post", "Read more")],
    },
    seo("News", ""),
  ],
};

const newsPost: PageDef = {
  key: "news-post",
  label: "News post",
  path: null,
  group: "Main pages",
  icon: "file",
  description: "Wording around every news post. The banner uses the post's cover picture, or the News banner when it has none.",
  sections: [
    {
      label: "Post page",
      fields: [
        text("published", "Date line", "Published {date}", "{date} is the post date."),
        text("back", "Link at the end", "Back to all news"),
      ],
    },
  ],
};

const testimonials: PageDef = {
  key: "testimonials",
  label: "Testimonials",
  path: "/testimonials",
  group: "Main pages",
  icon: "quote",
  description: "Approved testimonials and the share form. Form wording is under Forms.",
  sections: [
    banner({
      slot: "page-about",
      crumb: "Testimonials",
      title: "What customers say",
      lead: "Feedback from contractors, station operators and warehouse teams we work with. Every testimonial is checked by our team before it appears.",
    }),
    {
      label: "List",
      fields: [
        text("empty", "When there are none yet", "Be the first to share your experience."),
        text("exampleBadge", "Badge on example testimonials", "Example"),
      ],
    },
    {
      label: "Share your experience",
      fields: [
        text("shareTitle", "Heading", "Share your experience"),
        area(
          "shareText",
          "Text",
          "Worked with us on a machine, a station or a fleet? Tell others how it went. Your email stays private and your words appear only after our team approves them.",
        ),
      ],
    },
    seo("What customers say", ""),
  ],
};

// ---------- Products and services ----------

const products: PageDef = {
  key: "products",
  label: "Products",
  path: "/products",
  group: "Products and services",
  icon: "package",
  description: "The list of all product lines and machine types. The lines and machines themselves are edited under Catalogue.",
  sections: [
    banner({ slot: "page-products", crumb: "Products", title: "Products", lead: "Choose a line to see each machine type, how it works and the models we supply. Ask for a quote on any of them." }),
    {
      label: "List",
      fields: [
        text("empty", "When the catalogue is empty", "The catalogue is being prepared. Contact us and we'll tell you what's available."),
        text("lineLink", "Link beside each line", "See the range"),
      ],
    },
    seo("Products", "CNG compression and gas equipment, construction equipment and electric forklifts available from {company}."),
  ],
};

const productLine: PageDef = {
  key: "product-line",
  label: "Product line pages",
  path: null,
  group: "Products and services",
  icon: "folder",
  description: "Wording shared by every product line page (for example CNG compression and gas equipment). Each line's own text and picture are under Catalogue.",
  sections: [
    {
      label: "Banner buttons",
      fields: [text("quoteButton", "First button", "Ask for a quote"), text("bookButton", "Second button", "Book a technician")],
    },
    {
      label: "Machine types",
      fields: [
        text("typesTitle", "Heading", "Machine types"),
        text("modelCountOne", "One model", "1 model"),
        text("modelCountMany", "Several models", "{n} models", "{n} is the number of models."),
        text("noModels", "When no models are listed", "Ask for models"),
      ],
    },
    {
      label: "Sales, service and parts",
      fields: [
        text("salesTitle", "Column 1 heading", "Sales"),
        text("salesLink", "Column 1 link", "Ask for a quote"),
        text("serviceTitle", "Column 2 heading", "On-site service"),
        text("serviceLink", "Column 2 link", "Book a technician"),
        text("partsTitle", "Column 3 heading", "Parts"),
        text("partsLink", "Column 3 link", "Ask for parts"),
      ],
    },
    {
      label: "Further down",
      fields: [
        text("servicesTitle", "Services heading", "Services for {line}", "{line} is the line name."),
        text("brandTitle", "Manufacturer heading", "About {brand}", "{brand} is the manufacturer."),
        text("brandWebsite", "Manufacturer link", "Manufacturer's website"),
      ],
    },
  ],
};

const machineType: PageDef = {
  key: "machine-type",
  label: "Machine type pages",
  path: null,
  group: "Products and services",
  icon: "forklift",
  description: "Wording shared by every machine type page (for example CNG Dispensers). Each type's own text is under Catalogue.",
  sections: [
    {
      label: "Banner buttons",
      fields: [text("quoteButton", "First button", "Ask for a quote"), text("bookButton", "Second button", "Book a technician")],
    },
    {
      label: "Jump links under the banner",
      fields: [
        text("navAria", "Name of the bar, read aloud", "On this page"),
        text("navHow", "How it works", "How it works"),
        text("navModels", "Models", "Models"),
        text("navChoosing", "Choosing", "Choosing one"),
        text("navCare", "Maintenance", "Maintenance"),
        text("navSafety", "Safety", "Safety"),
        text("navFaq", "Questions", "Questions"),
      ],
    },
    {
      label: "Section headings",
      fields: [
        text("howTitle", "How it works", "How it works"),
        text("drawingTitle", "Drawing description, read aloud", "Line drawing of a {type}", "{type} is the machine type."),
        text("appsTitle", "Where it is used", "Where it earns its keep"),
        text("modelsTitle", "Models", "Models"),
        area("noModelsText", "When no models are listed", "Tell us about the job and our sales team will recommend the right model and configuration."),
        text("noModelsLink", "Link after that", "Ask for a recommendation"),
        text("choosingTitle", "Choosing", "Choosing the right one"),
        text("careTitle", "Maintenance", "Keeping it running"),
        text("dailyTitle", "Daily checks box", "Daily checks"),
        text("intervalHours", "Service interval", "{n} hours", "{n} is the hour count."),
        text("careButton", "Maintenance button", "Book a service visit"),
        text("safetyTitle", "Safety", "Safety"),
        text("faqTitle", "Questions", "Questions people ask"),
      ],
    },
    {
      label: "Model cards and quick view",
      fields: [
        text("cardView", "Link on each card", "View details"),
        text("qvClose", "Close button", "Close"),
        text("qvSpecs", "Specifications heading", "Specifications"),
        text("qvIndicative", "Note when figures are not confirmed", "Figures are indicative and can vary by configuration. We confirm them with your quote."),
        text("qvQuote", "Quote button", "Ask for a quote"),
        text("qvAsk", "Assistant button", "Ask {enyo} about it"),
        text("qvAskPrompt", "Question put in the assistant", "I'd like to know more about the {model}.", "{model} is the model name."),
        text("qvBrochure", "Brochure button", "Download brochure"),
        text("qvOpen", "Full page link", "Open full page"),
      ],
    },
  ],
};

const model: PageDef = {
  key: "model",
  label: "Model pages",
  path: null,
  group: "Products and services",
  icon: "box",
  description: "Wording shared by every model page. Each model's own text, photos and figures are under Catalogue.",
  sections: [
    {
      label: "Page",
      fields: [
        text("specsTitle", "Specifications heading", "Specifications"),
        text("specsEmpty", "When there are no figures", "Specifications are available on request from our sales team."),
        text("specsIndicative", "Note when figures are not confirmed", "Figures are indicative and can vary by configuration. Our sales team will confirm them for your quote."),
        text("quoteButton", "Quote button", "Ask for a quote"),
        text("bookButton", "Booking button", "Book a technician"),
        text("brochureButton", "Brochure button", "Download brochure"),
        text("learnText", "Line at the end", "Want to understand how it works first?"),
        text("learnLink", "Link after that", "Read about {type}", "{type} is the machine type."),
      ],
    },
  ],
};

const services: PageDef = {
  key: "services",
  label: "Services",
  path: "/services",
  group: "Products and services",
  icon: "tool",
  description: "The services page. The services themselves are listed under Services.",
  sections: [
    banner({
      slot: "page-services",
      crumb: "Services",
      title: "We come to the machine",
      lead: "Compressors don't leave the station and excavators don't drive to workshops. Book a visit and a technician comes to your site with the tools and parts the job needs.",
    }),
    {
      label: "Banner buttons",
      fields: [
        text("bookButton", "First button", "Book a technician"),
        link("bookLink", "First button goes to", "/book-service"),
        text("partsButton", "Second button", "Ask for parts"),
        link("partsLink", "Second button goes to", "/parts"),
      ],
    },
    {
      label: "List",
      fields: [
        text("generalTitle", "Heading for services that cover every line", "For every line"),
        text("lineButton", "Button under each line", "Book a {line} technician", "{line} is the line name."),
      ],
    },
    seo("Services", "CNG station installation and maintenance, on-site field service, maintenance contracts, parts and training."),
  ],
};

const parts: PageDef = {
  key: "parts",
  label: "Parts",
  path: "/parts",
  group: "Products and services",
  icon: "package",
  description: "The parts request page. Form wording is under Forms.",
  sections: [
    banner({
      slot: "page-parts",
      crumb: "Parts",
      title: "Parts",
      lead: "Filters, wear parts, hydraulic components, batteries and station spares. Send the machine's serial number and the part numbers if you have them, and we'll confirm availability.",
    }),
    seo("Parts", "Request genuine parts for CNG compression and gas equipment, construction equipment and forklifts."),
  ],
};

const bookService: PageDef = {
  key: "book-service",
  label: "Book a technician",
  path: "/book-service",
  group: "Products and services",
  icon: "calendar",
  description: "The service booking page. Form wording is under Forms.",
  sections: [
    banner({
      slot: "page-book-service",
      crumb: "Book a technician",
      title: "Book a technician",
      lead: "Our technicians come to the machine: at the station, on the job site or in your warehouse. Tell us what it is, where it is and what's happening.",
    }),
    {
      label: "Urgent box in the banner",
      hint: "Shown when the service desk has a phone number.",
      fields: [
        text("downTitle", "Heading", "Machine down right now?"),
        text("downText", "Text", "Call the service desk on {phone}", "{phone} is the service desk number."),
      ],
    },
    seo("Book a technician", "Book an on-site service visit for CNG compression and gas equipment, construction equipment or forklifts anywhere in Nigeria."),
  ],
};

// ---------- Legal ----------

const privacy: PageDef = {
  key: "privacy",
  label: "Privacy notice",
  path: "/privacy",
  group: "Legal",
  icon: "lock",
  description: "Written to the Nigeria Data Protection Act 2023 and GAID 2025. Have the company's Data Protection Officer review any change.",
  sections: [
    {
      label: "Top of the page",
      fields: [
        text("crumb", "Name in the trail above the heading", "Privacy notice"),
        text("title", "Heading", "Privacy notice"),
        area("lead", "Line under the heading", "How {controller} handles the personal information you give us on this website.", "{controller} is the data controller from Company settings."),
        text("updated", "Date line", "Last updated {date}", "{date} is the Last updated date in Company settings."),
      ],
    },
    {
      label: "Notice",
      fields: [
        md(
          "body",
          "Text",
          `## Who we are

{controller} is the data controller for this website. {heritage} {dpo}

## What we collect

- **Enquiries and bookings:** your name, email, phone, company, message, and machine details such as serial number, hour meter, site location and photos you choose to upload.
- **Conversations with {enyo}:** the messages you type into our website assistant, and any contact details you give it so that our team can follow up.
- **Visit statistics (only if you accept):** which pages were viewed, the referring site and device type, linked to a random identifier. We do not store your IP address.

## Why we use it, and on what basis

- To answer your enquiry, prepare quotes, schedule technicians and supply parts. This is necessary to take steps at your request before or under a contract.
- To keep a record of service requests and the advice we gave. This is our legitimate interest in running a reliable service.
- To understand how the website is used so we can improve it. This is based on your consent, which you can withdraw at any time from Cookie settings.

We do not sell your information and we do not use it for advertising.

## {enyo}, our website assistant

{enyo} is an automated AI assistant, not a person. It answers from information about our products and services and can pass your request to our team. Conversations are stored so staff can follow up and improve answers. Do not share sensitive personal information in the chat.

## Who we share it with

Our staff who handle your request, and service providers that host the website, send our emails and power the assistant. Some of these providers process data outside Nigeria. Where they do, we rely on safeguards permitted by the Nigeria Data Protection Act, such as contractual protections. Where it is needed to support your machine, we may share relevant details with the equipment manufacturer.

## How long we keep it

Enquiries and service records are kept for as long as they are useful for supporting your equipment and meeting our legal obligations, and then deleted. Visit statistics are kept in aggregate.

## Your rights

You can ask to see, correct, delete or move your information, object to or restrict how we use it, and withdraw consent. {rights} You may also complain to the Nigeria Data Protection Commission.

## Security

We use encrypted connections, access controls for staff, and keep a log of administrative actions. If a breach affects you, we will tell you and the Commission as the law requires.
`,
          "Filled in from Company settings: {controller} the data controller, {heritage} the heritage line, {enyo} the assistant's name, {dpo} the sentence about the Data Protection Officer below (left out when no DPO email is set), {rights} the sentence below about how to use your rights.",
        ),
        text("dpoWithName", "{dpo} when the DPO's name is set", "You can reach our Data Protection Officer, {name}, at {email}.", "{name} and {email} come from Company settings."),
        text("dpoNoName", "{dpo} when only the email is set", "You can reach our Data Protection Officer at {email}."),
        text("rightsEmail", "{rights} when a DPO email is set", "Email {email}."),
        text("rightsNoEmail", "{rights} when no DPO email is set", "Contact us using the details on our [contact page](/contact).", "Square brackets and a path in round brackets make a link."),
      ],
    },
    seo("Privacy notice", ""),
  ],
};

const cookies: PageDef = {
  key: "cookies",
  label: "Cookie notice",
  path: "/cookies",
  group: "Legal",
  icon: "shield",
  description: "The cookie notice page. Update the table if the site starts using a new cookie.",
  sections: [
    {
      label: "Top of the page",
      fields: [
        text("crumb", "Name in the trail above the heading", "Cookie notice"),
        text("title", "Heading", "Cookie notice"),
        area("lead", "Line under the heading", "We keep cookies to a minimum. Optional statistics only run if you accept them, and there are no advertising or third-party tracking cookies."),
        text("settingsButton", "Button", "Cookie settings"),
      ],
    },
    {
      label: "Table",
      fields: [
        text("colName", "Column 1 heading", "Name"),
        text("colType", "Column 2 heading", "Type"),
        text("colPurpose", "Column 3 heading", "Purpose"),
        text("colWhat", "Column 4 heading", "What it does"),
        text("colHow", "Column 5 heading", "How long"),
        {
          key: "rows",
          label: "Cookies",
          type: "list",
          itemLabel: "Cookie",
          min: 1,
          max: 20,
          fields: [
            text("name", "Name", ""),
            text("type", "Type", ""),
            text("purpose", "Purpose", ""),
            text("what", "What it does", ""),
            text("how", "How long", ""),
          ],
          default: [
            { name: "cn_consent", type: "Cookie", purpose: "Essential", what: "Remembers your cookie choice", how: "6 months" },
            { name: "cn_vid", type: "Cookie", purpose: "Statistics (optional)", what: "Random ID to count visits without storing your IP address", how: "6 months" },
            { name: "cn_admin", type: "Cookie", purpose: "Essential (staff only)", what: "Keeps staff signed in to the dashboard", how: "12 hours" },
            { name: "theme", type: "Local storage", purpose: "Essential", what: "Remembers light or dark mode if you choose one", how: "Until cleared" },
            { name: "cn_loaded", type: "Session storage", purpose: "Essential", what: "Shows the logo animation only on your first page", how: "Until the tab closes" },
            { name: "cn_enyo", type: "Session storage", purpose: "Essential", what: "Keeps your assistant conversation while you browse", how: "Until the tab closes" },
          ],
        },
      ],
    },
    {
      label: "More text",
      fields: [md("body", "Text under the table", "", "Optional. Headings, lists and links are allowed.")],
    },
    seo("Cookie notice", ""),
  ],
};

/**
 * All editable pages. Keep each page's fields in the order they appear on screen, and give every
 * field a label a non-technical person understands.
 */
export const PAGES: PageDef[] = [
  home,
  about,
  contact,
  news,
  newsPost,
  testimonials,
  products,
  productLine,
  machineType,
  model,
  services,
  bookService,
  parts,
  forms,
  header,
  footer,
  cookieBanner,
  enyo,
  notFound,
  privacy,
  cookies,
];

export const pageDef = (key: string) => PAGES.find((p) => p.key === key);
