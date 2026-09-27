import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createFocusClock,formatTime} from '../../src/client/focus-clock.js';
import {freshState,checkState,reduce} from '../../src/game/rules.js';
import {ROUTES,routeScene,approachScene,focusPassage} from '../../src/client/scenery.js';
test('focus uses deadlines, freezes on pause and emits each expiry once',()=>{
 let now=1000;const c=createFocusClock(()=>now);c.start('work',1500);now+=123400;assert.equal(c.view.seconds,1377);
 c.pause();const remaining=c.view.seconds;now+=3600000;assert.equal(c.view.seconds,remaining);assert.equal(c.poll(),null);
 c.resume();now+=1376600;assert.equal(c.poll(),'work');assert.equal(c.poll(),null);assert.equal(c.view.seconds,0);
 c.completeWork();c.start('break',300);assert.equal(c.view.completed,1);assert.equal(c.view.seconds,300);
});
test('waking after many intervals does not invent work or skip rest',()=>{
 let now=0;const c=createFocusClock(()=>now);c.start('work',5);now=86400000;
 assert.equal(c.poll(),'work');assert.equal(c.poll(),null);assert.equal(c.view.completed,0);
 c.completeWork();c.start('break',5);assert.equal(c.view.seconds,5);assert.equal(c.view.completed,1);
 c.stop();now+=100000;assert.equal(c.poll(),null);assert.equal(c.view.active,false);
});
test('legacy saves keep their pace and gain optional timer preferences',()=>{
 const s=freshState();s.displayName='旅人';delete s.focusTasks;s.settings={chatter:true,frequency:'normal',auto:true,dwell:240,stopDuration:45,density:'normal',hints:true,speed:1,stationStops:true};
 checkState(s);assert.equal(s.settings.dwell,240);assert.equal(s.settings.stopDuration,45);assert.equal(s.settings.travelSeconds,null);assert.equal(s.settings.focusSeconds,1500);assert.equal(s.settings.arrivalBell,true);assert.equal(s.settings.focusGoal,'');assert.deepEqual(s.focusTasks,[]);
});
test('timer preferences validate at the authoritative command boundary',()=>{
 const s=freshState();s.displayName='旅人';
 const set=payload=>reduce(s,{id:'timer-setting',type:'settings.set',payload},{},{now:'2026-09-07T12:00:00Z'}).state;
 const next=set({travelSeconds:1517,focusSeconds:1500,breakSeconds:300,longBreakSeconds:900,longBreakEvery:4,arrivalBell:true,bellVolume:65});assert.equal(next.settings.travelSeconds,1517);assert.equal(s.settings.travelSeconds,null);
 for(const payload of [{travelSeconds:29},{travelSeconds:86401},{travelSeconds:30.5},{travelSeconds:'1500'},{focusSeconds:0},{breakSeconds:NaN},{longBreakSeconds:86401},{longBreakEvery:0},{bellVolume:101},{arrivalBell:1},{focusGoal:3},{focusGoal:'a'.repeat(121)},{focusGoal:'改行\n不可'}])assert.throws(()=>set(payload),{code:'BAD_SETTING'});
 assert.equal(set({travelSeconds:null}).settings.travelSeconds,null);assert.equal(set({focusGoal:'  一章を読む  '}).settings.focusGoal,'一章を読む');assert.equal(set({focusGoal:''}).settings.focusGoal,'');
});
test('duration formatting covers long custom intervals',()=>{assert.equal(formatTime(1500),'25:00');assert.equal(formatTime(86400),'1440:00');assert.equal(formatTime(-1),'00:00');});
test('each timed route visits its districts once, in geographic order at every duration',()=>{
 for(const [world,order] of Object.entries(ROUTES))for(const duration of [2,8.2,82,1500,86400]){
  const seen=[];
  for(let step=0;step<=1000;step++){
   const v=routeScene(world,step/1000,duration);
   if(seen.at(-1)!==v.to)seen.push(v.to);
   assert.ok(v.mix>=0&&v.mix<=1);
  }
  assert.deepEqual(seen,order);
  assert.equal(routeScene(world,2,duration).to,order.at(-1));
  assert.equal(approachScene(world,0).to,order.at(-1));
  assert.deepEqual(approachScene(world,1),{from:0,to:0,mix:1});
 }
});
test('focus scenery reserves the arrival sequence inside the existing deadline, including five-second work',()=>{
 for(const total of [5,30,1500,86400]){
  const start=focusPassage(total,total*1000);assert.equal(start.progress,0);assert.equal(start.departure,0);assert.equal(start.crossing,null);
  const middle=focusPassage(total,total*500);assert.equal(middle.crossing,null);
  const end=focusPassage(total,0);assert.equal(end.progress,1);assert.equal(end.crossing,1);
  assert.ok(focusPassage(total,100).crossing>0);
 }
 let now=0;const c=createFocusClock(()=>now);c.start('work',1500);now=1490000;c.pause();
 const before=focusPassage(c.view.total,c.view.remainingMs);now+=3600000;
 assert.deepEqual(focusPassage(c.view.total,c.view.remainingMs),before);
 c.resume();now+=10001;assert.equal(c.poll(),'work');assert.equal(focusPassage(c.view.total,c.view.remainingMs).crossing,1);
});
import {DISTRICTS,ROUTE_VARIANTS,routeOrder,districtAt} from '../../src/client/scenery.js';
test('Kowloon rides out along a different street each visit, all eight districts in play',()=>{
 assert.equal(DISTRICTS.kowloon.length,8);
 for(const [name,line] of DISTRICTS.kowloon){assert.ok(name&&line);}
 const used=new Set();
 ROUTE_VARIANTS.kowloon.forEach((order,visit)=>{
  assert.deepEqual(routeOrder('kowloon',visit),order);
  assert.equal(order[0],0);assert.equal(new Set(order).size,4,'three different districts after the station');
  for(const duration of [5,1500]){
   const seen=[];for(let step=0;step<=1000;step++){const v=routeScene('kowloon',step/1000,duration,visit);if(seen.at(-1)!==v.to)seen.push(v.to);}
   assert.deepEqual(seen,order);
  }
  order.forEach(d=>used.add(d));
 });
 assert.deepEqual([...used].sort(),[0,1,2,3,4,5,6,7]);
 // Arriving in Kowloon comes in through the same outer district the visit's ride out leaves by.
 ROUTE_VARIANTS.kowloon.forEach((order,visit)=>{assert.equal(approachScene('kowloon',0,visit).to,order[3]);assert.deepEqual(approachScene('kowloon',1,visit),{from:0,to:0,mix:1});});
 // Other worlds keep their single fixed route.
 assert.deepEqual(routeOrder('scrap',5),ROUTES.scrap);
 // Free cruising ("この星を、ずっと") also reaches the new districts over visits.
 const cruising=new Set();for(let visit=0;visit<14;visit++)for(let dist=0;dist<88;dist+=22)cruising.add(districtAt(dist,visit,7));
 assert.deepEqual([...cruising].sort(),[0,1,2,3,4,5,6,7]);
 assert.ok([0,1,2,3].includes(districtAt(30,5)),'three-district worlds unchanged');
});
