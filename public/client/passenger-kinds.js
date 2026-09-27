// Passengers who are not ordinary commuters: a tipsy salaryman on his way home,
// a cat-eared robot maid, visitors from off-world, and animals riding on their
// own. Animals never talk; they have a wider repertoire of movements instead.
// Lines, looks and pixel painters only; passengers.js decides who boards.
import {mod} from './anim-utils.js';

const pickOf=(r,a)=>a[Math.floor(r()*a.length)];

// ---- who they are ----------------------------------------------------------
export const SPECIES=['cat','dog','weasel','rabbit'];
export const ANIMAL_POSES={
 cat:['loaf','groom','stretch','sleep','swish','look','knead','yawn'],
 dog:['sit','lie','pant','tilt','sleep','scratch','window','wag'],
 weasel:['stand','dash','curl','flat','groom','dance'],
 rabbit:['loaf','twitch','groom','flop','binky','stand'],
};
export const CAST_POSES={drunk:['sway','hiccup','doze','sing','slump','sway','lie'],maid:['idle','ear','tidy','scan','tea','charge'],alien:['idle','curious','map','antenna','photo','idle']};
// Short actions play once and hand back to a resting pose; the rest hold a while.
export const ACTION_SECONDS={stretch:3,yawn:2.4,binky:1.6,hiccup:1.4,dash:4.5,dance:3.6,scratch:3,photo:2.6,tidy:5,groom:5,knead:5,tilt:3};
// How fast each kind walks, relative to a person.
export const PACE={human:1,drunk:.72,maid:1,alien:.85,cat:1.3,dog:1.7,weasel:1.9,rabbit:1.4};

export function animalLook(r,species){
 const coats={
  cat:[['#2e2a33','#4a4452'],['#c9803f','#e8b070'],['#8a8f99','#b0b4bc'],['#e6e2da','#f4f2ee'],['#3a2e28','#e6e2da']],
  dog:[['#c98b4a','#f0dcc0'],['#2b2b2b','#e8e4dc'],['#e8e4dc','#f6f4ee'],['#7a5230','#c8a070']],
  weasel:[['#8a5a34','#efdcb8'],['#eee9df','#f8f6f0'],['#4a3a30','#d8c8a8']],
  rabbit:[['#eeeae4','#f8f6f2'],['#9a7652','#e8d8c0'],['#8d8a86','#d8d4ce'],['#2e2a2a','#eeeae4']],
 }[species];
 const [coat,light]=pickOf(r,coats);
 return {species,coat,light,ears:species==='dog'?pickOf(r,['up','flop']):'up',phase:r()*10};
}
export function drunkLook(r){
 return {skin:pickOf(r,['#e8a888','#d89478','#c07c5e']),hair:pickOf(r,['#6a6a6a','#9a9a9a','#2c211b']),top:pickOf(r,['#3a3f4a','#4a4438','#2f3540']),bottom:pickOf(r,['#2a2f3a','#3a3630']),
  style:pickOf(r,['bald','comb','crop']),skirt:false,glasses:r()<.4,scarf:null,bag:null,tie:pickOf(r,['#b04040','#3f5f9a','#c9a24a']),headTie:r()<.35,box:r()<.6,flush:true,phase:r()*10,blink:2.4+r()*2};
}
export function maidLook(r){
 return {metal:pickOf(r,['#d8dde2','#e4dcd4','#cfd8e0']),hair:pickOf(r,['#f0b8c8','#b8e0d0','#c8b8e8','#f4f0e8','#2c2a34']),dress:pickOf(r,['#1e1e28','#2a2440','#1e2a30']),eye:pickOf(r,['#7ff0ff','#ff9ad0','#ffd27f']),phase:r()*10,blink:4+r()*3};
}
export function alienLook(r){
 return {skin:pickOf(r,['#7fbf7a','#b39ad8','#6fc2c0','#d8a0c8']),suit:pickOf(r,['#9aa8b8','#c8c0a8','#6a7a9a','#b86a5a']),glow:pickOf(r,['#aaff88','#ff88ee','#88ddff','#ffe066']),phase:r()*10,blink:5+r()*4};
}

