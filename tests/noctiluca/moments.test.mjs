import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MOMENTS,createMomentDirector} from '../../src/client/kowloon-moments.js';
const context={ready:true,district:1,travel:0,width:1800,duration:1500,rain:true,lightRain:true,tableOpen:true};
test('all eight incidents are reachable, capped and never repeated within a visit',()=>{
 const found=new Set(),counts=new Set();
 for(let seed=1;seed<=90;seed++){
  const d=createMomentDirector();d.reset(seed,1500);
  for(let t=0;t<2500;t++)d.advance(1,{...context,district:Math.floor(t/50)%4});
  const v=d.view;assert.equal(new Set(v.seen).size,v.seen.length);assert.ok(v.seen.length<=v.limit&&v.limit>=4&&v.limit<=7);
  v.seen.forEach(id=>found.add(id));counts.add(v.seen.length);
 }
 assert.deepEqual([...found].sort(),MOMENTS.map(e=>e.id).sort());assert.ok(counts.size>1);
});
test('weather and saved equipment gate incidents; ordinary visits can contain none',()=>{
 let empty=false;
 for(let seed=1;seed<=80;seed++){
  const d=createMomentDirector();d.reset(seed,120);
  for(let t=0;t<400;t++)d.advance(1,{...context,duration:120,district:Math.floor(t/30)%4,rain:false,lightRain:false,tableOpen:false});
  assert.ok(d.view.seen.length<=2);for(const id of ['rain_cover','laundry','mei_chair'])assert.ok(!d.view.seen.includes(id));
  if(!d.view.seen.length)empty=true;
 }
 assert.ok(empty);
});
test('pause and repeated painting do not advance incidents; completed changes survive district changes',()=>{
 const d=createMomentDirector();d.reset(15,1500);
 for(let t=0;t<800&&!d.view.done.stall_close;t++)d.advance(1,context);
 assert.ok(d.view.done.stall_close);
 const before=d.view;for(let i=0;i<20;i++){d.advance(0,context);void d.view;}
 assert.deepEqual(d.view,before);
 d.advance(1,{...context,district:3,ready:false});assert.deepEqual(d.view.done.stall_close,before.done.stall_close);
 d.reset(16,1500);assert.deepEqual(d.view.done,{});
});
test('no incident starts in a transition or when the relevant place is offscreen',()=>{
 const d=createMomentDirector();d.reset(15,1500);
 for(let t=0;t<500;t++)d.advance(1,{...context,ready:false});assert.deepEqual(d.view.seen,[]);
 for(let t=0;t<500;t++)d.advance(1,{...context,district:2,width:160,travel:30});assert.deepEqual(d.view.seen,[]);
});

import {SCRAP_MOMENTS} from '../../src/client/scrap-moments.js';
test('all ten scrap incidents occur with no repeated incident or consecutive obstruction',()=>{
 const found=new Set();
 for(let seed=1;seed<=150;seed++){
  const d=createMomentDirector(SCRAP_MOMENTS);d.reset(seed,1500);
  for(let t=0;t<2600;t++)d.advance(1,{...context,district:Math.floor(t/45)%4});
  const {seen,limit}=d.view;assert.equal(new Set(seen).size,seen.length);assert.ok(seen.length<=limit);
  for(let i=0;i<seen.length;i++){
   found.add(seen[i]);
   if(i&&SCRAP_MOMENTS.find(e=>e.id===seen[i]).group==='obstruction')assert.notEqual(SCRAP_MOMENTS.find(e=>e.id===seen[i-1]).group,'obstruction');
  }
 }
 assert.deepEqual([...found].sort(),SCRAP_MOMENTS.map(e=>e.id).sort());
});
test('scrap remains occasional on normal journeys and keeps visit changes without affecting Kowloon',()=>{
 const kowloon=createMomentDirector();kowloon.reset(15,1500);for(let t=0;t<800;t++)kowloon.advance(1,context);
 const before=kowloon.view,counts=new Set();
 for(let seed=1;seed<=80;seed++){
  const d=createMomentDirector(SCRAP_MOMENTS);d.reset(seed,120);
  for(let t=0;t<400;t++)d.advance(1,{...context,duration:120,district:Math.floor(t/30)%4});
  counts.add(d.view.seen.length);assert.ok(d.view.seen.length<=2);
  const done=d.view.done;d.advance(0,context);assert.deepEqual(d.view.done,done);
  d.advance(1,{...context,district:3,ready:false});assert.deepEqual(d.view.done,done);
  d.reset(seed+1);assert.deepEqual(d.view.done,{});
 }
 assert.ok(counts.has(0)&&counts.has(2));assert.deepEqual(kowloon.view,before);
});

