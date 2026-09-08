import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SQLiteD1} from '../../scripts/sqlite-d1.mjs';
import {handleApi} from '../../src/server/api.js';
import {sitesIdentity} from '../../src/server/worker.js';
const sql=await readFile(new URL('../../migrations/0001_initial.sql',import.meta.url),'utf8');
const secret='test-only-identity-key-not-for-production-00000000000';
async function fixture(path=':memory:'){
 const db=new SQLiteD1(path);await db.exec(sql);return {db,env:{DB:db,IDENTITY_KEY:secret}};
}
async function api(env,who,path='/api/session',payload,headers={}){
 const r=await handleApi(new Request('https://example.chatgpt.site'+path,{method:payload?'POST':'GET',headers:{...(payload?{'Origin':'https://example.chatgpt.site','X-Noctiluca-Client':'1','Content-Type':'application/json'}:{}),...headers},body:payload?JSON.stringify(payload):undefined}),env,who);
 return {status:r.status,body:await r.json(),headers:r.headers};
}
async function user(env,who='alice@example.invalid'){
 let session=(await api(env,who)).body;
 return {who,get session(){return session;},async reload(){session=(await api(env,who)).body;return session;},async send(type,payload={},id=crypto.randomUUID(),revision=session.revision){
  const r=await api(env,who,'/api/commands',{id,expectedPlayerId:session.playerId,expectedRevision:revision,type,payload});if(r.status===200)session={...session,...r.body};return r;
 }};
}
async function ready(env){const u=await user(env);await u.send('profile.set',{name:'夜凪'});await u.send('journey.alight');return u;}