// ---- what they say ----------------------------------------------------------
// Monologues are single lines; `pose` is what the speaker does while it shows.
const SOLO={
 drunk:[
  {text:'ひっく。',mark:'!',pose:'hiccup'},{text:'もう一軒……いや、帰る。',pose:'talk'},{text:'♪ほし〜の〜 せんろは〜',mark:'~',pose:'sing'},
  {text:'{boss}のばかやろ〜……むにゃ。',pose:'doze'},{text:'{st}……? ここ、どこだっけ。',pose:'talk'},{text:'おみやげ、忘れてない。よし。',pose:'talk'},
  {text:'かあちゃん、怒ってるかなあ。',pose:'talk'},{text:'ひっく。……失礼。',mark:'!',pose:'hiccup'},{text:'{next}で起こしてくれぇ……',pose:'doze'},
 ],
 maid:[
  {text:'次は、{next}。到着まで、およそ{time}です。',pose:'scan'},{text:'お席の埃、除去しました。',pose:'tidy'},{text:'……充電残量、{battery}%。',pose:'charge'},
  {text:'ご主人さまの帰宅予定時刻を、更新します。',pose:'scan'},{text:'紅茶の温度、適温を維持しています。',pose:'tea'},{text:'耳センサー、感度良好。',pose:'ear'},
 ],
 alien:[
  {text:'◇△○……',pose:'curious'},{text:'テツドウ。……スキ。',pose:'talk'},{text:'▽◁ ◇◇?',pose:'map'},{text:'(カシャ)',mark:'~',pose:'photo'},{text:'{next}……ドコ?',pose:'map'},{text:'○▽○。',pose:'antenna'},
 ],
};
// Conversations use the same beat format as passengers.js. For drunk and maid
// pairs 'a' is always the special passenger and 'b' the person with them.
export const CAST_TALK={
 drunk:[
  [['a','!もう一軒いこう、もう一軒!','まだ飲めるって。'],['b','終電ですよ、これ。','明日も早番でしょう。'],['a','~かたいこと言うなよぉ。','~おまえはいいやつだなあ。'],['b','はいはい。','水、飲んでください。'],['?a','……ひっく。','{food}、うまかったなあ。']],
  [['a','おれはな、{boss}に言ってやったんだ。','聞いてくれよ、{day}のこと。'],['b','それ、三回目です。','はい、聞いてます。'],['a','!ほんとに言ったんだぞ!','!今度こそ言う!'],['b','~言ってないやつですね。','~言えるといいですね。'],['?a','……むにゃ。','……着いたら起こして。']],
  [['a','ここ、どこだ?','いま、どのへん?'],['b','{next}の手前です。','まだ二駅あります。'],['a','そうかそうか。','じゃあ寝る。'],['b','寝ないでください。','起こしませんよ。']],
 ],
 maid:[
  [['a','ご主人さま、{thing}はお持ちですか。','お忘れ物はございませんか。'],['b','あ、……忘れた。','たぶん大丈夫。'],['a','!こちらに。予備を携帯しております。','~記録済みです。念のため、確認を。'],['b','~さすがだね。','助かるよ。'],['?a','メイドですので。','お任せください。']],
  [['b','今日の夕飯、なんにしよう。','お腹すいたな。'],['a','{food}を提案します。','冷蔵庫の在庫から、{food}が作れます。'],['b','いいね。','それで。'],['a','~かしこまりました。','~帰宅後、二十分でご用意します。']],
  [['b','耳、動いてるね。','その耳、何か聞こえるの?'],['a','車輪の音を解析しています。','次の駅の案内を拾っています。'],['b','へえ。','便利だね。'],['?a','~……少し、楽しいです。','~猫型ですので。']],
 ],
 alien:[
  [['a','◇△○ ▽◁?','◇◇ ○▽△?'],['b','○○。','▽△……◇。'],['a','!◁◁◁!','!◇○!'],['b','~○○○。','~△△。'],['?a','……エキベン。','……オミヤゲ。']],
  [['a','{next}、ドコ?','ツギ、{next}?'],['b','◇……チズ、サカサ。','▽△。{time}。'],['a','~◇◇◇。','~ナルホド。']],
  [['a','マド、キレイ。','ホシ、ミエル。'],['b','○○。','◇△。……キレイ。'],['?a','▽◁○。','……カエリタクナイ。']],
 ],
};
export function monologue(cast,r,fill){const l=pickOf(r,SOLO[cast]);let text=fill(l.text),mark=l.mark||'';return [{who:0,text,mark,pose:l.pose}];}

