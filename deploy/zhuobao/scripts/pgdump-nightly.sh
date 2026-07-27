#!/usr/bin/env bash
set -euo pipefail

# Nightly pg_dump:
#   - dump full DB
#   - compress + filename with date
#   - keep 14 days, prune older

BACKUP_DIR=/var/lib/data-tw/backups
DB_URL=${DATABASE_URL:-postgres://postgres@127.0.0.1:5432/dashboard}
KEEP_DAYS=${PGDUMP_KEEP_DAYS:-14}

mkdir -p "$BACKUP_DIR"
TS=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/dashboard_${TS}.sql.gz"

pg_dump "$DB_URL" --no-owner --no-privileges | gzip -9 > "$FILE"
ls -lh "$FILE"

find "$BACKUP_DIR" -type f -name "dashboard_*.sql.gz" -mtime "+${KEEP_DAYS}" -delete