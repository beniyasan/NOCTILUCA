// Harbor incidents are local to a visit; installed equipment comes from the save.
import {mod,ease,unit,momentEvent,momentPhase,installedAt} from './anim-utils.js';
export const PELAGIC_MOMENTS=[
 {id:'gangway',district:1,anchor:183,duration:26,weight:1},
 {id:'net_guest',district:3,anchor:477,duration:24,weight:1},
 {id:'seal_test',district:2,anchor:530,duration:26,weight:1},
 {id:'pier_lunch',district:1,anchor:148,duration:30,weight:1},
 {id:'delivery_skiff',district:0,anchor:470,duration:28,weight:1},
 {id:'salt_window',district:0,anchor:407,duration:26,weight:1},
 {id:'lamplit_shoal',district:0,anchor:487,duration:26,weight:1},
 {id:'floating_garden',district:3,anchor:625,duration:28,weight:1},
 {id:'fog_return',district:2,anchor:646,duration:36,weight:.4,requires:'fog'},
 {id:'deep_shadow',district:1,anchor:285,duration:32,weight:.35}
];
export const pelagicEvent=momentEvent;
const phase=momentPhase;
export const pelagicWave=t=>Math.sin(t*.63)*2.1+Math.sin(t*.27)*1.2;
export function pelagicDockPose(t,state,cell){
 const q=phase(state,'gangway',cell),l=phase(state,'pier_lunch',cell),b=phase(state,'deep_shadow',cell);
 const wake=(l>=8&&l<20?Math.sin((l-8)*2)*Math.sin((l-8)/12*Math.PI)*2.5:0)+(b>=22&&b<32?Math.sin((b-22)*1.5)*Math.sin((b-22)/10*Math.PI)*1.8:0);
 const loaded=q<0?0:ease((q-14)/6)*2;
 return {pierY:342+pelagicWave(t-.8)+wake*.65,boatY:350+pelagicWave(t)+loaded+wake,
  boatX:234+(q<0?180:180*(1-ease(q/7))),roll:(pelagicWave(t)-pelagicWave(t-.5))*.02+wake*.008};
}
export function createPelagicMomentRenderer(a){
 const {rect,line,ellipse,poly,person,crate}=a;
 const installed=installedAt('pelagic');
 const worker=(c,x,y,t,p,walk=false,action='work')=>person(c,x,y,t,p,{walk,action,hat:true,coat:'#93a9a2'});
 function fish(c,x,y,p,dir=1){rect(c,x-2,y,5,2,p.accent+'bb');line(c,x-3*dir,y-1,x-3*dir,y+3,p.light+'99');}
 function wake(c,x,y,t,p,strength=1){
  for(let k=0;k<3;k++){const f=mod(t*.18+k/3,1);c.save();c.globalAlpha=(1-f)*.16*strength;ellipse(c,x,y+f*5,15+f*28,1+f*3,p.accent);c.restore();}
 }
 function boat(c,x,y,t,p,scale=1){
  c.save();c.translate(x,y);c.rotate(Math.sin(t*.63)*.014);c.scale(scale,scale);
  poly(c,[[-35,0],[36,0],[26,12],[-24,12]],'#142d3c');line(c,-35,0,36,0,p.trim,2);
  rect(c,-14,-18,30,18,'#46666c');rect(c,-9,-15,14,8,p.light+'99');line(c,10,-18,10,-34,p.trim,2);
  rect(c,9,-34,3,3,p.light);c.restore();
 }
 function net(c,x,y,w,h,p){
  line(c,x,y,x+w,y,p.trim,2);
  for(let k=0;k<=5;k++)line(c,x+k*w/5,y,x+w*.13+k*w*.75/5,y+h,p.accent+'66');
  for(let k=1;k<=4;k++)line(c,x+k*2,y+k*h/4,x+w-k*2,y+k*h/4,p.trim+'99');
 }
 function mug(c,x,y,p){rect(c,x-2,y-5,5,5,p.light);line(c,x+3,y-4,x+5,y-3,p.trim);}
 function seated(c,x,y,t,p,action='idle'){
  person(c,x,y-4,t,p,{action,coat:'#91aaa5',scale:.8});line(c,x-2,y-10,x+8,y-10,p.trim,3);line(c,x+8,y-10,x+8,y+1,p.near,2);
 }
 function dock(c,x,t,p,cell,state){
  const q=phase(state,'gangway',cell),l=phase(state,'pier_lunch',cell),b=phase(state,'deep_shadow',cell),pose=pelagicDockPose(t,state,cell);
  const {pierY,boatY,boatX,roll}=pose;
  if(installed(state,'tide_seat')){
   // This ledge is fixed to the shore, separate from the moving pontoon.
   rect(c,x+34,330,50,5,p.trim);line(c,x+39,335,x+39,389,p.near,4);line(c,x+75,335,x+75,389,p.near,4);
   const folded=q>=0&&q<26||mod(t,67)<23;
   if(folded){line(c,x+53,310,x+58,330,p.trim,3);line(c,x+59,310,x+55,330,p.light,2);rect(c,x+52,309,9,4,'#829e92');}
   else{rect(c,x+47,318,19,3,'#829e92');line(c,x+49,321,x+63,330,p.trim,2);line(c,x+63,321,x+49,330,p.trim,2);if(mod(t,67)<49)seated(c,x+55,330,t,p,'idle');}
  }
  if(q>=0){
   const laid=ease((q-6)/5),boardX=182+(boatX-32-182)*laid,boardY=pierY+(boatY-pierY)*laid-Math.sin(laid*Math.PI)*12;
   line(c,x+167,pierY-1,x+boardX,boardY-1,'#7f9990',4);
   for(let k=0;k<5;k++){const f=k/5;line(c,x+167+(boardX-167)*f,pierY+(boardY-pierY)*f-2,x+167+(boardX-167)*f+1,pierY+(boardY-pierY)*f+2,p.near);}
   if(q<12){worker(c,x+172,pierY,t,p);line(c,x+175,pierY-15,x+boardX,boardY-2,p.light);}
   const cross=ease((q-12)/8);
   if(q>=10&&q<20){const xx=147+cross*(boatX-147),yy=cross<.3?pierY:pierY+(boatY-pierY)*unit((cross-.3)/.7);
    person(c,x+xx,yy,t,p,{walk:q>=12,carry:true,coat:'#b0a790'});
   }else if(q>=20){c.save();c.translate(x+boatX,boatY);c.rotate(roll);crate(c,-27,-13,13,12,p);seated(c,-20,0,t,p);c.restore();}
  }
  if(l>=0){
   const arrive=ease(l/4),xx=x+120+arrive*20;
   if(l<4)worker(c,xx,pierY,t,p,true);else seated(c,x+140,pierY,t,p,l>=24?'idle':'drink');
   rect(c,x+150,pierY-2,11,3,'#b0ab92');
   if(l<24)rect(c,x+151,pierY-6,8,3,p.light);
   mug(c,x+166,pierY-1,p);
   if(l>=8&&l<20)line(c,x+143,pierY-15,x+164,pierY-5,p.light,2);
   // A passing boat causes the wave that reaches the floating deck.
   if(l>=4&&l<18){const u=(l-4)/14;boat(c,x+455-u*545,382+pelagicWave(t),t,p,.55);wake(c,x+455-u*545,390,t,p);}
  }
  if(b>=0&&b<32&&q<0&&l<0){worker(c,x+174,pierY,t,p,false,b<15?'idle':'work');if(b>=5&&b<11)line(c,x+173,pierY-18,x+169,pierY-11,p.trim);}
 }
 function shop(c,x,t,p,cell,state){
  const d=phase(state,'delivery_skiff',cell),w=phase(state,'salt_window',cell),f=phase(state,'lamplit_shoal',cell);
  rect(c,x+360,338,185,6,p.trim);for(const dx of [366,449,535])line(c,x+dx,344,x+dx,395,p.near,4);
  rect(c,x+361,272,131,65,'#173f4d');poly(c,[[x+355,272],[x+491,272],[x+499,280],[x+354,280]],'#3d6970');
  rect(c,x+373,287,65,41,'#57746b');rect(c,x+449,284,32,54,p.near);
  person(c,x+389,328,t,p,{action:'drink',scale:.8,coat:'#99a69a'});rect(c,x+383,316,28,3,p.trim);
  const scraper=installed(state,'salt_scraper'),windowEvent=pelagicEvent(state,'salt_window',cell);
  const age=windowEvent?Math.max(0,t-cell*13-windowEvent.start-windowEvent.duration):0;
  const clear=w<0?0:ease((w-5)/14)*(1-unit(age/240)*.7);
  if(installed(state,'wave_cups')){rect(c,x+412,321,22,3,p.trim);rect(c,x+418,310,10,11,'#8ba8a2');ellipse(c,x+423,310,6,2,p.light);line(c,x+428,314,x+432,316,p.light,2);}
  if(scraper){line(c,x+443,317,x+443,329,'#829e92',2);line(c,x+440,316,x+446,316,'#c4d8ce',2);}

  c.save();c.globalAlpha=.4*(1-clear);rect(c,x+374,288,63,38,'#c7d8cc');c.restore();
  // Wiping reveals a growing strip; the remainder stays salty during the pass.
  if(w>=5&&w<19){c.save();c.globalAlpha=.2;rect(c,x+374+clear*63,288,(1-clear)*63,38,'#d6e0ce');c.restore();}
  if(!scraper){rect(c,x+374,288,3,38,'#c7d8cc66');rect(c,x+434,288,3,38,'#c7d8cc66');}
  line(c,x+404,287,x+404,328,p.trim,2);line(c,x+373,307,x+438,307,p.trim);
  if(w>=0&&w<25){
   const xx=x+452-ease(w/5)*21+ease((w-21)/4)*21,tip=x+(scraper?375:380)+ease((w-5)/14)*(scraper?61:49);
   worker(c,xx,338,t,p,w<5||w>21);
   if(w>=4&&w<22){line(c,xx-2,324,tip,295+Math.sin(w*1.5)*7,p.trim,2);line(c,tip-(scraper?2:4),295+Math.sin(w*1.5)*7,tip+(scraper?2:4),295+Math.sin(w*1.5)*7,scraper?'#c4d8ce':p.light,2);}
  }
  if(w>=19)for(let k=0;k<4;k++){const age=mod(t*.12+k*.25,1);rect(c,x+378+k*14,324+age*11,1,3,p.light+'77');}
  line(c,x+492,287,x+515,287,p.trim,2);rect(c,x+511,287,9,5,p.light);
  for(let k=0;k<8;k++)line(c,x+497-k*2+Math.sin(t*.7+k)*2,360+k*6,x+524+k*2,360+k*6,p.light+'33');
  rect(c,x+477,283,5,4,d>=0&&d<24?p.accent:'#315864');
  if(d>=0){
   const xx=d<8?610-ease(d/8)*99:d<21?511:511-ease((d-21)/7)*201,yy=361+pelagicWave(t);
   if(d<28){
    boat(c,x+xx,yy,t,p,.6);wake(c,x+xx,yy+9,t,p);
    if(d<10||d>=19)crate(c,x+xx-5,yy-7,10,7,p);
   }
   if(d<25){worker(c,x+488,338,t,p);if(d>=7&&d<21)line(c,x+491,324,x+xx-3,yy-4,p.trim,2);}
   // Full basket goes ashore; the same empty basket is returned.
   if(d>=9&&d<19){const lift=ease((d-9)/5),back=ease((d-16)/3),bx=511-lift*11+back*11,by=yy-8-lift*29+back*29;
    crate(c,x+bx,by,11,8,p);
   }
   if(d>=14)crate(c,x+468,325,15,12,p);
  }
  if(f>=0&&f<26){
   const scatter=ease((f-8)/5)*(1-ease((f-18)/7)),entry=ease(f/5);
   for(let k=0;k<16;k++){
    const side=k%2?1:-1,xx=x+485+k%5*6+(1-entry)*-100+scatter*side*(33+k*2),yy=386+Math.sin(t*1.2+k*.4)*3+Math.floor(k/5)*5+scatter*(k%3-1)*9;
    c.save();c.globalAlpha=ease(f/2)*ease((26-f)/3);fish(c,xx,yy,p,side);c.restore();
   }
   if(f>=7&&f<18){const xx=x+365+ease((f-7)/11)*225;ellipse(c,xx,389,22,4,'#102e3a99');boat(c,xx,357+pelagicWave(t),t,p,.48);}
  }
 }
 function repairQuay(c,x,t,p,cell,state){
  const q=phase(state,'seal_test',cell),b=phase(state,'fog_return',cell);
  rect(c,x+441,389,260,7,p.trim);for(const dx of [459,566,687])line(c,x+dx,396,x+dx,430,p.near,4);
  if(installed(state,'lunch_tags')){
   const phase=mod(t,83),selected=Math.floor(t/83)%2,carrying=phase>=9&&phase<22;
   const xx=x+443+ease(phase/7)*30-ease((phase-13)/9)*30;
   const bag=(bx,by,k)=>{rect(c,bx,by-10,11,10,k?'#658a86':'#a59a78');line(c,bx+2,by-10,bx+3,by-14,p.trim);line(c,bx+3,by-14,bx+8,by-14,p.trim);line(c,bx+8,by-14,bx+9,by-10,p.trim);if(k)poly(c,[[bx+5,by-9],[bx+8,by-4],[bx+2,by-4]],'#71c7bc');else ellipse(c,bx+5,by-6,3,3,'#dfcb8a');};
   for(let k=0;k<2;k++)if(!carrying||selected!==k)bag(x+465+k*17,386,k);
   if(phase<22){worker(c,xx,389,t,p,phase<7||phase>=13);if(phase>=7&&phase<9)line(c,xx+2,374,x+470+selected*17,378,p.light);if(carrying)bag(xx+5,381,selected);}
  }
  rect(c,x+492,362,83,4,p.trim);line(c,x+499,366,x+499,389,p.trim,2);line(c,x+568,366,x+568,389,p.trim,2);
  rect(c,x+522,342,33,20,'#285b6799');rect(c,x+524,349,29,12,p.accent+'33');line(c,x+522,342,x+555,342,p.light);
  const dip=q<0?0:ease((q-6)/4)*(1-ease((q-13)/4)),across=q<0?0:ease((q-5)/4)*(1-ease((q-17)/5));
  const cx=x+505+across*32,cy=353+dip*5-(across-dip)*12;
  rect(c,cx-7,cy-10,15,11,'#6d9a9888');rect(c,cx-3,cy-7,6,4,p.light);
  const shut=q>=4&&q<18;line(c,cx-8,cy-11,cx+7,cy-11-(shut?0:8),p.trim,2);
  const wx=x+566-(q<0?0:ease(q/4)*43)+across*31;
  worker(c,wx,389,t,p,q>=0&&q<4);
  if(q>=4&&q<23){line(c,wx-3,374,cx+7,cy-6,p.trim,2);if(q>=19)rect(c,cx+5,cy-3,9,4,'#b4c5b5');}
  if(q>=17)for(let k=0;k<4;k++)ellipse(c,x+510+k*11,361,2,1,p.accent+'88');
  if(q>=10&&q<14)for(let k=0;k<3;k++)ellipse(c,x+528+k*8,347+Math.sin(t+k),2,1,p.accent+'66');
  line(c,x+637,389,x+637,416,p.trim,3);
  if(b>=0){
   const f=ease((b-2)/17),xx=x+816-f*151,yy=408+pelagicWave(t),on=b<22;
   worker(c,x+638,389,t,p,false,b>=23?'work':'idle');
   if(on){line(c,x+640,374,x+644,359,p.trim,2);rect(c,x+642,356,4,6,p.light);}
   // Lamps precede the hull in the local bank of fog.
   if(b>=1){
    c.save();c.globalAlpha=ease((b-5)/12);boat(c,xx,yy,t,p,1.05);c.restore();
    rect(c,xx-23,yy-10,3,3,p.light);rect(c,xx+20,yy-10,3,3,p.light);
    if(b>=19)line(c,x+637,389,xx-28,yy,p.trim);
   }
   if(b<22)for(let k=0;k<5;k++){c.save();c.globalAlpha=.2*(1-ease((b-13)/9));ellipse(c,x+680+k*36+Math.sin(t*.15+k)*9,386+k%2*20,63,12,'#a9cfcd');c.restore();}
   if(b>=22){const lift=ease((b-22)/8);crate(c,xx-6-lift*36,yy-13-lift*(yy-390),14,12,p);if(b>=30)crate(c,x+607,376,16,12,p);}
  }
 }
 function inlet(c,x,t,p,cell,state){
  const q=phase(state,'net_guest',cell),g=phase(state,'floating_garden',cell);
  rect(c,x+434,328,218,5,p.trim);line(c,x+441,333,x+441,370,p.near,3);line(c,x+597,333,x+597,370,p.near,3);
  const fold=q<0?0:ease((q-15)/7);
  line(c,x+445,290,x+445,328,p.trim,2);line(c,x+496,290,x+496,328,p.trim,2);line(c,x+445,291,x+496,291,p.trim);
  net(c,x+448,295+fold*24,45,30*(1-fold)+3,p);
  worker(c,x+480,328,t,p);
  if(q>=0&&q<14){line(c,x+477,313,x+460+ease(q/7)*26,309,p.light,2);}
  if(q>=6&&q<19){
   const f=ease((q-10)/7),xx=x+486+f*17,yy=308+f*51;
   c.save();c.globalAlpha=q<15?1:1-ease((q-15)/4);ellipse(c,xx,yy,2,3,p.accent);line(c,xx-3,yy,xx+3,yy,p.light);c.restore();
   if(q>=14)wake(c,x+503,359,t,p,.7);
  }
  // A freshwater herb raft is tied beside the marine growing pens.
  const by=353+pelagicWave(t+2),turn=g<0?0:ease((g-9)/5)*.09,tilt=g<0?.1:.1-turn;
  line(c,x+622,330,x+652,by,p.trim);
  c.save();c.translate(x+646+Math.sin(t*.18)*4,by);c.rotate(tilt+Math.sin(t*.5)*.015);
  ellipse(c,0,4,25,5,p.near);rect(c,-26,0,52,4,'#698b82');
  for(let k=0;k<3;k++){
   const xx=-17+k*17;poly(c,[[xx-6,-11],[xx+6,-11],[xx+4,-1],[xx-4,-1]],'#8b8271');
   const cut=g>=20&&k===1;line(c,xx,-11,xx,-20+(cut?5:0),p.accent,2);
   if(!cut){ellipse(c,xx-4,-17,4,2,'#74bd9c');ellipse(c,xx+4,-19,4,2,'#9cd2a2');}
  }c.restore();
  if(g>=0){
   const xx=x+602+ease(g/5)*24-ease((g-22)/6)*40;
   if(g<28){worker(c,xx,328,t,p,g<5||g>22);if(g>=4&&g<19){rect(c,xx+7,311,9,8,p.trim);line(c,xx+16,313,xx+23,310,p.trim,2);}
    if(g>=5&&g<11)for(let k=0;k<6;k++){const f=mod(t*1.5+k/6,1);rect(c,xx+23+f*8,310+f*31,1,2,p.light+'aa');}
    if(g>=12&&g<21)line(c,xx+2,312,x+645,by-14,p.light,2);
    if(g>=20){line(c,xx+8,319,xx+10,311,p.accent,2);ellipse(c,xx+12,314,3,2,p.accent);}
   }
  }
 }
 function draw(c,s,t,travel,width,state={}){
  const p=s.p;if(p.id!=='pelagic')return;
  const first=Math.floor(travel*8.5/768);
  for(let n=first-1;n<first+Math.ceil(width/768)+1;n++){
   const x=n*768-travel*8.5,cell=mod(n,3),clock=t+cell*13;
   if(p.district===1)dock(c,x,clock,p,cell,state);
   else if(p.district===2)repairQuay(c,x,clock,p,cell,state);
   else if(p.district===3)inlet(c,x,clock,p,cell,state);
   else shop(c,x,clock,p,cell,state);
  }
 }
 return {draw};
}
