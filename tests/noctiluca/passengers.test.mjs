import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rand as random} from '../../src/client/pixel.js';
import {generateTalk,createPassengerDirector} from '../../src/client/passengers.js';
const ctx={station:'九龍東ホーム',world:'ネオン九龍',next:'スクラップ・ベルト'};
test('generated talk fills every slot and only uses the group members',()=>{
 const texts=new Set();
 for(let seed=1;seed<=200;seed++)for(const [size,tone] of [[2,'chat'],[2,'quarrel'],[3,'chat']]){
  const lines=generateTalk({size,tone,random:random(seed),names:['カナ','ユウ','ミオ'],...ctx});
  assert.ok(lines.length>=3,'a conversation has a few turns');
  for(const l of lines){assert.ok(!/[{}]/.test(l.text),l.text);assert.ok(l.who>=0&&l.who<size);assert.ok(['','!','~'].includes(l.mark));texts.add(l.text);}
  if(size===3)assert.ok(new Set(lines.map(l=>l.who)).size>=2);
 }
 assert.ok(texts.size>150,'lines vary between conversations');
});
function run(d,seconds,opts={width:460}){for(let t=0;t<seconds*10;t++)d.advance(.1,opts);}
test('arrivals board nobody, one, two or three; they walk in and sit down',()=>{
 const sizes=new Set();
 for(let seed=1;seed<=60;seed++){
  const d=createPassengerDirector({random:random(seed)});d.arrive(ctx);
  const q=d.view.queued;sizes.add(q);run(d,20);
  const v=d.view;assert.equal(v.size,q);
  assert.ok(v.members.every(m=>m.state==='seated'));
  const seats=v.members.map(m=>m.seat).sort((a,b)=>a-b);
  for(let i=1;i<seats.length;i++)assert.ok(seats[i]-seats[i-1]>=24/460-1e-9,'nobody shares a seat');
  assert.ok(seats.every(u=>u>0&&u<1));
 }
 assert.deepEqual([...sizes].sort(),[0,1,2,3]);
});
test('a lone traveller never talks; pairs and trios do, and quiet holds the line',()=>{
 for(let seed=1;seed<=40;seed++){
  const d=createPassengerDirector({random:random(seed)});d.seed(ctx,1);
  for(let t=0;t<600;t++){d.advance(.1,{width:460});assert.equal(d.view.line,null);}
 }
 for(const size of [2,3]){
  const d=createPassengerDirector({random:random(size*7)});d.seed(ctx,size);
  let heard=null;for(let t=0;t<200&&!heard;t++){d.advance(.1,{width:460});heard=d.view.line;}
  assert.ok(heard,'a group starts talking');
  const before=d.view.line;run(d,30,{width:460,quiet:true});assert.deepEqual(d.view.line,before);
 }
});
test('seated passengers eventually get off and walk out of the carriage',()=>{
 const d=createPassengerDirector({random:random(3)});d.seed(ctx,2);
 let left=false;
 for(let i=0;i<5&&!left;i++){d.arrive(ctx);left=d.view.leaving;}
 assert.ok(left,'nobody rides for more than three stops');
 run(d,30);assert.ok(!d.view.leaving);
});
import {SPECIES,ANIMAL_POSES,CAST_POSES} from '../../src/client/passenger-kinds.js';
test('now and then someone unusual boards: animals alone, specials alone or with a companion',()=>{
 const seen=new Map();
 for(let seed=1;seed<=400;seed++){
  const d=createPassengerDirector({random:random(seed)});d.arrive(ctx);run(d,25);
  const v=d.view;if(!v.cast)continue;
  const key=v.cast+':'+v.size+':'+v.members.map(m=>m.kind).join(',');seen.set(key,(seen.get(key)||0)+1);
  if(v.cast==='animal'){assert.equal(v.size,1);assert.ok(SPECIES.includes(v.members[0].kind));}
  if(v.cast==='drunk'||v.cast==='maid'){assert.equal(v.members.filter(m=>m.kind===v.cast).length,1);assert.ok(v.members.every(m=>m.kind===v.cast||m.kind==='human'));}
  assert.ok(v.members.every(m=>m.state==='seated'),key);
 }
 const casts=new Set([...seen.keys()].map(k=>k.split(':')[0]));
 assert.deepEqual([...casts].sort(),['alien','animal','drunk','maid','people']);
 const species=new Set([...seen.keys()].filter(k=>k.startsWith('animal')).map(k=>k.split(':')[2]));
 assert.deepEqual([...species].sort(),[...SPECIES].sort());
});
test('animals never talk, and move through many of their own poses',()=>{
 for(const species of SPECIES)for(let seed=1;seed<=3;seed++){
  const d=createPassengerDirector({random:random(seed*11)});d.seed(ctx,{cast:'animal',size:1,species});
  const poses=new Set();
  for(let t=0;t<6000;t++){d.advance(.1,{width:460});assert.equal(d.view.line,null);poses.add(d.view.members[0].pose);}
  for(const p of poses)assert.ok(ANIMAL_POSES[species].includes(p),species+' '+p);
  assert.ok(poses.size>=4,species+' only did '+[...poses]);
 }
});
test('special passengers keep to their own lines and never spend the daily pool',()=>{
 for(const cast of ['drunk','maid','alien'])for(const size of [1,2]){
  let asked=0;const d=createPassengerDirector({random:random(size*5+cast.length),talk:()=>{asked++;return [{who:0,text:'プールの会話',mark:''}];}});
  d.seed(ctx,{cast,size});const heard=new Set(),poses=new Set();
  for(let t=0;t<6000;t++){
   d.advance(.1,{width:460});const l=d.view.line;poses.add(d.view.members[0].pose);
   if(l){assert.ok(!/[{}]/.test(l.text),l.text);assert.ok(l.who>=0&&l.who<size);heard.add(l.text);}
  }
  assert.equal(asked,0,cast);assert.ok(heard.size>=2,cast+size+' says little');assert.ok(!heard.has('プールの会話'));
  if(size===1)for(const p of poses)assert.ok([...CAST_POSES[cast],'talk'].includes(p),cast+' '+p);
 }
 let asked=0;const d=createPassengerDirector({random:random(9),talk:()=>{asked++;return null;}});d.seed(ctx,2);run(d,60);assert.ok(asked>0,'ordinary riders still use the pool');
});
test('in a drunk or maid pair the special passenger opens as themselves',()=>{
 for(const cast of ['drunk','maid'])for(let seed=1;seed<=60;seed++){
  const lines=generateTalk({size:2,cast,random:random(seed),...ctx});
  assert.ok(lines.length>=3);for(const l of lines){assert.ok(!/[{}]/.test(l.text));assert.ok(l.who===0||l.who===1);}
 }
});
test('an animal jumps down and walks out when it gets off',()=>{
 const d=createPassengerDirector({random:random(4)});d.seed(ctx,{cast:'animal',size:1,species:'dog'});
 let left=false;for(let i=0;i<6&&!left;i++){d.arrive(ctx);left=d.view.leaving;}
 assert.ok(left);run(d,30);assert.ok(!d.view.leaving);
});
test('riders seated at page load are spaced for the real seat width',()=>{
 for(const w of [120,195,700])for(let seed=1;seed<=20;seed++){
  const d=createPassengerDirector({random:random(seed)});d.seed(ctx,3,{width:w});
  const xs=d.view.members.map(m=>m.seat*w).sort((a,b)=>a-b);
  for(let i=1;i<xs.length;i++)assert.ok(xs[i]-xs[i-1]>=24.9,w+': '+xs);
 }
});
