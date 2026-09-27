import {surface,rect,line,ellipse,poly,gradient,rand,ir,clamp,mod,smooth,shuttling,HEIGHT} from './pixel.js';
import {person,crate,steam,robot,drone,rotatingFan,workCrane,shipBoat,drawRay,drawRelayRing} from './sprites.js';
import {tower,pagoda,dome,industry,gardenTree,sign,boulder,wreck,makeScene} from './cityscape.js';
import {worlds,LIFE} from './worlds.js';
import {createSceneGraph} from './scene.js';
import {createCabin} from './cabin.js';
import {createPassengers} from './passengers.js';
import {createStationScene} from './station-scene.js';
import {createSidequestSceneRenderer} from './sidequest-scenes.js';



import {createArrivalBell} from './arrival-bell.js';
import {createTalk} from './talk.js';
import {createMomentDirector,createMomentRenderer} from './kowloon-moments.js';
import {SCRAP_MOMENTS,createScrapMomentRenderer} from './scrap-moments.js';
import {PELAGIC_MOMENTS,createPelagicMomentRenderer} from './pelagic-moments.js';
import {GORGE_MOMENTS,createGorgeMomentRenderer} from './gorge-moments.js';
import {RELAY_MOMENTS,createRelayMomentRenderer} from './relay-moments.js';
import {JADE_MOMENTS,createJadeMomentRenderer} from './jade-moments.js';
import {ABYSS_MOMENTS,CALDERA_MOMENTS,AERIE_MOMENTS,createFrontierMomentRenderer} from './frontier-moments.js';
import {DISTRICTS,createDistrictJourney,createDistrictRenderer,routeScene,approachScene,focusPassage} from './scenery.js';
export function createEngine(gateway,catalog) {
// NOCTILUCA: dependency-free, deterministic pixel-art renderer.
// Geometry is painted into reusable layers; the animation moves the layers at
// different speeds, then adds traffic, atmosphere, reflections and a space leg.
const $ = id => document.getElementById(id);
const canvas = $('scene'), ctx = canvas.getContext('2d', {alpha:false});
if (!ctx) { $('world-description').textContent = 'Canvas 2D を利用できるブラウザで開いてください。'; return; }
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = {index:0,elapsed:0,time:0,travel:0,speed:1,paused:reducedMotion,auto:true,dwell:120,travelSeconds:null,transition:null,lap:1,immersive:false,sound:false,visitCounts:Array(worlds.length).fill(0),currentVisit:null,frames:0,stationStops:true,stopDuration:24,density:"normal",hints:true,stop:{phase:"arrive",t:0,held:false}};
let W=900, activeScene=null, last=0, uiLast=0, resizeTimer=0, toastTimer=0, wakeTimer=0, volumeTimer=0;
const thumbCache=new Map();
const cabin=createCabin($('window')),passengers=createPassengers($('window'),cabin,{talk:ask=>gateway.passengerTalk?.(ask)||null});let cabinAshore=false;
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
 if(work)return routeScene(worlds[state.index].id,work.progress,work.duration,state.currentVisit?.count||0);
 const stop=getStopState();
 if(stop.overlay){
  if(stop.phase==='arrive'&&stop.fromDistrict!==undefined){const mix=clamp(stop.t/3,0,1);return {from:mix===1?0:stop.fromDistrict,to:0,mix};}
  return {from:0,to:0,mix:1};
 }
 if(!state.auto)return districtJourney.view;
 const budget=(legDuration!==null?legDuration-7.8-(state.stationStops?6:0):state.dwell-routeStart)-routeDeparture;
 const elapsed=(legDuration!==null?legElapsed:state.elapsed-routeStart)-routeDeparture;
 return routeScene(worlds[state.index].id,elapsed/Math.max(.1,budget),budget,state.currentVisit?.count||0);
}
// Where the next passengers may sit: not behind the station panel shown while stopped.
function passengerStop(){
 const n=worlds.length,w=$('window').getBoundingClientRect(),panel=$('stop-status'),avoid=[];
 if(!panel.hidden&&w.width){const b=panel.getBoundingClientRect();avoid.push([(b.left-w.left)/w.width,(b.right-w.left)/w.width]);}
 return{station:worlds[state.index].station,world:worlds[state.index].name,next:worlds[(state.index+1)%n].name,avoid};
}
function arrivalNotice(){bell.ring();passengers.arrive(passengerStop());toast(worlds[state.index].station+'に到着しました。');}
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
const frontierRenderer=createFrontierMomentRenderer();
// Index-aligned with worlds: the outer planets follow Night Relay.
const momentDirectors=[momentDirector,scrapDirector,pelagicDirector,gorgeDirector,jadeDirector,relayDirector,
 createMomentDirector(ABYSS_MOMENTS),createMomentDirector(CALDERA_MOMENTS),createMomentDirector(AERIE_MOMENTS)];
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
  drawScene(blendCtx,tr.next,state.time,Math.max(0,t-4)*state.speed,W,true,{visit:tr.visit,scenic:approachScene(tr.next.p.id,approach,tr.visit?.count||0),stop:{phase:'cruise',motion:1,overlay:0}});
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
   if(!state.auto&&!engine.timer?.active)districtJourney.advance(dt,stop.phase==='cruise'&&!stop.held?state.speed*stop.motion:0,state.currentVisit.count,!!getStopState().overlay,DISTRICTS[worlds[state.index].id].length-1);
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
 passengers.tick(state.paused?0:dt,state.time,{quiet:talk.isDirect||!$('overheard').hidden});
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
 $('app').classList.toggle('ashore',ashore);if(ashore!==cabinAshore)resize();
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

