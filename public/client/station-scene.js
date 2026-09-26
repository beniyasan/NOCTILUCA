// The station platform: a spatial foreground layer, not a fading black overlay.
// This factory receives the engine's state and saved-data gateways so the
// painters stay free of global lookups.
import {surface,rect,poly,line,ellipse,glow,gradient,text,cjk,rand,mod,smooth,shuttling,HEIGHT} from './pixel.js';
import {person,cat,robot,drone,crate,steam,rotatingFan} from './sprites.js';
import {LIFE} from './worlds.js';
import {lifeClock,sign,roof,gardenTree} from './cityscape.js';
export function createStationScene({state,gateway,momentDirector,momentRenderer,sidequestRenderer}){
function stationLayout(width){
 const logical=Math.max(680,width+32),crop=width<500?Math.max(0,102-width*.23):0;
 return{logical,crop,shop:100,bench:326,cargo:505,board:296};
}
function stationBackground(s,width){
 const p=s.p,l=stationLayout(width),r=rand(p.seed+450),e=surface(l.logical,HEIGHT),c=e.getContext('2d'),w=l.logical;
 // Open canopy: the city is visible through it.
 const roofColor={neon:'#342734',scrap:'#34383d',water:'#244e5d',rock:'#49393d',garden:'#284339',void:'#293148',undersea:'#15394a',volcano:'#3a1a18',sky:'#2e3868'}[p.kind];
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
 }else if(p.kind==='undersea'){
  ellipse(c,x+75,sy-2,82,16,p.trim);ellipse(c,x+75,sy-3,78,13,'#1d5566');text(c,'DEEP KITCHEN',x+75,sy-6,p.light,1,'center');
  for(let i=0;i<3;i++){ellipse(c,x+170+i*14,sy+30+i%2*8,5,5,p.trim);ellipse(c,x+170+i*14,sy+30+i%2*8,3,3,p.light+'aa');}
 }else if(p.kind==='volcano'){
  rect(c,x-6,sy-9,161,11,p.trim);rect(c,x+2,sy-26,145,17,p.near);text(c,'LAVA GRILL',x+74,sy-20,p.light,1,'center');
  rect(c,x+156,sy+40,30,24,'#2a1210');rect(c,x+159,sy+43,24,6,p.neon);for(let i=0;i<4;i++)rect(c,x+160+i*6,sy+36,2,4,p.light);
 }else if(p.kind==='sky'){
  poly(c,[[x-8,sy+2],[x+75,sy-26],[x+158,sy+2]],'#c85a5a');rect(c,x-4,sy,156,3,p.trim);text(c,'CLOUD SOUP',x+75,sy-10,p.light,1,'center');
  for(let i=0;i<3;i++){ellipse(c,x+166+i*12,sy+20-i*6,5,6,['#ff7aa8','#9fe3ff','#ffd07a'][i]);line(c,x+166+i*12,sy+26-i*6,x+170,sy+60,'#d8d0e088');}
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
return {drawStationOverlay};
}
