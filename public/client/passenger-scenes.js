// Little scenes that now and then play out on the facing seat: two of a trio
// come to blows until their friend and the conductor pull them apart, a sleeper
// slumps onto a companion's shoulder, and a bag of oranges spills across the
// floor. Each scene is a list of steps the director in passengers.js runs in
// order: `on` starts something, `tick` animates, `line` is said by a member
// index (or 'staff'), and a step lasts `d` seconds (or until its line is read)
// and then until `until()` holds. View-only: nothing is saved or counted.
import {mod} from './anim-utils.js';

const pickOf=(r,a)=>a[Math.floor(r()*a.length)];
const say=(who,text)=>{const mark=text[0]==='!'||text[0]==='~'?text[0]:'';return {who,text:mark?text.slice(1):text,mark};};

// The conductor who comes down the carriage to stop a fight.
export function conductorLook(){
 return {skin:'#e2b896',hair:'#2c211b',top:'#26324a',bottom:'#1f2530',style:'cap',skirt:false,glasses:false,scarf:null,bag:null,badge:true,phase:0,blink:4.2};
}
// What a drunk mumbles once he has lain down across the seat.
export const SLEEP_TALK=['……むにゃ。もう一杯。','ぐう……ぐう……','……{boss}、それは、ちがう……','……かあちゃん、ただいま……','すぴー……'];
// Which of an animal's poses also work on the carriage floor.
export const FLOOR_POSES={cat:['loaf','groom','look','stretch','swish','yawn'],dog:['sit','lie','pant','tilt','scratch','wag'],weasel:['stand','groom','flat','dance'],rabbit:['loaf','twitch','groom','stand','binky']};

// k: {r, g (the group), px (pixels to a seat fraction), stand(m), goTo(m,u,face), sitBack(m), enterStaff(u), exitStaff()}
export function fightScene(k){
 const {r,g,px}=k,[p,q]=r()<.5?[0,1]:[1,2],c=3-p-q,A=g.members[p],B=g.members[q],C=g.members[c];
 const side=Math.sign(B.seat-A.seat)||1,mid=Math.max(px(45),Math.min(1-px(45),(A.seat+B.seat)/2));// room for the friend and the conductor either side
 const brawl=(dt,t)=>{const f=mod(t,.9)<.45;A.pose=f?'punch':'reel';B.pose=f?'reel':'punch';};
 const standing=(...ms)=>()=>ms.every(m=>m.state==='stand');
 return [
  {line:say(p,pickOf(r,['!いま、なんて言った?','!もう一回、言ってみろ。','!それ、おれのせいかよ。'])),on(){A.pose='gesture';B.pose='cross';A.look=side;B.look=-side;C.look=Math.sign(mid-C.seat);}},
  {line:say(q,pickOf(r,['!なんだと?','!そっちが先だろ。','!あ?'])),on(){B.pose='gesture';A.pose='cross';}},
  {d:.2,on(){k.stand(A);k.stand(B);C.pose='idle';},until:standing(A,B)},
  {on(){k.goTo(A,mid-side*px(10),side);k.goTo(B,mid+side*px(10),-side);},until:standing(A,B)},
  {d:2.4,line:say(p,pickOf(r,['!やんのか!','!表出ろ!……いや、ここ車内か。'])),on(){g.dust=true;},tick:brawl},
  {line:say(q,pickOf(r,['!上等だ!','!かかってこい!'])),tick:brawl},
  {line:say(c,pickOf(r,['!ちょっと、やめなって!','!ふたりとも、落ち着いて!'])),on(){k.stand(C);k.enterStaff(B.x+side*px(15));},tick:brawl,until:standing(C)},
  {on(){k.goTo(C,A.x-side*px(15),side);},tick:brawl,until:()=>C.state==='stand'&&g.staff?.state==='stand'},
  {line:say('staff',pickOf(r,['!車内での喧嘩は、おやめください!','!お客さま、おやめください!'])),on(){g.dust=false;A.pose='held';B.pose='held';C.pose='hold';g.staff.pose='hold';g.staff.dir=-side;}},
  {line:say(p,pickOf(r,['!はなせって!……わかったよ。','!……わかった、わかったから。']))},
  {line:say(q,pickOf(r,['……悪かった。','……言いすぎた。'])),on(){A.pose='idle';B.pose='bow';C.pose='idle';g.staff.pose='idle';}},
  {line:say(p,pickOf(r,['~……おれも。','~……いや、おれこそ。'])),on(){B.pose='idle';A.pose='bow';}},
  {line:say('staff',pickOf(r,['~では、よい旅を。','~ほかのお客さまもいらっしゃいますので。'])),on(){A.pose='idle';g.staff.pose='bow';}},
  {on(){for(const m of [A,B,C])k.sitBack(m);k.exitStaff();},until:()=>[A,B,C].every(m=>m.state==='seated')},
  {line:say(c,pickOf(r,['~……もう、ほんとに。','~次の駅で、なんか奢ってよね。'])),on(){C.pose='laugh';}},
 ];
}

