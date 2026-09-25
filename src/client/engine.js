import {createSidequestSceneRenderer} from './sidequest-scenes.js';



import {createArrivalBell} from './arrival-bell.js';
import {createTalk} from './talk.js';
import {createMomentDirector,createMomentRenderer} from './kowloon-moments.js';
import {SCRAP_MOMENTS,createScrapMomentRenderer} from './scrap-moments.js';
import {PELAGIC_MOMENTS,createPelagicMomentRenderer} from './pelagic-moments.js';
import {GORGE_MOMENTS,createGorgeMomentRenderer} from './gorge-moments.js';
import {RELAY_MOMENTS,createRelayMomentRenderer} from './relay-moments.js';
import {JADE_MOMENTS,createJadeMomentRenderer} from './jade-moments.js';
import {DISTRICTS,createDistrictJourney,createDistrictRenderer,routeScene,approachScene,focusPassage} from './scenery.js';
export function createEngine(gateway,catalog) {
// NOCTILUCA: dependency-free, deterministic pixel-art renderer.
// Geometry is painted into reusable layers; the animation moves the layers at
// different speeds, then adds traffic, atmosphere, reflections and a space leg.
const $ = id => document.getElementById(id);
const canvas = $('scene'), ctx = canvas.getContext('2d', {alpha:false});
if (!ctx) { $('world-description').textContent = 'Canvas 2D を利用できるブラウザで開いてください。'; return; }
const HEIGHT = 450, TILE = 2304;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const worlds = [
 {id:'kowloon',name:'ネオン九龍',en:'NEON KOWLOON',description:'眠らない街に、今日も青い雨が降る。',detail:'雨と看板、重なり合う屋根。軌道上に育った不夜城。',sector:'SECTOR 09 · ALT 8,400 KM',weather:'NEON RAIN / LOCAL 02:17',station:'九龍東ホーム',seed:9081,sky:['#060e21','#26122d','#a91b4f'],far:'#351b39',mid:'#261b31',near:'#131b29',trim:'#44505b',light:'#ffcd77',accent:'#66f7dd',neon:'#ff3974',haze:'#ce225d',planet:'#697b9c',kind:'neon',rain:1,chord:[110,164.81,220,261.63],conditions:[
   {weather:'NEON RAIN / LOCAL 02:17',note:'屋台通りの湯気が濃く、看板修理のドローンが低く飛ぶ。',traffic:1.15,particles:1.1,feature:'festival'},
   {weather:'POWER SAVE / LOCAL 01:26',note:'一部の広告塔が節電中。青い雨粒だけがいつもより目立つ。',traffic:.8,particles:.9,feature:'service'},
   {weather:'SIGNAL BURST / LOCAL 03:02',note:'終電帰りの小列車が多い夜。路地の灯りが一段と賑やか。',traffic:1.25,particles:1,feature:'train'}
 ]},
 {id:'scrap',name:'スクラップ・ベルト',en:'SCRAP BELT',description:'捨てられた船の骨組みに、今日の暮らしが灯っている。',detail:'宇宙ゴミと廃船の帯。切り開かれた船体に市場と工房が増築される。',sector:'SECTOR 18 · SALVAGE ORBIT',weather:'SALVAGE GLOW / LOCAL 22:48',station:'サルベージ中央停留所',seed:48721,sky:['#0a101b','#28232f','#73655a'],far:'#343038',mid:'#2a2d35',near:'#161d29',trim:'#6d6d73',light:'#ffd4a0',accent:'#8cf1df',neon:'#ff8c6b',haze:'#85767a',planet:'#8b8179',kind:'scrap',rain:0,chord:[92.5,138.59,185,246.94],conditions:[
   {weather:'SALVAGE GLOW / LOCAL 22:48',note:'クレーン群が忙しい。回収艇が新しい船殻を曳いて戻ってくる。',traffic:1.05,particles:.95,feature:'tug'},
   {weather:'WELDING HAZE / LOCAL 21:59',note:'溶接の火花が多く、作業床の店は少し早めの店じまい。',traffic:.75,particles:1.15,feature:'sparks'},
   {weather:'QUIET SHIFT / LOCAL 00:11',note:'夜勤の交代時間。食堂の灯りは残るが、クレーンの動きは穏やか。',traffic:.62,particles:.8,feature:'lantern'}
 ]},
 {id:'pelagic',name:'蒼海ドック',en:'PELAGIC DOCKS',description:'海の惑星で、星を運ぶ船が眠っている。',detail:'光る海と透明なドーム。巨大な星を望む宇宙港。',sector:'SECTOR 23 · OCEAN MOON',weather:'TIDAL LIGHT / LOCAL 04:38',station:'蒼海第3埠頭',seed:72034,sky:['#041425','#064358','#14807f'],far:'#164256',mid:'#173b4e',near:'#122c3a',trim:'#447278',light:'#bbe9b6',accent:'#71fff0',neon:'#43baff',haze:'#21a9ab',planet:'#a1c5b6',kind:'water',rain:0,chord:[98,146.83,196,246.94],conditions:[
   {weather:'TIDAL LIGHT / LOCAL 04:38',note:'干満の青い光が強い。遠くの浮体港には早朝便が集まっている。',traffic:1.0,particles:.75,feature:'leviathan'},
   {weather:'SEA MIST / LOCAL 05:12',note:'霧が海上高架を薄く包む。水面の反射がふだんより柔らかい。',traffic:.7,particles:.95,feature:'mist'},
   {weather:'HARVEST RUN / LOCAL 03:54',note:'養殖区画の整備艇が多く、小型船が頻繁に行き交う。',traffic:1.2,particles:.7,feature:'boats'}
 ]},
 {id:'gorge',name:'岩海峡谷',en:'STONE GORGE',description:'断崖の谷間で、小さな灯りが岩にしがみついている。',detail:'巨岩と峡谷、掘削拠点。列車は崖沿いを抜け、谷をまたぐ。',sector:'SECTOR 41 · BASALT CANYON',weather:'CINDER WIND / LOCAL 18:46',station:'峡谷リッジ駅',seed:67143,sky:['#191826','#403447','#8e6044'],far:'#4d3a43',mid:'#423338',near:'#2c2831',trim:'#83715f',light:'#ffd690',accent:'#d2e3a7',neon:'#ff9a68',haze:'#ca8a64',planet:'#b0896d',kind:'rock',rain:0,chord:[82.41,123.47,164.81,220],conditions:[
   {weather:'CINDER WIND / LOCAL 18:46',note:'谷風が強く、資材ゴンドラは慎重な速度で運行している。',traffic:.86,particles:1.0,feature:'gondola'},
   {weather:'AFTERBLAST / LOCAL 19:08',note:'遠い掘削音が断続的に響く。粉塵が夕焼けに混じって漂う。',traffic:.72,particles:1.18,feature:'blast'},
   {weather:'RIDGE CLEAR / LOCAL 17:59',note:'珍しく視界が良い日。遠くの岩棚まで見通せる。',traffic:1.02,particles:.62,feature:'beacon'}
 ]},
 {id:'jade',name:'翡翠ガーデン',en:'JADE GARDENS',description:'誰かが植えた森が、街ごと星を包んだ。',detail:'空中庭園と桜色の花。緑に還りつつある未来都市。',sector:'SECTOR 56 · BOTANICAL RING',weather:'PETAL DRIFT / LOCAL 05:12',station:'翡翠園前駅',seed:5381,sky:['#071c2b','#244f56','#899785'],far:'#2b5758',mid:'#234c49',near:'#152e32',trim:'#668779',light:'#ffe7a1',accent:'#93e9ba',neon:'#faa2c3',haze:'#80c6a2',planet:'#e7c1b3',kind:'garden',rain:0,chord:[130.81,196,261.63,329.63],conditions:[
   {weather:'PETAL DRIFT / LOCAL 05:12',note:'花びらが風の少ない回廊をゆっくり流れていく。',traffic:.78,particles:1.0,feature:'petals'},
   {weather:'GREENHOUSE GLOW / LOCAL 04:48',note:'温室群の灯りが強く、朝の手入れ車両が目立つ。',traffic:.92,particles:.72,feature:'tram'},
   {weather:'SOFT RAIN / LOCAL 06:01',note:'薄い保水雨。葉の輪郭が光を抱えて少しだけ銀色になる。',traffic:.68,particles:.95,feature:'rain'}
 ]},
 {id:'relay',name:'ナイト・リレー',en:'NIGHT RELAY',description:'人のいない星でも、灯りは誰かを待つ。',detail:'小惑星と深宇宙の通信基地。紫色の送信環がゆっくり巡る。',sector:'SECTOR 88 · DEEP SPACE',weather:'DEEP SILENCE / LOCAL --:--',station:'リレー88 接続環',seed:29832,sky:['#060b1b','#17172f','#412b53'],far:'#292541',mid:'#28283e',near:'#17202e',trim:'#58556c',light:'#ffba9b',accent:'#b3c7ff',neon:'#cc8bff',haze:'#894aa6',planet:'#59617c',kind:'void',rain:0,chord:[73.42,110,146.83,185],conditions:[
   {weather:'DEEP SILENCE / LOCAL --:--',note:'中継環は静かに回り、補修ポッドだけが時折灯りを引く。',traffic:.6,particles:.7,feature:'pods'},
   {weather:'MICROMETEOR / LOCAL --:--',note:'小さな破片が漂い、補修ポッドがいつもの点検を続ける。',traffic:.52,particles:1.18,feature:'debris'},
   {weather:'LONG RANGE LINK / LOCAL --:--',note:'遠距離通信の繁忙時間。無人搬送体が数珠つなぎで通り過ぎる。',traffic:1.1,particles:.78,feature:'convoy'}
 ]}
];
const state = {index:0,elapsed:0,time:0,travel:0,speed:1,paused:reducedMotion,auto:true,dwell:120,travelSeconds:null,transition:null,lap:1,immersive:false,sound:false,visitCounts:Array(worlds.length).fill(0),currentVisit:null,frames:0,stationStops:true,stopDuration:24,density:"normal",hints:true,stop:{phase:"arrive",t:0,held:false}};
let W=900, activeScene=null, last=0, uiLast=0, resizeTimer=0, toastTimer=0, wakeTimer=0, volumeTimer=0;
const cache=new Map(), thumbCache=new Map(), districtCache=new Map();
const districtJourney=createDistrictJourney();
const bell=createArrivalBell(()=>gateway.snapshot.state.settings);
let legElapsed=0,legDuration=null,legActive=false;
let routeStart=0,routeDeparture=0,focusPreview=null;
function beginLeg(){legElapsed=0;legDuration=state.travelSeconds;legActive=legDuration!==null;routeStart=state.elapsed;routeDeparture=state.stop.phase==='depart'?8:0;districtJourney.reset();focusPreview=null;}
function focusRoute(){
 const v=engine.timer?.view;
 return v?.phase==='work'&&state.stop.phase!=='stop'?focusPassage(v.total,v.remainingMs):null;
}
function scenicStop(work=focusRoute()){
 if(!work)return getStopState();
 return work.departure<1?{phase:'depart',t:work.departure*8,overlay:1,motion:work.departure,held:false}:{phase:work.crossing===null?'cruise':'transit',t:0,motion:1,overlay:0,held:false};
}
function journeyScenery(){
 if(state.transition?.fromScenic)return state.transition.fromScenic;
 const work=focusRoute();
 if(work)return routeScene(worlds[state.index].id,work.progress,work.duration);
 const stop=getStopState();
 if(stop.overlay){
  if(stop.phase==='arrive'&&stop.fromDistrict!==undefined){const mix=clamp(stop.t/3,0,1);return {from:mix===1?0:stop.fromDistrict,to:0,mix};}
  return {from:0,to:0,mix:1};
 }
 if(!state.auto)return districtJourney.view;
 const budget=(legDuration!==null?legDuration-7.8-(state.stationStops?6:0):state.dwell-routeStart)-routeDeparture;
 const elapsed=(legDuration!==null?legElapsed:state.elapsed-routeStart)-routeDeparture;
 return routeScene(worlds[state.index].id,elapsed/Math.max(.1,budget),budget);
}
function arrivalNotice(){bell.ring();toast(worlds[state.index].station+'に到着しました。');}
function rand(seed){let a=seed|0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const ir=(r,a,b)=>Math.floor(a+r()*(b-a+1));
const pick=(r,a)=>a[Math.floor(r()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mod=(a,b)=>(a%b+b)%b;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
function visitSeed(index,count=0){return worlds[index].seed+count*971+index*131;}
// PHASE 1.5 / ambient time is independent of train motion.
// No economy, deadlines, offline simulation, or destructive world changes.
const VERSION = 'scenery-2026-09-07';
const districtRenderer=createDistrictRenderer({surface,rect,line,ellipse,poly,rand,ir,tower,pagoda,dome,industry,gardenTree,boulder,wreck,crate,sign,person,steam,drone,robot,rotatingFan,workCrane,shipBoat,drawRay,drawRelayRing,mod,shuttling});
const sidequestRenderer=createSidequestSceneRenderer({rect,line,ellipse,poly,person});
const momentDirector=createMomentDirector(),momentRenderer=createMomentRenderer({rect,line,ellipse,poly,person,crate,sign,rand,shipBoat});
const scrapDirector=createMomentDirector(SCRAP_MOMENTS),scrapRenderer=createScrapMomentRenderer({rect,line,ellipse,poly,person,crate});
const pelagicDirector=createMomentDirector(PELAGIC_MOMENTS),pelagicRenderer=createPelagicMomentRenderer({rect,line,ellipse,poly,person,crate});
const gorgeDirector=createMomentDirector(GORGE_MOMENTS),gorgeRenderer=createGorgeMomentRenderer({rect,line,ellipse,poly,person,crate});
const jadeDirector=createMomentDirector(JADE_MOMENTS),jadeRenderer=createJadeMomentRenderer({rect,line,ellipse,poly,person,crate});
const relayDirector=createMomentDirector(RELAY_MOMENTS),relayRenderer=createRelayMomentRenderer({rect,line,ellipse,poly});
const momentDirectors=[momentDirector,scrapDirector,pelagicDirector,gorgeDirector,jadeDirector,relayDirector];
const LIFE = {
 neon:{landmark:'月光広告塔',shop:'月光食堂',shopEn:'MOON NOODLES',stationEn:'KOWLOON EAST',note:['屋台の湯気と、配達ドローン。いつもの夜が続いている。','広告塔のそばで、整備ドローンが点検している。','食堂の暖簾が揺れ、小さな列車が高架を渡っていく。']},
 scrap:{landmark:'旧移民船の船首',shop:'船底食堂',shopEn:'HULL CAFE',stationEn:'SALVAGE CENTRAL',note:['回収船が廃船を曳き、クレーンが荷を移している。','作業台のそばで、溶接の小さな光が灯っている。','交代時間の工房。船底の食堂から湯気が上がる。']},
 water:{landmark:'第3埠頭の灯台',shop:'潮待ち売店',shopEn:'TIDE & TEA',stationEn:'PELAGIC PIER 03',note:['整備艇が網のそばを通る。海の下には、大きな影。','薄い海霧の向こうで、いつもの灯台が光っている。','漁船がゆっくり帰港する。埠頭では網を引き上げている。']},
 rock:{landmark:'峡谷リッジの居住岩',shop:'岩棚休憩所',shopEn:'RIDGE CANTEEN',stationEn:'CANYON RIDGE',note:['谷を渡るゴンドラ。岩棚の昇降機は物資を運び続ける。','粉塵の向こうでも、崖の食堂には灯りがついている。','遠い岩棚まで見える日。作業員が昇降機を見送る。']},
 garden:{landmark:'翡翠の段々温室',shop:'こもれび茶房',shopEn:'LEAF & TEA',stationEn:'JADE GARDEN',note:['温室の手入れが始まる。花びらが通りを横切っていく。','散水機が葉を濡らす。庭師が鉢のそばを歩いている。','細い雨の温室。軒下には、いつもの小さな猫。']},
 void:{landmark:'88番中継環',shop:'無人補給スタンド',shopEn:'AUTOMAT / 88',stationEn:'RELAY 88',note:['整備ポッドが中継環を点検し、充電台へ帰っていく。','小さな破片がゆっくり流れる。補修灯は静かに点いている。','搬送ポッドが接続環を通る。無人のホームにも仕事がある。']}
};
function buildVisit(index,count=0){
 const p=worlds[index],r=rand(visitSeed(index,count)),variant=mod(count,p.conditions.length),condition=p.conditions[variant];
 return {index,count,variant,condition,weather:condition.weather,note:LIFE[p.kind].note[variant],station:p.station,
   traffic:condition.traffic,particles:condition.particles,feature:condition.feature,offset:r()*90,
   started:state.time,platform:'乗り降りしなくても、そのまま旅を続けられます。'};
}
function enterWorld(index,increment=true,prepared=null){
 districtJourney.reset();districtCache.clear();focusPreview=null;
 const v=prepared||buildVisit(index,state.visitCounts[index]);
 state.currentVisit=v;v.started=state.time;
 momentDirectors[index]?.reset(visitSeed(index,v.count)+347,state.travelSeconds??state.dwell);
 if(increment)state.visitCounts[index]++;
 state.stop={phase:state.stationStops?'arrive':'cruise',t:0,held:!!v.holdOnArrival};
 talk.enter(index,increment);
 if(increment)notify('travel.arrive',{world:worlds[index].id});
}
function getStopState(){
 if(state.transition)return{phase:'transit',motion:1,overlay:0,t:0,held:false};
 const s=state.stop;
 if(s.phase==='arrive')return{...s,motion:1-smooth(s.t/6),overlay:1};
 if(s.phase==='stop')return{...s,motion:0,overlay:1};
 if(s.phase==='depart')return{...s,motion:smooth(s.t/8),overlay:1};
 return{...s,motion:1,overlay:0};
}
function advanceStation(dt){
 const s=state.stop;if(engine.timer?.active&&s.phase==='stop')return;s.t+=dt;
 if(gateway.snapshot.state.narrative?.active||gateway.snapshot.state.location.mode==='station'||gateway.blocked){s.held=true;}
 const before=s.phase;
 if(s.phase==='arrive'&&s.t>=6){s.phase='stop';s.t=0;legActive=false;arrivalNotice();}
 else if(s.phase==='stop'&&!s.held&&s.t>=state.stopDuration){s.phase='depart';s.t=0;audio.chime('depart');}
 else if(s.phase==='depart'&&s.t>=8){s.phase='cruise';s.t=0;}
 if(s.phase!==before){if(s.phase==='depart')beginLeg();if(s.phase==='stop'&&!gateway.snapshot.state.location.atStation)notify('station.stop');if(s.phase==='depart')notify('station.depart');}
}
function stationAction(){
 if(engine.timer?.active){if(!engine.timer.view.paused)void engine.timer.toggle();toast('タイマーを一時停止しました。再開は車窓のタイマー操作から。');return;}
 if(!canMove()){toast('列車に戻るか、未確認の保存を解決してください。');return;}
 if(talk.isDirect){toast('会話を閉じてから、発車できます。');return;}
 if(state.transition)return;
 const s=state.stop;
 if(s.phase==='cruise'){const fromDistrict=journeyScenery().to;state.stop={phase:'arrive',t:0,held:true,fromDistrict};toast('次のホームで、少しゆっくり過ごします。');}
 else if(s.phase==='arrive'){s.held=!s.held;toast(s.held?'到着後、この駅に滞在します。':'到着後は、自動で発車します。');}
 else if(s.phase==='stop'){
  if(s.held){s.held=false;s.phase='depart';s.t=0;beginLeg();audio.chime('depart');notify('station.depart');}
  else{s.held=true;toast('列車だけ停車。ホームの日常は、そのまま続きます。');}
 }
 updateUI(true);
}
function revisit(){
 if(!canMove())return;
 if(state.transition)return;
 if(engine.timer?.active)engine.timer.stop();
 talk.close(false);talk.clearAir();
 state.elapsed=0;state.travel=0;enterWorld(state.index);updateWorldUI();updateUI(true);render(0);
 $('route-dialog').close();toast('同じ星へ、もう一度。景色はそのまま、少し違う日常。');
}
function lifeClock(v,time){return Math.max(0,time-v.started)+v.offset;}
function shuttling(t,period){const u=mod(t,period)/period;return{u,f:smooth(u<.5?u*2:(1-u)*2),dir:u<.5?1:-1};}
function scenePositions(s,travel,width,fn){
 const start=-mod(travel*8.5,TILE);
 for(let x=start;x<width+430;x+=TILE){for(const h of [s.heroX,s.heroX+1180]){const px=x+h;if(px>-440&&px<width+440)fn(px);}}
}
function person(c,x,y,t,p,opts={}){
 // A 9 x 25 pixel sprite; foot position is the anchor, not the head.
 const {dir=1,walk=false,carry=false,hat=false,coat=p.trim,action='idle',scale=1}=opts;
 const step=walk?Math.sin(t*7):0,bob=walk?Math.abs(step)*.6:Math.sin(t*.9)*.25;
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(dir*scale,scale);
 c.globalAlpha=.24;ellipse(c,0,1,6,1.7,'#01080d');c.globalAlpha=1;
 line(c,-2,-8,-2-step*2.8,0,'#151d29',3);line(c,2,-8,2+step*2.8,0,'#202838',3);
 rect(c,-4,-17-bob,8,11,coat);rect(c,-3,-18-bob,6,2,coat);rect(c,-2,-23-bob,5,5,'#c9a994');rect(c,-3,-24-bob,7,2,'#27303a');
 if(hat){rect(c,-4,-25-bob,8,4,p.light);rect(c,-5,-22-bob,11,1,p.light);}
 if(action==='read'){line(c,2,-16,6,-12,coat,2);rect(c,4,-15,7,7,'#aec9c9');rect(c,5,-14,4,1,'#476673');}
 else if(action==='drink'){const lift=(Math.sin(t*.65)>.25?4:0);line(c,2,-16,7,-13-lift,coat,2);rect(c,6,-16-lift,3,4,p.light);}
 else if(action==='work'){line(c,3,-16,8,-14+Math.sin(t*2)*2,coat,2);rect(c,8,-14+Math.sin(t*2)*2,2,1,p.light);}
 else if(carry){line(c,-3,-16,7,-12,coat,2);crate(c,4,-16,10,9,p);}
 else{line(c,3,-16,4-step*2,-10,coat,2);line(c,-3,-16,-3+step*2,-10,coat,2);}
 c.restore();
}
function crate(c,x,y,w,h,p){rect(c,x,y,w,h,p.trim);rect(c,x+1,y+1,w-2,h-2,p.mid);rect(c,x+2,y+2,Math.max(1,w-4),1,p.light+'88');line(c,x+w*.5,y+1,x+w*.5,y+h-1,p.trim);rect(c,x+2,y+h-3,3,1,p.accent);}
function steam(c,x,y,t,p,n=5){
 c.save();for(let i=0;i<n;i++){const a=mod(t*.5+i/n,1),dx=Math.sin(t*.8+i*1.7)*3;c.globalAlpha=(1-a)*.2;rect(c,x+dx-a*4,y-a*27,3+a*9,2+a*3,p.light);}c.restore();
}
function cat(c,x,y,t,p){
 rect(c,x-6,y-5,12,5,'#a78d80');rect(c,x+3,y-8,6,6,'#bda698');poly(c,[[x+3,y-7],[x+3,y-11],[x+6,y-8]],'#bda698');poly(c,[[x+6,y-8],[x+9,y-10],[x+9,y-6]],'#bda698');
 if(mod(t,7)<6.6){rect(c,x+5,y-6,1,1,p.accent);rect(c,x+8,y-6,1,1,p.accent);}
 line(c,x-5,y-2,x-10,y-4+Math.sin(t*.7)*2,'#a78d80',2);
}
function robot(c,x,y,t,p,scale=1){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);
 ellipse(c,0,0,9,2,'#07131c');rect(c,-8,-11,16,9,p.trim);rect(c,-5,-15,10,5,p.mid);rect(c,-4,-14,8,3,p.accent);rect(c,-10,-4,3,4,p.near);rect(c,7,-4,3,4,p.near);rect(c,-5,-7,10,2,p.near);
 line(c,-10,-2,-13,-1+Math.sin(t*4)*1,p.trim,1);line(c,10,-2,13,-1-Math.sin(t*4)*1,p.trim,1);c.restore();
}
function drone(c,x,y,t,p,cargo=false){
 const yy=y+Math.sin(t*1.8)*2;c.save();c.translate(Math.round(x),Math.round(yy));
 rect(c,-10,-3,20,7,p.near);rect(c,-6,-5,12,5,p.trim);rect(c,-3,-4,6,2,p.accent);line(c,-17,0,17,0,p.trim,2);rect(c,-19,-2,7,1,p.light);rect(c,12,-2,7,1,p.light);
 if(cargo){line(c,-5,4,-5,11,p.trim);line(c,5,4,5,11,p.trim);crate(c,-7,11,14,10,p);}c.restore();
}
function rotatingFan(c,x,y,r,t,p){
 ellipse(c,x,y,r+2,r+2,p.near);ellipse(c,x,y,r,r,p.trim);ellipse(c,x,y,r-1,r-1,p.mid);
 for(let k=0;k<3;k++){const a=t*.7+k*Math.PI*2/3;line(c,x+Math.cos(a)*2,y+Math.sin(a)*2,x+Math.cos(a+.3)*(r-2),y+Math.sin(a+.3)*(r-2),p.trim,3);}rect(c,x-1,y-1,3,3,p.light);
}

function surface(w,h){const e=document.createElement('canvas');e.width=w;e.height=h;return e;}
function rect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function poly(c,pts,col){c.fillStyle=col;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(Math.round(p[0]),Math.round(p[1])):c.moveTo(Math.round(p[0]),Math.round(p[1])));c.closePath();c.fill();}
function line(c,x1,y1,x2,y2,col,width=1){c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.moveTo(Math.round(x1)+.5,Math.round(y1)+.5);c.lineTo(Math.round(x2)+.5,Math.round(y2)+.5);c.stroke();}
function ellipse(c,x,y,rx,ry,col){c.fillStyle=col;c.beginPath();c.ellipse(x,y,Math.max(0,rx),Math.max(0,ry),0,0,Math.PI*2);c.fill();}
function glow(c,x,y,w,h,col,blur=8){c.save();c.fillStyle=col;c.shadowColor=col;c.shadowBlur=blur;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));c.restore();}
function gradient(c,x,y,w,h,stops){const g=c.createLinearGradient(x,y,x,y+h);stops.forEach((col,i)=>g.addColorStop(i/(stops.length-1),col));c.fillStyle=g;c.fillRect(x,y,w,h);}
const FONT={
 A:['01110','10001','10001','11111','10001','10001','10001'],B:['11110','10001','10001','11110','10001','10001','11110'],C:['01111','10000','10000','10000','10000','10000','01111'],D:['11110','10001','10001','10001','10001','10001','11110'],E:['11111','10000','10000','11110','10000','10000','11111'],F:['11111','10000','10000','11110','10000','10000','10000'],G:['01111','10000','10000','10111','10001','10001','01111'],H:['10001','10001','10001','11111','10001','10001','10001'],I:['111','010','010','010','010','010','111'],J:['00111','00010','00010','00010','10010','10010','01100'],K:['10001','10010','10100','11000','10100','10010','10001'],L:['10000','10000','10000','10000','10000','10000','11111'],M:['10001','11011','10101','10101','10001','10001','10001'],N:['10001','11001','11001','10101','10011','10011','10001'],O:['01110','10001','10001','10001','10001','10001','01110'],P:['11110','10001','10001','11110','10000','10000','10000'],Q:['01110','10001','10001','10001','10101','10010','01101'],R:['11110','10001','10001','11110','10100','10010','10001'],S:['01111','10000','10000','01110','00001','00001','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],U:['10001','10001','10001','10001','10001','10001','01110'],V:['10001','10001','10001','10001','10001','01010','00100'],W:['10001','10001','10001','10101','10101','10101','01010'],X:['10001','10001','01010','00100','01010','10001','10001'],Y:['10001','10001','01010','00100','00100','00100','00100'],Z:['11111','00001','00010','00100','01000','10000','11111'],
 0:['01110','10001','10011','10101','11001','10001','01110'],1:['010','110','010','010','010','010','111'],2:['01110','10001','00001','00010','00100','01000','11111'],3:['11110','00001','00001','01110','00001','00001','11110'],4:['00010','00110','01010','10010','11111','00010','00010'],5:['11111','10000','10000','11110','00001','00001','11110'],6:['01110','10000','10000','11110','10001','10001','01110'],7:['11111','00001','00010','00100','01000','01000','01000'],8:['01110','10001','10001','01110','10001','10001','01110'],9:['01110','10001','10001','01111','00001','00001','01110'],':':['0','1','1','0','1','1','0'],'.':['0','0','0','0','0','1','1'],'-':['000','000','000','111','000','000','000'],'/':['00001','00001','00010','00100','01000','10000','10000'],' ':['000','000','000','000','000','000','000'],'+':['000','010','010','111','010','010','000']};
function pixelWidth(str,s=1){return[...str.toUpperCase()].reduce((a,ch)=>a+((FONT[ch]||FONT[' '])[0].length+1)*s,0)-s;}
function text(c,str,x,y,col,s=1,align='left'){str=str.toUpperCase();if(align==='center')x-=pixelWidth(str,s)/2;if(align==='right')x-=pixelWidth(str,s);x=Math.round(x);y=Math.round(y);c.fillStyle=col;for(const ch of str){const rows=FONT[ch]||FONT[' '];rows.forEach((row,iy)=>{for(let ix=0;ix<row.length;ix++)if(row[ix]==='1')c.fillRect(x+ix*s,y+iy*s,s,s);});x+=(rows[0].length+1)*s;}}
function cjk(c,str,x,y,col,size=13){c.save();c.font=`600 ${size}px "Noto Sans CJK JP","Yu Gothic",sans-serif`;c.textBaseline='top';c.fillStyle=col;c.fillText(str,Math.round(x),Math.round(y));c.restore();}
function windowGrid(c,x,y,w,h,p,r,depth=1,cols=0){
 const dx=depth===0?ir(r,4,7):ir(r,6,10),dy=depth===0?ir(r,5,8):ir(r,8,12),ww=depth===0?ir(r,1,2):ir(r,2,4),wh=depth===0?2:ir(r,3,5);
 for(let yy=y+6;yy<y+h-5;yy+=dy)for(let xx=x+5;xx<x+w-4;xx+=dx){let v=r();if(v>.60)continue;let col=v>.31?p.light:(v>.17?p.accent:p.trim);c.globalAlpha=depth===0?(.25+r()*.43):(.43+r()*.5);rect(c,xx,yy,ww,wh,col);if(depth>0&&v>.42){c.globalAlpha=.13;rect(c,xx-1,yy+wh,ww+2,2,col);}}
 c.globalAlpha=1;
}
function sign(c,x,y,w,h,p,r,vertical=false,label=''){
 rect(c,x-2,y-2,w+4,h+4,'#090e1c');const col=r()>.45?p.accent:p.neon;
 c.save();c.shadowColor=col;c.shadowBlur=8;c.strokeStyle=col;c.lineWidth=1;c.strokeRect(Math.round(x)+.5,Math.round(y)+.5,w,h);c.restore();rect(c,x+2,y+2,w-4,h-4,p.near);rect(c,x+w,y+4,2,h,'#030b15');
 if(vertical){const chars=label||pick(r,['夜行','銀河','旅館','月光','ラーメン','夢見','星海','電脳']);const size=Math.min(13,w-3);for(let i=0;i<chars.length;i++)cjk(c,chars[i],x+(w-size)/2,y+5+i*(size+3),col,size);}
 else{const word=label||pick(r,['LUNA','NOVA','HOTEL','OPEN','ORBIT','RAMEN','24:00','RADIO']);let ss=w>72?2:1;if(pixelWidth(word,ss)>w-6)ss=1;text(c,word,x+w/2,y+(h-7*ss)/2,col,ss,'center');}
 if(r()>.5){c.globalAlpha=.3;rect(c,x+2,y+h+3,w,2,col);c.globalAlpha=1;}
}
function roof(c,x,y,w,p,r,garden=false){
 poly(c,[[x-10,y+8],[x-5,y+6],[x+2,y+6],[x+11,y-3],[x+17,y-6],[x+w-17,y-6],[x+w-9,y+3],[x+w+6,y+7],[x+w+11,y+6],[x+w+8,y+11],[x-9,y+11]],'#071821');
 poly(c,[[x-8,y+7],[x+1,y+6],[x+13,y-5],[x+w-15,y-5],[x+w-4,y+5],[x+w+8,y+8],[x-8,y+8]],p.mid);
 for(let xx=x+10;xx<x+w-5;xx+=4){line(c,xx,y-3,xx-2,y+5,xx%3?p.trim:p.near);}
 line(c,x-7,y+8,x+w+8,y+8,r()>.5?p.neon:p.accent);for(let xx=x+4;xx<x+w-8;xx+=8){c.globalAlpha=.48;rect(c,xx,y+1,2,4,p.accent);}c.globalAlpha=1;line(c,x+14,y-6,x+w-16,y-6,p.trim);rect(c,x-9,y+10,w+18,3,'#080e19');
 if(garden){for(let i=0;i<w/4;i++){let xx=x+r()*w;rect(c,xx,y-8-r()*5,ir(r,2,7),ir(r,2,4),pick(r,['#34756a','#5b9c73','#749f70']));}}
}
function pagoda(c,x,base,w,h,p,r,garden=false){
 let floors=Math.max(2,Math.floor(h/37)),fh=h/floors;const wood=p.kind==='neon'?'#392631':p.mid;rect(c,x,base-h,w,h,p.near);rect(c,x+w-7,base-h,7,h,'#101624');
 for(let f=0;f<floors;f++){let yy=base-h+f*fh;rect(c,x+3,yy+13,w-9,fh-16,wood);for(let xx=x+8;xx<x+w-13;xx+=15){rect(c,xx,yy+17,10,Math.max(9,fh-21),'#080f1e');if(r()>.22){rect(c,xx+1,yy+18,8,Math.max(6,fh-25),r()>.6?p.accent:p.light);rect(c,xx+4,yy+17,1,fh-21,p.near);rect(c,xx,yy+22,10,2,p.near);rect(c,xx,yy+29,10,1,p.near);}else{line(c,xx,yy+19,xx+9,yy+31,p.trim);line(c,xx+9,yy+19,xx,yy+31,p.trim);}}
 roof(c,x-2,yy+3,w+4,p,r,garden);
 rect(c,x-5,yy+fh-3,w+8,3,p.trim);for(let q=x;q<x+w;q+=7)rect(c,q,yy+fh-8,1,5,p.trim);
 if(r()>.44){rect(c,x+w-20,yy+fh-11,12,7,'#65676b');rect(c,x+w-18,yy+fh-10,5,5,'#283039');for(let z=0;z<3;z++)rect(c,x+w-11,yy+fh-10+z*2,3,1,'#33373d');}}
 for(let xx=x+2;xx<x+w;xx+=Math.max(20,w/3))rect(c,xx,base-h+13,3,h-13,p.trim);
 if(r()>.2)sign(c,x+w-4,base-h+20,16,55,p,r,true);
 // Shopfronts below the eaves.
 if(w>62){rect(c,x+9,base-22,w-23,20,'#072025');rect(c,x+12,base-20,w-29,12,p.accent);for(let xx=x+15;xx<x+w-13;xx+=10)rect(c,xx,base-20,2,17,p.mid);sign(c,x+10,base-35,w-24,11,p,r,false,pick(r,['TEA','RAMEN','NOVA','24H']));}
}
function tower(c,x,base,w,h,p,r,depth=1){
 let y=base-h;rect(c,x,y,w,h,p.mid);rect(c,x+w-7,y,7,h,p.near);rect(c,x+1,y,2,h,p.trim+'55');rect(c,x+5,y-5,w-12,5,p.mid);
 if(r()>.3){let rw=ir(r,6,Math.max(6,w/2));rect(c,x+w/2-rw/2,y-ir(r,8,17),rw,15,p.mid);line(c,x+w/2,y-8,x+w/2,y-ir(r,18,34),p.trim);if(r()>.5)rect(c,x+w/2,y-24,2,2,p.neon);}
 windowGrid(c,x,y,w,h,p,r,depth);
 if(depth){
  // Wear and infrastructure are deterministic and cached, not random each frame.
  c.save();c.globalAlpha=.10;for(let n=0;n<h*.14;n++)rect(c,x+ir(r,2,Math.max(3,w-6)),y+ir(r,3,h-4),ir(r,1,6),ir(r,1,3),r()>.5?p.light:p.trim);c.restore();
  if(w>35){for(let n=0;n<2;n++){let ax=x+6+n*14;rect(c,ax,y-8,10,7,p.trim);rect(c,ax+2,y-7,5,4,p.near);rect(c,ax+1,y-2,8,1,p.near);}}
  if(w>43&&r()>.55){const lx=x+w-11;line(c,lx,y+18,lx,base-3,p.trim);line(c,lx+5,y+18,lx+5,base-3,p.trim);for(let yy=y+20;yy<base-3;yy+=5)line(c,lx,yy,lx+5,yy,p.trim);for(let yy=y+36;yy<base-4;yy+=33){rect(c,lx-7,yy,15,3,p.near);rect(c,lx-7,yy-4,15,1,p.trim);}}
  if(h>190&&r()>.58){let col=r()>.5?p.neon:p.accent;for(let yy=y+13;yy<base-12;yy+=12){c.globalAlpha=.65;rect(c,x+2,yy,2,7,col);}c.globalAlpha=1;}
 }
 if(depth){for(let k=0;k<ir(r,1,3);k++){let xx=x+ir(r,3,w-9);rect(c,xx,y+3,1,h-3,p.trim+'44');}for(let yy=y+28;yy<base-5;yy+=ir(r,21,43)){rect(c,x,yy,w,3,p.near);rect(c,x+1,yy,Math.max(0,w-8),1,p.trim+'66');if(r()>.72){rect(c,x+3,yy-7,10,6,'#48505a');rect(c,x+4,yy-6,5,4,p.near);}}
 if(w>30&&h>115&&r()>.55)sign(c,x+w-2,y+ir(r,15,45),ir(r,10,16),ir(r,35,65),p,r,true);
 if(w>45&&r()>.63)sign(c,x+5,y+ir(r,10,Math.min(h-25,80)),w-13,18,p,r);
 }
}
function pipe(c,points,p,width=4){for(let i=1;i<points.length;i++){const[a,b]=[points[i-1],points[i]];line(c,a[0],a[1],b[0],b[1],p.near,width+3);line(c,a[0],a[1],b[0],b[1],p.trim,width);line(c,a[0]-1,a[1]-1,b[0]-1,b[1]-1,'#a5ac9255',1);}}
function dome(c,x,base,w,h,p,r,label){
 rect(c,x,base-h*.66,w,h*.66,p.mid);ellipse(c,x+w/2,base-h*.65,w/2,h*.37,p.trim);ellipse(c,x+w/2,base-h*.64,w/2-3,h*.35,p.mid);gradient(c,x+3,base-h*.65,w-6,h*.65,[p.mid,p.near]);
 c.save();c.strokeStyle=p.accent;c.globalAlpha=.6;c.lineWidth=1;c.beginPath();c.ellipse(x+w/2,base-h*.66,w/2-3,h*.33,0,Math.PI,Math.PI*2);c.stroke();c.beginPath();c.ellipse(x+w/2,base-h*.66,w*.28,h*.33,0,Math.PI,Math.PI*2);c.stroke();c.restore();rect(c,x,base-h*.64,w,3,p.trim);windowGrid(c,x+2,base-h*.6,w-4,h*.6,p,r);for(let xx=x+9;xx<x+w;xx+=13)rect(c,xx,base-h*.58,2,h*.58,p.trim+'55');
 sign(c,x+w*.22,base-h*.5,w*.57,14,p,r,false,label||pick(r,['OCEAN','DOCK','NEREID','PORT 23']));
}
function industry(c,x,base,w,h,p,r){
 rect(c,x,base-h*.68,w,h*.68,p.mid);rect(c,x+w-9,base-h*.68,9,h*.68,p.near);windowGrid(c,x+2,base-h*.6,w-5,h*.6,p,r);
 if(r()>.38){let ch=w*.23;rect(c,x+9,base-h,ch,h*.6,p.near);rect(c,x+10,base-h,ch-3,h*.6,p.trim);for(let yy=base-h+6;yy<base-h*.4;yy+=16){rect(c,x+8,yy,ch+2,3,p.mid);if(r()>.6)rect(c,x+9,yy+3,ch,4,p.neon);}rect(c,x+7,base-h-3,ch+4,4,p.near);}
 const tx=x+w*.58,ty=base-h*.62;ellipse(c,tx,ty,w*.26,h*.17,p.trim);rect(c,tx-w*.26,ty,w*.52,h*.4,p.trim);ellipse(c,tx,ty+h*.4,w*.26,h*.1,p.mid);rect(c,tx-w*.26+3,ty-2,4,h*.4,'#b9a18866');for(let yy=ty;yy<ty+h*.3;yy+=10)rect(c,tx-w*.27,yy,w*.54,2,p.near);pipe(c,[[x-7,base-8],[x-7,base-h*.35],[x+w+8,base-h*.35],[x+w+8,base-3]],p,3);
 line(c,x+w-8,base-h*.7,x+w-8,base-3,p.light);for(let yy=base-h*.7;yy<base-3;yy+=5)rect(c,x+w-12,yy,8,1,p.trim);
 if(w>48)sign(c,x+4,base-h*.55,w*.4,13,p,r,false,pick(r,['03','ORE','FUEL','OX-9']));
}
function spire(c,x,base,w,h,p,r){
 let y=base-h;poly(c,[[x,y+h*.22],[x+w*.28,y+h*.1],[x+w*.5,y-18],[x+w*.72,y+h*.1],[x+w,y+h*.22],[x+w,base],[x,base]],p.mid);poly(c,[[x+w*.5,y-18],[x+w*.72,y+h*.1],[x+w,y+h*.22],[x+w,base],[x+w*.64,base]],p.near);line(c,x+w*.5,y-18,x+w*.5,base,p.trim);line(c,x+2,y+h*.24,x+2,base,p.trim);
 for(let xx=x+7;xx<x+w-5;xx+=7){let ys=y+h*.23+Math.abs(xx-x-w/2)*.8;rect(c,xx,ys,2,base-ys-9,r()>.4?p.light:p.accent);for(let yy=ys;yy<base;yy+=15)rect(c,xx,yy,2,7,p.mid);}
 for(let yy=y+h*.35;yy<base;yy+=h*.22){rect(c,x-4,yy,w+8,4,p.trim);rect(c,x-1,yy+4,w+2,2,p.near);}rect(c,x+w/2-1,y-19,2,4,p.light);
}
function gardenTree(c,x,y,size,r,p,pink=false){
 const dark=pink?'#653f60':'#153d3b',middle=pink?'#af6687':'#34705b',light=pink?'#e79bb0':'#739b74';
 line(c,x,y,x-2,y-size*.63,'#514954',Math.max(2,size/11));line(c,x,y-size*.3,x-size*.22,y-size*.65,'#514954',2);line(c,x,y-size*.25,x+size*.2,y-size*.59,'#514954',2);
 for(let i=0;i<28;i++){let a=r()*Math.PI*2,d=Math.sqrt(r())*size*.43,xx=x+Math.cos(a)*d,yy=y-size*.67+Math.sin(a)*d*.5;rect(c,xx,yy,ir(r,6,Math.max(7,size/3)),ir(r,3,Math.max(4,size/6)),i<10?dark:i<21?middle:light);}
}
function moon(c,x,y,r,p,rng,ring=false){
 c.save();c.globalAlpha=p.kind==='neon'?.55:.92;
 // Pixel-stepped, banded planet. Horizontal spans avoid antialiased edges.
 for(let yy=-r;yy<=r;yy++){const len=Math.floor(Math.sqrt(r*r-yy*yy));const shade=(yy+r)/(2*r);rect(c,x-len,y+yy,len*2,1,p.planet);c.globalAlpha=(p.kind==='neon'?.5:.78)*(0.17+shade*.33);rect(c,x-len,y+yy,len*2,1,p.sky[0]);c.globalAlpha=p.kind==='neon'?.5:.92;}
 c.save();c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.clip();for(let i=0;i<14;i++){let yy=y-r+rng()*2*r;c.globalAlpha=.07+rng()*.13;rect(c,x-r,yy,2*r,ir(rng,1,5),rng()>.5?p.accent:p.sky[0]);}c.globalAlpha=.68;ellipse(c,x+r*.56,y-r*.13,r*.83,r*1.02,p.sky[0]);c.restore();
 c.globalAlpha=.6;line(c,x-r*.57,y-r*.8,x-r*.31,y-r*.94,p.light);c.restore();
 if(ring){c.save();c.translate(x,y);c.rotate(-.26);for(let i=0;i<6;i++){c.strokeStyle=i%2?p.light:p.accent;c.globalAlpha=i%2?.23:.15;c.lineWidth=i%2?1:2;c.beginPath();c.ellipse(0,0,r*1.9+i*2,r*.3+i,0,0,Math.PI*2);c.stroke();}c.restore();}
}
function drawSky(p,width){
 const e=surface(width,HEIGHT),c=e.getContext('2d'),r=rand(p.seed+41);gradient(c,0,0,width,HEIGHT,p.sky);
 // Wide, low-contrast nebula clouds baked only once.
 c.save();for(let i=0;i<9;i++){let x=r()*width,y=r()*HEIGHT*.75;const g=c.createRadialGradient(x,y,0,x,y,120+r()*100);g.addColorStop(0,p.haze+'16');g.addColorStop(1,p.haze+'00');c.fillStyle=g;c.fillRect(0,0,width,HEIGHT);}c.restore();
 for(let i=0;i<width*.3;i++){const x=ir(r,0,width),y=ir(r,6,280),alpha=(1-y/350)*(.15+r()*.6);c.globalAlpha=alpha;rect(c,x,y,1,1,p.light);if(r()>.975){rect(c,x-2,y,5,1,p.accent);rect(c,x,y-2,1,5,p.accent);}}c.globalAlpha=1;
 if(p.kind==='neon'){moon(c,width*.76,92,50,p,r,false);c.save();c.globalAlpha=.23;c.strokeStyle=p.accent;c.lineWidth=1;c.beginPath();c.ellipse(width*.76,80,width*.40,55,-.20,0,Math.PI*2);c.stroke();c.restore();}
 if(p.kind==='water'){moon(c,width*.73,97,80,p,r,true);for(let yy=310;yy<HEIGHT;yy+=3){c.globalAlpha=.1+(yy-310)/1300;let rr=rand(yy+37);for(let i=0;i<28;i++)rect(c,rr()*width,yy,4+rr()*29,1,rr()>.4?p.accent:p.light);}c.globalAlpha=1;}
 if(p.kind==='desert'||p.kind==='rock'){moon(c,width*.72,98,71,p,r,false);for(let i=0;i<3;i++){const pts=[[0,HEIGHT]];for(let x=-20;x<width+40;x+=20)pts.push([x,271+i*31+Math.sin(x/(95-i*15)+i)*18+Math.cos(x/170)*13]);pts.push([width,HEIGHT]);poly(c,pts,[p.kind==='rock'?'#56454b':'#84424b',p.kind==='rock'?'#735448':'#965148',p.kind==='rock'?'#423841':'#77464a'][i]);}}
 if(p.kind==='garden'){moon(c,width*.72,84,57,p,r,false);moon(c,width*.24,63,12,{...p,planet:'#c9dad0'},r,false);c.save();c.globalAlpha=.10;for(let i=0;i<4;i++){c.strokeStyle=p.accent;c.lineWidth=5-i;c.beginPath();c.moveTo(-10,109+i*9);c.bezierCurveTo(width*.3,50+i*10,width*.55,149+i*10,width+20,81+i*6);c.stroke();}c.restore();}
 if(p.kind==='ivory'){
  moon(c,width*.76,91,54,p,r,false);
  c.save();c.translate(width*.55,208);c.rotate(-.37);for(let k=0;k<9;k++){c.strokeStyle=k<4?p.light:p.trim;c.globalAlpha=k<4?.5:.35;c.lineWidth=1;c.beginPath();c.ellipse(0,0,width*.53+k,148+k*.7,0,0,Math.PI*2);c.stroke();}for(let k=0;k<44;k++){let a=k/44*Math.PI*2;const x=Math.cos(a)*(width*.53+4),y=Math.sin(a)*151;c.globalAlpha=.7;rect(c,x,y,4,2,p.light);}c.restore();
 }
 if(p.kind==='scrap'){moon(c,width*.78,94,45,p,r,true);c.save();c.globalAlpha=.42;for(let i=0;i<34;i++){let x=r()*width,y=r()*230,s=ir(r,5,26);poly(c,[[x-s,y],[x-s*.4,y-s*.7],[x+s*.6,y-s*.5],[x+s,y],[x+s*.3,y+s*.6],[x-s*.6,y+s*.5]],i%3?p.planet:p.trim);rect(c,x-s*.5,y-s*.4,s,1,p.trim);}c.restore();c.save();c.strokeStyle=p.accent;c.globalAlpha=.13;c.beginPath();c.moveTo(-10,146);c.bezierCurveTo(width*.25,90,width*.65,200,width+30,132);c.stroke();c.restore();}
 if(p.kind==='void'){moon(c,width*.80,105,37,p,r,true);c.save();c.globalAlpha=.4;for(let i=0;i<22;i++){let x=r()*width,y=r()*320,s=ir(r,2,17);poly(c,[[x-s,y],[x-s*.4,y-s*.7],[x+s*.6,y-s*.5],[x+s,y],[x+s*.3,y+s*.6],[x-s*.6,y+s*.5]],p.planet);rect(c,x-s*.5,y-s*.4,s,1,p.trim);}c.restore();}
 // Still dither instead of animated noise or an expensive per-frame pixel read.
 c.globalAlpha=.055;for(let i=0;i<width*HEIGHT*.08;i++)rect(c,ir(r,0,width),ir(r,0,HEIGHT),1,1,r()>.5?'#e7c9cb':'#000814');c.globalAlpha=1;return e;
}
function heroNeon(c,x,p,r){
 const y=57,w=72,h=208;
 rect(c,x-9,y+7,w+17,260,p.near);rect(c,x-5,y+3,w+6,256,'#4a263e');rect(c,x+3,y-13,w-8,20,'#391d34');rect(c,x+11,y-23,w-24,13,'#251b2c');line(c,x+w*.58,y-23,x+w*.58,y-47,p.trim);rect(c,x+w*.58,y-48,2,2,p.neon);
 glow(c,x,y,w,h,p.neon,14);gradient(c,x+3,y+3,w-6,h-6,['#fc3c78','#c82463','#902145']);for(let yy=y+5;yy<y+h;yy+=3)rect(c,x+2,yy,w-4,1,'#611a4355');
 // An original, pixel-built astronaut advertisement.
 ellipse(c,x+37,y+54,14,15,'#24132d');rect(c,x+20,y+55,31,8,'#24132d');rect(c,x+33,y+50,17,3,'#f1aac58a');
 poly(c,[[x+29,y+68],[x+47,y+68],[x+51,y+110],[x+21,y+113]],'#24132d');poly(c,[[x+27,y+73],[x+18,y+79],[x+9,y+63],[x+4,y+65],[x+12,y+88],[x+26,y+86]],'#24132d');poly(c,[[x+45,y+73],[x+54,y+82],[x+61,y+78],[x+64,y+83],[x+53,y+94],[x+46,y+89]],'#24132d');
 poly(c,[[x+24,y+109],[x+36,y+109],[x+29,y+148],[x+24,y+168],[x+13,y+168],[x+15,y+160]],'#24132d');poly(c,[[x+38,y+107],[x+50,y+108],[x+48,y+138],[x+57,y+158],[x+55,y+166],[x+45,y+165],[x+35,y+139]],'#24132d');
 glow(c,x+7,y+47,2,9,p.light,7);glow(c,x+3,y+51,10,1,p.light,5);
 text(c,'MOON',x+w/2,y+17,'#ffe6df',2,'center');text(c,'DUST',x+w/2,y+181,'#ffe6df',2,'center');
 rect(c,x-5,y+h+4,w+12,6,p.near);for(let yy=y+8;yy<y+h-10;yy+=20){rect(c,x+w+7,yy,4,9,p.light);}
 sign(c,x-20,y+113,15,60,p,r,true,'月光');
 rect(c,x-3,y+h+13,w+5,41,'#201c2c');for(let xx=x+3;xx<x+w-4;xx+=11){rect(c,xx,y+h+17,7,14,p.light);rect(c,xx,y+h+22,7,2,p.near);rect(c,xx+3,y+h+16,1,17,p.near);}sign(c,x+5,y+h+35,w-8,15,p,r,false,'AIR / 07');
 for(let yy=y+9;yy<y+h;yy+=16){rect(c,x-7,yy,2,2,p.light);}

}
function heroWater(c,x,p,r){
 const y=152;rect(c,x+42,y+44,20,163,p.near);pipe(c,[[x+46,y+67],[x+21,y+67],[x+21,y+130],[x+3,y+130]],p,4);
 ellipse(c,x+53,y+31,67,61,'#112a3b');ellipse(c,x+53,y+28,63,57,'#317785');ellipse(c,x+53,y+27,58,52,'#123f59');
 c.save();c.globalAlpha=.16;ellipse(c,x+42,y+10,44,34,p.accent);c.restore();for(let q=0;q<5;q++){c.save();c.strokeStyle=p.accent;c.globalAlpha=.27;c.lineWidth=1;c.beginPath();c.ellipse(x+53,y+28,16+q*10,54,0,0,Math.PI*2);c.stroke();c.restore();}rect(c,x-7,y+26,121,2,p.trim);rect(c,x-3,y+1,113,1,p.trim);rect(c,x+7,y+53,92,1,p.trim);
 for(let i=0;i<14;i++){let xx=x+ir(r,10,90),yy=y+ir(r,23,57);rect(c,xx,yy,ir(r,3,8),ir(r,2,5),r()>.5?p.accent:p.light);}sign(c,x+4,y+96,96,22,p,r,false,'NEREID');text(c,'DOCK 23',x+53,y+126,p.light,1,'center');
 // Tall gantry crane.
 line(c,x+141,112,x+141,314,p.trim,5);line(c,x+136,112,x+136,314,p.near,3);line(c,x+100,123,x+239,123,p.trim,4);line(c,x+140,104,x+213,122,p.accent,1);line(c,x+211,124,x+211,193,p.trim);rect(c,x+207,191,9,7,p.near);for(let yy=133;yy<295;yy+=15){line(c,x+133,yy,x+144,yy+10,p.trim);}glow(c,x+139,103,3,2,p.neon);
}
function heroDesert(c,x,p,r){
 industry(c,x,352,108,220,p,r);const tx=x+117;rect(c,tx,127,29,225,p.mid);rect(c,tx+5,113,19,16,p.trim);for(let yy=137;yy<342;yy+=22){rect(c,tx-5,yy,39,5,p.trim);for(let xx=tx;xx<tx+29;xx+=6)rect(c,xx,yy+3,2,7,p.near);}poly(c,[[tx,127],[tx+6,100],[tx+22,100],[tx+29,127]],p.near);rect(c,tx+4,97,21,4,p.neon);pipe(c,[[x+20,230],[x-21,230],[x-21,306],[tx+45,306],[tx+45,257]],p,6);sign(c,x-14,245,17,58,p,r,true,'赤砂');
 const bx=x+24,by=164;ellipse(c,bx,by,36,36,p.near);ellipse(c,bx,by,32,32,p.trim);ellipse(c,bx,by,27,27,'#302531');ellipse(c,bx,by,23,23,p.neon);ellipse(c,bx,by,17,17,'#352532');for(let i=0;i<8;i++){const a=i*Math.PI/4;line(c,bx+Math.cos(a)*7,by+Math.sin(a)*7,bx+Math.cos(a)*22,by+Math.sin(a)*22,p.light,2);}text(c,'SOL-41',bx,by+47,p.light,1,'center');
}
function heroGarden(c,x,p,r){
 // Terraces carry the trees, rather than a simple recolour of the neon city.
 for(let i=0;i<4;i++){let xx=x+i*9,yy=154+i*49,ww=121-i*7;rect(c,xx,yy,ww,44,p.mid);windowGrid(c,xx+5,yy+5,ww-10,35,p,r);rect(c,xx-10,yy-3,ww+20,6,p.trim);rect(c,xx-8,yy-2,ww+16,3,'#548369');for(let j=0;j<3;j++)gardenTree(c,xx+12+j*41,yy-5,ir(r,26,48),r,p,j%2===0);for(let j=0;j<14;j++){let vx=xx+r()*ww;rect(c,vx,yy+4,2,ir(r,7,22),'#41755b');rect(c,vx-2,yy+11,5,3,'#659971');}}
 sign(c,x+95,214,18,56,p,r,true,'庭園');line(c,x+7,148,x+112,148,p.light);text(c,'EDEN',x+55,333,p.light,1,'center');
}
function heroIvory(c,x,p,r){
 spire(c,x+12,362,78,258,p,r);spire(c,x+99,365,45,199,p,r);spire(c,x-37,365,34,176,p,r);const y=234;poly(c,[[x-49,y],[x+158,y],[x+149,y+12],[x-38,y+12]],p.trim);rect(c,x-34,y+12,183,5,p.mid);glow(c,x-35,y+2,186,2,p.light,8);
 c.save();c.strokeStyle=p.light;c.lineWidth=3;c.beginPath();c.arc(x+51,174,55,Math.PI*1.05,Math.PI*1.95);c.stroke();c.restore();line(c,x+51,72,x+51,92,p.light);text(c,'ASTERION',x+54,279,p.light,1,'center');
}
function heroScrap(c,x,p,r){
 const y=174;poly(c,[[x-40,y+38],[x+18,y-8],[x+142,y+9],[x+178,y+82],[x+121,y+129],[x-23,y+122]],p.mid);poly(c,[[x+12,y+2],[x+133,y+18],[x+161,y+73],[x+116,y+112],[x+3,y+105]],p.near);
 for(let i=0;i<7;i++){let xx=x+8+i*21;line(c,xx,y+5,xx-17,y+102,p.trim,2);}for(let i=0;i<4;i++){let yy=y+28+i*20;line(c,x-8,yy,x+147,yy,p.trim,2);}rect(c,x+24,y+42,57,34,'#101925');windowGrid(c,x+26,y+44,53,30,p,r,1,0);sign(c,x+87,y+44,54,16,p,r,false,'SCRAP');
 line(c,x+170,107,x+170,310,p.trim,5);line(c,x+110,120,x+201,120,p.trim,4);line(c,x+170,122,x+170,219,p.trim,2);rect(c,x+165,217,10,8,p.near);line(c,x+128,127,x+167,127,p.accent,1);sign(c,x-12,y+58,18,62,p,r,true,'回収');
 rect(c,x-28,y+129,214,6,p.trim);rect(c,x-26,y+135,210,4,p.near);
}
function heroRock(c,x,p,r){
 poly(c,[[x-55,366],[x-16,279],[x+32,233],[x+80,282],[x+143,196],[x+191,213],[x+205,366]],p.mid);poly(c,[[x-10,366],[x+37,258],[x+91,298],[x+151,224],[x+190,249],[x+205,366]],p.near);
 rect(c,x+16,276,44,70,'#1b222d');windowGrid(c,x+18,282,40,61,p,r);rect(c,x+112,229,38,83,'#161e2a');windowGrid(c,x+114,235,34,72,p,r);sign(c,x+8,312,48,14,p,r,false,'RIDGE');sign(c,x+104,287,17,59,p,r,true,'鉱区');
 line(c,x+24,244,x+153,208,p.trim,2);line(c,x+46,233,x+177,198,p.trim,1);for(let i=0;i<4;i++){let gx=x+38+i*26,gy=239-i*7;rect(c,gx,gy,8,6,p.near);glow(c,gx+7,gy+2,2,2,p.light,5);}line(c,x+178,140,x+178,208,p.trim,3);rect(c,x+174,140,8,9,p.near);glow(c,x+176,141,4,2,p.neon,4);
}
function heroVoid(c,x,p,r){
 rect(c,x+17,224,49,154,p.mid);rect(c,x+24,222,6,150,p.trim);rect(c,x+48,210,6,162,p.trim);for(let yy=235;yy<365;yy+=14){rect(c,x+30,yy,18,2,p.accent);rect(c,x+18,yy+5,8,3,p.neon);}pipe(c,[[x-30,365],[x-30,280],[x+85,280],[x+85,339]],p,5);sign(c,x-21,303,19,65,p,r,true,'深宇宙');rect(c,x-19,248,122,8,p.trim);rect(c,x-23,252,130,3,p.neon);text(c,'RELAY / 88',x+43,275,p.light,1,'center');
}
function createLayer(p,depth,width){
 if(['scrap','water','rock'].includes(p.kind))return specializedLayer(p,depth,width);
 const e=surface(TILE,HEIGHT),c=e.getContext('2d'),r=rand(p.seed+depth*177);c.imageSmoothingEnabled=false;
 if(depth===0){
  if(p.kind==='neon'){
   const pp={...p,mid:'#221b31',near:'#1d192b',trim:'#39293c'};
   for(let k=0;k<5;k++){const xx=[-18,width*.07,width*.55,width*.92,1640][k];tower(c,xx,416,ir(r,35,68),ir(r,345,470),pp,r,0);}
  }
  for(let x=0;x<TILE;){const w=ir(r,12,42),h=ir(r,48,p.kind==='neon'?282:190),base=p.kind==='water'?336:400;const pp={...p,mid:p.far,near:p.far,trim:p.far};tower(c,x,base,w,h,pp,r,0);x+=w+ir(r,p.kind==='void'?40:2,p.kind==='void'?100:13);}
  const haze=c.createLinearGradient(0,170,0,450);haze.addColorStop(0,p.haze+'00');haze.addColorStop(1,p.haze+'40');c.fillStyle=haze;c.fillRect(0,170,TILE,280);return e;
 }
 if(depth===1){
  let x=-4;
  while(x<TILE){const w=ir(r,26,68),h=ir(r,85,p.kind==='neon'?321:237),base=405+ir(r,-8,15);
   if(p.kind==='ivory')spire(c,x,base,w,h,p,r);
   else if(p.kind==='desert'||p.kind==='rock')industry(c,x,base,w,h*.83,p,r);
   else if(p.kind==='water'){if(r()>.55)dome(c,x,base,w,h*.65,p,r);else tower(c,x,base,w,h*.85,p,r);}
   else if(p.kind==='garden'){tower(c,x,base,w,h*.85,p,r);if(r()>.25)gardenTree(c,x+w*.5,base-h*.85,30,r,p);}
   else tower(c,x,base,w,h,p,r);
   x+=w+ir(r,p.kind==='void'?40:12,p.kind==='void'?115:63);
  }
  // One carefully composed landmark in every strip, plus a second far away.
  const heroX=width<420?Math.max(65,width*.31):width*.27;
  const heroes={neon:heroNeon,scrap:heroScrap,water:heroWater,rock:heroRock,garden:heroGarden,ivory:heroIvory,void:heroVoid,desert:heroDesert};
  heroes[p.kind](c,heroX,p,r);heroes[p.kind](c,heroX+1180,p,r);
  c.globalAlpha=.05;rect(c,0,0,TILE,HEIGHT,p.haze);c.globalAlpha=1;return e;
 }
 if(depth===2){
  for(let x=-47;x<TILE;){let w=ir(r,63,120),h=ir(r,50,148),base=459;
   const pp={...p,mid:p.near,near:'#0c1622',trim:p.trim};
   if(p.kind==='neon'||p.kind==='garden')pagoda(c,x,base,w,h,pp,r,p.kind==='garden');
   else if(p.kind==='water')dome(c,x,base,w,h*.8,pp,r);
   else if(p.kind==='desert'||p.kind==='rock')industry(c,x,base,w,h,pp,r);
   else if(p.kind==='ivory')spire(c,x,base,w,h,pp,r);
   else {tower(c,x,base,w,h,pp,r);ellipse(c,x+w*.5,base-h-6,w*.28,8,p.trim);line(c,x+w*.5,base-h-6,x+w*.5+10,base-h-24,p.accent);}
   if(p.kind==='garden'){gardenTree(c,x+w*.25,base-h-4,46,r,p,true);for(let k=0;k<10;k++){let vx=x+r()*w,vy=base-h+12;rect(c,vx,vy,2,ir(r,10,50),'#396658');}}
   x+=w+ir(r,46,139);
  }
  if(p.kind==='neon'){
   const pp={...p,mid:'#291f2b',near:'#101b23',trim:'#5a4952'};
   pagoda(c,-61,462,157,233,pp,r);pagoda(c,width+46,460,145,208,pp,r);
   pagoda(c,1100,465,161,211,pp,r);
   // Water tanks, aerials and a few plants break up the roof line.
   for(const xx of [11,width+94,1168]){
    rect(c,xx,209,20,20,'#272d35');ellipse(c,xx+10,209,10,3,'#565359');rect(c,xx+2,211,3,17,'#635455');rect(c,xx-2,220,24,2,'#161b27');line(c,xx-4,230,xx-4,250,p.trim,2);line(c,xx+22,230,xx+22,250,p.trim,2);line(c,xx+28,234,xx+28,202,p.trim);line(c,xx+19,206,xx+38,206,p.trim);line(c,xx+22,211,xx+35,211,p.trim);
   }
   // Sidewalk lanterns and a cyan pharmacy sign.
   sign(c,69,304,18,73,p,r,true,'夜の市');
   for(let i=0;i<4;i++){let lx=14+i*18;line(c,lx,369,lx,377,p.trim);ellipse(c,lx,383,4,6,p.neon);rect(c,lx-2,378,1,9,p.light);rect(c,lx-3,387,6,2,p.near);}
   gardenTree(c,-12,249,64,r,{...p,kind:'garden'});gardenTree(c,width+147,270,75,r,{...p,kind:'garden'});
  }
  // Hanging wires, rare rather than a moving picket fence.
  for(let k=0;k<4;k++){let xx=185+k*545,yy=296+ir(r,-25,40);c.strokeStyle='#0c1523';c.lineWidth=1;c.beginPath();c.moveTo(xx,yy);c.quadraticCurveTo(xx+125,yy+52,xx+246,yy-10);c.stroke();c.beginPath();c.moveTo(xx,yy+4);c.quadraticCurveTo(xx+125,yy+58,xx+246,yy-6);c.stroke();}
  return e;
 }
 return e;
}
function makeScene(index,width){
 const p=worlds[index],r=rand(p.seed+149);
 const s={p,index,width,heroX:width<420?Math.max(65,width*.31):width*.27,sky:drawSky(p,width),layers:[],traffic:[],particles:[],beacons:[],station:null};
 for(let d=0;d<3;d++)s.layers.push(createLayer(p,d,width));
 for(let i=0;i<12;i++)s.traffic.push({x:r()*2000,y:105+r()*190,speed:(10+r()*19)*(i%2?1:-1),size:r()>.65?1.1:.65,phase:r()*50});
 for(let i=0;i<180;i++)s.particles.push({x:r()*1500,y:r()*HEIGHT,z:.3+r()*.8,phase:r()*Math.PI*2});
 return s;
}
function getScene(index){const key=index+':'+W;let s=cache.get(key);if(!s){s=makeScene(index,W);cache.set(key,s);}return s;}
function drawStrip(c,e,offset,width){const x=-mod(Math.floor(offset),TILE);for(let q=x;q<width;q+=TILE)c.drawImage(e,q,0);}
function drawHovercraft(c,x,y,s,p,direction,time){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(s*(direction<0?-1:1),s);rect(c,-9,0,20,3,p.near);poly(c,[[-14,3],[-9,-1],[0,-4],[8,-3],[16,3]],'#131e2e');rect(c,-2,-3,8,2,p.accent);rect(c,-12,3,30,2,p.trim);glow(c,14,1,3,1,p.light,5);glow(c,-14,3,3,2,p.neon,5);c.globalAlpha=.23;rect(c,-27,4,13,1,p.neon);c.restore();
}
function drawTrain(c,x,y,p,time,scale=1){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);
 for(let k=0;k<4;k++){let xx=k*76;rect(c,xx,0,71,22,'#102330');rect(c,xx+3,-2,64,3,p.trim);rect(c,xx,20,71,4,p.near);rect(c,xx,17,71,2,p.neon);for(let j=0;j<4;j++){let wx=xx+6+j*15;rect(c,wx,4,12,9,p.accent);rect(c,wx+1,4,3,7,'#d2ffed');poly(c,[[wx+5,4],[wx+10,4],[wx+2,11],[wx,11]],'#e0fff580');}rect(c,xx+67,1,3,18,p.trim);rect(c,xx+71,9,5,11,'#081321');rect(c,xx+8,24,8,3,p.near);rect(c,xx+52,24,8,3,p.near);}
 glow(c,-2,14,3,2,p.light,8);c.restore();
}
function drawElevatedRail(c,s,time,travel,width){
 const p=s.p,y=387;
 c.save();c.globalAlpha=.74;rect(c,0,y+23,width,5,p.near);rect(c,0,y+25,width,1,p.trim);rect(c,0,y+33,width,3,p.near);
 let of=mod(travel*15,156);for(let x=-of;x<width;x+=156){rect(c,x,y+35,9,HEIGHT-y,p.near);line(c,x+9,y+37,x+42,y+55,p.near,4);rect(c,x-2,y+33,13,3,p.trim);}c.restore();
 const tx=mod(220+time*26-travel*6,width+520)-365;drawTrain(c,tx,y-1,p,time,.83);
}
function drawRelayRing(c,x,y,r,p,t){
 c.save();c.translate(Math.round(x),Math.round(y));c.strokeStyle=p.trim;c.lineWidth=7;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.stroke();c.lineWidth=2;c.strokeStyle=p.neon;c.shadowBlur=10;c.shadowColor=p.neon;c.beginPath();c.arc(0,0,r-4,0,Math.PI*2);c.stroke();c.shadowBlur=0;c.lineWidth=1;c.strokeStyle=p.accent;c.beginPath();c.arc(0,0,r+6,0,Math.PI*2);c.stroke();
 for(let i=0;i<12;i++){const a=i*Math.PI/6+t*.023;const xx=Math.cos(a)*r,yy=Math.sin(a)*r;c.save();c.translate(xx,yy);c.rotate(a);rect(c,-8,-4,16,8,p.near);rect(c,-5,-3,6,6,p.light);c.restore();}c.globalAlpha=.25;line(c,-r*.7,0,r*.7,0,p.neon);line(c,0,-r*.7,0,r*.7,p.neon);ellipse(c,0,0,8,8,p.accent);c.restore();
}
function drawRay(c,x,y,scale,t,p){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);c.globalAlpha=.36;const wing=Math.sin(t*.7)*5;poly(c,[[-39,wing-9],[-23,4],[-7,8],[0,0],[7,8],[23,4],[39,wing-9],[22,15],[8,15],[0,9],[-8,15],[-22,15]],p.accent);line(c,0,8,4,32,p.accent);line(c,4,32,1,42,p.accent);c.globalAlpha=.8;rect(c,-3,3,2,1,p.light);rect(c,3,3,2,1,p.light);c.restore();
}
// Landforms are cached by world seed. The visit only changes ambient activity.
function boulder(c,x,base,w,h,p,r,detail=true){
 const pts=[[x,base],[x+w*.07,base-h*.62],[x+w*.22,base-h*.86],[x+w*.45,base-h],[x+w*.69,base-h*.95],[x+w*.92,base-h*.45],[x+w,base]];
 poly(c,pts,p.mid);poly(c,[[x+w*.45,base-h],[x+w*.69,base-h*.95],[x+w*.92,base-h*.45],[x+w,base],[x+w*.53,base],[x+w*.61,base-h*.48]],p.near);
 line(c,x+w*.22,base-h*.86,x+w*.45,base-h,p.trim,1);
 if(detail){c.save();c.beginPath();pts.forEach((a,i)=>i?c.lineTo(...a):c.moveTo(...a));c.closePath();c.clip();
 for(let j=0;j<16;j++){const yy=base-h+j*h/16;line(c,x,yy,x+w,yy+Math.sin(j*1.3)*9,p.trim+'66');}
 for(let j=0;j<60;j++)rect(c,x+r()*w,base-r()*h,1+r()*9,1+r()*2,r()>.6?p.trim+'55':p.near+'66');
 c.restore();}
}
function wreck(c,x,y,w,h,p,r,inhabited=false){
 poly(c,[[x,y+h*.3],[x+w*.17,y],[x+w*.82,y+7],[x+w,y+h*.56],[x+w*.87,y+h],[x+w*.14,y+h*.92]],p.mid);
 poly(c,[[x+w*.14,y+h*.54],[x+w*.9,y+h*.58],[x+w*.87,y+h],[x+w*.14,y+h*.92]],p.near);
 for(let k=0;k<8;k++){let xx=x+w*.16+k*w*.085;line(c,xx,y+5,xx-12,y+h*.92,p.trim,2);}
 line(c,x+w*.18,y+2,x+w*.8,y+8,p.trim,2);
 ellipse(c,x+w*.82,y+h*.48,h*.28,h*.28,p.near);ellipse(c,x+w*.82,y+h*.48,h*.20,h*.20,p.trim);ellipse(c,x+w*.82,y+h*.48,h*.14,h*.14,p.near);
 for(let k=0;k<9;k++)rect(c,x+r()*w,y+r()*h,ir(r,2,14),2,p.trim+'55');
 if(inhabited){
  c.save();c.beginPath();c.moveTo(x+w*.18,y+9);c.lineTo(x+w*.76,y+12);c.lineTo(x+w*.69,y+h*.87);c.lineTo(x+w*.12,y+h*.87);c.closePath();c.clip();
  for(let j=0;j<80;j++){let px=x+w*.14+r()*w*.61,py=y+7+r()*h*.78;rect(c,px,py,3+r()*13,1+r()*3,r()>.5?'#88736744':'#a3b6bc22');}
  for(let j=0;j<12;j++){let px=x+w*.18+j*w*.043;rect(c,px,y+12,2,2,p.trim);rect(c,px-10,y+h*.83,2,2,p.trim);}
  c.restore();
  for(let k=0;k<4;k++){const xx=x+w*.2+k*25;rect(c,xx,y+h*.36,16,17,'#080f19');rect(c,xx+2,y+h*.36+2,12,12,k%2?p.light:p.accent);rect(c,xx+7,y+h*.36,2,17,p.mid);}
  rect(c,x+w*.14,y+h*.73,w*.52,7,p.trim);sign(c,x+w*.2,y+h*.73-17,76,15,p,r,false,'HULL CAFE');
  for(let k=0;k<3;k++)crate(c,x+w*.17+k*18,y+h-13,14,12,p);
 }
}
function specializedLayer(p,depth,width){
 const e=surface(TILE,HEIGHT),c=e.getContext('2d'),r=rand(p.seed+depth*177),hx=width<420?Math.max(65,width*.31):width*.27;
 if(p.kind==='scrap'){
  if(depth===0){
   const pp={...p,mid:p.far,near:'#242631',trim:'#53505a'};
   for(let x=-100;x<TILE;x+=310){wreck(c,x,238+r()*39,280+r()*90,78+r()*70,pp,r);line(c,x+160,214,x+160,355,pp.trim,3);line(c,x+130,231,x+240,231,pp.trim,2);}
  }else if(depth===1){
   for(let x=-190;x<TILE;x+=470){wreck(c,x,302+ir(r,-12,5),235,79,p,r,true);for(let k=0;k<5;k++)crate(c,x+25+k*28,398-18-(k%2)*14,26,17,p);}
   for(const h of [hx,hx+1180]){
    wreck(c,h-78,201,309,153,p,r,true);rect(c,h-82,354,325,6,p.trim);rect(c,h-82,360,325,2,p.near);
    // Broken arc of an old engine behind the salvagers' walkway.
    c.strokeStyle=p.trim;c.lineWidth=5;c.beginPath();c.arc(h+80,245,78,Math.PI*1.13,Math.PI*1.87);c.stroke();
    line(c,h+226,144,h+226,354,p.trim,5);line(c,h+145,161,h+300,161,p.trim,4);line(c,h+225,146,h+289,161,p.accent,1);
    for(let yy=174;yy<350;yy+=17)line(c,h+221,yy,h+230,yy+12,p.trim);
    sign(c,h-74,268,16,62,p,r,true,'船底食堂');
   }
  }else{
   for(let x=-80;x<TILE;x+=360){poly(c,[[x,450],[x+20,416],[x+56,433],[x+80,385],[x+105,392],[x+128,421],[x+186,429],[x+222,450]],p.near);wreck(c,x+5,418,80,38,{...p,mid:p.near,near:'#0a1520'},r);line(c,x+12,417,x+64,436,p.trim+'88');}
   rect(c,0,438,TILE,4,p.near);line(c,0,438,TILE,438,p.trim);
  }
 }else if(p.kind==='water'){
  if(depth===0){
   for(let x=70;x<TILE;x+=520){rect(c,x-15,281,200,6,p.far);for(let k=0;k<5;k++){const xx=x+k*32,hh=18+r()*22;rect(c,xx,282-hh,27,hh,'#164653');ellipse(c,xx+13,282-hh,13,10,'#256274');c.save();c.globalAlpha=.25;for(let z=0;z<3;z++)rect(c,xx+5+z*7,279-hh,2,hh-4,p.accent);c.restore();}}
  }else if(depth===1){
   for(const h of [hx,hx+1180]){
    // Floating habitat and a recognizable striped lighthouse.
    rect(c,h-90,324,309,10,p.trim);rect(c,h-88,331,305,5,p.near);
    for(let k=0;k<5;k++){rect(c,h-60+k*58,336,6,37,p.near);rect(c,h-62+k*58,362,10,3,p.trim);}
    dome(c,h-75,323,94,70,p,r);dome(c,h+24,323,59,47,p,r);
    rect(c,h+118,222,23,103,p.mid);rect(c,h+123,222,12,103,p.trim);for(let yy=232;yy<318;yy+=20)rect(c,h+118,yy,23,5,p.near);
    rect(c,h+112,219,35,4,p.trim);rect(c,h+115,201,29,18,p.near);rect(c,h+119,204,21,10,p.light);rect(c,h+125,201,2,18,p.trim);
    poly(c,[[h+110,201],[h+129,189],[h+150,201]],p.mid);sign(c,h-24,298,78,15,p,r,false,'PIER / 03');
    line(c,h+170,272,h+170,323,p.trim,3);line(c,h+165,274,h+202,274,p.trim,2);
   }
  }else{
   // Lots of open water, with only occasional near buoys and service platforms.
   for(let x=110;x<TILE;x+=580){rect(c,x,404,3,21,p.trim);ellipse(c,x+1,425,9,3,p.near);rect(c,x-2,401,7,3,p.neon);}
   rect(c,0,444,TILE,3,p.near);line(c,0,443,TILE,443,p.trim+'66');
  }
 }else if(p.kind==='rock'){
  if(depth===0){
   for(let x=-120;x<TILE;x+=180){const pp={...p,mid:'#5d4850',near:'#3d3743',trim:'#82665f'};boulder(c,x,410,ir(r,140,250),ir(r,180,320),pp,r,false);}
  }else if(depth===1){
   for(let x=-80;x<TILE;x+=450)boulder(c,x,450,170,ir(r,180,255),p,r);
   for(const h of [hx,hx+1180]){
    boulder(c,h-53,450,243,311,p,r);boulder(c,h+345,450,91,275,p,r);
    for(let k=0;k<3;k++){const xx=h-12+k*48,yy=278+(k%2)*28;rect(c,xx,yy,39,41,p.near);rect(c,xx-4,yy-3,48,4,p.trim);windowGrid(c,xx+2,yy+3,35,35,p,r);rect(c,xx-4,yy+41,48,4,p.trim);}
    sign(c,h+20,275,65,14,p,r,false,'RIDGE / 41');
    rect(c,h-17,347,257,5,p.trim);rect(c,h-14,352,250,3,p.near);for(let k=0;k<5;k++){line(c,h+2+k*45,354,h+16+k*45,374,p.trim,2);line(c,h+2+k*45,347,h+2+k*45,337,p.trim,1);}line(c,h-15,337,h+237,337,p.trim+'88');
    line(c,h+201,208,h+201,394,p.trim,2);line(c,h+225,208,h+225,394,p.trim,2);rect(c,h+197,200,32,8,p.near);
    for(let yy=218;yy<393;yy+=17)line(c,h+202,yy,h+224,yy+14,p.trim+'55');
    line(c,h+148,152,h+394,171,p.trim,2);line(c,h+148,156,h+394,175,p.trim+'88');
    rect(c,h+137,146,6,107,p.trim);rect(c,h+393,164,6,107,p.trim);
   }
  }else{
   for(let x=-100;x<TILE;x+=540)boulder(c,x,475,146,ir(r,75,160),{...p,mid:'#222631',near:'#111b27',trim:'#574851'},r);
   line(c,0,438,TILE,438,p.trim+'55');rect(c,0,440,TILE,4,p.near);
  }
 }
 return e;
}
function waterSurface(c,s,t,travel,width,v){
 const p=s.p,top=p.kind==='water'?273:350,depth=HEIGHT-top;
 gradient(c,0,top,width,depth,p.kind==='water'?['#125365','#104457','#071e35']:[p.mid,p.near,p.sky[0]]);
 const r=rand(p.seed+24);c.save();
 for(let i=0;i<210;i++){const y=top+5+r()*(depth-6),len=(y-top+2)*.14+r()*20,x=mod(r()*width+Math.sin(t*.3+i)*5-travel*.4,width);c.globalAlpha=(.06+r()*.16)*(v.variant===1?.6:1);rect(c,x,y,len,1,i%4?p.accent:p.light);}
 // Broad, moving fragments of moonlight rather than a still repeated texture.
 for(let j=0;j<47;j++){let y=top+5+j*(depth-12)/47,spread=7+j*1.5,xx=width*.73+Math.sin(j*1.5+t*.55)*spread;c.globalAlpha=.12*(1-j/56);rect(c,xx,y,8+j*.9,1,p.light);}
 c.restore();
}
function workCrane(c,x,y,t,p){
 // Lower -> grip -> lift -> translate -> lower -> release -> return.
 const u=mod(t,32),from=x-50,to=x+35;let cx=from,cy=y+50,loaded=false;
 if(u<4){cy=y+50+smooth(u/4)*61;}
 else if(u<7){cy=y+111;loaded=u>5;}
 else if(u<12){cy=y+111-smooth((u-7)/5)*80;loaded=true;}
 else if(u<18){cx=from+(to-from)*smooth((u-12)/6);cy=y+31;loaded=true;}
 else if(u<22){cx=to;cy=y+31+smooth((u-18)/4)*80;loaded=true;}
 else if(u<25){cx=to;cy=y+111;loaded=u<23;}
 else{cx=to+(from-to)*smooth((u-25)/7);cy=y+111-smooth((u-25)/7)*61;}
 rect(c,cx-5,y-2,10,5,p.near);line(c,cx,y+3,cx,cy,p.trim);line(c,cx-3,cy,cx,cy+4,p.light);line(c,cx,cy+4,cx+3,cy,p.light);
 if(loaded)crate(c,cx-10,cy+5,21,17,p);
 if(u<=5)crate(c,from-10,y+116,21,17,p);
 if(u>=23)crate(c,to-10,y+116,21,17,p);
}
function shipBoat(c,x,y,t,p,scale=1){
 c.save();c.translate(Math.round(x),Math.round(y+Math.sin(t*.7)*1.2));c.scale(scale,scale);
 c.globalAlpha=.25;rect(c,-30,12,69,1,p.accent);c.globalAlpha=1;
 poly(c,[[-26,2],[28,2],[19,12],[-19,12]],p.near);rect(c,-8,-12,21,14,p.trim);rect(c,-5,-10,14,6,p.accent);rect(c,-11,-14,28,3,p.near);line(c,0,-15,0,-29,p.trim);rect(c,1,-27,11,5,p.neon);glow(c,24,1,2,2,p.light,3);c.restore();
}
function worldLife(c,s,time,travel,width,v){
 const p=s.p,t=lifeClock(v,time),low=state.density==='quiet';
 scenePositions(s,travel,width,x=>{
  if(p.kind==='neon'){
   if(v.variant===1){c.save();c.globalAlpha=.28;rect(c,x,57,72,208,'#101423');c.restore();}
   // A narrow, inhabited terrace alongside the familiar advertisement.
   rect(c,x+140,331,129,5,p.trim);rect(c,x+141,336,125,4,p.near);rect(c,x+147,305,42,25,p.near);rect(c,x+148,302,49,5,p.neon);text(c,'SOUP',x+152,313,p.light,1);
   person(c,x+170,330,t,p,{action:'work',coat:'#b59d83'});steam(c,x+184,315,t,p);
   rotatingFan(c,x+231,318,8,t,p);cat(c,x+220,331,t,p);
   if(!low){const d=shuttling(t+15,34);person(c,x+198+d.f*37,331,t,p,{dir:d.dir,walk:d.u<.45||d.u>.55,coat:'#628285'});}
   const d=shuttling(t,48);drone(c,x+31+d.f*95,139+d.f*30,t,p,false);
   if(d.f>.91){c.save();c.globalAlpha=.16;poly(c,[[x+128,169],[x+85,184],[x+85,154]],p.accent);c.restore();}
  }else if(p.kind==='scrap'){
   workCrane(c,x+242,165,t,p);
   person(c,x+178,354,t,p,{hat:true,action:'work',coat:'#a78d73'});
   const weld=mod(t,12);if(weld<5){glow(c,x+187,342,2,2,p.accent,6);if(!low)for(let k=0;k<5;k++){let a=mod(t*.9+k*.2,1);rect(c,x+189+a*13,343+a*a*9,1,1,p.light);}}
   steam(c,x-7,299,t,p);rotatingFan(c,x+45,236,10,t,p);
   if(!low){const a=shuttling(t+14,27);person(c,x-49+a.f*84,354,t,p,{hat:true,walk:true,carry:a.dir>0,dir:a.dir});}
  }else if(p.kind==='water'){
   const a=shuttling(t,30),ny=309+a.f*25;line(c,x+195,275,x+195,ny,p.trim);poly(c,[[x+184,ny],[x+206,ny],[x+202,ny+15],[x+188,ny+15]],'#54837c88');for(let k=0;k<5;k++)line(c,x+185+k*4,ny,x+189+k*2.8,ny+14,p.accent+'55');
   person(c,x+161,323,t,p,{hat:true,action:'work',coat:'#799696'});
   c.save();c.globalAlpha=.06;const a2=Math.sin(t*.13);poly(c,[[x+129,207],[x+129+a2*330,168],[x+129+a2*340,242]],p.light);c.restore();
   if(!low)shipBoat(c,x-118+Math.sin(t*.08)*29,351,t,p,.65);
  }else if(p.kind==='rock'){
   const a=shuttling(t,42),gy=209+a.f*161;rect(c,x+197,gy,32,3,p.trim);rect(c,x+200,gy+3,26,20,p.near);rect(c,x+202,gy+5,22,13,p.accent+'66');crate(c,x+204,gy+9,12,11,p);line(c,x+213,207,x+213,gy,p.trim);
   const g=shuttling(t+11,49),gx=x+151+g.f*241,yy=152+g.f*19;line(c,gx,yy,gx,yy+17,p.trim);rect(c,gx-11,yy+17,23,14,p.near);rect(c,gx-9,yy+19,18,6,p.light);rect(c,gx-8,yy+26,16,3,p.trim);
   person(c,x+130,347,t,p,{hat:true,action:'read',coat:'#aa8b68'});
   if(!low){steam(c,x+60,300,t,{...p,light:'#b6a199'},4);}
  }else if(p.kind==='garden'){
   const y=351;rect(c,x+122,y,123,5,p.trim);rect(c,x+125,y-3,118,3,'#54715e');
   for(let k=0;k<4;k++){rect(c,x+135+k*27,y-9,11,7,'#8a6660');rect(c,x+138+k*27,y-16,5,8,'#7cba8a');rect(c,x+133+k*27,y-14,14,3,'#548568');}
   const a=shuttling(t,36);person(c,x+129+a.f*77,y,t,p,{walk:a.f<.88,action:a.f>.88?'work':'idle',dir:a.dir,coat:'#8b9b80'});
   if(mod(t,24)<13&&!low){const sx=x+230;for(let k=0;k<15;k++){const f=mod(t*.4+k/15,1);rect(c,sx-f*73,y-23-29*Math.sin(f*Math.PI)+f*20,1,2,p.accent+'99');}}
   rotatingFan(c,x+140,309,9,t*.7,p);cat(c,x+247,y,t,p);
  }else if(p.kind==='void'){
   const a=shuttling(t,39),dx=x+118+a.f*33,dy=248-a.f*86;
   drone(c,dx,dy,t,p);if(a.f>.87){c.save();c.globalAlpha=.12;poly(c,[[dx-10,dy],[x+88,dy-18],[x+88,dy+17]],p.accent);c.restore();}
   rect(c,x+106,276,39,7,p.trim);rect(c,x+110,277,31,2,p.accent);robot(c,x-4,378,t,p,.7);
  }
 });
 if(p.kind==='scrap'&&!low){
  const u=mod(t,77);if(u<48){const x=width+160-u*(width+340)/48,y=105+Math.sin(t*.2)*3;drone(c,x,y,t,p);line(c,x+18,y,x+58,y+7,p.trim);wreck(c,x+58,y-3,62,27,p,rand(808));}
 }
 if(p.kind==='water'){
  const u=mod(t,86);if(u<43){const x=width+160-u*(width+410)/43,y=378;c.save();c.globalAlpha=.24;poly(c,[[x-138,y],[x-89,y-17],[x+8,y-22],[x+72,y-7],[x+96,y-18],[x+89,y+6],[x+62,y+19],[x+8,y+16],[x-70,y+12]],'#021d31');c.restore();}
  const x=mod(t*7+width*.3,width+170)-85;shipBoat(c,x,347,t,p,.65);
  if(!low)shipBoat(c,mod(width*.8-t*4,width+210)-105,390,t+4,p,.86);
 }
}

