# Delivering the site to Chanrai

Chanrai receives the **full source code** and runs the site on its own server. Just Technologies keeps
ownership of the software and the EJO 100 platform, and licenses it to Chanrai (see `LICENSE`).

| Chanrai gets | Just Technologies keeps |
|---|---|
| The complete source code, to run, keep and modify for its own site | Ownership of the software and the EJO 100 platform |
| Docker setup, install guide, runbook and licence | The right to reuse the platform for other customers |
| Full dashboard control: pages, pictures, products, brands, team, roles, email | |
| Its content and database, exportable at any time | |

Chanrai may not resell the software, pass the source code on, or use it for another organisation.
Have a lawyer review `LICENSE` and attach it to the signed agreement.

## The handover package

`chanrai-nigeria-website-<version>.zip` holds the source code as it is on the `main` branch, without the
Git history. Its top folder contains:

- `INSTALL.md`: step-by-step installation on a server with Docker
- `docker-compose.yml`, `Dockerfile`, `.env.example`, `deploy/Caddyfile`
- `LICENSE`, `README.md`, `docs/` (runbook, handover checklist, official media notes)

Make it with:

```bash
git archive --format=zip --prefix=chanrai-nigeria-website-1.0.0/ -o chanrai-nigeria-website-1.0.0.zip main
```

## At handover

1. Give the zip and the signed agreement to Chanrai's IT team.
2. Install with them by following `INSTALL.md`.
3. At `/admin/setup`, create the first account, then add Chanrai's administrator under **Team**.
4. Set the mail server under **Email and alerts** and send a test email and a test enquiry.
5. Hand over the `.env` values. Chanrai owns every account and secret (see `HANDOVER.md`).
6. Agree in writing who supports and updates the site afterwards.

## Their data

Everything Chanrai creates lives in its PostgreSQL database, including uploaded pictures. The nightly
backups in `backups/` are standard PostgreSQL dumps that open with any PostgreSQL tools.

## Alternative: a prebuilt image without source

`npm run release` still builds a compiled image and an install folder (`deploy/`) for customers who
should not receive source code. It is not used for Chanrai.
