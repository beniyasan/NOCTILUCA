// Incidental moments on the three outer planets. Chosen by the shared moment
// director, drawn on the pausable visit clock, never saved or counted.
import {mod,ease,momentEvent as event} from './anim-utils.js';
import {rect,line,ellipse,poly,glow} from './pixel.js';
import {person,robot} from './sprites.js';
import {jelly,submarine,diver,blimp,kite,balloon,bird,ember} from './frontier-scenes.js';

export const ABYSS_MOMENTS=[
 {id:'whale_pass',district:1,anchor:380,duration:48,weight:.6},
 {id:'jelly_bloom',district:0,anchor:300,duration:30,weight:1},
 {id:'porthole_repair',district:0,anchor:526,duration:34,weight:1},
 {id:'sub_return',district:2,anchor:537,duration:36,weight:1},
 {id:'kelp_harvest',district:3,anchor:330,duration:36,weight:1}
];
export const CALDERA_MOMENTS=[
 {id:'lava_fountain',district:0,anchor:400,duration:20,weight:.6},
 {id:'ash_sweep',district:0,anchor:640,duration:34,weight:1},
 {id:'big_pour',district:1,anchor:300,duration:30,weight:1},
 {id:'vent_burst',district:2,anchor:350,duration:26,weight:1},
 {id:'sky_lanterns',district:3,anchor:380,duration:40,weight:1}
];
export const AERIE_MOMENTS=[
 {id:'bird_flock',district:0,anchor:350,duration:22,weight:.7},
 {id:'bridge_lights',district:0,anchor:380,duration:30,weight:1},
 {id:'balloon_release',district:1,anchor:300,duration:28,weight:1},
 {id:'kite_race',district:2,anchor:400,duration:30,weight:1},
 {id:'airship_dock',district:3,anchor:580,duration:44,weight:1}
];

// q is seconds into the moment; a moment that has finished keeps its final state.
const at=(state,id,cell)=>{const e=event(state,id,cell);return e?{q:e.progress*e.duration,done:e.progress>=1}:null;};