// The platform is a spatial foreground layer, not a fading black overlay.
function stationLayout(width){
 const logical=Math.max(680,width+32),crop=width<500?Math.max(0,102-width*.23):0;
 return{logical,crop,shop:100,bench:326,cargo:505,board:296};
}
function stationBackground(s,width){
 const p=s.p,l=stationLayout(width),r=rand(p.seed+450),e=surface(l.logical,HEIGHT),c=e.getContext('2d'),w=l.logical;
 // Open canopy: the city is visible through it.
 const roofColor={neon:'#342734',scrap:'#34383d',water:'#244e5d',rock:'#49393d',garden:'#284339',void:'#293148'}[p.kind];
 if(p.kind==='water'){
  poly(c,[[0,216],[38,178],[w-43,178],[w,216]],'#32768799');
  for(let x=12;x<w;x+=65){line(c,x,213,x+24,178,p.accent+'88');}
 }else if(p.kind==='rock'){
  rect(c,0,180,w,18,roofColor);for(let x=0;x<w;x+=48){line(c,x,181,x+24,197,p.trim);line(c,x+24,197,x+48,181,p.trim);}
 }else if(p.kind==='scrap'){
  poly(c,[[0,217],[28,186],[w-45,182],[w,217]],roofColor);for(let x=28;x<w;x+=39)line(c,x,188,x-6,213,p.trim+'77');
  rect(c,32,190,85,5,p.near);text(c,'HULL  /  07',40,193,p.light,1);
 }else{
  rect(c,0,195,w,20,roofColor);rect(c,0,194,w,3,p.trim);
  for(let x=0;x<w;x+=26)rect(c,x,198,1,14,p.trim+'66');
 }
 rect(c,0,213,w,5,p.near);rect(c,0,218,w,2,p.trim);
 for(let x=36;x<w;x+=245){
  rect(c,x,219,8,152,p.near);rect(c,x+2,219,2,152,p.trim);rect(c,x-4,365,16,6,p.trim);line(c,x+4,219,x+38,239,p.trim,3);
  rect(c,x+27,223,67,5,p.light);rect(c,x+30,228,61,1,p.trim);
 }
 // Damp concrete with a perspective edge and tactile paving.
 gradient(c,0,371,w,79,[roofColor,'#101b28','#09111b']);rect(c,0,370,w,3,p.trim);
 for(let x=-20;x<w;x+=54){line(c,x,373,x-20,449,p.trim+'44');line(c,x,403,x+53,403,p.trim+'33');}
 rect(c,0,416,w,6,p.light+'77');for(let x=0;x<w;x+=6){rect(c,x,416,2,2,p.light);rect(c,x+2,420,2,1,p.light);}
 rect(c,0,428,w,6,'#040b13');line(c,0,427,w,427,p.trim);rect(c,0,434,w,16,'#08121d');for(let x=0;x<w;x+=35)rect(c,x,438,24,3,p.trim+'55');
 // Station name plate: its position is stable on every visit.
 rect(c,94,235,180,39,p.near);rect(c,97,238,174,32,roofColor);rect(c,98,237,171,1,p.accent);
 cjk(c,p.station,105,242,p.light,11);text(c,LIFE[p.kind].stationEn,105,259,p.accent,1);
 rect(c,68,240,22,30,p.near);text(c,String(s.index+1).padStart(2,'0'),79,248,p.light,2,'center');
 // Kiosk architecture differs by planet.
 const x=l.shop,sy=306;
 rect(c,x,sy,150,65,roofColor);rect(c,x+8,sy+6,132,46,p.near);rect(c,x+12,sy+12,124,27,'#203137');
 for(let i=0;i<7;i++){rect(c,x+16+i*16,sy+16,10,14,i%3?p.light+'88':p.accent+'88');rect(c,x+18+i*16,sy+14,6,2,p.trim);}
 rect(c,x+4,sy+50,142,7,p.trim);rect(c,x+7,sy+57,136,13,p.near);
 if(p.kind==='neon'){
  roof(c,x-2,sy-4,154,p,r);for(let i=0;i<8;i++)rect(c,x+i*19,sy,12,9,p.neon);sign(c,x+5,sy-27,135,20,p,r,false,'MOON NOODLES');
  for(let i=0;i<2;i++){ellipse(c,x+15+i*123,sy+13,6,8,p.neon);rect(c,x+12+i*123,sy+11,6,2,p.light);}
 }else if(p.kind==='scrap'){
  poly(c,[[x-9,sy+6],[x+6,sy-10],[x+136,sy-13],[x+158,sy+6]],p.trim);rect(c,x+1,sy-1,143,4,p.near);text(c,'HULL CAFE',x+74,sy-8,p.light,1,'center');
  ellipse(c,x+12,sy+70,10,7,p.trim);ellipse(c,x+12,sy+70,6,4,p.near);crate(c,x+157,sy+43,22,21,p);crate(c,x+166,sy+27,17,15,p);
 }else if(p.kind==='water'){
  poly(c,[[x-10,sy],[x+10,sy-18],[x+130,sy-18],[x+155,sy]],'#41808a');text(c,'TIDE & TEA'.replace('&','/'),x+72,sy-12,p.light,1,'center');
  rect(c,x+158,sy+29,40,34,p.trim);rect(c,x+161,sy+32,34,26,'#246b76');line(c,x+161,sy+34,x+194,sy+34,p.accent);rect(c,x+160,sy+62,36,3,p.near);
 }else if(p.kind==='rock'){
  rect(c,x-6,sy-7,161,9,p.trim);rect(c,x+3,sy-27,141,20,p.near);text(c,'RIDGE CANTEEN',x+74,sy-19,p.light,1,'center');
  for(let i=0;i<4;i++)crate(c,x+151+i%2*16,sy+51-Math.floor(i/2)*14,15,13,p);
 }else if(p.kind==='garden'){
  roof(c,x-2,sy-4,154,p,r,true);text(c,'LEAF / TEA',x+73,sy+7,p.light,1,'center');
  for(let i=0;i<9;i++){const xx=x-5+i*20;rect(c,xx,sy+1,2,10+r()*14,'#6ca06b');rect(c,xx-2,sy+8,7,4,'#83b179');}
  for(let i=0;i<3;i++){rect(c,x+153+i*16,sy+59,12,12,'#987969');gardenTree(c,x+158+i*16,sy+59,18,r,p,i===1);}
 }else{
  rect(c,x-4,sy-8,156,10,p.trim);text(c,'AUTOMAT / 88',x+73,sy-4,p.light,1,'center');
  for(let i=0;i<3;i++){rect(c,x+12+i*42,sy+10,34,44,p.trim);rect(c,x+15+i*42,sy+14,28,23,p.accent+'aa');rect(c,x+19+i*42,sy+42,20,6,p.near);}
 }
 if(p.kind!=='void'){cjk(c,LIFE[p.kind].shop,x+39,sy+58,p.light,9);rect(c,x+41,sy+41,17,6,p.mid);ellipse(c,x+49,sy+41,9,2,p.light);}
 // Bench, recycling bin, timetable, cargo pallets.
 const bx=l.bench;rect(c,bx,361,99,6,p.trim);rect(c,bx+5,343,88,4,p.trim);rect(c,bx+5,349,88,3,p.trim);rect(c,bx+7,367,5,10,p.near);rect(c,bx+83,367,5,10,p.near);
 rect(c,bx+111,346,20,29,p.near);rect(c,bx+109,346,24,4,p.trim);rect(c,bx+115,353,12,3,p.accent);
 rect(c,l.board,283,124,42,p.near);rect(c,l.board+3,286,118,35,roofColor);text(c,'NCL / DEPARTURES',l.board+8,289,p.accent,1);line(c,l.board+12,326,l.board+12,370,p.trim,3);
 rect(c,l.cargo-2,364,67,8,p.trim);for(let k=0;k<4;k++)crate(c,l.cargo+k%3*20,346-Math.floor(k/3)*17,18,16,p);
 if(p.kind==='garden'){for(let i=0;i<11;i++)gardenTree(c,30+i*65,195,18,r,p,i%5===0);}
 if(p.kind==='water'){line(c,470,315,522,333,p.trim);for(let k=0;k<7;k++)line(c,470+k*7,315+k*2.5,486+k*3,361,p.accent+'66');}
 return e;
}
function stationPeople(c,s,t,width,v,stop){
 const p=s.p,l=stationLayout(width),x=l.shop,low=state.density==='quiet';
 // Readable progress on the station board; this is ambient signage, not a task.
 const lines=stop.held?['WINDOW SEAT','STAY AS YOU LIKE']:stop.phase==='depart'?['NOW DEPARTING','HAVE A GOOD NIGHT']:['NIGHT TRAIN 07','NEXT / '+String(Math.max(0,Math.ceil(state.stopDuration-stop.t))).padStart(2,'0')+' SEC'];
 text(c,lines[0],l.board+8,302,p.light,1);text(c,lines[1],l.board+8,313,p.accent,1);
 if(p.kind!=='void'){
  // Shopkeeper and a waiting passenger do different things while the train rests.
  person(c,x+68,350,t,p,{coat:p.kind==='garden'?'#a4b59a':'#b3a48d',action:'work'});
  rect(c,x+6,356,139,3,p.trim); // Counter lip correctly occludes the shopkeeper.
  steam(c,x+48,345,t,p,low?3:6);
  person(c,x+132,389,t+4,p,{dir:-1,action:'drink',coat:'#7596a0'});
  const a=shuttling(t+11,34);person(c,265+a.f*70,386,t,p,{walk:a.f<.94,action:a.f>.94?'read':'idle',dir:a.dir,hat:p.kind==='rock'||p.kind==='scrap',coat:'#bb9c73'});
  // A quiet reader and a cat occupy the same bench on each visit.
  person(c,l.bench+30,366,t,p,{action:'read',coat:'#738482',scale:.83});cat(c,l.bench+75,361,t,p);
  if(!low){
   const u=mod(t+3,26);let xx=l.cargo+14,carry=false,walking=false,dir=1;
   if(u<3){}else if(u<11){xx+=smooth((u-3)/8)*71;carry=true;walking=true;}else if(u<15){xx+=71;carry=u<13;}else if(u<23){xx+=71*(1-smooth((u-15)/8));walking=true;dir=-1;}
   person(c,xx,391,t,p,{dir,walk:walking,carry,hat:true,coat:'#9b927a'});
   // Cart receives the parcel before the porter returns.
   rect(c,l.cargo+85,387,40,4,p.trim);rect(c,l.cargo+91,391,5,4,p.near);rect(c,l.cargo+116,391,5,4,p.near);line(c,l.cargo+125,389,l.cargo+125,371,p.trim,2);
   if(u>=13)crate(c,l.cargo+93,373,15,13,p);
  }
 }else{
  // Unstaffed station: power, deliveries and maintenance still go on.
  for(let k=0;k<3;k++){const yy=mod(t*.7+k,8);rect(c,x+19+k*42,338+yy,17,1,p.light);}
  drone(c,x+125+Math.sin(t*.18)*29,286,t,p,true);
 }
 // Cleaning robot is independent of the train's velocity, including a held stop.
 const rb=shuttling(t+7,42),rx=70+rb.f*(l.logical-175);robot(c,rx,408,t,p,.82);
 if(p.id==='relay'&&gateway.snapshot.state.chapterFour?.delivery==='installed'){
  // The replacement is on the existing working machine, not a second robot.
  rect(c,rx-12,405,24,2,p.accent);
  for(let k=0;k<6;k++)line(c,rx-11+k*4,407,rx-12+k*4+Math.sin(t*8)*2,410,p.light);
 }
 if(!low&&mod(t,57)<36){const dx=l.logical+40-mod(t,57)*(l.logical+110)/36;drone(c,dx,281,t,p,true);}
 if(p.kind==='scrap'){
  rotatingFan(c,274,333,11,t,p);
  if(!low&&mod(t,15)<6){glow(c,587,359,2,2,p.accent,7);person(c,579,375,t,p,{hat:true,action:'work'});}
 }else if(p.kind==='water'){
  for(let k=0;k<4;k++){const fx=x+164+mod(t*(1+k*.12)+k*8,24),fy=344+k%3*5;rect(c,fx,fy,4,2,p.light);rect(c,fx-1,fy-1,1,3,p.accent);}
  for(let k=0;k<4;k++){const f=mod(t*.3+k/4,1);rect(c,x+187,366-f*20,1,1,p.accent);}
 }else if(p.kind==='garden'){
  if(mod(t,21)<9){person(c,x+219,380,t,p,{dir:-1,action:'work',coat:'#92ab7e'});for(let k=0;k<6;k++){let a=mod(t*.5+k/6,1);rect(c,x+211-a*21,365+a*13,1,2,p.accent);}}
 }else if(p.kind==='rock'){
  const a=shuttling(t,35);line(c,586,234,642,232,p.trim);line(c,586,234,586,324,p.trim);rect(c,581,282+a.f*38,16,14,p.trim);crate(c,583,284+a.f*38,12,10,p);
 }
 // Light reflections on the wet or polished platform are subtle and finite.
 c.save();c.globalAlpha=p.kind==='water'||p.kind==='neon'?.17:.07;for(let k=0;k<10;k++){let xx=120+k*14;rect(c,xx+Math.sin(t*.4+k)*2,397+k%3*4,6+k%4,1,k%2?p.light:p.accent);}c.restore();
}
// Small persistent additions share the existing station coordinates and pixel palette.
function commerceAtPlatform(c,s,t,width){
 if(s.p.id!=='kowloon')return;
 const p=s.p,l=stationLayout(width),trade=gateway.snapshot.state.commerce,daily=gateway.snapshot.state.tradeView?.scene;
 if(!trade)return;
 const x=l.shop+131;
 if(trade.installations.mei==='installed'&&daily?.tableOpen){
  // The food counter remains small; the main restaurant keeps its normal service.
  momentRenderer.table(c,x,t,p,s.index===state.index?momentDirector.view:{});
  rect(c,x,359,61,5,'#b7956e');rect(c,x+3,364,4,20,p.trim);rect(c,x+53,364,4,20,p.trim);
  rect(c,x+3,364,53,9,'#583a37');
  crate(c,x+8,347,18,11,p);rect(c,x+12,351,4,2,p.light);
  for(let k=0;k<2;k++){ellipse(c,x+35+k*15,356,6,2,'#d0d5c8');rect(c,x+31+k*15,356,8,3,'#9ba99f');}
  line(c,x-4,331,x-4,359,p.trim,2);rect(c,x-9,331,10,3,p.light);glow(c,x-8,332,8,3,p.light,15);
  steam(c,x+17,345,t,p,3);
  c.save();c.globalAlpha=.22;for(let k=0;k<5;k++)rect(c,x+7+k*3,390+k*3,27-k*4,1,p.light);c.restore();
 }else{
  // A folded table is scenery, not a penalty for declining a trade.
  line(c,x+20,357,x+25,376,p.trim,2);line(c,x+25,357,x+20,376,p.trim,2);rect(c,x+19,351,8,7,'#5b5550');
 }
 // Trays remain on the shop shelf even when the outdoor table is folded.
 if(daily?.trays){for(let k=0;k<3;k++){rect(c,l.shop+105,349-k*5,19,4,'#91a9a2');rect(c,l.shop+104,348-k*5,21,1,p.light);}}
 // The original power box remains installed beside the folded table.
 if(trade.installations.mei==='installed'&&!daily?.tableOpen){crate(c,x+8,374,18,11,p);rect(c,x+12,378,4,2,p.light);}
 const bx=l.board-25;
 if(trade.installations.ren==='installed'){
  rect(c,bx,277,20,50,p.near);rect(c,bx+3,280,14,44,'#285a61');rect(c,bx+4,283,12,2,p.accent);
  for(let k=0;k<4;k++){rect(c,bx+5,290+k*7,10-(k%2)*3,2,p.light);}
  line(c,bx+9,327,bx+9,371,p.trim,3);glow(c,bx+3,280,14,44,p.accent,daily?.hood?3:9);
  if(daily?.hood){rect(c,bx,277,20,5,p.trim);rect(c,bx,282,5,43,p.near);rect(c,bx+16,282,4,43,p.near);}
  c.save();c.globalAlpha=daily?.hood?.10:.28;for(let k=0;k<10;k++)rect(c,bx+6+Math.sin(t+k)*2,383+k*3,11-k*.6,1,k%2?p.accent:p.light);c.restore();
 }else{rect(c,bx+3,368,14,4,p.trim);}
}
function laterCommerceAtPlatform(c,s,t,width){
 const p=s.p,l=stationLayout(width),save=gateway.snapshot.state;
 const quests=save.sidequests?.quests,installed=id=>quests?.[id]?.installed.includes(p.id);
 sidequestRenderer.drawPlatform(c,p,t,l,quests);
 if(p.id==='kowloon'){
  if(installed('late_tea')){
   rect(c,l.shop+84,342,10,12,'#7b8e7d');ellipse(c,l.shop+89,342,6,2,'#c6ba91');rect(c,l.shop+84,347,10,3,'#d6c5a0');
   rect(c,l.shop+5,334,23,13,'#3c3940');cjk(c,'夜茶',l.shop+8,344,p.light,9);
   ellipse(c,l.shop+99,356,5,2,'#b9d3c7');if(mod(t,39)<20)steam(c,l.shop+99,352,t,p,2);
  }
  if(installed('chair_home')){
   rect(c,453,356,37,5,p.trim);line(c,457,361,457,379,p.trim,2);line(c,486,361,486,379,p.trim,2);
   line(c,459,353,470,349,'#b2bdc6',2);line(c,468,350,471,347,'#b2bdc6');rect(c,477,352,8,3,'#967d8d');
   if(mod(t+4,53)<18)person(c,475,380,t,p,{hat:true,action:'work',coat:'#9ba1b6'});
  }
 }
 if(p.id==='scrap'){
  if(installed('steady_grips')){
   rect(c,550,356,39,4,p.trim);line(c,554,360,554,377,p.trim,2);line(c,585,360,585,377,p.trim,2);
   for(let k=0;k<2;k++){line(c,556+k*16,350,561+k*16,344,p.light,2);line(c,553+k*16,354,557+k*16,349,'#82a7ab',3);}
  }
  if(installed('amber_window')){
   rect(c,l.shop+117,316,30,28,'#9c744b');rect(c,l.shop+118,317,28,26,'#efb26430');
   if(mod(t+8,57)<22){ellipse(c,l.shop+134,326,3,4,'#575347');rect(c,l.shop+130,330,8,12,'#666454');ellipse(c,l.shop+125,337,3,2,p.light);}
   line(c,l.shop+117,316,l.shop+147,316,'#c8a676',2);line(c,l.shop+132,316,l.shop+132,344,p.near,2);
  }
  if(installed('glove_drying')){
   line(c,l.shop+61,329,l.shop+83,329,p.trim,2);
   for(let k=0;k<2;k++){const x=l.shop+64+k*10+Math.sin(t*1.4+k)*.6;rect(c,x,332,6,10,'#b89576');rect(c,x-2,335,2,4,'#b89576');rect(c,x+2,329,2,4,p.light);}
  }
  if(installed('shears_return')){rect(c,l.shop+9,351,19,9,'#b4ac8c');cjk(c,'返却済',l.shop+10,358,p.near,6);}
 }
 if(p.id==='jade'&&installed('shears_return')){
  // The usual gardener prunes between watering rounds; the cloth identifies the returned tool.
  const x=l.shop+219,cut=mod(t,21)>=9,open=cut?Math.sin(t*2)*2:0;
  if(cut){line(c,x+2,364,x+12,362,p.trim,2);line(c,x+12,362,x+19,357-open,p.light);line(c,x+12,362,x+20,362+open,p.light);line(c,x+10,362,x+14,361,'#b697ae',3);}
  else{line(c,x-15,377,x-5,371,p.light);line(c,x-15,371,x-5,377,p.light);rect(c,x-16,373,5,3,'#b697ae');}
 }
 if(p.id==='pelagic'){
  if(installed('lunch_tags')){
   for(let k=0;k<2;k++){const x=l.cargo+9+k*17;rect(c,x,352,12,13,k?'#658a86':'#a59a78');line(c,x+3,352,x+3,348,p.trim);line(c,x+3,348,x+9,348,p.trim);line(c,x+9,348,x+9,352,p.trim);if(k)poly(c,[[x+6,354],[x+9,360],[x+3,360]],'#71c7bc');else ellipse(c,x+6,358,3,3,'#dfcb8a');}
  }
  if(installed('salt_scraper')){line(c,l.shop+137,337,l.shop+137,350,'#829e92',2);line(c,l.shop+134,335,l.shop+140,335,'#c4d8ce',2);}
  if(installed('wave_cups')){rect(c,l.shop+69,343,25,3,p.trim);rect(c,l.shop+75,331,11,12,'#8ba8a2');ellipse(c,l.shop+80,331,6,2,p.light);line(c,l.shop+86,335,l.shop+91,338,p.light,2);}
  if(installed('tide_seat')){
   const x=449,y=377,folded=mod(t,67)<23;
   if(folded){line(c,x-3,y-20,x+3,y,p.trim,3);line(c,x+3,y-20,x-1,y,p.light,2);rect(c,x-4,y-21,9,4,'#829e92');}
   else{rect(c,x-9,y-12,19,3,'#829e92');line(c,x-7,y-9,x+7,y,p.trim,2);line(c,x+7,y-9,x-7,y,p.trim,2);if(mod(t,67)<49)person(c,x,y-4,t,p,{scale:.8,action:'idle',coat:'#91aaa5'});}
  }
 }
 if(p.id==='kowloon'&&installed('wave_cups')){
  const cup=(x,y)=>{rect(c,x,y,7,8,'#c8ded7');line(c,x+7,y+2,x+10,y+2,p.light);line(c,x+10,y+2,x+10,y+6,p.light);for(let k=0;k<3;k++)rect(c,x+k*2,y+4+k%2,2,1,'#498ca8');};
  for(let k=0;k<3;k++)cup(l.shop+53+k*11,347);
  if(mod(t+5,71)<23){person(c,l.shop+123,380,t,p,{action:'drink',coat:'#ac9c93'});cup(l.shop+128,361);}
 }
 if(p.id==='gorge'&&installed('chair_home')){
  const xx=447,yy=365;rect(c,xx-8,yy-8,18,3,'#a38c75');line(c,xx-7,yy-19,xx-7,yy+7,p.trim,2);line(c,xx+8,yy-6,xx+8,yy+7,p.trim,2);rect(c,xx-8,yy-20,16,8,'#927e6c');line(c,xx-5,yy-17,xx+1,yy-15,p.near);
  if(mod(t+9,61)<26)person(c,xx,yy-1,t,p,{scale:.85,action:'read',coat:'#a3acaa'});
 }
 if(p.id==='gorge'&&save.chapterTwo?.delivery==='installed'){
  if(save.chapterTwo.chosen==='small'){
   // Same sealed boxes fit the existing lift and the upper landing.
   const lift=282+shuttling(t,35).f*38;
   crate(c,583,lift-7,12,8,p);crate(c,583,lift+1,12,8,p);
   for(let k=0;k<3;k++)crate(c,611+k%2*16,257-Math.floor(k/2)*11,14,10,p);
  }else{
   // A broad box stays at the foot; the ordinary porter moves smaller loads.
   crate(c,l.cargo+28,337,35,26,p);rect(c,l.cargo+27,336,37,3,p.light);
   crate(c,l.cargo+6,352,16,11,p);
  }
 }
 if(p.id==='jade'&&save.chapterThree?.delivery==='installed'){
  const x=l.shop+182,y=355,ch=save.chapterThree;
  const pots=ch.observed&&ch.observedVisit!==save.visits.jade&&save.visits.jade%2!==0;
  line(c,x,y-33,x,y+19,p.trim,3);line(c,x+40,y-33,x+40,y+19,p.trim,3);
  for(let k=0;k<2;k++)rect(c,x,y-11+k*23,42,3,p.trim);
  if(pots){for(let k=0;k<3;k++){crate(c,x+4+k*12,y-20,8,9,p);line(c,x+8+k*12,y-20,x+8+k*12,y-28,p.accent,2);}}
  else{
   line(c,x,y-30,x+40,y-30,p.light);
   const sway=Math.sin(t*.6)*2;
   for(let k=0;k<2;k++){rect(c,x+5+k*8+sway,y-28,5,10,'#b9a483');rect(c,x+4+k*8+sway,y-23,2,5,'#b9a483');}
   rect(c,x+26+sway,y-27,11,18,'#829e97');line(c,x+28,y-30,x+31+sway,y-26,p.light);
   for(let k=0;k<2;k++)crate(c,x+4+k*14,y+8,10,9,p);
  }
 }
 if(p.id==='relay'&&save.chapterFour?.delivery==='installed'){
  // Empty delivery holder beside the terminal; the brush is now in service.
  crate(c,l.shop+27,360,26,10,p);rect(c,l.shop+29,362,22,5,p.near);
 }
}
function drawStationOverlay(c,s,time,width,stop,v){
 if(!stop.overlay)return;
 const l=stationLayout(width),off=stop.phase==='arrive'?(width+80)*(1-smooth(stop.t/6)):stop.phase==='depart'?-(l.logical+100)*smooth(stop.t/8):0;
 if(!s.station||s.stationWidth!==width){s.station=stationBackground(s,width);s.stationWidth=width;}
 c.save();c.translate(Math.round(off-l.crop),0);c.drawImage(s.station,0,0);stationPeople(c,s,lifeClock(v,time),width,v,stop);commerceAtPlatform(c,s,lifeClock(v,time),width);laterCommerceAtPlatform(c,s,lifeClock(v,time),width);c.restore();
}


