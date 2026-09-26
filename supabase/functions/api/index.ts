import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { checkState, freshState, reduce, viewState, exactKeys, object, GameError, CONTENT_VERSION, SUPPORTED_CONTENT_VERSIONS, WORLDS } from "./game/rules.js";
import data from "./game/content.js";

const jsonHeaders = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" };
const enc = new TextEncoder();
const env = Deno.env.toObject();
const supabaseUrl = env.SUPABASE_URL;
const anonKey = env.SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const origin = env.LOLIPOP_ORIGIN;

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
async function handle(request: Request) {
  const url = new URL(request.url); if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });
  const currentUser = await user(request); if (url.pathname.endsWith("/catalog")) return response({ worlds: WORLDS, topics: data.topics, people: data.npcs.map(({ id, name, role, en, where, detail, coat, hat, world }) => ({ id, name, role, en, where, detail, coat, hat, world })) }, 200, cors());
  if (!currentUser && url.pathname.endsWith("/session")) return response({ authenticated: false, mode: "supabase" }, 200, cors());
  if (!currentUser) return response({ error: { code: "LOGIN_REQUIRED", message: "旅を保存するにはログインしてください。" } }, 401, cors());
  const db = admin(); const row = await journey(db, currentUser.id); const owner = currentUser.id;
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
