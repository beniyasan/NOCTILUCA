// Fellow passengers on the facing long seat. At each arrival nobody, one
// traveller, a pair or a group of three may board and sit across the aisle.
// A lone traveller only passes the time; pairs and groups talk among
// themselves in lines generated from topic templates. Now and then someone
// unusual boards instead (see passenger-kinds.js): a tipsy salaryman, a robot
// maid, visitors from off-world, or a lone animal that never talks. A few
// groups play out a little scene (passenger-scenes.js), a drunk may stretch out
// across the seat to sleep, and animals hop down to wander the floor. View-only:
// nothing here is saved, sent to the server or counted as progress.
import {mod} from './anim-utils.js';
import {SPECIES,ANIMAL_POSES,CAST_POSES,ACTION_SECONDS,PACE,CAST_TALK,animalLook,drunkLook,maidLook,alienLook,monologue,createKindPainters} from './passenger-kinds.js';
import {SCENES,SLEEP_TALK,FLOOR_POSES,conductorLook} from './passenger-scenes.js';

// ---- conversation generator (pure) ----------------------------------------
const pickOf=(r,a)=>a[Math.floor(r()*a.length)];
const WORDS={
 food:['麺','肉まん','揚げパン','海藻スープ','焼き魚','蒸しパン','甘い団子','屋台のおでん'],
 thing:['傘','手袋','鍵','充電器','定期','マフラー','眼鏡','水筒'],
 place:['埠頭の食堂','いつもの屋台','温室の裏','資材置き場','駅前の喫茶','ホームの売店'],
 time:['十分','三十分','一時間','二駅ぶん','半日'],
 day:['昨日','おととい','先週','この前'],
 boss:['班長','主任','親方','係長'],
 pet:['猫','配膳ロボ','金魚','ハムスター'],
 sky:['星','灯り','雲','海'],
 battery:['12','42','67','88','100'],
};
const NAMES=['カナ','ユウ','ミオ','ハル','ソラ','リク','アオイ','トモ','レン','サキ','ナギ','イツキ'];
// Each topic is a list of beats: [speaker, ...alternatives]. Speakers are
// 'a','b','c' (mapped onto members), a leading '?' makes the beat optional.
// Line marks: '!' emphatic gesture, '~' everyone laughs.
const PAIR_CHAT=[
 [['a','夕飯、どうする?','お腹すいたね。','今日なに食べる?'],['b','{food}かな。','{place}の{food}がいい。','うーん、{food}の気分。'],['?a','またそれ?','いいね、それ。'],['b','~だって好きなんだもん。','~じゃあ決まり。'],['a','{st}で降りたら寄ろうか。','今日は並んでないといいね。']],
 [['a','{thing}、持った?','あれ、{thing}どこやったっけ。'],['b','……あ。','え、そっちが持ってると思ってた。'],['a','!もう。','まあ、いいか。'],['?b','~次の駅で探そう。','~帰りに取りに行こう。']],
 [['a','次、{next}だよね。','{next}まであとどれくらい?'],['b','{time}くらいじゃない?','たぶん{time}。'],['a','窓の外、きれいだね。','今日は{sky}がよく見える。'],['b','うん。','ほんとだ。'],['?a','このまま乗ってたいな。','寝ちゃいそう。']],
 [['a','{day}、{pet}がさ。','ねえ聞いて、うちの{pet}。'],['b','うん。','また?'],['a','~窓から落ちかけてた。','~鍋のふたの上で寝てた。','~勝手に朝の目覚まし止めてた。'],['b','~なにそれ。','~見たかった。'],['?a','写真あるよ。','今度会わせるね。']],
 [['a','眠い……。','ふあ……。'],['b','{day}遅かったの?','肩貸そうか。'],['a','ちょっとだけ。','{st}まで起こして。'],['?b','はいはい。','寝過ごしても知らないよ。']],
 [['a','週末、空いてる?','今度の休み、どうする?'],['b','空いてる。','たぶん。なんで?'],['a','{next}に行ってみたくて。','{place}に行きたい。'],['b','いいね。','{food}食べられるなら。'],['?a','~じゃあ約束。','~寝坊しないでね。']],
 [['a','{day}、{boss}がまた言ってた。','{boss}の話、聞いた?'],['b','また残業の話?','え、なに?'],['a','!棚、全部並べ直しだって。','!来週から早番だって。'],['b','うわあ。','それは聞きたくなかった。'],['?a','~まあ、なんとかなるか。','~{food}食べて忘れよう。']],
 [['a','この列車、昔から走ってるんだって。','この座席、ちょっと古いよね。'],['b','木の壁、落ち着くよね。','だから揺れるのか。'],['?a','好きだけどね。','網棚の荷物、ずっとあるよね。'],['b','うん。','誰のなんだろう。']],
];
const PAIR_QUARREL=[
 [['a','{time}も待ったんだけど。','なんで遅れたの。'],['b','だから、ごめんって。','乗り換えが、その……。'],['a','!連絡くらいできたでしょ。','!それ、前も聞いた。'],['b','……。','!そっちだって{day}遅れたじゃん。'],['a','……それは、そうだけど。','もういい。'],['?b','{food}、おごるから。','次は気をつける。']],
 [['a','{thing}、置いてきたでしょ。','ねえ、{thing}は?'],['b','!持ってって言ったじゃん。','!それ、そっちの係でしょ。'],['a','言ってない。','聞いてない。'],['b','!言った。','!絶対言った。'],['a','……。','……もう知らない。'],['?b','……あとで取りに行こう。','……ごめん、言い過ぎた。']],
 [['a','返事、なかったよね。','{day}の返信、まだなんだけど。'],['b','見てなかった。','忙しかったの。'],['a','!既読ついてたけど。','!{time}も?'],['b','……。','!だから、忙しかったの。'],['?a','……べつに、いいけど。','……心配したんだよ。']],
 [['a','{food}って言ったのに。','なんで{food}じゃないの。'],['b','!{place}、閉まってたんだよ。','!売り切れてたの。'],['a','じゃあ連絡してよ。','……ふうん。'],['b','……。','次はちゃんと聞く。'],['?a','……明日は{food}ね。','……べつに怒ってないし。']],
];
const TRIO=[
 [['a','次の休み、三人でどこか行こうよ。','ねえ、旅行の話どうなった?'],['b','{next}がいい。','{place}!'],['c','えー、遠くない?','{food}があるならどこでも。'],['a','~食べ物ばっかり。','~相変わらずだね。'],['b','じゃあ{next}で決まり。','多数決にしよう。'],['c','はいはい。','……まあ、いいけど。'],['?a','~楽しみだね。','~寝坊した人がおごりね。']],
 [['a','ねえ、{n2}さ、最近なんかあった?','{n2}、最近楽しそうじゃない?'],['b','え、なにが。','べつに?'],['c','~顔に書いてある。','~{place}で見たよ。'],['b','!違うって。','!見てたの!?'],['a','~あやしい。','~ほらほら。'],['b','……ただの友だち。','……もう、次の駅で降りる。'],['?c','~降りないで。','~続きは{food}食べながらね。']],
 [['a','おつかれ。','やっと終わったね。'],['b','{boss}、今日機嫌よかったね。','{boss}、今日もうるさかった。'],['c','{food}食べに行く人。','打ち上げ行く?'],['a','行く。','はーい。'],['b','行く行く。','ちょっとだけなら。'],['?c','~じゃあ{st}で降りよう。','~{place}、空いてるかな。']],
 [['a','{day}の課題、終わった?','レポート、出した?'],['b','まだ。','半分だけ。'],['c','!え、明日までだよ。','!今日までじゃなかった?'],['b','……うそ。','え。'],['a','~見せないからね。','~がんばって。'],['?b','{n1}、お願い。','今から{place}でやる。']],
 [['a','これ見て。','{day}撮った写真。'],['b','なにこれ、{pet}?','どこ、これ。'],['a','{place}で会ったの。','{next}の{place}。'],['c','~かわいい。','~ぶれてる。'],['b','~撮るの下手すぎ。','~今度連れてって。'],['?a','~うるさいなあ。','~じゃあ次はみんなで行こう。']],
 [['a','ねえ、この列車で合ってる?','{next}って、こっちだよね。'],['b','合ってる……はず。','たぶん。'],['c','!さっきの駅で乗り換えじゃなかった?','!え、逆じゃない?'],['a','……え。','うそでしょ。'],['b','あ、大丈夫。ぐるっと回るから。','環状線だから、そのうち着くよ。'],['c','~なら、いっか。','~ゆっくり行こう。']],
 [['a','ちょっと、{n2}。{thing}返してよ。','{n2}、{thing}まだ?'],['b','!借りてないって。','!{n3}に貸したんだよ。'],['c','え、わたし?','……あ。'],['a','{n3}?','ほら。'],['c','~ごめん、家にある。','~明日持ってくる。'],['?b','~ほらね。','~疑われ損。']],
];
const FILLERS=['へえ。','うん。','そうなの?','なるほど。','ふうん。'];
const SOLO_POSES=['idle','read','phone','doze','idle','read','eat','knit'];

