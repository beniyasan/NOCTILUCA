// Fellow passengers on the facing long seat. At each arrival nobody, one
// traveller, a pair or a group of three may board and sit across the aisle.
// A lone traveller only passes the time; pairs and groups talk among
// themselves in lines generated from topic templates. View-only: nothing here
// is saved, sent to the server or counted as progress.
import {mod} from './anim-utils.js';

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
const SOLO_POSES=['idle','read','phone','doze','idle','read'];

function fill(text,w,r){return text.replace(/\{(\w+)\}/g,(_,k)=>w[k]??pickOf(r,WORDS[k]||['……']));}
// Generate one conversation. Returns [{who,text,mark}] with who indexing members.
export function generateTalk({size,tone='chat',random:r=Math.random,names=[],station='',next='',world=''}={}){
 const pool=size>=3?TRIO:tone==='quarrel'?PAIR_QUARREL:PAIR_CHAT,topic=pickOf(r,pool);
 // Shuffle roles so the one who opens differs between conversations.
 const order=[0,1,2].slice(0,Math.max(2,Math.min(3,size)));for(let i=order.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
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
  if(tone!=='quarrel'&&size>=2&&r()<.12&&lines.length<6){const l=order.filter(i=>i!==lines.at(-1).who);lines.push({who:pickOf(r,l),text:pickOf(r,FILLERS),mark:''});}
 }
 return lines;
}

