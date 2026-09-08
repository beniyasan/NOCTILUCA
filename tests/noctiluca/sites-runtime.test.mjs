import {KOWLOON_QUESTS,SCRAP_QUESTS,PELAGIC_QUESTS,LATER_QUESTS} from '../../src/game/sidequests-content.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Miniflare} from 'miniflare';

test('built Sites Worker and D1: auth, Mei, replay, rollback, checkpoint, restart and restore', {timeout:60000}, async()=>{
 const dir=await mkdtemp(join(tmpdir(),'noctiluca-d1-'));
 const config={modules:true,scriptPath:'dist/server/index.js',modulesRules:[{type:'ESModule',include:['**/*.js']}],compatibilityDate:'2026-05-22',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],d1Persist:dir,bindings:{IDENTITY_KEY:'test-only-secret-for-miniflare-never-production'},assets:{directory:'dist/client',binding:'ASSETS',routerConfig:{has_user_worker:true}}};
 let mf=new Miniflare(config);
 const origin='https://noctiluca.test';
 async function request(path='/api/session',who='test-user-a',body){
  const headers=who?{'oai-authenticated-user-id':who,'oai-authenticated-user-email':who+'@example.invalid'}:{};
  if(body)Object.assign(headers,{'Content-Type':'application/json',Origin:origin,'X-Noctiluca-Client':'1'});
  return mf.dispatchFetch(origin+path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined});
 }
 let state;
 async function command(type,payload={}){
  const c={id:crypto.randomUUID(),expectedPlayerId:state.playerId,expectedRevision:state.revision,type,payload};
  const r=await request('/api/commands','test-user-a',c);const result=await r.json();assert.equal(r.status,200,JSON.stringify(result));state=result;return {c,result};
 }
 try{
  const db=await mf.getD1Database('DB');
  const sql=(await Promise.all((await readdir('drizzle')).filter(n=>n.endsWith('.sql')).sort().map(n=>readFile('drizzle/'+n,'utf8')))).join('\n--> statement-breakpoint\n');
  await db.batch(sql.split('--> statement-breakpoint').filter(s=>s.trim()).map(s=>db.prepare(s)));
  const root=await request('/');assert.equal(root.status,200);const html=await root.text();assert.match(html,/id="scene"/);assert.match(html,/id="relay-open"/);assert.match(html,/id="sidequests-open"/);assert.match(html,/id="reset-open"/);assert.match(html,/id="reset-consent"/);assert.match(html,/<section class="window-timer" id="timer-overlay"/);assert.match(html,/id="timer-task-form"/);
  for(const asset of ['/client/main.js','/client/music.js','/client/music-ui.js','/client/timer-ui.js','/client/timer-tasks-ui.js','/client/focus-clock.js','/client/arrival-bell.js','/client/engine.js','/client/scenery.js','/client/place-scenes.js','/client/kowloon-moments.js','/client/scrap-moments.js','/client/pelagic-moments.js','/client/gorge-moments.js','/client/jade-moments.js','/client/relay-moments.js','/client/reset-ui.js','/client/sidequests-ui.js','/client/sidequest-scenes.js','/game/sidequests.js','/game/sidequests-content.js','/client/scene.css','/content/catalog.json','/game/rules.js','/game/commerce.js','/game/aftercare.js','/game/narrative.js','/client/story-ui.js','/client/commerce-ui.js','/game/chapter-two.js','/client/chapter-two-ui.js','/game/chapter-three.js','/client/chapter-three-ui.js','/game/chapter-four.js','/client/chapter-four-ui.js'])assert.equal((await request(asset)).status,200,asset);
  const guest=await (await request('/api/session',null)).json();assert.equal(guest.authenticated,false);assert.equal(guest.state,undefined);
  state=await (await request()).json();assert.equal(state.authenticated,true);
  await command('profile.set',{name:'夜凪'});await command('journey.alight');
  let d=await command('dialogue.start',{npc:'mei',topic:'greeting'});await command('dialogue.complete',{sessionId:d.result.outcome.dialogue.sessionId});
  d=await command('dialogue.start',{npc:'mei',topic:'trade'});
  const completed=await command('dialogue.complete',{sessionId:d.result.outcome.dialogue.sessionId});
  const replay=await (await request('/api/commands','test-user-a',completed.c)).json();assert.equal(replay.replayed,true);assert.equal(replay.revision,state.revision);assert.deepEqual(replay.state.notes,['mei-power']);
  const b=await (await request('/api/session','test-user-b')).json();assert.notEqual(b.playerId,state.playerId);assert.equal(b.state.displayName,'');assert.deepEqual(b.state.notes,[]);
  assert.equal((await request('/api/commands','test-user-b',{...completed.c,id:crypto.randomUUID()})).status,409);
  const stale={id:crypto.randomUUID(),expectedPlayerId:state.playerId,expectedRevision:0,type:'profile.set',payload:{name:'古い画面'}};assert.equal((await request('/api/commands','test-user-a',stale)).status,409);
  // Revision guard failure must roll back the entire D1 batch, including preceding writes.
  await assert.rejects(db.batch([db.prepare("INSERT INTO app_meta(key,value) VALUES('rollback_probe','x')"),db.prepare('INSERT INTO transaction_guards(player_id,valid) VALUES(?,(SELECT CASE WHEN revision=0 THEN 1 ELSE 0 END FROM journeys WHERE player_id=?)) ON CONFLICT(player_id) DO UPDATE SET valid=excluded.valid').bind(state.playerId,state.playerId)]));
  assert.equal(await db.prepare("SELECT value FROM app_meta WHERE key='rollback_probe'").first(),null);
  async function talk(npc){await command('dialogue.start',{npc,topic:'greeting'});await command('dialogue.complete',{sessionId:state.outcome.dialogue.sessionId});await command('dialogue.start',{npc,topic:'trade'});await command('dialogue.complete',{sessionId:state.outcome.dialogue.sessionId});}
  async function go(world){await command('journey.board');await command('travel.arrive',{world});await command('journey.alight');}
  await talk('ren');await go('scrap');await talk('oru');const purchase=await command('trade.buy',{buyer:'mei'});
  assert.equal(state.state.commerce.cash,40);assert.equal(state.state.commerce.cargo,'mei');
  const repeated=await (await request('/api/commands','test-user-a',purchase.c)).json();assert.equal(repeated.replayed,true);assert.equal(repeated.state.commerce.cash,40);
  await go('kowloon');await command('trade.sell',{buyer:'mei'});assert.equal(state.state.commerce.cash,140);assert.equal(state.state.commerce.cargo,null);assert.equal(state.state.commerce.installations.mei,'pending');
  await command('journey.checkpoint');assert.equal(state.state.suspended,true);
  const backup=await (await request('/api/export')).json();
  await mf.dispose();mf=new Miniflare(config);
  state=await (await request()).json();assert.equal(state.state.displayName,'夜凪');assert.equal(state.state.suspended,true);assert.ok(state.state.notes.includes('mei-power'));assert.equal(state.state.commerce.cash,140);assert.equal(state.state.commerce.installations.mei,'pending');
  await command('journey.resume');assert.equal(state.state.location.mode,'station');await go('jade');await go('kowloon');assert.equal(state.state.commerce.installations.mei,'installed');
  // Continue through Phase 2D on the real Worker/D1 adapter and retain the result after restart.
  await talk('mei');assert.equal(state.state.commerce.followup.observed,true);
  await go('jade');await go('kowloon');await talk('mei');assert.equal(state.state.commerce.followup.heard,true);
  assert.equal(state.state.tradeView.scene.tableOpen,false);
  await command('followup.decide',{decision:'considering'});await go('scrap');await talk('oru');
  const secondPurchase=await command('followup.buy');assert.equal(state.state.commerce.cash,108);
  const secondReplay=await (await request('/api/commands','test-user-a',secondPurchase.c)).json();assert.equal(secondReplay.replayed,true);assert.equal(secondReplay.state.commerce.cash,108);
  await go('kowloon');await command('followup.sell');assert.equal(state.state.commerce.cash,152);await go('jade');await go('kowloon');await talk('mei');
  assert.equal(state.state.story.chapter,'ending-ready');assert.equal(state.state.tradeView.scene.trays,true);
  await command('journey.checkpoint');await mf.dispose();mf=new Miniflare(config);state=await (await request()).json();
  assert.equal(state.state.commerce.cash,152);assert.equal(state.state.commerce.followup.resultHeard,true);assert.equal(state.state.tradeView.scene.trays,true);
  await command('journey.resume');await command('journey.board');await command('story.start',{kind:'ending'});await command('story.next');
  await mf.dispose();mf=new Miniflare(config);state=await (await request()).json();assert.equal(state.state.storyView.active.page,1);assert.equal(state.state.narrative.endingSeen,false);
  await command('story.next');const finalPage=await command('story.next');assert.equal(state.state.narrative.endingSeen,true);assert.equal(state.state.location.atStation,false);
  const endingReplay=await (await request('/api/commands','test-user-a',finalPage.c)).json();assert.equal(endingReplay.replayed,true);assert.equal(endingReplay.state.narrative.endingSeen,true);
  await mf.dispose();mf=new Miniflare(config);state=await (await request()).json();assert.equal(state.state.storyView.ready,false);assert.equal(state.state.storyView.active,null);assert.equal(state.state.narrative.endingSeen,true);
  // Simulate the elapsed chapter break in this isolated test DB, keeping rate limits enabled.
  const nextChapterDb=await mf.getD1Database('DB');await nextChapterDb.prepare('UPDATE command_receipts SET created_at=?').bind(new Date(Date.now()-120000).toISOString()).run();
  // The same complete journey now continues through Chapter Two on the built Worker.
  await command('station.stop');await command('journey.alight');await go('gorge');await talk('toma');await go('pelagic');await talk('nagi');
  await command('chapter2.buy',{item:'large'});assert.equal(state.state.commerce.cash,116);await command('chapter2.return');assert.equal(state.state.commerce.cash,152);
  await command('chapter2.buy',{item:'small'});await go('gorge');const containers=await command('chapter2.sell');assert.equal(state.state.commerce.cash,168);
  const containerReplay=await (await request('/api/commands','test-user-a',containers.c)).json();assert.equal(containerReplay.replayed,true);assert.equal(containerReplay.state.commerce.cash,168);
  await mf.dispose();mf=new Miniflare(config);state=await (await request()).json();assert.equal(state.state.chapterTwo.delivery,'pending');assert.equal(state.state.narrative.endingSeen,true);
  await go('pelagic');await go('gorge');await talk('toma');assert.equal(state.state.chapterTwo.resultHeard,true);assert.equal(state.state.story.chapter,'chapter-three');await command('journey.checkpoint');
  await mf.dispose();mf=new Miniflare(config);state=await (await request()).json();assert.equal(state.state.chapterTwo.chosen,'small');assert.equal(state.state.chapterTwo.resultHeard,true);assert.equal(state.state.narrative.finalEndingSeen,false);assert.equal(state.state.commerce.cash,168);
  // A separate play session starts the third chapter; retain rate limiting in the Worker.
  await (await mf.getD1Database('DB')).prepare('UPDATE command_receipts SET created_at=?').bind(new Date(Date.now()-120000).toISOString()).run();
  await command('journey.resume');await go('jade');await talk('sui');await go('scrap');await talk('oru');await command('chapter3.buy');assert.equal(state.state.commerce.cash,124);
  await go('jade');await command('chapter3.sell');assert.equal(state.state.commerce.cash,184);await go('kowloon');await go('jade');assert.equal(state.state.chapterThree.delivery,'installed');
  const observation=await command('chapter3.observe');const observationReplay=await (await request('/api/commands','test-user-a',observation.c)).json();assert.equal(observationReplay.replayed,true);
  await command('chapter3.respond',{choice:'ask'});await mf.dispose();mf=new Miniflare(config);state=await (await request()).json();assert.equal(state.state.chapterThree.response,'ask');assert.equal(state.state.chapterThree.reasonHeard,false);assert.equal(state.state.chapterThree.resolved,false);
  await talk('sui');assert.equal(state.state.chapterThree.reasonHeard,true);await go('kowloon');await talk('mei');assert.equal(state.state.chapterThree.returnHeard,true);await command('journey.checkpoint');
  await mf.dispose();mf=new Miniflare(config);state=await (await request()).json();assert.equal(state.state.story.chapter,'chapter-four');assert.equal(state.state.commerce.cash,184);assert.equal(state.state.chapterThree.returnHeard,true);assert.equal(state.state.narrative.finalEndingSeen,false);
  // The unattended terminal is a separate play session, without adding a human NPC.
  await (await mf.getD1Database('DB')).prepare('UPDATE command_receipts SET created_at=?').bind(new Date(Date.now()-120000).toISOString()).run();
  const catalog=await (await request('/api/catalog')).json();assert.equal(catalog.people.filter(n=>n.world==='relay').length,0);
  await command('journey.resume');await go('relay');await command('chapter4.read');await go('scrap');await talk('oru');await command('chapter4.buy');assert.equal(state.state.commerce.cash,156);
  await go('relay');const relaySale=await command('chapter4.sell');assert.equal(state.state.commerce.cash,194);assert.equal(state.state.chapterFour.receipt.amount,38);assert.equal(state.state.chapterFour.delivery,'pending');
  const relayReplay=await (await request('/api/commands','test-user-a',relaySale.c)).json();assert.equal(relayReplay.replayed,true);assert.equal(relayReplay.state.commerce.cash,194);
  await mf.dispose();mf=new Miniflare(config);state=await (await request()).json();assert.equal(state.state.chapterFour.delivery,'pending');assert.equal(state.state.chapterFour.observed,false);assert.equal(state.state.chapterFour.receipt.transactionId,relaySale.c.id);
  await go('jade');await go('relay');assert.equal(state.state.chapterFour.delivery,'installed');await command('chapter4.observe');await command('journey.checkpoint');
  await mf.dispose();mf=new Miniflare(config);state=await (await request()).json();assert.equal(state.state.story.chapter,'chapter-four-complete');assert.equal(state.state.commerce.cash,194);assert.equal(state.state.chapterFour.observed,true);assert.equal(state.state.narrative.finalEndingSeen,false);assert.equal(state.state.chapterFour.receipt.number,'R88-01');
  await command('journey.resume');await go('kowloon');await command('journey.board');await command('story.start',{kind:'finale'});
  const remembered=structuredClone(state.state.narrative.finale);assert.equal(remembered.cash,194);assert.match(remembered.pages[1].lines[0],/理由があった/);
  await command('story.next');await command('story.next');await mf.dispose();mf=new Miniflare(config);state=await (await request()).json();assert.equal(state.state.storyView.active.page,2);assert.deepEqual(state.state.narrative.finale,remembered);
  await command('story.next');await command('story.next');const finaleEnd=await command('story.next');assert.equal(state.state.story.chapter,'daily-life');assert.equal(state.state.location.atStation,false);assert.equal(state.state.narrative.finalEndingSeen,true);assert.equal(state.state.commerce.cash,194);
  assert.equal((await (await request('/api/commands','test-user-a',finaleEnd.c)).json()).replayed,true);
  await mf.dispose();mf=new Miniflare(config);state=await (await request()).json();assert.equal(state.state.storyView.finalReady,false);assert.equal(state.state.storyView.active,null);assert.ok(state.state.noteDetails.some(n=>n.id==='finale'));assert.deepEqual(state.state.narrative.finale,remembered);
  // Existing completed main story gains optional jobs without rewriting its ending.
  await (await mf.getD1Database('DB')).prepare('DELETE FROM command_receipts').run();
  await command('station.stop');await command('journey.alight');
  async function listenQuest(quest){await command('sidequest.talk',{quest});while(state.state.sidequestView.active)await command('sidequest.next',{quest});}
  for(const [quest,source,cost,kind] of [['quiet_ears','scrap',24,'buy'],['late_tea','jade',12,'buy'],['chair_home','gorge',0,'delivery'],['rain_umbrellas','pelagic',0,'info']]){
   await go('kowloon');await listenQuest(quest);await command('sidequest.accept',{quest});await go(source);
   if(kind!=='delivery')await listenQuest(quest);
   if(cost)await command('sidequest.buy',{quest});
   if(kind!=='delivery')await go('kowloon');
   const done=await command('sidequest.deliver',{quest});
   assert.equal((await (await request('/api/commands','test-user-a',done.c)).json()).replayed,true);
  }
  await go('gorge');await go('kowloon');
  const questSave=structuredClone(state.state.sidequests);assert.equal(state.state.commerce.cash,232);
  await mf.dispose();mf=new Miniflare(config);state=await (await request()).json();
  assert.deepEqual(state.state.sidequests,questSave);assert.deepEqual(state.state.narrative.finale,remembered);assert.equal(state.state.narrative.finalEndingSeen,true);
  assert.equal(state.state.sidequests.quests.chair_home.installed.includes('gorge'),true);
  assert.ok(['quiet_ears','late_tea','chair_home','rain_umbrellas'].every(id=>state.state.sidequests.quests[id].installed.includes('kowloon')));
  // Simulate a deployed v24 save, then exercise additive migration through the built Worker + D1.
  const questDB=await mf.getD1Database('DB'),row=await questDB.prepare('SELECT player_id,state_json FROM journeys WHERE player_id = ?').bind(state.playerId).first();
  const legacy=JSON.parse(row.state_json);legacy.sidequests.version=1;for(const q of [...SCRAP_QUESTS,...PELAGIC_QUESTS,...LATER_QUESTS])delete legacy.sidequests.quests[q.id];
  await questDB.prepare('UPDATE journeys SET state_json = ? WHERE player_id = ?').bind(JSON.stringify(legacy),state.playerId).run();
  await questDB.prepare('DELETE FROM command_receipts').run();
  state=await (await request()).json();assert.equal(state.state.sidequests.version,4);
  for(const id of Object.keys(legacy.sidequests.quests))assert.deepEqual(state.state.sidequests.quests[id],legacy.sidequests.quests[id]);
  for(const [quest,source,cost,kind] of [['steady_grips','pelagic',18,'buy'],['amber_window','kowloon',14,'buy'],['shears_return','jade',0,'delivery'],['glove_drying','gorge',0,'info']]){
   await go('scrap');await listenQuest(quest);await command('sidequest.accept',{quest});await go(source);
   if(kind!=='delivery')await listenQuest(quest);
   if(cost)await command('sidequest.buy',{quest});
   if(kind!=='delivery')await go('scrap');
   const done=await command('sidequest.deliver',{quest});
   assert.equal((await (await request('/api/commands','test-user-a',done.c)).json()).replayed,true);
  }
  await go('jade');await go('scrap');await command('journey.checkpoint');
  const allQuests=structuredClone(state.state.sidequests);assert.equal(state.state.commerce.cash,270);
  await mf.dispose();mf=new Miniflare(config);state=await (await request()).json();
  assert.deepEqual(state.state.sidequests,allQuests);assert.deepEqual(state.state.narrative.finale,remembered);assert.equal(state.state.commerce.cash,270);assert.equal(state.state.suspended,true);
  assert.ok(['steady_grips','amber_window','shears_return','glove_drying'].every(id=>state.state.sidequests.quests[id].installed.includes('scrap')));assert.ok(state.state.sidequests.quests.shears_return.installed.includes('jade'));
  const allBackup=await (await request('/api/export')).json();await command('backup.restore',{document:allBackup});assert.deepEqual(state.state.sidequests,allQuests);
  // Upgrade an eight-quest save through the real D1 adapter before the next four jobs.
  const harborDB=await mf.getD1Database('DB'),harborRow=await harborDB.prepare('SELECT state_json FROM journeys WHERE player_id = ?').bind(state.playerId).first();
  const eight=JSON.parse(harborRow.state_json);eight.sidequests.version=2;for(const q of [...PELAGIC_QUESTS,...LATER_QUESTS])delete eight.sidequests.quests[q.id];
  await harborDB.prepare('UPDATE journeys SET state_json = ? WHERE player_id = ?').bind(JSON.stringify(eight),state.playerId).run();await harborDB.prepare('DELETE FROM command_receipts').run();
  state=await (await request()).json();assert.equal(state.state.sidequests.version,4);for(const id of Object.keys(eight.sidequests.quests))assert.deepEqual(state.state.sidequests.quests[id],eight.sidequests.quests[id]);
  await command('journey.resume');
  for(const [quest,source,cost,kind] of [['lunch_tags','kowloon',12,'buy'],['salt_scraper','scrap',16,'buy'],['wave_cups','kowloon',0,'delivery'],['tide_seat','gorge',0,'info']]){
   await go('pelagic');await listenQuest(quest);await command('sidequest.accept',{quest});await go(source);
   if(kind!=='delivery')await listenQuest(quest);
   if(cost)await command('sidequest.buy',{quest});
   if(kind!=='delivery')await go('pelagic');
   const done=await command('sidequest.deliver',{quest});assert.equal((await (await request('/api/commands','test-user-a',done.c)).json()).replayed,true);
  }
  await go('kowloon');await go('pelagic');await command('journey.checkpoint');
  const harborSave=structuredClone(state.state.sidequests);assert.equal(state.state.commerce.cash,309);
  await mf.dispose();mf=new Miniflare(config);state=await (await request()).json();assert.deepEqual(state.state.sidequests,harborSave);assert.equal(state.state.commerce.cash,309);assert.deepEqual(state.state.narrative.finale,remembered);
  assert.ok(['lunch_tags','salt_scraper','wave_cups','tide_seat'].every(id=>state.state.sidequests.quests[id].installed.includes('pelagic')));assert.ok(state.state.sidequests.quests.wave_cups.installed.includes('kowloon'));
  const harborBackup=await (await request('/api/export')).json();await command('backup.restore',{document:harborBackup});assert.deepEqual(state.state.sidequests,harborSave);
  // Deployed v27 records retain all twelve jobs and the main ending while the remaining stations are added.
  const laterDB=await mf.getD1Database('DB'),laterRow=await laterDB.prepare('SELECT state_json FROM journeys WHERE player_id = ?').bind(state.playerId).first();
  const twelve=JSON.parse(laterRow.state_json);twelve.sidequests.version=3;for(const q of LATER_QUESTS)delete twelve.sidequests.quests[q.id];
  await laterDB.prepare('UPDATE journeys SET state_json = ? WHERE player_id = ?').bind(JSON.stringify(twelve),state.playerId).run();await laterDB.prepare('DELETE FROM command_receipts').run();
  state=await (await request()).json();assert.equal(state.state.sidequests.version,4);for(const id of Object.keys(twelve.sidequests.quests))assert.deepEqual(state.state.sidequests.quests[id],twelve.sidequests.quests[id]);
  await command('journey.resume');
  for(const world of ['gorge','jade','relay']){
   await laterDB.prepare('DELETE FROM command_receipts').run();
   for(const q of LATER_QUESTS.filter(q=>q.origin===world)){
    const quest=q.id;await go(world);await listenQuest(quest);await command('sidequest.accept',{quest});await go(q.source);
    if(q.kind!=='配送')await listenQuest(quest);if(q.cost)await command('sidequest.buy',{quest});if(q.kind!=='配送')await go(world);
    const done=await command('sidequest.deliver',{quest});assert.equal((await (await request('/api/commands','test-user-a',done.c)).json()).replayed,true);
   }
  }
  for(const world of ['gorge','jade','kowloon','scrap','relay'])await go(world);await command('journey.checkpoint');
  const completeSave=structuredClone(state.state.sidequests);assert.equal(state.state.commerce.cash,428);
  for(const q of LATER_QUESTS){assert.equal(completeSave.quests[q.id].stage,'completed');assert.ok(q.sceneWorlds.every(w=>completeSave.quests[q.id].installed.includes(w)));}
  await mf.dispose();mf=new Miniflare(config);state=await (await request()).json();assert.deepEqual(state.state.sidequests,completeSave);assert.equal(state.state.commerce.cash,428);assert.deepEqual(state.state.narrative.finale,remembered);assert.equal(state.state.suspended,true);
  const completeBackup=await (await request('/api/export')).json();await command('backup.restore',{document:completeBackup});assert.deepEqual(state.state.sidequests,completeSave);assert.equal(state.state.commerce.cash,428);
  const other=await (await request('/api/session','test-user-b')).json();assert.ok(Object.values(other.state.sidequests.quests).every(q=>q.stage==='available'));
  // Reset a complete 24-quest journey, restart D1, then recover its signed backup.
  const resetName=state.state.displayName,resetSettings=structuredClone(state.state.settings),resetRevision=state.revision;
  const resetDone=await command('journey.reset',{confirmation:'reset-journey'});assert.equal(state.revision,resetRevision+1);assert.equal(state.state.commerce.cash,120);assert.equal(state.state.sidequests.cargo,null);assert.ok(Object.values(state.state.sidequests.quests).every(q=>q.stage==='available'&&!q.receipt&&!q.installed.length));assert.equal(state.state.narrative.finalEndingSeen,false);assert.equal(state.state.narrative.introSeen,false);
  await mf.dispose();mf=new Miniflare(config);state=await (await request()).json();assert.equal(state.state.displayName,resetName);assert.deepEqual(state.state.settings,resetSettings);assert.equal(state.state.commerce.cash,120);assert.equal(state.state.location.world,'kowloon');
  await command('story.start',{kind:'intro'});assert.ok(state.state.narrative.active);const afterIntro=structuredClone(state.state.narrative);
  const replayReset=await (await request('/api/commands','test-user-a',resetDone.c)).json();assert.equal(replayReset.replayed,true);assert.deepEqual(replayReset.state.narrative,afterIntro);
  await command('backup.restore',{document:completeBackup});assert.deepEqual(state.state.sidequests,completeSave);assert.deepEqual(state.state.narrative.finale,remembered);assert.equal(state.state.commerce.cash,428);
  await command('profile.set',{name:'変更後'});await command('backup.restore',{document:backup});assert.equal(state.state.displayName,'夜凪');assert.equal(state.state.suspended,true);
 }finally{await mf.dispose();await rm(dir,{recursive:true,force:true});}
});
