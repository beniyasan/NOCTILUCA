// Unmanned work shares the pausable visit clock; its traces never become save flags.
import {mod,ease,unit,momentEvent as event,momentPhase as phase} from './anim-utils.js';
export const RELAY_MOMENTS=[
 {id:'empty_carrier',district:2,anchor:552,duration:38,weight:1},
 {id:'aligned_handoff',district:2,anchor:183,duration:34,weight:1},
 {id:'thermal_shutters',district:3,anchor:565,duration:44,weight:1},
 {id:'dish_inspection',district:1,anchor:92,duration:32,weight:1},
 {id:'cable_retract',district:0,anchor:584,duration:38,weight:1},
 {id:'sensor_clean',district:1,anchor:294,duration:32,weight:1},
 {id:'charging_turn',district:0,anchor:350,duration:35,weight:1},
 {id:'bay_label',district:2,anchor:362,duration:34,weight:1},
 {id:'distant_freighter',district:1,anchor:548,duration:55,weight:.35},
 {id:'wing_glint',district:3,anchor:203,duration:35,weight:.35}
];

export function relayCarrierPose(progress){
 const q=progress*38;
 return {x:q<17?478+ease(q/17)*182:q<24?660:660-ease((q-24)/14)*182,
  loaded:q<21,stored:q>=21,hidden:q>=15&&q<26};
}
export function relayHandoffPose(progress){
 const q=progress*34;
 return {x:q<8?134+ease(q/8)*43:q<13?177-ease((q-8)/5)*19:q<20?158:158+ease((q-20)/7)*48,
  angle:ease((q-14)/5)*Math.PI/2,received:q>=27,
  leftExtension:q<8?ease(q/8):q<13?1-ease((q-8)/5)*.44:q<20?.56:q<27?.56+ease((q-20)/7)*1.12:1.68*(1-ease((q-28)/6))};
}
export function relayCablePose(progress){
 const q=progress*38,retracted=ease((q-3)/17),locked=q>=24;
 return {retracted,slack:Math.sin(Math.PI*retracted)*16+Math.sin(Math.PI*ease((q-9)/7))*8,
  locked,departure:locked?ease((q-27)/11):0};
}
export function createRelayMomentRenderer(a){
 const {rect,line,ellipse,poly}=a;
 const rail=(c,x,y,w,p)=>{rect(c,x,y,w,5,p.mid);line(c,x,y,x+w,y,p.trim,2);for(let k=0;k<w;k+=23)line(c,x+k,y+2,x+k+8,y+7,p.trim);};
 function pod(c,x,y,p,size=1){
  c.save();c.translate(x,y);c.scale(size,size);
  poly(c,[[-13,-5],[-8,-9],[9,-9],[14,-4],[14,5],[7,8],[-10,7],[-13,3]],'#697585');
  rect(c,-8,-5,16,7,'#26394c');rect(c,7,-3,3,2,p.accent);line(c,-7,9,7,9,p.trim,2);c.restore();
 }
 function box(c,x,y,p,angle=0){
  c.save();c.translate(x,y);c.rotate(angle);rect(c,-11,-8,22,16,'#89828c');rect(c,-9,-6,18,12,'#4e566a');
  line(c,-5,-7,-5,7,p.trim,2);rect(c,3,-5,5,3,p.light);c.restore();
 }
 function carrier(c,x,t,p,cell,state){
  const e=event(state,'empty_carrier',cell),pose=relayCarrierPose(e?.progress??0),returns=state.quests?.empty_count?.installed.includes('relay');
  rail(c,x+462,356,268,p);rect(c,x+639,292,99,65,'#273044');rect(c,x+648,308,43,48,'#0d1729');
  rect(c,x+697,300,34,41,'#121d30');line(c,x+697,321,x+731,321,p.trim,2);
  if(returns?!pose.stored:pose.stored)box(c,x+714,312,p);
  if(returns){rect(c,x+550,304,83,19,'#152237');c.save();c.fillStyle=p.light;c.font='8px sans-serif';c.fillText('積載 0／回収箱 1',x+553,316);c.restore();}
  if(!pose.hidden){
   const xx=x+pose.x;rect(c,xx-18,346,36,6,'#738093');rect(c,xx-13,353,5,3,p.near);rect(c,xx+8,353,5,3,p.near);
   rect(c,xx-14,348,3,2,p.accent);if(returns?!pose.loaded:pose.loaded)box(c,xx,337,p);
  }
  // The doorway occludes the moving load before the shelf receives it.
  rect(c,x+638,292,10,64,'#3a4357');rect(c,x+689,292,8,64,'#3a4357');
 }
 function handoff(c,x,t,p,cell,state){
  const e=event(state,'aligned_handoff',cell),q=e?e.progress*34:-1,h=relayHandoffPose(e?.progress??0),padded=state.quests?.quiet_landing?.installed.includes('relay');
  rail(c,x+99,324,157,p);rect(c,x+105,284,18,40,'#4b566a');rect(c,x+230,284,18,40,'#4b566a');
  const tip=134+h.leftExtension*43;
  line(c,x+114,299,x+tip,299,p.trim,5);if(!h.received)line(c,x+tip,299,x+h.x-13,290,p.trim,3);
  if(!h.received)box(c,x+h.x,290,p,h.angle);
  if(padded){rect(c,x+216,316,24,3,'#a9a69b');line(c,x+216,319,x+240,319,p.trim);}
  if(h.received){const f=ease((q-28)/6),settle=padded?Math.sin(f*Math.PI)*.7:0;box(c,x+206+f*20,290+f*13+settle,p,Math.PI/2);}
  const receive=q<20?0:ease((q-20)/7)*(1-ease((q-28)/6));
  line(c,x+239,303,x+229-receive*9,291,p.trim,4);
  // Vertical jaws accept the rotated long edge; contact precedes the receipt lamp.
  line(c,x+217,278,x+225,278,p.accent,2);line(c,x+217,302,x+225,302,p.accent,2);
  rect(c,x+235,288,4,3,q>=27&&q<30?p.light:'#343b50');
 }
 function shutters(c,x,t,p,cell,state){
  const q=phase(state,'thermal_shutters',cell);
  rect(c,x+460,304,279,54,'#19283e');rail(c,x+451,362,295,p);
  for(let k=0;k<6;k++){
   const xx=x+471+k*43,f=q<0?0:ease((q-3-k*5)/(k===5?13:8));
   line(c,xx+18,307,xx+18,356,'#887487',3);rect(c,xx+12,308,3,45,p.light+'55');
   rect(c,xx,298,36,4,p.trim);rect(c,xx,302,36,f*55,'#525669');line(c,xx+1,302+f*55,xx+35,302+f*55,'#9a8994');
   for(let j=0;j<4;j++)if(f*55>j*12+5)line(c,xx+3,307+j*12,xx+33,307+j*12,p.trim);
   if(f<1)poly(c,[[xx+3,358],[xx+32,358],[xx+38,370],[xx+9,370]],p.light+'18');
  }
 }
 function inspection(c,x,t,p,cell,state){
  const q=phase(state,'dish_inspection',cell);if(q<0||q>=32)return;
  // Same pivot and visit offset as the authored dish; the machine disappears behind it.
  const clock=mod(t,60),angle=clock<10?-.2+ease(clock/10)*.32:clock<39?.12:.12-ease((clock-39)/12)*.32;
  c.save();c.translate(x+90,235);c.rotate(angle);
  if(q<7){const f=ease(q/7);pod(c,-108+f*42,47-f*53,p,.55);}
  else if(q<23){
   const f=(q-7)/16,xx=-62+f*124,yy=xx*xx/230-1;
   c.save();c.globalAlpha=Math.sin(Math.PI*f)*.55;ellipse(c,xx,yy,8,3,p.accent);line(c,xx-8,yy,xx+8,yy,p.light);c.restore();
  }else{const f=ease((q-23)/9);c.save();c.globalAlpha=1-ease((q-29)/3);pod(c,66+f*41,-6+f*52,p,.55);c.restore();}
  c.restore();
 }
 function sensor(c,x,t,p,cell,state){
  const q=phase(state,'sensor_clean',cell);
  rect(c,x+270,295,59,47,'#525e72');rect(c,x+275,300,49,32,'#101d31');
  line(c,x+295,343,x+295,378,p.trim,3);
  const passes=q<0?0:Math.min(4,Math.floor(Math.max(0,q-3)/6)),elapsed=Math.max(0,q-3-passes*6),f=q<0?0:ease(elapsed/4),back=ease((elapsed-4)/2),moving=q>=3&&q<27;
  for(let k=0;k<4;k++){
   const clean=k<passes?1:k===passes?f:0;
   rect(c,x+277+k*11,302,10,28,'#a3a8b83c');
   if(clean){rect(c,x+277+k*11,302,10,28*clean,'#14243d');rect(c,x+280+k*11,306+k%2*9,1,1,clean>.55?p.accent:'#788399');}
  }
  const dock=q>=27?ease((q-27)/4):1,approach=q<0?0:ease(q/3);
  const yy=moving?302+(f-back)*28:q<3?337-approach*35:302+dock*35,xx=moving?x+277+(passes+back)*11:q<3?x+301-approach*24:x+321-dock*20;
  rect(c,xx,yy,10,3,'#a5a5b1');line(c,x+326,337,xx+5,yy+2,p.trim);
 }
 function charging(c,x,t,p,cell,state){
  const q=phase(state,'charging_turn',cell);
  // Elevated service balcony stays visible above the station foreground.
  rail(c,x+279,264,168,p);
  for(let k=0;k<2;k++){rect(c,x+297+k*102,238,19,25,'#303c50');rect(c,x+303+k*102,241,5,3,k===0&&q<0?p.accent:'#505469');}
  const first=q<0?0:ease((q-2)/12),xx=x+305+first*102;
  pod(c,xx,251,p,.75);
  if(q>=17){const f=ease((q-17)/13);pod(c,x+260+f*45,220+f*31,p,.75);}
  if(q>=30)rect(c,x+303,241,5,3,Math.sin(t*1.3)>.1?p.accent:'#505469');
  line(c,x+290,265,x+290,320,p.trim,3);line(c,x+431,265,x+431,320,p.trim,3);
 }
 function cable(c,x,t,p,cell,state){
  const e=event(state,'cable_retract',cell),q=e?e.progress*38:-1,h=relayCablePose(e?.progress??0);
  rect(c,x+477,224,50,46,'#354256');rect(c,x+494,233,26,27,'#152238');
  ellipse(c,x+508,246,9,9,p.trim);ellipse(c,x+508,246,5,5,p.near);
  line(c,x+492,270,x+492,321,p.trim,3);line(c,x+514,270,x+514,321,p.trim,3);
  if(h.retracted<1){
   const end=592-(592-516)*h.retracted;
   let prev=[x+516,246];for(let k=1;k<=12;k++){const f=k/12,pt=[x+516+(end-516)*f,246+Math.sin(f*Math.PI)*h.slack];line(c,...prev,...pt,'#a2a2b6',2);prev=pt;}
   rect(c,x+end-2,243,5,6,p.accent);
  }
  rect(c,x+516,242,5,8,h.locked?'#a3a0b0':'#323a50');
  if(h.departure<1){
   c.save();c.globalAlpha=1-ease((h.departure-.75)/.25);const xx=x+621+h.departure*122,yy=246-h.departure*73;
   pod(c,xx,yy,p,2);if(q>=27&&q<32)poly(c,[[xx-28,yy-3],[xx-38,yy],[xx-28,yy+3]],p.accent+'aa');c.restore();
  }
 }
 function label(c,x,t,p,cell,state){
  const q=phase(state,'bay_label',cell),take=q<0?0:ease((q-4)/5),replace=q<0?0:ease((q-16)/7);
  const plate=(xx,yy,fresh)=>{rect(c,xx-16,yy-6,32,12,fresh?'#b9acb1':'#57566b');for(let k=0;k<4;k++)rect(c,xx-12+k*6,yy-3,3,6,fresh?'#30384b':'#7e748477');};
  // Replace one existing BAY sign; the surrounding panels remain worn.
  rect(c,x+346,336,61,17,'#20283a');
  if(q<9)plate(x+371-take*20,344+take*22,false);
  else if(q<15){const f=ease((q-9)/6);plate(x+351+f*64,366+f*17,false);}
  if(q>=15)plate(x+415-replace*44,365-replace*21,true);
  rect(c,x+406,383,23,15,'#30374b');rect(c,x+407,382,21,3,p.trim);
  if(q>=15)line(c,x+411,385,x+425,385,'#777081');
  const arm=q<0?0:q<9?take:q<16?1:1-replace;
  line(c,x+432,372,x+410,354,p.trim,4);
  if(q>=24){const f=ease((q-24)/6);line(c,x+410,354,x+371+f*55,344+f*2,p.trim,3);}
  else line(c,x+410,354,x+371-arm*20,344+arm*22,p.trim,3);
 }
 function glint(c,x,t,p,cell,state){
  const q=phase(state,'wing_glint',cell);if(q<0||q>=35)return;
  // Follow the exact pitch and clock of the existing collection wings.
  const h=26+Math.sin(t*.09)*15;
  for(let k=0;k<4;k++){
   const f=unit((q-3-(3-k)*5)/9),alpha=Math.sin(f*Math.PI)*.75,xx=x+5+k*103;
   if(alpha<=0)continue;c.save();c.globalAlpha=alpha;
   line(c,xx,275-h,xx+92,275-h,p.light,2);line(c,xx+92,275-h,xx+92,275+h,p.accent,2);
   line(c,xx+4,275-h+2,xx+88,275-h+2,'#fff0e3');c.restore();
  }
 }
 function background(c,s,t,travel,width,state={}){
  if(s.p.id!=='relay'||s.p.district!==1)return;
  const e=state.active;if(e?.id!=='distant_freighter')return;
  const q=e.progress*e.duration,f=ease(q/55),x=e.worldCell*768-travel*8.5+400+f*263,y=131-f*7,p=s.p;
  c.save();c.globalAlpha=ease(q/7)*(1-ease((q-46)/9));
  poly(c,[[x-114,y-4],[x-92,y-12],[x+62,y-12],[x+87,y-7],[x+117,y-4],[x+117,y+6],[x+69,y+10],[x-93,y+10],[x-114,y+4]],'#0c1122');
  for(let k=0;k<7;k++){rect(c,x-78+k*22,y-14,16,25,'#181c31');line(c,x-77+k*22,y-13,x-65+k*22,y-13,'#494058');}
  rect(c,x+110,y-2,2,2,p.light);rect(c,x-111,y,2,2,p.accent);rect(c,x-4,y-15,2,2,p.accent+'99');
  c.restore();
 }
 function draw(c,s,t,travel,width,state={}){
  const p=s.p;if(p.id!=='relay')return;
  const first=Math.floor(travel*8.5/768);
  for(let n=first-1;n<first+Math.ceil(width/768)+1;n++){
   const x=n*768-travel*8.5,cell=mod(n,3),clock=t+cell*(p.district===1?13:11);
   if(p.district===1){inspection(c,x,clock,p,cell,state);sensor(c,x,clock,p,cell,state);}
   else if(p.district===2){carrier(c,x,clock,p,cell,state);handoff(c,x,clock,p,cell,state);label(c,x,clock,p,cell,state);}
   else if(p.district===3){shutters(c,x,clock,p,cell,state);glint(c,x,clock,p,cell,state);}
   else{charging(c,x,clock,p,cell,state);cable(c,x,clock,p,cell,state);}
  }
 }
 return {draw,background};
}