function atmosphere(c,s,time,travel,width,v){
 const p=s.p,t=lifeClock(v,time),density=state.density==='quiet'?.55:1;
 const amount=v.particles*(.9+.1*Math.sin(t*.032)),rain=p.rain||(p.kind==='garden'&&v.variant===2);
 c.save();
 if(rain){
  // Clamp to the available pool. Phase 1 could read past the end on a rainy visit.
  const count=Math.min(s.particles.length,Math.floor(118*amount*density));
  for(let i=0;i<count;i++){const a=s.particles[i];const x=mod(a.x-time*(24+a.z*15),width+40)-20,y=mod(a.y+time*(67+a.z*55),HEIGHT+30)-15;c.globalAlpha=.065+a.z*.095;line(c,x,y,x-3-a.z*3,y+5+a.z*7,'#9bd1ec');}
  for(let i=0;i<12;i++){const a=s.particles[i];c.globalAlpha=.11;rect(c,mod(a.x,width),mod(a.y+time*2.8,HEIGHT),1,5+i%6,'#c5e8ed');}
 }else if(p.kind==='rock'||p.kind==='scrap'){
  const count=Math.min(s.particles.length,Math.floor((p.kind==='rock'?75:25)*amount*density));
  for(let i=0;i<count;i++){const a=s.particles[i];c.globalAlpha=.12;rect(c,mod(a.x-time*(15+24*a.z),width+15)-10,a.y,2+i%4,1,p.light);}
 }else if(p.kind==='garden'){
  const count=Math.min(s.particles.length,Math.floor(38*amount*density));
  for(let i=0;i<count;i++){const a=s.particles[i];c.globalAlpha=.22+a.z*.2;rect(c,mod(a.x-time*(10+15*a.z),width+10)-5,mod(a.y+time*6+Math.sin(time*.8+a.phase)*3,HEIGHT),2+i%2,1+(i%4===0),p.neon);}
 }else{
  const count=Math.min(s.particles.length,Math.floor(30*amount*density));
  for(let i=0;i<count;i++){const a=s.particles[i];c.globalAlpha=.12+Math.sin(time*.4+a.phase)*.08;rect(c,mod(a.x-time*(2+3*a.z),width),mod(a.y-time*1.1,HEIGHT),1,1,p.accent);}
 }
 if(p.kind==='water'&&v.variant===1){
  for(let i=0;i<3;i++){const g=c.createLinearGradient(0,210+i*26,0,316+i*22);g.addColorStop(0,p.accent+'00');g.addColorStop(.5,p.accent+'0c');g.addColorStop(1,p.accent+'00');c.globalAlpha=1;c.fillStyle=g;c.fillRect(0,210+i*26,width,106);}
 }
 c.restore();
}
function getDistrictScene(base,district,width){
 if(!district)return base;
 const key=base.index+':'+district+':'+width;
 if(districtCache.has(key)){const s=districtCache.get(key);districtCache.delete(key);districtCache.set(key,s);return s;}
 const p={...base.p,seed:base.p.seed+district*7919,district};
 const s={...base,p,sky:districtRenderer.sky(p,width,HEIGHT)||base.sky,layers:[0,1,2].map(depth=>districtRenderer.layer(p,depth,width,TILE,HEIGHT))};
 districtCache.set(key,s);
 // Only the outgoing and incoming districts are needed, even after many loops.
 while(districtCache.size>2)districtCache.delete(districtCache.keys().next().value);
 return s;
}
function drawScene(c,s,time,travel,width,weather=true,options={}){
 const v=options.visit||(s.index===state.index?state.currentVisit:null)||buildVisit(s.index,0);
 const stop=options.stop||(weather&&s.index===state.index?getStopState():{phase:'cruise',motion:1,overlay:0});
 const scenic=options.scenic||(weather&&s.index===state.index?journeyScenery():{from:0,to:0,mix:1});
 const base=getDistrictScene(s,scenic.mix<1?scenic.from:scenic.to,width);
 drawCityScene(c,base,time,travel,width,v,stop,weather);
 if(scenic.mix<1&&scenic.from!==scenic.to){
  drawCityScene(districtCtx,getDistrictScene(s,scenic.to,width),time,travel,width,v,stop,weather);
  c.globalAlpha=smooth(scenic.mix);c.drawImage(districtSurface,0,0);c.globalAlpha=1;
 }
 // Platforms and saved story changes remain attached to the actual station.
 if(weather)drawStationOverlay(c,s,time,width,stop,v);
}
function drawCityScene(c,s,time,travel,width,v,stop,weather=false){
 const p=s.p,authored=districtRenderer.owns(p);
 s.momentState={...(s.index===state.index&&v===state.currentVisit?(momentDirectors[s.index]?.view??{}):{}),quests:gateway.snapshot?.state?.sidequests?.quests};
 c.imageSmoothingEnabled=false;c.globalAlpha=1;c.drawImage(s.sky,0,0,width,HEIGHT);
 if(authored)districtRenderer.background(c,s,lifeClock(v,time),travel,width);
 else if(p.kind==='water'||(p.kind==='neon'&&p.district===2)||(p.kind==='garden'&&p.district===3))waterSurface(c,s,time,travel,width,v);
 relayRenderer.background(c,s,lifeClock(v,time),travel,width,s.momentState);
 drawStrip(c,s.layers[0],travel*2.3,width);
 const g=c.createLinearGradient(0,140,0,430);g.addColorStop(0,p.haze+'00');g.addColorStop(.7,p.haze+(p.kind==='water'?'10':'20'));g.addColorStop(1,p.haze+'0a');c.fillStyle=g;c.fillRect(0,140,width,290);
 const count=Math.min(s.traffic.length,Math.max(2,Math.floor(7*v.traffic*(state.density==='quiet'?.5:1))));
 if(!authored)for(let i=0;i<count;i++){const a=s.traffic[i],x=mod(a.x+time*a.speed-travel*4,width+140)-70;drawHovercraft(c,x,a.y+Math.sin(time*.2+a.phase)*1.4,a.size*.7,p,a.speed,time);}
 drawStrip(c,s.layers[1],travel*8.5,width);
 if(p.kind==='void'&&!p.district)scenePositions(s,travel,width,x=>drawRelayRing(c,x+43,163,65,p,time));
 // Local workers and their machines share the exact parallax of their buildings.
 if(p.district)districtRenderer.life(c,s,lifeClock(v,time),travel,width,state.density==='quiet');
 else worldLife(c,s,time,travel,width,v);
 momentRenderer.draw(c,s,lifeClock(v,time),travel,width,s.momentState);
 scrapRenderer.draw(c,s,lifeClock(v,time),travel,width,s.momentState);
 pelagicRenderer.draw(c,s,lifeClock(v,time),travel,width,s.momentState);
 gorgeRenderer.draw(c,s,lifeClock(v,time),travel,width,s.momentState);
 jadeRenderer.draw(c,s,lifeClock(v,time),travel,width,s.momentState);
 relayRenderer.draw(c,s,lifeClock(v,time),travel,width,s.momentState);
 sidequestRenderer.draw(c,s,lifeClock(v,time),travel,width,s.momentState);
 if(!p.district&&['neon','garden','void'].includes(p.kind))drawElevatedRail(c,s,time,travel,width);
 drawStrip(c,s.layers[2],travel*23.5,width);
 districtRenderer.foreground(c,s,lifeClock(v,time),travel,width,state.density==='quiet');
 // Rare close support; never sweep it across the foreground while at a platform.
 if(!stop.overlay&&!authored){const fx=-mod(travel*48+720,1850);for(let x=fx;x<width;x+=1850){rect(c,x,0,5,HEIGHT,'#080f1cdd');rect(c,x+1,0,1,HEIGHT,p.trim+'66');rect(c,x-3,279,11,5,p.near);}}
 if(weather&&(!authored||p.kind==='neon'))atmosphere(c,s,time,travel,width,v);
}
function startTransition(index,manual=true){
 if(!canMove())return;
 index=mod(index,worlds.length);if(state.transition||index===state.index)return;
 const fromScenic=journeyScenery();
 if(manual&&engine.timer?.active)engine.timer.stop();
 talk.close(false);talk.clearAir();
 if(state.paused){state.paused=false;syncPause();}
 const fromStop=getStopState(),visit=buildVisit(index,state.visitCounts[index]);visit.started=state.time+7.8;visit.holdOnArrival=manual;
 state.transition={to:index,t:0,next:getScene(index),from:state.index,visit,fromStop,fromScenic};
 $('arrival-name').textContent=worlds[index].name;$('arrival-en').textContent=worlds[index].en+' / NEXT ARRIVAL';$('announcement').classList.add('visible');
 if($('route-dialog').open)$('route-dialog').close();audio.setWorld(index);updateUI(true);
}
function finishTransition(){
 const tr=state.transition;if(!tr)return;
 if(tr.to===0&&tr.from===worlds.length-1)state.lap++;
 legElapsed+=tr.t;
 state.index=tr.to;activeScene=tr.next;state.elapsed=0;state.travel=Math.max(0,tr.t-4)*state.speed;state.transition=null;
 $('announcement').classList.remove('visible');enterWorld(state.index,true,tr.visit);
 if(!state.stationStops){legActive=false;arrivalNotice();beginLeg();}
 for(const key of cache.keys())if(key!==state.index+':'+W)cache.delete(key);
 updateWorldUI();updateUI(true);
}
// Shared, view-only crossing: the destination grows from its outskirts into
// the station district. This never changes identity, visits or saved location.
function drawCrossing(tr,phase){
 const t=clamp(phase,0,1)*7.8;
 drawSpace(ctx,state.time,W,phase);
 if(t<2.7){
  const exit=tr.fromStop.overlay?{...tr.fromStop,phase:'depart',t:t*1.4}:tr.fromStop;
  drawScene(blendCtx,activeScene,state.time,state.travel,W,true,{visit:state.currentVisit,stop:exit,scenic:tr.fromScenic});
  ctx.globalAlpha=1-smooth(t/2.7);ctx.drawImage(blendSurface,0,0);ctx.globalAlpha=1;
 }
 if(t>4){
  const approach=(t-4)/3.8,scale=.88+.12*smooth(approach);
  drawScene(blendCtx,tr.next,state.time,Math.max(0,t-4)*state.speed,W,true,{visit:tr.visit,scenic:approachScene(tr.next.p.id,approach),stop:{phase:'cruise',motion:1,overlay:0}});
  ctx.globalAlpha=smooth(approach);ctx.drawImage(blendSurface,(1-scale)*W/2,(1-scale)*HEIGHT/2,W*scale,HEIGHT*scale);ctx.globalAlpha=1;
 }
}
function render(dt){
 if(!activeScene)return;
 if(!state.paused){
  state.time+=dt;
  if(state.transition){state.travel+=dt*state.speed;state.transition.t+=dt;}
  else{
   const stop=getStopState();state.travel+=dt*state.speed*stop.motion;
   if(legActive&&!stop.held&&stop.phase!=='stop')legElapsed+=dt;
   if(!stop.held)state.elapsed+=dt;
   advanceStation(dt);
   if(!state.auto&&!engine.timer?.active)districtJourney.advance(dt,stop.phase==='cruise'&&!stop.held?state.speed*stop.motion:0,state.currentVisit.count,!!getStopState().overlay);
   if(!engine.timer?.active&&state.auto&&(legDuration!==null?legActive&&legElapsed>=legDuration-7.8-(state.stationStops?6:0):state.elapsed>=state.dwell)&&state.stop.phase==='cruise'&&canMove())startTransition((state.index+1)%worlds.length,false);
  }
  if(momentDirectors[state.index]){
   const stop=scenicStop(),scenic=journeyScenery(),work=focusRoute(),table=gateway.snapshot.state.tradeView?.scene?.tableOpen&&gateway.snapshot.state.commerce?.installations?.mei==='installed';
   momentDirectors[state.index].advance(dt,{district:stop.overlay?0:scenic.to,duration:engine.timer?.view.phase==='work'?engine.timer.view.total:state.travelSeconds??state.dwell,
    ready:!state.transition&&(!work||work.crossing===null)&&scenic.mix===1&&!talk.isDirect&&!gateway.blocked&&(stop.phase==='cruise'||stop.phase==='stop'),
    wetLeaves:state.index===4&&state.currentVisit.variant===0&&state.currentVisit.count>0,dusty:state.index===3&&state.currentVisit.variant===1,fog:state.index===2&&state.currentVisit.variant===1,rain:true,lightRain:state.currentVisit.variant===1,tableOpen:!!table,travel:state.travel,width:W});
  }
 }
 talk.tick(state.paused?0:dt);
 const tr=state.transition;
 if(tr){
  const t=tr.t;drawCrossing(tr,t/7.8);
  if(t>5.7)$('announcement').classList.remove('visible');if(t>=7.8)finishTransition();
 }else{
  const work=focusRoute();
  if(work&&work.crossing!==null){
   if(!focusPreview||focusPreview.from!==state.index){const to=(state.index+1)%worlds.length;focusPreview={from:state.index,to,next:getScene(to),visit:buildVisit(to,state.visitCounts[to]),fromStop:{phase:'cruise',motion:1,overlay:0},fromScenic:routeScene(worlds[state.index].id,1,work.duration)};}
   drawCrossing(focusPreview,work.crossing);
  }else{
   focusPreview=null;
   const stop=scenicStop(work);
   drawScene(ctx,activeScene,state.time,state.travel,W,true,{stop});
  }
 }
 state.frames++;
}
function updateWorldUI(){
 const p=worlds[state.index],visit=state.currentVisit;
 $('world-name').textContent=p.name;$('world-en').textContent=p.en;$('world-description').textContent=p.description;$('visit-note').textContent=visit.note;$('visit-note').title=visit.note;
 $('world-index').textContent=String(state.index+1).padStart(2,'0')+' / '+String(worlds.length).padStart(2,'0');$('coordinates').textContent=p.sector;$('weather-label').textContent=visit.weather;
 document.documentElement.style.setProperty('--accent',p.accent);
 document.querySelectorAll('.rail-point').forEach((el,i)=>{el.classList.toggle('active',i===state.index);el.setAttribute('aria-current',i===state.index?'location':'false');});
 document.querySelectorAll('.city-card').forEach((el,i)=>{el.classList.toggle('selected',i===state.index);el.setAttribute('aria-pressed',String(i===state.index));el.querySelector('.city-now').hidden=i!==state.index;});
 $('journey-count').textContent=state.lap+' 周目';audio.setWorld(state.index);
}
function updateUI(force=false){
 const left=Math.max(0,Math.ceil(legDuration!==null&&legActive?legDuration-legElapsed-(state.transition?.t||0):state.dwell-state.elapsed)),stop=scenicStop(),v=state.currentVisit;
 const clock=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
 $('progress').style.width=state.auto?Math.min(100,(legDuration!==null&&legActive?legElapsed/legDuration:state.elapsed/state.dwell)*100)+'%':'0%';
 $('journey-mode').textContent=state.paused?'窓辺で、ひと休み':state.transition?'星間航路':stop.phase==='stop'?(stop.held?'ホームの日常を眺める':'駅でひと息'):stop.phase==='arrive'?'まもなく到着':stop.phase==='depart'?'発車しました':state.auto?'外縁環状線・自動周遊':'この星を、ずっと';
 $('countdown').textContent=state.transition?'IN TRANSIT':stop.held?'STAY':state.auto?clock(left):'LOOP';
 $('next-label').textContent=state.transition?'次は '+worlds[state.transition.to].name:stop.overlay?v.station:state.auto?'次は '+worlds[(state.index+1)%worlds.length].name:'いつもの景色をめぐっています';
 $('stop-status').hidden=!stop.overlay;
 $('stop-name').textContent=v.station;
 $('stop-phase').textContent=state.paused?'一時停止中':stop.phase==='arrive'?(stop.held?'到着後は、この駅に滞在':'減速してホームへ'):stop.phase==='depart'?'また、次の車窓へ':stop.held?'時間を気にせず、この駅で':'あと '+Math.max(0,Math.ceil(state.stopDuration-stop.t))+' 秒で出発';
 const b=$('station-action');b.disabled=!!state.transition||stop.phase==='depart';b.classList.toggle('active',!!stop.held);b.setAttribute('aria-pressed',String(!!stop.held));
 $('station-action-label').textContent=stop.phase==='cruise'?'駅に停車':stop.phase==='depart'?'発車中':stop.held?(stop.phase==='stop'?'発車する':'滞在予定'):'駅で過ごす';
 b.setAttribute('aria-label',stop.held?(stop.phase==='stop'?'この駅から発車する':'到着後の滞在を解除'):'列車だけ停めて、ホームの日常を眺める');
 const district=journeyScenery().to,description=DISTRICTS[worlds[state.index].id][district],work=focusRoute();
 const incoming=work&&work.crossing!==null;
 const note=incoming?(work.crossing>4/7.8?'次の街の灯りが近づいてくる。':'街の灯りを離れ、星間航路へ。')+' · 次は '+worlds[(state.index+1)%worlds.length].name:!stop.overlay&&!state.transition?description[0]+' · '+description[1]:v.note;
 if($('visit-note').textContent!==note){$('visit-note').textContent=note;$('visit-note').title=note;}
 $('visit-note').hidden=!state.hints;$('revisit').disabled=!!state.transition;
 talk.update();
 const ashore=gateway.snapshot.state.location.mode==='station';
 $('app').classList.toggle('ashore',ashore);
 if(ashore){$('journey-mode').textContent='ホームで過ごす';$('stop-phase').textContent='下車中 · 列車はここで待っています';$('station-action').disabled=true;$('station-action-label').textContent='下車中';}
 $('revisit').disabled=!!state.transition||ashore||gateway.blocked;
 if(gateway.snapshot.state.suspended)$('stop-phase').textContent='ここから、また次の旅へ';
 engine.timer?.paint();
}