test('guest API reveals no private state; authenticated users are isolated',async()=>{
 const {db,env}=await fixture();try{
  const guest=await api(env,null);assert.equal(guest.status,200);assert.equal(guest.body.authenticated,false);assert.equal(guest.body.state,undefined);
  const a=await user(env),b=await user(env,'bob@example.invalid');assert.notEqual(a.session.playerId,b.session.playerId);
  assert.equal((await a.send('profile.set',{name:'海辺'})).status,200);assert.equal((await b.reload()).state.displayName,'');
  assert.equal((await api(env,null,'/api/export')).status,401);
  assert.equal((await api(env,a.who,'/api/session?playerId='+b.session.playerId)).status,400);
  const rows=await db.prepare('SELECT identity_key FROM players').all();assert.ok(rows.results.every(r=>/^[a-f0-9]{64}$/.test(r.identity_key)));
  assert.ok(!JSON.stringify(a.session).includes(a.who));
 }finally{db.close();}
});
test('server fails closed with absent config or missing migrations; no empty-save reset',async()=>{
 const {db,env}=await fixture();try{
  assert.equal((await api({...env,IDENTITY_KEY:''},'a@x')).status,503);
  const missing=new SQLiteD1();assert.equal((await api({DB:missing,IDENTITY_KEY:secret},'a@x')).status,503);missing.close();
  const u=await ready(env);await db.prepare("UPDATE journeys SET state_json=json_set(state_json,'$.schemaVersion',99) WHERE player_id=?").bind(u.session.playerId).run();
  const r=await api(env,u.who);assert.equal(r.status,409);assert.equal(r.body.error.code,'SAVE_VERSION');
  assert.equal(JSON.parse((await db.prepare('SELECT state_json FROM journeys').first()).state_json).schemaVersion,99);
 }finally{db.close();}
});
test('names validate Unicode, length, empty input, XSS and unexpected payloads',async()=>{
 const {db,env}=await fixture();try{const u=await user(env);
  for(const name of ['', ' '.repeat(4),'<script>','x\ny','a'.repeat(21),'x\u202ey'])assert.equal((await u.send('profile.set',{name})).status,400);
  assert.equal((await u.send('profile.set',{name:'  旅人🌙  '})).body.state.displayName,'旅人🌙');
  assert.equal((await u.send('profile.set',{name:'ok',playerId:'someone-else'})).status,400);
  assert.equal((await u.send('money.set',{value:999999})).status,400);
 }finally{db.close();}
});
test('same-origin and non-simple request protection, invalid JSON types and forged input',async()=>{
 const {db,env}=await fixture();try{const u=await user(env),c={id:crypto.randomUUID(),type:'profile.set',payload:{name:'人'},expectedPlayerId:u.session.playerId,expectedRevision:0};
  assert.equal((await api(env,u.who,'/api/commands',c,{Origin:'https://evil.invalid'})).status,403);
  assert.equal((await api(env,u.who,'/api/commands',c,{'X-Noctiluca-Client':''})).status,403);
  assert.equal((await api(env,u.who,'/api/commands',c,{'Content-Type':'text/plain'})).status,415);
  assert.equal((await api(env,u.who,'/api/commands',{...c,owner:'b'})).status,400);
  assert.equal((await api(env,u.who,'/api/commands',{...c,payload:[]})).status,400);
 }finally{db.close();}
});
test('journey location, disembarkation and suspended mode have validated transitions',async()=>{
 const {db,env}=await fixture();try{const u=await ready(env);
  assert.equal((await u.send('travel.arrive',{world:'scrap'})).status,409);
  assert.equal((await u.send('journey.checkpoint')).body.state.suspended,true);
  assert.equal((await u.send('dialogue.start',{npc:'mei',topic:'greeting'})).body.error.code,'SUSPENDED');
  assert.equal((await u.send('journey.resume')).body.state.location.mode,'station');
  assert.equal((await u.send('journey.board')).status,200);assert.equal((await u.send('station.depart')).status,200);
  assert.equal((await u.send('journey.alight')).status,409);
  assert.equal((await u.send('travel.arrive',{world:'invalid'})).status,400);
  assert.equal((await u.send('travel.arrive',{world:'scrap'})).status,200);await u.send('journey.alight');
  assert.equal((await u.send('dialogue.start',{npc:'mei',topic:'greeting'})).status,409);
  assert.equal((await u.send('dialogue.start',{npc:'oru',topic:'greeting'})).status,200);
 }finally{db.close();}
});
test('dialogue start is not completion; notes are granted once by server completion',async()=>{
 const {db,env}=await fixture();try{const u=await ready(env);
  assert.equal((await u.send('dialogue.start',{npc:'mei',topic:'trade'})).status,409);
  let r=await u.send('dialogue.start',{npc:'mei',topic:'greeting'});const greeting=r.body.outcome.dialogue;
  assert.ok(greeting.lines[0].text.includes('窓際'));await u.send('dialogue.complete',{sessionId:greeting.sessionId});
  r=await u.send('dialogue.start',{npc:'mei',topic:'trade'});assert.equal(r.body.outcome.dialogue.id,'mei-trade');assert.equal(r.body.state.notes.length,0);
  const id=crypto.randomUUID();r=await u.send('dialogue.complete',{sessionId:r.body.outcome.dialogue.sessionId},id);
  assert.deepEqual(r.body.state.notes,['mei-power']);assert.equal(r.body.state.actors.mei.completed.length,1);
  assert.equal((await u.send('dialogue.complete',{sessionId:'fake-session'})).status,409);
  await u.send('journey.checkpoint');await u.send('journey.resume');
  assert.equal((await u.reload()).state.actors.mei.met,true);assert.deepEqual(u.session.state.notes,['mei-power']);
 }finally{db.close();}
});
test('idempotent retry survives newer revisions and rejects ID reuse with changed payload',async()=>{
 const {db,env}=await fixture();try{const u=await user(env),id=crypto.randomUUID();
  const one=await u.send('profile.set',{name:'あさ'},id);await u.send('profile.set',{name:'よる'});
  const two=await u.send('profile.set',{name:'あさ'},id,0);
  assert.equal(two.status,200);assert.equal(two.body.replayed,true);assert.equal(two.body.state.displayName,'よる');assert.equal(two.body.revision,2);
  assert.equal((await u.send('profile.set',{name:'べつ'},id,0)).body.error.code,'IDEMPOTENCY_MISMATCH');
 }finally{db.close();}
});
test('concurrent tabs cannot overwrite one another; receipt revision guard rolls back',async()=>{
 const {db,env}=await fixture();try{const u=await user(env);const rev=u.session.revision;
  const both=await Promise.all([u.send('profile.set',{name:'先'},crypto.randomUUID(),rev),u.send('profile.set',{name:'後'},crypto.randomUUID(),rev)]);
  assert.deepEqual(both.map(r=>r.status).sort(),[200,409]);assert.equal((await u.reload()).revision,1);
  assert.equal((await db.prepare('SELECT COUNT(*) n FROM command_receipts').first()).n,1);
 }finally{db.close();}
});
test('manual checkpoint error does not partially write journey or receipt',async()=>{
 const {db,env}=await fixture();try{const u=await ready(env),rev=u.session.revision;
  await db.exec("CREATE TRIGGER fail_checkpoint BEFORE INSERT ON checkpoints BEGIN SELECT RAISE(ABORT,'TEST_FAILURE'); END;");
  const r=await u.send('journey.checkpoint');assert.equal(r.status,503);assert.equal((await u.reload()).revision,rev);assert.equal(u.session.state.suspended,false);
  assert.equal((await db.prepare('SELECT COUNT(*) n FROM command_receipts').first()).n,rev);
 }finally{db.close();}
});
test('backup signatures, owner isolation, tamper rejection and restoration',async()=>{
 const {db,env}=await fixture();try{const a=await ready(env),b=await user(env,'bob@example.invalid');await b.send('profile.set',{name:'別人'});
  const backup=(await api(env,a.who,'/api/export')).body;
  assert.equal((await b.send('backup.restore',{document:backup})).status,400);
  const tampered=structuredClone(backup);tampered.state.displayName='改変';assert.equal((await a.send('backup.restore',{document:tampered})).status,400);
  await a.send('profile.set',{name:'別名'});const restored=await a.send('backup.restore',{document:backup});assert.equal(restored.status,200);assert.equal(restored.body.state.displayName,'夜凪');assert.equal(restored.body.state.suspended,true);
 }finally{db.close();}
});
test('legacy import is explicit, whitelisted, single-use, and does not grant affinity',async()=>{
 const {db,env}=await fixture();try{const u=await user(env);await u.send('profile.set',{name:'移行'});
  const m={schema:1,notes:['mei-power','UNKNOWN','mei-power'],heard:['s-reuse','bad'],actors:{mei:{count:99999}},plays:{'mei-trade':99999},money:999999};
  const r=await u.send('legacy.import',{memory:m});assert.equal(r.status,200);assert.deepEqual(r.body.state.notes,['mei-power']);assert.deepEqual(r.body.state.completed,{});assert.equal(r.body.state.actors.mei.meetings,1);assert.equal(r.body.state.money,undefined);
  assert.equal((await u.send('legacy.import',{memory:m})).status,409);
 }finally{db.close();}
});
test('reloading SQLite after process lifetime preserves state and schema migration is re-runnable',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'ncl-test-')),path=join(dir,'data.db');let f=await fixture(path);const u=await ready(f.env);await u.send('journey.checkpoint');const old=await u.reload();f.db.close();
 f=await fixture(path);try{const r=await api(f.env,u.who);assert.equal(r.status,200);assert.equal(r.body.playerId,old.playerId);assert.equal(r.body.state.displayName,'夜凪');assert.equal(r.body.state.location.mode,'station');assert.equal(r.body.state.suspended,true);assert.equal(r.body.revision,old.revision);}finally{f.db.close();await rm(dir,{recursive:true,force:true});}
});
test('Sites identity adapter requires explicit trust boundary and exact origin',()=>{
 const req=new Request('https://ncl.chatgpt.site/api/session',{headers:{'oai-authenticated-user-email':'a@example.invalid'}});
 assert.throws(()=>sitesIdentity(req,{}));assert.throws(()=>sitesIdentity(req,{SITES_AUTH_TRUSTED:'true',SITE_ORIGIN:'https://other.example'}));
 assert.equal(sitesIdentity(req,{SITES_AUTH_TRUSTED:'true',SITE_ORIGIN:'https://ncl.chatgpt.site'}),'a@example.invalid');
 assert.equal(sitesIdentity(new Request(req.url),{SITES_AUTH_TRUSTED:'true',SITE_ORIGIN:'https://ncl.chatgpt.site'}),null);
});
test('stale tab cannot save into a newly signed-in account even if revisions match',async()=>{
 const {db,env}=await fixture();try{
  const a=await user(env),b=await user(env,'bob@example.invalid');
  const c={id:crypto.randomUUID(),expectedPlayerId:a.session.playerId,expectedRevision:0,type:'profile.set',payload:{name:'古い画面'}};
  const r=await api(env,b.who,'/api/commands',c);assert.equal(r.status,409);assert.equal(r.body.error.code,'ACCOUNT_CHANGED');
  assert.equal((await b.reload()).state.displayName,'');assert.equal((await a.reload()).state.displayName,'');
 }finally{db.close();}
});
test('every station has eligible ambient speech; only completed exchanges enter the notebook',async()=>{
 const {db,env}=await fixture();try{
  const u=await user(env);await u.send('profile.set',{name:'車窓'});
  for(const world of ['kowloon','scrap','pelagic','gorge','jade','relay']){
   assert.equal((await u.send('travel.arrive',{world})).status,200);
   const r=await u.send('ambient.next');assert.equal(r.status,200);const e=r.body.outcome.ambient;assert.equal(e.world,world);
   assert.ok(!r.body.state.heard.includes(e.id));if(world==='relay')assert.equal(e.channel,'machine');
   const completed=await u.send('ambient.complete',{sessionId:e.sessionId});assert.ok(completed.body.state.heard.includes(e.id));
   assert.equal((await u.send('ambient.complete',{sessionId:e.sessionId})).body.error.code,'AMBIENT_MISMATCH');
  }
 }finally{db.close();}
});
test('settings use a closed schema and can be changed while suspended',async()=>{
 const {db,env}=await fixture();try{const u=await ready(env);await u.send('journey.checkpoint');
  assert.equal((await u.send('settings.set',{stopDuration:45,density:'quiet',auto:false})).status,200);
  for(const bad of [{stopDuration:0},{auto:'false'},{speed:999},{unknown:true}])assert.equal((await u.send('settings.set',bad)).status,400);
  assert.equal(u.session.state.suspended,true);
 }finally{db.close();}
});

