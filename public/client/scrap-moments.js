// Optional scenes reset each visit; installed quest equipment comes from the save.
export const SCRAP_MOMENTS=[
 {id:'panel_check',district:2,anchor:535,duration:20,weight:1},
 {id:'tool_fit',district:3,anchor:232,duration:19,weight:.8,group:'obstruction'},
 {id:'found_chair',district:1,anchor:125,duration:22,weight:1},
 {id:'cart_wheel',district:0,anchor:340,duration:20,weight:.8,group:'obstruction'},
 {id:'salvage_passage',district:1,anchor:630,duration:26,weight:.3},
 {id:'parts_sort',district:2,anchor:630,duration:23,weight:1},
 {id:'borrowed_light',district:3,anchor:335,duration:23,weight:1},
 {id:'drying_gloves',district:0,anchor:245,duration:21,weight:1},
 {id:'robot_yield',district:0,anchor:415,duration:23,weight:.8,group:'obstruction'},
 {id:'cabin_light',district:1,anchor:120,duration:25,weight:.35}
];
const unit=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=unit(x);return x*x*(3-2*x);};
const mod=(x,n)=>(x%n+n)%n;
export function createScrapMomentRenderer(a){
 const {rect,line,ellipse,poly,person,crate}=a;
 const event=(state,id,cell)=>state?.active?.id===id&&state.active.cell===cell?state.active:state?.done?.[id]?.cell===cell?state.done[id]:null;
 const phase=(state,id,cell)=>{const e=event(state,id,cell);return e?e.progress*e.duration:-1;};
 const installed=(state,id)=>state?.quests?.[id]?.installed.includes('scrap');
 const worker=(c,x,y,t,p,walk=false,action='work')=>person(c,x,y,t,p,{walk,action,hat:true,coat:'#a79a85'});
 function chair(c,x,y,p){
  line(c,x-5,y-17,x-5,y,p.trim,2);line(c,x+7,y-7,x+7,y,p.trim,2);
  rect(c,x-6,y-10,15,3,'#927669');rect(c,x-6,y-18,13,5,'#80685f');
 }
 function seated(c,x,y,t,p,action='idle'){
  person(c,x,y-3,t,p,{action,coat:'#a79a85',scale:.8});
  line(c,x-2,y-9,x+7,y-9,p.trim,3);line(c,x+7,y-9,x+7,y,p.near,2);
 }
 function panel(c,x,y,w,p,marked=false){
  rect(c,x-w/2,y-20,w,21,'#6e7270');line(c,x-w/2,y-19,x+w/2,y-19,p.light);
  for(let k=0;k<3;k++)line(c,x-w*.35,y-15+k*5,x+w*.35,y-15+k*5,p.near);
  if(marked){line(c,x+w*.1,y-5,x+w*.2,y-2,p.accent,2);line(c,x+w*.2,y-2,x+w*.4,y-8,p.accent,2);}
 }
 function table(c,x,y,w,p){rect(c,x,y,w,4,p.trim);line(c,x+5,y+4,x+5,y+28,p.trim,2);line(c,x+w-5,y+4,x+w-5,y+28,p.trim,2);}
 function cart(c,x,y,p,tilt=0){
  c.save();c.translate(x,y);c.rotate(tilt);
  rect(c,-15,-10,31,3,p.trim);crate(c,-12,-28,23,18,p);
  line(c,-16,-10,-22,-25,p.trim,2);ellipse(c,-9,-3,4,4,p.near);ellipse(c,11,-3,4,4,p.near);
  ellipse(c,-9,-3,1,1,p.light);ellipse(c,11,-3,1,1,p.light);c.restore();
 }
 function sorting(c,x,t,p,cell,state){
  const q=phase(state,'panel_check',cell),b=phase(state,'parts_sort',cell);
  table(c,x+493,371,65,p);rect(c,x+498,336,52,4,p.trim);line(c,x+498,337,x+498,371,p.trim,2);
  const lift=q<0?0:ease(q/5)*(1-ease((q-14)/5)),turn=q<0?0:ease((q-5)/4);
  panel(c,x+526,370-lift*29,26-Math.sin(turn*Math.PI)*22,p,q>=13);
  worker(c,x+565,400,t,p,q>=0&&q<5);
  if(q>=5&&q<13){
   line(c,x+562,381,x+548,352,p.trim,2);
   poly(c,[[x+548,352],[x+518,332],[x+516,361]],'#ffe5ae33');ellipse(c,x+548,352,2,2,p.light);
  }
  if(q>=11&&q<15)line(c,x+562,383,x+535,353,p.accent);
  table(c,x+599,371,86,p);
  const spread=b<0?0:ease(b/5)*(1-ease((b-14)/5));
  for(let k=0;k<5;k++){
   const xx=x+615+k*8+spread*(k-2)*4,yy=367-(b>=19?k%2*3:0);
   if(k!==3||b<8)rect(c,xx,yy,6,3,k===3?p.accent:p.trim);
  }
  const stack=b<0?0:ease((b-19)/4);
  crate(c,x+604,350,23,17,p);crate(c,x+661-stack*55,352-stack*20,20,17,p);
  if(b>=8&&b<18){const f=ease((b-8)/5);rect(c,x+639+f*27,364-Math.sin(f*Math.PI)*14-f*5,6,3,p.accent);}
  if(b>=18){rect(c,x+604,349,23,3,p.trim);rect(c,x+661-stack*55,351-stack*20,20,3,p.trim);}
  worker(c,x+643,400,t,p,false,b>=0&&b<19?'work':'read');
  if(b>=4&&b<18){const hand=x+619+ease((b-6)/7)*48;line(c,x+644,384,hand,363,p.light);}
 }
 function repairs(c,x,t,p,cell,state){
  const q=phase(state,'tool_fit',cell),b=phase(state,'borrowed_light',cell);
  const grips=installed(state,'steady_grips'),using=grips&&q<0?Math.sin(t*1.7)*2:0;
  crate(c,x+190,363,21,15,p);
  if(grips){line(c,x+193,360,x+209,360,p.light,2);line(c,x+193,360,x+200,360,'#82a7ab',3);}
  const search=q>=5&&q<12,xx=x+217-(q<0?0:ease((q-3)/3)*16)+ (q<0?0:ease((q-11)/4)*16);
  worker(c,xx,379,t,p,q>=3&&q<6||q>=11&&q<15);
  if(search){line(c,xx,364,x+202,362+Math.sin(q*3)*3,p.light,2);line(c,x+190,362,x+184,348,p.trim,2);}
  else {
   const reach=q>=0&&q<3?Math.sin(q*Math.PI/3)*4:using,correct=q>=12;
   line(c,xx+3,363,xx+12,354-reach,p.trim,2);
   line(c,xx+12,354-reach,xx+19+(correct?3:0),354-reach,correct?p.accent:p.light,2);
   if(grips)line(c,xx+11,354-reach,xx+16,354-reach,'#82a7ab',3);
  }
  // Returned reference plate is checked by the existing second mechanic.
  if(installed(state,'gauge_return')){
   const use=b<0&&mod(t,61)>19&&mod(t,61)<29,gx=x+(use?385:361),gy=use?363+Math.sin(t)*1.3:348;
   line(c,x+352,338,x+375,338,p.trim,2);rect(c,gx-6,gy-4,16,7,'#b4b4b0');rect(c,gx-3,gy-2,7,3,'#34404b');line(c,gx-4,gy-6,gx-4,gy-4,p.light);
   if(use){line(c,x+395,363,gx+3,gy,p.light,2);rect(c,gx-2,gy-2,3,2,p.accent);}
  }
  // A second mechanic lends a light, then turns it back to their own job.
  worker(c,x+397,379,t+6,p,false,'work');
  const aim=b<0?0:ease((b-5)/4)*(1-ease((b-17)/5));
  line(c,x+419,379,x+419,339,p.trim,2);rect(c,x+413,337,12,5,p.light);
  poly(c,[[x+419,341],[x+383-aim*155,354],[x+404-aim*166,374]],'#ffe3a724');
  if(aim>.1)line(c,x+218,359,x+242,330,'#ffe5b366',2);
  if(b>=1&&b<6)line(c,x+220,362,x+229,345+Math.sin(b*2)*2,p.light,2);
  if(b>=5&&b<9||b>=17&&b<22)line(c,x+399,362,x+418,341,p.light,2);
 }
 function street(c,x,t,p,cell,state){
  const g=phase(state,'drying_gloves',cell),q=phase(state,'cart_wheel',cell),b=phase(state,'robot_yield',cell);
  // A continuous work gallery gives the small actors a shared, visible floor.
  rect(c,x+202,338,325,6,p.near);line(c,x+202,338,x+527,338,p.trim,2);
  for(const dx of [211,328,513])line(c,x+dx,344,x+dx,398,p.trim,3);
  rect(c,x+218,295,39,35,p.near);for(let k=0;k<4;k++)line(c,x+222,300+k*6,x+252,300+k*6,p.trim);
  const rack=installed(state,'glove_drying');
  if(rack){
   line(c,x+221,307,x+246,307,p.trim,2);line(c,x+221,304,x+221,311,p.light);line(c,x+246,304,x+246,311,p.light);
   if(g<5)for(let k=0;k<2;k++){const wx=x+225+k*10+Math.sin(t*1.4+k)*.6;rect(c,wx,310,6,10,'#b89576');rect(c,wx-2,313,2,4,'#b89576');rect(c,wx+2,307,2,4,p.light);}
  }else line(c,x+218,285,x+264,285,p.trim);
  chair(c,x+276,338,p);
  if(g>=0){
   const xx=x+278-ease(g/5)*27+ease((g-9)/5)*25;
   if(g>=14)seated(c,x+276,338,t,p,'drink');else worker(c,xx,338,t,p,g<5||g>=9&&g<14);
   if(g>=5)for(let k=0;k<2;k++){
    const yy=318-ease((g-5)/4)*(rack?8:30),wx=x+(rack?225:234)+k*10+Math.sin(t*1.4+k)*(rack?.6:1.4);
    if(rack)rect(c,wx+2,yy-3,2,4,p.light);
    rect(c,wx,yy,6,10,'#b89576');rect(c,wx-2,yy+3,2,4,'#b89576');
   }
  }
  // The wheel catches on an ordinary seam, then crosses it on the second try.
  rect(c,x+340,335,5,3,p.trim);
  if(q>=0&&q<20){
   const dx=q<5?270+ease(q/5)*58:q<9?328-ease((q-5)/4)*12:316+ease((q-9)/11)*233;
   cart(c,x+dx,338,p,q>=4&&q<9?Math.sin((q-4)/5*Math.PI)*-.14:0);
   worker(c,x+dx-28,338,t,p,true);
  }
  const retract=b<0?0:ease((b-3)/4)*(1-ease((b-14)/5));
  const rx=x+444+retract*21;
  rect(c,rx-9,323,18,10,p.trim);ellipse(c,rx-5,335,3,3,p.near);ellipse(c,rx+6,335,3,3,p.near);
  line(c,rx,323,rx-10+retract*8,312,p.trim,3);line(c,rx-10+retract*8,312,rx-28+retract*27,314,p.trim,2);
  rect(c,rx-5,325,4,2,p.accent);
  if(b<0||b>=19){if(mod(t,9)<2)ellipse(c,rx-28,314,2,2,p.light);}
  if(b>=0&&b<23){
   const dx=b<4?286+ease(b/4)*83:b<8?369:369+ease((b-8)/15)*183;
   cart(c,x+dx,338,p);worker(c,x+dx-28,338,t,p,b<4||b>=8);
  }
 }
 function anchorage(c,x,t,p,cell,state){
  const q=phase(state,'found_chair',cell),b=phase(state,'cabin_light',cell);
  if(q>=0){
   const f=ease(q/7),cx=x+61+f*86,cy=369+f*11-8*(1-ease((q-5)/2));
   chair(c,cx,cy,p);
   if(q<20){
    if(q>=12&&q<17)seated(c,cx,380,t,p);else worker(c,cx+14,380,t,p,q<7||q>=17);
    if(q>=7&&q<11)for(let k=0;k<4;k++){const age=mod(q*.6+k*.25,1);rect(c,cx+age*18,365-age*13,1,1,p.light+'77');}
   }
  }
  // A dark former cabin becomes a room; the light survives the resident's action.
  const amber=installed(state,'amber_window'),occupied=b>=2||amber&&mod(t+cell*13,57)<22;
  rect(c,x+104,329,33,30,amber?'#916a45':b>=2?'#b18455':'#17232d');
  if(occupied){
   poly(c,[[x+104,359],[x+137,359],[x+164,380],[x+88,380]],'#ffc78c12');
   person(c,x+116+(b<0?4:b<13?ease((b-2)/6)*8:8-ease((b-13)/6)*5),360,t,p,{scale:.7,action:b>=13&&b<21?'work':'drink',coat:'#9b9783'});
   rect(c,x+106,351,13,2,p.trim);ellipse(c,x+112,348,3,3,p.near);line(c,x+115,347,x+118,346,p.trim);
   if(b>=7||amber)for(let k=0;k<3;k++){const age=mod(t*.3+k/3,1);ellipse(c,x+113+age*3,344-age*9,1+age,1,p.light+'44');}
   const fog=.15*(1-ease((b-13)/7));c.save();c.globalAlpha=fog;rect(c,x+104,330,33,26,'#d6d7bf');c.restore();
   if(b>=13&&b<21)line(c,x+122,348,x+127,337+Math.sin(b*2)*4,p.light);
  }
  if(amber){rect(c,x+105,330,31,28,'#efb26430');line(c,x+104,329,x+137,329,'#c8a676',2);line(c,x+104,359,x+137,359,'#c8a676',2);}
  line(c,x+120,329,x+120,359,p.near,2);line(c,x+104,342,x+137,342,p.near);
 }
 function draw(c,s,t,travel,width,state={}){
  const p=s.p;if(p.id!=='scrap')return;
  const first=Math.floor(travel*8.5/768);
  for(let n=first-1;n<first+Math.ceil(width/768)+1;n++){
   const x=n*768-travel*8.5,cell=mod(n,3);
   if(p.district===2)sorting(c,x,t,p,cell,state);
   else if(p.district===3)repairs(c,x,t,p,cell,state);
   else if(p.district===1)anchorage(c,x,t,p,cell,state);
   else street(c,x,t,p,cell,state);
  }
  const e=state.active;
  if(p.district===1&&e?.id==='salvage_passage'){
   // Screen-wide passage crosses completely, even at the narrowest viewport.
   const x=-420+ease(e.progress)*(width+900),y=174;
   poly(c,[[x-200,y],[x+136,y-11],[x+215,y+18],[x+166,y+78],[x-160,y+73],[x-214,y+38]],'#202a32');
   line(c,x-188,y+40,x+182,y+43,p.trim,2);
   for(let k=0;k<8;k++){line(c,x-159+k*43,y+5,x-146+k*43,y+66,'#4a4b4b',2);rect(c,x-140+k*40,y+50,18,4,'#8b8171');}
   rect(c,x+102,y+3,38,14,'#715d49');rect(c,x+112,y+6,18,4,p.light+'99');
   ellipse(c,x-207,y+27,8,5,p.accent+'66');
  }
 }
 return {draw};
}