export function createFrontierMomentRenderer(){
 // ---- abyss
 function jellyBloom(c,x,t,p,cell,state){
  const e=at(state,'jelly_bloom',cell);if(!e||e.done)return;
  for(let k=0;k<7;k++){const start=k*1.6,f=ease((e.q-start)/20);if(e.q<start)continue;const fade=1-ease((e.q-24)/6);c.globalAlpha=fade;jelly(c,x+300+Math.sin(k*2.1)*70+Math.sin(t*.8+k)*6,400-f*260-k*4,t+k,p,1+k%3*.25,k%2?p.neon:'#9fb8ff');}
  c.globalAlpha=1;
 }
 function portholeRepair(c,x,t,p,cell,state){
  const e=at(state,'porthole_repair',cell);if(!e)return;
  // The dark porthole on the habitat tube comes back on and stays on.
  const px=x+526,py=360,fixed=e.q>=26;
  if(fixed){ellipse(c,px,py,4,4,p.light+'cc');glow(c,px,py,2,2,p.light,6);}
  if(e.done)return;
  const arrive=ease(e.q/8),leave=ease((e.q-28)/6),dx=px-120+arrive*100+leave*140,dy=py-30+arrive*22-leave*60;
  diver(c,dx,dy,t,p,1,e.q>8&&e.q<26);
  if(e.q>8&&e.q<26&&Math.sin(t*12)>.3){glow(c,px-3,py+2,1,1,'#fff1a0',5);}
 }
 function subReturn(c,x,t,p,cell,state){
  const e=at(state,'sub_return',cell);if(!e)return;
  const docked=e.q>=24;
  if(docked){rect(c,x+510,340,54,4,p.accent);}
  if(e.done)return;
  const rise=ease(e.q/14),glide=ease((e.q-14)/10),sx=x+350+glide*180,sy=445-rise*85-glide*10;
  submarine(c,sx,sy,t,p,.55,1);
  for(let k=0;k<4;k++){const f=mod(t*.6+k/4,1);c.globalAlpha=.4*(1-f);ellipse(c,sx-12,sy-6-f*30,1+f*2,1+f*2,p.light);}c.globalAlpha=1;
 }
 function kelpHarvest(c,x,t,p,cell,state){
  const e=at(state,'kelp_harvest',cell);if(!e||e.done)return;
  const reach=ease(e.q/8),carry=ease((e.q-14)/16),hx=x+280+carry*110,hy=330-reach*20+carry*20;
  submarine(c,hx,hy-18,t,p,.5,1,true);line(c,hx+6,hy-12,hx+10,hy+10-reach*4,p.trim,2);
  if(e.q>10&&e.q<30){for(let k=0;k<5;k++)line(c,hx+6+k*2,hy+10,hx+4+k*2+Math.sin(t+k)*2,hy+34,'#3f8a52',2);}
 }
 function whaleBackground(c,s,t,travel,width,state){
  const e=state.active;if(e?.id!=='whale_pass')return;
  const q=e.progress*e.duration,f=q/48,x=e.worldCell*768-travel*8.5+880-f*1300,y=140+Math.sin(f*Math.PI)*20;
  c.save();c.globalAlpha=.55*ease(q/6)*(1-ease((q-42)/6));
  poly(c,[[x-150,y],[x-110,y-22],[x-20,y-30],[x+80,y-20],[x+150,y-6],[x+200,y-18],[x+215,y-4],[x+200,y+10],[x+150,y+8],[x+80,y+22],[x-40,y+26],[x-120,y+16]],'#021a2a');
  poly(c,[[x-20,y+20],[x+10,y+44],[x+30,y+20]],'#021a2a');rect(c,x-120,y-4,3,2,'#6fd6d0');
  c.restore();
 }
 // ---- caldera
 function ashSweep(c,x,t,p,cell,state){
  const e=at(state,'ash_sweep',cell);if(!e)return;
  const swept=ease((e.q-6)/22),left=x+560+swept*160;
  if(!e.done){rect(c,left,406,Math.max(0,x+720-left),3,'#8a8078');for(let k=0;k<6;k++)rect(c,left+k*24,404,8,2,'#a09890');}
  if(e.done)return;
  robot(c,left-4,408,t,p,.9);if(Math.sin(t*6)>0){c.globalAlpha=.3;ellipse(c,left+10,402,8,3,'#b8a8a0');c.globalAlpha=1;}
 }
 function bigPour(c,x,t,p,cell,state){
  const e=at(state,'big_pour',cell);if(!e||e.done)return;
  const pour=e.q>8&&e.q<22,glowAmt=ease((e.q-8)/4)*(1-ease((e.q-22)/8)),cx=x+300;
  rect(c,cx-30,240,60,10,p.near);ellipse(c,cx,262,26,16,'#3a2a26');ellipse(c,cx,254,22,5,'#ffb347');
  if(pour){for(let k=0;k<14;k++)rect(c,cx+20,262+k*8,5,8,k%2?'#ffcf5a':'#ff8a3a');for(let k=0;k<16;k++){const a=mod(t*1.6+k/16,1),ang=-Math.PI*(.15+k/20);rect(c,cx+22+Math.cos(ang)*a*70,380+Math.sin(ang)*a*50+a*a*40,2,2,'#fff1a0');}}
  if(glowAmt>0){c.save();c.globalAlpha=.25*glowAmt;const g=c.createRadialGradient(cx+22,385,5,cx+22,385,160);g.addColorStop(0,'#ffb347');g.addColorStop(1,'#ff4b2b00');c.fillStyle=g;c.fillRect(cx-140,240,330,200);c.restore();}
  person(c,cx-60,408,t,p,{hat:true,action:pour?'work':'idle',coat:'#7a5a44'});
 }
 function ventBurst(c,x,t,p,cell,state){
  const e=at(state,'vent_burst',cell);if(!e||e.done)return;
  const vx=x+350,power=ease((e.q-3)/3)*(1-ease((e.q-16)/10));
  rect(c,vx-10,404,20,4,'#4a2a22');
  if(e.q<4){for(let k=0;k<3;k++){c.globalAlpha=.4;ellipse(c,vx+Math.sin(t*9+k)*3,398-k*4,4,2,'#d9c8c0');}c.globalAlpha=1;}
  for(let k=0;k<18;k++){const f=mod(t*.9+k/18,1);c.globalAlpha=.45*power*(1-f);ellipse(c,vx+Math.sin(t*2+k)*10*f,400-f*300*power,6+f*30,4+f*14,'#e8dcd4');}
  c.globalAlpha=1;
  const back=ease((e.q-3)/2)*(1-ease((e.q-20)/4));person(c,vx-50-back*40,408,t,p,{walk:e.q>3&&e.q<6,dir:-1,hat:true,coat:'#8a6a4a'});
 }
 function skyLanterns(c,x,t,p,cell,state){
  const e=at(state,'sky_lanterns',cell);if(!e||e.done)return;
  for(let k=0;k<9;k++){const start=k*1.8;if(e.q<start)continue;const f=ease((e.q-start)/28),lx=x+300+(k%3)*50+Math.sin(t*.6+k)*10+f*40,ly=345-f*300;c.globalAlpha=1-ease((e.q-34)/6);rect(c,lx-4,ly-6,8,9,'#ffb347');rect(c,lx-3,ly-5,6,5,'#ffe2a0');glow(c,lx,ly,1,1,'#ffd08a',7);}
  c.globalAlpha=1;
 }
 function lavaBackground(c,s,t,travel,width,state){
  const e=state.active;if(e?.id!=='lava_fountain')return;
  const q=e.progress*e.duration,vx=width*.66,power=ease(q/3)*(1-ease((q-14)/6));
  for(let k=0;k<26;k++){const a=mod(t*.7+k/26,1),ang=-Math.PI/2+(k/26-.5)*1.1,v=90*power;const px=vx+Math.cos(ang)*v*a*1.4,py=205+Math.sin(ang)*v*a*2+a*a*140*power;ember(c,px,py,power*(1-a*.5),k%3?'#ffb347':'#ff5a1f');}
 }
 // ---- aerie
 function birdFlock(c,x,t,p,cell,state){
  const e=at(state,'bird_flock',cell);if(!e||e.done)return;
  const f=e.q/22,bx=x+700-f*800;c.globalAlpha=ease(e.q/3)*(1-ease((e.q-19)/3));
  for(let k=0;k<12;k++)bird(c,bx+k*16+(k%3)*5,150+Math.abs(k-6)*6+Math.sin(t+k)*3,t+k*.3);c.globalAlpha=1;
 }
 function bridgeLights(c,x,t,p,cell,state){
  const e=at(state,'bridge_lights',cell);if(!e)return;
  for(let k=0;k<7;k++){if(e.q<4+k*2.5)continue;const lx=x+330+k*16,ly=313-k*3.7;rect(c,lx-1,ly-5,3,3,p.light);glow(c,lx,ly-4,1,1,p.light,6);}
  if(e.done)return;
  if(e.q<22)person(c,x+322+Math.min(1,e.q/22)*116,318-Math.min(1,e.q/22)*26,t,p,{walk:true,coat:'#5a6aa0'});
 }
 function balloonRelease(c,x,t,p,cell,state){
  const e=at(state,'balloon_release',cell);if(!e||e.done)return;
  const cols=['#ff7aa8','#9fe3ff','#ffd07a','#b6ff9a','#c9a2ff'];
  for(let k=0;k<14;k++){const start=2+k*.4;if(e.q<start)continue;const f=ease((e.q-start)/22);balloon(c,x+300+(k%5)*9+Math.sin(t*.7+k)*(4+f*30),320-f*300-(k%3)*6,cols[k%5]);}
  if(e.q<4)person(c,x+300,320,t,p,{action:'work',coat:'#b58a6a'});
 }
 function kiteRace(c,x,t,p,cell,state){
  const e=at(state,'kite_race',cell);if(!e||e.done)return;
  const cols=['#ff5a5a','#5ab0ff','#ffd07a','#b6ff9a'];
  for(let k=0;k<4;k++){const f=ease((e.q-k*.6)/24),kx=x+80+f*620+Math.sin(t*1.3+k)*8,ky=110+k*28+Math.sin(t*2+k)*6;kite(c,kx,ky,t+k,cols[k]);}
 }
 function airshipDock(c,x,t,p,cell,state){
  const e=at(state,'airship_dock',cell);if(!e)return;
  const mx=x+580,f=ease(e.q/34),bx=mx+220-f*214,by=110+f*62;
  if(e.done){blimp(c,mx+6,172,t,p,.7,-1,'ARCA-7');line(c,mx,170,mx+6,172,p.trim);return;}
  blimp(c,bx,by,t,p,.7,-1,'ARCA-7');
  if(e.q>30){line(c,mx,170,bx,by+2,p.trim);}
  if(e.q>34){for(let k=0;k<2;k++)person(c,mx-30+k*20,340,t,p,{action:'work',coat:'#7a86b8'});}
 }
 function draw(c,s,t,travel,width,state={}){
  const p=s.p;if(!['abyss','caldera','aerie'].includes(p.id))return;
  const d=p.district||0,first=Math.floor(travel*8.5/768);
  for(let n=first-1;n<first+Math.ceil(width/768)+1;n++){
   const x=n*768-travel*8.5,cell=mod(n,3),clock=t+cell*11;
   if(p.id==='abyss'){if(d===0){jellyBloom(c,x,clock,p,cell,state);portholeRepair(c,x,clock,p,cell,state);}else if(d===2)subReturn(c,x,clock,p,cell,state);else if(d===3)kelpHarvest(c,x,clock,p,cell,state);}
   else if(p.id==='caldera'){if(d===0)ashSweep(c,x,clock,p,cell,state);else if(d===1)bigPour(c,x,clock,p,cell,state);else if(d===2)ventBurst(c,x,clock,p,cell,state);else skyLanterns(c,x,clock,p,cell,state);}
   else{if(d===0){birdFlock(c,x,clock,p,cell,state);bridgeLights(c,x,clock,p,cell,state);}else if(d===1)balloonRelease(c,x,clock,p,cell,state);else if(d===2)kiteRace(c,x,clock,p,cell,state);else airshipDock(c,x,clock,p,cell,state);}
  }
 }
 function background(c,s,t,travel,width,state={}){
  const p=s.p,d=p.district||0;
  if(p.id==='abyss'&&d===1)whaleBackground(c,s,t,travel,width,state);
  if(p.id==='caldera'&&d===0)lavaBackground(c,s,t,travel,width,state);
 }
 return {draw,background};
}
