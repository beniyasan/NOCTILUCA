import { cp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)));
  });
}

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;
const api = process.env.SUPABASE_API_URL;
if (!url || !anon || !api) throw new Error('SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_API_URL を指定してください。');

await run(process.execPath, ['scripts/sync-game.mjs']);
await run(process.execPath, ['scripts/sync-lolipop.mjs']);
await rm('dist-lolipop', { recursive: true, force: true });
await cp('public', 'dist-lolipop', { recursive: true });
await cp('lolipop/client/gateway.js', 'dist-lolipop/client/gateway.js');
await cp('lolipop/client/main.js', 'dist-lolipop/client/main.js');
await cp('lolipop/client/talk-pool.js', 'dist-lolipop/client/talk-pool.js');
const template = await readFile('src/client/index.template.html', 'utf8');
const html = template
  .replace('href="/signin-with-chatgpt"', 'href="#supabase-sign-in"')
  .replace('ChatGPTでログイン', 'メールリンクでログイン')
  .replace('href="/signout-with-chatgpt"', 'href="#supabase-sign-out"')
  .replace('ローカル確認版 · ChatGPT認証ではありません', 'ロリポップ版 · Supabase認証')
  .replace('<script type="module" src="/client/main.js"></script>', '<script>window.NOCTILUCA_SUPABASE_URL='+JSON.stringify(url)+';window.NOCTILUCA_SUPABASE_ANON_KEY='+JSON.stringify(anon)+';window.NOCTILUCA_API_URL='+JSON.stringify(api)+'</script>\n<script type="module" src="/client/main.js"></script>');
await writeFile('dist-lolipop/index.html', html);
await writeFile('dist-lolipop/.htaccess', 'DirectoryIndex index.html\n<IfModule mod_headers.c>\n  Header set Cache-Control "no-cache"\n</IfModule>\n');
console.log('ロリポップ版を dist-lolipop/ に作成しました。');
