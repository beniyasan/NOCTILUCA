import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SQLiteD1} from '../../scripts/sqlite-d1.mjs';
import {handleApi,mac} from '../../src/server/api.js';
import {freshState,PREVIOUS_CONTENT_VERSION} from '../../src/game/rules.js';
const schema=await readFile('migrations/0001_initial.sql','utf8');
async function fixture(){const db=new SQLiteD1();await db.exec(schema);return {db,env:{DB:db,IDENTITY_KEY:'test-only-commerce-secret-never-use-for-production'}};}
async function actor(env,who='user-a'){
 let snapshot;
 async function request(path='/api/session',body){const response=await handleApi(new Request('https://game.test'+path,{method:body?'POST':'GET',headers:{Origin:'https://game.test','Content-Type':'application/json','X-Noctiluca-Client':'1'},body:body?JSON.stringify(body):undefined}),env,who);return {status:response.status,body:await response.json()};}
 async function reload(){snapshot=(await request()).body;return snapshot;}
 async function send(type,payload={},id=crypto.randomUUID(),revision=snapshot.revision){const c={id,type,payload,expectedPlayerId:snapshot.playerId,expectedRevision:revision};const r=await request('/api/commands',c);if(r.status===200)snapshot=r.body;return {...r,c};}
 async function ok(type,payload={}){const r=await send(type,payload);assert.equal(r.status,200,JSON.stringify(r.body));return r.body;}
 async function talk(npc,topic='trade'){await ok('dialogue.start',{npc,topic:'greeting'});await ok('dialogue.complete',{sessionId:snapshot.outcome.dialogue.sessionId});await ok('dialogue.start',{npc,topic});await ok('dialogue.complete',{sessionId:snapshot.outcome.dialogue.sessionId});}
 async function go(world){if(snapshot.state.location.mode==='station')await ok('journey.board');await ok('travel.arrive',{world});if(!snapshot.state.location.atStation)await ok('station.stop');await ok('journey.alight');}
 await reload();return {get s(){return snapshot;},ok,send,talk,go,reload,request};
}
async function prepared(env){const a=await actor(env);await a.ok('profile.set',{name:'旅人'});await a.ok('journey.alight');await a.talk('mei');await a.talk('ren');await a.go('scrap');await a.talk('oru');return a;}
for(const buyer of ['mei','ren'])test(buyer+': one box, correct proceeds, installation only after another world, stable save and dialogue',async()=>{
 const {db,env}=await fixture();try{const a=await prepared(env);await a.ok('trade.buy',{buyer});assert.equal(a.s.state.commerce.cash,40);assert.equal(a.s.state.commerce.cargo,buyer);
  assert.equal((await a.send('trade.buy',{buyer})).status,409);await a.go('kowloon');
  assert.equal((await a.send('trade.sell',{buyer:buyer==='mei'?'ren':'mei'})).status,409);
  const sold=await a.send('trade.sell',{buyer});assert.equal(sold.status,200);assert.equal(a.s.state.commerce.cash,buyer==='mei'?140:156);assert.equal(a.s.state.commerce.cargo,null);assert.equal(a.s.state.commerce.installations[buyer],'pending');
  const replay=await a.request('/api/commands',sold.c);assert.equal(replay.body.replayed,true);assert.equal(replay.body.state.commerce.transactions.length,2);
  assert.equal((await a.send('trade.sell',{buyer})).status,409);await a.ok('journey.checkpoint');await a.reload();assert.equal(a.s.state.commerce.installations[buyer],'pending');await a.ok('journey.resume');
  await a.go('kowloon');assert.equal(a.s.state.commerce.installations[buyer],'pending');
  await a.go('jade');await a.go('kowloon');assert.equal(a.s.state.commerce.installations[buyer],'installed');
  const other=buyer==='mei'?'ren':'mei';assert.equal(a.s.state.commerce.installations[other],'none');
  await a.ok('dialogue.start',{npc:buyer,topic:'trade'});assert.equal(a.s.outcome.dialogue.id,buyer+'-installed');await a.ok('dialogue.complete',{sessionId:a.s.outcome.dialogue.sessionId});
  await a.ok('journey.checkpoint');await a.reload();assert.equal(a.s.state.commerce.installations[buyer],'installed');
  const b=await actor(env,'user-b');assert.equal(b.s.state.commerce.cash,120);assert.equal(b.s.state.commerce.firstBuyer,null);
  await a.ok('journey.resume');const cash=a.s.state.commerce.cash;await a.talk(buyer);assert.equal(a.s.state.commerce.cash,cash);
 }finally{db.close();}
});
test('requirements complete only after listening; no purchase causes no change; unsold box can be returned and reselected',async()=>{
 const {db,env}=await fixture();try{const a=await actor(env);await a.ok('profile.set',{name:'夜'});await a.ok('journey.alight');
  await a.ok('dialogue.start',{npc:'mei',topic:'greeting'});await a.ok('dialogue.close');await a.ok('dialogue.start',{npc:'mei',topic:'trade'});assert.equal(a.s.state.commerce.known.mei,false);await a.ok('dialogue.close');
  for(const w of ['scrap','kowloon','jade','kowloon'])await a.go(w);assert.equal(a.s.state.commerce.cash,120);assert.equal(a.s.state.commerce.firstBuyer,null);
  await a.talk('mei');await a.talk('ren');await a.go('scrap');await a.talk('oru');
  assert.equal((await a.send('trade.buy',{buyer:'mei',cost:0})).status,400);
  await a.ok('trade.buy',{buyer:'mei'});await a.ok('trade.return');assert.equal(a.s.state.commerce.cash,120);assert.equal(a.s.state.commerce.firstBuyer,null);assert.equal(a.s.state.commerce.installations.mei,'none');assert.equal((await a.send('trade.return')).status,409);await a.ok('trade.buy',{buyer:'ren'});assert.equal(a.s.state.commerce.cargo,'ren');
 }finally{db.close();}
});
test('trade checkpoint failure rolls back money, cargo and receipt; racing buy tabs cannot duplicate cargo',async()=>{
 const {db,env}=await fixture();try{const a=await prepared(env);const before=a.s;
  db.sqlite.exec("CREATE TRIGGER fail_checkpoint BEFORE INSERT ON checkpoints BEGIN SELECT RAISE(ABORT,'test'); END;");
  const failed=await a.send('trade.buy',{buyer:'mei'});assert.equal(failed.status,503);await a.reload();assert.equal(a.s.revision,before.revision);assert.equal(a.s.state.commerce.cash,120);assert.equal(a.s.state.commerce.cargo,null);
  db.sqlite.exec('DROP TRIGGER fail_checkpoint');const revision=a.s.revision;
  const r=await Promise.all([a.send('trade.buy',{buyer:'mei'},crypto.randomUUID(),revision),a.send('trade.buy',{buyer:'ren'},crypto.randomUUID(),revision)]);assert.deepEqual(r.map(x=>x.status).sort(),[200,409]);await a.reload();assert.equal(a.s.state.commerce.cash,40);assert.equal(a.s.state.commerce.transactions.length,1);
 }finally{db.close();}
});
test('Phase 2B state and signed backup migrate without losing name, notebook or resetting funds on subsequent loads',async()=>{
 const {db,env}=await fixture();try{const a=await actor(env);const old=freshState();old.displayName='以前の旅';old.contentVersion=PREVIOUS_CONTENT_VERSION;delete old.commerce;old.notes=['mei-power'];old.location.mode='station';
  await db.prepare('UPDATE journeys SET state_json=? WHERE player_id=?').bind(JSON.stringify(old),a.s.playerId).run();await a.reload();assert.equal(a.s.state.displayName,'以前の旅');assert.deepEqual(a.s.state.notes,['mei-power']);assert.equal(a.s.state.commerce.known.mei,false);assert.equal(a.s.state.commerce.cash,120);
  const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
  const doc={format:'noctiluca-journey',version:1,owner:await mac(env.IDENTITY_KEY,'identity:user-a'),contentVersion:PREVIOUS_CONTENT_VERSION,createdAt:new Date().toISOString(),state:old};doc.signature=await mac(env.IDENTITY_KEY,'backup:'+canonical(doc));
  await a.ok('backup.restore',{document:doc});assert.equal(a.s.state.commerce.cash,120);assert.equal(a.s.state.displayName,'以前の旅');
  await a.ok('journey.resume');await a.talk('mei');await a.talk('ren');await a.go('scrap');await a.talk('oru');await a.ok('trade.buy',{buyer:'mei'});await a.reload();assert.equal(a.s.state.commerce.cash,40);
 }finally{db.close();}
});