const spaceStars=Array.from({length:180},(_,i)=>{const r=rand(i*91+34);return{x:r(),y:r(),z:.15+r()*.85};});
function drawSpace(c,time,width,phase){
 gradient(c,0,0,width,HEIGHT,['#040b1a','#10162d','#302443']);const intensity=reducedMotion?1:Math.sin(clamp(phase,0,1)*Math.PI);
 c.save();for(let i=0;i<spaceStars.length;i++){const a=spaceStars[i],x=mod(a.x*width-time*(12+a.z*45),width),y=a.y*HEIGHT;c.globalAlpha=.22+a.z*.58;rect(c,x,y,Math.max(1,intensity*a.z*24),1,i%4?'#94c4d7':'#f5ccb2');}c.globalAlpha=.2;ellipse(c,width*.75,HEIGHT*.31,48,48,'#78879c');ellipse(c,width*.75+15,HEIGHT*.31-8,42,45,'#0d1429');c.restore();
}

// Crossfades need a separate compositing surface. Drawing with globalAlpha on
// the individual internal primitives would leak the next scene's opaque sky.
const blendSurface=surface(1,HEIGHT),blendCtx=blendSurface.getContext('2d');
const districtSurface=surface(1,HEIGHT),districtCtx=districtSurface.getContext('2d');

