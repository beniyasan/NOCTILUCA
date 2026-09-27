import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState,checkState,reduce,WORLDS} from '../../src/game/rules.js';
import data from '../../src/server/content.js';
import {worlds,LIFE} from '../../src/client/worlds.js';
import {DISTRICTS,ROUTES} from '../../src/client/scenery.js';
import {PAINTERS} from '../../src/client/cityscape.js';
import {FRONTIER_KINDS} from '../../src/client/frontier-scenes.js';
import {ABYSS_MOMENTS,CALDERA_MOMENTS,AERIE_MOMENTS} from '../../src/client/frontier-moments.js';
import {createMomentDirector} from '../../src/client/kowloon-moments.js';
const NEW=['abyss','caldera','aerie'];
const send=(s,type,payload={})=>reduce(s,{id:crypto.randomUUID(),type,payload},data);

test('client and server agree on nine planets, the outer three after Night Relay',()=>{
 assert.deepEqual(worlds.map(w=>w.id),WORLDS.map(w=>w.id));
 assert.deepEqual(worlds.slice(6).map(w=>w.id),NEW);
 for(const w of worlds){
  assert.equal(DISTRICTS[w.id].length,w.id==='kowloon'?8:4,w.id);assert.deepEqual([...ROUTES[w.id]].sort(),[0,1,2,3],w.id);
  assert.ok(LIFE[w.kind]?.stationEn,w.kind);assert.equal(w.conditions.length,3);assert.equal(w.chord.length,4);
 }
 for(const kind of FRONTIER_KINDS)assert.ok(PAINTERS[kind],'painter registered for '+kind);
});
test('the train can arrive at each outer planet, and older saves without their visit counts still load',()=>{
 const old=freshState();old.displayName='旅人';for(const id of NEW)delete old.visits[id];
 let s=checkState(structuredClone(old));
 for(const id of NEW){
  s=send(s,'travel.arrive',{world:id}).state;
  assert.equal(s.location.world,id);assert.equal(s.visits[id],1);
 }
 assert.throws(()=>send(s,'travel.arrive',{world:'nowhere'}),/行き先/);
});
test('each outer platform has its own chatter',()=>{
 for(const id of NEW){
  let s=freshState();s.displayName='旅人';s=send(s,'travel.arrive',{world:id}).state;
  const r=send(s,'ambient.next');assert.equal(r.outcome.ambient?.world,id);
  assert.ok(data.ambient.filter(e=>e.world===id).length>=3);
 }
});
test('every outer gimmick can happen and none repeats within a visit',()=>{
 for(const list of [ABYSS_MOMENTS,CALDERA_MOMENTS,AERIE_MOMENTS]){
  const found=new Set();
  for(let seed=1;seed<=80;seed++){
   const d=createMomentDirector(list);d.reset(seed,1500);
   for(let t=0;t<2500;t++)d.advance(1,{ready:true,district:Math.floor(t/50)%4,travel:t*3,width:1800,duration:1500});
   assert.equal(new Set(d.view.seen).size,d.view.seen.length);d.view.seen.forEach(id=>found.add(id));
  }
  assert.deepEqual([...found].sort(),list.map(e=>e.id).sort());
  for(const e of list)assert.ok(e.district>=0&&e.district<=3&&e.anchor>0&&e.anchor<768&&e.duration>0);
 }
});