const stationScene=createStationScene({state,gateway,momentDirector,momentRenderer,sidequestRenderer});
const sceneGraph=createSceneGraph({state,gateway,getStopState,journeyScenery,buildVisit,momentDirectors,districtRenderer,sidequestRenderer,momentRenderer,scrapRenderer,pelagicRenderer,gorgeRenderer,jadeRenderer,relayRenderer,frontierRenderer,stationScene,districtSurface,districtCtx});
const {cache,districtCache,drawScene}=sceneGraph,getScene=i=>sceneGraph.getScene(i,W);

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
 // A short window (small screen, or larger text growing the console) cannot hold the reader panel.
 $('app').classList.toggle('short-window',b.height<460);
 // Grow the conversation sheet with the window; its px layout is tuned for a ~1380x720 window.
 // Percentages under zoom resolve differently across browsers, so a scaled sheet gets its height cap in px (divided back out of the zoom).
 const sheetScale=Math.min(1.8,Math.max(1,Math.min(b.width/1380,b.height/720))),appStyle=$('app').style;appStyle.setProperty('--sheet-scale',sheetScale.toFixed(2));
 if(sheetScale>1)appStyle.setProperty('--sheet-max-height',Math.floor(b.height/sheetScale-132)+'px');else appStyle.removeProperty('--sheet-max-height');
 // The carriage frames the view; the scene canvas fills only the window band it leaves open.
 cabinAshore=gateway.snapshot.state.location?.mode==='station';
 const box=cabin.layout(b.width,b.height,!state.immersive&&!cabinAshore),view=box||{w:b.width,h:b.height};
 passengers.layout(cabin.metrics);
 Object.assign(canvas.style,box?{left:box.x+'px',top:box.y+'px',width:box.w+'px',height:box.h+'px'}:{left:'',top:'',width:'',height:''});
 const newW=Math.max(160,Math.min(1800,Math.round(view.w/view.h*HEIGHT)));if(newW===W&&activeScene)return;
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
// Headphones: a per-device preference, so it lives in this browser only.
const HEADPHONES_KEY='noctiluca.headphones';
function setHeadphones(on,announce=false){
 passengers.setMuted(on);const b=$('headphones');b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));
 b.setAttribute('aria-label',on?'ヘッドホンを外して、向かいの席の会話を聞く':'ヘッドホンをつけて、向かいの席の会話を聞こえなくする');
 try{localStorage.setItem(HEADPHONES_KEY,on?'1':'0');}catch{/* private mode: this session only */}
 if(announce)toast(on?'ヘッドホンをつけました。向かいの席の会話は聞こえません。':'ヘッドホンを外しました。');
}
let headphonesSaved=false;try{headphonesSaved=localStorage.getItem(HEADPHONES_KEY)==='1';}catch{/* unavailable */}
setHeadphones(headphonesSaved);
$('headphones').addEventListener('click',()=>setHeadphones(!passengers.muted,true));
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
 // Journey shortcuts wait for the first-visit opening to finish (Esc skips it; see opening-ui).
 if(e.ctrlKey||e.metaKey||e.altKey||document.body.classList.contains('opening-on'))return;const tag=e.target.tagName;if(e.target.closest('#timer-overlay'))return;if(['INPUT','SELECT','TEXTAREA'].includes(tag))return;if(document.querySelector('dialog[open]'))return;
 if(e.code==='Space'&&tag!=='BUTTON'){e.preventDefault();togglePause();}
 else if(e.key.toLowerCase()==='s')stationAction();else if(e.key.toLowerCase()==='h')toggleImmersive();else if(e.key.toLowerCase()==='m')audio.toggle();else if(e.key.toLowerCase()==='f')fullscreen();else if(e.key.toLowerCase()==='p')postcard();else if(e.key==='ArrowRight'){e.preventDefault();startTransition((state.index+1)%worlds.length);}else if(e.key==='ArrowLeft'){e.preventDefault();startTransition((state.index+worlds.length-1)%worlds.length);}else if(e.key==='Escape'&&state.immersive)toggleImmersive();
});
$('app').addEventListener('pointermove',wake,{passive:true});$('window').addEventListener('pointerdown',wake,{passive:true});
document.addEventListener('visibilitychange',()=>{last=0;if(audio.context){audio.updateLevel();if(document.hidden){setTimeout(()=>{if(document.hidden&&audio.context)audio.context.suspend().catch(()=>{});},900);}else if(audio.enabled){audio.context.resume().then(()=>audio.updateLevel()).catch(()=>{});}}});
document.addEventListener('fullscreenchange',()=>{const on=!!document.fullscreenElement;$('fullscreen').setAttribute('aria-label',on?'全画面を終了':'全画面表示');resize();});
// Non-mutating diagnostics are handy when extending the app in a local editor.
Object.defineProperty(window,'NOCTILUCA',{value:Object.freeze({get status(){return{version:VERSION,world:worlds[state.index].name,index:state.index,paused:state.paused,auto:state.auto,speed:state.speed,elapsed:state.elapsed,time:state.time,travel:state.travel,frames:state.frames,station:{...getStopState()},visit:state.currentVisit?.count,variant:state.currentVisit?.variant,transition:state.transition?.to??null,dimensions:[W,HEIGHT],cachedScenes:cache.size,district:DISTRICTS[worlds[state.index].id][journeyScenery().to][0],cachedDistricts:districtCache.size,density:state.density,stationStops:state.stationStops,conversations:talk.status,passengers:{...passengers.status,muted:passengers.muted}};},worlds:worlds.map(p=>Object.freeze({id:p.id,name:p.name}))}),writable:false});

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
 // First-visit opening: the view rolls toward the Kowloon platform while the lines play, then
 // pulls in and stays (the first page of the notebook opens there). Visual only: the saved
 // journey is already at this station, so nothing is sent.
 // With reduced motion the view stays still at the platform and only the lines show.
 beginOpening(){if(reducedMotion){state.stop={phase:'stop',t:0,held:true};updateUI(true);return;}state.stop={phase:'cruise',t:0,held:false};state.paused=false;state.elapsed=0;legActive=false;syncPause();updateUI(true);},
 endOpening(immediate=false){if(state.stop.phase!=='cruise')return;state.stop=immediate?{phase:'stop',t:0,held:true}:{phase:'arrive',t:0,held:true};updateUI(true);},
 // Leave the platform right away (the welcome card shows a journey under way, not a wait).
 startMoving(){
  const s=gateway.snapshot.state;if(!s.displayName||s.narrative?.active||s.location.mode==='station'||s.suspended||gateway.blocked||!['stop','arrive'].includes(state.stop.phase))return;
  state.stop={phase:'depart',t:0,held:false};state.paused=false;state.elapsed=0;beginLeg();if(s.location.atStation)notify('station.depart');syncPause();updateUI(true);
 },
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
resize();talk.init();engine.apply(gateway.snapshot.state,true);passengers.seed(passengerStop());
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
