import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rand as random} from '../../src/client/pixel.js';
import {createPassengerDirector} from '../../src/client/passengers.js';
import {ANIMAL_POSES,SPECIES} from '../../src/client/passenger-kinds.js';
const ctx={station:'九龍東ホーム',world:'ネオン九龍',next:'スクラップ・ベルト'};
const W={width:460};
// Run until `done` or the time runs out; `each` sees every frame.
function run(d,seconds,each=()=>{},opts=W){for(let t=0;t<seconds*10;t++){d.advance(.1,opts);if(each(d.view))return true;}return false;}

test('two of a trio come to blows; their friend and the conductor break it up, then everyone sits again',()=>{
 for(let seed=1;seed<=12;seed++){
  const d=createPassengerDirector({random:random(seed)});d.seed(ctx,3);
  assert.ok(d.stage('fight'));
  let punched=false,dust=false,staff=false,staffSpoke=false,held=0,stood=0;
  const ended=run(d,240,v=>{
   punched||=v.members.some(m=>m.pose==='punch');dust||=v.dust;staff||=!!v.staff;
   if(v.line?.who==='staff'){staffSpoke=true;assert.ok(v.staff,'the conductor is there when he speaks');}
   held=Math.max(held,v.members.filter(m=>m.pose==='held').length);stood=Math.max(stood,v.members.filter(m=>m.state==='stand').length);
   if(v.staff)assert.ok(v.staff.x>-.2&&v.staff.x<1.2);
   return !v.scene;
  });
  assert.ok(ended,'the scene finishes');
  assert.ok(punched&&dust&&staff&&staffSpoke,'a scuffle, a cloud and the conductor');
  assert.equal(held,2,'both fighters are held back');assert.equal(stood,3,'the friend stands up too');
  run(d,30);const v=d.view;
  assert.ok(v.members.every(m=>m.state==='seated'));assert.equal(v.staff,null,'the conductor walks back out');assert.ok(!v.dust);
 }
});
test('a sleeper tips onto a shoulder, and spilled oranges are all picked up',()=>{
 for(let seed=1;seed<=12;seed++){
  const d=createPassengerDirector({random:random(seed)});d.seed(ctx,2);
  assert.ok(d.stage('lean'));let leaned=false;
  assert.ok(run(d,120,v=>{leaned||=v.members.some(m=>m.pose==='lean'&&m.look!==0);return !v.scene;}));assert.ok(leaned);
  const e=createPassengerDirector({random:random(seed)});e.seed(ctx,2);
  assert.ok(e.stage('oranges'));let most=0,picked=false;
  assert.ok(run(e,180,v=>{most=Math.max(most,v.props.length);picked||=v.members.some(m=>m.pose==='pick');for(const o of v.props)assert.ok(o.x>=.03-1e-9&&o.x<=.97+1e-9);return !e.view.scene;}));
  assert.ok(most>=4&&picked);assert.equal(e.view.props.length,0);assert.ok(e.view.members.every(m=>m.state==='seated'));
 }
});
test('scenes only suit ordinary riders of the right number',()=>{
 const d=createPassengerDirector({random:random(2)});d.seed(ctx,2);assert.equal(d.stage('fight'),false);
 d.seed(ctx,{cast:'drunk',size:2});assert.equal(d.stage('lean'),false);
 d.seed(ctx,3);assert.equal(d.stage('lean'),false);
});
test('on their own, some trios and pairs play a scene out during the ride',()=>{
 const seen=new Set();
 for(let seed=1;seed<=80;seed++)for(const size of [2,3]){
  const d=createPassengerDirector({random:random(seed*3+size)});d.seed(ctx,size);
  run(d,200,v=>{if(v.scene)seen.add(v.scene);});
 }
 assert.deepEqual([...seen].sort(),['fight','lean','oranges']);
});
test('a scene holds while the carriage is quiet, and nobody gets off in the middle of it',()=>{
 const d=createPassengerDirector({random:random(5)});d.seed(ctx,3);d.stage('fight');
 run(d,8);const before=d.view.line;run(d,20,()=>{},{width:460,quiet:true});assert.deepEqual(d.view.line,before);
 d.arrive(ctx);assert.ok(!d.view.leaving);
});
test('animals hop down, wander the floor and settle on a seat again',()=>{
 for(const species of SPECIES)for(let seed=1;seed<=3;seed++){
  const d=createPassengerDirector({random:random(seed*13)});d.seed(ctx,{cast:'animal',size:1,species});
  const states=new Set();let back=false,wasFloor=false;
  run(d,900,v=>{const m=v.members[0];states.add(m.state);assert.ok(m.x>0&&m.x<1);assert.ok(ANIMAL_POSES[species].includes(m.pose),m.pose);assert.equal(v.line,null);
   if(m.state==='floor')wasFloor=true;if(wasFloor&&m.state==='seated')back=true;});
  for(const s of ['down','roam','floor','walk','sit','seated'])assert.ok(states.has(s),species+' never '+s);
  assert.ok(back,species+' stays on the floor');
 }
 // Getting off from the floor, it simply walks out.
 const d=createPassengerDirector({random:random(8)});d.seed(ctx,{cast:'animal',size:1,species:'cat'});
 assert.ok(run(d,900,v=>v.members[0].state==='floor'));
 for(let i=0;i<6&&!d.view.leaving;i++)d.arrive(ctx);
 assert.equal(d.view.members[0].state,'out');run(d,30);assert.equal(d.view.size,0);
});
test('a drunk alone may stretch out asleep, but never over the props or off the seat',()=>{
 let lay=0;
 for(let seed=1;seed<=30;seed++){
  const d=createPassengerDirector({random:random(seed)});d.seed(ctx,{cast:'drunk',size:1},{width:700});
  const m0=d.view.members[0];
  run(d,900,v=>{const m=v.members[0];if(m.pose!=='lie')return;
   assert.ok(m.lie===1||m.lie===-1);const end=m.seat+m.lie*56/700,lo=Math.min(m.seat,end),hi=Math.max(m.seat,end);
   assert.ok(lo>0&&hi<1);for(const [a,b] of [[.43,.53],[.72,.85]])assert.ok(hi<a||lo>b,'lies on a prop');
   if(v.line)assert.equal(v.line.pose,'lie','talks in his sleep without sitting up');
   lay++;return true;},{width:700});
  assert.ok(m0);
 }
 assert.ok(lay>=5,'only '+lay+' of 30 lay down');
});
test('a lone rider dozing at the stop wakes with a start and hurries off',()=>{
 let rushed=0;
 for(let seed=1;seed<=40;seed++){
  const d=createPassengerDirector({random:random(seed)});d.seed(ctx,1);
  if(!run(d,300,v=>v.members[0].pose==='doze'))continue;
  d.arrive(ctx);if(!d.view.members[0].rush)continue;
  rushed++;assert.ok(d.view.leaving);assert.match(d.view.line.text,/降ります|乗り過ごす|九龍東ホーム/);
  assert.ok(run(d,8,v=>v.size===0),'dashes out quickly');
 }
 assert.ok(rushed>=5,'only '+rushed);
});