function tick(now){
 const dt=last?Math.min((now-last)/1000,.08):0;last=now;
 if(!document.hidden){if(!state.paused)render(dt);if(now-uiLast>250){updateUI();audio.tick(state.time);uiLast=now;}}
 requestAnimationFrame(tick);
}
let consoleHeight=0;
function resize(){
 const panelHeight=Math.ceil($('console').getBoundingClientRect().height);
 if(panelHeight!==consoleHeight){consoleHeight=panelHeight;$('app').style.setProperty('--console-height',panelHeight+'px');}
 const b=$('window').getBoundingClientRect();if(!b.width||!b.height)return;
 const newW=Math.max(160,Math.min(1800,Math.round(b.width/b.height*HEIGHT)));if(newW===W&&activeScene)return;
 W=newW;districtSurface.width=W;districtCtx.imageSmoothingEnabled=false;districtCache.clear();canvas.width=W;canvas.height=HEIGHT;blendSurface.width=W;blendSurface.height=HEIGHT;ctx.imageSmoothingEnabled=false;blendCtx.imageSmoothingEnabled=false;cache.clear();activeScene=getScene(state.index);if(state.transition)state.transition.next=getScene(state.transition.to);render(0);
}
const layoutObserver=new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,110);});
layoutObserver.observe($('window'));layoutObserver.observe($('console'));