export function leanScene(k){
 const {r,g}=k,a=r()<.5?0:1,b=1-a,A=g.members[a],B=g.members[b],side=Math.sign(B.seat-A.seat)||1;
 return [
  {d:5,on(){A.pose='doze';A.look=0;B.pose='idle';B.look=0;}},
  {d:3,on(){A.pose='lean';A.look=side;}},
  {line:say(b,pickOf(r,['~……しょうがないなあ。','……重い。','~(起こさないでおこう)'])),on(){B.look=-side;}},
  {d:9,on(){B.look=0;B.pose=pickOf(r,['idle','phone','read']);}},
  {line:say(a,pickOf(r,['!はっ……寝てた?','!うわ、ごめん!'])),on(){A.pose='gesture';A.look=side;B.pose='idle';}},
  {line:say(b,pickOf(r,['~よだれ、出てたよ。','~肩、貸し一回ね。','~ぐっすりだったね。'])),on(){B.pose='laugh';B.look=-side;}},
  {line:say(a,pickOf(r,['~ごめんごめん。','~……出てないよね?'])),on(){A.pose='laugh';}},
 ];
}

export function orangeScene(k){
 const {r,g,px}=k,a=r()<.5?0:1,b=1-a,A=g.members[a],B=g.members[b];
 const roll=dt=>{for(const o of g.props){o.x+=o.v*dt;o.v*=Math.pow(.5,dt);if(o.x<.03||o.x>.97){o.x=Math.max(.03,Math.min(.97,o.x));o.v=-o.v*.5;}}};
 // Each picker walks to the nearest orange nobody has claimed, crouches, and picks it up.
 const pick=dt=>{for(const m of [A,B]){
  if(!m.job){const free=g.props.filter(o=>!o.who);if(!free.length){if(m.pose==='pick')m.pose='idle';continue;}
   const o=free.reduce((x,y)=>Math.abs(y.x-m.x)<Math.abs(x.x-m.x)?y:x);o.who=m;m.job=o;m.jt=0;k.goTo(m,o.x+(o.x>m.x?-1:1)*px(5),Math.sign(o.x-m.x)||m.dir);continue;}
  if(m.state!=='stand')continue;m.pose='pick';m.jt+=dt;
  if(m.jt>.8){m.job.taken=true;g.props=g.props.filter(o=>o!==m.job);m.job=null;m.pose='idle';}
 }};
 return [
  {line:say(a,pickOf(r,['!あっ……!','!わっ、袋が!'])),on(){A.pose='gesture';g.props=Array.from({length:4+Math.floor(r()*3)},()=>({x:A.seat,v:(r()<.5?-1:1)*px(20+r()*60)}));},tick:roll},
  {line:say(b,pickOf(r,['~転がってく転がってく。','!あ、そっち行った!'])),on(){B.look=Math.sign(A.seat-B.seat);},tick:roll},
  {on(){k.stand(A);k.stand(B);},tick:roll,until:()=>A.state==='stand'&&B.state==='stand'},
  {tick(dt){roll(dt);pick(dt);},until:()=>!g.props.length&&!A.job&&!B.job},
  {on(){k.sitBack(A);k.sitBack(B);},until:()=>A.state==='seated'&&B.state==='seated'},
  {line:say(a,pickOf(r,['~ありがとう。ひとつ、どうぞ。','~助かった。……みかん、いる?'])),on(){A.pose='gesture';A.look=Math.sign(B.seat-A.seat);}},
  {line:say(b,pickOf(r,['~やった。','~じゃあ、ひとつだけ。'])),on(){B.pose='laugh';B.look=Math.sign(A.seat-B.seat);A.pose='idle';}},
 ];
}
export const SCENES={fight:fightScene,lean:leanScene,oranges:orangeScene};
