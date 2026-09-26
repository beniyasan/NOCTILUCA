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
