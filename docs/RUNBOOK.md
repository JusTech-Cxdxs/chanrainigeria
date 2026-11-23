# Runbook

Everyday operations for whoever looks after the site. Commands assume the Docker setup (option A) unless
a step says otherwise.

## First deployment (Docker on a server)

Follow [`INSTALL.md`](../INSTALL.md) in the top folder. One `docker compose up -d --build` starts the
website, the database, HTTPS (Caddy), nightly backups and the daily overdue-enquiry reminder.

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

The database holds everything, including uploaded photos and brochures. With Docker, the `backup`
service writes `backups/chanrai-YYYY-MM-DD.dump` every night at 02:30 Lagos time and keeps 14 days.
Copy the `backups/` folder off the server, e.g. to the company's cloud storage.

**Restore**
```bash
docker compose exec -T db pg_restore -U chanrai -d chanrai --clean --if-exists < backups/chanrai-YYYY-MM-DD.dump
```
An extra backup at any moment: `./scripts/backup.sh` (writes a `.sql.gz`; restore it with
`gunzip -c backups/chanrai-....sql.gz | docker compose exec -T db psql -U chanrai -d chanrai`).

## Rotating secrets

| Secret | How | Effect |
|---|---|---|
| `AUTH_SECRET` | Change it in `.env`, then `docker compose up -d` | Everyone is signed out; retype the mail password under Email and alerts |
| `POSTGRES_PASSWORD` | `ALTER USER chanrai PASSWORD '…'` in psql, then update `.env` and restart | none |
| SMTP password | Dashboard → Email and alerts → Mail server (or `.env` if set there, then restart) | none |
| AI key | Update `.env`, restart | none |

## Troubleshooting

| Symptom | Check |
|---|---|
| Customers say they got no email | Email and alerts shows "Not connected" → set the mail server there and press Send a test email. Otherwise check the enquiry's "Emails sent" line and the container logs: `docker compose logs web` |
| A desk receives nothing | That desk's email in **Settings → Desks** |
| Enyo only gives short pointers | The `ENYO_LLM_*` settings are missing, or the AI provider is down. Company settings → Enyo → Test connection says which |
| Changes made directly in the database don't show | **Settings → Refresh the website** |
| Site down | `docker compose ps`, then `curl localhost:3000/api/health`, then `docker compose logs --tail=100 web` |
| Locked out of every admin account | `docker compose exec db psql -U chanrai -d chanrai -c "update admin_users set active=true where email='…'"`, then reset the password from another admin, or run the seed with `ADMIN_EMAIL`/`ADMIN_PASSWORD` for a new admin |

## Adding a product line later

**Products → Add a product line**. Fill it in, add machine types and models, then tick *Show on the website*.
To route its enquiries to a new desk, a developer adds the desk key in `src/lib/settings.ts` (`desks`);
its contacts are then edited in Settings.
