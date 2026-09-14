// Scene composition: world scene cache, view-only district mixing, parallax
// strip ordering and weather. Receives engine hooks and renderers once.
import {rect,line,mod,smooth,HEIGHT,TILE} from './pixel.js';
import {makeScene,drawStrip,waterSurface,worldLife,lifeClock,scenePositions} from './cityscape.js';
import {drawHovercraft,drawElevatedRail,drawRelayRing} from './sprites.js';
export function createSceneGraph({state,gateway,getStopState,journeyScenery,buildVisit,momentDirectors,districtRenderer,sidequestRenderer,momentRenderer,scrapRenderer,pelagicRenderer,gorgeRenderer,jadeRenderer,relayRenderer,stationScene,districtSurface,districtCtx}){
const cache=new Map(),districtCache=new Map();
function getScene(index,width){const key=index+':'+width;let s=cache.get(key);if(!s){s=makeScene(index,width);cache.set(key,s);}return s;}
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
 if(weather)stationScene.drawStationOverlay(c,s,time,width,stop,v);
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
 else worldLife(c,s,time,travel,width,v,state.density==='quiet');
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
return {cache,districtCache,getScene,getDistrictScene,drawScene,drawCityScene};
}
