#!/usr/bin/env bash
# Backup database harian (pg_dump terkompres), simpan 14 hari terakhir.
# Dijalankan cron user `deploy` (lihat DEPLOY.md langkah 10).
set -euo pipefail
DIR=/srv/backups/db
mkdir -p "$DIR"
pg_dump -h localhost -U inggrisinyuk inggrisinyuk_kids_portal | gzip > "$DIR/portal-$(date +%F).sql.gz"
find "$DIR" -name 'portal-*.sql.gz' -mtime +14 -delete
