# Installing the Chanrai Nigeria website on your own server

This package is the full source code. One command builds and starts everything with Docker:
the website and dashboard, the database, HTTPS, nightly backups and the daily reminder.
Allow about 45 minutes.

## What you need

| Item | Detail |
|---|---|
| Server | Linux (Ubuntu 22.04 or newer), 2 CPU, 4 GB memory, 30 GB disk, a public IP address |
| Open ports | 80 and 443 to the internet, 22 for your own SSH access |
| Docker | Engine with the Compose plugin: <https://docs.docker.com/engine/install/ubuntu/> |
| Domain | Access to the DNS settings of `chanrainigeria.com` |
| Mailbox | An address the website sends from, e.g. `website@chanrainigeria.com`, with its SMTP details |

Shared cPanel hosting cannot run this site. It needs a server (VPS or cloud VM) where Docker can run.

## 1. Put the code on the server

```bash
sudo mkdir -p /opt/chanrai && cd /opt/chanrai
# copy chanrai-nigeria-website-1.0.0.zip here (scp, WinSCP or a USB drive), then:
sudo apt install -y unzip && unzip chanrai-nigeria-website-1.0.0.zip && cd chanrai-nigeria-website-1.0.0
```

## 2. Point the domain at the server

In the domain's DNS, set the `A` records for `@` and `www` to the server's IP address.
**Do not touch the `MX` records**, so company email keeps working.
Check with `ping www.chanrainigeria.com` that it answers from the server's IP before step 4.

## 3. Fill in the settings

```bash
cp .env.example .env
nano .env
```

| Setting | What to put |
|---|---|
| `SITE_URL` | `https://www.chanrainigeria.com` |
| `SITE_DOMAINS` | `chanrainigeria.com, www.chanrainigeria.com` |
| `POSTGRES_PASSWORD` | Output of `openssl rand -hex 24`. Set once and never change it |
| `AUTH_SECRET` | Output of `openssl rand -base64 48` |
| `SETUP_TOKEN` | A private code of 12 or more characters. You type it once in step 5 |
| `CRON_SECRET` | Output of `openssl rand -hex 16` |

Everything else can stay as it is. Keep a copy of `.env` somewhere safe and private.
The mail server is set later in the dashboard, not here.

## 4. Build and start

```bash
sudo docker compose up -d --build
```

The first build takes 5 to 10 minutes. Lines about the database not being reachable **during the
build** are normal: the database is only used once the site starts. Then check:

```bash
sudo docker compose ps                        # db, web, caddy, cron and backup should be "running"
curl -s http://localhost:3000/api/health      # {"ok":true,"database":"up"}
```

The first start creates the database tables and loads the product catalogue by itself.
Open `https://www.chanrainigeria.com`. The HTTPS certificate is issued automatically within a minute
of the first visit, as long as step 2 is done and ports 80 and 443 are open.

**Already have Nginx, Apache or IIS on this server?** Set `COMPOSE_PROFILES=` (empty) in `.env`, and
make your proxy forward the domain to `127.0.0.1:3000`, passing the visitor's address in the
`X-Real-IP` header.

## 5. Create the first account

Open `https://www.chanrainigeria.com/admin/setup`, enter the `SETUP_TOKEN`, your name, email and a
password. This page works once only. Signing in needs HTTPS, so do this on the real domain.

Then, in the dashboard:

1. **Team**: add each staff member with a role (Administrator, Content editor, Enquiry coordinator).
2. **Email and alerts**: set the mail server (next section).
3. **Company settings**: check phone numbers, desk emails, address and opening hours.

## 6. Set up the mail server (SMTP)

Dashboard → **Email and alerts** → **Mail server**. Ask whoever manages company email for these:

| Field | Microsoft 365 | Google Workspace | Zoho Mail | cPanel / own mail host |
|---|---|---|---|---|
| Server name | `smtp.office365.com` | `smtp.gmail.com` | `smtp.zoho.com` | `mail.chanrainigeria.com` |
| Port | 587 | 587 | 465 | 465 (or 587) |
| Security | STARTTLS | STARTTLS | SSL/TLS | SSL/TLS (STARTTLS on 587) |
| Username | the full address | the full address | the full address | the full address |
| Password | mailbox or app password | app password | mailbox or app password | mailbox password |

- **Microsoft 365**: "Authenticated SMTP" must be switched on for that mailbox (Microsoft 365 admin
  centre → Users → the mailbox → Mail → Manage email apps). With multi-factor sign-in, use an app password.
- **Google**: turn on 2-Step Verification for the mailbox, then create an **app password** and use that.
- Set **Sender address** to the same mailbox (or an alias it may send as).
- Press **Save email settings**, then **Send a test email**. The page says in plain words what is
  wrong if it fails (wrong password, wrong port, server not found).
- Under **Alert routing**, choose who is told about new enquiries.
- If the mail server is inside the company network (on-premises Exchange), add `ALLOW_PRIVATE_SMTP=1`
  to `.env` and run `sudo docker compose up -d`.

To keep emails out of spam, the domain's SPF record must allow the mail server you use, and DKIM
should be on for it. The email provider's admin page shows both records.

Finally send a test enquiry from the website's Contact page: the customer copy and the desk
notification should both arrive.

## Everyday care

| Task | Command (run in this folder) |
|---|---|
| See what is running | `sudo docker compose ps` |
| Read the site's log | `sudo docker compose logs --tail=100 web` |
| Restart everything | `sudo docker compose restart` |
| Stop / start | `sudo docker compose down` / `sudo docker compose up -d` |
| Apply a code change or update | replace the code, then `sudo docker compose up -d --build` |
| Change a setting in `.env` | edit it, then `sudo docker compose up -d` |

- **Backups** run every night at 02:30 Lagos time into the `backups` folder and are kept 14 days.
  They include every uploaded picture. Copy that folder off the server regularly.
- **Restore a backup**:
  `sudo docker compose exec -T db pg_restore -U chanrai -d chanrai --clean --if-exists < backups/chanrai-YYYY-MM-DD.dump`
- `sudo docker compose down` keeps the data. **Never run it with `-v`**: that deletes the database.
- The server restarts the site by itself after a reboot.

## If something is wrong

| Symptom | Check |
|---|---|
| Browser says the site can't be reached | DNS points at the server? Ports 80/443 open in the firewall? `sudo docker compose ps` |
| Certificate warning | `sudo docker compose logs caddy`. Usually DNS is not pointing here yet |
| "Setup is locked" at /admin/setup | `SETUP_TOKEN` in `.env` is shorter than 12 characters. Fix, then `sudo docker compose up -d` |
| Can't sign in on `http://` or an IP address | Sign-in needs HTTPS on the real domain |
| `web` keeps restarting | `sudo docker compose logs web`. Usually a missing value in `.env` |
| No emails | Dashboard → Email and alerts → Send a test email, and read the message it shows |
| Port 80 or 443 already in use | Another web server is running. See "Already have Nginx" in step 4 |

More detail for whoever maintains the site: `docs/RUNBOOK.md`. Developer notes: `README.md`.
