#!/usr/bin/env node
// Resize gambar asli di img/ (root repo) ke app/public/img/ (yang benar-benar
// di-serve aplikasi), supaya update icon tidak lagi butuh resize manual pakai
// sips satu-satu. Pakai `sips` (bawaan macOS) — dev tool lokal, bukan bagian
// build produksi.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, '../../img');
const DEST_DIR = path.resolve(__dirname, '../public/img');
const SIZE = 320;
const EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

if (process.platform !== 'darwin') {
  console.error('sync-images cuma jalan di macOS (pakai `sips` bawaan sistem).');
  process.exit(1);
}

if (!existsSync(SRC_DIR)) {
  console.error(`Folder sumber tidak ditemukan: ${SRC_DIR}`);
  process.exit(1);
}

mkdirSync(DEST_DIR, { recursive: true });

const files = readdirSync(SRC_DIR).filter((name) => {
  const full = path.join(SRC_DIR, name);
  return statSync(full).isFile() && EXTENSIONS.has(path.extname(name).toLowerCase());
});

if (files.length === 0) {
  console.log('Tidak ada gambar (.png/.jpg/.jpeg) di img/.');
  process.exit(0);
}

for (const name of files) {
  const src = path.join(SRC_DIR, name);
  const dest = path.join(DEST_DIR, name);
  execFileSync('cp', [src, dest]);
  execFileSync('sips', ['-Z', String(SIZE), dest], { stdio: 'ignore' });
  console.log(`✔ ${name} → ${SIZE}x${SIZE}`);
}

console.log(`\nSelesai. ${files.length} gambar disinkronkan ke app/public/img/.`);
