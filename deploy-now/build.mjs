import { cp, mkdir, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const run = (cmd, args, cwd) => {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

// Build the static Lolipop edition at the repo root (needs SUPABASE_URL,
// SUPABASE_ANON_KEY, SUPABASE_API_URL from the project environment), expose it
// as this app's public assets, then produce the Next.js standalone bundle.
run(process.execPath, ['scripts/build-lolipop.mjs'], root);
await rm(path.join(here, 'public'), { recursive: true, force: true });
await mkdir(here, { recursive: true });
await cp(path.join(root, 'dist-lolipop'), path.join(here, 'public'), { recursive: true });
run(process.execPath, [path.join(here, 'node_modules', 'next', 'dist', 'bin', 'next'), 'build'], here);

// Standalone output does not bundle public/ or .next/static/ — copy them next
// to the generated server.js (nested under the app dir name in this repo).
const standalone = path.join(here, '.next', 'standalone');
const findServerDir = async (dir) => {
  if (existsSync(path.join(dir, 'server.js'))) return dir;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const found = await findServerDir(path.join(dir, entry.name));
    if (found) return found;
  }
  return null;
};
const serverDir = await findServerDir(standalone);
if (!serverDir) throw new Error('standalone server.js not found');
await cp(path.join(here, 'public'), path.join(serverDir, 'public'), { recursive: true });
await cp(path.join(here, '.next', 'static'), path.join(serverDir, '.next', 'static'), { recursive: true });
console.log('standalone assets copied to ' + path.relative(here, serverDir));