import {PELAGIC_MOMENTS,pelagicDockPose} from '../../src/client/pelagic-moments.js';
test('all ten harbor incidents are reachable, capped, and separated by quiet time',()=>{
 const found=new Set();
 for(let seed=1;seed<=150;seed++){
  const d=createMomentDirector(PELAGIC_MOMENTS);d.reset(seed,1500);let lastEnd=-Infinity,previous=null;
  for(let t=0;t<2700;t++){
   d.advance(1,{...context,fog:true,district:Math.floor(t/55)%4});const active=d.view.active;
   if(previous&&!active)lastEnd=t;
   if(active&&!previous){assert.ok(t-lastEnd>=75);found.add(active.id);}
   previous=active;
  }
  const v=d.view;assert.equal(new Set(v.seen).size,v.seen.length);assert.ok(v.seen.length<=v.limit);
 }
 assert.deepEqual([...found].sort(),PELAGIC_MOMENTS.map(e=>e.id).sort());
});
test('fog arrival requires fog; harbor traces are visit-local and pause does not simulate time',()=>{
 let trace=false,empty=false;
 for(let seed=1;seed<=90;seed++){
  const d=createMomentDirector(PELAGIC_MOMENTS);d.reset(seed,120);
  for(let t=0;t<450;t++)d.advance(1,{...context,duration:120,fog:false,district:Math.floor(t/35)%4});
  assert.ok(!d.view.seen.includes('fog_return'));assert.ok(d.view.seen.length<=2);empty||=!d.view.seen.length;
  const before=d.view;d.advance(0,context);assert.deepEqual(d.view,before);
  if(Object.keys(before.done).length){trace=true;d.advance(1,{...context,ready:false});assert.deepEqual(d.view.done,before.done);}
  d.reset(seed+1);assert.deepEqual(d.view.done,{});
 }
 assert.ok(trace&&empty);
});
test('boarding and its lasting cargo share the same floating boat pose, with no reset jump',()=>{
 const event={id:'gangway',cell:0,duration:26,progress:0};
 assert.deepEqual(pelagicDockPose(12,{},0),pelagicDockPose(12,{active:event},0));
 const landed=pelagicDockPose(12,{active:{...event,progress:1}},0);
 assert.deepEqual(landed,pelagicDockPose(12,{done:{gangway:{...event,progress:1}}},0));
 assert.equal(landed.boatX,234);
 assert.equal(landed.boatY-pelagicDockPose(12,{},0).boatY,2);
 assert.notEqual(pelagicDockPose(12,{active:{id:'pier_lunch',cell:0,duration:30,progress:.4}},0).pierY,landed.pierY);
});

import {GORGE_MOMENTS,gorgeLiftPose,gorgeStairY} from '../../src/client/gorge-moments.js';
test('all ten canyon scenes are reachable without repeating; dust is restricted to dusty visits',()=>{
 const found=new Set();let empty=false;
 for(let seed=1;seed<=150;seed++){
  const d=createMomentDirector(GORGE_MOMENTS);d.reset(seed,1500);
  for(let t=0;t<2800;t++)d.advance(1,{...context,dusty:true,district:Math.floor(t/60)%4});
  d.view.seen.forEach(id=>found.add(id));assert.ok(d.view.seen.length<=d.view.limit);assert.equal(new Set(d.view.seen).size,d.view.seen.length);
  d.reset(seed+1,120);
  for(let t=0;t<500;t++)d.advance(1,{...context,dusty:false,duration:120,district:Math.floor(t/35)%4});
  assert.ok(!d.view.seen.includes('dust_curtain'));assert.ok(d.view.seen.length<=2);empty||=!d.view.seen.length;
  const before=d.view;d.advance(0,context);assert.deepEqual(d.view,before);
  d.reset(seed+2);assert.deepEqual(d.view.done,{});
 }
 assert.deepEqual([...found].sort(),GORGE_MOMENTS.map(e=>e.id).sort());assert.ok(empty);
});
test('a bread delivery goes up, exchanges its load and returns; the rest landing stays level',()=>{
 const start=gorgeLiftPose(0),up=gorgeLiftPose(14/31),exchange=gorgeLiftPose(19/31),end=gorgeLiftPose(1);
 assert.ok(up.y<start.y);assert.ok(up.breadInBasket);assert.ok(!up.cupInBasket);
 assert.ok(exchange.breadDelivered&&!exchange.breadInBasket);
 assert.equal(end.y,start.y);assert.ok(end.cupInBasket&&end.breadDelivered&&!end.breadInBasket);
 assert.equal(gorgeStairY(478),386);assert.equal(gorgeStairY(548),346);assert.equal(gorgeStairY(578),346);assert.equal(gorgeStairY(635),306);
});