async function afterFirstTrade(env,buyer){
 const a=await prepared(env);await a.ok('trade.buy',{buyer});await a.go('kowloon');await a.ok('trade.sell',{buyer});await a.go('jade');await a.go('kowloon');return a;
}
async function finishTradeTalk(a,npc){
 await a.ok('dialogue.start',{npc,topic:'trade'});const id=a.s.outcome.dialogue.id;
 await a.ok('dialogue.complete',{sessionId:a.s.outcome.dialogue.sessionId});return id;
}
for(const buyer of ['mei','ren'])for(const choice of ['sold','declined'])test(`2D ${buyer}/${choice}: meaningful conversations, choice, scenery and persistent outcome`,async()=>{
 const {db,env}=await fixture();try{
  const a=await afterFirstTrade(env,buyer);
  // Travel alone never unlocks the second chapter; opening and abandoning is not completion.
  await a.go('scrap');await a.go('kowloon');assert.equal(a.s.state.commerce.followup.available,false);
  await a.ok('dialogue.start',{npc:buyer,topic:'trade'});await a.ok('dialogue.close');assert.equal(a.s.state.commerce.followup.observed,false);
  assert.equal(await finishTradeTalk(a,buyer),buyer+'-installed');
  await a.go('kowloon');assert.equal(a.s.state.commerce.followup.available,false);
  await a.go('jade');await a.go('kowloon');assert.equal(a.s.state.commerce.followup.available,true);
  if(buyer==='mei'){assert.equal(a.s.state.tradeView.scene.tableOpen,false);assert.equal(a.s.state.commerce.installations.mei,'installed');}
  assert.equal((await a.send('followup.buy')).status,409);
  await a.ok('dialogue.start',{npc:buyer,topic:'trade'});assert.equal(a.s.outcome.dialogue.id,buyer+'-circumstances');await a.ok('dialogue.close');assert.equal(a.s.state.commerce.followup.heard,false);
  assert.equal(await finishTradeTalk(a,buyer),buyer+'-circumstances');
  await a.ok('followup.decide',{decision:'considering'});await a.ok('journey.checkpoint');await a.reload();assert.equal(a.s.state.commerce.followup.decision,'considering');assert.equal(a.s.state.story.chapter,'second-choice');await a.ok('journey.resume');
  if(choice==='sold'){
   await a.go('scrap');assert.equal((await a.send('followup.buy')).status,409);assert.equal(await finishTradeTalk(a,'oru'),'oru-follow-'+buyer);
   assert.equal((await a.send('followup.buy',{price:0})).status,400);
   const buy=await a.send('followup.buy');assert.equal(buy.status,200);const money=buyer==='mei'?108:116;assert.equal(a.s.state.commerce.cash,money);
   const replay=await a.request('/api/commands',buy.c);assert.equal(replay.body.replayed,true);assert.equal(replay.body.state.commerce.cash,money);
   await a.go('kowloon');assert.equal((await a.send('followup.decide',{decision:'declined'})).status,409);
   await a.ok('followup.sell');assert.equal(a.s.state.commerce.cash,buyer==='mei'?152:172);assert.equal(a.s.state.commerce.followup.delivery,'pending');
   await a.go('kowloon');assert.equal(a.s.state.commerce.followup.delivery,'pending');await a.go('jade');await a.go('kowloon');
   assert.equal(a.s.state.commerce.followup.delivery,'installed');assert.equal(await finishTradeTalk(a,buyer),buyer+'-second-result');assert.equal(a.s.state.tradeView.scene[buyer==='mei'?'trays':'hood'],true);
  }else{
   const before=a.s.state.commerce.cash;const declined=await a.send('followup.decide',{decision:'declined'});assert.equal(declined.status,200);
   assert.equal((await a.request('/api/commands',declined.c)).body.replayed,true);assert.equal(a.s.state.commerce.cash,before);
   assert.equal(await finishTradeTalk(a,buyer),buyer+'-declined');assert.equal(a.s.state.tradeView.scene.trays,false);assert.equal(a.s.state.tradeView.scene.hood,false);
   assert.equal((await a.send('followup.buy')).status,409);
  }
  assert.equal(a.s.state.story.chapter,'ending-ready');await a.ok('journey.checkpoint');await a.reload();assert.equal(a.s.state.commerce.followup.resultHeard,true);assert.equal(a.s.state.commerce.followup.decision,choice);await a.ok('journey.resume');
  assert.equal(await finishTradeTalk(a,buyer),buyer+(choice==='sold'?'-after-memory':'-after-declined'));
  const b=await actor(env,'other-person');assert.equal(b.s.state.commerce.followup.heard,false);assert.equal(b.s.state.commerce.cash,120);
 }finally{db.close();}
});
test('2D: failed purchase fully rolls back; return permits a different decision; stale tab cannot buy twice',async()=>{
 const {db,env}=await fixture();try{const a=await afterFirstTrade(env,'mei');await finishTradeTalk(a,'mei');await a.go('scrap');await a.go('kowloon');await finishTradeTalk(a,'mei');await a.go('scrap');await finishTradeTalk(a,'oru');
  const before=a.s;db.sqlite.exec("CREATE TRIGGER fail_checkpoint BEFORE INSERT ON checkpoints BEGIN SELECT RAISE(ABORT,'test'); END;");
  assert.equal((await a.send('followup.buy')).status,503);await a.reload();assert.equal(a.s.revision,before.revision);assert.equal(a.s.state.commerce.cash,140);assert.equal(a.s.state.commerce.followup.cargo,false);
  db.sqlite.exec('DROP TRIGGER fail_checkpoint');const revision=a.s.revision;
  const race=await Promise.all([a.send('followup.buy',{},crypto.randomUUID(),revision),a.send('followup.buy',{},crypto.randomUUID(),revision)]);assert.deepEqual(race.map(x=>x.status).sort(),[200,409]);await a.reload();
  await a.ok('followup.return');assert.equal(a.s.state.commerce.cash,140);assert.equal(a.s.state.commerce.followup.cargo,false);await a.go('kowloon');await a.ok('followup.decide',{decision:'declined'});assert.equal(a.s.state.commerce.followup.decision,'declined');
 }finally{db.close();}
});
test('2C migration preserves funds and first-use completion, but does not invent circumstances or an extra revisit',async()=>{
 const {db,env}=await fixture();try{
  const a=await afterFirstTrade(env,'ren');await finishTradeTalk(a,'ren');const old=structuredClone(a.s.state);delete old.tradeView;delete old.noteDetails;delete old.heardDetails;old.contentVersion='phase2c-2026-09-07';old.commerce.version=1;delete old.commerce.followup;
  await db.prepare('UPDATE journeys SET state_json=? WHERE player_id=?').bind(JSON.stringify(old),a.s.playerId).run();await a.reload();assert.equal(a.s.state.commerce.cash,156);assert.equal(a.s.state.commerce.followup.observed,true);assert.equal(a.s.state.commerce.followup.available,false);assert.equal(a.s.state.commerce.followup.heard,false);
  await a.ok('journey.checkpoint');await a.reload();assert.equal(a.s.state.commerce.cash,156);
  const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
  const doc={format:'noctiluca-journey',version:1,owner:await mac(env.IDENTITY_KEY,'identity:user-a'),contentVersion:old.contentVersion,createdAt:new Date().toISOString(),state:old};doc.signature=await mac(env.IDENTITY_KEY,'backup:'+canonical(doc));
  await a.ok('backup.restore',{document:doc});assert.equal(a.s.state.commerce.cash,156);assert.equal(a.s.state.commerce.followup.observed,true);
 }finally{db.close();}
});