function icon(button,name){button.querySelector('use').setAttribute('href','#i-'+name);}
function syncPause(){icon($('pause'),state.paused?'play':'pause');$('pause').setAttribute('aria-label',state.paused?'再生':'一時停止');$('pause').setAttribute('aria-pressed',String(state.paused));audio.updateLevel();updateUI(true);}
function togglePause(){if(gateway.snapshot.state.suspended)return;if(engine.timer?.active){void engine.timer.toggle();return;}state.paused=!state.paused;syncPause();toast(state.paused?'車窓を一時停止しました。':'車窓の時間が、また動き始めます。');}
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').classList.add('show');toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3000);}
function toggleImmersive(){talk.close(false);talk.clearAir();state.immersive=!state.immersive;$('app').classList.toggle('immersive',state.immersive);$('console').inert=state.immersive;$('window-hud').inert=state.immersive;wake();if(state.immersive)$('reveal').focus({preventScroll:true});else $('hide-ui').focus({preventScroll:true});setTimeout(resize,650);}
function wake(){if(!state.immersive)return;$('app').classList.add('awake');clearTimeout(wakeTimer);wakeTimer=setTimeout(()=>$('app').classList.remove('awake'),2300);}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('このブラウザでは全画面切替を利用できません。');}catch(e){toast('ブラウザの全画面操作をご利用ください。');}}
function postcard(){
 try{
  const out=surface(canvas.width*2,HEIGHT*2+128),c=out.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(canvas,0,0,canvas.width*2,HEIGHT*2);rect(c,0,HEIGHT*2,out.width,128,'#0b1623');
  c.fillStyle='#cde9e0';c.font='500 30px "Yu Gothic",sans-serif';c.fillText(worlds[state.transition?state.transition.to:state.index].name,36,HEIGHT*2+52);c.font='12px monospace';c.fillStyle='#819da9';c.fillText('NOCTILUCA / INTERSTELLAR NIGHT TRAIN',36,HEIGHT*2+88);
  out.toBlob(blob=>{if(!blob){toast('画像の保存に失敗しました。');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='noctiluca-'+worlds[state.index].id+'-'+new Date().toISOString().replace(/[:.]/g,'-')+'.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);toast('この車窓を、ポストカードに。');},'image/png');
 }catch(e){toast('この環境では画像を保存できませんでした。');}
}
function buildMap(){
 if($('city-grid').children.length)return;
 worlds.forEach((p,i)=>{
  const card=document.createElement('button');card.type='button';card.className='city-card';card.setAttribute('aria-label',p.name+'へ移動');card.setAttribute('aria-pressed',String(i===state.index));
  card.innerHTML='<div class="city-thumb"><img alt="" loading="lazy"><span class="city-order">'+String(i+1).padStart(2,'0')+' / '+p.kind.toUpperCase()+'</span><span class="city-now" hidden>現在地</span></div><div class="city-meta"><h3>'+p.name+'</h3><small>'+p.en+'</small><p>'+p.detail+'</p></div>';
  card.addEventListener('click',()=>{if(i===state.index){$('route-dialog').close();return;}if(state.transition){toast('まもなく到着します。到着後に行き先を選べます。');return;}startTransition(i);});$('city-grid').appendChild(card);
  // Fixed thumbnail dimensions: no device pixel ratio dependency.
  if(!thumbCache.has(i)){const s=makeScene(i,630),t=surface(630,HEIGHT),c=t.getContext('2d');drawScene(c,s,12,0,630,false,{visit:buildVisit(i,0)});thumbCache.set(i,t.toDataURL('image/webp',.85));}
  card.querySelector('img').src=thumbCache.get(i);
 });
 updateWorldUI();
}
function openMap(){talk.close(false);talk.clearAir();buildMap();$('route-dialog').showModal();}
// An opt-in ambient synthesizer. Nothing is loaded from the network.
const audio={
 context:null,master:null,bed:null,noiseGain:null,rainGain:null,tones:[],enabled:false,volume:.35,lastTick:-100,created:false,world:0,
 init(){if(this.created)return;const A=window.AudioContext||window.webkitAudioContext;if(!A)throw new Error('Web Audio unavailable');this.context=new A();const a=this.context;this.master=a.createGain();this.master.gain.value=0;this.master.connect(a.destination);
  const comp=a.createDynamicsCompressor();comp.threshold.value=-24;comp.knee.value=24;comp.ratio.value=4;comp.connect(this.master);this.bed=comp;
  const low=a.createOscillator(),lowG=a.createGain();low.type='sine';low.frequency.value=43;lowG.gain.value=.12;low.connect(lowG).connect(comp);low.start();
  const buff=a.createBuffer(1,a.sampleRate*6,a.sampleRate),data=buff.getChannelData(0),r=rand(19082);let brown=0;for(let i=0;i<data.length;i++){brown=(brown+(r()*2-1)*.035)/1.02;data[i]=brown*3;}const noise=a.createBufferSource();noise.buffer=buff;noise.loop=true;const filt=a.createBiquadFilter();filt.type='lowpass';filt.frequency.value=650;this.noiseGain=a.createGain();this.noiseGain.gain.value=.30;noise.connect(filt).connect(this.noiseGain).connect(comp);noise.start();
  const rain=a.createBufferSource();const rb=a.createBuffer(1,a.sampleRate*5,a.sampleRate),rd=rb.getChannelData(0);for(let i=0;i<rd.length;i++)rd[i]=(r()*2-1)*.25;rain.buffer=rb;rain.loop=true;const hp=a.createBiquadFilter();hp.type='highpass';hp.frequency.value=1100;const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=4800;this.rainGain=a.createGain();this.rainGain.gain.value=.05;rain.connect(hp).connect(lp).connect(this.rainGain).connect(comp);rain.start();
  // Melodic BGM has its own player; this bus carries rain and train sounds.
  this.created=true;this.setWorld(state.index);
 },
 async toggle(){try{this.init();this.enabled=!this.enabled;state.sound=this.enabled;if(this.enabled)await this.context.resume();this.updateLevel();$('sound').classList.toggle('active',this.enabled);$('sound').setAttribute('aria-label','音楽と環境音を設定');icon($('sound'),this.enabled?'sound':'muted');toast(this.enabled?'環境音オン · 列車の響きと、遠い星の音。':'環境音をオフにしました。');}catch(e){this.enabled=false;state.sound=false;toast('このブラウザでは環境音を開始できませんでした。');}finally{engine.music?.update();}},
 updateLevel(){if(!this.master)return;const t=this.context.currentTime,level=this.enabled&&!document.hidden?(state.paused?.25:1)*this.volume*.66:0;this.master.gain.cancelScheduledValues(t);this.master.gain.setTargetAtTime(level,t,.4);},
 setWorld(i){this.world=i;if(!this.created)return;const t=this.context.currentTime;this.tones.forEach(({o},j)=>o.frequency.setTargetAtTime(worlds[i].chord[j],t,2.5));this.rainGain.gain.setTargetAtTime(worlds[i].rain?.18:.025,t,2);},
 tick(time){if(!this.created||!this.enabled||state.paused||document.hidden||time-this.lastTick<.9)return;this.lastTick=time;const t=this.context.currentTime,m=getStopState().motion;this.tones.forEach(({g},i)=>g.gain.setTargetAtTime(.018+(.5+.5*Math.sin(time*.09+i*1.8))*.014,t,.9));this.noiseGain.gain.setTargetAtTime(.04+m*(.20+.025*Math.sin(time*2.7)),t,.35);const v=state.currentVisit,wet=worlds[state.index].rain||(worlds[state.index].kind==='garden'&&v?.variant===2);this.rainGain.gain.setTargetAtTime(wet?.15*(v?.particles||1):worlds[state.index].kind==='water'?.045:.018,t,1.5);},
 chime(kind){if(!this.created||!this.enabled||state.paused||document.hidden)return;const a=this.context,base=kind==='depart'?[523.25,659.25]:[392,523.25];base.forEach((f,i)=>{const o=a.createOscillator(),g=a.createGain(),t=a.currentTime+i*.32;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.025,t+.035);g.gain.exponentialRampToValueAtTime(.0001,t+1.15);o.connect(g).connect(this.bed);o.start(t);o.stop(t+1.2);o.onended=()=>{o.disconnect();g.disconnect();};});},
 setVolume(v){this.volume=clamp(v,0,1);this.updateLevel();}
};
function showVolume(){clearTimeout(volumeTimer);$('sound-volume').hidden=false;volumeTimer=setTimeout(()=>$('sound-volume').hidden=true,6500);}
document.addEventListener('pointerdown',()=>{if(gateway.snapshot.state.settings.arrivalBell)void bell.arm();},{passive:true});
 document.addEventListener('keydown',()=>{if(gateway.snapshot.state.settings.arrivalBell)void bell.arm();});
$('pause').addEventListener('click',togglePause);$('sound').addEventListener('click',()=>engine.openSoundSettings?.());$('sound').addEventListener('contextmenu',e=>{e.preventDefault();showVolume();});$('show-volume').addEventListener('click',()=>engine.openSoundSettings?.());$('volume').addEventListener('input',e=>{audio.setVolume(Number(e.target.value)/100);$('volume-value').textContent=e.target.value+'%';showVolume();});
$('speed').addEventListener('click',()=>{const speeds=[.5,1,1.5,2];state.speed=speeds[(speeds.indexOf(state.speed)+1)%speeds.length];$('speed').textContent=state.speed.toFixed(1)+'×';$('speed').setAttribute('aria-label','速度を変更。現在'+state.speed+'倍');toast('車窓の速さ '+state.speed.toFixed(1)+'×');});
$('hide-ui').addEventListener('click',toggleImmersive);$('reveal').addEventListener('click',toggleImmersive);$('fullscreen').addEventListener('click',fullscreen);$('capture').addEventListener('click',postcard);$('open-map').addEventListener('click',openMap);$('close-map').addEventListener('click',()=>$('route-dialog').close());$('route-dialog').addEventListener('click',e=>{if(e.target===$('route-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('auto-tour').addEventListener('change',e=>{state.auto=e.target.checked;if(state.auto){state.elapsed=0;beginLeg();}updateUI(true);});

$('station-action').addEventListener('click',stationAction);
$('revisit').addEventListener('click',revisit);
$('station-stops').addEventListener('change',e=>{state.stationStops=e.target.checked;updateUI(true);});
$('stop-duration').addEventListener('change',e=>{state.stopDuration=Number(e.target.value);updateUI(true);});
$('life-density').addEventListener('change',e=>{state.density=e.target.value;});
$('ambient-hints').addEventListener('change',e=>{state.hints=e.target.checked;updateUI(true);});

worlds.forEach((p,i)=>{const b=document.createElement('button');b.className='rail-point';b.textContent=String(i+1).padStart(2,'0');b.title=p.name;b.setAttribute('aria-label',p.name+'へ移動');b.addEventListener('click',()=>startTransition(i));$('rail-map').appendChild(b);});
document.addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey)return;const tag=e.target.tagName;if(e.target.closest('#timer-overlay'))return;if(['INPUT','SELECT','TEXTAREA'].includes(tag))return;if(document.querySelector('dialog[open]'))return;
 if(e.code==='Space'&&tag!=='BUTTON'){e.preventDefault();togglePause();}
 else if(e.key.toLowerCase()==='s')stationAction();else if(e.key.toLowerCase()==='h')toggleImmersive();else if(e.key.toLowerCase()==='m')audio.toggle();else if(e.key.toLowerCase()==='f')fullscreen();else if(e.key.toLowerCase()==='p')postcard();else if(e.key==='ArrowRight'){e.preventDefault();startTransition((state.index+1)%worlds.length);}else if(e.key==='ArrowLeft'){e.preventDefault();startTransition((state.index+worlds.length-1)%worlds.length);}else if(e.key==='Escape'&&state.immersive)toggleImmersive();
});
$('app').addEventListener('pointermove',wake,{passive:true});$('window').addEventListener('pointerdown',wake,{passive:true});
document.addEventListener('visibilitychange',()=>{last=0;if(audio.context){audio.updateLevel();if(document.hidden){setTimeout(()=>{if(document.hidden&&audio.context)audio.context.suspend().catch(()=>{});},900);}else if(audio.enabled){audio.context.resume().then(()=>audio.updateLevel()).catch(()=>{});}}});
document.addEventListener('fullscreenchange',()=>{const on=!!document.fullscreenElement;$('fullscreen').setAttribute('aria-label',on?'全画面を終了':'全画面表示');resize();});
// Non-mutating diagnostics are handy when extending the app in a local editor.
Object.defineProperty(window,'NOCTILUCA',{value:Object.freeze({get status(){return{version:VERSION,world:worlds[state.index].name,index:state.index,paused:state.paused,auto:state.auto,speed:state.speed,elapsed:state.elapsed,time:state.time,travel:state.travel,frames:state.frames,station:{...getStopState()},visit:state.currentVisit?.count,variant:state.currentVisit?.variant,transition:state.transition?.to??null,dimensions:[W,HEIGHT],cachedScenes:cache.size,district:DISTRICTS[worlds[state.index].id][journeyScenery().to][0],cachedDistricts:districtCache.size,density:state.density,stationStops:state.stationStops,conversations:talk.status};},worlds:worlds.map(p=>Object.freeze({id:p.id,name:p.name}))}),writable:false});

function notify(type,payload={}){
 gateway.send(type,payload).catch(e=>{state.stop.held=true;toast(e.message);});
}
function canMove(){return !gateway.snapshot.state.narrative?.active&&!document.querySelector('#story-dialog[open]')&&!talk.isDirect&&!gateway.busy&&!gateway.blocked&&!gateway.snapshot.state.suspended&&!!gateway.snapshot.state.displayName&&gateway.snapshot.state.location.mode==='train';}
const engine={
 get state(){return state;},worlds,getStopState,toast,updateUI,render,resize,bell,ambient:audio,
 get travelTimer(){return {active:legActive,seconds:Math.max(0,Math.ceil((legDuration??state.travelSeconds??state.dwell)-legElapsed-(state.transition?.t||0)))};},
 setTimerPaused(value){state.paused=value;syncPause();},
 resetTravelClock(){state.elapsed=0;legElapsed=0;legDuration=state.travelSeconds;legActive=false;if(['cruise','depart'].includes(state.stop.phase))beginLeg();},
 async timerDepart(){
  if(!canMove())throw new Error('列車に戻り、会話や保存の確認を終えてから発車してください。');
  if(gateway.snapshot.state.location.atStation)await gateway.send('station.depart');
  state.paused=false;state.stop={phase:'depart',t:0,held:false};state.elapsed=0;beginLeg();syncPause();
 },
 async timerArrive(index){
  const id=worlds[index].id;
  if(gateway.snapshot.state.location.world!==id)await gateway.send('travel.arrive',{world:id});
  if(!gateway.snapshot.state.location.atStation)await gateway.send('station.stop');
  if(index===0&&state.index===worlds.length-1)state.lap++;
  engine.apply(gateway.snapshot.state,true);state.paused=false;state.stop={phase:'stop',t:0,held:true};legActive=false;
  state.travel=3.8*state.speed;arrivalNotice();render(0);updateUI(true);
 },
 setHeld(){state.stop.held=true;},
 continueJourney(){state.stop={phase:'depart',t:0,held:false};state.paused=reducedMotion;state.elapsed=0;beginLeg();audio.chime('depart');syncPause();updateUI(true);},
 requestStop(){if(state.stop.phase==='cruise'){const fromDistrict=journeyScenery().to;state.stop={phase:'arrive',t:0,held:true,fromDistrict};}else state.stop.held=true;updateUI(true);},
 canAct(){return !gateway.snapshot.state.narrative?.active&&!state.transition&&state.stop.phase==='stop'&&!gateway.blocked&&!gateway.snapshot.state.suspended;},
 apply(s,full=false){
  const changed=worlds[state.index].id!==s.location.world;
  if(full||changed){
   state.index=worlds.findIndex(w=>w.id===s.location.world);state.transition=null;state.elapsed=0;state.travel=0;
   state.visitCounts=worlds.map(w=>s.visits[w.id]||0);
   enterWorld(state.index,false,buildVisit(state.index,Math.max(0,state.visitCounts[state.index]-1)));
   activeScene=getScene(state.index);for(const key of cache.keys())if(key!==state.index+':'+W)cache.delete(key);state.stop=s.location.atStation?{phase:'stop',t:0,held:true}:{phase:'cruise',t:0,held:false};
   $('announcement').classList.remove('visible');
  }
  for(const k of ['auto','dwell','stopDuration','density','hints','speed','stationStops','travelSeconds'])state[k]=s.settings[k];
  if(s.location.mode==='station'){state.stop={phase:'stop',t:0,held:true};state.transition=null;}
  if(s.suspended)state.paused=true;else if(full)state.paused=reducedMotion;
  if(full||changed){legActive=false;legDuration=state.travelSeconds;legElapsed=0;if(state.stop.phase==='cruise')beginLeg();}
  $('auto-tour').checked=state.auto;$('stop-duration').value=state.stopDuration;
  $('life-density').value=state.density;$('ambient-hints').checked=state.hints;$('station-stops').checked=state.stationStops;
  $('speed').textContent=state.speed.toFixed(1)+'×';updateWorldUI();syncPause();render(0);
 },
 get talk(){return talk;}
};
const talk=createTalk(engine,gateway,catalog);
// Keep restored journeys at a well-defined station/cruise checkpoint, never at an
// arbitrary pixel coordinate. No offline simulation is performed.
state.index=Math.max(0,worlds.findIndex(w=>w.id===gateway.snapshot.state.location.world));
state.visitCounts=worlds.map(w=>gateway.snapshot.state.visits[w.id]||0);
enterWorld(state.index,false,buildVisit(state.index,Math.max(0,state.visitCounts[state.index]-1)));
resize();talk.init();engine.apply(gateway.snapshot.state,true);
if(!gateway.authenticated){state.stop={phase:'arrive',t:0,held:false};}
const settings={'auto-tour':['auto','checked'],'station-stops':['stationStops','checked'],'stop-duration':['stopDuration','number'],'life-density':['density','value'],'ambient-hints':['hints','checked']};
for(const [id,[field,kind]] of Object.entries(settings))$(id).addEventListener('change',e=>notify('settings.set',{[field]:kind==='checked'?e.target.checked:kind==='number'?Number(e.target.value):e.target.value}));
$('speed').addEventListener('click',()=>notify('settings.set',{speed:state.speed}));
gateway.addEventListener('change',e=>{
 const reason=e.detail.reason;
 if(reason==='story.next'&&['ending','finale'].includes(e.detail.outcome.storyCompleted))engine.continueJourney();
 if(['reload','journey.resume','backup.restore','journey.reset'].includes(reason)){talk.close(false);engine.apply(gateway.snapshot.state,true);}
 else if(['profile.set','journey.alight','journey.board','journey.checkpoint','settings.set','legacy.import'].includes(reason))engine.apply(gateway.snapshot.state,false);
 if(reason==='journey.reset')state.lap=0;
 if(reason==='error'){state.stop.held=true;}
 updateUI(true);
});
requestAnimationFrame(tick);
if(reducedMotion)toast('動きを抑える設定に合わせて停止中です。再生ボタンで出発します。');
return engine;
}