function fill(text,w,r){return text.replace(/\{(\w+)\}/g,(_,k)=>w[k]??pickOf(r,WORDS[k]||['……']));}
// Generate one conversation. Returns [{who,text,mark}] with who indexing members.
export function generateTalk({size,tone='chat',cast='people',random:r=Math.random,names=[],station='',next='',world=''}={}){
 const pool=cast!=='people'?CAST_TALK[cast]:size>=3?TRIO:tone==='quarrel'?PAIR_QUARREL:PAIR_CHAT,topic=pickOf(r,pool);
 // Shuffle roles so the one who opens differs between conversations; a drunk or
 // maid pair keeps 'a' on the special passenger (member 0).
 const order=[0,1,2].slice(0,Math.max(2,Math.min(3,size)));if(cast==='people'||cast==='alien')for(let i=order.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 const who=k=>order[{a:0,b:1,c:2}[k]]??order[0];
 const w={st:station,next,world,n1:names[order[0]]||'',n2:names[order[1]]||'',n3:names[order[2]]||''};
 for(const k of Object.keys(WORDS))w[k]=pickOf(r,WORDS[k]);
 const lines=[];
 for(const [spec,...alts] of topic){
  const optional=spec.startsWith('?');if(optional&&r()<.45)continue;
  let text=fill(pickOf(r,alts),w,r),mark='';
  if(text[0]==='!'||text[0]==='~'){mark=text[0];text=text.slice(1);}
  lines.push({who:who(spec.replace('?','')),text,mark});
  // Now and then a listener murmurs, so the same topic never plays out identically.
  if(cast==='people'&&tone!=='quarrel'&&size>=2&&r()<.12&&lines.length<6){const l=order.filter(i=>i!==lines.at(-1).who);lines.push({who:pickOf(r,l),text:pickOf(r,FILLERS),mark:''});}
 }
 return lines;
}

// ---- boarding / seating / talk director (pure) --------------------------------
const WALK=34,SIT=.6,SPACING=25,LIE=56;
const lineHold=text=>Math.min(6.5,2.2+text.length*.13);
const SKIN=['#f0cfb4','#e2b896','#c99673','#a8764f','#7e5538'];
const HAIR=['#1d1a1c','#2c211b','#4a3326','#6b4a2e','#9a9a9a','#d8c7a0','#b04a5a','#3f5f9a','#6a3f7a'];
const TOPS=['#8a3b3b','#3d5a7a','#56704a','#c8b27a','#5a4a6e','#a86a3c','#2f3a3a','#d9d2c2','#7a2f4f','#3e6a6a'];
const BOTTOMS=['#2a2f3a','#3a3226','#4a4f5a','#1f2530','#5b4636'];
const STYLES=['short','bob','long','tail','bun','cap','crop'];
function appearance(r){
 return {skin:pickOf(r,SKIN),hair:pickOf(r,HAIR),top:pickOf(r,TOPS),bottom:pickOf(r,BOTTOMS),style:pickOf(r,STYLES),skirt:r()<.25,
  glasses:r()<.22,scarf:r()<.2?pickOf(r,['#c9a24a','#7a9ab0','#b05050','#e0ddd0']):null,bag:r()<.35?pickOf(r,['#5d5a44','#7a4e2e','#3d4a5a','#8a6e4a']):null,
  phase:r()*10,blink:3+r()*4};
}
const BLOCKED=[[.43,.53],[.72,.85]];
// Who boards at a stop. Specials are rarer than ordinary riders; animals come alone.
const CASTS=[
 [.22,null],[.18,{cast:'people',size:1}],[.14,{cast:'people',size:2}],[.10,{cast:'people',size:3}],[.14,{cast:'animal',size:1}],
 [.06,{cast:'drunk',size:1}],[.03,{cast:'drunk',size:2}],[.04,{cast:'maid',size:1}],[.03,{cast:'maid',size:2}],[.03,{cast:'alien',size:1}],[.03,{cast:'alien',size:2}],
];
function pickCast(r,{allowNone=true}={}){
 for(;;){let roll=r();for(const [p,spec] of CASTS){if(roll<p){if(spec||allowNone)return spec;break;}roll-=p;}if(allowNone)return null;}
}
// The kind of each member: drunk and maid pairs bring an ordinary companion.
function kindsOf({cast,size,species}){
 if(cast==='animal')return [species];
 if(cast==='people')return Array(size).fill('human');
 if(cast==='alien')return Array(size).fill('alien');
 return [cast,...Array(size-1).fill('human')];
}
function lookOf(kind,r){return kind==='human'?appearance(r):kind==='drunk'?drunkLook(r):kind==='maid'?maidLook(r):kind==='alien'?alienLook(r):animalLook(r,kind);}
const ANIMALS=new Set(SPECIES);// the cat and the tool bag the cabin paints on the seat
// `talk` may supply lines from elsewhere (the Lolipop edition's daily pool); null falls back to the templates.
export function createPassengerDirector({random:r=Math.random,talk=null}={}){
 let group=null,queue=null,script=null,scene=null,wait=0,width=460,time=0;
 const members=()=>group?.members||[];
 const px=v=>v/width,clamp=u=>Math.max(.03,Math.min(.97,u));
 function seats(size,w,avoid=[]){
  const span=(size-1)*SPACING/w,props=[...(w>=260?BLOCKED:[]),...avoid],edge=22/w;
  for(let i=0;i<40;i++){
   const u=edge+r()*(1-2*edge-span);
   if(props.every(([a,b])=>u+span<a-12/w||u>b+12/w))return Array.from({length:size},(_,k)=>u+k*SPACING/w);
  }
  return null;
 }
 function board(spec,ctx){
  const {cast,size}=spec,targets=seats(size,width,ctx.avoid);if(!targets)return;
  if(cast==='animal'&&!spec.species)spec={...spec,species:pickOf(r,['cat','cat','dog','dog','weasel','rabbit'])};
  const from=r()<.5?-1:1,rel=size===1?'solo':cast!=='people'?cast:pickOf(r,size===2?['friends','couple','coworkers','siblings']:['friends','coworkers','students']);
  const names=[...NAMES].sort(()=>r()-.5).slice(0,size),kinds=kindsOf(spec);
  const order=from<0?[...targets].reverse():targets;// the first in walks furthest
  const rest=k=>ANIMALS.has(k)?ANIMAL_POSES[k][0]:CAST_POSES[k]?.[0]||'idle';
  group={size,rel,cast,names,stays:0,ctx,members:order.map((u,i)=>({kind:kinds[i],app:lookOf(kinds[i],r),seat:u,x:from<0?-.06-i*.05:1.06+i*.05,dir:-from,state:'walk',t:0,delay:i*.7,pose:rest(kinds[i]),rest:rest(kinds[i]),pt:0,look:0,poseTimer:4+r()*10,sayTimer:8+r()*14}))};
  wait=3+r()*4;script=null;scene=null;
  for(const m of group.members){if(m.kind==='drunk'&&size===1)m.lie=lieRoom(m.seat,ctx.avoid);if(ANIMALS.has(m.kind))m.roam=30+r()*30;}
 }
 // Which way a lone drunk can stretch out along the seat without lying on a prop (0: no room).
 function lieRoom(u,avoid=[]){
  const props=[...(width>=260?BLOCKED:[]),...avoid];
  for(const d of r()<.5?[1,-1]:[-1,1]){const end=u+d*px(LIE),lo=Math.min(u,end),hi=Math.max(u,end);
   if(lo>px(22)&&hi<1-px(22)&&props.every(([a,b])=>hi<a-px(6)||lo>b+px(6)))return d;}
  return 0;
 }
 // ---- scenes: the steps come from passenger-scenes.js; this is their toolkit ----
 const kit=()=>({r,g:group,px,
  stand(m){m.state='rise';m.t=0;m.after='stand';m.pose='idle';m.look=0;},
  goTo(m,u,face){m.goal=clamp(u);m.face=face;m.state='step';},
  sitBack(m){m.state='walk';m.pose='idle';m.look=0;},
  enterStaff(u){const from=u>.5?1.06:-.06;group.staff={kind:'conductor',app:conductorLook(),seat:from,x:from,dir:from>0?-1:1,state:'step',goal:clamp(u),face:null,t:0,delay:0,pose:'idle',look:0,pt:0};},
  exitStaff(){const m=group.staff;if(!m)return;m.goal=m.x>.5?1.1:-.1;m.face=null;m.state='step';m.pose='idle';m.leaving=true;},
 });
 function startScene(name){scene={name,steps:SCENES[name](kit()),i:0,t:0,started:false};group.sceneDone=true;script=null;}
 function runScene(dt){
  const st=scene.steps[scene.i];
  if(!st){scene=null;group.dust=false;group.props=null;wait=12+r()*16;for(const m of group.members){m.pose=m.kind==='drunk'?'sway':'idle';m.look=0;}return;}
  if(!scene.started){scene.started=true;scene.t=0;st.on?.();}
  scene.t+=dt;st.tick?.(dt,scene.t);
  const need=Math.max(st.d||0,st.line?lineHold(st.line.text)+.9:0);
  if(scene.t>=need&&(!st.until||st.until())){scene.i++;scene.started=false;}
 }
 // ---- an animal hops down, wanders the floor, and settles on a seat again ----
 function wander(m){for(let i=0;i<8;i++){const u=.05+r()*.9;if(Math.abs(u-m.x)>px(60))return u;}return m.x>.5?.2:.8;}
 function floorLife(m,dt){
  m.pt+=dt;m.poseTimer-=dt;m.floorT-=dt;
  if(m.poseTimer<=0){const list=FLOOR_POSES[m.kind].filter(p=>p!==m.pose);m.pose=pickOf(r,list);m.pt=0;m.poseTimer=ACTION_SECONDS[m.pose]??(3+r()*6);if(!ACTION_SECONDS[m.pose])m.rest=m.pose;}
  if(m.floorT>0||ACTION_SECONDS[m.pose])return;
  const seat=r()<.55?seats(1,width,group.ctx.avoid):null;
  if(seat){m.seat=seat[0];m.state='walk';m.t=0;}else{m.goal=wander(m);m.state='roam';m.t=0;}
 }
 // Resting poses hold a while; actions (a stretch, a hiccup) play once, then rest.
 function nextPose(m,list){
  const pose=pickOf(r,list.filter(p=>p!==m.pose))||m.pose;m.pose=pose;m.pt=0;
  m.poseTimer=ACTION_SECONDS[pose]??(pose==='lie'?90+r()*90:8+r()*14);if(!ACTION_SECONDS[pose])m.rest=pose;
 }
 function behave(m,dt){
  m.pt+=dt;m.poseTimer-=dt;if(m.poseTimer>0)return;
  const list=(ANIMALS.has(m.kind)?ANIMAL_POSES[m.kind]:CAST_POSES[m.kind]).filter(p=>p!=='lie'||m.lie);
  if(ACTION_SECONDS[m.pose]&&r()<.6){m.pose=m.rest;m.pt=0;m.poseTimer=6+r()*10;return;}
  nextPose(m,list);
 }
 // Standing or wandering members head straight for the door; seated ones get up first.
 function leave(rush=false){
  if(!group)return;script=null;scene=null;group.dust=false;group.props=null;
  if(group.staff){group.staff.goal=group.staff.x>.5?1.1:-.1;group.staff.state='step';group.staff.leaving=true;}
  for(const m of group.members){const up=m.state==='seated'||m.state==='sit';m.state=up?'rise':'out';m.after=null;m.t=0;m.delay=rush?0:r()*.8;m.dir=m.x<.5?-1:1;m.pose='idle';m.rush=rush;}
  group.leaving=true;
 }
 const api={
  // A stop at a station: people may get off, then others may get on.
  arrive(ctx={}){
   if(group&&!group.leaving){
    group.stays++;group.ctx={...group.ctx,...ctx};
    if(scene)return;// nobody gets off in the middle of a scene
    // A lone rider dozing at the stop wakes with a start and dashes for the door.
    const m=group.members[0];
    if(group.cast==='people'&&group.size===1&&m.state==='seated'&&m.pose==='doze'&&r()<.6){
     group.shout={text:fill(pickOf(r,['はっ、{st}!? 降ります降ります!','やばっ、乗り過ごすとこだった!','あっ、ここ{st}だ!']),{st:ctx.station||group.ctx.station||''},r),t:0};leave(true);
    }else if(group.stays>=3||r()<.5)leave();else return;
   }
   const spec=pickCast(r);
   queue=spec?{spec,ctx,delay:group?4:1.5}:null;
  },
  // Seat a group without the walk-in, e.g. already aboard when the page opens.
  // `who` is a head count of ordinary riders, or a cast such as {cast:'animal',size:1,species:'cat'}.
  seed(ctx={},who,{width:w=width}={}){
   width=w;
   const spec=typeof who==='number'?(who?{cast:'people',size:who}:null):who??(r()<.4?null:pickCast(r,{allowNone:false}));
   group=null;queue=null;if(!spec)return;
   board(spec,ctx);if(!group)return;for(const m of group.members){m.x=m.seat;m.state='seated';m.delay=0;m.dir=ANIMALS.has(m.kind)?(r()<.5?-1:1):1;}
  },
  clear(){group=null;queue=null;script=null;scene=null;},
  // Play a scene now if the group fits it (the visual harness and tests use this).
  stage(name){
   if(!group||group.leaving||scene||!SCENES[name]||!group.members.every(m=>m.state==='seated'))return false;
   if(group.cast!=='people'||group.size!==(name==='fight'?3:2))return false;
   startScene(name);return true;
  },
  advance(dt,{width:w=width,quiet=false}={}){
   width=w;time+=dt;
   if(queue&&!group){queue.delay-=dt;if(queue.delay<=0){const q=queue;queue=null;board(q.spec,q.ctx);}}
   if(!group)return;
   for(const m of [...group.members,...(group.staff?[group.staff]:[])]){
    const speed=WALK*(PACE[m.kind]||1)*(m.rush?2.2:1)/width;
    if(m.delay>0){m.delay-=dt;continue;}
    m.t+=dt;
    if(m.state==='walk'){const d=m.seat-m.x;m.dir=Math.sign(d)||m.dir;if(Math.abs(d)<=speed*dt){m.x=m.seat;m.state='sit';m.t=0;}else m.x+=Math.sign(d)*speed*dt;}
    else if(m.state==='sit'&&m.t>=SIT){m.state='seated';m.t=0;}
    else if(m.state==='rise'&&m.t>=SIT*(m.rush?.5:1)){m.state=m.after||'out';m.after=null;m.t=0;}
    else if(m.state==='down'&&m.t>=SIT){m.state='roam';m.t=0;}
    else if(m.state==='step'||m.state==='roam'){
     const d=m.goal-m.x;
     if(Math.abs(d)<=speed*dt){m.x=m.goal;m.t=0;if(m.face)m.dir=m.face;if(m.state==='roam'){m.state='floor';m.floorT=5+r()*10;m.poseTimer=0;}else m.state='stand';}
     else{m.x+=Math.sign(d)*speed*dt;m.dir=Math.sign(d);}
    }
    else if(m.state==='out'){m.x+=m.dir*speed*dt;if(m.x<-.1||m.x>1.1)m.state='gone';}
   }
   if(group.staff?.leaving&&group.staff.state==='stand')group.staff=null;
   group.age=(group.age||0)+dt;if(group.shout)group.shout.t+=dt;
   if(group.leaving){if(group.members.every(m=>m.state==='gone')&&!group.staff)group=null;return;}
   if(scene){if(!quiet)runScene(dt);return;}
   // Animals keep to themselves: only movements, never a line. Now and then they hop down and wander.
   if(group.cast==='animal'){
    const m=group.members[0];
    if(m.state==='floor')floorLife(m,dt);
    else if(m.state==='seated'){behave(m,dt);m.roam-=dt;if(m.roam<=0&&!quiet&&!ACTION_SECONDS[m.pose]){m.roam=25+r()*40;m.goal=wander(m);m.state='down';m.t=0;}}
    return;
   }
   const seated=group.members.every(m=>m.state==='seated');if(!seated)return;
   if(group.size===1&&group.cast==='people'){
    const m=group.members[0];m.poseTimer-=dt;
    if(m.poseTimer<=0){m.pose=pickOf(r,SOLO_POSES);m.poseTimer=14+r()*26;}
    m.look=m.pose==='idle'?(mod(time*.07+m.app.phase,1)<.15?(m.app.phase>5?1:-1):0):0;
    return;
   }
   // A special passenger riding alone mutters now and then between movements.
   if(group.size===1){
    const m=group.members[0];
    if(script){
     const line=script.lines[script.i];if(!line){script=null;m.sayTimer=18+r()*24;m.pose=m.rest;m.pt=0;return;}
     script.t+=dt;m.pt+=dt;m.pose=line.pose||'talk';
     if(script.t>=Math.min(6.5,2.2+line.text.length*.13)+.9){script.i++;script.t=0;}
     return;
    }
    behave(m,dt);if(quiet)return;m.sayTimer-=dt;
    if(m.sayTimer<=0){const w={st:group.ctx.station||'',next:group.ctx.next||''};
     // Stretched out asleep, he only talks in his sleep and stays lying down.
     const lines=m.pose==='lie'?[{who:0,text:fill(pickOf(r,SLEEP_TALK),w,r),mark:'',pose:'lie'}]:monologue(group.cast,r,text=>fill(text,w,r));
     script={tone:'chat',lines,i:0,t:0};m.pt=0;}
    return;
   }
   // Conversation: hold (not skip) while quiet, so a line is never missed.
   if(quiet)return;
   if(!script){
    wait-=dt;for(const m of group.members){m.pose=m.kind==='drunk'?'sway':'idle';m.look=0;}
    if(wait>0)return;
    // Once per group, a trio may come to blows, or a pair doze off onto a shoulder or spill some oranges.
    if(group.cast==='people'&&!group.sceneDone&&width>=200&&group.age>=30){
     const roll=r();group.sceneDone=true;
     if(group.size===3&&roll<.2){startScene('fight');return;}
     if(group.size===2&&roll<.1){startScene('lean');return;}
     if(group.size===2&&roll<.2){startScene('oranges');return;}
    }
    const tone=group.cast==='people'&&group.size===2&&r()<(group.rel==='couple'||group.rel==='siblings'?.4:.25)?'quarrel':'chat';
    const ask={size:group.size,tone,cast:group.cast,random:r,names:group.names,station:group.ctx.station,next:group.ctx.next,world:group.ctx.world};
    // The daily pool is written for ordinary riders; specials keep to their own lines.
    script={tone,lines:(group.cast==='people'&&talk?.(ask))||generateTalk(ask),i:0,t:0};
   }
   const line=script.lines[script.i];
   if(!line){script=null;wait=10+r()*16;for(const m of group.members)if(m.kind==='drunk')m.pose='sway';return;}
   script.t+=dt;const hold=Math.min(6.5,2.2+line.text.length*.13),gap=.9;
   const speaker=group.members[line.who],sx=speaker.seat;
   for(const [i,m] of group.members.entries()){
    if(i===line.who){m.look=0;m.pose=line.mark==='!'?'gesture':line.mark==='~'?'laugh':'talk';const o=group.members.filter((_,k)=>k!==i);m.look=Math.sign(o.reduce((a,x)=>a+x.seat,0)/o.length-m.seat);}
    else{m.look=Math.sign(sx-m.seat);m.pose=line.mark==='~'?'laugh':'idle';if(script.tone==='quarrel'&&(line.mark==='!'||m.pose==='cross')){m.pose='cross';m.look=-Math.sign(sx-m.seat);}}
   }
   if(script.t>=hold+gap){script.i++;script.t=0;}
  },
  get view(){
   const line=script?.lines[script.i],hold=line?lineHold(line.text):0;
   const cue=scene?.started?scene.steps[scene.i]?.line:null,speaker=cue&&(cue.who==='staff'?group.staff:group.members[cue.who]);
   const shout=group?.shout&&group.shout.t<lineHold(group.shout.text)?group.shout:null;
   return {size:group?.size||0,rel:group?.rel||null,cast:group?.cast||null,leaving:!!group?.leaving,queued:queue?.spec.size||0,tone:scene?'scene':script?.tone||null,scene:scene?.name||null,
    members:members().map(m=>({...m})),staff:group?.staff?{...group.staff}:null,props:(group?.props||[]).map(o=>({x:o.x})),dust:!!group?.dust,
    line:cue&&speaker&&scene.t<lineHold(cue.text)?{who:cue.who,text:cue.text,mark:cue.mark,pose:null,t:scene.t,x:speaker.x}
     :shout?{who:0,text:shout.text,mark:'!',pose:null,t:shout.t,x:group.members[0].x}
     :line&&script.t<hold?{who:line.who,text:line.text,mark:line.mark,pose:line.pose||null,t:script.t,x:group.members[line.who].seat}:null};
  },
 };
 return api;
}

// ---- painter and speech bubble (DOM) ---------------------------------------
// While `muted` (headphones on) talk goes on silently: no bubbles, and only template lines, so the daily pool is not spent unseen.
export function createPassengers(host,cabin,{talk=null}={}){
 const canvas=document.createElement('canvas');canvas.className='passengers';canvas.setAttribute('aria-hidden','true');cabin.canvas.after(canvas);
 const bubble=document.createElement('div');bubble.className='passenger-bubble';bubble.hidden=true;bubble.setAttribute('aria-hidden','true');canvas.after(bubble);
 const c=canvas.getContext('2d');let geo=null,shown='',clock=0,muted=false;const lights=[];
 const director=createPassengerDirector({talk:ask=>muted?null:talk?.(ask)||null});
 const R=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const shade=(hex,k)=>{const n=parseInt(hex.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(v*k)));return '#'+[(n>>16)&255,(n>>8)&255,n&255].map(v=>f(v).toString(16).padStart(2,'0')).join('');};
 const kinds=createKindPainters(R,shade,(x,y,w,h,col)=>lights.push([x,y,w,h,col]));

 function hair(a,x,y,look){
  const h=a.hair,s=a.style;
  if(s==='bald'){R(x-6,y+3,2,5,h);R(x+4,y+3,2,5,h);R(x-4,y+2,1,1,h);R(x+3,y+2,1,1,h);return;}
  if(s==='comb'){R(x-6,y+2,2,6,h);R(x+4,y+2,2,6,h);for(let i=0;i<4;i++)R(x-4+i*2,y+1,1,2,h);return;}
  if(s==='cap'){R(x-6,y-1,12,4,a.top);R(x-6+(look>0?3:look<0?-3:0),y+2,12,1,shade(a.top,.7));R(x-5,y+3,1,4,h);R(x+4,y+3,1,4,h);return;}
  R(x-5,y,10,3,h);R(x-6,y+1,1,5,h);R(x+5,y+1,1,5,h);
  if(s==='short'||s==='crop'){R(x-5,y+3,look>0?3:2,s==='crop'?1:2,h);R(x+3,y+3,2,1,h);}
  if(s==='bob'){R(x-6,y+2,2,8,h);R(x+4,y+2,2,8,h);R(x-4,y+3,8,1,h);}
  if(s==='long'){R(x-6,y+2,2,14,h);R(x+4,y+2,2,14,h);R(x-4,y+3,4,1,h);}
  if(s==='tail'){R(x-4,y+3,8,1,h);R(look>0?x-8:x+5,y+3,3,9,h);}
  if(s==='bun'){R(x-2,y-3,5,3,h);R(x-4,y+3,8,1,h);}
 }
 function face(a,x,y,look,t,pose,talking){
  const blink=mod(t+a.phase,a.blink)<.13||pose==='doze',down=['read','phone','eat','knit'].includes(pose)?1:0,ex=look*2,eye='#2a1c16';
  if(pose==='laugh'){R(x-3+ex,y+5,2,1,eye);R(x+1+ex,y+5,2,1,eye);}
  else if(blink){R(x-3+ex,y+6+down,2,1,eye);R(x+1+ex,y+6+down,2,1,eye);}
  else{R(x-3+ex,y+5+down,1,2,eye);R(x+2+ex,y+5+down,1,2,eye);}
  if(a.glasses){R(x-4+ex,y+5+down,3,1,'#1a1a1a88');R(x+1+ex,y+5+down,3,1,'#1a1a1a88');R(x-1+ex,y+5+down,2,1,'#1a1a1a55');}
  const open=(talking&&mod(t*7,2)<1)||pose==='laugh';R(x-1+ex,y+8+down,2,open?2:1,open?'#6a2a2a':shade(a.skin,.72));
  if(pose==='cross'||pose==='gesture')R(x-3+ex,y+4,2,1,shade(a.hair,.8));
 }
 // A drunk stretched out along the seat, head where he sat and feet towards the free end.
 function lying(m,x,by,t){
  const a=m.app,d=m.lie,P=(dx,dy,w,h,col)=>R(d>0?x+dx:x-dx-w,by+dy,w,h,col),topLo=shade(a.top,.72);
  const breathe=mod(t*.8+a.phase,2)<1?1:0,eye='#2a1c16';
  R(x-4,by+36,8,6,'#e6dcc0');R(x-4,by+36,8,1,'#b04040');// the souvenir box, left on the floor
  P(34,19,18,7,a.bottom);P(34,19,18,1,shade(a.bottom,1.3));P(51,16,4,9,'#1a1412');
  P(8,16-breathe,27,10+breathe,a.top);P(8,24,27,2,topLo);if(a.tie)P(10,17-breathe,12,2,a.tie);
  P(14,22,18,3,topLo);P(31,22,3,3,a.skin);P(10,24,3,10,topLo);P(10,34,3,2,a.skin);// one arm along him, one hanging off the seat
  P(4,18,4,5,shade(a.skin,.82));P(-6,14,10,11,a.skin);P(-7,15,2,9,a.hair);P(-6,14,3,1,a.hair);P(-6,24,3,1,a.hair);
  P(-1,17,2,1,eye);P(-1,21,2,1,eye);P(2,18,1,2+breathe,'#6a2a2a');P(-3,17,1,2,'#e0605888');P(-3,21,1,2,'#e0605888');
  if(a.headTie)P(-5,14,2,11,a.tie);
  kinds.zzz(d>0?x-2:x-1,by+8,t,a.phase);
 }
 function seated(m,x,by,t,k=1){
  if(m.pose==='lie'&&m.lie&&k>=1)return lying(m,x,by,t);
  // k eases 0→1 while sitting down; the body rises out of standing height.
  const a=m.app,look=m.look,lift=Math.round((1-k)*14);
  // A drunk sways, hiccups (a little jump) or slides down the seat; the arms reuse the ordinary poses.
  // A sleeper leaning on a shoulder is a doze with the head tipped over towards them.
  const drunkPose=m.pose,pose={sway:'idle',hiccup:'idle',slump:'doze',sing:'gesture',lean:'doze'}[drunkPose]??drunkPose;
  const hic=drunkPose==='hiccup'&&mod(m.pt||0,1.4)<.18?2:0;
  x+=drunkPose==='sway'?Math.round(Math.sin(t*1.6+a.phase)*1.5):drunkPose==='slump'?2:0;
  const bob=pose==='laugh'?Math.round(Math.abs(Math.sin(t*9))):Math.round(Math.sin(t*1.3+a.phase)*.5+.3)+hic;
  const y=by-lift+(drunkPose==='slump'?3:0),nod=drunkPose==='lean'?3:pose==='doze'?(mod(t*.35+a.phase,1)<.8?2:0):0,hx=x+(pose==='doze'?1:0)+(drunkPose==='slump'?2:0)+(look?look:0)+(drunkPose==='lean'?look*5:0);
  const top=a.top,topLo=shade(top,.72),pants=a.bottom,shoe='#1a1412';
  R(x-6,y+39,5,3,shoe);R(x+1,y+39,5,3,shoe);R(x-5,y+31,4,9,pants);R(x+1,y+31,4,9,pants);
  if(a.skirt){R(x-8,y+24,16,8,pants);R(x-5,y+32,4,7,shade(a.skin,.85));R(x+1,y+32,4,7,shade(a.skin,.85));}
  else{R(x-7,y+25,14,7,pants);R(x-7,y+25,14,1,shade(pants,1.3));R(x,y+27,1,5,shade(pants,.7));}
  const ty=y+6-bob;
  R(x-7,ty,14,20+bob,top);R(x-6,ty-1,12,1,top);R(x-7,ty+17+bob,14,2,topLo);R(x,ty+2,1,14,topLo);
  if(a.scarf){R(x-6,ty-1,12,3,a.scarf);R(x+2,ty+2,3,6,a.scarf);}
  if(a.tie&&!a.headTie){R(x-2,ty,4,2,'#e8e4dc');R(x,ty+1,2,9,a.tie);R(x+1,ty+9,2,2,a.tie);}
  if(a.tie&&a.headTie)R(x-2,ty,4,2,'#e8e4dc');
  // arms by pose
  if(pose==='cross'){R(x-9,ty+2,3,10,topLo);R(x+6,ty+2,3,10,topLo);R(x-7,ty+10,14,4,topLo);R(x-6,ty+11,2,2,a.skin);R(x+4,ty+11,2,2,a.skin);}
  else if(pose==='gesture'){const w=Math.round(Math.sin(t*6)*1.5);R(x-9,ty+2,3,15,topLo);R(x-7,ty+17,3,2,a.skin);R(x+6,ty+2,3,7,topLo);R(x+8,ty-2+w,3,7,topLo);R(x+8,ty-4+w,3,3,a.skin);}
  else if(pose==='read'){R(x-9,ty+2,3,12,topLo);R(x+6,ty+2,3,12,topLo);R(x-7,ty+10,14,9,'#e6dcc0');R(x-7,ty+10,14,1,'#6b4a3a');R(x,ty+10,1,9,'#b8ad90');for(let i=0;i<3;i++){R(x-5,ty+13+i*2,4,1,'#9a917a');R(x+2,ty+13+i*2,4,1,'#9a917a');}R(x-8,ty+15,2,3,a.skin);R(x+6,ty+15,2,3,a.skin);}
  else if(pose==='eat'){
   // An ekiben on the lap; the chopsticks go up to the mouth and back.
   const up=mod(t*.8+a.phase,1.6)<.5;R(x-9,ty+2,3,13,topLo);R(x+6,ty+2,3,8,topLo);R(x-6,ty+13,12,5,'#8a3030');R(x-5,ty+12,10,2,'#f4f0e8');R(x-1,ty+12,2,1,'#c04050');R(x+2,ty+12,2,1,'#6a9a4a');R(x-7,ty+15,2,2,a.skin);
   if(up){R(x+4,ty-2,1,9,'#c8a070');R(x+6,ty-2,1,9,'#c8a070');R(x+5,ty+6,3,2,a.skin);}else{R(x+3,ty+6,1,7,'#c8a070');R(x+5,ty+6,1,7,'#c8a070');R(x+5,ty+10,3,2,a.skin);}
  }
  else if(pose==='knit'){
   const w=mod(t*2+a.phase,1)<.5?1:0,yarn=a.scarf||'#b05070';R(x-9,ty+2,3,12,topLo);R(x+6,ty+2,3,12,topLo);R(x-5,ty+12,10,5,yarn);R(x-5,ty+12,10,1,shade(yarn,1.2));
   R(x-7,ty+8+w,1,8,'#d8d0c0');R(x+6,ty+9-w,1,8,'#d8d0c0');R(x-8,ty+13,2,2,a.skin);R(x+5,ty+13,2,2,a.skin);R(x+10,y+21,5,5,yarn);R(x+11,y+22,2,1,shade(yarn,1.3));
  }
  else if(pose==='phone'){R(x-9,ty+2,3,12,topLo);R(x+6,ty+2,3,12,topLo);R(x-6,ty+13,12,3,topLo);R(x-2,ty+11,5,6,'#1a1f2a');R(x-1,ty+12,3,4,'#7fb8e0');R(x-4,ty+15,3,2,a.skin);R(x+2,ty+15,3,2,a.skin);}
  else{R(x-9,ty+2,3,16,topLo);R(x+6,ty+2,3,16,topLo);R(x-8,ty+18,3,2,a.skin);R(x+5,ty+18,3,2,a.skin);}
  if(a.box){R(x+7,y+26,8,6,'#e6dcc0');R(x+7,y+26,8,1,'#b04040');R(x+10,y+23,2,3,'#b04040');}
  if(a.bag&&pose!=='read'&&pose!=='phone'){R(x-7,y+22,14,8,a.bag);R(x-7,y+22,14,1,shade(a.bag,1.25));R(x-3,y+19,1,3,shade(a.bag,.7));R(x+3,y+19,1,3,shade(a.bag,.7));}
  // neck and head
  const hy=y-8-bob+nod;
  R(x-2,ty-3,4,3,shade(a.skin,.82));
  R(hx-5,hy,10,11,a.skin);R(hx-5,hy+10,10,1,shade(a.skin,.85));
  if(pose==='phone')R(hx-4,hy+8,8,3,'#7fb8e022');
  face(a,hx,hy,look,t,pose,pose==='talk'||pose==='gesture'||drunkPose==='sing');hair(a,hx,hy-1,look);
  if(a.flush){R(hx-4,hy+7,2,1,'#e0605888');R(hx+2,hy+7,2,1,'#e0605888');R(hx-1,hy+6,2,1,'#d0605066');}
  if(a.headTie){R(hx-6,hy+1,12,2,a.tie);R(hx+5,hy+1,3,1,a.tie);R(hx+6,hy+2,2,2,a.tie);}
  if(drunkPose==='sing'&&mod(t*2,1)<.7){const ny=hy-4-Math.round(mod(t*2,1)*3);R(hx+8,ny,1,4,'#e6dcc0');R(hx+6,ny+3,2,2,'#e6dcc0');}
  if(drunkPose==='hiccup'&&hic)R(hx+7,hy-2,2,2,'#e6dcc0aa');
  if(pose==='doze'&&mod(t*.35+a.phase,1)<.8)R(hx+6,hy-6,3,1,'#e6dcc088');
 }
 // Standing poses for scenes: punch / reel (a scuffle), hold / held (pulling
 // someone back, being pulled back), bow, and pick (crouching to the floor).
 function standing(m,x,h,t){
  const a=m.app,dir=m.dir,pose=m.pose,walking=m.state==='walk'||m.state==='out'||m.state==='step',step=walking?Math.sin((t+a.phase)*(m.kind==='drunk'?5:m.rush?12:8)):0,bob=walking?Math.round(Math.abs(step)):0,y=h-bob;
  const top=a.top,topLo=shade(top,.72),pants=a.bottom,cr=pose==='pick'?9:0;
  if(m.kind==='drunk')x+=Math.round(Math.sin(t*2.2+a.phase)*3);
  const ux=x+dir*({punch:2,reel:-2,bow:2,pick:2}[pose]||0)+(pose==='held'?Math.round(Math.sin(t*14)):0),uy=y+cr;
  R(x-4+Math.round(step*3),y-30+cr,4,28-cr,pants);R(x+Math.round(-step*3),y-30+cr,4,28-cr,shade(pants,.85));
  R(x-5+Math.round(step*3),y-3,6,3,'#1a1412');R(x-1-Math.round(step*3),y-3,6,3,'#1a1412');
  if(a.skirt)R(x-7,uy-34,14,12,pants);
  R(ux-7,uy-58,14,28,top);R(ux-6,uy-59,12,1,top);R(ux,uy-56,1,24,topLo);
  if(a.scarf)R(ux-6,uy-59,12,3,a.scarf);
  if(a.tie&&!a.headTie){R(ux-2,uy-58,4,2,'#e8e4dc');R(ux,uy-57,2,10,a.tie);}
  if(a.badge)R(ux+(dir>0?2:-4),uy-53,2,2,'#e0c060');
  const F=(dx,dy,w,hh,col)=>R(dir>0?ux+dx:ux-dx-w,uy+dy,w,hh,col);// +dx is the way they face
  if(pose==='punch'){F(5,-54,12,3,topLo);F(17,-55,3,4,a.skin);F(-2,-56,3,9,topLo);F(-2,-58,3,3,a.skin);}
  else if(pose==='reel'){F(3,-60,3,10,topLo);F(3,-63,3,3,a.skin);F(-4,-56,3,16,topLo);}
  else if(pose==='hold'){F(4,-54,10,3,topLo);F(4,-49,10,3,topLo);F(14,-54,2,8,a.skin);}
  else if(pose==='held'){const f=mod(t*3,1)<.5?0:3;F(5,-60+f,3,12,topLo);F(5,-62+f,3,3,a.skin);F(-4,-56,3,14,topLo);}
  else if(pose==='pick'){F(4,-54,3,18,topLo);F(4,-37,3,3,a.skin);}
  else{R(ux-3-Math.round(step*3),uy-56,3,20,topLo);R(ux-3-Math.round(step*3),uy-37,3,2,a.skin);}
  if(a.box){const bx=ux-3-Math.round(step*3);R(bx-2,uy-33,8,6,'#e6dcc0');R(bx-2,uy-33,8,1,'#b04040');R(bx+1,uy-36,2,3,'#b04040');}
  if(a.bag){R(ux+(dir>0?-9:5),uy-40,5,11,a.bag);R(ux+(dir>0?-6:4),uy-58,1,18,shade(a.bag,.7));}
  R(ux-2,uy-61,4,3,shade(a.skin,.82));
  const hx=ux+(pose==='bow'?dir*3:pose==='reel'?-dir:0),hy=uy-72+(pose==='bow'?3:0),mood=['punch','reel','held'].includes(pose)?'cross':'idle';
  R(hx-5,hy,10,11,a.skin);face(a,hx,hy,dir,t,mood,false);hair(a,hx,hy-1,dir);
  if(a.flush){R(hx-4,hy+7,2,1,'#e0605888');R(hx+2,hy+7,2,1,'#e0605888');}
  if(a.headTie){R(hx-6,hy+1,12,2,a.tie);R(hx+5,hy+1,3,1,a.tie);}
 }
 // An animal walks the aisle floor, jumps onto the cushion, and jumps back down.
 function animal(m,x,t){
  const {h,by}=geo,seatY=by+28;
  if(m.state==='seated')return kinds.animal(m,x+animalDrift(m),seatY,t,'seated');
  if(m.state==='floor')return kinds.animal(m,x+animalDrift(m),h,t,'seated');
  if(m.state==='sit'||m.state==='rise'||m.state==='down'){const k=Math.min(1,m.t/SIT),e=m.state==='sit'?k:1-k,y=Math.round(h+(seatY-h)*e-Math.sin(Math.PI*e)*8);return kinds.animal(m,x,y,t,'jump');}
  kinds.animal(m,x,h,t,'walk');
 }
 // Zoomies and dances wander a few pixels along the seat (never far enough to reach the props).
 function animalDrift(m){
  if(m.pose==='dash'){const k=Math.sin((m.pt||0)*2.2);m.dir=Math.cos((m.pt||0)*2.2)>=0?1:-1;return Math.round(k*8);}
  if(m.pose==='dance'){if(mod(m.pt||0,1.2)<.05)m.dir=-m.dir;return Math.round(Math.sin((m.pt||0)*1.3)*5);}
  return 0;
 }
 function person(m,x,by,h,t){
  const seatedPainter=m.kind==='maid'?kinds.maidSeated:m.kind==='alien'?kinds.alienSeated:null;
  const standingPainter=m.kind==='maid'?kinds.maidStanding:m.kind==='alien'?kinds.alienStanding:null;
  const sitDown=(k=1)=>seatedPainter?seatedPainter(m,x,by-Math.round((1-k)*14),t):seated(m,x,by,t,k);
  if(m.state==='seated')return sitDown();
  if(m.state==='sit'||m.state==='rise'){const k=Math.min(1,m.t/SIT),e=m.state==='sit'?k:1-k;if(e>.5)return sitDown(e);}
  if(standingPainter)standingPainter(m,x,h,t);else standing(m,x,h,t);
 }
 function draw(t=clock){
  if(!geo)return;clock=t;const {w,h,by,s}=geo,v=director.view;
  c.clearRect(0,0,w,h);
  for(const m of [...v.members,...(v.staff?[v.staff]:[])]){
   if(m.delay>0||m.state==='gone')continue;const x=Math.round(m.x*w);
   if(SPECIES.includes(m.kind))animal(m,x,t);else person(m,x,by,h,t);
  }
  // Spilled oranges on the floor, and a cartoon dust cloud over a scuffle.
  for(const o of v.props){const x=Math.round(o.x*w);R(x-2,h-5,4,4,'#e8902a');R(x-1,h-6,2,1,'#e8902a');R(x-1,h-5,1,1,'#ffd08a');R(x,h-7,1,1,'#4a7a3a');}
  if(v.dust){const f=v.members.filter(m=>m.pose==='punch'||m.pose==='reel');
   if(f.length===2){const mx=Math.round((f[0].x+f[1].x)/2*w),y=h-48,puff=(x,y,r,col)=>{c.fillStyle=col;c.beginPath();c.arc(Math.round(x),Math.round(y),r,0,Math.PI*2);c.fill();};
    // A rolling cartoon cloud over the two of them, a fist or a shoe poking out, and a star now and then.
    for(let i=0;i<9;i++){const a=t*3+i*.7;puff(mx+Math.cos(a)*14,y+Math.sin(a*1.4)*12,8+(i%3)*2,'#6a6258');}
    for(let i=0;i<9;i++){const a=t*3+i*.7;puff(mx+Math.cos(a)*14,y+Math.sin(a*1.4)*12-1,7+(i%3)*2,'#e8e0d0');}
    const k=Math.floor(t*2.5)%4,sx=k%2?1:-1;
    if(k<2){R(mx+sx*20-2,y-8+k*6,5,4,f[0].app.skin);R(mx+sx*14,y-7+k*6,6,2,shade(f[0].app.top,.72));}else R(mx+sx*20-2,y+14,6,3,'#1a1412');
    if(mod(t,.9)<.3){const sy=y-24+Math.round(mod(t,.9)*10);lights.push([mx-1+sx*6,sy,3,3,'#ffe066'],[mx-3+sx*6,sy+1,7,1,'#ffe066'],[mx+sx*6,sy-2,1,7,'#ffe066']);}}}
  // match the cabin's night grade so people sit in the same light; eyes and antennae glow through it
  c.save();c.globalCompositeOperation='source-atop';c.fillStyle='rgba(12,7,4,.34)';c.fillRect(0,0,w,h);c.restore();
  for(const [lx,ly,lw,lh,col] of lights.splice(0))R(lx,ly,lw,lh,col);
  const line=v.line;
  if(line&&!geo.quiet&&!muted){
   const key=line.who+':'+line.text;
   if(key!==shown){shown=key;bubble.textContent=line.text;bubble.className='passenger-bubble'+(line.mark==='!'?' sharp':line.mark==='~'?' light':'');}
   bubble.hidden=false;
   const bx=Math.round(line.x*w)*s,bw=bubble.offsetWidth||120,min=8,max=w*s-bw-8;
   bubble.style.left=Math.max(min,Math.min(max,bx-bw/2))+'px';bubble.style.top=((by-14)*s-(bubble.offsetHeight||28))+'px';
   bubble.style.setProperty('--tail',Math.max(12,Math.min(bw-12,bx-Math.max(min,Math.min(max,bx-bw/2))))+'px');
  }else if(!bubble.hidden){bubble.hidden=true;shown='';}
 }
 return {
  director,
  // Mirror the cabin's pixel grid; hidden whenever the cabin is.
  layout(m){
   canvas.hidden=!m;if(!m){geo=null;bubble.hidden=true;shown='';return;}
   if(canvas.width!==m.w||canvas.height!==m.h){canvas.width=m.w;canvas.height=m.h;c.imageSmoothingEnabled=false;}
   canvas.style.width=m.w*m.s+'px';canvas.style.height=m.h*m.s+'px';geo={...m,quiet:geo?.quiet};draw();
  },
  arrive(ctx){director.arrive(ctx);},
  setMuted(value){muted=!!value;draw();},
  get muted(){return muted;},
  seed(ctx,size){director.seed(ctx,size,{width:geo?.w});draw();},
  tick(dt,t,{quiet=false}={}){if(!geo)return;geo.quiet=quiet;director.advance(dt,{width:geo.w,quiet});draw(t);},
  get status(){const v=director.view;return {size:v.size,rel:v.rel,cast:v.cast,tone:v.tone,scene:v.scene,leaving:v.leaving,line:v.line?.text||null,members:v.members.map(m=>m.state),kinds:v.members.map(m=>m.kind),poses:v.members.map(m=>m.pose)};},
 };
}