// ---- boarding / seating / talk director (pure) --------------------------------
const WALK=34,SIT=.6,SPACING=25;
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
const BLOCKED=[[.43,.53],[.72,.85]];// the cat and the tool bag the cabin paints on the seat
// `talk` may supply lines from elsewhere (the Lolipop edition's daily pool); null falls back to the templates.
export function createPassengerDirector({random:r=Math.random,talk=null}={}){
 let group=null,queue=null,script=null,wait=0,width=460,time=0;
 const members=()=>group?.members||[];
 function seats(size,w,avoid=[]){
  const span=(size-1)*SPACING/w,props=[...(w>=260?BLOCKED:[]),...avoid],edge=22/w;
  for(let i=0;i<40;i++){
   const u=edge+r()*(1-2*edge-span);
   if(props.every(([a,b])=>u+span<a-12/w||u>b+12/w))return Array.from({length:size},(_,k)=>u+k*SPACING/w);
  }
  return null;
 }
 function board(size,ctx){
  const targets=seats(size,width,ctx.avoid);if(!targets)return;
  const from=r()<.5?-1:1,rel=size===1?'solo':pickOf(r,size===2?['friends','couple','coworkers','siblings']:['friends','coworkers','students']);
  const names=[...NAMES].sort(()=>r()-.5).slice(0,size);
  const order=from<0?[...targets].reverse():targets;// the first in walks furthest
  group={size,rel,names,stays:0,ctx,members:order.map((u,i)=>({app:appearance(r),seat:u,x:from<0?-.06-i*.05:1.06+i*.05,dir:-from,state:'walk',t:0,delay:i*.7,pose:'idle',look:0,poseTimer:4+r()*10}))};
  wait=3+r()*4;script=null;
 }
 function leave(){
  if(!group)return;script=null;
  for(const m of group.members){m.state='rise';m.t=0;m.delay=r()*.8;m.dir=m.seat<.5?-1:1;m.pose='idle';}
  group.leaving=true;
 }
 const api={
  // A stop at a station: people may get off, then others may get on.
  arrive(ctx={}){
   if(group&&!group.leaving){group.stays++;group.ctx={...group.ctx,...ctx};if(group.stays>=3||r()<.5)leave();else return;}
   const roll=r(),size=roll<.3?0:roll<.6?1:roll<.82?2:3;
   queue=size?{size,ctx,delay:group?4:1.5}:null;
  },
  // Seat a group without the walk-in, e.g. already aboard when the page opens.
  seed(ctx={},size){
   const s=size??(r()<.4?0:1+Math.floor(r()*3));group=null;queue=null;if(!s)return;
   board(s,ctx);for(const m of group.members){m.x=m.seat;m.state='seated';m.dir=1;}
  },
  clear(){group=null;queue=null;script=null;},
  advance(dt,{width:w=width,quiet=false}={}){
   width=w;time+=dt;
   if(queue&&!group){queue.delay-=dt;if(queue.delay<=0){const q=queue;queue=null;board(q.size,q.ctx);}}
   if(!group)return;
   const speed=WALK/width;
   for(const m of group.members){
    if(m.delay>0){m.delay-=dt;continue;}
    m.t+=dt;
    if(m.state==='walk'){const d=m.seat-m.x;m.dir=Math.sign(d)||m.dir;if(Math.abs(d)<=speed*dt){m.x=m.seat;m.state='sit';m.t=0;}else m.x+=Math.sign(d)*speed*dt;}
    else if(m.state==='sit'&&m.t>=SIT){m.state='seated';m.t=0;}
    else if(m.state==='rise'&&m.t>=SIT){m.state='out';m.t=0;}
    else if(m.state==='out'){m.x+=m.dir*speed*dt;if(m.x<-.1||m.x>1.1)m.state='gone';}
   }
   if(group.leaving){if(group.members.every(m=>m.state==='gone'))group=null;return;}
   const seated=group.members.every(m=>m.state==='seated');if(!seated)return;
   if(group.size===1){
    const m=group.members[0];m.poseTimer-=dt;
    if(m.poseTimer<=0){m.pose=pickOf(r,SOLO_POSES);m.poseTimer=14+r()*26;}
    m.look=m.pose==='idle'?(mod(time*.07+m.app.phase,1)<.15?(m.app.phase>5?1:-1):0):0;
    return;
   }
   // Conversation: hold (not skip) while quiet, so a line is never missed.
   if(quiet)return;
   if(!script){
    wait-=dt;for(const m of group.members){m.pose='idle';m.look=0;}
    if(wait>0)return;
    const tone=group.size===2&&r()<(group.rel==='couple'||group.rel==='siblings'?.4:.25)?'quarrel':'chat';
    const ask={size:group.size,tone,random:r,names:group.names,station:group.ctx.station,next:group.ctx.next,world:group.ctx.world};
    script={tone,lines:talk?.(ask)||generateTalk(ask),i:0,t:0};
   }
   const line=script.lines[script.i];
   if(!line){script=null;wait=10+r()*16;return;}
   script.t+=dt;const hold=Math.min(6.5,2.2+line.text.length*.13),gap=.9;
   const speaker=group.members[line.who],sx=speaker.seat;
   for(const [i,m] of group.members.entries()){
    if(i===line.who){m.look=0;m.pose=line.mark==='!'?'gesture':line.mark==='~'?'laugh':'talk';const o=group.members.filter((_,k)=>k!==i);m.look=Math.sign(o.reduce((a,x)=>a+x.seat,0)/o.length-m.seat);}
    else{m.look=Math.sign(sx-m.seat);m.pose=line.mark==='~'?'laugh':'idle';if(script.tone==='quarrel'&&(line.mark==='!'||m.pose==='cross')){m.pose='cross';m.look=-Math.sign(sx-m.seat);}}
   }
   if(script.t>=hold+gap){script.i++;script.t=0;}
  },
  get view(){
   const line=script?.lines[script.i],hold=line?Math.min(6.5,2.2+line.text.length*.13):0;
   return {size:group?.size||0,rel:group?.rel||null,leaving:!!group?.leaving,queued:queue?.size||0,tone:script?.tone||null,
    members:members().map(m=>({...m})),
    line:line&&script.t<hold?{who:line.who,text:line.text,mark:line.mark,t:script.t,x:group.members[line.who].seat}:null};
  },
 };
 return api;
}