for(const buyer of ['mei','ren'])for(const choice of ['sold','declined'])test(`2E ${buyer}/${choice}: ending matches actual choice, resumes mid-page, stays completed`,async()=>{
 const {db,env}=await fixture();try{
  const a=await actor(env);const state=freshState();state.displayName='窓際';state.contentVersion='phase2d-2026-09-07';delete state.narrative;
  const c=state.commerce;c.firstBuyer=buyer;c.cash=buyer==='mei'?(choice==='sold'?152:140):(choice==='sold'?172:156);c.installations[buyer]='installed';c.known={mei:true,ren:true};c.supplierKnown=true;
  Object.assign(c.followup,{observed:true,available:true,heard:true,resultHeard:true,decision:choice,delivery:choice==='sold'?'installed':'none'});state.story.chapter='ending-ready';
  c.transactions=[{type:'trade.buy',item:'電源',amount:-80},{type:'trade.sell',item:'電源',amount:buyer==='mei'?100:116}];if(choice==='sold')c.transactions.push({type:'followup.buy',item:buyer==='mei'?'トレー':'フード',amount:buyer==='mei'?-32:-40},{type:'followup.sell',item:buyer==='mei'?'トレー':'フード',amount:buyer==='mei'?44:56});
  await db.prepare('UPDATE journeys SET state_json=? WHERE player_id=?').bind(JSON.stringify(state),a.s.playerId).run();await a.reload();assert.equal(a.s.state.narrative.introSeen,true);assert.equal(a.s.state.storyView.ready,true);
  await a.ok('story.start',{kind:'ending'});assert.equal(a.s.state.storyView.active.page,0);assert.equal((await a.send('trade.buy',{buyer})).status,409);
  await a.ok('story.next');await a.reload();assert.equal(a.s.state.storyView.active.page,1);assert.equal(a.s.state.narrative.endingSeen,false);assert.equal(a.s.state.storyView.page.ledger.length,choice==='sold'?4:2);
  const line=a.s.state.storyView.page.lines[1];assert.equal(line.includes('今回は扱わない'),choice==='declined');
  await a.ok('story.next');const ended=await a.send('story.next');assert.equal(ended.status,200);assert.equal(a.s.state.location.atStation,false);assert.equal(a.s.state.narrative.endingSeen,true);assert.equal(a.s.state.story.chapter,'chapter-two');
  assert.equal((await a.request('/api/commands',ended.c)).body.replayed,true);await a.reload();assert.equal(a.s.state.storyView.active,null);assert.equal(a.s.state.storyView.ready,false);assert.equal((await a.send('story.start',{kind:'ending'})).status,409);
  const b=await actor(env,'other');assert.equal(b.s.state.narrative.endingSeen,false);
  const doc=(await a.request('/api/export')).body;await a.ok('backup.restore',{document:doc});assert.equal(a.s.state.narrative.endingSeen,true);await a.ok('journey.resume');
  // Existing goods remain tradable for the other buyer; the finished ending never changes.
  const other=buyer==='mei'?'ren':'mei',remembered=structuredClone(a.s.state.narrative.ending);await a.go('scrap');await a.ok('trade.buy',{buyer:other});await a.go('kowloon');await a.ok('trade.sell',{buyer:other});await a.go('jade');await a.go('kowloon');assert.equal(a.s.state.commerce.installations[other],'installed');assert.equal(a.s.state.commerce.firstBuyer,buyer);assert.deepEqual(a.s.state.narrative.ending,remembered);assert.equal(a.s.state.story.chapter,'chapter-two');
 }finally{db.close();}
});
test('2E prologue and failure: completed pages save atomically, premature endings are rejected',async()=>{
 const {db,env}=await fixture();try{const a=await actor(env);await a.ok('profile.set',{name:'夜'});assert.equal((await a.send('story.start',{kind:'ending'})).status,409);await a.ok('story.start',{kind:'intro'});await a.ok('story.next');await a.reload();assert.equal(a.s.state.storyView.active.page,1);
  await a.ok('story.next');db.sqlite.exec("CREATE TRIGGER fail_checkpoint BEFORE INSERT ON checkpoints BEGIN SELECT RAISE(ABORT,'test'); END;");assert.equal((await a.send('story.next')).status,503);await a.reload();assert.equal(a.s.state.narrative.introSeen,false);assert.equal(a.s.state.storyView.active.page,2);db.sqlite.exec('DROP TRIGGER fail_checkpoint');await a.ok('story.next');assert.equal(a.s.state.narrative.introSeen,true);assert.equal(a.s.state.commerce.cash,120);
 }finally{db.close();}
});

