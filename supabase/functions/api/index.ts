import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { checkState, freshState, reduce, viewState, exactKeys, object, GameError, CONTENT_VERSION, SUPPORTED_CONTENT_VERSIONS, WORLDS } from "./game/rules.js";
import data from "./game/content.js";
import { DEFAULT_FEEDS, filterHeadlines, jstDay, parseFeed, responseText, sanitizeTalks, talkRequest } from "./passenger-talk.js";
import { JOURNAL_LIMITS, journalCommand, journalDay, journalSummary, journalView } from "./journal.js";
import { journalAiInput, journalAiRequest, journalAiText } from "./journal-ai.js";
import { NOTION_API, NOTION_VERSION, authorizeUrl, checkMapping, connectionView, doneUpdate, newTaskPage, openTaskFilter, openTokens, plain, sealTokens, signState, summarizeSource, taskFromPage, verifyState } from "./notion.js";

const jsonHeaders = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" };
const enc = new TextEncoder();
const env = Deno.env.toObject();
const supabaseUrl = env.SUPABASE_URL;
const anonKey = env.SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const origin = env.LOLIPOP_ORIGIN;
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined;

function response(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...jsonHeaders, ...extra } });
}
function cors() {
  if (!origin) throw new Error("LOLIPOP_ORIGIN is not configured");
  return { "access-control-allow-origin": origin, "access-control-allow-headers": "authorization, content-type, x-noctiluca-client", "access-control-allow-methods": "GET, POST, OPTIONS", "vary": "Origin" };
}
function fail(code: string, message: string, status = 400): never { throw new GameError(code, message, status); }
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (object(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
async function sha(value: string) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(value)))].map((v) => v.toString(16).padStart(2, "0")).join("");
}
async function mac(value: string) {
  if (!env.BACKUP_SIGNING_KEY || env.BACKUP_SIGNING_KEY.length < 32) throw new Error("BACKUP_SIGNING_KEY is not configured");
  const key = await crypto.subtle.importKey("raw", enc.encode(env.BACKUP_SIGNING_KEY), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return [...new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(value)))].map((v) => v.toString(16).padStart(2, "0")).join("");
}
function admin(): SupabaseClient { if (!supabaseUrl || !serviceKey) throw new Error("SUPABASE_CONFIG"); return createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } }); }
async function user(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token || !supabaseUrl || !anonKey) return null;
  const client = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: result } = await client.auth.getUser(token);
  return result.user;
}
async function journey(db: SupabaseClient, playerId: string) {
  const existing = await db.from("journeys").select("player_id,revision,state_json,updated_at").eq("player_id", playerId).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data;
  const state = freshState();
  const player = await db.from("players").upsert({ id: playerId }, { onConflict: "id" });
  if (player.error) throw player.error;
  const created = await db.from("journeys").insert({ player_id: playerId, state_json: state }).select("player_id,revision,state_json,updated_at").single();
  if (created.error && created.error.code !== "23505") throw created.error;
  const reread = await db.from("journeys").select("player_id,revision,state_json,updated_at").eq("player_id", playerId).single();
  if (reread.error) throw reread.error;
  return reread.data;
}
type JourneyRow = { player_id: string; revision: number | string; state_json: Record<string, unknown>; updated_at: string };
function envelope(row: JourneyRow) { return { playerId: row.player_id, revision: Number(row.revision), updatedAt: row.updated_at, state: viewState(checkState(row.state_json), data) }; }
async function body(request: Request) { const raw = await request.text(); if (new TextEncoder().encode(raw).length > 96 * 1024) fail("TOO_LARGE", "送信データが大きすぎます。", 413); let value: unknown = null; try { value = JSON.parse(raw); } catch { /* handled below */ } if (!object(value)) fail("BAD_JSON", "送信内容を読み取れません。"); return value as Record<string, unknown>; }
async function backup(row: JourneyRow, owner: string) {
  const state = checkState(row.state_json); state.activeDialogue = null; state.activeAmbient = null; state.sidequests.active = null;
  const unsigned = { format: "noctiluca-journey", version: 1, owner, contentVersion: CONTENT_VERSION, createdAt: new Date().toISOString(), state };
  return { ...unsigned, signature: await mac(`backup:${canonical(unsigned)}`) };
}
async function restore(document: unknown, owner: string) {
  exactKeys(document, ["format", "version", "owner", "contentVersion", "createdAt", "state", "signature"]);
  const input = document as Record<string, unknown>; const { signature, ...unsigned } = input;
  if (input.format !== "noctiluca-journey" || input.version !== 1 || input.owner !== owner || typeof input.contentVersion !== "string" || !SUPPORTED_CONTENT_VERSIONS.includes(input.contentVersion) || signature !== await mac(`backup:${canonical(unsigned)}`)) fail("BACKUP_INVALID", "このアカウントの有効なバックアップではありません。");
  const state = structuredClone(checkState(input.state)); state.activeDialogue = null; state.activeAmbient = null; state.sidequests.active = null; state.location.atStation = true; state.location.mode = state.narrative.active ? "train" : "station"; state.suspended = true;
  return state;
}
// ---- passenger talk: the day's pool, generated on first demand ----
const talkModel = env.PASSENGER_TALK_MODEL || "gpt-6-luna";
const talkMaxBatches = Math.max(1, Math.min(10, Number(env.PASSENGER_TALK_MAX_BATCHES) || 3));
async function timed(url: string, init: RequestInit, ms: number) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), ms);
  try { return await fetch(url, { ...init, signal: controller.signal }); } finally { clearTimeout(timer); }
}
async function fetchHeadlines() {
  const feeds = (env.PASSENGER_TALK_FEEDS || "").split(",").map((v) => v.trim()).filter(Boolean);
  const titles: string[] = [];
  for (const feed of feeds.length ? feeds : DEFAULT_FEEDS) {
    try { const r = await timed(feed, { headers: { "user-agent": "NOCTILUCA passenger-talk" } }, 8000); if (r.ok) titles.push(...parseFeed(await r.text())); } catch { /* one feed failing is fine */ }
  }
  return filterHeadlines(titles);
}
async function generateTalkBatch(db: SupabaseClient, day: string, batch: number, headlines: string[]) {
  try {
    const todays = headlines.length ? headlines : await fetchHeadlines();
    const r = await timed("https://api.openai.com/v1/responses", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${env.OPENAI_API_KEY}` }, body: JSON.stringify(talkRequest({ model: talkModel, headlines: todays, batch })) }, 120000);
    if (!r.ok) throw new Error(`OPENAI_${r.status} ${(await r.text()).slice(0, 400)}`);
    const talks = sanitizeTalks(JSON.parse(responseText(await r.json()) || "{}"));
    if (!talks.length) throw new Error("NO_TALKS");
    await db.from("passenger_talk_days").update({ last_error: null }).eq("day", day);
    const done = await db.rpc("finish_passenger_talk_batch", { p_day: day, p_batch: batch, p_headlines: todays, p_talks: talks });
    if (done.error) throw done.error;
  } catch (error) {
    const message = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String((error as { message: unknown }).message) : "unknown";
    console.error("NOCTILUCA_PASSENGER_TALK_FAILED", message);
    // Back off for a while so a failing feed or key is not retried on every request.
    await db.from("passenger_talk_days").update({ locked_until: new Date(Date.now() + 10 * 60e3).toISOString(), last_error: message.slice(0, 500) }).eq("day", day);
  }
}
async function passengerTalk(url: URL) {
  const db = admin(), day = jstDay();
  const want = Math.max(1, Math.min(talkMaxBatches, Number(url.searchParams.get("want")) || 1));
  const read = async () => {
    const [d, t] = await Promise.all([
      db.from("passenger_talk_days").select("batches,headlines,locked_until").eq("day", day).maybeSingle(),
      db.from("passenger_talks").select("id,size,tone,lines").eq("day", day).order("id"),
    ]);
    if (d.error) throw d.error; if (t.error) throw t.error;
    return { batches: d.data?.batches ?? 0, headlines: (d.data?.headlines ?? []) as string[], talks: t.data ?? [] };
  };
  const pool = await read();
  let generating = false;
  if (env.OPENAI_API_KEY && pool.batches < want) {
    const claimed = await db.rpc("claim_passenger_talk_batch", { p_day: day, p_want: want, p_max: talkMaxBatches });
    if (claimed.error) throw claimed.error;
    if (typeof claimed.data === "number") {
      generating = true;
      const job = generateTalkBatch(db, day, claimed.data, pool.headlines);
      if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(job); else await job;
    } else generating = pool.batches < want && pool.batches < talkMaxBatches;
  }
  return { day, batches: pool.batches, maxBatches: talkMaxBatches, generating, talks: pool.talks };
}

// ---- work journal: signed-in players only, stored apart from the 64KB journey save ----
const journalColumns = "day,body,entries,updated_at";
const journalAiModel = env.JOURNAL_AI_MODEL || "gpt-6-luna";
const journalAiLimit = Math.max(1, Math.min(20, Number(env.JOURNAL_AI_DAILY_LIMIT) || 3));
async function journalAiStatus(db: SupabaseClient, playerId: string, today: string) {
  const r = await db.from("journal_ai_runs").select("runs").eq("player_id", playerId).eq("day", today).maybeSingle();
  if (r.error) throw r.error;
  return { enabled: !!env.OPENAI_API_KEY, limit: journalAiLimit, remaining: Math.max(0, journalAiLimit - (r.data?.runs ?? 0)) };
}
// Nothing is saved here: the player reads (and may edit) the text before putting it in the memo.
async function organizeJournal(db: SupabaseClient, playerId: string, today: string, day: string, level: string) {
  if (!env.OPENAI_API_KEY) fail("AI_UNAVAILABLE", "AIでの整理は、いまは使えません。", 503);
  const row = await db.from("work_journals").select(journalColumns).eq("player_id", playerId).eq("day", day).maybeSingle();
  if (row.error) throw row.error;
  const input = journalAiInput(journalView(row.data, day), level);
  const claimed = await db.rpc("claim_journal_ai_run", { p_player_id: playerId, p_day: today, p_max: journalAiLimit });
  if (claimed.error) throw claimed.error;
  if (typeof claimed.data !== "number") fail("AI_LIMIT", `AIでの整理は1日${journalAiLimit}回までです。明日またお試しください。`, 429);
  try {
    const r = await timed("https://api.openai.com/v1/responses", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${env.OPENAI_API_KEY}` }, body: JSON.stringify(journalAiRequest({ model: journalAiModel, level, input })) }, 45000);
    if (!r.ok) throw new Error(`OPENAI_${r.status} ${(await r.text()).slice(0, 400)}`);
    const text = journalAiText(level, JSON.parse(responseText(await r.json()) || "{}"));
    if (!text) throw new Error("NO_TEXT");
    return { today, day, level, text, ai: await journalAiStatus(db, playerId, today) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error("NOCTILUCA_JOURNAL_AI_FAILED", message);
    await db.rpc("release_journal_ai_run", { p_player_id: playerId, p_day: today, p_error: message });
    fail("AI_FAILED", "整理できませんでした。少し時間をおいて、もう一度お試しください(回数には数えていません)。", 502);
  }
}
async function journalRoute(request: Request, url: URL, db: SupabaseClient, playerId: string) {
  const path = url.pathname, today = jstDay();
  if (request.method === "GET" && path.endsWith("/journal/day")) {
    const day = journalDay(url.searchParams.get("day"));
    const r = await db.from("work_journals").select(journalColumns).eq("player_id", playerId).eq("day", day).maybeSingle();
    if (r.error) throw r.error;
    return { today, journal: journalView(r.data, day), ai: await journalAiStatus(db, playerId, today) };
  }
  if (request.method === "GET" && path.endsWith("/journal/days")) {
    const before = url.searchParams.get("before");
    let q = db.from("work_journals").select(journalColumns).eq("player_id", playerId).order("day", { ascending: false }).limit(JOURNAL_LIMITS.listDays);
    if (before) q = q.lt("day", journalDay(before));
    const r = await q; if (r.error) throw r.error;
    return { today, days: (r.data ?? []).map(journalSummary), more: (r.data ?? []).length === JOURNAL_LIMITS.listDays };
  }
  if (request.method === "GET" && path.endsWith("/journal/export")) {
    const r = await db.from("work_journals").select(journalColumns).eq("player_id", playerId).order("day", { ascending: true }).limit(5000);
    if (r.error) throw r.error;
    return { format: "noctiluca-work-journal", version: 1, exportedAt: new Date().toISOString(), days: (r.data ?? []).map((row) => journalView(row, row.day)) };
  }
  if (request.method !== "POST" || !path.endsWith("/journal")) return null;
  if (request.headers.get("x-noctiluca-client") !== "1") fail("CSRF", "この画面から操作をやり直してください。", 403);
  const change = journalCommand(await body(request), { id: crypto.randomUUID() });
  if (change.action === "organize" && change.level) return await organizeJournal(db, playerId, today, change.day, change.level);
  if (change.action === "append" && change.entry) {
    const r = await db.rpc("append_work_journal_entry", { p_player_id: playerId, p_day: change.day, p_entry: change.entry });
    if (r.error) { if (r.error.message === "JOURNAL_FULL") fail("JOURNAL_FULL", `1日の記録は${JOURNAL_LIMITS.entries}件までです。`, 409); throw r.error; }
    return { today, entryId: change.entry.id, journal: journalView(r.data, change.day) };
  }
  if (change.action === "note") {
    const r = await db.rpc("set_work_journal_note", { p_player_id: playerId, p_day: change.day, p_entry_id: change.entryId, p_note: change.note });
    if (r.error) { if (r.error.message === "JOURNAL_ENTRY_MISSING") fail("JOURNAL_ENTRY_MISSING", "この記録は見つかりません。日誌を開き直してください。", 404); throw r.error; }
    return { today, journal: journalView(r.data, change.day) };
  }
  if (change.action === "body") {
    const r = await db.from("work_journals").upsert({ player_id: playerId, day: change.day, body: change.body, updated_at: new Date().toISOString() }, { onConflict: "player_id,day" }).select(journalColumns).single();
    if (r.error) throw r.error;
    return { today, journal: journalView(r.data, change.day) };
  }
  if (change.action === "delete-day") {
    const r = await db.from("work_journals").delete().eq("player_id", playerId).eq("day", change.day);
    if (r.error) throw r.error;
    return { today, journal: journalView(null, change.day) };
  }
  const r = await db.from("work_journals").delete().eq("player_id", playerId);
  if (r.error) throw r.error;
  return { today, deleted: true };
}