// ---- painter and speech bubble (DOM) ---------------------------------------
// While `muted` (headphones on) talk goes on silently: no bubbles, and only template lines, so the daily pool is not spent unseen.
export function createPassengers(host,cabin,{talk=null}={}){
 const canvas=document.createElement('canvas');canvas.className='passengers';canvas.setAttribute('aria-hidden','true');cabin.canvas.after(canvas);
 const bubble=document.createElement('div');bubble.className='passenger-bubble';bubble.hidden=true;bubble.setAttribute('aria-hidden','true');canvas.after(bubble);
 const c=canvas.getContext('2d');let geo=null,shown='',clock=0,muted=false;
 const director=createPassengerDirector({talk:ask=>muted?null:talk?.(ask)||null});
 const R=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const shade=(hex,k)=>{const n=parseInt(hex.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(v*k)));return '#'+[(n>>16)&255,(n>>8)&255,n&255].map(v=>f(v).toString(16).padStart(2,'0')).join('');};

 function hair(a,x,y,look){
  const h=a.hair,s=a.style;
  if(s==='cap'){R(x-6,y-1,12,4,a.top);R(x-6+(look>0?3:look<0?-3:0),y+2,12,1,shade(a.top,.7));R(x-5,y+3,1,4,h);R(x+4,y+3,1,4,h);return;}
  R(x-5,y,10,3,h);R(x-6,y+1,1,5,h);R(x+5,y+1,1,5,h);
  if(s==='short'||s==='crop'){R(x-5,y+3,look>0?3:2,s==='crop'?1:2,h);R(x+3,y+3,2,1,h);}
  if(s==='bob'){R(x-6,y+2,2,8,h);R(x+4,y+2,2,8,h);R(x-4,y+3,8,1,h);}
  if(s==='long'){R(x-6,y+2,2,14,h);R(x+4,y+2,2,14,h);R(x-4,y+3,4,1,h);}
  if(s==='tail'){R(x-4,y+3,8,1,h);R(look>0?x-8:x+5,y+3,3,9,h);}
  if(s==='bun'){R(x-2,y-3,5,3,h);R(x-4,y+3,8,1,h);}
 }
 function face(a,x,y,look,t,pose,talking){
  const blink=mod(t+a.phase,a.blink)<.13||pose==='doze',down=pose==='read'||pose==='phone'?1:0,ex=look*2,eye='#2a1c16';
  if(pose==='laugh'){R(x-3+ex,y+5,2,1,eye);R(x+1+ex,y+5,2,1,eye);}
  else if(blink){R(x-3+ex,y+6+down,2,1,eye);R(x+1+ex,y+6+down,2,1,eye);}
  else{R(x-3+ex,y+5+down,1,2,eye);R(x+2+ex,y+5+down,1,2,eye);}
  if(a.glasses){R(x-4+ex,y+5+down,3,1,'#1a1a1a88');R(x+1+ex,y+5+down,3,1,'#1a1a1a88');R(x-1+ex,y+5+down,2,1,'#1a1a1a55');}
  const open=(talking&&mod(t*7,2)<1)||pose==='laugh';R(x-1+ex,y+8+down,2,open?2:1,open?'#6a2a2a':shade(a.skin,.72));
  if(pose==='cross'||pose==='gesture')R(x-3+ex,y+4,2,1,shade(a.hair,.8));
 }
 function seated(m,x,by,t,k=1){
  // k eases 0→1 while sitting down; the body rises out of standing height.
  const a=m.app,pose=m.pose,look=m.look,lift=Math.round((1-k)*14),bob=pose==='laugh'?Math.round(Math.abs(Math.sin(t*9))):Math.round(Math.sin(t*1.3+a.phase)*.5+.3);
  const y=by-lift,nod=pose==='doze'?(mod(t*.35+a.phase,1)<.8?2:0):0,hx=x+(pose==='doze'?1:0)+(look?look:0);
  const top=a.top,topLo=shade(top,.72),pants=a.bottom,shoe='#1a1412';
  R(x-6,y+39,5,3,shoe);R(x+1,y+39,5,3,shoe);R(x-5,y+31,4,9,pants);R(x+1,y+31,4,9,pants);
  if(a.skirt){R(x-8,y+24,16,8,pants);R(x-5,y+32,4,7,shade(a.skin,.85));R(x+1,y+32,4,7,shade(a.skin,.85));}
  else{R(x-7,y+25,14,7,pants);R(x-7,y+25,14,1,shade(pants,1.3));R(x,y+27,1,5,shade(pants,.7));}
  const ty=y+6-bob;
  R(x-7,ty,14,20+bob,top);R(x-6,ty-1,12,1,top);R(x-7,ty+17+bob,14,2,topLo);R(x,ty+2,1,14,topLo);
  if(a.scarf){R(x-6,ty-1,12,3,a.scarf);R(x+2,ty+2,3,6,a.scarf);}
  // arms by pose
  if(pose==='cross'){R(x-9,ty+2,3,10,topLo);R(x+6,ty+2,3,10,topLo);R(x-7,ty+10,14,4,topLo);R(x-6,ty+11,2,2,a.skin);R(x+4,ty+11,2,2,a.skin);}
  else if(pose==='gesture'){const w=Math.round(Math.sin(t*6)*1.5);R(x-9,ty+2,3,15,topLo);R(x-7,ty+17,3,2,a.skin);R(x+6,ty+2,3,7,topLo);R(x+8,ty-2+w,3,7,topLo);R(x+8,ty-4+w,3,3,a.skin);}
  else if(pose==='read'){R(x-9,ty+2,3,12,topLo);R(x+6,ty+2,3,12,topLo);R(x-7,ty+10,14,9,'#e6dcc0');R(x-7,ty+10,14,1,'#6b4a3a');R(x,ty+10,1,9,'#b8ad90');for(let i=0;i<3;i++){R(x-5,ty+13+i*2,4,1,'#9a917a');R(x+2,ty+13+i*2,4,1,'#9a917a');}R(x-8,ty+15,2,3,a.skin);R(x+6,ty+15,2,3,a.skin);}
  else if(pose==='phone'){R(x-9,ty+2,3,12,topLo);R(x+6,ty+2,3,12,topLo);R(x-6,ty+13,12,3,topLo);R(x-2,ty+11,5,6,'#1a1f2a');R(x-1,ty+12,3,4,'#7fb8e0');R(x-4,ty+15,3,2,a.skin);R(x+2,ty+15,3,2,a.skin);}
  else{R(x-9,ty+2,3,16,topLo);R(x+6,ty+2,3,16,topLo);R(x-8,ty+18,3,2,a.skin);R(x+5,ty+18,3,2,a.skin);}
  if(a.bag&&pose!=='read'&&pose!=='phone'){R(x-7,y+22,14,8,a.bag);R(x-7,y+22,14,1,shade(a.bag,1.25));R(x-3,y+19,1,3,shade(a.bag,.7));R(x+3,y+19,1,3,shade(a.bag,.7));}
  // neck and head
  const hy=y-8-bob+nod;
  R(x-2,ty-3,4,3,shade(a.skin,.82));
  R(hx-5,hy,10,11,a.skin);R(hx-5,hy+10,10,1,shade(a.skin,.85));
  if(pose==='phone')R(hx-4,hy+8,8,3,'#7fb8e022');
  face(a,hx,hy,look,t,pose,pose==='talk'||pose==='gesture');hair(a,hx,hy-1,look);
  if(pose==='doze'&&mod(t*.35+a.phase,1)<.8)R(hx+6,hy-6,3,1,'#e6dcc088');
 }
 function standing(m,x,h,t){
  const a=m.app,dir=m.dir,walking=m.state==='walk'||m.state==='out',step=walking?Math.sin((t+a.phase)*8):0,bob=walking?Math.round(Math.abs(step)):0,y=h-bob;
  const top=a.top,topLo=shade(top,.72),pants=a.bottom;
  R(x-4+Math.round(step*3),y-30,4,28,pants);R(x+Math.round(-step*3),y-30,4,28,shade(pants,.85));
  R(x-5+Math.round(step*3),y-3,6,3,'#1a1412');R(x-1-Math.round(step*3),y-3,6,3,'#1a1412');
  if(a.skirt)R(x-7,y-34,14,12,pants);
  R(x-7,y-58,14,28,top);R(x-6,y-59,12,1,top);R(x,y-56,1,24,topLo);
  if(a.scarf)R(x-6,y-59,12,3,a.scarf);
  R(x-3-Math.round(step*3),y-56,3,20,topLo);R(x-3-Math.round(step*3),y-37,3,2,a.skin);
  if(a.bag){R(x+(dir>0?-9:5),y-40,5,11,a.bag);R(x+(dir>0?-6:4),y-58,1,18,shade(a.bag,.7));}
  R(x-2,y-61,4,3,shade(a.skin,.82));
  const hy=y-72;R(x-5,hy,10,11,a.skin);face(a,x,hy,dir,t,'idle',false);hair(a,x,hy-1,dir);
 }
 function draw(t=clock){
  if(!geo)return;clock=t;const {w,h,by,s}=geo,v=director.view;
  c.clearRect(0,0,w,h);
  for(const m of v.members){
   if(m.delay>0||m.state==='gone')continue;const x=Math.round(m.x*w);
   if(m.state==='seated')seated(m,x,by,t);
   else if(m.state==='sit'||m.state==='rise'){const k=Math.min(1,m.t/SIT),e=m.state==='sit'?k:1-k;if(e>.5)seated(m,x,by,t,e);else standing(m,x,h,t);}
   else standing(m,x,h,t);
  }
  // match the cabin's night grade so people sit in the same light
  c.save();c.globalCompositeOperation='source-atop';c.fillStyle='rgba(12,7,4,.34)';c.fillRect(0,0,w,h);c.restore();
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
  seed(ctx,size){director.seed(ctx,size);draw();},
  tick(dt,t,{quiet=false}={}){if(!geo)return;geo.quiet=quiet;director.advance(dt,{width:geo.w,quiet});draw(t);},
  get status(){const v=director.view;return {size:v.size,rel:v.rel,tone:v.tone,leaving:v.leaving,line:v.line?.text||null,members:v.members.map(m=>m.state)};},
 };
}