async function chapterTwoPrepared(env,options={}){
 const a=await actor(env);const s=freshState();s.contentVersion='phase2e-2026-09-07';s.displayName='続きの旅';delete s.chapterTwo;
 s.commerce.firstBuyer='mei';s.commerce.cash=140;s.commerce.known={mei:true,ren:true};s.commerce.supplierKnown=true;s.commerce.installations.mei='installed';
 Object.assign(s.commerce.followup,{observed:true,available:true,heard:true,resultHeard:true,decision:'declined'});
 s.narrative={version:1,introSeen:true,endingSeen:true,active:null,ending:{route:'mei-declined',line:'以前の帳面の一行',last:'以前の会話',cash:140,ledger:[],scene:'以前の車窓'}};
 s.story.chapter='daily-life';Object.assign(s.narrative,options);
 await env.DB.prepare('UPDATE journeys SET state_json=? WHERE player_id=?').bind(JSON.stringify(s),a.s.playerId).run();await a.reload();return a;
}
for(const item of ['small','large','declined'])test('chapter two '+item+': old ending continues; use, choice, journal and atomic D1 save persist',async()=>{
 const {db,env}=await fixture();try{
  const a=await chapterTwoPrepared(env);assert.equal(a.s.state.story.chapter,'chapter-two');assert.equal(a.s.state.narrative.ending.line,'以前の帳面の一行');assert.equal(a.s.state.narrative.finalEndingSeen,false);assert.equal(a.s.state.storyView.ready,false);
  await a.go('pelagic');await a.talk('nagi');assert.equal(a.s.state.chapterTwo.supplyHeard,true);
  assert.equal((await a.send('chapter2.buy',{item:'small'})).status,409);await a.go('gorge');await a.ok('dialogue.start',{npc:'toma',topic:'greeting'});await a.ok('dialogue.close');await a.ok('dialogue.start',{npc:'toma',topic:'trade'});await a.ok('dialogue.close');assert.equal(a.s.state.chapterTwo.needsHeard,false);
  await a.talk('toma');await a.ok('chapter2.decide',{decision:'considering'});await a.ok('journey.checkpoint');await a.reload();assert.equal(a.s.state.chapterTwo.decision,'considering');assert.equal(a.s.state.chapterTwo.resultHeard,false);await a.ok('journey.resume');
  if(item==='declined'){
   await a.ok('chapter2.decide',{decision:'declined'});assert.equal(a.s.state.commerce.cash,140);assert.equal(a.s.state.chapterTwo.delivery,'none');assert.equal(a.s.state.chapterTwo.resultHeard,false);await a.talk('toma');
   await a.go('pelagic');assert.equal((await a.send('chapter2.buy',{item:'small'})).status,409);await a.go('gorge');
  }else{
   await a.go('pelagic');assert.equal((await a.send('chapter2.buy',{item,cost:0})).status,400);const buy=await a.send('chapter2.buy',{item});assert.equal(buy.status,200);assert.equal((await a.request('/api/commands',buy.c)).body.replayed,true);assert.equal(a.s.state.tradeView.cargoItem.id,item);
   await a.go('gorge');const before=a.s.state.commerce.cash;
   db.sqlite.exec("CREATE TRIGGER fail_checkpoint BEFORE INSERT ON checkpoints BEGIN SELECT RAISE(ABORT,'test'); END;");assert.equal((await a.send('chapter2.sell')).status,503);await a.reload();assert.equal(a.s.state.commerce.cash,before);assert.equal(a.s.state.chapterTwo.cargo,item);assert.equal(a.s.state.chapterTwo.delivery,'none');db.sqlite.exec('DROP TRIGGER fail_checkpoint');
   const sale=await a.send('chapter2.sell');assert.equal(sale.status,200);assert.equal((await a.request('/api/commands',sale.c)).body.replayed,true);assert.equal(a.s.state.commerce.cash,item==='small'?156:158);assert.equal(a.s.state.chapterTwo.delivery,'pending');
   await a.go('gorge');assert.equal(a.s.state.chapterTwo.delivery,'pending');await a.go('pelagic');await a.go('gorge');assert.equal(a.s.state.chapterTwo.delivery,'installed');assert.equal(a.s.state.chapterTwo.resultHeard,false);await a.talk('toma');
   assert.match(a.s.state.chapterTwoView.scene,item==='small'?/小型/:/大型/);assert.equal((await a.send('chapter2.sell')).status,409);
  }
  assert.equal(a.s.state.chapterTwo.resultHeard,true);assert.equal(a.s.state.story.chapter,'chapter-three');const remembered=structuredClone(a.s.state.chapterTwo);await a.ok('journey.checkpoint');await a.reload();assert.deepEqual(a.s.state.chapterTwo,remembered);assert.ok(a.s.state.noteDetails.some(n=>n.id==='chapter-two-result'));
  const backup=(await a.request('/api/export')).body;await a.ok('backup.restore',{document:backup});assert.deepEqual(a.s.state.chapterTwo,remembered);
  const b=await actor(env,'different-user');assert.equal(b.s.state.chapterTwoView.unlocked,false);assert.equal(b.s.state.chapterTwo.delivery,'none');
 }finally{db.close();}
});
test('chapter two shared shelf, refund and migration midway through chapter one retain exact progress',async()=>{
 const {db,env}=await fixture();try{
  const a=await chapterTwoPrepared(env,{endingSeen:false,active:{kind:'ending',page:1}});assert.equal(a.s.state.storyView.active.page,1);assert.equal(a.s.state.chapterTwoView.unlocked,false);await a.ok('story.next');await a.ok('story.next');
  await a.go('gorge');await a.talk('toma');await a.go('pelagic');await a.talk('nagi');await a.ok('chapter2.buy',{item:'large'});
  await a.go('scrap');assert.equal((await a.send('trade.buy',{buyer:'ren'})).body.error.code,'CARGO_FULL');await a.go('pelagic');await a.ok('chapter2.return');assert.equal(a.s.state.commerce.cash,140);assert.equal(a.s.state.chapterTwo.decision,'considering');
  await a.go('scrap');await a.ok('trade.buy',{buyer:'ren'});await a.go('pelagic');assert.equal((await a.send('chapter2.buy',{item:'small'})).body.error.code,'CARGO_FULL');await a.go('scrap');await a.ok('trade.return');await a.go('pelagic');await a.ok('chapter2.buy',{item:'small'});assert.equal(a.s.state.commerce.cash,92);
 }finally{db.close();}
});

