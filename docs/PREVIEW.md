# Putting up a preview (about 15 minutes, no Docker needed)

The preview runs on **Vercel** (the website) with a free **Neon** PostgreSQL database that Vercel creates for
you. Both have free plans. You need the GitHub account that owns this repository.

You do **not** need Docker for the preview. Docker is only one way to install the finished site on the
company's own server later (see `RUNBOOK.md`).

---

## 1. Import the project into Vercel

1. Go to <https://vercel.com/new> and sign in with GitHub.
2. Find **chanrainigeria** and click **Import**.
3. Leave the framework as **Next.js** and the root directory as it is.
4. **Don't click Deploy yet.** First open **Environment Variables** and add the values below.

## 2. Environment variables

| Name | Value |
|---|---|
| `AUTH_SECRET` | A long random string of 48 or more characters from any password generator (or run `openssl rand -base64 48`) |
| `SETUP_TOKEN` | Any private code of at least 12 characters, e.g. `chanrai-setup-` plus some random letters. You type it once to create your account |
| `CRON_SECRET` | Another random string (at least 16 characters). It protects the daily overdue reminder |
| `PREVIEW_NOINDEX` | `1` keeps the preview out of Google. Remove it when the site goes live on chanrainigeria.com |
| `ENYO_API_KEY` | Your Groq key (console.groq.com → API Keys). Without it, Enyo still works in basic mode |

Optional (emails). Without these, enquiries are still saved in the dashboard but no emails go out.

| Name | Value |
|---|---|
| `SMTP_HOST` | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | the mailbox address |
| `SMTP_PASS` | for Gmail, an **App password** (Google Account → Security → 2-Step Verification → App passwords) |
| `SMTP_FROM` | the same mailbox address |

## 3. Create the database

1. Click **Deploy**. The first build stops with "DATABASE_URL is not set", which is expected.
2. In the project, open the **Storage** tab, then **Create Database**, then **Neon (Serverless Postgres)**.
3. Pick the **Free** plan and a region near Europe (Frankfurt). Then **Connect** it to this project for all environments.
   Vercel adds `DATABASE_URL` and the related variables automatically.
4. Go to **Deployments**, open the latest one, and click **Redeploy**.

During the build, the site creates its tables and loads the catalogue, services and example testimonials
by itself. This is safe to repeat on every deploy.

## 4. Create your account

1. Open `https://YOUR-PROJECT.vercel.app/admin/setup`.
2. Enter the `SETUP_TOKEN`, the company name, your name, email and a strong password.
   This is the **platform account**. The company never sees it.
3. You land on **Team**. Add Mr Ghosh (or whoever runs the site) as **Administrator**, with a temporary
   password you send him privately.

## 5. Check it, then share

- Open the site on your phone and computer, and try light and dark mode (the half-moon icon).
- Book a technician, send a quote request and leave a testimonial, then watch them arrive under
  **Enquiries** and **Testimonials** in the dashboard.
- Share `https://YOUR-PROJECT.vercel.app` for the website and `/admin` for the dashboard.

## Updating the preview

Every push to the branch Vercel watches redeploys automatically. Pictures and text changed in the
dashboard are stored in the database, so they survive redeploys.

## Limits on the free preview

- Uploads up to 4 MB per file. Export photos as JPG or WebP at about 2400 px wide.
- Neon's free database sleeps when idle, so the first visit after a quiet spell takes a second or two longer.
- The daily overdue reminder runs once a day at 08:00 Lagos time.
