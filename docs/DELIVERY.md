# Delivering the site to Chanrai (and protecting the platform)

The website runs on JusTech's EJO 100 platform. Chanrai gets full control of their **site and data**.
JusTech keeps ownership of the **software**. In practice that means:

| Chanrai gets | JusTech keeps |
|---|---|
| A ready-to-run Docker image of the compiled site | The source code and this repository |
| Install guide, compose file, licence | The CMS and dashboard platform (EJO 100) |
| Full dashboard control: pages, pictures, products, brands, team, roles, email | The right to reuse the platform for other clients |
| Their content and database, exportable any time | Support and updates under the agreement |

## How to deliver

1. Keep this GitHub repository **private**.
2. On a machine with Docker, run `npm run release`. It builds the image for Linux servers, checks that
   no source files are inside, and writes `release/chanrai-web-<version>.zip` containing:
   - `chanrai-web-<version>.tar.gz` (the image)
   - `docker-compose.yml` (website, database, nightly backups and the daily reminder)
   - `.env.example`, `INSTALL.md`, `LICENSE`, `SHA256SUMS`
3. Send the zip to Chanrai's IT team with the signed agreement. They follow `INSTALL.md`.
4. For updates, build a new version and send the new zip. Their content is kept.

Alternatively, push a version tag (`git tag v1.0.0 && git push --tags`). GitHub Actions then builds the
image and publishes it as a **private** package on GitHub Container Registry. Give Chanrai a read-only
token and they pull updates with `docker compose pull && docker compose up -d`. This needs GitHub
Actions billing to be active on the account.

## What protects the platform

- **No source in the image.** The image holds the compiled, minified server and two bundled scripts
  (database migrations and first-run content). The release script refuses to finish if source files
  are found.
- **Licence.** `LICENSE` grants use for Chanrai's own site only, and forbids copying, reverse
  engineering, reselling or building other services from it. Have a lawyer review it and attach it to
  the signed agreement.
- **Platform account.** The hidden platform support account (created with `SETUP_TOKEN`) lets JusTech
  support them, see history and undo changes. Chanrai's staff never see it.
- **"Powered by"** appears only on the dashboard sign-in, dashboard footer and dashboard loader, from
  one place (`src/lib/platform.ts`). Never in emails or on the public site.

To be honest about the limits: compiled JavaScript can still be read by a determined expert. The real
protection is the combination of not handing over the source, the licence, and the support
relationship. That is the same approach commercial self-hosted software uses.

## Their data, if the relationship ends

Everything Chanrai created lives in their PostgreSQL database, including uploaded pictures. The
nightly backups in `backups/` are standard PostgreSQL dumps they can keep and open with any PostgreSQL
tools.
