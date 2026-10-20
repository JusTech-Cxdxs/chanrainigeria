#!/usr/bin/env sh
# Nightly database backup (includes uploaded photos and brochures).
# Docker:   ./scripts/backup.sh
# Managed:  DATABASE_URL=postgres://… ./scripts/backup.sh   (needs pg_dump installed locally)
set -eu
cd "$(dirname "$0")/.."
mkdir -p backups
out="backups/chanrai-$(date +%Y%m%d-%H%M).sql.gz"
if [ -n "${DATABASE_URL:-}" ] && ! docker compose ps db >/dev/null 2>&1; then
  pg_dump --no-owner --no-privileges "$DATABASE_URL" | gzip > "$out"
else
  docker compose exec -T db pg_dump -U chanrai --no-owner --no-privileges chanrai | gzip > "$out"
fi
# Keep 30 days locally; copy the folder somewhere off the server as well.
find backups -name 'chanrai-*.sql.gz' -mtime +30 -delete
echo "Backup written to $out"
