// Durable equipment is read from the save. Short uses of it follow the existing
// paused scene clock; they never advance a quest or simulate time away.
import {mod} from './anim-utils.js';
export function createSidequestSceneRenderer({rect,line,ellipse,poly,person}){
 const has=(quests,id,world)=>quests?.[id]?.installed.includes(world);
 const text=(c,s,x,y,color,size=7)=>{c.save();c.fillStyle=color;c.font=size+'px sans-serif';c.fillText(s,x,y);c.restore();};
 const table=(c,x,y,w,p)=>{rect(c,x,y-22,w,3,p.trim);line(c,x+3,y-19,x+3,y,p.trim,2);line(c,x+w-4,y-19,x+w-4,y,p.trim,2);};
 function ledger(c,x,y,t,p){
  const q=mod(t,43),turn=q>13&&q<18,clip=(xx,yy)=>{rect(c,xx,yy,3,5,'#b5c3c5');line(c,xx,yy-2,xx+3,yy-2,p.light);};
  table(c,x,y,33,p);rect(c,x+3,y-31,25,9,'#786356');rect(c,x+4,y-30,23,7,'#c9b998');line(c,x+15,y-30,x+15,y-23,'#927f66');
  for(let k=0;k<3;k++)line(c,x+7,y-28+k*2,x+12,y-28+k*2,'#837568');
  if(turn){const f=(q-13)/5;poly(c,[[x+15,y-30],[x+15+Math.cos(f*Math.PI)*11,y-30-Math.sin(f*Math.PI)*7],[x+15+Math.cos(f*Math.PI)*11,y-23],[x+15,y-23]],'#ded0b0');clip(x+30,y-25);}
  else clip(x+24,y-31);
  if(q<29)clip(x+3,y-31);else clip(x+30,y-28);
  if(q>8&&q<24){person(c,x+40,y,t,p,{hat:true,action:'read',coat:'#baab8d'});line(c,x+38,y-16,x+(turn?19:27),y-27,p.light,2);}
 }
 function longBag(c,x,y,t,p){
  rect(c,x-4,y-28,10,28,'#8d806d');line(c,x-3,y-29,x+4,y-29,p.light,2);line(c,x+7,y-26,x+10,y-6,'#493e39',2);line(c,x+8,y-21,x+10,y-11,'#b9a58a',4);
  if(mod(t,47)>19&&mod(t,47)<29){person(c,x+21,y,t,p,{action:'work',coat:'#b6aa91'});line(c,x+19,y-16,x+9,y-18+Math.sin(t)*2,p.light,2);}
 }
 function stoneDish(c,x,y,t,p){
  table(c,x,y,28,p);ellipse(c,x+14,y-23,13,3,'#6e6660');
  for(let k=0;k<4;k++)ellipse(c,x+7+k*5,y-25-k%2*2,3,1.5,'#b8a798');
  if(mod(t+8,59)<16){person(c,x+36,y,t,p,{hat:true,action:'work',coat:'#a99782'});line(c,x+34,y-16,x+17,y-26,p.light,2);}
 }
 function catBox(c,x,y,t,p){
  rect(c,x,y-5,26,5,'#917b65');rect(c,x+2,y-6,22,3,'#b5a28e');line(c,x,y-7,x+26,y-7,p.trim);
  if(mod(t,83)>29&&mod(t,83)<58){ellipse(c,x+12,y-10,8,4,'#776f68');ellipse(c,x+19,y-13,4,4,'#a79b89');poly(c,[[x+16,y-15],[x+16,y-20],[x+19,y-16],[x+22,y-20],[x+22,y-14]],'#a79b89');line(c,x+6,y-10,x+1,y-13+Math.sin(t*.4),p.trim,2);}
 }
 function stonePot(c,x,y,t,p){
  const shift=mod(t,61)>20&&mod(t,61)<26?Math.sin(t*1.5):0;
  ellipse(c,x-6+shift,y-1,4,2,'#b5a595');ellipse(c,x+7,y-1,4,2,'#a9998e');poly(c,[[x-10,y-16],[x+10,y-16],[x+7,y-4],[x-7,y-4]],'#8b8e76');ellipse(c,x,y-16,10,3,'#c1b494');line(c,x,y-16,x,y-39,p.trim,2);
  for(let k=0;k<3;k++){ellipse(c,x-7+k%2*13,y-23-k*7,7,3,k%2?'#8cad83':'#63997d');}
  if(mod(t,61)>18&&mod(t,61)<28){person(c,x+25,y,t,p,{action:'work',coat:'#98aa86'});line(c,x+23,y-16,x+8,y-3,p.light,2);}
 }
 function watering(c,x,y,t,p,fine,record){
  const q=mod(t,55),using=q>=9&&q<19,flipping=q>=20&&q<23,small=mod(Math.floor(t/55),2)===0,done=q>=20;
  for(let k=0;k<2;k++){rect(c,x+20+k*20,y-8,14,8,'#92917a');line(c,x+27+k*20,y-8,x+27+k*20,y-19-k*7,'#9ab887',2);ellipse(c,x+24+k*20,y-16-k*7,5,2,'#7fa676');}
  table(c,x-24,y,23,p);rect(c,x-20,y-29,7,7,'#829f96');ellipse(c,x-12,y-24,3,1,p.light);if(fine){ellipse(c,x-6,y-24,3,2,'#b8cbb0');for(let k=0;k<3;k++)rect(c,x-8+k*2,y-25,1,1,p.near);}
  // Completed/next are work records, not a clock-driven plant simulation.
  if(record){rect(c,x+62,y-40,33,18,'#4d6558');text(c,'これから',x+64,y-33,'#c4d2b7',6);text(c,'済み',x+77,y-25,'#c4d2b7',6);const fw=flipping?Math.abs(Math.cos((q-20)/3*Math.PI))*7:7;rect(c,x+(done?66:84)+(7-fw)/2,y-(done?30:38),fw,5,'#d8c592');line(c,x+78,y-22,x+78,y,p.trim,2);}
  if(q<30){
   const wx=flipping?x+51:x+4;person(c,wx,y,t,p,{action:q<7?'read':'work',coat:'#9cb58a'});
   if(using){const cx=x+14,cy=y-22,target=x+(small?27:47);rect(c,cx,cy,7,8,'#849e91');line(c,cx+7,cy+2,cx+13,cy-1,p.light,2);
    if(fine&&small)ellipse(c,cx+14,cy-1,3,2,'#c3d0b5');
    for(let k=0;k<(fine&&small?7:3);k++){const f=mod(t*.8+k/(fine&&small?7:3),1);rect(c,cx+14+(target-cx-14)*f+(fine&&small?(k-3)*.7:0),cy+f*f*19,1,2,p.accent+'aa');}
   }else if(flipping&&record)line(c,wx+2,y-16,x+70,y-30,p.light,2);
   else if(fine&&q>=7&&q<9){line(c,wx-2,y-17,x-10,y-24,p.light,2);ellipse(c,x-10,y-25,3,2,p.light);}
  }
 }
 function loops(c,x,y,t,p){
  line(c,x,y-62,x,y,p.trim,2);line(c,x+7,y-8,x+6,y-59,'#8bad7c',2);
  for(let k=0;k<4;k++)ellipse(c,x+5+(k%2?6:-4),y-16-k*10,5,2,'#7d9f79');
  const q=mod(t,67),open=q>=25&&q<31;line(c,x-3,y-30,x+11,y-28,'#b9acb1',3);line(c,x+11,y-28,x+(open?15:1),y-(open?34:33),'#b9acb1',2);
  if(q>=21&&q<36){person(c,x+26,y,t,p,{action:'work',coat:'#91a785'});line(c,x+24,y-16,x+11,y-29,p.light,2);}
 }
 function cloth(c,x,y,t,p){
  table(c,x,y,35,p);rect(c,x-1,y-24,37,5,'#a38aa3');rect(c,x-1,y-21,5,8,'#a38aa3');line(c,x+2,y-23,x+2,y-14,'#d3beca');
  for(let k=0;k<4;k++)rect(c,x+2+k*8,y-22,3,1,'#d3beca');
  person(c,x+19,y,t,p,{scale:.8,action:'read',coat:'#b3a1a5'});rect(c,x+13,y-29,13,5,'#d3c5a8');line(c,x+19,y-29,x+19,y-24,p.trim);
 }
 function gauge(c,x,y,t,p){
  const q=mod(t,59),using=q>17&&q<30;line(c,x,y-27,x+28,y-27,p.trim,2);
  const gx=using?x+36:x+10,gy=using?y-12+Math.sin(t*.8)*2:y-21;
  rect(c,gx-6,gy-4,15,7,'#b4b4b0');rect(c,gx-3,gy-2,7,3,'#404b54');line(c,gx-5,gy-6,gx-5,gy-4,p.light);text(c,'17',gx+4,gy+1,p.near,4);
  if(using){person(c,x+49,y+6,t,p,{hat:true,action:'work',coat:'#b2a28c'});line(c,x+47,y-10,gx+3,gy,p.light,2);rect(c,gx-2,gy-2,3,2,p.accent);}
 }
 function relaySlot(c,x,y,p){rect(c,x,y-17,33,17,'#303b50');rect(c,x+3,y-14,20,10,'#111b2c');text(c,'返却済',x+3,y-3,p.light,6);rect(c,x+27,y-12,2,2,p.accent);}
 function counter(c,x,y,t,p){
  rect(c,x,y-32,48,32,'#3b4254');
  for(let k=0;k<2;k++){rect(c,x+4+k*23,y-27,17,12,k?'#515664':'#101b2f');text(c,k?'04':'07',x+6+k*23,y-18,k?'#95979d':p.light,9);if(k)line(c,x+30,y-26,x+41,y-17,'#a3a5af66');}
  const q=mod(t,57);if(q<26){const xx=x-17+Math.min(q/8,1)*16-Math.max(0,(q-19)/7)*16;rect(c,xx,y-13,12,7,'#7c8795');rect(c,xx+8,y-12,2,2,p.accent);if(q>=8&&q<19)line(c,xx+10,y-12,x+12,y-22,p.accent+'88');}
 }
 function receiving(c,x,y,t,p,padded,count){
  const q=mod(t,46),f=q<13?q/13:q<22?1:Math.max(0,1-(q-22)/13),xx=x-55+f*55,loaded=q>=20;
  line(c,x-70,y,x+31,y,p.trim,2);rect(c,x+6,y-13,27,3,'#606e83');if(padded)rect(c,x+6,y-15,27,2,'#a9a69b');
  if(count){rect(c,x-52,y-54,91,22,'#172438');text(c,'積載 0／回収箱 1',x-48,y-40,p.light,9);}
  const bx=loaded?xx:x+18,settle=q<5?(padded?Math.sin(q*2)*Math.exp(-q)*.6:0):0;
  rect(c,bx-9,y-(loaded?21:27)+settle,19,12,'#8c8a93');rect(c,bx-6,y-(loaded?19:25)+settle,13,7,'#27374a');
  rect(c,xx-14,y-8,29,5,'#7b8795');rect(c,xx-11,y-3,5,3,p.near);rect(c,xx+7,y-3,5,3,p.near);rect(c,xx-10,y-7,3,2,p.accent);
  if(q>=13&&q<22)line(c,xx+7,y-8,bx,y-(loaded?17:20),p.trim,2);
 }
 function drawPlatform(c,p,t,l,quests){
  const on=id=>has(quests,id,p.id);
  if(p.id==='gorge'){
   if(on('wind_pages'))ledger(c,255,374,t,p);
   if(on('shoulder_pad'))longBag(c,472,380,t,p);
   if(on('pot_stones'))stoneDish(c,l.shop+50,374,t,p);
   if(on('cat_descent'))catBox(c,270,399,t,p);
  }else if(p.id==='jade'){
   if(on('pot_stones'))stonePot(c,254,380,t,p);
   if(on('gentle_rain')||on('watering_record'))watering(c,444,382,t,p,on('gentle_rain'),on('watering_record'));
   if(on('vine_loops'))loops(c,574,380,t,p);
   if(on('exchange_cloth')){table(c,l.shop+26,377,33,p);for(let k=0;k<3;k++)rect(c,l.shop+30+k*8,349,6,5,'#c8b693');}
  }else if(p.id==='relay'){
   if(on('quiet_landing')||on('empty_count'))receiving(c,455,383,t,p,on('quiet_landing'),on('empty_count'));
   if(on('clear_counter'))counter(c,551,365,t,p);
   if(on('gauge_return'))relaySlot(c,l.shop+120,369,p);
  }else if(p.id==='kowloon'&&on('exchange_cloth')){text(c,'猫灯',l.shop+171,316,p.accent,9);cloth(c,l.shop+170,376,t,p);}
  else if(p.id==='scrap'&&on('gauge_return'))gauge(c,353,368,t,p);
 }
 function draw(c,s,t,travel,width,state={}){
  const p=s.p,on=id=>has(state.quests,id,p.id),first=Math.floor(travel*8.5/768);
  for(let n=first-1;n<first+Math.ceil(width/768)+1;n++){
   const x=n*768-travel*8.5,clock=t+mod(n,3)*13;
   if(p.id==='gorge'){
    if(!p.district&&on('wind_pages')){rect(c,x+451,365,67,4,p.trim);ledger(c,x+462,365,clock,p);}
    if(p.district===2&&on('pot_stones'))stoneDish(c,x+624,403,clock,p);
    if(!p.district&&on('cat_descent')){rect(c,x+197,365,34,3,p.trim);catBox(c,x+201,365,clock,p);}
   }else if(p.id==='jade'){
    if(p.district===2&&(on('gentle_rain')||on('watering_record'))){rect(c,x+321,395,142,4,p.trim);watering(c,x+350,395,clock,p,on('gentle_rain'),on('watering_record'));}
    if(!p.district&&on('pot_stones'))stonePot(c,x+391,388,clock,p);
   }else if(p.id==='relay'){
    if(p.district===2&&on('clear_counter'))counter(c,x+695,345,clock,p);
    if(!p.district&&on('gauge_return'))relaySlot(c,x+559,294,p);
   }
  }
 }
 return {draw,drawPlatform};
}
