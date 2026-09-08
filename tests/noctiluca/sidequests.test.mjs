import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {freshState,checkState,reduce,viewState,eligible} from '../../src/game/rules.js';
import {SIDEQUESTS,KOWLOON_QUESTS,SCRAP_QUESTS,PELAGIC_QUESTS,LATER_QUESTS,RELAY_QUESTS} from '../../src/game/sidequests-content.js';
import {validSidequests} from '../../src/game/sidequests.js';
import data from '../../src/server/content.js';
import {SQLiteD1} from '../../scripts/sqlite-d1.mjs';
import {handleApi} from '../../src/server/api.js';
function journey(){let state=freshState();state.displayName='寄り道';state.location.mode='station';return {get s(){return state;},set s(v){state=v;},send(type,payload={}){state=reduce(state,{id:crypto.randomUUID(),type,payload},data).state;return state;},go(world){this.send('journey.board');this.send('travel.arrive',{world});this.send('journey.alight');},listen(quest){this.send('sidequest.talk',{quest});while(state.sidequests.active)this.send('sidequest.next',{quest});}};}
for(const q of SIDEQUESTS)test(q.id+': receive, fulfill, revisit and reload without changing the main story',()=>{
 const u=journey();if(q.afterChapterFour)Object.assign(u.s.chapterFour,{orderRead:true,decision:'declined',observed:true});u.go(q.origin);const before=structuredClone(u.s.narrative),main=structuredClone(u.s.story);
 assert.throws(()=>u.send('sidequest.accept',{quest:q.id}),/手順/);
 u.send('sidequest.talk',{quest:q.id});assert.equal(u.s.sidequests.quests[q.id].stage,'available');u.send('sidequest.close');
 u.listen(q.id);u.send('sidequest.accept',{quest:q.id});
 assert.equal(u.s.sidequests.cargo,q.kind==='配送'?q.id:null);
 u.go(q.source);
 if(q.kind!=='配送'){assert.throws(()=>u.send(q.kind==='情報収集'?'sidequest.deliver':'sidequest.buy',{quest:q.id}),/手順/);u.listen(q.id);}
 if(q.cost){u.send('sidequest.buy',{quest:q.id});assert.equal(u.s.commerce.cash,120-q.cost);assert.equal(viewState(u.s,data).tradeView.cargoItem.name,q.item);}
 if(q.kind!=='配送')u.go(q.origin);
 u.send('sidequest.deliver',{quest:q.id});assert.equal(u.s.commerce.cash,120-q.cost+q.payment);assert.equal(u.s.sidequests.cargo,null);assert.deepEqual(u.s.sidequests.quests[q.id].installed,[]);
 assert.throws(()=>u.send('sidequest.deliver',{quest:q.id}),/手順/);
 const world=u.s.location.world;u.go(world);assert.deepEqual(u.s.sidequests.quests[q.id].installed,[]);
 u.go(world==='kowloon'?'scrap':'kowloon');u.go(world);
 assert.ok(u.s.sidequests.quests[q.id].installed.includes(world));
 u.s=checkState(JSON.parse(JSON.stringify(u.s)));assert.ok(validSidequests(u.s.sidequests));assert.deepEqual(u.s.narrative,before);assert.deepEqual(u.s.story,main);
 assert.ok(viewState(u.s,data).noteDetails.some(n=>n.id==='sidequest:'+q.id));
});
test('shared cargo, refunds, no-cost delivery, cancellation and info while carrying a main-story box',()=>{
 const u=journey();u.s.commerce.cash=0;u.listen('chair_home');u.send('sidequest.accept',{quest:'chair_home'});
 assert.throws(()=>u.send('trade.buy',{buyer:'mei'}),/寄り道の荷物/);
 u.send('sidequest.return',{quest:'chair_home'});assert.equal(u.s.commerce.cash,0);assert.equal(u.s.sidequests.cargo,null);
 u.s.commerce.cash=120;u.listen('quiet_ears');u.send('sidequest.accept',{quest:'quiet_ears'});u.go('scrap');u.listen('quiet_ears');
 u.s.commerce.cargo='mei';assert.throws(()=>u.send('sidequest.buy',{quest:'quiet_ears'}),/埋まって/);u.s.commerce.cargo=null;
 u.send('sidequest.buy',{quest:'quiet_ears'});u.send('sidequest.return',{quest:'quiet_ears'});assert.equal(u.s.commerce.cash,120);assert.equal(u.s.sidequests.quests.quiet_ears.stage,'accepted');
 u.go('kowloon');u.send('sidequest.cancel',{quest:'quiet_ears'});assert.equal(u.s.sidequests.quests.quiet_ears.stage,'offered');
 u.s.commerce.cargo='mei';u.listen('rain_umbrellas');u.send('sidequest.accept',{quest:'rain_umbrellas'});u.go('pelagic');u.listen('rain_umbrellas');u.go('kowloon');u.send('sidequest.deliver',{quest:'rain_umbrellas'});assert.equal(u.s.commerce.cargo,'mei');assert.equal(u.s.commerce.cash,130);
});
test('old saves gain only the new quest state; corrupt new state is not silently reset',()=>{
 const s=freshState();delete s.sidequests;s.commerce.cash=236;s.narrative.introSeen=true;const old=structuredClone(s);
 checkState(s);const {sidequests,...rest}=s;assert.deepEqual(rest,old);assert.ok(validSidequests(sidequests));
 s.sidequests.quests.rain_umbrellas.stage='completed';assert.throws(()=>checkState(s),/寄り道の仕事/);
});
test('hearing starts do not collect information, and post-quest chatter requires installed changes',()=>{
 const u=journey();u.listen('rain_umbrellas');u.send('sidequest.accept',{quest:'rain_umbrellas'});u.go('pelagic');u.send('sidequest.talk',{quest:'rain_umbrellas'});
 u.s=checkState(JSON.parse(JSON.stringify(u.s)));assert.equal(u.s.sidequests.active.line,0);
 u.send('sidequest.next',{quest:'rain_umbrellas'});u.send('sidequest.close');assert.equal(u.s.sidequests.quests.rain_umbrellas.stage,'accepted');
 u.go('kowloon');assert.throws(()=>u.send('sidequest.deliver',{quest:'rain_umbrellas'}),/手順/);
 const e={world:'kowloon',sidequest:'rain_umbrellas'};assert.equal(eligible(e,u.s),false);
 u.go('pelagic');u.listen('rain_umbrellas');u.go('kowloon');u.send('sidequest.deliver',{quest:'rain_umbrellas'});assert.equal(eligible(e,u.s),false);
 u.go('scrap');u.go('kowloon');assert.equal(eligible(e,u.s),true);
});
test('D1 commits money, cargo, receipt and scenery together; replay, failures, user isolation and backup',async()=>{
 const db=new SQLiteD1();await db.exec(await readFile('migrations/0001_initial.sql','utf8'));const env={DB:db,IDENTITY_KEY:'sidequest-test-secret-not-for-production-0000000'};
 async function call(who,path='/api/session',body){const r=await handleApi(new Request('https://quest.test'+path,{method:body?'POST':'GET',headers:body?{Origin:'https://quest.test','X-Noctiluca-Client':'1','Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined}),env,who);return {status:r.status,body:await r.json()};}
 let session=(await call('a')).body;
 async function send(type,payload={},id=crypto.randomUUID(),ok=true){const command={id,type,payload,expectedRevision:session.revision,expectedPlayerId:session.playerId};const r=await call('a','/api/commands',command);if(ok)assert.equal(r.status,200,JSON.stringify(r.body));if(r.status===200)session=r.body;return {...r,command};}
 async function go(world){await send('journey.board');await send('travel.arrive',{world});await send('journey.alight');}
 async function listen(quest){await send('sidequest.talk',{quest});while(session.state.sidequestView.active)await send('sidequest.next',{quest});}
 try{
  await send('profile.set',{name:'旅人'});await send('journey.alight');await listen('quiet_ears');await send('sidequest.accept',{quest:'quiet_ears'});await go('scrap');await listen('quiet_ears');await send('sidequest.buy',{quest:'quiet_ears'});await go('kowloon');
  const rev=session.revision,cash=session.state.commerce.cash;
  await db.exec("CREATE TRIGGER fail_quest BEFORE INSERT ON checkpoints BEGIN SELECT RAISE(ABORT,'test'); END;");
  const failed=await send('sidequest.deliver',{quest:'quiet_ears'},crypto.randomUUID(),false);assert.equal(failed.status,503);
  session=(await call('a')).body;assert.equal(session.revision,rev);assert.equal(session.state.commerce.cash,cash);assert.equal(session.state.sidequests.cargo,'quiet_ears');assert.equal(session.state.sidequests.quests.quiet_ears.receipt,null);
  await db.exec('DROP TRIGGER fail_quest;');
  const done=await send('sidequest.deliver',{quest:'quiet_ears'},failed.command.id);
  const replay=await call('a','/api/commands',done.command);assert.equal(replay.body.replayed,true);assert.equal(replay.body.state.commerce.cash,128);
  const forged={...done.command,id:crypto.randomUUID(),expectedRevision:session.revision,payload:{quest:'late_tea',payment:999}};assert.equal((await call('a','/api/commands',forged)).status,400);
  await go('jade');await go('kowloon');const backup=(await call('a','/api/export')).body;
  assert.deepEqual(backup.state.sidequests.quests.quiet_ears.installed,['kowloon']);
  const b=(await call('b')).body;assert.equal(b.state.commerce.cash,120);assert.equal(b.state.sidequests.quests.quiet_ears.stage,'available');
  assert.equal((await call('b','/api/commands',{...done.command,id:crypto.randomUUID()})).status,409);
  await send('backup.restore',{document:backup});assert.equal(session.state.suspended,true);assert.deepEqual(session.state.sidequests.quests.quiet_ears.installed,['kowloon']);
 }finally{db.close();}
});

test('v1 migration preserves Kowloon receipts, cargo, active conversation and main save',()=>{
 const u=journey();u.listen('rain_umbrellas');u.send('sidequest.accept',{quest:'rain_umbrellas'});u.go('pelagic');u.listen('rain_umbrellas');u.go('kowloon');u.send('sidequest.deliver',{quest:'rain_umbrellas'});
 u.go('scrap');u.go('kowloon');u.listen('chair_home');u.send('sidequest.accept',{quest:'chair_home'});u.send('sidequest.talk',{quest:'quiet_ears'});u.send('sidequest.next',{quest:'quiet_ears'});
 const old=structuredClone(u.s);old.sidequests.version=1;for(const q of [...SCRAP_QUESTS,...PELAGIC_QUESTS,...LATER_QUESTS])delete old.sidequests.quests[q.id];
 const preserved=structuredClone(old);const migrated=checkState(old);
 assert.equal(migrated.sidequests.version,4);assert.equal(migrated.sidequests.cargo,'chair_home');assert.deepEqual(migrated.sidequests.active,preserved.sidequests.active);
 for(const q of KOWLOON_QUESTS)assert.deepEqual(migrated.sidequests.quests[q.id],preserved.sidequests.quests[q.id]);
 for(const q of SCRAP_QUESTS)assert.equal(migrated.sidequests.quests[q.id].stage,'available');
 const {sidequests,...rest}=migrated;const {sidequests:legacy,...before}=preserved;assert.deepEqual(rest,before);
 const corrupt=structuredClone(preserved);corrupt.sidequests.quests.rain_umbrellas.receipt.amount=999;assert.throws(()=>checkState(corrupt),/寄り道の仕事/);assert.equal(corrupt.sidequests.version,1);
});
test('Scrap memories and chatter require the correct installed world',()=>{
 const u=journey();u.go('scrap');u.listen('shears_return');u.send('sidequest.accept',{quest:'shears_return'});u.go('jade');u.send('sidequest.deliver',{quest:'shears_return'});
 const lines=data.ambient.filter(e=>e.sidequest==='shears_return');assert.equal(lines.length,2);assert.ok(lines.every(e=>!eligible(e,u.s)));
 u.go('scrap');assert.equal(eligible(lines.find(e=>e.world==='scrap'),u.s),true);assert.equal(eligible(lines.find(e=>e.world==='jade'),u.s),false);
 const oru=reduce(u.s,{type:'dialogue.start',payload:{npc:'oru',topic:'greeting'},id:crypto.randomUUID()},data);u.s=oru.state;assert.ok(oru.outcome.dialogue.lines.some(l=>l.text.includes('返却札')));u.send('dialogue.close');
 u.go('jade');const sui=reduce(u.s,{type:'dialogue.start',payload:{npc:'sui',topic:'greeting'},id:crypto.randomUUID()},data);assert.ok(sui.outcome.dialogue.lines.some(l=>l.text.includes('いつもの布')));
});

test('v2 migration keeps Scrap jobs, carrying cargo and dialogue while adding harbor jobs',()=>{
 const u=journey();u.go('scrap');u.listen('shears_return');u.send('sidequest.accept',{quest:'shears_return'});u.send('sidequest.talk',{quest:'glove_drying'});u.send('sidequest.next',{quest:'glove_drying'});
 const old=structuredClone(u.s);old.sidequests.version=2;for(const q of [...PELAGIC_QUESTS,...LATER_QUESTS])delete old.sidequests.quests[q.id];const before=structuredClone(old);
 const migrated=checkState(old);assert.equal(migrated.sidequests.version,4);assert.equal(migrated.sidequests.cargo,'shears_return');assert.deepEqual(migrated.sidequests.active,before.sidequests.active);
 for(const q of [...KOWLOON_QUESTS,...SCRAP_QUESTS])assert.deepEqual(migrated.sidequests.quests[q.id],before.sidequests.quests[q.id]);
 for(const q of PELAGIC_QUESTS)assert.equal(migrated.sidequests.quests[q.id].stage,'available');
 const corrupt=structuredClone(before);delete corrupt.sidequests.quests.amber_window;assert.throws(()=>checkState(corrupt),/寄り道の仕事/);
});
test('harbor cups work without the tea quest and install independently at each destination',()=>{
 const u=journey();u.go('pelagic');u.listen('wave_cups');u.send('sidequest.accept',{quest:'wave_cups'});u.go('kowloon');u.send('sidequest.deliver',{quest:'wave_cups'});
 assert.equal(u.s.sidequests.quests.late_tea.stage,'available');assert.equal(u.s.sidequests.quests.wave_cups.installed.length,0);
 u.go('pelagic');assert.deepEqual(u.s.sidequests.quests.wave_cups.installed,['pelagic']);u.go('kowloon');
 const d=reduce(u.s,{type:'dialogue.start',payload:{npc:'mei',topic:'greeting'},id:crypto.randomUUID()},data);assert.ok(d.outcome.dialogue.lines.some(l=>l.text.includes('水飲み用')));assert.ok(!d.outcome.dialogue.lines.some(l=>l.text.includes('お茶')));
 const e=data.ambient.find(e=>e.id==='k-side-cups');assert.equal(eligible(e,u.s),true);
});

test('v3 migration preserves an unfinished harbor trip and every previous receipt',()=>{
 const u=journey();u.go('pelagic');u.listen('tide_seat');u.send('sidequest.accept',{quest:'tide_seat'});u.go('gorge');u.listen('tide_seat');u.go('pelagic');u.send('sidequest.deliver',{quest:'tide_seat'});u.go('gorge');u.go('pelagic');
 u.listen('wave_cups');u.send('sidequest.accept',{quest:'wave_cups'});u.send('sidequest.talk',{quest:'lunch_tags'});u.send('sidequest.next',{quest:'lunch_tags'});
 const old=structuredClone(u.s);old.sidequests.version=3;for(const q of LATER_QUESTS)delete old.sidequests.quests[q.id];const before=structuredClone(old);
 const migrated=checkState(old);assert.equal(migrated.sidequests.version,4);assert.equal(migrated.sidequests.cargo,'wave_cups');assert.deepEqual(migrated.sidequests.active,before.sidequests.active);
 for(const id of Object.keys(before.sidequests.quests))assert.deepEqual(migrated.sidequests.quests[id],before.sidequests.quests[id]);
 for(const q of LATER_QUESTS)assert.equal(migrated.sidequests.quests[q.id].stage,'available');
 const {sidequests,...rest}=migrated,{sidequests:legacy,...previous}=before;assert.deepEqual(rest,previous);
 const corrupt=structuredClone(before);corrupt.sidequests.quests.tide_seat.receipt.amount=99;assert.throws(()=>checkState(corrupt),/寄り道の仕事/);assert.equal(corrupt.sidequests.version,3);
});
test('relay work orders are hidden and server-rejected until the fourth chapter result is observed',()=>{
 const u=journey();u.go('relay');
 const locked=()=>{const v=viewState(u.s,data).sidequestView;assert.match(v.lockedReason,/第四章/);for(const q of RELAY_QUESTS){assert.equal(v.quests.find(x=>x.id===q.id).visible,false);assert.deepEqual(v.quests.find(x=>x.id===q.id).actions,[]);assert.throws(()=>u.send('sidequest.talk',{quest:q.id}),/第四章/);assert.throws(()=>u.send('sidequest.accept',{quest:q.id}),/第四章/);}};
 locked();u.s.chapterFour.orderRead=true;locked();u.s.chapterFour.decision='declined';locked();
 const declined=structuredClone(u.s);u.s.chapterFour.observed=true;
 assert.equal(viewState(u.s,data).sidequestView.quests.filter(q=>q.origin==='relay'&&q.visible).length,4);
 u.listen('empty_count');u.send('sidequest.accept',{quest:'empty_count'});assert.equal(u.s.chapterFour.decision,'declined');
 u.s=declined;Object.assign(u.s.chapterFour,{decision:'sold',delivery:'installed',receipt:{number:'R88-01',transactionId:'test',item:'ブラシ',spec:'規格',amount:30,at:'test'}});locked();u.s.chapterFour.observed=true;u.s=checkState(u.s);
 u.send('sidequest.talk',{quest:'quiet_landing'});assert.equal(viewState(u.s,data).sidequestView.active.machine,true);
});
test('later side quests unlock independent of the main story; information does not wait for an animal',()=>{
 const u=journey();u.go('gorge');assert.equal(viewState(u.s,data).sidequestView.quests.filter(q=>q.origin==='gorge'&&q.visible).length,4);
 u.listen('cat_descent');u.send('sidequest.accept',{quest:'cat_descent'});u.go('jade');u.send('sidequest.talk',{quest:'cat_descent'});u.send('sidequest.next',{quest:'cat_descent'});u.send('sidequest.close');u.go('gorge');assert.throws(()=>u.send('sidequest.deliver',{quest:'cat_descent'}),/手順/);
 u.go('jade');u.listen('cat_descent');u.go('gorge');u.send('sidequest.deliver',{quest:'cat_descent'});assert.equal(u.s.sidequests.quests.cat_descent.stage,'completed');
 assert.equal(u.s.chapterFour.orderRead,false);assert.equal(u.s.commerce.firstBuyer,null);u.go('jade');u.go('gorge');
 const e=data.ambient.find(e=>e.sidequest==='cat_descent');assert.equal(eligible(e,u.s),true);
 const d=reduce(u.s,{type:'dialogue.start',payload:{npc:'toma',topic:'greeting'},id:crypto.randomUUID()},data);assert.ok(d.outcome.dialogue.lines.some(l=>l.text.includes('箱')));
});
test('returned exchange cloth and gorge stones install independently at both destinations',()=>{
 const u=journey();for(const id of ['pot_stones','exchange_cloth']){
  const q=SIDEQUESTS.find(q=>q.id===id);u.go(q.origin);u.listen(id);u.send('sidequest.accept',{quest:id});u.go(q.source);u.send('sidequest.deliver',{quest:id});
  const ambient=data.ambient.filter(e=>e.sidequest===id);assert.equal(ambient.length,2);assert.ok(ambient.every(e=>!eligible(e,u.s)));
  u.go(q.origin);assert.ok(eligible(ambient.find(e=>e.world===q.origin),u.s));assert.equal(eligible(ambient.find(e=>e.world===q.source),u.s),false);u.go(q.source);assert.ok(ambient.every(e=>eligible(e,u.s)));
 }
 assert.equal(u.s.sidequests.quests.quiet_ears.stage,'available');assert.equal(u.s.sidequests.quests.late_tea.stage,'available');
});
