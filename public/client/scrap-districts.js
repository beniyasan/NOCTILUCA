// More of the Scrap Belt for the ride out: four extra districts (4-7) and
// alternate compositions for the sorting yard and the engine shops. Same block
// scheme as kowloon-districts.js: 768 px blocks, three to a tile, `bi` picks one.
// View-only: nothing here is saved, sent or counted.
import {glow} from './pixel.js';
import {blockOf} from './kowloon-districts.js';

export const SCRAP_EXTRA=[
 ['溶断の火花街','切り分けられる船殻から、火花が落ちる。足場の上で溶断の灯りが揺れる。'],
 ['部品の露天市','幌の下に部品が並ぶ。裸電球の列と、値札を書き直す店主。'],
 ['廃船の墓場','傾いた巨大な船殻が並ぶ。探照灯が、まだ使える部品を探している。'],
 ['コンテナの集落','積み上げたコンテナが家になる。はしごと通路、窓に灯りがともる。'],
];

export function createScrapDistricts(a){
 const {rect,line,ellipse,poly,ir,tower,industry,sign,person,steam,drone,robot,crate,wreck,workCrane,mod,shuttling}=a;
 const FLOOR=400,RUST='#7a4a32',RUST2='#5a3a2a';
 function ribs(c,x,y,w,h,p){for(let k=0;k<=w;k+=18)line(c,x+k,y,x+k-8,y+h,p.trim,2);line(c,x,y,x+w,y,p.trim,3);}
 function scaffold(c,x,y,w,h,p){for(let k=0;k<=w;k+=28)line(c,x+k,y,x+k,y+h,p.trim);for(let j=0;j<=h;j+=24)line(c,x,y+j,x+w,y+j,p.trim);}
 function container(c,x,y,w,h,col,p,lit=0){rect(c,x,y,w,h,col);rect(c,x,y,w,2,'#00000044');for(let k=6;k<w;k+=6)line(c,x+k,y+2,x+k,y+h-1,'#00000033');if(lit){rect(c,x+w*.3,y+h*.3,10,8,p.light+'cc');if(lit>1)rect(c,x+w*.62,y+h*.3,10,8,p.accent+'99');}}
 function bulbs(c,x1,x2,y,sag,p){for(let i=0;i<=10;i++){const t=i/10,xx=x1+(x2-x1)*t,yy=y+sag*4*t*(1-t);if(i)line(c,x1+(x2-x1)*(i-1)/10,y+sag*4*((i-1)/10)*(1-(i-1)/10),xx,yy,p.trim);rect(c,xx-1,yy+1,3,4,p.light);glow(c,xx-2,yy+2,5,5,p.light,5);}}

 // ---- sorting yard (2) and engine shops (3): second and third block ----
 function sorting(c,x,bi,p,r){
  if(bi===1){industry(c,x+40,385,90,160,p,r);rect(c,x+150,352,400,8,p.trim);for(let k=0;k<9;k++)rect(c,x+160+k*44,360,8,25,p.near);for(let k=0;k<3;k++)container(c,x+580,385-(k+1)*34,120,34,[RUST,'#3d5a60','#6a5a3a'][k],p);sign(c,x+300,318,120,20,p,r,false,'SORT B');}
  else{for(let k=0;k<4;k++){const xx=x+40+k*170;rect(c,xx,300,12,85,p.trim);rect(c,xx-20,296,52,6,p.trim);}line(c,x+30,300,x+700,300,p.trim,3);for(let k=0;k<6;k++)crate(c,x+80+k*100,360,40,25,p);industry(c,x+600,385,100,120,p,r);}
 }
 function engines(c,x,bi,p,r){
  if(bi===1){for(let k=0;k<3;k++){const xx=x+60+k*220;ellipse(c,xx+60,320,56,56,p.near);ellipse(c,xx+60,320,50,50,p.trim);ellipse(c,xx+60,320,40,40,p.mid);rect(c,xx,376,120,9,p.trim);}sign(c,x+300,220,120,20,p,r,false,'THRUST');}
  else{wreck(c,x+30,300,260,85,p,r,true);tower(c,x+340,385,120,190,p,r);industry(c,x+500,385,160,110,p,r);rect(c,x+480,272,200,6,p.trim);}
 }

 // ---- 4 溶断の火花街 ----
 function cutting(c,x,bi,p,r){
  if(bi===0){poly(c,[[x+80,390],[x+120,210],[x+470,190],[x+520,390]],RUST2);ribs(c,x+130,214,330,170,p);rect(c,x+200,250,120,60,'#0b1018');scaffold(c,x+540,220,140,170,p);sign(c,x+560,196,100,20,p,r,false,'CUT 04');}
  else if(bi===1){for(let k=0;k<2;k++){const yy=250+k*70;poly(c,[[x+60,yy],[x+420,yy-20],[x+430,yy+40],[x+70,yy+50]],k?RUST:RUST2);line(c,x+60,yy,x+420,yy-20,p.trim,2);}for(const px of [100,380])rect(c,x+px,320,12,80,p.trim);workCrane(c,x+560,200,0,p);}
  else{for(let k=0;k<4;k++){const ang=k*Math.PI/2+.4,cx=x+230,cy=280;poly(c,[[cx,cy],[cx+Math.cos(ang)*110,cy+Math.sin(ang)*110],[cx+Math.cos(ang+.35)*100,cy+Math.sin(ang+.35)*100]],RUST);}ellipse(c,x+230,280,22,22,p.trim);rect(c,x+180,380,100,20,p.trim);industry(c,x+420,400,120,120,p,r);tower(c,x+580,400,110,160,p,r);}
 }
 // ---- 5 部品の露天市 ----
 function partsMarket(c,x,bi,p,r){
  const n=bi===1?4:5,cols=[p.neon,p.accent,'#c9a24a',p.trim];
  tower(c,x+(bi===2?600:20),FLOOR,110,190,p,r);
  for(let k=0;k<n;k++){const xx=x+(bi===2?20:150)+k*112;poly(c,[[xx-6,330],[xx+100,330],[xx+92,314],[xx+2,314]],cols[(k+bi)%4]);rect(c,xx+4,330,3,48,p.trim);rect(c,xx+90,330,3,48,p.trim);rect(c,xx,366,96,34,p.near);for(let j=0;j<8;j++)rect(c,xx+6+j*11,358-(j%3)*3,7,6+(j%3)*3,j%2?p.trim:p.light+'aa');}
  bulbs(c,x+(bi===2?20:150),x+(bi===2?580:700),300,22,p);
  sign(c,x+(bi===2?480:60),240,16,56,p,r,true,'部品');sign(c,x+(bi===2?260:330),256,100,18,p,r,false,bi?'JUNK':'PARTS');
 }
 // ---- 6 廃船の墓場 ----
 function graveyard(c,x,bi,p,r){
  // A beached hull lying at an angle: tall stern, deck line, portholes, a leaning mast.
  const [sx,len,tilt]=[[60,420,-.12],[220,440,.1],[30,380,-.06]][bi],base=392;
  const pt=(u,v)=>[x+sx+u*Math.cos(tilt)-v*Math.sin(tilt),base+u*Math.sin(tilt)+v*Math.cos(tilt)];
  poly(c,[pt(0,0),pt(0,-110),pt(40,-120),pt(len-40,-86),pt(len,-40),pt(len-30,0)],RUST2);
  poly(c,[pt(20,-10),pt(20,-100),pt(len-60,-78),pt(len-40,-12)],'#4a3226');
  line(c,...pt(0,-110),...pt(len-40,-86),p.trim,3);
  for(let k=1;k<10;k++){const [wx,wy]=pt(30+k*(len-90)/10,-60);ellipse(c,wx,wy,4,4,k%4?'#0b1018':p.light+'88');}
  for(let k=0;k<5;k++){const [rx,ry]=pt(60+k*70,-100);line(c,rx,ry,rx+6,ry+84,p.trim+'66',2);}
  const [mx,my]=pt(len*.55,-96);line(c,mx,my,mx-18,my-110,p.trim,3);line(c,mx-18,my-110,mx+40,my-92,p.trim);
  if(bi!==1)wreck(c,x+(bi?420:500),268,220,110,p,r,false);else workCrane(c,x+60,200,0,p);
 }
 // ---- 7 コンテナの集落 ----
 function containers(c,x,bi,p,r){
  const cols=[RUST,'#3d5a60','#6a5a3a','#4a3a5a',RUST2];
  const stacks=bi===0?[[40,4],[190,3],[340,5],[500,3]]:bi===1?[[60,3],[240,5],[420,4],[590,2]]:[[20,5],[200,2],[360,4],[560,4]];
  for(const [sx,hgt] of stacks)for(let k=0;k<hgt;k++)container(c,x+sx,FLOOR-(k+1)*30,130,30,cols[(sx/10+k)%5|0],p,(k+sx)%3);
  for(const [sx,hgt] of stacks){for(let k=0;k<hgt*30;k+=6)line(c,x+sx+134,FLOOR-k,x+sx+140,FLOOR-k,p.trim);line(c,x+sx+134,FLOOR,x+sx+134,FLOOR-hgt*30,p.trim);}
  rect(c,x+stacks[1][0]-20,FLOOR-92,stacks[2][0]-stacks[1][0]+20,4,p.trim);sign(c,x+stacks[2][0]+20,FLOOR-stacks[2][1]*30-24,90,18,p,r,false,'HOME');
  for(let k=0;k<5;k++)rect(c,x+stacks[0][0]+10+k*22,FLOOR-stacks[0][1]*30-18,12,16,k%2?'#aa8e86':'#678c92');line(c,x+stacks[0][0],FLOOR-stacks[0][1]*30-20,x+stacks[0][0]+130,FLOOR-stacks[0][1]*30-20,p.trim);
 }

 function layer(c,x,d,depth,p,r){
  const bi=blockOf(x);
  if(depth===1){
   if(d===2&&bi){sorting(c,x,bi,p,r);return true;}
   if(d===3&&bi){engines(c,x,bi,p,r);return true;}
   if(d===4){cutting(c,x,bi,p,r);return true;}
   if(d===5){partsMarket(c,x,bi,p,r);return true;}
   if(d===6){graveyard(c,x,bi,p,r);return true;}
   if(d===7){containers(c,x,bi,p,r);return true;}
   return false;
  }
  if(d<4)return false;
  if(depth===0){
   const pp={...p,mid:p.far,near:p.far,trim:p.far};
   if(d===6){wreck(c,x+ir(r,0,200),230,420,110,pp,r);wreck(c,x+400,250,300,90,pp,r);}
   else for(let k=0;k<4;k++)industry(c,x+k*190+ir(r,0,40),400,80+ir(r,0,50),120+ir(r,0,120),pp,r);
   return true;
  }
  if(d===4){for(let k=0;k<3;k++)crate(c,x+100+k*240,420,40,26,p);}
  else if(d===5){line(c,x,418,x+768,418,p.near,4);}
  else if(d===6){for(let k=0;k<4;k++){ellipse(c,x+90+k*190,448,60,14,'#241e1c');rect(c,x+60+k*190,438,18,6,RUST2);rect(c,x+100+k*190,440,12,4,p.trim);}}
  else if(d===7){line(c,x,30,x+768,52,p.trim);for(let k=0;k<12;k++)rect(c,x+30+k*62,40+k*1.8,10,14,k%2?'#aa8e86':'#678c92');}
  return true;
 }
 function floor(c,d,width,p){rect(c,0,FLOOR,width,50,p.near);line(c,0,FLOOR,width,FLOOR,p.trim,2);if(d===6)for(let x=0;x<width;x+=38)rect(c,x+ (x%5),FLOOR+8+(x%3)*6,14,2,RUST2);}
 function life(c,x,d,t,p,quiet,bi){
  if(d===4){
   const spots=bi===0?[[250,260],[330,300],[600,260]]:bi===1?[[200,250],[330,320]]:[[230,280],[470,330]];
   for(const [sx,sy] of spots){const on=Math.sin(t*5+sx)>-.2;if(on){glow(c,x+sx-3,sy-3,6,6,'#ffd9a0',8);for(let k=0;k<(quiet?3:7);k++){const f=mod(t*1.3+k/7+sx,1);rect(c,x+sx+(k-3)*3*f,sy+f*f*60,1,2,k%2?p.light:p.neon);}}}
   person(c,x+spots[0][0]+14,spots[0][1]+26,t,p,{action:'work',hat:true});
  }else if(d===5){
   for(let k=0;k<(quiet?2:4);k++){const xx=x+(bi===2?40:170)+k*112;person(c,xx+50,FLOOR,t+k,p,{action:k%2?'read':'idle',dir:k%2?1:-1,coat:k%2?'#6a5a4a':'#4a5a6a'});}
   robot(c,x+(bi===2?520:110),FLOOR,t,p,.9);
  }else if(d===6){
   const a=shuttling(t,33),dx=x+120+a.f*480;drone(c,dx,200,t,p);c.save();c.globalAlpha=.12;poly(c,[[dx,206],[dx-50,400],[dx+50,400]],p.light);c.restore();
  }else if(d===7){
   for(let k=0;k<(quiet?1:3);k++){const a=shuttling(t+k*9,30+k*7);person(c,x+200+k*150+a.f*80,FLOOR-88-(k%2)*30,t+k,p,{walk:true,dir:a.dir,coat:'#5a6a6a'});}
   if(!quiet)steam(c,x+400,FLOOR-150,t,p,3);
  }
 }
 function wide(c,d,t,travel,width){
  if(d===4){for(let k=0;k<3;k++){const f=mod(t*.1+k/3,1);c.globalAlpha=.08;ellipse(c,mod(k*610-travel*8.5,width+200)-100,380-f*120,40+f*40,10+f*10,'#c0b0a0');c.globalAlpha=1;}}
 }
 return {layer,floor,life,wide};
}
