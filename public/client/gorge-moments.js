// Vertical errands and ordinary pauses. All traces expire with this visit.
import {mod,ease,unit,momentEvent as event,momentPhase as phase} from './anim-utils.js';
export const GORGE_MOMENTS=[
 {id:'bread_lift',district:0,anchor:175,duration:31,weight:1},
 {id:'wind_plank',district:1,anchor:168,duration:34,weight:1},
 {id:'stair_rest',district:3,anchor:548,duration:34,weight:1},
 {id:'dust_lid',district:0,anchor:569,duration:28,weight:1},
 {id:'window_tea',district:3,anchor:295,duration:33,weight:1},
 {id:'moving_shade',district:0,anchor:664,duration:29,weight:1},
 {id:'stone_wedge',district:2,anchor:542,duration:33,weight:1},
 {id:'pipe_gecko',district:3,anchor:87,duration:33,weight:1},
 {id:'dust_curtain',district:1,anchor:367,duration:33,weight:.4,requires:'dusty'},
 {id:'rising_wings',district:1,anchor:549,duration:38,weight:.35}
];

export function gorgeLiftPose(progress){
 const q=progress*31,lift=ease((q-5)/8)*(1-ease((q-20)/8));
 return {y:356-lift*87,breadInBasket:q>=3&&q<16,cupInBasket:q>=20,breadDelivered:q>=16};
}
export function gorgeStairY(x){
 if(x<526)return 386-Math.min(5,Math.floor(Math.max(0,x-478)/8))*8;
 if(x<580)return 346;
 return 346-Math.min(5,Math.floor(Math.max(0,x-580)/10))*8;
}
export function createGorgeMomentRenderer(a){
 const {rect,line,ellipse,poly,person,crate}=a;
 const worker=(c,x,y,t,p,walk=false,action='work')=>person(c,x,y,t,p,{walk,action,hat:true,coat:'#b69e7f'});
 function cup(c,x,y,p){rect(c,x-2,y-5,5,5,p.light);line(c,x+3,y-4,x+5,y-2,p.trim);}
 function chair(c,x,y,p){line(c,x-5,y-18,x-5,y,p.trim,2);line(c,x+7,y-8,x+7,y,p.trim,2);rect(c,x-6,y-11,15,3,'#8c7060');rect(c,x-6,y-19,13,5,'#8c7060');}
 function seated(c,x,y,t,p,action='read'){
  person(c,x,y-4,t,p,{action,scale:.8,coat:'#c2aa8a'});line(c,x-2,y-10,x+8,y-10,p.trim,3);line(c,x+8,y-10,x+8,y,p.near,2);
 }
 function shelf(c,x,y,w,p){rect(c,x,y,w,4,p.trim);poly(c,[[x+3,y+4],[x+14,y+17],[x+14,y+4]],p.near);poly(c,[[x+w-16,y+4],[x+w-5,y+17],[x+w-5,y+4]],p.near);}
 function room(c,x,y,w,h,p){rect(c,x,y,w,h,p.near);rect(c,x+4,y+4,w-8,h-8,'#9a795d55');line(c,x-2,y-2,x+w+2,y-2,p.trim,3);}
 function basket(c,x,y,p){crate(c,x-7,y,15,9,p);line(c,x-7,y,x,y-7,p.trim);line(c,x,y-7,x+8,y,p.trim);}
 function bread(c,x,y,p){ellipse(c,x,y-3,6,4,'#d6ac71');for(let k=0;k<3;k++)line(c,x-3+k*3,y-5,x-2+k*3,y-3,p.light);}
 function bakery(c,x,t,p,cell,state){
  const e=event(state,'bread_lift',cell),q=e?e.progress*31:-1,pose=gorgeLiftPose(e?.progress??0);
  poly(c,[[x+32,450],[x+37,236],[x+143,225],[x+194,284],[x+194,450]],'#493b3d');
  room(c,x+51,322,73,43,p);room(c,x+106,244,57,34,p);shelf(c,x+43,365,151,p);shelf(c,x+100,278,94,p);
  rect(c,x+61,312,52,8,'#88694f');for(let k=0;k<3;k++)bread(c,x+72+k*14,317,p);
  line(c,x+181,251,x+181,357,p.trim);ellipse(c,x+181,251,3,3,p.trim);
  const sway=q>=28?Math.sin((q-28)*2)*Math.exp(-(q-28)*.5)*2:Math.sin(t*.3)*.4;
  basket(c,x+181+sway,pose.y,p);
  line(c,x+181,251,x+181+sway,pose.y-7,p.trim);
  if(q<3)bread(c,x+150,354,p);
  if(pose.breadInBasket)bread(c,x+181+sway,pose.y+6,p);
  if(pose.cupInBasket)cup(c,x+181+sway,pose.y+7,p);
  if(pose.breadDelivered){bread(c,x+130,272,p);rect(c,x+120,272,22,2,p.trim);}
  worker(c,x+158,365,t,p,false,q<0?'idle':'work');
  if(q>=0&&q<6)line(c,x+161,350,x+178,354,p.light,2);
  person(c,x+147,278,t,p,{scale:.85,action:q>=16?'drink':'read',coat:'#a49d91'});
  if(q>=13&&q<21)line(c,x+149,264,x+179,271,p.light,2);
 }
 function entrance(c,x,t,p,cell,state){
  const q=phase(state,'dust_lid',cell),s=phase(state,'moving_shade',cell);
  poly(c,[[x+517,450],[x+520,302],[x+704,304],[x+724,450]],'#44373b');shelf(c,x+520,365,198,p);
  room(c,x+530,319,86,46,p);rect(c,x+540,328,25,37,p.near);room(c,x+641,315,58,44,p);
  crate(c,x+573,345,23,19,p);
  const opened=q<0?0:ease((q-11)/5);
  line(c,x+572,344,x+596-opened*11,344-opened*17,p.trim,3);
  if(q<16){rect(c,x+580,348,7,10,p.light+'aa');rect(c,x+588,349,5,9,p.accent+'99');}
  const wx=x+610-(q<0?0:ease(q/4)*9)- (q<0?0:ease((q-18)/8)*53);
  if(q<0||q<27){worker(c,wx,365,t,p,q>=18);if(q>=3&&q<11){const bx=x+576+mod(q*10,17);line(c,wx-2,350,bx,343,p.trim,2);rect(c,bx-2,342,6,3,'#b3a089');}
   if(q>=16&&q<27)crate(c,wx-12,348,8,10,p);
  }
  if(q>=3&&q<12)for(let k=0;k<5;k++){const f=mod(t*.8+k*.2,1);rect(c,x+581+f*22,345+f*f*17,1,1,p.light+'66');}
  if(q>=11){line(c,x+600,362,x+608,359,p.trim,2);rect(c,x+598,362,5,2,'#b3a089');}
  const shift=s<0?0:ease((s-7)/6)*-20,drop=s<0?0:ease((s-15)/6)*19;
  // A small patch of sun crosses the seat; the awning keeps its new position.
  if(s>=0){const sun=ease(s/6)*(1-ease((s-15)/6));poly(c,[[x+671,333],[x+704,346],[x+704,364],[x+646,364]],'#e4b97c'+(sun>.5?'2b':'10'));}
  rect(c,x+629,311,78,5,'#8e6d59');rect(c,x+630,316,75,8+drop,'#715850');line(c,x+630,324+drop,x+705,324+drop,p.light+'66');
  chair(c,x+674+shift,365,p);
  if(s>=5&&s<22){worker(c,x+674+shift,365,t,p,s<14);if(s>=14)line(c,x+658,350,x+670,329+drop,p.trim,2);}
  else seated(c,x+674+shift,365,t,p);
 }
 function steps(c,x,t,p,cell,state){
  const q=phase(state,'stair_rest',cell),padded=state.quests?.shoulder_pad?.installed.includes('gorge');
  const bag=(xx,yy,carried)=>{rect(c,xx-3,yy-27,8,27,'#8d806d');line(c,xx+5,yy-24,xx+8,yy-6,'#4e433b',2);line(c,xx+6,yy-21,xx+8,yy-11,'#b9a58a',4);if(carried)line(c,xx+8,yy-11,xx+13,yy-19,p.trim);};
  poly(c,[[x+465,450],[x+466,358],[x+528,329],[x+605,269],[x+671,271],[x+708,450]],'#45363b');
  for(let k=0;k<6;k++){rect(c,x+478+k*8,386-k*8,10,4,p.trim);rect(c,x+580+k*10,346-k*8,12,4,p.trim);}
  shelf(c,x+526,346,55,p);shelf(c,x+629,306,35,p);room(c,x+635,278,24,28,p);
  line(c,x+479,366,x+527,326,p.trim);line(c,x+527,326,x+578,326,p.trim);line(c,x+580,326,x+630,286,p.trim);
  for(const dx of [488,520,579,620])line(c,x+dx,gorgeStairY(dx)-20,x+dx,gorgeStairY(dx),p.trim);
  chair(c,x+548,346,p);
  if(q>=0&&q<33){
   const xx=q<8?478+ease(q/8)*70:q<20?548:548+ease((q-20)/12)*97,yy=gorgeStairY(xx);
   if(q>=8&&q<20){seated(c,x+548,346,t,p,q>=11&&q<17?'drink':'idle');if(padded)bag(x+561,345,false);else crate(c,x+558,331,10,14,p);if(q>=11&&q<17)cup(c,x+554,332,p);}
   else if(xx<638){person(c,x+xx,yy,t,p,{walk:true,carry:true,coat:'#b6aa91'});if(padded)bag(x+xx-7,yy-2,true);else crate(c,x+xx-8,yy-20,7,14,p);}
  }
 }
 function tea(c,x,t,p,cell,state){
  const q=phase(state,'window_tea',cell),out=q<0?0:ease((q-3)/9)*(1-ease((q-19)/9));
  room(c,x+208,214,46,32,p);room(c,x+334,226,44,32,p);shelf(c,x+204,246,55,p);shelf(c,x+329,258,54,p);
  line(c,x+250,218,x+334,230,p.trim);ellipse(c,x+250,218,3,3,p.trim);ellipse(c,x+334,230,3,3,p.trim);
  const bx=x+259+out*65,by=230+out*9;line(c,bx,219+out*9,bx,by-7,p.trim);basket(c,bx,by,p);
  if(q<14)cup(c,bx,by+7,p);else if(q>=18&&q<29)bread(c,bx,by+6,p);
  person(c,x+235,246,t,p,{action:q>=29?'drink':'read',scale:.85,coat:'#c1a78f'});
  person(c,x+345,258,t+4,p,{action:q>=14?'drink':'read',scale:.85,coat:'#9fabb0'});
  if(q>=10&&q<20)line(c,x+342,244,bx,by+3,p.light,2);
  if(q>=0&&q<6||q>=27&&q<31)line(c,x+238,232,bx,by+3,p.light,2);
  if(q>=14)cup(c,x+363,253,p);if(q>=29){bread(c,x+222,241,p);cup(c,x+240,241,p);}
 }
 function gecko(c,x,t,p,cell,state){
  const q=phase(state,'pipe_gecko',cell);
  shelf(c,x+5,412,165,p);line(c,x+31,401,x+31,383,'#9b7960',4);line(c,x+31,383,x+138,383,'#9b7960',4);
  for(const dx of [42,92,128])rect(c,x+dx,379,4,9,p.trim);
  line(c,x+13,403,x+19,397,p.near,3);line(c,x+19,397,x+22,406,p.near,3);
  const f=q<0?0:ease(q/7)*(1-ease((q-19)/7)),xx=x+17+f*61,yy=400-f*21;
  if(q>=0){
   if(q<27){rect(c,xx-3,yy-2,7,3,'#b5a980');ellipse(c,xx+4,yy-2,2,2,p.accent);line(c,xx-3,yy,xx-9,yy+Math.sin(t*2)*2,'#b5a980');line(c,xx-1,yy,xx-3,yy+3,p.trim);line(c,xx+2,yy,xx+4,yy+2,p.trim);}
   else if(q>=30){rect(c,x+17,399,3,2,p.accent);}
  }
  const inspect=q<0?0:ease((q-24)/6),wx=x+133-inspect*43;
  worker(c,wx,412,t,p,q>=24&&q<30);line(c,wx-2,397,wx-10,385,p.trim,2);
 }
 function quarry(c,x,t,p,cell,state){
  const q=phase(state,'stone_wedge',cell);
  poly(c,[[x+455,450],[x+460,380],[x+501,324],[x+628,329],[x+710,450]],'#43363b');shelf(c,x+460,403,239,p);
  room(c,x+513,346,106,57,p);rect(c,x+527,363,28,40,p.near);
  const close=q<0?0:ease(q/5)*(1-ease((q-11)/6)),opening=1-close*.83;
  rect(c,x+529,363,23*(1-opening)+3,39,'#8a715a');line(c,x+529,363,x+533+opening*15,366,p.trim,2);
  for(let k=0;k<3;k++)if(k!==1||q<9)poly(c,[[x+476+k*12,402],[x+480+k*12,397-k%2*4],[x+486+k*12,402]],p.trim);
  const wx=x+565-(q<0?0:ease((q-4)/5)*65)+(q<0?0:ease((q-10)/7)*45)+(q<0?0:ease((q-20)/8)*37);
  worker(c,wx,403,t,p,q>=4&&q<17||q>=20&&q<28);
  if(q>=9&&q<17){const f=ease((q-11)/6),sx=wx-7;poly(c,[[sx,392+f*8],[sx+5,386+f*9],[sx+10,392+f*8]],p.trim);}
  if(q>=17)poly(c,[[x+530,403],[x+538,396],[x+545,403]],p.trim);
  if(q>=20&&q<32){const xx=x+682-ease((q-20)/11)*143;if(xx>x+548)person(c,xx,403,t,p,{walk:true,carry:true,coat:'#a6a293'});}
 }
 function bridge(c,x,t,p,cell,state){
  const q=phase(state,'wind_plank',cell),dust=phase(state,'dust_curtain',cell),birds=phase(state,'rising_wings',cell);
  const floor=xx=>xx<=136||xx>=670?260:260+Math.sin((xx-136)/534*Math.PI)*21;
  shelf(c,x+655,260,74,p);room(c,x+696,228,27,32,p);
  line(c,x+130,211,x+130,259,p.trim,2);
  const strength=q<0?.45:q<8?1:1-ease((q-8)/4)*.7;
  poly(c,[[x+131,213],[x+151+strength*9,215+Math.sin(t*4)*strength*3],[x+152+strength*9,220+Math.sin(t*4)*strength*3],[x+131,222]],'#b89b78');
  if(q>=0&&q<32){
   const across=ease((q-11)/19),cx=124+across*562,cy=floor(cx),angle=-ease((q-7)/4)*Math.PI*.45;
   person(c,x+cx-10,floor(cx-10),t,p,{walk:q>=11,carry:true,coat:'#b39c81'});person(c,x+cx+11,floor(cx+11),t+3,p,{walk:q>=11,carry:true,coat:'#9ea69d'});
   c.save();c.translate(x+cx,cy-18);c.rotate(angle);rect(c,-24,-2,48,4,'#b09370');line(c,-22,-2,22,-2,p.light);c.restore();
  }
  if(q>=32)line(c,x+678,259,x+686,217,'#b09370',4);
  // Small windows across the gap continue their routine behind a passing veil.
  poly(c,[[x+294,450],[x+302,322],[x+418,302],[x+472,450]],'#725657');
  for(let k=0;k<4;k++){const xx=x+311+k*34,yy=331-k%2*13;rect(c,xx,yy,19,14,'#362c36');rect(c,xx+3,yy+3,7,6,p.light+'77');line(c,xx-2,yy+15,xx+23,yy+15,p.trim);}
  line(c,x+343,315,x+375,315,p.trim);rect(c,x+349+Math.sin(t*.8)*1.5,317,9,13,'#afa191');
  person(c,x+372,331,t,p,{scale:.55,action:'work',coat:'#b59d87'});
  const ly=325+(Math.sin(t*.12)+1)*19;line(c,x+433,312,x+433,ly,p.trim);rect(c,x+427,ly,12,7,'#99816b');
  if(dust>=0&&dust<33){
   const cover=ease(dust/5)*(1-ease((dust-14)/17));
   for(let k=0;k<8;k++){c.save();c.globalAlpha=cover*.30;ellipse(c,x+281+k*27+Math.sin(t*.3+k)*10,323+k%3*16,53,19,'#b38b78');c.restore();}
  }
  shelf(c,x+646,170,65,p);
  if(birds>=0){
   for(let k=0;k<5;k++){
    const f=ease((birds-k*2)/23),land=f>=1,spin=(birds-k*2)*.48;
    const bx=x+538+Math.sin(spin)*(1-f)*65+f*(115+k*10),by=473-f*305+Math.cos(spin)*(1-f)*9;
    if(land){rect(c,x+651+k*10,166,5,3,p.near);line(c,x+653+k*10,168,x+653+k*10,170,p.trim);}
    else {const bank=Math.cos(spin)*3;poly(c,[[bx-10,by+bank],[bx-3,by-2],[bx+1,by-3],[bx+10,by-bank],[bx+2,by+2],[bx-3,by+1]],'#d0b99a');}
   }
  }
 }
 function draw(c,s,t,travel,width,state={}){
  const p=s.p;if(p.id!=='gorge')return;
  const first=Math.floor(travel*8.5/768);
  for(let n=first-1;n<first+Math.ceil(width/768)+1;n++){
   const x=n*768-travel*8.5,cell=mod(n,3),clock=t+cell*13;
   if(p.district===1)bridge(c,x,clock,p,cell,state);
   else if(p.district===2)quarry(c,x,clock,p,cell,state);
   else if(p.district===3){steps(c,x,clock,p,cell,state);tea(c,x,clock,p,cell,state);gecko(c,x,clock,p,cell,state);}
   else {bakery(c,x,clock,p,cell,state);entrance(c,x,clock,p,cell,state);}
  }
 }
 return {draw};
}
