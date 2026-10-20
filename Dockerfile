# Chanrai Nigeria website — production image.
#   docker compose up -d          (app + database)
#   docker compose run --rm setup (first time: load the catalogue)

# ---- dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- setup tools (migrations + seed with the full toolchain) ----
FROM build AS setup
CMD ["npm", "run", "db:setup"]

# ---- runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/drizzle ./drizzle
COPY --from=build --chown=app:app /app/scripts/migrate.mjs ./scripts/migrate.mjs
# The migrator needs the full drizzle-orm and pg packages, not just the traced subset.
COPY --from=deps --chown=app:app /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=deps --chown=app:app /app/node_modules/pg ./node_modules/pg
COPY --from=deps --chown=app:app /app/node_modules/pg-pool ./node_modules/pg-pool
COPY --from=deps --chown=app:app /app/node_modules/pg-protocol ./node_modules/pg-protocol
COPY --from=deps --chown=app:app /app/node_modules/pg-types ./node_modules/pg-types
COPY --from=deps --chown=app:app /app/node_modules/pg-connection-string ./node_modules/pg-connection-string
COPY --from=deps --chown=app:app /app/node_modules/pgpass ./node_modules/pgpass
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
# Clear the data cache (so catalogue loads or direct database edits always show), bring the
# database schema up to date, then start the site.
CMD ["sh", "-c", "rm -rf .next/cache/fetch-cache && node scripts/migrate.mjs && node server.js"]
