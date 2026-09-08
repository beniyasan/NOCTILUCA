import {freshState,checkState,reduce,viewState,stationPeople,WORLDS,GameError,fail,exactKeys,object,CONTENT_VERSION,SUPPORTED_CONTENT_VERSIONS} from '../game/rules.js';
import data from './content.js';
const enc=new TextEncoder();
export async function hash(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value))),v=>v.toString(16).padStart(2,'0')).join('');}
export async function mac(secret,value){
  const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(value))),v=>v.toString(16).padStart(2,'0')).join('');
}
function same(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(object(v))return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v);}
function json(v,status=200,extra={}){return new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff',...extra}});}
function secret(env){if(typeof env.IDENTITY_KEY!=='string'||env.IDENTITY_KEY.length<32)fail('SERVER_CONFIG','保存用のサーバー設定がまだ完了していません。',503);return env.IDENTITY_KEY;}
function originGuard(request){
  const origin=request.headers.get('Origin'),expected=new URL(request.url).origin;
  if(origin!==expected || request.headers.get('X-Noctiluca-Client')!=='1')fail('CSRF','この画面から操作をやり直してください。',403);
  if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))fail('CONTENT_TYPE','JSON形式で送信してください。',415);
}
async function body(request){
  const limit=96*1024;
  if(Number(request.headers.get('Content-Length')||0)>limit)fail('TOO_LARGE','送信データが大きすぎます。',413);
  const reader=request.body?.getReader();if(!reader)fail('BAD_JSON','送信内容がありません。');
  const chunks=[];let length=0;
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>limit){await reader.cancel();fail('TOO_LARGE','送信データが大きすぎます。',413);}chunks.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const b of chunks){bytes.set(b,offset);offset+=b.length;}
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{fail('BAD_JSON','送信内容を読み取れません。');}
}
async function requireDB(env){
  if(!env.DB?.prepare||!env.DB?.batch)fail('DB_NOT_BOUND','D1のDBバインディングが未設定です。',503);
  let m;try{m=await env.DB.prepare('SELECT value FROM app_meta WHERE key=?').bind('schema_version').first();}catch{fail('DB_NOT_READY','データベースの初期化または接続を確認してください。',503);}
  if(m?.value!=='1')fail('DB_SCHEMA','データベースの版が一致しません。更新手順を確認してください。',503);
  return env.DB;
}
async function player(db,key){return db.prepare('SELECT p.id,j.revision,j.state_json,j.updated_at FROM players p JOIN journeys j ON j.player_id=p.id WHERE p.identity_key=?').bind(key).first();}
async function ensurePlayer(db,key){
  let p=await player(db,key);if(p)return p;const now=new Date().toISOString();
  await db.batch([
    db.prepare('INSERT OR IGNORE INTO players(id,identity_key,created_at) VALUES(?,?,?)').bind(crypto.randomUUID(),key,now),
    db.prepare('INSERT OR IGNORE INTO journeys(player_id,schema_version,revision,state_json,updated_at) SELECT id,1,0,?,? FROM players WHERE identity_key=?').bind(JSON.stringify(freshState()),now,key)
  ]);
  p=await player(db,key);if(!p)fail('SAVE_UNAVAILABLE','旅の記録を作れませんでした。',503);return p;
}
function envelope(p){const state=checkState(JSON.parse(p.state_json));return {playerId:p.id,revision:p.revision,updatedAt:p.updated_at,state:viewState(state,data)};}
async function receipt(db,id,requestId){return db.prepare('SELECT request_hash,outcome_json FROM command_receipts WHERE player_id=? AND request_id=?').bind(id,requestId).first();}
async function readBackup(doc,owner,env){
  exactKeys(doc,['format','version','owner','contentVersion','createdAt','state','signature']);
  const {signature,...unsigned}=doc;
  if(doc.format!=='noctiluca-journey'||doc.version!==1||doc.owner!==owner||!SUPPORTED_CONTENT_VERSIONS.includes(doc.contentVersion)||!same(signature,await mac(secret(env),'backup:'+canonical(unsigned))))
    fail('BACKUP_INVALID','このアカウントの有効なバックアップではありません。変更されたファイルは復元できません。');
  const s=structuredClone(checkState(doc.state));s.activeDialogue=null;s.activeAmbient=null;s.sidequests.active=null;
  s.location.atStation=true;s.location.mode=s.narrative.active?'train':'station';s.suspended=true;return s;
}
/** Shared server API; identity must come from a trusted SERVER adapter, never body/query. */
export async function handleApi(request,env,identity,{mode='sites'}={}){
  const url=new URL(request.url),path=url.pathname;
  try{
    if(path.startsWith('/api/')&&url.search)fail('BAD_INPUT','このAPIはクエリパラメータを受け付けません。');
    if(request.method==='GET'&&path==='/api/catalog')return json({worlds:WORLDS,topics:data.topics,people:data.npcs.map(({id,name,role,en,where,detail,coat,hat,world})=>({id,name,role,en,where,detail,coat,hat,world}))});
    if(request.method==='GET'&&path==='/api/session'&&!identity)return json({authenticated:false,mode});
    if(!identity)fail('LOGIN_REQUIRED','旅を保存するにはログインしてください。',401);
    // Only a trusted adapter can supply this string. The database never stores the account ID or email.
    const owner=await mac(secret(env),'identity:'+identity);
    const db=await requireDB(env),p=await ensurePlayer(db,owner);
    if(request.method==='GET'&&path==='/api/session')return json({authenticated:true,mode,...envelope(p)});
    if(request.method==='GET'&&path==='/api/export'){
      const snapshot=checkState(JSON.parse(p.state_json));snapshot.activeDialogue=null;snapshot.activeAmbient=null;snapshot.sidequests.active=null;
      const unsigned={format:'noctiluca-journey',version:1,owner,contentVersion:CONTENT_VERSION,createdAt:new Date().toISOString(),state:snapshot};
      return json({...unsigned,signature:await mac(secret(env),'backup:'+canonical(unsigned))},200,{'Content-Disposition':'attachment; filename="noctiluca-journey.json"'});
    }
    if(request.method!=='POST'||path!=='/api/commands')fail('NOT_FOUND','そのAPIはありません。',404);
    originGuard(request);const c=await body(request);exactKeys(c,['id','expectedPlayerId','expectedRevision','type','payload']);
    if(typeof c.expectedPlayerId!=='string'||c.expectedPlayerId.length>80||typeof c.id!=='string'||!/^[a-zA-Z0-9_-]{16,80}$/.test(c.id)||typeof c.type!=='string'||c.type.length>40||!object(c.payload)||!Number.isSafeInteger(c.expectedRevision)||c.expectedRevision<0)
      fail('BAD_INPUT','操作データの形式が正しくありません。');
    // The authenticated adapter still decides identity. This precondition only prevents
    // an old tab from saving into a different account after a shared-cookie login change.
    if(c.expectedPlayerId!==p.id)fail('ACCOUNT_CHANGED','ログイン中のユーザーが変わりました。サーバーの記録を読み込み直してください。',409);
    const fingerprint=await hash(canonical({type:c.type,payload:c.payload}));
    const previous=await receipt(db,p.id,c.id);
    if(previous){if(previous.request_hash!==fingerprint)fail('IDEMPOTENCY_MISMATCH','同じ操作IDに別の内容は送れません。',409);return json({...envelope(await player(db,owner)),outcome:JSON.parse(previous.outcome_json),replayed:true});}
    if(p.revision!==c.expectedRevision)fail('REVISION_CONFLICT','別の画面で旅が更新されました。最新版を読み込んでください。',409);
    const now=new Date().toISOString();
    const count=await db.prepare('SELECT COUNT(*) AS n FROM command_receipts WHERE player_id=? AND created_at>?').bind(p.id,new Date(Date.now()-60000).toISOString()).first();
    if(count.n>=90)fail('RATE_LIMIT','操作が続いています。少し待ってから再試行してください。',429);
    const current=checkState(JSON.parse(p.state_json));let result;
    if(c.type==='backup.restore'){
      exactKeys(c.payload,['document']);result={state:await readBackup(c.payload.document,owner,env),outcome:{restored:true,checkpoint:true}};
    }else result=reduce(current,c,data,{now,token:crypto.randomUUID()});
    const stateText=JSON.stringify(result.state),outcomeText=JSON.stringify(result.outcome);
    if(enc.encode(stateText).length>64*1024)fail('SAVE_TOO_LARGE','保存容量の上限に達しました。',409);
    const batch=[
      db.prepare('INSERT INTO transaction_guards(player_id,valid) VALUES(?,(SELECT CASE WHEN revision=? THEN 1 ELSE 0 END FROM journeys WHERE player_id=?)) ON CONFLICT(player_id) DO UPDATE SET valid=excluded.valid').bind(p.id,c.expectedRevision,p.id),
      db.prepare('INSERT INTO command_receipts(player_id,request_id,request_hash,expected_revision,outcome_json,created_at) VALUES(?,?,?,?,?,?)').bind(p.id,c.id,fingerprint,c.expectedRevision,outcomeText,now),
      db.prepare('UPDATE journeys SET revision=revision+1,state_json=?,updated_at=? WHERE player_id=? AND revision=?').bind(stateText,now,p.id,c.expectedRevision)
    ];
    if(result.outcome.checkpoint)batch.push(db.prepare('INSERT INTO checkpoints(player_id,revision,state_json,saved_at) VALUES(?,?,?,?) ON CONFLICT(player_id) DO UPDATE SET revision=excluded.revision,state_json=excluded.state_json,saved_at=excluded.saved_at').bind(p.id,c.expectedRevision+1,stateText,now));
    try{await db.batch(batch);}catch(error){
      // The request may have committed while the connection dropped, or another tab won.
      const existing=await receipt(db,p.id,c.id);
      if(existing){if(existing.request_hash!==fingerprint)fail('IDEMPOTENCY_MISMATCH','操作IDが重複しています。',409);return json({...envelope(await player(db,owner)),outcome:JSON.parse(existing.outcome_json),replayed:true});}
      const latest=await player(db,owner);
      if(latest.revision!==c.expectedRevision)fail('REVISION_CONFLICT','別の画面で旅が更新されました。最新版を読み込んでください。',409);
      throw error;
    }
    return json({...envelope(await player(db,owner)),outcome:result.outcome,replayed:false});
  }catch(e){
    if(e instanceof GameError)return json({error:{code:e.code,message:e.message}},e.status);
    // No SQL, identity values, request bodies or secrets are sent back or logged.
    console.error('NOCTILUCA_API_ERROR');return json({error:{code:'SERVER_ERROR',message:'保存を確認できませんでした。再試行してください。'}},503);
  }
}