async function chapterThreePrepared(env,buyer='mei',choice='small'){
 const a=await chapterTwoPrepared(env);
 const s=JSON.parse((await env.DB.prepare('SELECT state_json FROM journeys WHERE player_id=?').bind(a.s.playerId).first()).state_json);
 // A real previous-release shape: first/second chapter progress is already durable.
 s.contentVersion='chapter2-2026-09-07';s.commerce.firstBuyer=buyer;s.commerce.installations={mei:buyer==='mei'?'installed':'none',ren:buyer==='ren'?'installed':'none'};
 s.narrative.finalEndingSeen=false;s.narrative.ending.route=buyer+'-declined';
 s.chapterTwo={version:1,needsHeard:true,supplyHeard:true,decision:choice==='declined'?'declined':'sold',cargo:null,chosen:choice==='declined'?null:choice,delivery:choice==='declined'?'none':'installed',away:true,resultHeard:true};
 s.commerce.cash=choice==='small'?156:choice==='large'?158:140;delete s.chapterThree;
 await env.DB.prepare('UPDATE journeys SET state_json=? WHERE player_id=?').bind(JSON.stringify(s),a.s.playerId).run();await a.reload();return a;
}
for(const route of ['ask','leave','declined'])test('chapter three '+route+': migrated journey, buyer autonomy and return to first buyer',async()=>{
 const {db,env}=await fixture();try{
  const a=await chapterThreePrepared(env,route==='leave'?'ren':'mei',route==='declined'?'declined':'small');const firstBuyer=a.s.state.commerce.firstBuyer;
  assert.equal(a.s.state.chapterThreeView.unlocked,true);assert.equal(a.s.state.chapterTwo.resultHeard,true);assert.equal(a.s.state.narrative.ending.line,'以前の帳面の一行');
  await a.go('jade');assert.equal((await a.send('chapter3.observe')).status,409);await a.talk('sui');await a.ok('chapter3.decide',{decision:'considering'});assert.equal(a.s.state.chapterThree.resolved,false);
  if(route==='declined'){
   const cash=a.s.state.commerce.cash;await a.ok('chapter3.decide',{decision:'declined'});await a.talk('sui');assert.equal(a.s.state.commerce.cash,cash);assert.equal(a.s.state.chapterThree.delivery,'none');assert.equal((await a.send('chapter3.respond',{choice:'ask'})).status,409);assert.match(a.s.state.chapterThreeView.note,/今回は扱わない/);
  }else{
   await a.go('scrap');await a.talk('oru');assert.equal(a.s.state.chapterThree.supplyHeard,true);assert.equal((await a.send('chapter3.buy',{cost:0})).status,400);await a.ok('chapter3.buy');await a.ok('chapter3.return');assert.equal(a.s.state.commerce.cash,156);
   const buy=await a.send('chapter3.buy');assert.equal(buy.status,200);assert.equal(a.s.state.commerce.cash,112);assert.equal((await a.request('/api/commands',buy.c)).body.replayed,true);
   await a.go('jade');const sale=await a.send('chapter3.sell');assert.equal(sale.status,200);assert.equal((await a.request('/api/commands',sale.c)).body.replayed,true);assert.equal(a.s.state.commerce.cash,172);assert.equal(a.s.state.chapterThree.delivery,'pending');
   await a.go('jade');assert.equal(a.s.state.chapterThree.delivery,'pending');await a.go('kowloon');await a.go('jade');assert.equal(a.s.state.chapterThree.delivery,'installed');assert.equal(a.s.state.chapterThree.observed,false);assert.match(a.s.state.chapterThreeView.scene,/手袋/);
   await a.ok('chapter3.observe');assert.match(a.s.state.noteDetails.find(n=>n.id==='chapter-three-result').body,/まだ聞いていない/);assert.match(a.s.state.chapterThreeView.scene,/手袋/);await a.ok('chapter3.respond',{choice:'considering'});await a.ok('journey.checkpoint');await a.reload();assert.equal(a.s.state.chapterThree.response,'considering');assert.equal(a.s.state.chapterThree.resolved,false);await a.ok('journey.resume');
   if(route==='ask'){
    await a.ok('chapter3.respond',{choice:'ask'});await a.ok('dialogue.start',{npc:'sui',topic:'trade'});assert.equal(a.s.outcome.dialogue.id,'sui-reason');await a.ok('dialogue.close');assert.equal(a.s.state.chapterThree.reasonHeard,false);
    await a.talk('sui');assert.equal(a.s.state.chapterThree.reasonHeard,true);assert.match(a.s.state.chapterThreeView.note,/日差し/);
   }else{await a.ok('chapter3.respond',{choice:'leave'});assert.equal(a.s.state.chapterThree.reasonHeard,false);await a.talk('sui');assert.equal(a.s.state.chapterThree.reasonHeard,false);assert.match(a.s.state.chapterThreeView.note,/理由をたずねず/);assert.doesNotMatch(a.s.state.chapterThreeView.note,/強い日差し/);}
  }
  assert.equal(a.s.state.chapterThree.resolved,true);assert.equal(a.s.state.chapterThree.returnHeard,false);
  await a.go('kowloon');await a.talk(firstBuyer);assert.equal(a.s.state.chapterThree.returnHeard,true);assert.equal(a.s.state.story.chapter,'chapter-four');assert.equal(a.s.state.narrative.finalEndingSeen,false);
  const state=structuredClone(a.s.state.chapterThree);await a.ok('journey.checkpoint');await a.reload();assert.deepEqual(a.s.state.chapterThree,state);
  const backup=(await a.request('/api/export')).body;await a.ok('backup.restore',{document:backup});assert.deepEqual(a.s.state.chapterThree,state);
  const b=await actor(env,'third-other');assert.equal(b.s.state.chapterThreeView.unlocked,false);assert.equal(b.s.state.chapterThree.returnHeard,false);
 }finally{db.close();}
});
test('chapter three: shared shelf and failed write leave money, equipment and observation untouched',async()=>{
 const {db,env}=await fixture();try{
  const a=await chapterThreePrepared(env);await a.go('jade');await a.talk('sui');await a.go('scrap');await a.talk('oru');
  await a.ok('trade.buy',{buyer:'ren'});assert.equal((await a.send('chapter3.buy')).body.error.code,'CARGO_FULL');await a.ok('trade.return');
  db.sqlite.exec("CREATE TRIGGER fail_checkpoint BEFORE INSERT ON checkpoints BEGIN SELECT RAISE(ABORT,'test'); END;");assert.equal((await a.send('chapter3.buy')).status,503);await a.reload();assert.equal(a.s.state.commerce.cash,156);assert.equal(a.s.state.chapterThree.cargo,false);db.sqlite.exec('DROP TRIGGER fail_checkpoint');
  await a.ok('chapter3.buy');assert.equal((await a.send('trade.buy',{buyer:'ren'})).body.error.code,'CARGO_FULL');await a.go('jade');await a.ok('chapter3.sell');await a.go('gorge');await a.go('jade');
  db.sqlite.exec("CREATE TRIGGER fail_checkpoint BEFORE INSERT ON checkpoints BEGIN SELECT RAISE(ABORT,'test'); END;");assert.equal((await a.send('chapter3.observe')).status,503);await a.reload();assert.equal(a.s.state.chapterThree.observed,false);assert.equal(a.s.state.chapterThree.delivery,'installed');db.sqlite.exec('DROP TRIGGER fail_checkpoint');
  await a.ok('chapter3.observe');await a.ok('chapter3.respond',{choice:'leave'});assert.equal((await a.send('chapter3.respond',{choice:'ask'})).status,409);
 }finally{db.close();}
});

