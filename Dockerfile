# Chanrai Nigeria website: production image.
#
# Built by `docker compose up -d --build` (see INSTALL.md). The final image contains the compiled application:
#   - .next/standalone   the compiled server (minified)
#   - dist/*.mjs         database migrations and first-run content, bundled into single files
#   - drizzle/, content/ SQL migrations and the starter catalogue

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
RUN npm run build && npm run bundle:scripts

# ---- runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ARG VERSION=dev
LABEL org.opencontainers.image.title="Chanrai Nigeria website" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.licenses="LicenseRef-JusTech-Source-Licence"
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 APP_VERSION=${VERSION}
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/drizzle ./drizzle
COPY --from=build --chown=app:app /app/content ./content
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/LICENSE ./LICENSE
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
# On every start: bring the database up to date, add any missing starter content (never overwrites
# staff changes), clear the data cache, then start the site.
CMD ["sh", "-c", "node dist/migrate.mjs && node dist/seed.mjs && rm -rf .next/cache/fetch-cache && node server.js"]