// ---- Notion connection: each player links their own workspace (public connection, OAuth) ----
const notionClientId = env.NOTION_CLIENT_ID || "", notionClientSecret = env.NOTION_CLIENT_SECRET || "", notionKey = env.NOTION_TOKEN_KEY || "";
const notionReady = () => !!(notionClientId && notionClientSecret && notionKey.length >= 32);
const notionRedirect = () => env.NOTION_REDIRECT_URI || `${supabaseUrl}/functions/v1/api/notion/callback`;
const notionBasic = () => `Basic ${btoa(`${notionClientId}:${notionClientSecret}`)}`;
const notionColumns = "player_id,tokens,bot_id,workspace_id,workspace_name,data_source_id,data_source_name,title_property,done_property,done_property_name,done_type,done_option,done_option_name";
type NotionRow = Record<string, string | null>;
async function notionTokenRequest(body: Record<string, string>) {
  const r = await timed(`${NOTION_API}/oauth/token`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json", authorization: notionBasic() }, body: JSON.stringify(body) }, 15000);
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.access_token) throw new Error(`NOTION_TOKEN_${r.status} ${String(data.error || "").slice(0, 80)}`);
  return data;
}
// Notion sends the browser back here (no login header): the signed state says who it was.
async function notionCallback(url: URL) {
  if (!origin) throw new Error("LOLIPOP_ORIGIN is not configured");
  const back = (result: string) => new Response(null, { status: 302, headers: { location: `${origin}/#notion=${result}`, "cache-control": "no-store" } });
  if (!notionReady()) return back("unavailable");
  const playerId = await verifyState(url.searchParams.get("state"), notionKey);
  if (!playerId) return back("expired");
  if (url.searchParams.get("error")) return back("denied");
  const code = url.searchParams.get("code");
  if (!code) return back("error");
  try {
    const t = await notionTokenRequest({ grant_type: "authorization_code", code, redirect_uri: notionRedirect() });
    const db = admin(), now = new Date().toISOString();
    const previous = await db.from("notion_connections").select("workspace_id").eq("player_id", playerId).maybeSingle();
    if (previous.error) throw previous.error;
    // Reconnecting to the same workspace (e.g. to share more pages) keeps the chosen database.
    const keep = previous.data?.workspace_id === t.workspace_id;
    const row: Record<string, unknown> = { player_id: playerId, tokens: await sealTokens({ access: t.access_token, refresh: t.refresh_token }, notionKey), bot_id: String(t.bot_id), workspace_id: String(t.workspace_id), workspace_name: String(t.workspace_name || "").slice(0, 200), last_error: null, updated_at: now };
    if (!keep) Object.assign(row, { connected_at: now, data_source_id: null, data_source_name: null, title_property: null, done_property: null, done_property_name: null, done_type: null, done_option: null, done_option_name: null });
    const saved = await db.from("notion_connections").upsert(row, { onConflict: "player_id" });
    if (saved.error) throw saved.error;
    return back("connected");
  } catch (error) {
    console.error("NOCTILUCA_NOTION_CONNECT_FAILED", error instanceof Error ? error.message : "unknown");
    return back("error");
  }
}
// Calls the Notion API as the player; an expired access token is refreshed once and saved.
async function notionFetch(db: SupabaseClient, row: NotionRow, path: string, init: RequestInit = {}) {
  let tokens = await openTokens(row.tokens, notionKey);
  const call = () => timed(`${NOTION_API}${path}`, { ...init, headers: { authorization: `Bearer ${tokens.access}`, "notion-version": NOTION_VERSION, "content-type": "application/json", ...(init.headers || {}) } }, 15000);
  let r = await call();
  if (r.status === 401) {
    try {
      const t = await notionTokenRequest({ grant_type: "refresh_token", refresh_token: tokens.refresh });
      tokens = { access: t.access_token, refresh: t.refresh_token };
      const saved = await db.from("notion_connections").update({ tokens: await sealTokens(tokens, notionKey), updated_at: new Date().toISOString() }).eq("player_id", row.player_id);
      if (saved.error) throw saved.error;
    } catch {
      fail("NOTION_REAUTH", "Notionとの連携が切れました。もう一度連携してください。", 401);
    }
    r = await call();
  }
  const data = await r.json().catch(() => ({}));
  if (r.ok) return data;
  await db.from("notion_connections").update({ last_error: `${r.status} ${String(data.code || "")} ${String(data.message || "").slice(0, 300)}` }).eq("player_id", row.player_id);
  if (r.status === 401 || r.status === 403) fail("NOTION_REAUTH", "Notionとの連携が切れました。もう一度連携してください。", 401);
  if (r.status === 404) fail("NOTION_NOT_FOUND", "Notionのデータベースが見つかりません。連携しなおして、使うデータベースを共有してください。", 404);
  if (r.status === 429) fail("NOTION_BUSY", "Notionが混み合っています。少し待ってからお試しください。", 429);
  fail("NOTION_FAILED", "Notionとやりとりできませんでした。少し時間をおいてお試しください。", 502);
}
const notionId = (value: unknown) => typeof value === "string" && /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(value);
async function notionRoute(request: Request, url: URL, db: SupabaseClient, playerId: string) {
  const path = url.pathname, found = await db.from("notion_connections").select(notionColumns).eq("player_id", playerId).maybeSingle();
  if (found.error) throw found.error;
  const row = found.data as NotionRow | null;
  if (request.method === "GET" && path.endsWith("/notion/status")) return connectionView(row, notionReady());
  if (request.method === "GET" && path.endsWith("/notion/sources")) {
    if (!row) fail("NOTION_NOT_CONNECTED", "Notionと連携していません。", 409);
    // Follow Notion's cursor so every shared data source can be picked (capped to keep the request bounded).
    const found: { id: string; title?: unknown; in_trash?: boolean }[] = [];
    let cursor: string | undefined, truncated = false;
    for (let page = 0; ; page++) {
      if (page >= 10) { truncated = true; break; }
      const data = await notionFetch(db, row, "/search", { method: "POST", body: JSON.stringify({ filter: { property: "object", value: "data_source" }, page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }) });
      found.push(...(data.results || []));
      if (!data.has_more || !data.next_cursor) break;
      cursor = data.next_cursor;
    }
    return { truncated, sources: found.filter((s) => !s.in_trash).map((s) => ({ id: s.id, name: plain(s.title) || "無題のデータベース" })) };
  }
  if (request.method === "GET" && path.endsWith("/notion/source")) {
    const id = url.searchParams.get("id");
    if (!row) fail("NOTION_NOT_CONNECTED", "Notionと連携していません。", 409);
    if (!notionId(id)) fail("BAD_INPUT", "データベースを選んでください。");
    return summarizeSource(await notionFetch(db, row, `/data_sources/${id}`));
  }
  const configured = () => { if (!row?.data_source_id) fail("NOTION_NOT_CONFIGURED", "Notionのデータベースを選んでください。", 409); return row; };
  // Open tasks to pick from, most recently edited first.
  if (request.method === "GET" && path.endsWith("/notion/tasks")) {
    const r = configured();
    const data = await notionFetch(db, r, `/data_sources/${r.data_source_id}/query`, { method: "POST", body: JSON.stringify({ filter: openTaskFilter(r), sorts: [{ timestamp: "last_edited_time", direction: "descending" }], page_size: 100 }) });
    return { more: !!data.has_more, tasks: (data.results || []).filter((p: { in_trash?: boolean; is_archived?: boolean }) => !p.in_trash && !p.is_archived).map((p: unknown) => taskFromPage(p, r.title_property)).filter((t: { title: string }) => t.title) };
  }
  if (request.method !== "POST") return null;
  if (request.headers.get("x-noctiluca-client") !== "1") fail("CSRF", "この画面から操作をやり直してください。", 403);
  if (path.endsWith("/notion/tasks/create")) {
    const r = configured(), input = await body(request);
    exactKeys(input, ["text"]);
    const page = await notionFetch(db, r, "/pages", { method: "POST", body: JSON.stringify(newTaskPage(r, (input as Record<string, unknown>).text)) });
    return { pageId: page.id };
  }
  if (path.endsWith("/notion/tasks/complete")) {
    const r = configured(), input = await body(request);
    exactKeys(input, ["pageId"]);
    const pageId = (input as Record<string, unknown>).pageId;
    if (!notionId(pageId)) fail("BAD_INPUT", "Notionのページを確認してください。");
    await notionFetch(db, r, `/pages/${pageId}`, { method: "PATCH", body: JSON.stringify(doneUpdate(r)) });
    return { done: true };
  }
  if (path.endsWith("/notion/start")) {
    if (!notionReady()) fail("NOTION_UNAVAILABLE", "Notion連携は、いまは使えません。", 503);
    return { url: authorizeUrl({ clientId: notionClientId, redirectUri: notionRedirect(), state: await signState(playerId, notionKey) }) };
  }
  if (path.endsWith("/notion/configure")) {
    if (!row) fail("NOTION_NOT_CONNECTED", "Notionと連携していません。", 409);
    const input = await body(request);
    exactKeys(input, ["dataSourceId", "doneProperty", "doneOption"]);
    const { dataSourceId, doneProperty, doneOption } = input as Record<string, unknown>;
    if (!notionId(dataSourceId) || typeof doneProperty !== "string" || (doneOption !== undefined && typeof doneOption !== "string")) fail("BAD_INPUT", "データベースと列を選んでください。");
    const mapping = checkMapping(summarizeSource(await notionFetch(db, row, `/data_sources/${dataSourceId}`)), { doneProperty, doneOption: doneOption as string | undefined });
    const saved = await db.from("notion_connections").update({ ...mapping, last_error: null, updated_at: new Date().toISOString() }).eq("player_id", playerId).select(notionColumns).single();
    if (saved.error) throw saved.error;
    return connectionView(saved.data as NotionRow, notionReady());
  }
  if (path.endsWith("/notion/disconnect")) {
    if (row) {
      // Revoke on Notion's side too; if that fails the stored tokens are still deleted.
      try { const tokens = await openTokens(row.tokens, notionKey); await timed(`${NOTION_API}/oauth/revoke`, { method: "POST", headers: { "content-type": "application/json", authorization: notionBasic() }, body: JSON.stringify({ token: tokens.access }) }, 10000); } catch { /* best effort */ }
      const removed = await db.from("notion_connections").delete().eq("player_id", playerId);
      if (removed.error) throw removed.error;
    }
    return connectionView(null, notionReady());
  }
  return null;
}