test('chapter two release migrates in-flight cargo and unfinished dialogue without unlocking chapter three',async()=>{
 const {db,env}=await fixture();try{
  const a=await chapterTwoPrepared(env);await a.go('gorge');await a.talk('toma');await a.go('pelagic');await a.talk('nagi');await a.ok('chapter2.buy',{item:'large'});await a.ok('dialogue.start',{npc:'nagi',topic:'city'});
  const s=JSON.parse((await db.prepare('SELECT state_json FROM journeys WHERE player_id=?').bind(a.s.playerId).first()).state_json);s.contentVersion='chapter2-2026-09-07';delete s.chapterThree;
  await db.prepare('UPDATE journeys SET state_json=? WHERE player_id=?').bind(JSON.stringify(s),a.s.playerId).run();await a.reload();assert.deepEqual(a.s.state.chapterTwo,s.chapterTwo);assert.equal(a.s.state.commerce.cash,104);assert.equal(a.s.state.tradeView.cargoItem.id,'large');assert.equal(a.s.state.chapterThreeView.unlocked,false);
  await a.ok('dialogue.complete',{sessionId:s.activeDialogue.sessionId});await a.go('gorge');await a.ok('chapter2.sell');assert.equal(a.s.state.commerce.cash,158);assert.equal(a.s.state.chapterThreeView.unlocked,false);
 }finally{db.close();}
});

