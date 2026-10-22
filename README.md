# Chanrai Nigeria — website

The public website, enquiry desk and **Enyo** assistant for Chanrai Nigeria Limited (Kewalram Chanrai Group):
CNG compression & gas equipment, construction equipment and forklifts, with sales, on-site field service and parts.

Built by JusTech. This repository is everything needed to run, change and host the site. There is no
external service it depends on except a PostgreSQL database, an SMTP mailbox and (optionally) an AI key.

---

## What it does

**Public site**
- Product lines → machine types → models. Each machine type explains how the machine works, its main
  components, where it's used, how to choose one, maintenance intervals, safety and FAQs. Models open in a
  quick-view with specifications and an **Ask for a quote** button. No prices are shown anywhere.
- **Book a technician**: field-service bookings that capture the machine, serial number, hour meter, site
  location, state, urgency ("machine is down") and photos.
- **Parts**, **Contact**, **Services**, **News**, **About**, locations, privacy and cookie notices.
- Light and dark mode, logo loading animation, phone-first layout.

**One enquiry pipeline.** The forms and Enyo both create the same record with a reference number
(`CN-2026-000123`). Each one:
1. is routed to the right desk (Sales, Field service, Parts or CNG & gas),
2. emails the customer a branded acknowledgement, and the desk a notification,
3. appears in the dashboard with status, assignee, internal notes and email replies.

**Enyo assistant.** Answers only from the site's own content (products, services, desks, locations and
staff notes), never gives prices, collects contact details (email required) and logs the request. Without an
AI key it runs in basic mode and still guides people to the right page and takes requests.

**Dashboard** at `/admin`
- Overview, enquiries inbox, Enyo chat transcripts and visitor statistics.
- Products (lines, machine types, models, manufacturers), services, news, locations and the media library.
- Settings for every company detail, logo, colours, desks, email sender, Enyo and privacy contacts.
  **Nothing about the company is hard-coded.**
- Team with three roles (Administrator, Content editor, Enquiry coordinator) and an activity log.

**Privacy (NDPA 2023 / GAID 2025).** A cookie banner with equal Accept and Reject buttons. Statistics run
only after consent, every choice is recorded, no IP addresses are stored, and customer photos are visible
only to signed-in staff. The site also shows a notice before the first Enyo chat, plus privacy and cookie
notices. Have the company's Data Protection Officer review `/privacy` before launch.

## Technology

| Part | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, self-hosted Archivo font (no Google calls) |
| Database | PostgreSQL 14+ via Drizzle ORM (plain SQL migrations in `drizzle/`) |
| Files | Stored in the database (one backup holds everything; works on any host) |
| Email | Any SMTP server (Nodemailer) |
| AI | Any OpenAI-compatible API; set up for Groq |
| Auth | Email + password, bcrypt, signed session cookie |

## Run it locally

```bash
cp .env.example .env          # fill in DATABASE_URL and AUTH_SECRET at least
npm install
npm run db:setup              # create tables + load the catalogue
npm run dev                   # http://localhost:3000, then /admin/setup
```

## Deploy

Pick whichever matches the hosting the company has. Full steps are in [`docs/RUNBOOK.md`](docs/RUNBOOK.md).

**Just want a preview link?** Follow [`docs/PREVIEW.md`](docs/PREVIEW.md): Vercel plus a free Neon database,
about 15 minutes, no Docker and nothing to install.

**What Docker is, in one line:** a way to pack the site and its database into one bundle that runs the same on
any server. You only need it if the company hosts the site on its own machine (option A below).

**A. Their own server (VPS or cloud VM) with Docker.** This is the recommended route for full ownership.
```bash
cp .env.example .env          # set POSTGRES_PASSWORD, AUTH_SECRET, SITE_URL, SMTP_*
docker compose up -d --build   # first start also loads the catalogue
```
Put a reverse proxy (Caddy or Nginx) in front for HTTPS on `chanrainigeria.com`, and set `TRUSTED_IP_HEADER`
to the header it sets (`x-real-ip` for Caddy/Nginx as configured in the runbook) so rate limits see real visitors.

**B. Managed hosting**: Vercel (or any Node host) for the app, plus Supabase or Neon for PostgreSQL. Set the
environment variables, run `npm run db:setup` once against the database, and point the domain's DNS at the host.

**Shared cPanel hosting can't run this app** (it needs Node.js and PostgreSQL). In that case keep the domain
and email where they are, and point the domain's DNS at option A or B.

## Changing content

Everything editable lives in the dashboard. The starting catalogue comes from `content/seed/*.json`
(researched from the manufacturers' published information). **Every model starts as "specifications to check"**:
staff compare each model against the official spec sheet for the configuration they sell, then tick
*Specifications checked*. Until then the site says the figures are indicative.

Brand photos, logos and brochures should come from each manufacturer's dealer media kit. See
[`docs/HANDOVER.md`](docs/HANDOVER.md) for who to ask.

## Project layout

```
src/app/(site)/        public pages            src/app/admin/       dashboard
src/app/api/           enquiry chat, consent, visit counter, health check
src/lib/               settings, catalogue, enquiries, email templates, Enyo, auth
src/db/schema.ts       data model              drizzle/             SQL migrations
content/seed/          starting catalogue      scripts/             migrate, seed, backup
```

## Checks

```bash
npm run typecheck && npm run lint && npm run build
```
CI runs the same checks plus migrations and the seed against a real PostgreSQL on every pull request.