// ---- painters ---------------------------------------------------------------
// R draws one pixel rect, shade darkens/lightens a colour, light() queues a pixel
// that is painted after the carriage's night grade so it glows.
export function createKindPainters(R,shade,light){
 const zzz=(x,y,t,phase)=>{const k=mod(t*.5+phase,1),col='#e6dcc0';if(k<.85){const zy=y-Math.round(k*8);R(x,zy,3,1,col);R(x+1,zy+1,1,1,col);R(x,zy+2,3,1,col);}};

 // Robot maid, seated. Same frame as a seated person: feet on the floor at y+42.
 function maidSeated(m,x,y,t){
  const a=m.app,pose=m.pose,look=m.look,dress=a.dress,apron='#eeeae0',metal=a.metal,hair=a.hair,bob=pose==='laugh'?Math.round(Math.abs(Math.sin(t*9))):0;
  const nod=pose==='charge'?2:0,ty=y+6-bob,hx=x+(look||0),hy=y-8-bob+nod;
  R(x-5,y+39,4,3,'#1a1414');R(x+1,y+39,4,3,'#1a1414');R(x-4,y+32,3,7,'#e8e6ee');R(x+1,y+32,3,7,'#e8e6ee');
  R(x-8,y+22,16,11,dress);R(x-8,y+32,16,1,apron);
  R(x-7,ty,14,17,dress);R(x-4,ty+6,8,17,apron);R(x-3,ty+1,6,6,apron);R(x-3,ty-1,6,2,apron);R(x-1,ty,2,1,'#c04060');
  if(pose==='tidy'){const cx=x+11+Math.round(Math.sin(t*5)*3);R(x-9,ty+2,3,12,dress);R(x-5,ty+14,3,2,metal);R(x+6,ty+2,3,6,dress);R(x+7,ty+7,2,9,dress);R(cx-1,y+19,3,2,metal);R(cx,y+21,5,2,apron);}
  else if(pose==='tea'){R(x-9,ty+2,3,9,dress);R(x+6,ty+2,3,9,dress);R(x-6,ty+10,12,2,dress);R(x-2,ty+7,5,4,'#f4f0e8');R(x+3,ty+8,1,2,'#f4f0e8');R(x-1,ty+7,3,1,'#9a6a42');if(mod(t*1.5,1)<.6)R(x,ty+4-Math.round(mod(t*1.5,1)*3),1,2,'#f4f0e8aa');}
  else if(pose==='gesture'){R(x-9,ty+2,3,12,dress);R(x-5,ty+14,3,2,metal);R(x+6,ty+2,3,7,dress);R(x+8,ty-2+Math.round(Math.sin(t*6)),3,6,dress);R(x+8,ty-4+Math.round(Math.sin(t*6)),3,2,metal);}
  else{R(x-9,ty+2,3,12,dress);R(x+6,ty+2,3,12,dress);R(x-5,ty+14,3,2,metal);R(x+2,ty+14,3,2,metal);}
  R(x-2,ty-3,4,3,shade(metal,.85));R(x-2,ty-2,4,1,shade(metal,.7));
  R(hx-5,hy,10,11,metal);R(hx-5,hy+10,10,1,shade(metal,.8));R(hx+4,hy+6,1,3,shade(metal,.85));R(hx-5,hy+6,1,3,shade(metal,.85));
  R(hx-5,hy,10,3,hair);R(hx-6,hy+1,2,8,hair);R(hx+4,hy+1,2,8,hair);R(hx-4,hy+3,8,1,hair);R(hx-5,hy-1,10,1,'#f4f0e8');
  // cat ears; one folds back now and then
  const fold=pose==='ear'&&mod(t*2.5+a.phase,1)<.45;
  R(hx-5,hy-2,4,2,hair);R(hx-5,hy-4,2,2,hair);R(hx-4,hy-2,1,1,'#e8a0b0');
  if(fold)R(hx+1,hy-2,5,1,hair);else{R(hx+1,hy-2,4,2,hair);R(hx+3,hy-4,2,2,hair);R(hx+3,hy-2,1,1,'#e8a0b0');}
  light(hx-5,hy-4,1,1,a.eye+'cc');if(!fold)light(hx+4,hy-4,1,1,a.eye+'cc');
  const ex=(look||0)*2;
  if(pose==='charge'){R(hx-3,hy+6,2,1,'#303840');R(hx+1,hy+6,2,1,'#303840');R(hx-3,hy-9,6,4,'#1a2a1a');R(hx+3,hy-8,1,2,'#1a2a1a');if(mod(t,1.2)<.8)light(hx-2,hy-8,1+Math.floor(mod(t,1.2)*4),2,'#7fe08a');}
  else if(pose==='scan'){const sx=Math.round(Math.sin(t*3)*3);light(hx-3+sx,hy+5,6,1,a.eye);}
  else if(mod(t+a.phase,a.blink)<.12){R(hx-3+ex,hy+6,2,1,'#303840');R(hx+1+ex,hy+6,2,1,'#303840');}
  else{light(hx-3+ex,hy+5,2,2,a.eye);light(hx+1+ex,hy+5,2,2,a.eye);}
  const talking=['talk','gesture','laugh'].includes(pose)&&mod(t*7,2)<1;R(hx-1+ex,hy+8,2,1,talking?'#8a5a60':shade(metal,.75));
 }
 function maidStanding(m,x,h,t){
  const a=m.app,dir=m.dir,walking=m.state==='walk'||m.state==='out',step=walking?Math.sin((t+a.phase)*8):0,y=h-(walking?Math.round(Math.abs(step)):0),dress=a.dress,apron='#eeeae0';
  R(x-4+Math.round(step*2),y-3,4,3,'#1a1414');R(x+Math.round(-step*2),y-3,4,3,'#1a1414');R(x-3,y-8,6,5,'#e8e6ee');
  R(x-8,y-34,16,26,dress);R(x-8,y-9,16,1,apron);R(x-7,y-58,14,25,dress);R(x-4,y-50,8,40,apron);R(x-3,y-57,6,7,apron);R(x-1,y-58,2,1,'#c04060');
  R(x-3-Math.round(step*3),y-56,3,20,dress);R(x-3-Math.round(step*3),y-37,3,2,a.metal);
  R(x-2,y-61,4,3,shade(a.metal,.85));const hy=y-72;
  R(x-5,hy,10,11,a.metal);R(x-5,hy,10,3,a.hair);R(x-6,hy+1,2,8,a.hair);R(x+4,hy+1,2,8,a.hair);R(x-5,hy-1,10,1,'#f4f0e8');
  R(x-5,hy-2,4,2,a.hair);R(x-5,hy-4,2,2,a.hair);R(x+1,hy-2,4,2,a.hair);R(x+3,hy-4,2,2,a.hair);
  light(x-3+dir*2,hy+5,2,2,a.eye);light(x+1+dir*2,hy+5,2,2,a.eye);
 }

 // Visitor from off-world, seated: hovers a little above the cushion.
 function alienSeated(m,x,y,t){
  const a=m.app,pose=m.pose,look=m.look||0,f=Math.round(Math.sin(t*1.4+a.phase))-2,suit=a.suit,skin=a.skin,dark=shade(skin,.7);
  const lean=pose==='curious'?2:0,ty=y+8+f,hx=x+look+lean,hy=ty-13;
  R(x-4,y+30+f,3,7,suit);R(x+1,y+30+f,3,7,suit);R(x-5,y+37+f,4,2,shade(suit,.6));R(x+1,y+37+f,4,2,shade(suit,.6));
  R(x-6,y+24+f,12,7,suit);R(x-6,ty,12,17,suit);R(x-6,ty+12,12,1,shade(suit,.6));R(x,ty+2,1,10,shade(suit,.8));light(x+2,ty+4,1,1,a.glow);
  if(pose==='map'){R(x-8,ty+2,2,9,suit);R(x+6,ty+2,2,9,suit);R(x-8,ty+7,16,9,'#d9d0b0');R(x-8,ty+7,16,1,'#b8ad90');R(x-5,ty+10,6,1,'#7a8a6a');R(x-1,ty+9,1,5,'#7a8a6a');R(x+3,ty+14,1,1,'#b04040');}
  else if(pose==='photo'){R(x-8,ty+2,2,8,suit);R(x+6,ty+2,2,8,suit);R(x-4,ty+6,8,5,'#2a2a30');R(x-1,ty+7,3,3,'#50607a');if(mod(t,ACTION_SECONDS.photo)<.25)light(x-7,ty+2,14,1,'#ffffffcc');}
  else if(pose==='gesture'||pose==='laugh'){const w=Math.round(Math.sin(t*6));R(x-8,ty-2+w,2,10,suit);R(x+6,ty-2-w,2,10,suit);R(x-8,ty-4+w,2,2,skin);R(x+6,ty-4-w,2,2,skin);}
  else{R(x-8,ty+2,2,13,suit);R(x+6,ty+2,2,13,suit);R(x-8,ty+15,2,2,skin);R(x+6,ty+15,2,2,skin);}
  R(x-1,ty-2,2,2,skin);
  R(hx-6,hy+2,12,8,skin);R(hx-5,hy,10,2,skin);R(hx-4,hy+10,8,2,skin);R(hx-2,hy+12,4,1,skin);R(hx-6,hy+9,12,1,shade(skin,.85));
  const ex=pose==='curious'?1:look,ey=pose==='curious'?-1:0;
  if(mod(t+a.phase,a.blink)<.12){R(hx-5+ex,hy+6,4,1,'#0c0c14');R(hx+1+ex,hy+6,4,1,'#0c0c14');}
  else{R(hx-5+ex,hy+4+ey,4,4,'#0c0c14');R(hx+1+ex,hy+4+ey,4,4,'#0c0c14');R(hx-4+ex,hy+4+ey,1,1,'#ffffff');R(hx+2+ex,hy+4+ey,1,1,'#ffffff');}
  if(['talk','gesture','laugh'].includes(pose)&&mod(t*7,2)<1)R(hx-1,hy+10,2,1,shade(skin,.5));
  R(hx-3,hy-5,1,5,dark);R(hx+2,hy-5,1,5,dark);
  const pulse=pose==='antenna'?mod(t*3,1)<.5:true;
  if(pulse)light(hx-4,hy-7,3,2,a.glow);else R(hx-4,hy-7,3,2,dark);
  if(pose!=='antenna'||!pulse)light(hx+1,hy-7,3,2,a.glow);else R(hx+1,hy-7,3,2,dark);
 }
 function alienStanding(m,x,h,t){
  const a=m.app,f=Math.round(Math.sin(t*2+a.phase)*1.5),y=h-4+f,dir=m.dir,suit=a.suit,skin=a.skin;
  R(x-6,h-1,12,1,a.glow+'55');
  R(x-4,y-14,3,12,suit);R(x+1,y-14,3,12,suit);R(x-6,y-40,12,27,suit);R(x-6,y-28,12,1,shade(suit,.6));R(x-8,y-38,2,14,suit);R(x+6,y-38,2,14,suit);
  R(x-1,y-42,2,2,skin);const hy=y-55;
  R(x-6,hy+2,12,8,skin);R(x-5,hy,10,2,skin);R(x-4,hy+10,8,2,skin);
  R(x-5+dir,hy+4,4,4,'#0c0c14');R(x+1+dir,hy+4,4,4,'#0c0c14');R(x-4+dir,hy+4,1,1,'#ffffff');R(x+2+dir,hy+4,1,1,'#ffffff');
  R(x-3,hy-5,1,5,shade(skin,.7));R(x+2,hy-5,1,5,shade(skin,.7));light(x-4,hy-7,3,2,a.glow);light(x+1,hy-7,3,2,a.glow);
 }

 // Animals. (x, y) is the middle of the animal on the surface its paws are on;
 // P() mirrors so that +dx is always the way it faces.
 function animal(m,x,y,t,mode){
  const a=m.app,dir=m.dir||1,c=a.coat,l=a.light,d=shade(c,.72),pt=m.pt||0;
  const P=(dx,dy,w,h,col)=>R(dir>0?x+dx:x-dx-w,y+dy,w,h,col);
  const L=(dx,dy,w,h,col)=>light(dir>0?x+dx:x-dx-w,y+dy,w,h,col);
  const pose=mode==='seated'?m.pose:'walk';
  ({cat,dog,weasel,rabbit})[a.species](P,L,{c,l,d,t,pt,pose,phase:a.phase,a,mode,x,y});
 }
 function cat(P,L,{c,l,d,t,pt,pose,phase,mode}){
  const eye='#ffcd77',nose='#e89aa0';
  if(pose==='walk'){
   const s=mode==='jump'?0:Math.round(Math.sin(t*9+phase)*1.5);
   P(-6,-4,1,4+Math.min(0,s),c);P(-4,-4,1,4-Math.max(0,s),d);P(3,-4,1,4-Math.max(0,s),c);P(5,-4,1,4+Math.min(0,s),d);
   P(-7,-9,13,5,c);P(-6,-5,11,1,d);P(5,-12,6,5,c);P(5,-14,2,2,c);P(9,-14,2,2,c);L(9,-11,1,1,eye);P(11,-10,1,1,nose);P(-9,-14,1,6,c);P(-10,-15,2,1,c);return;
  }
  if(pose==='loaf'||pose==='knead'){
   const press=pose==='knead'?(mod(pt*3,1)<.5?1:0):0;
   P(-7,-7,13,7,c);P(-6,-8,11,1,c);P(-7,-1,10,1,d);P(4,-11,6,5,c);P(4,-13,2,2,c);P(8,-13,2,2,c);P(10,-9,1,1,nose);
   if(pose==='knead'){P(5,-1-press,2,1,l);P(8,-2+press,2,1,l);P(6,-9,2,1,d);P(8,-9,1,1,d);}else if(mod(t+phase,5)<4.7)L(8,-10,1,1,eye);else P(8,-10,1,1,d);
   return;
  }
  if(pose==='sleep'){P(-6,-6,12,6,c);P(-5,-7,10,1,c);P(1,-6,5,4,l);P(-6,-1,12,1,d);P(3,-4,2,1,d);P(2,-8,2,2,c);return zzzAt(P,5,-10,t,phase);}
  if(pose==='stretch'){
   const k=Math.min(1,pt/.8);P(-6,-10,6,4,c);P(0,-7-Math.round((1-k)*2),7,4,c);P(6,-3,5,1,c);P(6,-2,5,1,d);P(-6,-6,1,6,c);P(-4,-6,1,6,d);P(7,-9,5,4,c);P(7,-11,2,2,c);P(10,-11,2,2,c);P(-8,-15,1,6,c);return;
  }
  // sitting up: groom, swish, look, yawn
  P(-4,-10,7,10,c);P(1,-7,2,5,l);P(-5,-3,9,3,c);P(1,-2,1,2,d);P(3,-2,1,2,d);
  const tip=pose==='swish'?Math.round(Math.sin(t*3+phase)*2):0;P(-8,-1,4,1,c);P(-9-tip,-2,2,1,c);
  if(pose==='look'){P(-2,-15,7,5,c);P(-2,-17,2,2,c);P(3,-17,2,2,c);P(-1,-14,5,1,d);return;}
  if(pose==='groom'){const b=mod(pt*4,1)<.5?0:1;P(0,-12+b,6,5,c);P(0,-14+b,2,2,c);P(4,-14+b,2,2,c);P(3,-9,2,3,l);P(3,-10+b,1,1,nose);return;}
  if(pose==='yawn'){const open=pt>.4&&pt<1.9;P(-1,-16,7,5,c);P(-1,-18,2,2,c);P(4,-18,2,2,c);P(2,-14,2,1,d);P(4,-14,1,1,d);if(open)P(4,-13,2,2,'#c04858');return;}
  P(-1,-15,7,5,c);P(-1,-17,2,2,c);P(4,-17,2,2,c);L(3,-13,1,1,eye);L(5,-13,1,1,eye);P(6,-12,1,1,nose);
 }
 function dog(P,L,{c,l,d,t,pt,pose,phase,a}){
  const nose='#1a1a1a',eye='#1a1410',wag=Math.round(Math.sin(t*(pose==='wag'?16:5)+phase)*1.5);
  const ears=(ex,ey)=>{if(a.ears==='up'){P(ex,ey-2,2,2,c);P(ex+3,ey-2,2,2,c);}else{P(ex-1,ey,2,4,d);P(ex+4,ey,2,4,d);}};
  if(pose==='walk'){
   const s=Math.round(Math.sin(t*11+phase)*1.5);
   P(-6,-5,1,5+Math.min(0,s),c);P(-4,-5,1,5-Math.max(0,s),d);P(4,-5,1,5-Math.max(0,s),c);P(6,-5,1,5+Math.min(0,s),d);
   P(-8,-12,15,7,c);P(-6,-6,11,1,l);P(6,-17,7,6,c);P(12,-14,3,3,l);P(14,-14,1,1,nose);P(10,-15,1,1,eye);ears(7,-17);P(-10,-15+wag,3,2,c);P(-11,-17+wag,2,2,c);return;
  }
  if(pose==='lie'||pose==='sleep'){
   P(-8,-6,15,6,c);P(-6,-1,11,1,l);P(7,-2,5,2,c);P(7,-7,7,5,c);P(13,-5,2,3,l);P(14,-5,1,1,nose);ears(8,-7);P(-11,-2,4,1,c);
   if(pose==='sleep'){P(10,-5,2,1,d);return zzzAt(P,10,-11,t,phase);}
   P(10,-6,1,1,eye);return;
  }
  if(pose==='window'){
   P(-3,-3,2,3,d);P(2,-3,2,3,d);P(-3,-22,7,20,c);P(-1,-18,3,12,l);P(3,-26,2,7,c);P(0,-32,7,7,c);ears(1,-32);P(-6,-4+wag,3,2,c);P(-7,-6+wag,2,2,c);return;
  }
  // sitting: sit, pant, tilt, scratch, wag
  P(-6,-5,8,5,c);P(-5,-13,8,13,c);P(0,-11,3,8,l);P(1,-4,1,4,c);P(3,-4,1,4,c);P(-9,-1-(Math.abs(wag)>0?1:0),4,1,c);
  const tilt=pose==='tilt'?-1:0;P(-1,-19+tilt,7,6,c);P(5,-16+tilt,3,3,l);P(7,-16+tilt,1,1,nose);P(3,-17+tilt,1,1,eye);
  if(pose==='tilt'){P(-2,-21,2,2,c);P(4,-20,2,1,c);}else ears(0,-19);
  if(pose==='pant'&&mod(t*4,1)<.7)P(5,-13,2,2,'#e06070');
  if(pose==='scratch'){const k=mod(pt*10,1)<.5?0:1;P(-3,-14+k,2,5,d);}
 }
 function weasel(P,L,{c,l,d,t,pt,pose,phase}){
  const eye='#101010',nose='#3a2020';
  if(pose==='walk'||pose==='dash'){
   const hump=Math.round(Math.abs(Math.sin(t*(pose==='dash'?14:8)+phase))*3);
   P(-8,-5-Math.round(hump/2),5,3,c);P(-3,-6-hump,6,3,c);P(3,-5-Math.round(hump/2),5,3,c);P(-2,-3-hump,4,1,l);
   P(-7,-2,1,2,c);P(6,-2,1,2,c);P(8,-7-Math.round(hump/2),4,3,c);P(8,-8-Math.round(hump/2),1,1,c);P(10,-6-Math.round(hump/2),1,1,eye);P(12,-6-Math.round(hump/2),1,1,nose);P(-12,-4,4,1,d);P(-13,-4,1,1,shade(d,.6));return;
  }
  if(pose==='stand'){const side=mod(pt*.7+phase,2)<1?1:-1;P(-1,-14,3,12,c);P(1,-12,1,8,l);P(-2,-2,5,2,c);P(-6,-1,5,1,d);P(2,-11,1,1,c);P(side>0?-1:-2,-18,4,4,c);P(side>0?2:-2,-16,1,1,eye);return;}
  if(pose==='curl'){P(-5,-5,10,5,c);P(-4,-6,8,1,c);P(-2,-4,4,2,l);P(3,-3,2,1,d);P(1,-5,2,1,d);return zzzAt(P,4,-9,t,phase);}
  if(pose==='flat'){P(-10,-4,20,4,c);P(-8,-1,16,1,l);P(10,-5,5,4,c);P(11,-6,1,1,c);P(12,-3,2,1,d);P(15,-3,1,1,nose);P(-12,-1,3,1,c);P(-14,-2,4,1,d);P(4,-1,2,1,c);return;}
  if(pose==='dance'){const hop=-Math.round(Math.abs(Math.sin(pt*9))*4);P(-6,-7+hop,12,4,c);P(-2,-9+hop,5,2,c);P(-4,-3+hop,8,1,l);P(6,-8+hop,4,3,c);P(9,-6+hop,1,1,'#c04858');P(8,-7+hop,1,1,eye);P(-9,-5+hop,3,1,d);return;}
  // groom
  const b=mod(pt*4,1)<.5?0:1;P(-5,-6,9,6,c);P(-3,-2,6,1,l);P(1,-9+b,4,4,c);P(3,-8+b,1,1,eye);P(-8,-2,4,1,d);
 }
 function rabbit(P,L,{c,l,d,t,pt,pose,phase}){
  const pink='#e8a0b0',eye='#200c10',white='#f4f2ee';
  const ears=(ex,ey,up=true)=>up?(P(ex,ey-6,2,6,c),P(ex+2,ey-5,1,5,c),P(ex,ey-5,1,4,pink)):(P(ex-4,ey,6,1,c),P(ex-3,ey+1,5,1,c));
  if(pose==='walk'||pose==='binky'){
   const k=pose==='binky'?mod(pt,1.6)/1.6:0,hop=pose==='binky'?-Math.round(Math.sin(Math.PI*Math.min(1,k*1.5))*9):-Math.round(Math.abs(Math.sin(t*5+phase))*5);
   P(-5,-8+hop,10,7,c);P(-4,-2+hop,5,1,d);P(3,-11+hop,5,5,c);ears(4,-11+hop);P(-6,-7+hop,2,2,white);P(6,-9+hop,1,1,eye);P(8,-8+hop,1,1,pink);return;
  }
  if(pose==='flop'){P(-6,-4,12,4,c);P(-5,-1,10,1,l);P(5,-5,4,4,c);ears(4,-5,false);P(-7,-2,2,1,c);P(7,-4,1,1,d);return;}
  if(pose==='stand'){P(-2,-12,5,12,c);P(0,-10,2,8,white);P(-3,-2,6,2,c);P(-1,-17,5,5,c);ears(0,-17);P(2,-15,1,1,eye);P(4,-14,1,1,pink);return;}
  if(pose==='groom'){const b=mod(pt*4,1)<.5?0:1;P(-5,-8,10,8,c);P(2,-12,5,5,c);ears(2,-12);P(5,-9+b,2,2,l);P(5,-10,1,1,eye);return;}
  // loaf and twitch
  P(-5,-7,10,7,c);P(-4,-8,8,1,c);P(-6,-6,2,2,white);P(3,-10,5,5,c);ears(3,-10);P(6,-8,1,1,eye);
  if(pose!=='twitch'||mod(t*6,1)<.5)P(8,-7,1,1,pink);
 }
 function zzzAt(P,dx,dy,t,phase){const k=mod(t*.5+phase,1);if(k<.85){const y=dy-Math.round(k*8),col='#e6dcc0';P(dx,y,3,1,col);P(dx+1,y+1,1,1,col);P(dx,y+2,3,1,col);}}

 return {maidSeated,maidStanding,alienSeated,alienStanding,animal,zzz};
}
