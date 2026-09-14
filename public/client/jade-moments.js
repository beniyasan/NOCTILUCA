// Plants, neighbors and water share the pausable visit clock. No story flags.
import {mod,ease,unit,momentEvent as event,momentPhase as phase} from './anim-utils.js';
export const JADE_MOMENTS=[
 {id:'guided_vine',district:1,anchor:146,duration:30,weight:1},
 {id:'selective_water',district:2,anchor:562,duration:35,weight:1},
 {id:'seed_exchange',district:0,anchor:523,duration:30,weight:1},
 {id:'leaf_bookmark',district:1,anchor:475,duration:29,weight:1},
 {id:'occupied_pot',district:2,anchor:682,duration:32,weight:1},
 {id:'leaf_boat',district:3,anchor:168,duration:36,weight:1},
 {id:'plant_wrapping',district:0,anchor:648,duration:35,weight:1},
 {id:'root_walkway',district:1,anchor:311,duration:34,weight:1},
 {id:'leaf_waterfall',district:3,anchor:602,duration:31,weight:.4,requires:'wetLeaves'},
 {id:'night_bloom',district:2,anchor:220,duration:40,weight:.35}
];

export function jadeWaterPose(progress){
 const q=progress*35;
 const x=q<4?488+ease(q/4)*42:q<10?530:q<14?530+ease((q-10)/4)*50:q<18?580:q<22?580+ease((q-18)/4)*50:q<28?630:630-ease((q-28)/7)*142;
 return {x,wateringPot:q>=6&&q<10?0:q>=24&&q<28?2:null,
  inspectingPot:q>=4&&q<6?0:q>=14&&q<18?1:q>=22&&q<24?2:null,
  wetted:[q>=6,q>=24]};
}
export function jadeLeafDrops(progress){
 const q=progress*31;
 return [4,10,16].map((start,i)=>({leaf:i,progress:unit((q-start)/2),falling:q>=start&&q<start+2,landed:q>=start+2}));
}
export function createJadeMomentRenderer(a){
 const {rect,line,ellipse,poly,person,crate}=a;
 const worker=(c,x,y,t,p,walk=false,action='work')=>person(c,x,y,t,p,{walk,action,hat:true,coat:'#91ac8b'});
 function leaf(c,x,y,w,p,angle=0,color='#84ba89'){
  c.save();c.translate(x,y);c.rotate(angle);poly(c,[[-w,0],[-w*.45,-w*.35],[w*.4,-w*.28],[w,0],[w*.25,w*.25],[-w*.55,w*.18]],color);line(c,-w,0,w,0,p.accent+'66');c.restore();
 }
 function pot(c,x,y,p,w=13){poly(c,[[x-w/2,y-13],[x+w/2,y-13],[x+w*.34,y],[x-w*.34,y]],'#9e8572');rect(c,x-w/2-1,y-14,w+2,3,'#b39d82');ellipse(c,x,y-12,w*.37,2,'#354539');}
 function plant(c,x,y,t,p,wide=false){
  pot(c,x,y,p,wide?16:13);line(c,x,y-13,x,y-35,p.accent,2);
  leaf(c,x-6,y-26,wide?17:8,p,-.25);leaf(c,x+6,y-32,10,p,.22);
 }
 function deck(c,x,y,w,p){rect(c,x,y,w,5,'#4a6b5d');line(c,x,y,x+w,y,p.trim,2);for(const xx of [x+6,x+w-8])line(c,xx,y+5,xx,y+27,p.near,3);}
 function bench(c,x,y,w,p){rect(c,x,y-11,w,4,'#9c9274');line(c,x+4,y-7,x+4,y,p.trim,2);line(c,x+w-4,y-7,x+w-4,y,p.trim,2);}
 function seated(c,x,y,t,p){person(c,x,y-4,t,p,{scale:.8,coat:'#a3b198',action:'idle'});line(c,x-2,y-10,x+8,y-10,p.trim,3);line(c,x+8,y-10,x+8,y,p.near,2);}
 function shop(c,x,t,p,cell,state){
  const q=phase(state,'seed_exchange',cell),b=phase(state,'plant_wrapping',cell);
  // The plant shop occupies a roof terrace above the station's near towers.
  c.save();c.translate(0,-140);
  rect(c,x+467,395,274,190,'#22433f');
  for(let row=0;row<5;row++)for(let col=0;col<8;col++)rect(c,x+477+col*32,409+row*29,18,15,(row+col)%3?'#49796755':'#8cb49755');
  for(let col=0;col<5;col++)line(c,x+470+col*67,395,x+470+col*67,585,p.trim,2);
  deck(c,x+462,390,293,p);rect(c,x+465,337,282,53,'#274b42');rect(c,x+463,330,286,8,'#507354');
  rect(c,x+474,346,68,31,'#173e38');for(let k=0;k<3;k++)line(c,x+477,351+k*9,x+539,351+k*9,p.trim);
  rect(c,x+550,355,23,35,p.near);rect(c,x+729,355,21,35,p.near);
  for(let k=0;k<5;k++)if(k!==1||q<15){rect(c,x+480+k*11,354+k%2*9,8,8,k%2?'#c6b993':'#91b99a');line(c,x+481+k*11,356+k%2*9,x+486+k*11,360+k%2*9,p.near);}
  if(q>=9){rect(c,x+530,366,8,8,'#d9c697');line(c,x+531,367,x+537,371,p.trim);}
  if(q>=0&&q<30){
   const xx=x+560-ease(q/6)*30+ease((q-22)/8)*30;
   if(xx<x+553){worker(c,xx,390,t,p,q<6||q>22,q>=16&&q<22?'read':'work');
    if(q>=6&&q<16)line(c,xx-1,375,x+531-ease((q-10)/5)*33,369,p.light,2);
    if(q>=15)rect(c,xx-9,374,6,7,'#c6b993');
   }
  }
  // A borrowed cloth leaves the seed exchange table on its return to 猫灯.
  rect(c,x+480,378,63,3,'#9c9176');line(c,x+483,381,x+483,390,p.trim,2);line(c,x+538,381,x+538,390,p.trim,2);
  if(!state.quests?.exchange_cloth?.installed.includes('jade')){rect(c,x+479,376,65,5,'#a38aa3');line(c,x+483,377,x+483,383,'#d3beca');}
  // A work counter and a wide-leaved plant awaiting its buyer.
  rect(c,x+597,366,87,4,p.trim);line(c,x+604,370,x+604,390,p.trim,2);line(c,x+677,370,x+677,390,p.trim,2);
  worker(c,x+624,390,t,p,false,b>=7&&b<23?'work':'idle');
  const carry=b<0?0:ease((b-23)/10),px=x+651+carry*77,py=366+carry*13;
  if(b<34){
   plant(c,px,py,t,p,true);
   if(b>=4){
    const wrapped=ease((b-4)/6),notch=ease((b-13)/6),w=24-wrapped*10;
    poly(c,[[px-w,py-25],[px-9,py-18],[px+7,py-20],[px+w,py-25],[px+10,py+1],[px-9,py+1]],'#c5b69a');
    line(c,px,py-12,px,py-35,p.accent,2);
    leaf(c,px-6,py-26,17,p,-.25-.5*(1-notch));leaf(c,px+6,py-32,10,p,.22);
    if(notch>0)poly(c,[[px-14,py-26],[px-7,py-22],[px-13,py-19]],'#315b44');
   }
  }
  if(b>=0&&b<34){const xx=x+686+carry*55;if(xx<x+731)person(c,xx,390,t,p,{walk:carry>0,carry:carry>0,coat:'#b8b096'});
   if(b>=4&&b<23){line(c,x+626,375,px-8,py-16,p.light,2);if(b>=12&&b<18){line(c,px-16,py-25,px-8,py-20,p.trim);line(c,px-15,py-18,px-8,py-24,p.trim);}}
  }
  if(b>=14)for(let k=0;k<3;k++)rect(c,x+639+k*10,364,5,2,'#c5b69a');
  c.restore();
 }
 function vine(c,x,t,p,cell,state){
  const q=phase(state,'guided_vine',cell),lift=q<0?0:ease((q-5)/11);
  line(c,x+104,291,x+104,381,p.trim,2);
  const point=u=>[x+109+Math.sin(u*Math.PI*.5)*39-lift*u*24,294+u*(77-lift*39)];
  for(let k=0;k<13;k++){const [ax,ay]=point(k/13),[bx,by]=point((k+1)/13);line(c,ax,ay,bx,by,'#7da976',2);if(k%2===0)leaf(c,bx+(k%4?5:-5),by,7,p,k%4?.3:-.4);}
  if(state.quests?.vine_loops?.installed.includes('jade')){const open=q>=5&&q<15,[tx,ty]=point(.55);line(c,x+101,ty-2,tx+3,ty,'#b9acb1',3);line(c,tx+3,ty,open?tx+9:x+104,open?ty-6:ty+2,'#b9acb1',2);}
  else if(q>=15){line(c,x+111,329,x+127,333,'#ccb88a');line(c,x+122,330,x+118,339,'#ccb88a');}
  if(q>=0&&q<24){const xx=x+175-ease(q/5)*35+ease((q-18)/6)*35;worker(c,xx,381,t,p,q<5||q>18);if(q>=4&&q<18){const [tx,ty]=point(1);line(c,xx-2,366,tx,ty,p.light,2);}}
  if(q>=20&&q<30)person(c,x+83+ease((q-20)/10)*115,381,t,p,{walk:true,coat:'#b4b09b'});
 }
 function reading(c,x,t,p,cell,state){
  const q=phase(state,'leaf_bookmark',cell);
  bench(c,x+453,381,63,p);seated(c,x+473,381,t,p);
  rect(c,x+470,362,13,7,'#d1c9a4');line(c,x+476,362,x+476,369,p.trim);
  if(q>=0){
   let lx=x+472,ly=360,angle=.1;
   if(q<6){const f=ease(q/6);lx=x+442+f*30+Math.sin(q*2)*3;ly=302+f*65;angle=q*.35;}
   else if(q<17){const f=ease((q-7)/5);ly=367-f*8;angle=-.12+Math.sin(q)*.06;line(c,x+475,365,lx+9,ly,p.light);}
   else{const f=ease((q-17)/5);lx=x+472+f*29;ly=359+f*10;angle=.1;}
   leaf(c,lx,ly,17,p,angle,'#a1ad78');
   if(q>=22)rect(c,x+478,362,2,10,'#d9a392');
  }
 }
 function roots(c,x,t,p,cell,state){
  const q=phase(state,'root_walkway',cell),raised=q<0?0:ease((q-19)/6)*3;
  // A maintenance footway beneath the main rail keeps the normal walker clear.
  deck(c,x+255,403,151,p);rect(c,x+285,402,38,8,p.near);
  poly(c,[[x+240,423],[x+278,416],[x+294,408],[x+311,404],[x+329,413],[x+318,412],[x+309,410],[x+293,414],[x+276,421]],'#67875f');
  const lifted=q<0?0:ease((q-3)/5)*(1-ease((q-18)/7));
  if(q>=15){rect(c,x+289,404,5,5,'#a79f7a');rect(c,x+316,404,5,5,'#a79f7a');}
  c.save();c.translate(x+323,403-raised);c.rotate(lifted*.95);rect(c,-39,-2,39,4,'#a19272');c.restore();
  if(raised){line(c,x+278,403,x+284,403-raised,p.trim,2);line(c,x+323,403-raised,x+329,403,p.trim,2);}
  if(q>=0&&q<29){worker(c,x+341,403,t,p);if(q>=3&&q<24)line(c,x+338,388,x+310,397-lifted*24,p.light,2);if(q>=25)line(c,x+341,398,x+319,400,p.near,3);}
  if(q>=27&&q<34){const xx=260+ease((q-27)/7)*132;person(c,x+xx,403-(xx>283&&xx<325?raised:0),t,p,{walk:true,coat:'#abb19a'});}
 }
 function nursery(c,x,t,p,cell,state){
  const e=event(state,'selective_water',cell),q=e?e.progress*35:-1,pose=jadeWaterPose(e?.progress??0),b=phase(state,'occupied_pot',cell),flower=phase(state,'night_bloom',cell);
  deck(c,x+473,395,285,p);
  for(let k=0;k<3;k++){
   plant(c,x+512+k*50,394,t,p);
   if(k===1)ellipse(c,x+562,382,4,1,'#142f2a');
   if(k===0&&pose.wetted[0]||k===2&&pose.wetted[1])ellipse(c,x+512+k*50,394,12,2,p.accent+'55');
  }
  const rx=x+pose.x;
  rect(c,rx-7,385,15,7,'#718e80');ellipse(c,rx-4,393,3,3,p.near);ellipse(c,rx+5,393,3,3,p.near);
  line(c,rx,385,rx-1,367,p.trim,2);line(c,rx-1,367,rx-15,373,p.trim,2);rect(c,rx-17,372,4,3,p.accent);
  if(q>=0&&pose.inspectingPot!==null)line(c,rx-15,375,rx-18,382,p.light+'99');
  if(q>=0&&pose.wateringPot!==null)for(let k=0;k<5;k++){const f=mod(t*1.5+k/5,1);rect(c,rx-15-f*3,375+f*9,1,2,p.accent+'aa');}
  rect(c,x+646,379,73,4,p.trim);line(c,x+651,383,x+651,395,p.trim,2);line(c,x+714,383,x+714,395,p.trim,2);rect(c,x+742,349,18,46,p.near);
  const lift=b<0?0:ease((b-3)/4)*(1-ease((b-9)/5)),py=378-lift*9;
  pot(c,x+678,py,p,19);
  if(b<18)pot(c,x+652,378,p,15);
  const wx=x+706-(b<0?0:ease((b-13)/5)*30)+(b<0?0:ease((b-19)/10)*75);
  if(b<0||wx<x+746){worker(c,wx,395,t,p,b>=13);if(b>=3&&b<15)line(c,wx-2,380,x+683,py-7,p.light,2);if(b>=18){const carry=ease((b-18)/3);pot(c,x+652+(wx-9-x-652)*carry,378+carry*5,p,15);}}
  if(b>=7){const climb=ease((b-18)/9),sx=x+678+climb*7,sy=py-5-climb*10;
   ellipse(c,sx,sy,3,3,'#c9b58d');line(c,sx+2,sy+2,sx+6,sy+2,p.accent,2);line(c,sx+5,sy+1,sx+7,sy-2,p.accent);
  }
  // One mature bud opens; nothing grows instantly and the whole bed stays quiet.
  pot(c,x+219,373,p,22);line(c,x+219,360,x+219,326,p.accent,3);leaf(c,x+208,349,14,p,-.4);leaf(c,x+227,343,13,p,.3);
  const opening=flower<0?0:ease((flower-2)/22);
  for(let k=0;k<7;k++){
   const angle=k/7*Math.PI*2,radius=3+opening*15;
   ellipse(c,x+219+Math.cos(angle)*radius,325+Math.sin(angle)*radius*.7,4+opening*3,8-opening*3,k%2?'#e8c9b6':'#bba9ae');
  }
  ellipse(c,x+219,325,2+opening*3,3,'#ffe7a1');
  worker(c,x+258,395,t,p,false,flower>=27?'read':'idle');
  if(flower>=16&&flower<28){poly(c,[[x+250,377],[x+204,314],[x+239,319]],'#ffe9ac20');rect(c,x+247,374,5,4,p.light);}
  if(flower>=27&&flower<36){rect(c,x+246,377,11,8,'#c4bb96');line(c,x+256,376,x+250,381,p.trim);}
 }
 function canal(c,x,t,p,cell,state){
  const q=phase(state,'leaf_boat',cell);
  deck(c,x+51,387,234,p);deck(c,x+349,387,36,p);
  for(let k=0;k<14;k++){const xx=285+k*5,yy=387-Math.sin(k/13*Math.PI)*8;line(c,x+xx,yy,x+xx+5,yy,p.trim,3);line(c,x+xx,yy-12,x+xx+5,yy-12,p.trim);if(k%3===0)line(c,x+xx,yy-12,x+xx,yy,p.trim);}
  const shift=q<0?0:ease((q-11)/4)*9;
  for(let k=0;k<4;k++)leaf(c,x+163+k*4+shift,414+k%2*2,6,p,k*.3,'#587f58');
  // Reeds hide the little boat at the end of its downstream journey.
  const lx=q<0?82:q<10?82+ease((q-3)/7)*80:q<15?162:162+ease((q-15)/18)*217;
  if(q>=0&&q<34)leaf(c,x+lx,413+Math.sin(t*1.4)*1.2,8,p,.05,'#aec185');
  for(let k=0;k<6;k++)line(c,x+375+k*4,428,x+372+k*4,403-k%3*6,p.trim,2);
  if(q>=0){
   const xx=q<10?80+ease((q-4)/6)*65:q<15?145:145+ease((q-15)/10)*193;
   const yy=xx>=285&&xx<=350?387-Math.sin((xx-285)/65*Math.PI)*8:387;
   person(c,x+xx,yy,t,p,{scale:.7,walk:q>=4&&q<10||q>=15&&q<25,coat:'#cfb793'});
   if(q<4)line(c,x+82,378,x+86,408,p.trim);
   if(q>=10&&q<15)line(c,x+147,376,x+169+shift,413,p.trim);
  }
 }
 function cascade(c,x,t,p,cell,state){
  const e=event(state,'leaf_waterfall',cell),q=e?e.progress*31:-1,drops=jadeLeafDrops(e?.progress??0);
  deck(c,x+536,389,177,p);line(c,x+677,389,x+669,230,'#557e5c',4);
  const positions=[[550,247,27],[577,289,26],[606,329,24]],angles=[];
  for(let k=0;k<3;k++){
   const start=4+k*6,angle=q<0?-.07:-.07+ease((q-(start-3))/3)*.35*(1-ease((q-(start+2))/3));angles.push(angle);
   const [cx,cy,w]=positions[k];line(c,x+672,cy+13,x+cx-w,cy,p.trim,2);leaf(c,x+cx,cy,w,p,angle,'#72a47b');
   if(q>=0&&q<start+2&&q>=start-3)ellipse(c,x+cx+8,cy+Math.sin(angle)*8,4,1,p.accent+'88');
  }
  ellipse(c,x+633,380,17,8,'#779185');ellipse(c,x+633,375,15,4,'#244c47');line(c,x+618,379,x+622,389,p.trim,2);line(c,x+648,379,x+644,389,p.trim,2);
  for(const d of drops)if(q>=0&&d.falling){
   const [cx,cy,w]=positions[d.leaf],startX=cx+Math.cos(.28)*w,startY=cy+Math.sin(.28)*w,
    target=d.leaf<2?positions[d.leaf+1]:[633,375],f=d.progress;
   rect(c,x+startX+(target[0]-startX)*f,startY+(target[1]-startY)*f*f,2,4,p.accent+'cc');
  }
  if(q>=18&&q<28){const f=mod((q-18)*.35,1);ellipse(c,x+633,375,3+f*11,1+f*2,p.accent+'88');}
  if(q>=18)line(c,x+623,375,x+643,375,p.accent+'66');
  if(q>=0&&q<30){const xx=x+546+ease((q-19)/10)*151;worker(c,xx,389,t,p,q>=19);}
 }
 function draw(c,s,t,travel,width,state={}){
  const p=s.p;if(p.id!=='jade')return;
  const first=Math.floor(travel*8.5/768);
  for(let n=first-1;n<first+Math.ceil(width/768)+1;n++){
   const x=n*768-travel*8.5,cell=mod(n,3),clock=t+cell*13;
   if(p.district===1){vine(c,x,clock,p,cell,state);reading(c,x,clock,p,cell,state);roots(c,x,clock,p,cell,state);}
   else if(p.district===2)nursery(c,x,clock,p,cell,state);
   else if(p.district===3){canal(c,x,clock,p,cell,state);cascade(c,x,clock,p,cell,state);}
   else shop(c,x,clock,p,cell,state);
  }
 }
 return {draw};
}