async function handle(request: Request) {
  const url = new URL(request.url); if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });
  if (request.method === "GET" && url.pathname.endsWith("/notion/callback")) return await notionCallback(url);
  const currentUser = await user(request); if (url.pathname.endsWith("/catalog")) return response({ worlds: WORLDS, topics: data.topics, people: data.npcs.map(({ id, name, role, en, where, detail, coat, hat, world }) => ({ id, name, role, en, where, detail, coat, hat, world })) }, 200, cors());
  if (request.method === "GET" && url.pathname.endsWith("/passenger-talk")) return response(await passengerTalk(url), 200, cors());
  if (!currentUser && url.pathname.endsWith("/session")) return response({ authenticated: false, mode: "supabase" }, 200, cors());
  if (!currentUser) return response({ error: { code: "LOGIN_REQUIRED", message: "旅を保存するにはログインしてください。" } }, 401, cors());
  const db = admin(); const row = await journey(db, currentUser.id); const owner = currentUser.id;
  if (url.pathname.includes("/notion/")) { const result = await notionRoute(request, url, db, owner); if (result) return response(result, 200, cors()); }
  if (url.pathname.includes("/journal")) { const journal = await journalRoute(request, url, db, owner); if (journal) return response(journal, 200, cors()); }
  if (request.method === "GET" && url.pathname.endsWith("/session")) return response({ authenticated: true, mode: "supabase", ...envelope(row) }, 200, cors());
  if (request.method === "GET" && url.pathname.endsWith("/export")) return response(await backup(row, owner), 200, { ...cors(), "content-disposition": "attachment; filename=\"noctiluca-journey.json\"" });
  if (request.method !== "POST" || !url.pathname.endsWith("/commands")) return response({ error: { code: "NOT_FOUND", message: "そのAPIはありません。" } }, 404, cors());
  if (request.headers.get("x-noctiluca-client") !== "1") return response({ error: { code: "CSRF", message: "この画面から操作をやり直してください。" } }, 403, cors());
  const command = await body(request); exactKeys(command, ["id", "expectedPlayerId", "expectedRevision", "type", "payload"]);
  const input = command as { id: unknown; expectedPlayerId: unknown; expectedRevision: unknown; type: unknown; payload: unknown };
  if (input.expectedPlayerId !== currentUser.id || typeof input.id !== "string" || !/^[a-zA-Z0-9_-]{16,80}$/.test(input.id) || !Number.isSafeInteger(input.expectedRevision) || typeof input.type !== "string" || !object(input.payload)) fail("BAD_INPUT", "送信内容の形式が正しくありません。");
  const typedCommand = input as { id: string; expectedPlayerId: string; expectedRevision: number; type: string; payload: Record<string, unknown> };
  const current = checkState(row.state_json); const result = typedCommand.type === "backup.restore" ? { state: await restore(typedCommand.payload.document, owner), outcome: { restored: true, checkpoint: true } } : reduce(current, typedCommand, data, { now: new Date().toISOString(), token: crypto.randomUUID() });
  const stateJson = result.state; const outcomeJson = result.outcome; if (new TextEncoder().encode(JSON.stringify(stateJson)).length > 64 * 1024) fail("SAVE_TOO_LARGE", "保存容量の上限に達しました。", 409); const committed = await db.rpc("commit_journey_command", { p_player_id: currentUser.id, p_request_id: typedCommand.id, p_request_hash: await sha(canonical({ type: typedCommand.type, payload: typedCommand.payload })), p_expected_revision: typedCommand.expectedRevision, p_state: stateJson, p_outcome: outcomeJson, p_checkpoint: Boolean(result.outcome.checkpoint) });
  if (committed.error) { const code = committed.error.message; if (code === "REVISION_CONFLICT") fail(code, "別の画面で旅が更新されました。最新版を読み込んでください。", 409); if (code === "IDEMPOTENCY_MISMATCH") fail(code, "同じ操作IDに別の内容は送れません。", 409); throw committed.error; }
  return response({ authenticated: true, mode: "supabase", playerId: currentUser.id, revision: Number(committed.data.revision), updatedAt: committed.data.updated_at, state: viewState(checkState(committed.data.state), data), outcome: committed.data.outcome, replayed: committed.data.replayed }, 200, cors());
}
Deno.serve(async (request) => { try { return await handle(request); } catch (error) { if (error instanceof GameError) return response({ error: { code: error.code, message: error.message } }, error.status, cors()); console.error("NOCTILUCA_SUPABASE_API_ERROR", error instanceof Error ? error.message : "unknown"); return response({ error: { code: "SERVER_ERROR", message: "保存を確認できませんでした。再試行してください。" } }, 503, cors()); } });
