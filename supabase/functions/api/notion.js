// Notion connection (Lolipop edition, signed-in players).
// Pure helpers: the OAuth state, token encryption at rest, the authorize URL and
// reading a data source's columns. Network and database access live in index.ts.
import { fail } from './game/rules.js';

export const NOTION_VERSION = '2026-03-11';
export const NOTION_API = 'https://api.notion.com/v1';
const enc = new TextEncoder(), dec = new TextDecoder();
const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (text) => Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((text.length + 3) % 4)), (c) => c.charCodeAt(0));

// Both the state signature and token encryption derive from NOTION_TOKEN_KEY.
async function keyBytes(secret, purpose) {
  if (typeof secret !== 'string' || secret.length < 32) throw new Error('NOTION_TOKEN_KEY is not configured');
  return new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(`${purpose}:${secret}`)));
}

// The OAuth state names the player who started connecting; Notion hands it back to
// the callback, which has no login header. Signed and short-lived so it can't be forged or reused later.
export async function signState(playerId, secret, now = Date.now()) {
  const body = b64url(enc.encode(JSON.stringify({ p: playerId, e: now + 10 * 60e3, n: b64url(crypto.getRandomValues(new Uint8Array(12))) })));
  const key = await crypto.subtle.importKey('raw', await keyBytes(secret, 'state'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `${body}.${b64url(await crypto.subtle.sign('HMAC', key, enc.encode(body)))}`;
}
export async function verifyState(state, secret, now = Date.now()) {
  if (typeof state !== 'string' || !/^[\w-]+\.[\w-]+$/.test(state)) return null;
  const [body, sig] = state.split('.');
  const key = await crypto.subtle.importKey('raw', await keyBytes(secret, 'state'), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  let ok = false;
  try { ok = await crypto.subtle.verify('HMAC', key, unb64url(sig), enc.encode(body)); } catch { return null; }
  if (!ok) return null;
  let data;
  try { data = JSON.parse(dec.decode(unb64url(body))); } catch { return null; }
  return typeof data?.p === 'string' && Number.isFinite(data.e) && data.e > now ? data.p : null;
}

// Tokens are stored encrypted (AES-GCM); only the Edge Function holds the key.
export async function sealTokens(tokens, secret) {
  const key = await crypto.subtle.importKey('raw', await keyBytes(secret, 'tokens'), 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify({ access: tokens.access, refresh: tokens.refresh })));
  return `${b64url(iv)}.${b64url(data)}`;
}
export async function openTokens(sealed, secret) {
  const [iv, data] = String(sealed).split('.');
  const key = await crypto.subtle.importKey('raw', await keyBytes(secret, 'tokens'), 'AES-GCM', false, ['decrypt']);
  return JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64url(iv) }, key, unb64url(data))));
}

export function authorizeUrl({ clientId, redirectUri, state }) {
  const q = new URLSearchParams({ client_id: clientId, response_type: 'code', owner: 'user', redirect_uri: redirectUri, state });
  return `${NOTION_API}/oauth/authorize?${q}`;
}
export const plain = (rich) => (Array.isArray(rich) ? rich.map((t) => t?.plain_text ?? t?.text?.content ?? '').join('') : '').trim();

// A data source's columns, reduced to what the task sync needs: its title column,
// and the checkbox or status columns that could mean "done".
export function summarizeSource(source) {
  const props = Object.values(source?.properties || {});
  const title = props.find((p) => p.type === 'title');
  const done = props.filter((p) => p.type === 'checkbox' || p.type === 'status').map((p) => {
    if (p.type === 'checkbox') return { id: p.id, name: p.name, type: 'checkbox' };
    const groupOf = new Map();
    for (const g of p.status?.groups || []) for (const id of g.option_ids || []) groupOf.set(id, g.name);
    const options = (p.status?.options || []).map((o) => ({ id: o.id, name: o.name, group: groupOf.get(o.id) || '' }));
    return { id: p.id, name: p.name, type: 'status', options, suggested: options.find((o) => /complete/i.test(o.group))?.id || null };
  });
  return { id: source?.id, name: plain(source?.title) || '無題のデータベース', titleProperty: title ? { id: title.id, name: title.name } : null, done };
}

// Check a chosen mapping against the live columns before saving it.
export function checkMapping(summary, { doneProperty, doneOption }) {
  if (!summary.titleProperty) fail('NOTION_NO_TITLE', 'このデータベースにはタイトルの列がありません。', 409);
  const done = summary.done.find((p) => p.id === doneProperty);
  if (!done) fail('NOTION_BAD_COLUMN', '完了を表す列には、チェックボックスかステータスの列を選んでください。', 409);
  if (done.type === 'status' && !done.options.some((o) => o.id === doneOption)) fail('NOTION_BAD_OPTION', '「完了」にあたるステータスを選んでください。', 409);
  return {
    data_source_id: summary.id, data_source_name: summary.name.slice(0, 200),
    title_property: summary.titleProperty.id,
    done_property: done.id, done_property_name: done.name.slice(0, 200), done_type: done.type,
    done_option: done.type === 'status' ? doneOption : null,
    done_option_name: done.type === 'status' ? done.options.find((o) => o.id === doneOption).name.slice(0, 200) : null,
  };
}

// What the page may see about a connection: never the tokens.
export function connectionView(row, available) {
  if (!row) return { available, connected: false };
  return {
    available, connected: true, workspaceName: row.workspace_name || '',
    source: row.data_source_id ? { id: row.data_source_id, name: row.data_source_name, doneName: row.done_property_name, doneType: row.done_type, doneOptionName: row.done_option_name } : null,
  };
}

// ---- task sync -------------------------------------------------------------
// Rows that are not done yet, by the column the player chose.
export function openTaskFilter(row) {
  return row.done_type === 'checkbox'
    ? { property: row.done_property, checkbox: { equals: false } }
    : { property: row.done_property, status: { does_not_equal: row.done_option_name } };
}
// A task title as a focus task can hold it: one line, at most 120 characters.
export function taskTitle(text) {
  return String(text || '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
}
export function taskFromPage(page, titleProperty) {
  const values = Object.values(page?.properties || {});
  const title = values.find((v) => v?.id === titleProperty) || values.find((v) => v?.type === 'title');
  return { id: page?.id, title: taskTitle(plain(title?.title)) };
}
export function newTaskPage(row, text) {
  const title = taskTitle(text);
  if (!title) fail('BAD_TASK', 'タスクは1〜120文字で入力してください。');
  return { parent: { type: 'data_source_id', data_source_id: row.data_source_id }, properties: { [row.title_property]: { title: [{ type: 'text', text: { content: title } }] } } };
}
export function doneUpdate(row) {
  return { properties: { [row.done_property]: row.done_type === 'checkbox' ? { checkbox: true } : { status: { id: row.done_option } } } };
}
// A page this task may already have made: same title, created after the claim (with a minute's slack for clocks).
export function createdSinceFilter(row, text, since) {
  const after = new Date(Date.parse(since) - 60e3).toISOString();
  return { and: [{ property: row.title_property, title: { equals: taskTitle(text) } }, { timestamp: 'created_time', created_time: { on_or_after: after } }] };
}
