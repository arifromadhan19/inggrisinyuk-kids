// Nyalakan app/ (port 8200) DAN portal/ (API login, port 3000) sekaligus —
// tanpa portal, login selalu gagal (issue/20260924_login_124_issue.md).
// Kalau portal sudah jalan dari terminal lain, cukup app/ yang dinyalakan.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const portalDir = path.resolve(appDir, '../portal');

async function portalRunning() {
  try {
    await fetch('http://127.0.0.1:3000/api/leaderboard', { signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
}

const children = [];
function run(name, cwd, args) {
  const child = spawn('npm', args, { cwd, stdio: 'inherit' });
  child.on('exit', (code) => {
    console.log(`[dev:all] ${name} berhenti (kode ${code}) — mematikan sisanya.`);
    shutdown();
  });
  children.push(child);
}

function shutdown() {
  for (const c of children) if (c.exitCode === null) c.kill('SIGTERM');
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

if (await portalRunning()) {
  console.log('[dev:all] Portal sudah jalan di port 3000 — dipakai apa adanya.');
} else {
  run('portal', portalDir, ['run', 'dev']);
}
run('app', appDir, ['run', 'dev']);
