#!/usr/bin/env bash
# Update production: tarik kode terbaru, build app + portal, migrasi DB, restart.
# Jalankan di VPS sebagai user `deploy`:  /srv/inggrisinyuk-kids/deploy/deploy.sh
set -euo pipefail

REPO=/srv/inggrisinyuk-kids
BRANCH="${1:-main}"
cd "$REPO"

echo "==> Tarik kode terbaru ($BRANCH)"
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "==> Build app anak (statis)"
cd "$REPO/app"
npm ci
npm run build

echo "==> Build portal"
cd "$REPO/portal"
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build

echo "==> Restart portal"
sudo systemctl restart inggrisinyuk-kids-portal
sleep 3
systemctl is-active --quiet inggrisinyuk-kids-portal && echo "Portal jalan ✅" || { echo "Portal GAGAL jalan ❌ — cek: journalctl -u inggrisinyuk-kids-portal -n 50"; exit 1; }