async function chapterFourPrepared(env,previousChoice='leave'){
 const a=await chapterThreePrepared(env);await a.ok('profile.set',{name:'返事のない仕事'});
 const s=JSON.parse((await env.DB.prepare('SELECT state_json FROM journeys WHERE player_id=?').bind(a.s.playerId).first()).state_json);s.contentVersion='chapter3-2026-09-07';delete s.chapterFour;
 Object.assign(s.chapterThree,{needsHeard:true,supplyHeard:previousChoice!=='declined',decision:previousChoice==='declined'?'declined':'sold',delivery:previousChoice==='declined'?'none':'installed',observed:previousChoice!=='declined',observedVisit:previousChoice==='declined'?null:1,response:previousChoice==='declined'?'undecided':'leave',resolved:true,returnHeard:true});
 s.commerce.cash=previousChoice==='declined'?156:172;
 await env.DB.prepare('UPDATE journeys SET state_json=? WHERE player_id=?').bind(JSON.stringify(s),a.s.playerId).run();await a.reload();return a;
}
test('chapter four delivery: no NPC, atomic receipt/payment, next-visit operation, persistent observation',async()=>{
 const {db,env}=await fixture();try{
  const a=await chapterFourPrepared(env),previous=structuredClone(a.s.state.chapterThree);assert.equal(a.s.state.chapterFourView.unlocked,true);assert.equal(a.s.state.story.chapter,'chapter-four');
  assert.equal((await a.send('chapter4.read')).status,409);await a.go('relay');assert.equal((await a.send('chapter4.buy')).status,409);assert.equal((await a.send('dialogue.start',{npc:'relay-terminal',topic:'greeting'})).status,409);
  await a.ok('chapter4.read');assert.equal(a.s.state.commerce.cash,172);assert.ok(a.s.state.noteDetails.some(n=>n.id==='relay-order'));await a.ok('chapter4.decide',{decision:'considering'});await a.ok('journey.checkpoint');await a.reload();assert.equal(a.s.state.chapterFour.decision,'considering');assert.equal(a.s.state.chapterFour.observed,false);await a.ok('journey.resume');
  await a.go('scrap');await a.talk('oru');assert.equal(a.s.state.chapterFour.supplyHeard,true);assert.equal((await a.send('chapter4.buy',{cost:0})).status,400);await a.ok('chapter4.buy');assert.equal(a.s.state.commerce.cash,144);await a.ok('chapter4.return');assert.equal(a.s.state.commerce.cash,172);await a.ok('chapter4.buy');
  await a.go('relay');db.sqlite.exec("CREATE TRIGGER fail_checkpoint BEFORE INSERT ON checkpoints BEGIN SELECT RAISE(ABORT,'test'); END;");const before=a.s.state.commerce.transactions.length;assert.equal((await a.send('chapter4.sell')).status,503);await a.reload();assert.equal(a.s.state.commerce.cash,144);assert.equal(a.s.state.chapterFour.cargo,true);assert.equal(a.s.state.chapterFour.receipt,null);assert.equal(a.s.state.commerce.transactions.length,before);db.sqlite.exec('DROP TRIGGER fail_checkpoint');
  const sale=await a.send('chapter4.sell');assert.equal(sale.status,200);assert.equal(a.s.state.commerce.cash,182);assert.equal(a.s.state.chapterFour.receipt.amount,38);assert.equal(a.s.state.chapterFour.receipt.transactionId,sale.c.id);assert.equal((await a.request('/api/commands',sale.c)).body.replayed,true);assert.equal((await a.send('chapter4.sell')).status,409);
  const receipt=structuredClone(a.s.state.chapterFour.receipt);await a.reload();assert.equal(a.s.state.chapterFour.delivery,'pending');assert.equal((await a.send('chapter4.observe')).status,409);await a.go('relay');assert.equal(a.s.state.chapterFour.delivery,'pending');await a.go('jade');await a.go('relay');assert.equal(a.s.state.chapterFour.delivery,'installed');assert.equal(a.s.state.chapterFour.observed,false);assert.match(a.s.state.chapterFourView.status,/R88-01/);
  const observed=await a.send('chapter4.observe');assert.equal(observed.status,200);assert.equal((await a.request('/api/commands',observed.c)).body.replayed,true);assert.equal(a.s.state.story.chapter,'chapter-four-complete');assert.equal(a.s.state.narrative.finalEndingSeen,false);assert.deepEqual(a.s.state.chapterThree,previous);assert.deepEqual(a.s.state.chapterFour.receipt,receipt);
  await a.ok('journey.checkpoint');await a.reload();assert.equal(a.s.state.chapterFour.observed,true);const doc=(await a.request('/api/export')).body;await a.ok('backup.restore',{document:doc});assert.equal(a.s.state.commerce.cash,182);assert.deepEqual(a.s.state.chapterFour.receipt,receipt);
  const b=await actor(env,'relay-other');assert.equal(b.s.state.chapterFourView.unlocked,false);assert.equal(b.s.state.chapterFour.receipt,null);assert.equal(b.s.state.commerce.cash,120);
 }finally{db.close();}
});
test('chapter four decline: no receipt, no payment, no supplied part invented',async()=>{
 const {db,env}=await fixture();try{
  const a=await chapterFourPrepared(env,'declined');await a.go('relay');await a.ok('chapter4.read');await a.ok('chapter4.decide',{decision:'declined'});assert.equal(a.s.state.chapterFour.observed,false);assert.equal(a.s.state.chapterFour.receipt,null);assert.equal(a.s.state.chapterFour.delivery,'none');assert.match(a.s.state.chapterFourView.status,/現行部品/);
  await a.ok('chapter4.observe');assert.equal(a.s.state.story.chapter,'chapter-four-complete');assert.match(a.s.state.chapterFourView.note,/今回は扱わない/);assert.equal(a.s.state.commerce.cash,156);assert.equal(a.s.state.chapterFour.supplyHeard,false);
  assert.equal((await a.send('chapter4.decide',{decision:'considering'})).status,409);await a.go('scrap');assert.equal((await a.send('chapter4.buy')).status,409);await a.go('relay');await a.ok('journey.checkpoint');await a.reload();assert.equal(a.s.state.chapterFour.receipt,null);assert.equal(a.s.state.chapterFour.observed,true);
 }finally{db.close();}
});
test('chapter four shares cargo and conflicts protect against two simultaneous purchases',async()=>{
 const {db,env}=await fixture();try{
  const a=await chapterFourPrepared(env);await a.go('relay');await a.ok('chapter4.read');await a.go('scrap');await a.talk('oru');
  await a.ok('trade.buy',{buyer:'ren'});assert.equal((await a.send('chapter4.buy')).body.error.code,'CARGO_FULL');await a.ok('trade.return');
  const revision=a.s.revision;const both=await Promise.all([a.send('chapter4.buy',{},crypto.randomUUID(),revision),a.send('chapter4.buy',{},crypto.randomUUID(),revision)]);assert.deepEqual(both.map(r=>r.status).sort(),[200,409]);await a.reload();assert.equal(a.s.state.commerce.cash,144);assert.equal(a.s.state.chapterFour.cargo,true);assert.equal((await a.send('trade.buy',{buyer:'ren'})).body.error.code,'CARGO_FULL');
 }finally{db.close();}
});
test('third-chapter save in an unfinished conversation keeps its progress and locks the relay until return',async()=>{
 const {db,env}=await fixture();try{
  const a=await chapterThreePrepared(env);await a.go('jade');await a.talk('sui');await a.go('scrap');await a.talk('oru');await a.ok('chapter3.buy');await a.go('jade');await a.ok('chapter3.sell');await a.go('gorge');await a.go('jade');await a.ok('chapter3.observe');await a.ok('chapter3.respond',{choice:'ask'});await a.ok('dialogue.start',{npc:'sui',topic:'trade'});
  const s=JSON.parse((await db.prepare('SELECT state_json FROM journeys WHERE player_id=?').bind(a.s.playerId).first()).state_json);s.contentVersion='chapter3-2026-09-07';delete s.chapterFour;
  await db.prepare('UPDATE journeys SET state_json=? WHERE player_id=?').bind(JSON.stringify(s),a.s.playerId).run();await a.reload();assert.deepEqual(a.s.state.chapterThree,s.chapterThree);assert.equal(a.s.state.chapterFourView.unlocked,false);assert.equal((await a.send('chapter4.read')).status,409);
  await a.ok('dialogue.complete',{sessionId:s.activeDialogue.sessionId});assert.equal(a.s.state.chapterThree.reasonHeard,true);assert.equal(a.s.state.chapterFourView.unlocked,false);await a.go('kowloon');await a.talk('mei');assert.equal(a.s.state.chapterFourView.unlocked,true);assert.equal(a.s.state.commerce.cash,172);
 }finally{db.close();}
});

