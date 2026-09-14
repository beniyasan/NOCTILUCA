// Ambient incidents belong to this visit, not to the saved story. Selection is
// advanced once per visible animation frame; painting has no side effects.
import {mod,unit,ease,random,momentEvent} from './anim-utils.js';
export const MOMENTS=[
 {id:'cat_delivery',district:1,anchor:278,duration:17,weight:1},
 {id:'cat_window',district:1,anchor:278,duration:16,weight:1},
 {id:'cat_sign',district:1,anchor:278,duration:18,weight:.3},
 {id:'rain_cover',district:1,anchor:440,duration:15,weight:1},
 {id:'stall_close',district:1,anchor:650,duration:18,weight:.8},
 {id:'boat_yield',district:2,anchor:220,duration:18,weight:1},
 {id:'laundry',district:3,anchor:84,duration:17,weight:1},
 {id:'mei_chair',district:0,anchor:0,duration:15,weight:1}
];
export function momentAnchor(anchor,travel,width){
 const first=Math.floor(travel*8.5/768);
 let best=null;
 for(let n=first-1;n<=first+Math.ceil(width/768);n++){
  const x=n*768-travel*8.5+anchor;
  if(x>=Math.min(170,width*.5)&&x<width-30&&(!best||Math.abs(x-width*.7)<best.distance))best={cell:mod(n,3),worldCell:n,distance:Math.abs(x-width*.7)};
 }
 return best;
}
export function createMomentDirector(definitions=MOMENTS){
 let rng=random(1),time=0,next=0,limit=0,roll=0,active=null,done={},seen=[],recent=[];
 return {
  reset(seed,duration=120){recent=seen.slice(-6);rng=random(seed);time=0;next=8+rng()*10;roll=rng();limit=duration>=600?4+Math.floor(roll*4):Math.floor(roll*3);active=null;done={};seen=[];},
  advance(dt,context){
   if(dt<=0)return;time+=dt;limit=context.duration>=600?4+Math.floor(roll*4):Math.floor(roll*3);
   if(active){if(time-active.start>=active.duration){done[active.id]={...active,progress:1};active=null;next=time+(context.duration>=600?75+rng()*110:18+rng()*18);}return;}
   if(time<next||seen.length>=limit||!context.ready)return;
   next=time+2;
   const previous=definitions.find(e=>e.id===seen.at(-1));
   const candidates=definitions.filter(e=>e.district===context.district&&!seen.includes(e.id)&&
    !(e.group==='obstruction'&&previous?.group==='obstruction')&&(!e.requires||context[e.requires])&&
    (e.id!=='rain_cover'||context.rain)&&(e.id!=='laundry'||context.lightRain)&&
    (e.id!=='mei_chair'||context.tableOpen)).map(e=>({...e,spot:e.id==='mei_chair'?{cell:0}:momentAnchor(e.anchor,context.travel,context.width),weight:e.weight*(recent.includes(e.id)?.15:1)})).filter(e=>e.spot);
   if(!candidates.length)return;
   // An empty opportunity is intentional: passing a shop need not trigger it.
   if(rng()<.35){next=time+(context.duration>=600?25:5);return;}
   let pick=rng()*candidates.reduce((n,e)=>n+e.weight,0),event=candidates.at(-1);
   for(const e of candidates){pick-=e.weight;if(pick<=0){event=e;break;}}
   active={id:event.id,cell:event.spot.cell,worldCell:event.spot.worldCell,start:time,duration:event.duration};seen.push(event.id);
  },
  get view(){return {time,active:active?{...active,progress:unit((time-active.start)/active.duration)}:null,done:{...done},seen:[...seen],limit};}
 };
}
export function createMomentRenderer(a){
 const {rect,line,ellipse,poly,person,crate,sign,rand,shipBoat}=a;
 const event=momentEvent;
 function maid(c,x,y,t,p,walk=false,arm=0,quietEars=false){
  person(c,x,y,t,p,{walk,coat:'#293849'});
  poly(c,[[x-3,y-16],[x+3,y-16],[x+4,y-6],[x-4,y-6]],'#d3e1d7');
  line(c,x-3,y-20,x+4,y-20,'#bdcde0',2);
  const tilt=quietEars?Math.sin(t*.45)*.23:0;
  c.save();c.translate(x-2,y-24);c.rotate(tilt);poly(c,[[-2,0],[-2,-6],[2,-2]],p.accent);c.restore();
  c.save();c.translate(x+4,y-24);c.rotate(-tilt);poly(c,[[-2,-2],[2,-6],[2,0]],p.accent);c.restore();
  if(arm){line(c,x+3,y-16,x+10,y-16-arm,'#d3e1d7',2);ellipse(c,x+10,y-16-arm,2,2,'#c9a994');}
 }
 function cat(c,x,y,p){
  rect(c,x-8,y-7,17,6,'#557e89');rect(c,x-4,y-13,11,8,'#9db5b7');
  poly(c,[[x-4,y-12],[x-5,y-18],[x,y-14]],p.accent);poly(c,[[x+3,y-14],[x+8,y-18],[x+7,y-12]],p.accent);
  rect(c,x-1,y-11,2,1,p.neon);rect(c,x+4,y-11,2,1,p.neon);
  line(c,x-9,y-5,x-14,y-10,p.trim,2);ellipse(c,x-4,y,3,2,p.near);ellipse(c,x+6,y,3,2,p.near);
  rect(c,x-7,y-20,17,2,p.trim);ellipse(c,x+2,y-22,4,2,p.light);
 }
 function chair(c,x,y,p){line(c,x-4,y-13,x-4,y,p.trim,2);line(c,x+5,y-5,x+5,y,p.trim,2);rect(c,x-5,y-7,12,3,'#927366');line(c,x-5,y-13,x+3,y-13,'#927366',2);}
 function cafe(c,x,t,p,cell,state){
  const delivery=event(state,'cat_delivery',cell),window=event(state,'cat_window',cell),repair=event(state,'cat_sign',cell);
  const dq=delivery?delivery.progress*17:-1,wq=window?window.progress*16:-1,rq=repair?repair.progress*18:-1;
  rect(c,x+6,306,141,90,'#1a2937');rect(c,x+12,324,100,62,'#29454b');
  rect(c,x+115,324,26,70,'#102333');line(c,x+119,327,x+119,389,p.accent+'66');
  rect(c,x+8,308,136,13,'#33263d');
  c.save();c.fillStyle='#b7f0dc';c.font='11px sans-serif';c.fillText('猫灯 / NEKO AKARI',x+17,319);c.restore();
  // Visible patrons and small tables behind the wet glass.
  person(c,x+33,373,t+3,p,{action:'drink',coat:'#887581',scale:.85});
  rect(c,x+20,361,31,3,'#ac8a83');line(c,x+35,364,x+35,383,p.trim,2);
  rect(c,x+76,363,24,3,'#ac8a83');line(c,x+89,366,x+89,383,p.trim,2);
  if(state.quests?.exchange_cloth?.installed.includes('kowloon')){
   rect(c,x+75,361,26,5,'#a38aa3');rect(c,x+75,363,4,8,'#a38aa3');line(c,x+78,362,x+78,370,'#d3beca');
   person(c,x+87,383,t,p,{scale:.8,action:'read',coat:'#af9eac'});rect(c,x+81,358,13,5,'#d3c5a8');line(c,x+87,358,x+87,363,p.trim);
  }
  const catX=dq<0?x+43:dq<5?x+43+ease(dq/5)*20:dq<9?x+63:dq<13?x+63+ease((dq-9)/4)*30:x+93-ease((dq-13)/4)*50;
  cat(c,catX,386,p);
  const bagShift=delivery?ease((dq-6)/3)*12:0;
  crate(c,x+74+bagShift,375,10,11,p);
  let mx=x+104,my=385,arm=0,moving=false;
  if(dq>=0&&dq<12){mx=x+104-ease(dq/5)*22+ease((dq-9)/3)*22;moving=dq<5||dq>9;arm=dq>=5&&dq<9?2:0;}
  if(wq>=0&&wq<13){mx=x+104-ease(wq/4)*40+ease((wq-10)/3)*40;moving=wq<4||wq>10;arm=wq>=4&&wq<10?8+Math.sin(wq*2)*3:0;}
  if(rq>=0&&rq<17){mx=x+104+ease(rq/5)*28-ease((rq-13)/4)*28;my=385+ease(rq/4)*11-ease((rq-13)/4)*11;moving=rq<5||rq>13;arm=rq>5&&rq<13?11:0;}
  if(state.quests?.exchange_cloth?.installed.includes('kowloon')&&!state.active&&mod(t,71)>22&&mod(t,71)<30){arm=5;line(c,mx-2,my-15,x+100,363,p.light,2);}
  maid(c,mx,my,t,p,moving,arm,state.quests?.quiet_ears?.installed.includes('kowloon'));
  if(state.quests?.rain_umbrellas?.installed.includes('kowloon')){
   line(c,x+149,354,x+166,354,p.trim,3);line(c,x+148,346,x+148,382,p.trim,2);
   rect(c,x+147,389,24,3,'#537b86');
   const q=mod(t+cell*17,67),using=!state.active&&q>=18&&q<32,hang=!using||q>=25;
   line(c,x+153,354,x+153,385,'#9a92a3',2);poly(c,[[x+150,360],[x+156,360],[x+153,382]],'#876c8f');
   if(hang){line(c,x+161,354,x+161,385,p.trim);poly(c,[[x+158,360],[x+164,360],[x+161,382]],'#779e9e');}
   if(using){const f=ease((q-18)/7),leave=ease((q-26)/6),xx=x+188-f*20-leave*40;person(c,xx,399,t,p,{walk:q<24||q>=26,coat:'#a89c8b'});if(!hang){line(c,xx-4,373,x+165,354,p.trim);line(c,xx-5,374,xx-5,395,p.trim);}}
  }
  // Fog accumulates, is wiped clear, then gradually returns.
  let fog=.16;if(wq>=0)fog=wq<4?.16+ease(wq/4)*.14:wq<10?.30*(1-ease((wq-4)/5)):.16*ease((wq-10)/6);
  c.save();c.globalAlpha=fog;rect(c,x+13,327,97,52,'#b9d6d0');c.restore();
  line(c,x+61,324,x+61,386,'#456570',2);line(c,x+12,345,x+111,345,'#456570');
  for(let k=0;k<4;k++)rect(c,x+20+k*24,330+mod(t*.7+k*9,38),1,4,p.accent+'55');
  // Cat silhouette over the entrance; only the selected ear loses power.
  rect(c,x+115,277,26,25,'#16283a');
  line(c,x+119,289,x+121,281,p.accent,2);line(c,x+121,281,x+126,287,p.accent,2);
  const ear=rq>=0&&rq<12?'#3b4b59':p.neon;
  line(c,x+129,287,x+135,281,ear,2);line(c,x+135,281,x+138,290,ear,2);
  line(c,x+119,290,x+122,298,p.accent);line(c,x+122,298,x+134,298,p.accent);line(c,x+134,298,x+138,290,p.neon);
  rect(c,x+123,291,2,2,p.light);rect(c,x+132,291,2,2,p.light);
  rect(c,x+120,370,10,4,p.trim); // reachable sign connection box
  line(c,x+137,299,x+137,370,p.trim);
 }
 function stall(c,x,t,p,cell,state){
  const e=event(state,'stall_close',cell),q=e?e.progress*18:-1,closed=q>=14;
  rect(c,x+584,322,137,74,'#172634');rect(c,x+590,346,125,45,closed?'#253139':'#846f5966');
  rect(c,x+585,338,137,7,closed?'#514650':'#96556c');
  if(!closed)for(let k=0;k<7;k++)rect(c,x+593+k*17,345,13,9,p.neon+'66');
  rect(c,x+599,373,76,5,p.trim);rect(c,x+604,377,4,19,p.trim);rect(c,x+667,377,4,19,p.trim);
  if(q<4)ellipse(c,x+632,370,5,2,p.light);
  for(let k=0;k<2;k++){const f=q<0?0:ease((q-4-k*3)/3);chair(c,x+614+k*31+f*(91-k*31),402-f*k*5,p);}
  if(q<16){const f=q<0?0:ease(q/7);person(c,x+638+f*55-ease((q-12)/4)*24,396,t,p,{walk:q>=0,coat:'#a6937f',action:q>=0?'work':'idle'});}
  rect(c,x+701,330,6,3,p.light); // work light survives closing
 }
 function draw(c,s,t,travel,width,state={}){
  if(s.p.id!=='kowloon')return;
  const p=s.p,d=p.district;if(!d)return;
  const first=Math.floor(travel*8.5/768);
  for(let n=first-1;n<first+Math.ceil(width/768)+1;n++){
   const x=n*768-travel*8.5,cell=mod(n,3);
   if(d===1){
    cafe(c,x+192,t,p,cell,state);stall(c,x,t,p,cell,state);
    const e=event(state,'rain_cover',cell);
    if(e&&e.progress<1){const q=e.progress*15,xx=q<4?x+404+ease(q/4)*28:q<10?x+432:x+432+ease((q-10)/5)*57;
     person(c,xx,400,t,p,{walk:q<4||q>10,carry:true,coat:'#7d96a0'});
     if(q>=4){const f=ease((q-4)/3);poly(c,[[xx+4,383],[xx+15,383],[xx+15,383+f*9],[xx+4,383+f*9]],'#557984');}
    }
   }else if(d===2){
    const e=event(state,'boat_yield',cell);if(e&&n===e.worldCell){const q=state.time-e.start;
     const xx=q<4?x+75+ease(q/4)*75:q<11?x+150:q<18?x+150+ease((q-11)/7)*220:x+370+(q-18)*18;
     shipBoat(c,xx,391,t,p,.9);
     if(q>3&&q<12)shipBoat(c,x+365-ease((q-3)/9)*280,412,t,p,.55);
    }
   }else if(d===3){
    const e=event(state,'laundry',cell),q=e?e.progress*17:-1;
    for(let k=0;k<4;k++)if(q<3+k*2){const wind=Math.sin(t*.6+k)*2+(k===2&&q>=4&&q<7?Math.sin((q-4)/3*Math.PI)*8:0);rect(c,x+29+k*19+wind,278,12,17,k%2?'#678c92':'#aa8e86');}
    if(q>=0&&q<16){const xx=x+40+ease(q/10)*61;person(c,xx,303,t,p,{walk:q<3||q>12,coat:'#8c9e96',action:'work',scale:.85});crate(c,xx+7,291,17,12,p);}
   }
  }
 }
 function table(c,x,t,p,state){
  const e=event(state,'mei_chair',0),q=e?e.progress*15:-1;
  if(q<0){person(c,x+21,375,t+7,p,{action:'drink',coat:'#8a9d9b',scale:.85});chair(c,x+8,389,p);return;}
  const dx=q<5?ease(q/5)*-17:q<9?-17+ease((q-5)/4)*21:4+ease((q-9)/6)*75;
  if(q<15){person(c,x+21+dx,389,t,p,{walk:q<5||q>9,coat:'#8a9d9b',scale:.85,action:q>=5&&q<9?'work':'idle'});if(q<4)ellipse(c,x+25+dx,373,4,2,p.light);if(q>10&&q<12)line(c,x+23+dx,375,x+28+dx,367,p.trim,2);}
  chair(c,x+8+ease((q-5)/4)*11,389,p);
 }
 return {draw,table};
}