test('timer preferences persist per user in D1 and survive reload',async()=>{
 const {db,env}=await fixture();try{
  const a=await user(env),b=await user(env,'timer-b');await a.send('profile.set',{name:'窓辺'});
  assert.equal((await a.send('settings.set',{travelSeconds:1500,focusSeconds:1500,breakSeconds:300,longBreakSeconds:900,longBreakEvery:4,arrivalBell:true,bellVolume:55,musicTrack:'amber',musicVolume:42,focusGoal:'資料の構成を3つ書く'})).status,200);
  assert.equal((await a.reload()).state.settings.travelSeconds,1500);assert.equal(a.session.state.settings.musicTrack,'amber');assert.equal(a.session.state.settings.musicVolume,42);assert.equal(a.session.state.settings.focusGoal,'資料の構成を3つ書く');assert.equal((await b.reload()).state.settings.focusGoal,'');assert.equal((await b.reload()).state.settings.travelSeconds,null);
  assert.equal((await a.send('settings.set',{travelSeconds:10})).status,400);assert.equal((await a.reload()).state.settings.travelSeconds,1500);
 }finally{db.close();}
});

test('reset is explicit, atomic, player-scoped and retry-safe; backups and revision history remain usable',async()=>{
 const {db,env}=await fixture();try{
  const a=await ready(env);
  const other=await user(env,'other-reset-user');await other.send('profile.set',{name:'別の旅'});const otherBefore=structuredClone(other.session.state);
  await a.reload();await a.send('settings.set',{musicVolume:12,travelSeconds:240});await a.send('dialogue.start',{npc:'mei',topic:'greeting'});await a.send('dialogue.close');
  await a.send('journey.checkpoint');const before=structuredClone(a.session),backup=(await api(env,a.who,'/api/export')).body;
  for(const payload of [{},{confirmation:false},{confirmation:'reset-journey',cash:999}])assert.equal((await a.send('journey.reset',payload)).status,400);
  assert.deepEqual((await a.reload()).state,before.state);
  const id=crypto.randomUUID();await db.exec("CREATE TRIGGER fail_reset BEFORE INSERT ON checkpoints BEGIN SELECT RAISE(ABORT,'reset test'); END;");
  assert.equal((await a.send('journey.reset',{confirmation:'reset-journey'},id)).status,503);assert.deepEqual((await a.reload()).state,before.state);assert.equal(a.session.revision,before.revision);
  await db.exec('DROP TRIGGER fail_reset;');
  const reset=await a.send('journey.reset',{confirmation:'reset-journey'},id);assert.equal(reset.status,200);assert.equal(reset.body.outcome.reset,true);assert.equal(reset.body.playerId,before.playerId);assert.equal(reset.body.revision,before.revision+1);
  assert.equal(reset.body.state.displayName,'夜凪');assert.deepEqual(reset.body.state.settings,before.state.settings);assert.equal(reset.body.state.suspended,false);assert.equal(reset.body.state.commerce.cash,120);assert.deepEqual(reset.body.state.actors,{});assert.deepEqual(reset.body.state.notes,[]);assert.deepEqual(reset.body.state.location,{world:'kowloon',mode:'train',atStation:true});
  const journey=await db.prepare('SELECT state_json FROM journeys WHERE player_id=?').bind(a.session.playerId).first(),checkpoint=await db.prepare('SELECT state_json,revision FROM checkpoints WHERE player_id=?').bind(a.session.playerId).first();assert.equal(checkpoint.state_json,journey.state_json);assert.equal(checkpoint.revision,a.session.revision);
  assert.deepEqual((await other.reload()).state,otherBefore);
  const forged=await api(env,other.who,'/api/commands',{id:crypto.randomUUID(),expectedPlayerId:a.session.playerId,expectedRevision:a.session.revision,type:'journey.reset',payload:{confirmation:'reset-journey'}});assert.equal(forged.status,409);
  assert.equal((await api(env,null,'/api/commands',{id:crypto.randomUUID(),type:'journey.reset',payload:{confirmation:'reset-journey'}})).status,401);
  assert.equal((await a.send('profile.set',{name:'古いタブ'},crypto.randomUUID(),before.revision)).status,409);
  await a.send('profile.set',{name:'新しい旅'});const progressed=structuredClone(a.session.state);
  const replay=await a.send('journey.reset',{confirmation:'reset-journey'},id,before.revision);assert.equal(replay.body.replayed,true);assert.deepEqual(replay.body.state,progressed);
  const staleReset=await a.send('journey.reset',{confirmation:'reset-journey'},crypto.randomUUID(),before.revision);assert.equal(staleReset.status,409);assert.deepEqual((await a.reload()).state,progressed);
  const restored=await a.send('backup.restore',{document:backup});assert.equal(restored.status,200);assert.deepEqual(restored.body.state.actors,before.state.actors);assert.equal(restored.body.state.displayName,'夜凪');
 }finally{db.close();}
});

