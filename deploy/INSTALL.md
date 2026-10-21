# Installing the Chanrai Nigeria website

This folder installs the website and staff dashboard on a server the company controls. You do not
need the source code, and you do not need to know how to program. Allow about 30 minutes.

## What you need

- A Linux server (Ubuntu 22.04 or newer) with at least 2 GB of memory and 20 GB of disk.
- Docker with the Compose plugin: <https://docs.docker.com/engine/install/ubuntu/>
- The domain `chanrainigeria.com`, with access to its DNS settings.
- The release file from Just Technologies: `chanrai-web-<version>.tar.gz`.

## 1. Copy the files to the server

Put this whole folder (including `chanrai-web-<version>.tar.gz`) on the server, for example in
`/opt/chanrai`, then open a terminal there.

## 2. Load the website image

```bash
docker load -i chanrai-web-<version>.tar.gz
```

## 3. Fill in the settings

```bash
cp .env.example .env
nano .env
```

Fill in `SITE_URL`, `POSTGRES_PASSWORD`, `AUTH_SECRET`, `SETUP_TOKEN` and `CRON_SECRET`. To make a
random value, run `openssl rand -base64 48`. Keep this file private and keep a copy somewhere safe.

## 4. Start it

```bash
docker compose up -d
```

The website starts on port 3000 on the server itself. The first start takes a minute while the
database is prepared and the product catalogue is loaded.

## 5. Put it on the internet with HTTPS

Install Caddy (<https://caddyserver.com/docs/install>) and use this as `/etc/caddy/Caddyfile`:

```
chanrainigeria.com, www.chanrainigeria.com {
  reverse_proxy 127.0.0.1:3000 {
    header_up X-Real-IP {remote_host}
  }
}
```

Then `sudo systemctl reload caddy`. Caddy gets and renews the HTTPS certificate by itself.

In the domain's DNS, point the `A` records for `@` and `www` at the server's IP address.
**Do not change the `MX` records**, so company email keeps working.

## 6. First sign-in

Open `https://www.chanrainigeria.com/admin/setup`, enter the `SETUP_TOKEN` and create the first
account. Then, in the dashboard:

1. **Team**: add the company's administrator and staff, each with a role.
2. **Email and alerts**: enter the mail server details and send a test email.
3. **Company settings**: check contacts, desks and opening hours.
4. **Brands, Pages and text, Media library**: upload logos and photos.

## Everyday care

- **Backups** run every night at 02:30 Lagos time into the `backups` folder and are kept for 14 days.
  Copy that folder to another place regularly (another server, cloud storage or a USB drive).
- **Restore a backup**:
  `docker compose exec -T db pg_restore -U chanrai -d chanrai --clean < backups/chanrai-YYYY-MM-DD.dump`
- **Updates** arrive as a new release file. Load it (step 2), set `WEB_IMAGE` in `.env` if the name
  changed, then `docker compose up -d`. Your content is kept.
- **See what's happening**: `docker compose ps` and `docker compose logs -f web`.

## Help

Contact Just Technologies support with the release version (shown in `docker compose logs web`).
