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
  .replace(/<p class="privacy-note">[^<]*<\/p>/, '<p class="privacy-note">ログインすると、旅の名前・現在地・会話などの記録を保存します。メールアドレスはログインのためだけに使い、旅の記録には含めません。詳しくは<a href="/privacy.html">プライバシーポリシー</a>と<a href="/terms.html">利用規約</a>をご覧ください。</p>')
  .replace('あなたの旅だけを、ここに残します。</footer>', 'あなたの旅だけを、ここに残します。<span class="legal-links"><a href="/privacy.html">プライバシーポリシー</a> · <a href="/terms.html">利用規約</a></span></footer>')
  .replace('<link rel="stylesheet" href="/client/journey.css">', '<link rel="stylesheet" href="/client/journey.css">\n<link rel="stylesheet" href="/client/legal-links.css">')
  .replace('<script type="module" src="/client/main.js"></script>', '<script>window.NOCTILUCA_SUPABASE_URL='+JSON.stringify(url)+';window.NOCTILUCA_SUPABASE_ANON_KEY='+JSON.stringify(anon)+';window.NOCTILUCA_API_URL='+JSON.stringify(api)+'</script>\n<script type="module" src="/client/main.js"></script>');
if (!html.includes('/privacy.html') || !html.includes('legal-links')) throw new Error('プライバシーポリシーへのリンクを入れられませんでした。テンプレートの変更を確認してください。');
await writeFile('dist-lolipop/index.html', html);
// Privacy policy and terms (Lolipop edition only).
for (const page of ['privacy.html', 'terms.html', 'legal.css']) {
  const text = await readFile(`lolipop/pages/${page}`, 'utf8');
  if (text.includes('[[CONTACT_EMAIL]]')) throw new Error(`lolipop/pages/${page} の問い合わせ先 [[CONTACT_EMAIL]] を実際のアドレスに置き換えてください。`);
  await writeFile(`dist-lolipop/${page}`, text);
}
await writeFile('dist-lolipop/client/legal-links.css', '.legal-links{display:block;margin-top:10px;font-size:11px;letter-spacing:.5px}.legal-links a,.privacy-note a{color:inherit;text-decoration:underline;text-underline-offset:2px}\n');
await writeFile('dist-lolipop/.htaccess', 'DirectoryIndex index.html\n<IfModule mod_headers.c>\n  Header set Cache-Control "no-cache"\n</IfModule>\n');
console.log('ロリポップ版を dist-lolipop/ に作成しました。');
