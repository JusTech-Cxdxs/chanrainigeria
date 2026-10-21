# Runbook

Everyday operations for whoever looks after the site. Commands assume the Docker setup (option A) unless
a step says otherwise.

## First deployment (Docker on a server)

1. Install Docker and the Compose plugin on an Ubuntu 22.04+ server (2 GB RAM is enough).
2. Clone the repository from the company's GitHub organisation, then `cd` into it.
3. `cp .env.example .env`, then set:
   - `POSTGRES_PASSWORD`: a long random password.
   - `AUTH_SECRET`: from `openssl rand -base64 48`.
   - `SITE_URL=https://www.chanrainigeria.com`
   - `SMTP_*`: the mailbox the site sends from (e.g. `website@chanrainigeria.com`).
   - `ENYO_API_KEY`: optional.
   - `SETUP_TOKEN`: a private code of 12+ characters, typed once at `/admin/setup`.
   - `CRON_SECRET`: random, 16+ characters. Call `GET /api/cron/overdue` with
     `Authorization: Bearer <CRON_SECRET>` once a day (a server cron job) for overdue-enquiry reminders.
   - `TRUSTED_IP_HEADER=x-real-ip` (matches the Caddyfile below).
4. `docker compose up -d --build`
5. The first start creates the tables and loads the catalogue by itself (safe on every start).
   For the customer's own server, use the prebuilt release instead: see `docs/DELIVERY.md`.
6. HTTPS: install Caddy and use this as `/etc/caddy/Caddyfile`:
   ```
   chanrainigeria.com, www.chanrainigeria.com {
     reverse_proxy localhost:3000 {
       header_up X-Real-IP {remote_host}
     }
   }
   ```
7. DNS: point the domain's `A` records (`@` and `www`) at the server's IP. **Leave the `MX` records alone**,
   so company email keeps working.
8. Open `https://www.chanrainigeria.com/admin/setup`, enter the `SETUP_TOKEN` and create the platform
   account. Then add the company's administrator under **Team**.
9. In **Settings**, fill in the desk emails and phones, upload the logo, and set the sender address.
   Then send a test enquiry from the site.

## First deployment (Vercel + Supabase)

1. Create a Supabase project in the company's account. Copy the *transaction pooler* URL into
   `DATABASE_URL` and the *direct* URL into `DIRECT_URL`.
2. Import the GitHub repository into Vercel (in the company's account) and add the environment variables
   from `.env.example`.
3. From your machine, with the same `.env`, run `npm run db:setup`.
4. Add the domain in Vercel and follow its DNS instructions.
5. Continue from step 8 above.

## Updating the site

```bash
git pull
docker compose up -d --build   # migrations run automatically on start
```
On Vercel, merging to `main` deploys automatically. Run `npm run db:migrate` against the database
first if the change includes a new file in `drizzle/`.

## Backups

The database holds everything, including uploaded photos and brochures.

```bash
./scripts/backup.sh                  # writes backups/chanrai-YYYYMMDD-HHMM.sql.gz
```
Schedule it nightly with cron (`0 2 * * * cd /srv/chanrainigeria && ./scripts/backup.sh`) and copy the
`backups/` folder off the server, e.g. to the company's cloud storage. Keep at least 14 days.

**Restore**
```bash
gunzip -c backups/chanrai-....sql.gz | docker compose exec -T db psql -U chanrai -d chanrai
```

## Rotating secrets

| Secret | How | Effect |
|---|---|---|
| `AUTH_SECRET` | Change it in `.env`, then `docker compose up -d` | Everyone is signed out |
| `POSTGRES_PASSWORD` | `ALTER USER chanrai PASSWORD '…'` in psql, then update `.env` and restart | none |
| SMTP password | Update `.env`, restart | none |
| AI key | Update `.env`, restart | none |

## Troubleshooting

| Symptom | Check |
|---|---|
| Customers say they got no email | Settings shows "Mail server not connected" → set `SMTP_*`. Otherwise check the enquiry's "Emails sent" line and the container logs: `docker compose logs web` |
| A desk receives nothing | That desk's email in **Settings → Desks** |
| Enyo only gives short pointers | No `ENYO_API_KEY`, or the AI provider is down; it falls back to basic mode automatically |
| Changes made directly in the database don't show | **Settings → Refresh the website** |
| Site down | `docker compose ps`, then `curl localhost:3000/api/health`, then `docker compose logs --tail=100 web` |
| Locked out of every admin account | `docker compose exec db psql -U chanrai -d chanrai -c "update admin_users set active=true where email='…'"`, then reset the password from another admin, or run the seed with `ADMIN_EMAIL`/`ADMIN_PASSWORD` for a new admin |

## Adding a product line later

**Products → Add a product line**. Fill it in, add machine types and models, then tick *Show on the website*.
To route its enquiries to a new desk, a developer adds the desk key in `src/lib/settings.ts` (`desks`);
its contacts are then edited in Settings.