import {JADE_MOMENTS,jadeWaterPose,jadeLeafDrops} from '../../src/client/jade-moments.js';
test('all ten Jade scenes are reachable; wet-leaf cascades require a wet-leaf visit',()=>{
 const found=new Set();let empty=false;
 for(let seed=1;seed<=150;seed++){
  const d=createMomentDirector(JADE_MOMENTS);d.reset(seed,1500);
  for(let t=0;t<2800;t++)d.advance(1,{...context,wetLeaves:true,district:Math.floor(t/60)%4});
  const before=d.view;before.seen.forEach(id=>found.add(id));assert.ok(before.seen.length<=before.limit);assert.equal(new Set(before.seen).size,before.seen.length);
  d.advance(0,context);assert.deepEqual(d.view,before);
  d.reset(seed+1,120);assert.deepEqual(d.view.done,{});
  for(let t=0;t<500;t++)d.advance(1,{...context,wetLeaves:false,duration:120,district:Math.floor(t/35)%4});
  assert.ok(!d.view.seen.includes('leaf_waterfall'));assert.ok(d.view.seen.length<=2);empty||=!d.view.seen.length;
 }
 assert.deepEqual([...found].sort(),JADE_MOMENTS.map(e=>e.id).sort());assert.ok(empty);
});
test('the watering robot checks but never waters the damp middle pot and returns to its dock',()=>{
 const watered=new Set(),checked=new Set();
 for(let q=0;q<=35;q+=.25){const p=jadeWaterPose(q/35);if(p.wateringPot!==null)watered.add(p.wateringPot);if(p.inspectingPot!==null)checked.add(p.inspectingPot);}
 assert.deepEqual([...watered],[0,2]);assert.deepEqual([...checked],[0,1,2]);assert.equal(jadeWaterPose(1).x,jadeWaterPose(0).x);assert.deepEqual(jadeWaterPose(1).wetted,[true,true]);
});
test('water cascades from one leaf to the next rather than falling from all leaves together',()=>{
 for(let q=0;q<=31;q+=.1){const d=jadeLeafDrops(q/31);assert.ok(d.filter(x=>x.falling).length<=1);for(let i=1;i<3;i++)if(d[i].falling)assert.ok(d[i-1].landed);}
 assert.ok(jadeLeafDrops(1).every(d=>d.landed&&!d.falling));
});

import {RELAY_MOMENTS,relayCarrierPose,relayHandoffPose,relayCablePose} from '../../src/client/relay-moments.js';
test('all ten unmanned incidents are reachable, occasional, and keep only visit-local traces',()=>{
 const found=new Set();let empty=false;
 for(let seed=1;seed<=150;seed++){
  const d=createMomentDirector(RELAY_MOMENTS);d.reset(seed,1500);
  for(let t=0;t<2800;t++)d.advance(1,{...context,district:Math.floor(t/60)%4});
  const before=d.view;before.seen.forEach(id=>found.add(id));assert.ok(before.seen.length<=before.limit);assert.equal(new Set(before.seen).size,before.seen.length);
  d.advance(0,context);assert.deepEqual(d.view,before);
  d.advance(1,{...context,ready:false});assert.deepEqual(d.view.done,before.done);
  d.reset(seed+1,120);assert.deepEqual(d.view.done,{});
  for(let t=0;t<500;t++)d.advance(1,{...context,duration:120,district:Math.floor(t/35)%4});
  assert.ok(d.view.seen.length<=2);empty||=!d.view.seen.length;
 }
 assert.deepEqual([...found].sort(),RELAY_MOMENTS.map(e=>e.id).sort());assert.ok(empty);
});
test('the loaded carrier disappears into the building, stores one box, and returns empty',()=>{
 const start=relayCarrierPose(0),unload=relayCarrierPose(21/38),end=relayCarrierPose(1);
 assert.ok(start.loaded&&!start.stored&&!start.hidden);assert.ok(unload.hidden&&unload.stored&&!unload.loaded);
 assert.equal(end.x,start.x);assert.ok(end.stored&&!end.loaded&&!end.hidden);
});
test('handoff retracts and rotates before acceptance; the supply pod waits for the cable lock',()=>{
 assert.ok(relayHandoffPose(13/34).x<relayHandoffPose(8/34).x);
 assert.equal(relayHandoffPose(20/34).angle,Math.PI/2);assert.ok(!relayHandoffPose(26/34).received);assert.ok(relayHandoffPose(27/34).received);
 let moved=false;
 for(let q=0;q<=38;q+=.1){const h=relayCablePose(q/38);if(h.departure>0){moved=true;assert.ok(h.locked);assert.equal(h.retracted,1);}}
 assert.ok(moved);assert.equal(relayCablePose(1).departure,1);
});
