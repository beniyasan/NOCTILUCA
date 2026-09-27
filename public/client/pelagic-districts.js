// More of Pelagic Dock for the ride out: four extra districts (4-7) and
// alternate compositions for the ship dock and the fish-farm cove. The sea
// surface starts at y 273 in every Pelagic district, so everything here stands
// on piers and pontoons above it. Same 768 px block scheme as kowloon-districts.js.
// View-only: nothing here is saved, sent or counted.
import {glow} from './pixel.js';
import {blockOf} from './kowloon-districts.js';

export const PELAGIC_EXTRA=[
 ['魚市場の桟橋','桟橋に競りの台が並ぶ。灯りの下で、水揚げの箱が運ばれていく。'],
 ['浮き桟橋の住宅','浮かぶ家を渡り板がつなぐ。窓の灯りが、波に合わせて揺れる。'],
 ['潮位の防波堤','消波ブロックに波が砕ける。灯標の光が、沖をゆっくり掃く。'],
 ['海底トンネルの入口','海の下へ続く連絡口。渡し船が着き、人が灯りの中へ降りていく。'],
];

export function createPelagicDistricts(a){
 const {rect,line,ellipse,poly,ir,tower,dome,sign,person,crate,workCrane,shipBoat,mod,shuttling}=a;
 const DECK=330;
 function pier(c,x,w,y,p){rect(c,x,y,w,8,p.trim);rect(c,x,y+8,w,5,p.near);for(let k=6;k<w;k+=34){rect(c,x+k,y+13,5,450-y-13,p.near);rect(c,x+k,y+13,1,450-y-13,p.trim+'66');}}
 function lamp(c,x,y,p){rect(c,x,y,2,26,p.trim);rect(c,x-3,y-2,8,3,p.trim);glow(c,x-5,y,12,6,p.light,8);}
 function awning(c,x,w,y,col){poly(c,[[x-6,y],[x+w+6,y],[x+w-2,y-14],[x+2,y-14]],col);}
 function houseboat(c,x,y,w,p,lit,col){poly(c,[[x-6,y],[x+w+6,y],[x+w-4,y+16],[x+4,y+16]],p.near);rect(c,x,y-34,w,34,col);poly(c,[[x-4,y-34],[x+w/2,y-52],[x+w+4,y-34]],p.trim);for(let k=0;k<Math.floor(w/26);k++)rect(c,x+8+k*26,y-26,12,10,(k+lit)%2?p.light+'cc':p.accent+'66');}

 // ---- ship dock (2) and fish-farm cove (3): second and third block ----
 function dock(c,x,bi,p,r){
  if(bi===1){pier(c,x+20,720,DECK,p);workCrane(c,x+120,190,0,p);for(let k=0;k<4;k++)crate(c,x+300+k*60,DECK-28,48,28,p);tower(c,x+560,DECK,120,150,p,r);sign(c,x+580,196,80,18,p,r,false,'BERTH 4');}
  else{poly(c,[[x+60,300],[x+520,300],[x+470,352],[x+100,352]],'#1b3444');rect(c,x+120,250,280,50,p.mid);for(let k=0;k<9;k++)rect(c,x+130+k*30,262,16,10,p.light+'aa');line(c,x+300,250,x+300,180,p.trim,3);line(c,x+220,196,x+380,196,p.trim);pier(c,x+560,200,DECK,p);}
 }
 function cove(c,x,bi,p,r){
  if(bi===1){for(let k=0;k<3;k++){const xx=x+60+k*230;ellipse(c,xx+60,340,70,16,p.trim);ellipse(c,xx+60,340,66,13,'#164c59');for(let j=0;j<6;j++)rect(c,xx+8+j*20,326,3,14,p.trim);}dome(c,x+560,300,110,54,p,r,'KELP');}
  else{pier(c,x+10,300,DECK,p);rect(c,x+30,DECK-60,160,60,p.mid);sign(c,x+44,DECK-50,120,18,p,r,false,'HATCHERY');for(let k=0;k<3;k++){ellipse(c,x+420+k*110,352,44,12,p.trim);ellipse(c,x+420+k*110,352,40,9,'#164c59');}}
 }

 // ---- 4 魚市場の桟橋 ----
 function fishMarket(c,x,bi,p,r){
  pier(c,x,768,DECK,p);
  const n=bi===2?3:4;
  for(let k=0;k<n;k++){const xx=x+(bi===1?260:40)+k*130;rect(c,xx,DECK-44,110,44,p.mid);awning(c,xx,110,DECK-44,k%2?p.neon:'#d8e4de');rect(c,xx+6,DECK-20,98,20,p.near);for(let j=0;j<7;j++)rect(c,xx+10+j*13,DECK-26,9,5,j%2?'#c8d6dc':'#8fa6b0');lamp(c,xx+55,DECK-80,p);}
  if(bi===1)tower(c,x+40,DECK,150,170,p,r);else if(bi===2)tower(c,x+460,DECK,140,190,p,r);
  sign(c,x+(bi===1?300:520),220,100,20,p,r,false,bi===2?'AUCTION':'FISH');sign(c,x+(bi===1?230:500),250,16,50,p,r,true,'魚市');
 }
 // ---- 5 浮き桟橋の住宅 ----
 function floating(c,x,bi,p){
  const cols=['#2a4a5a','#3a3a52','#2f5048','#4a3a40'];
  const homes=bi===0?[[30,120],[200,90],[330,140],[520,110]]:bi===1?[[60,150],[260,100],[410,120],[600,100]]:[[20,100],[160,130],[340,90],[480,150]];
  homes.forEach(([hx,w],k)=>houseboat(c,x+hx,312-(k%2)*6,w,p,k,cols[(k+bi)%4]));
  for(let k=0;k<homes.length-1;k++){const a=homes[k],b=homes[k+1];rect(c,x+a[0]+a[1]+6,316,b[0]-a[0]-a[1]-12,3,p.trim);}
  if(bi===2){line(c,x+640,312,x+700,250,p.trim,2);for(let k=0;k<4;k++)rect(c,x+650+k*12,262+k*4,8,12,k%2?'#aa8e86':'#678c92');}
 }
 // ---- 6 潮位の防波堤 ----
 function seawall(c,x,bi,p,r){
  poly(c,[[x,300],[x+768,300],[x+768,340],[x,340]],'#1f3542');rect(c,x,296,768,5,p.trim);
  for(let k=0;k<14;k++){const xx=x+10+k*55,yy=340+(k%2)*8;poly(c,[[xx,yy],[xx+20,yy-14],[xx+40,yy],[xx+30,yy+10],[xx+10,yy+10]],'#3a5360');}
  if(bi===0){rect(c,x+380,170,26,126,'#d8d0c0');for(let k=0;k<5;k++)rect(c,x+380,180+k*24,26,8,'#b0413a');rect(c,x+374,164,38,8,p.trim);rect(c,x+384,150,18,14,'#0b1a24');}
  else if(bi===1){tower(c,x+80,296,120,120,p,r);sign(c,x+100,200,80,18,p,r,false,'TIDE');rect(c,x+500,240,6,56,p.trim);for(let k=0;k<6;k++)line(c,x+506,246+k*9,x+514,246+k*9,p.trim);}
  else{dome(c,x+480,296,140,50,p,r,'GATE');}
 }
 // ---- 7 海底トンネルの入口 ----
 function tunnel(c,x,bi,p,r){
  pier(c,x,768,DECK,p);
  if(bi===0){rect(c,x+220,220,330,110,p.mid);rect(c,x+220,216,330,6,p.trim);ellipse(c,x+385,330,70,60,'#0b1a24');ellipse(c,x+385,330,62,52,'#12404c');glow(c,x+330,286,110,40,p.accent,14);sign(c,x+300,232,170,22,p,r,false,'UNDERSEA');sign(c,x+230,240,16,60,p,r,true,'海底線');}
  else if(bi===1){for(let k=0;k<3;k++){rect(c,x+120+k*180,DECK-56,4,56,p.trim);rect(c,x+110+k*180,DECK-60,160,6,p.trim);}for(let k=0;k<8;k++)rect(c,x+130+k*60,DECK-14,30,4,p.light+'88');tower(c,x+640,DECK,110,160,p,r);sign(c,x+300,250,120,18,p,r,false,'FERRY');}
  else{tower(c,x+40,DECK,130,190,p,r);rect(c,x+260,DECK-90,180,90,p.mid);for(let k=0;k<5;k++)rect(c,x+272+k*34,DECK-74,20,30,p.accent+'44');sign(c,x+460,230,16,56,p,r,true,'連絡口');}
 }

 function layer(c,x,d,depth,p,r){
  const bi=blockOf(x);
  if(depth===1){
   if(d===2&&bi){dock(c,x,bi,p,r);return true;}
   if(d===3&&bi){cove(c,x,bi,p,r);return true;}
   if(d===4){fishMarket(c,x,bi,p,r);return true;}
   if(d===5){floating(c,x,bi,p);return true;}
   if(d===6){seawall(c,x,bi,p,r);return true;}
   if(d===7){tunnel(c,x,bi,p,r);return true;}
   return false;
  }
  if(d<4)return false;
  if(depth===0){
   const pp={...p,mid:p.far,near:p.far,trim:p.far};
   for(let k=0;k<4;k++)tower(c,x+k*190+ir(r,0,50),273,50+ir(r,0,40),60+ir(r,0,90),pp,r,0);
   if(d===6){rect(c,x+200+bi*120,200,8,73,p.far);rect(c,x+196+bi*120,196,16,6,p.far);}
   return true;
  }
  if(d===4||d===7){for(let k=0;k<3;k++)rect(c,x+120+k*260,420,6,30,p.near);}
  else if(d===5){ellipse(c,x+300,440,60,4,p.accent+'22');}
  return true;
 }
 function floor(){}
 function life(c,x,d,t,p,quiet,bi){
  if(d===4){
   for(let k=0;k<(quiet?2:4);k++){const xx=x+(bi===1?300:80)+k*130;person(c,xx,DECK,t+k,p,{action:k%2?'work':'idle',hat:k%2===0,coat:k%2?'#4a6a72':'#6a5a4a'});}
   const a=shuttling(t,34);person(c,x+60+a.f*600,DECK,t,p,{walk:true,dir:a.dir,carry:true});
  }else if(d===5){
   for(let k=0;k<(quiet?3:6);k++){const f=mod(t*.4+k/6,1);ellipse(c,x+80+k*110,318,6+f*16,1+f*2,p.accent+'33');}
   if(!quiet){const a=shuttling(t,48);person(c,x+120+a.f*400,316,t,p,{walk:true,dir:a.dir,coat:'#5a6a7a'});}
  }else if(d===6){
   for(let k=0;k<(quiet?3:7);k++){const ph=mod(t*.7+k*.37,1);if(ph<.4){const xx=x+40+k*105,h=ph*80;for(let j=0;j<6;j++)rect(c,xx+j*5-12,340-h*(1-Math.abs(j-2.5)/3),3,3,'#e8f6f4cc');}}
   if(bi===0){const ang=t*.8,bx=x+393,by=157;c.save();c.globalAlpha=.14;poly(c,[[bx,by],[bx+Math.cos(ang)*260,by+Math.sin(ang)*40-10],[bx+Math.cos(ang)*260,by+Math.sin(ang)*40+14]],'#fff3c4');c.restore();glow(c,bx-4,by-4,8,8,'#fff3c4',10);}
  }else if(d===7){
   for(let k=0;k<(quiet?2:4);k++){const a=shuttling(t+k*6,26);person(c,x+(bi===0?300:160)+k*28+a.f*(bi===0?40:300),DECK,t+k,p,{walk:true,dir:a.dir,coat:k%2?'#4a6a72':'#6a5a6a'});}
  }
 }
 function wide(c,d,t,travel,width,p){
  if(d===6||d===7){const span=width+500,xx=mod(-travel*8.5+t*(d===7?26:18),span)-250;shipBoat(c,xx,d===7?360:395,t,p,d===7?1.1:.8);}
 }
 return {layer,floor,life,wide};
}