test('timer tasks persist per player, commit only once, roll back on failure and survive restore',async()=>{
 const {db,env}=await fixture();try{
  const a=await ready(env),b=await user(env,'task-b');await a.send('journey.board');
  const oldRev=a.session.revision,id=crypto.randomUUID();let r=await a.send('focus.task.add',{text:'  構成を考える  '},id);assert.equal(r.status,200);assert.deepEqual(r.body.state.focusTasks,[{id,text:'構成を考える'}]);
  assert.equal((await a.send('focus.task.add',{text:'  構成を考える  '},id,oldRev)).body.replayed,true);assert.equal(a.session.state.focusTasks.length,1);
  const literal='<img src=x onerror=alert(1)>';assert.equal((await a.send('focus.task.add',{text:literal})).status,200);assert.equal((await a.reload()).state.focusTasks[1].text,literal);assert.deepEqual((await b.reload()).state.focusTasks,[]);
  for(const payload of [{text:''},{text:5},{text:'a'.repeat(121)},{text:'a\nb'},{text:'test',id:'forged'}])assert.equal((await a.send('focus.task.add',payload)).status,400);
  const backup=(await api(env,a.who,'/api/export')).body,before=structuredClone(a.session),doneId=crypto.randomUUID();
  await db.exec("CREATE TRIGGER fail_task BEFORE INSERT ON checkpoints BEGIN SELECT RAISE(ABORT,'task test'); END;");
  assert.equal((await a.send('focus.task.complete',{id},doneId)).status,503);assert.deepEqual((await a.reload()).state.focusTasks,before.state.focusTasks);
  await db.exec('DROP TRIGGER fail_task;');assert.equal((await a.send('focus.task.complete',{id},doneId)).status,200);assert.equal(a.session.state.focusTasks.length,1);
  assert.equal((await a.send('focus.task.complete',{id},doneId,before.revision)).body.replayed,true);assert.equal(a.session.state.focusTasks.length,1);
  assert.equal((await b.send('focus.task.complete',{id})).status,409);
  assert.equal((await a.send('focus.task.add',{text:'古い画面'},crypto.randomUUID(),before.revision)).status,409);
  assert.equal((await a.send('backup.restore',{document:backup})).status,200);assert.deepEqual(a.session.state.focusTasks,before.state.focusTasks);
  await a.send('journey.reset',{confirmation:'reset-journey'});assert.deepEqual(a.session.state.focusTasks,[]);
  for(let n=0;n<20;n++)assert.equal((await a.send('focus.task.add',{text:'作業 '+n})).status,200);
  assert.equal((await a.send('focus.task.add',{text:'21件目'})).status,409);assert.equal((await a.reload()).state.focusTasks.length,20);
 }finally{db.close();}
});