for(const buyer of ['mei','ren'])for(const second of ['sold','declined'])for(const container of ['small','large','declined'])for(const rack of ['ask','leave','declined'])for(const relay of ['sold','declined'])test(`finale branches ${buyer}/${second}/${container}/${rack}/${relay}`,async()=>{
 const {db,env}=await fixture();try{
  const a=await chapterFourPrepared(env,rack==='declined'?'declined':'leave');await a.ok('profile.set',{name:'終章の旅人'});
  const old=JSON.parse((await db.prepare('SELECT state_json FROM journeys WHERE player_id=?').bind(a.s.playerId).first()).state_json);
  old.contentVersion='chapter4-2026-09-07';delete old.narrative.finale;
  old.commerce.firstBuyer=buyer;old.commerce.installations[buyer]='installed';old.commerce.followup.decision=second;old.commerce.followup.delivery=second==='sold'?'installed':'none';
  Object.assign(old.chapterTwo,{decision:container==='declined'?'declined':'sold',chosen:container==='declined'?null:container,delivery:container==='declined'?'none':'installed',resultHeard:true});
  if(rack==='ask')Object.assign(old.chapterThree,{response:'ask',reasonHeard:true});
  Object.assign(old.chapterFour,{orderRead:true,supplyHeard:relay==='sold',decision:relay,delivery:relay==='sold'?'installed':'none',away:relay==='sold',observed:true,receipt:relay==='sold'?{number:'R88-01',transactionId:'old-sale',item:'交換ブラシ',spec:'R88',amount:38,at:'2026-09-07T00:00:00Z'}:null});
  await db.prepare('UPDATE journeys SET state_json=? WHERE player_id=?').bind(JSON.stringify(old),a.s.playerId).run();await a.reload();assert.deepEqual(a.s.state.chapterFour,old.chapterFour);assert.deepEqual(a.s.state.chapterThree,old.chapterThree);
  await a.go('kowloon');await a.ok('journey.board');await a.ok('story.start',{kind:'finale'});const f=structuredClone(a.s.state.narrative.finale);
  assert.match(f.pages[0].lines[0],container==='small'?/小さな容器/:container==='large'?/大きな容器/:/扱わなかった/);
  assert.match(f.pages[1].lines[0],rack==='ask'?/理由があった/:rack==='leave'?/理由は聞かなかった/:/棚は運ばなかった/);
  assert.match(f.pages[2].lines[0],relay==='sold'?/運んだブラシ/:/今ある部品/);
  assert.match(f.pages[3].lines[0],second==='sold'?(buyer==='mei'?/蓋付きのトレー/:/覆いの付いた/):(buyer==='mei'?/トレーは扱わなかった/:/覆いは運ばなかった/));
  await a.ok('story.next');await a.reload();assert.equal(a.s.state.storyView.active.page,1);assert.deepEqual(a.s.state.narrative.finale,f);
  const mid=(await a.request('/api/export')).body;await a.ok('backup.restore',{document:mid});assert.equal(a.s.state.location.mode,'train');await a.ok('journey.resume');assert.equal(a.s.state.storyView.active.page,1);
  for(let i=0;i<3;i++)await a.ok('story.next');
  db.sqlite.exec("CREATE TRIGGER fail_checkpoint BEFORE INSERT ON checkpoints BEGIN SELECT RAISE(ABORT,'test'); END;");assert.equal((await a.send('story.next')).status,503);await a.reload();assert.equal(a.s.state.narrative.finalEndingSeen,false);assert.equal(a.s.state.storyView.active.page,4);db.sqlite.exec('DROP TRIGGER fail_checkpoint');
  const done=await a.send('story.next');assert.equal(done.status,200);assert.equal((await a.request('/api/commands',done.c)).body.replayed,true);await a.reload();assert.equal(a.s.state.story.chapter,'daily-life');assert.equal(a.s.state.storyView.finalReady,false);assert.equal(a.s.state.commerce.cash,old.commerce.cash);
  const backup=(await a.request('/api/export')).body;await a.ok('backup.restore',{document:backup});await a.ok('journey.resume');await a.ok('journey.board');assert.equal((await a.send('story.start',{kind:'finale'})).status,409);await a.go('jade');assert.deepEqual(a.s.state.narrative.finale,f);
 }finally{db.close();}
});
test('finale is gated by completed observation; old fourth-chapter cargo and active conversation survive migration',async()=>{
 const {db,env}=await fixture();try{
  const a=await chapterFourPrepared(env);await a.go('kowloon');await a.ok('journey.board');assert.equal((await a.send('story.start',{kind:'finale'})).status,409);
  await a.go('relay');await a.ok('chapter4.read');await a.go('scrap');await a.talk('oru');await a.ok('chapter4.buy');await a.ok('dialogue.start',{npc:'oru',topic:'trade'});
  const old=JSON.parse((await db.prepare('SELECT state_json FROM journeys WHERE player_id=?').bind(a.s.playerId).first()).state_json);old.contentVersion='chapter4-2026-09-07';delete old.narrative.finale;
  await db.prepare('UPDATE journeys SET state_json=? WHERE player_id=?').bind(JSON.stringify(old),a.s.playerId).run();await a.reload();assert.deepEqual(a.s.state.chapterFour,old.chapterFour);await a.ok('dialogue.complete',{sessionId:old.activeDialogue.sessionId});assert.equal(a.s.state.commerce.cash,old.commerce.cash);assert.equal(a.s.state.storyView.finalReady,false);
 }finally{db.close();}
});
