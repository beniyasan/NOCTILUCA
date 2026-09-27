// More districts for the Gorge Ridge, Jade Garden and Night Relay rides, and
// alternate compositions for their second and third districts. Same scheme as
// kowloon-districts.js: 768 px blocks, three to a tile, `bi` picks one.
// View-only: nothing here is saved, sent or counted.
import {glow} from './pixel.js';
import {blockOf} from './kowloon-districts.js';

export const GORGE_EXTRA=[
 ['風の吊り橋','谷を渡る吊り橋に、祈りの旗がはためく。風が吹くたび、橋がゆっくり揺れる。'],
 ['鉱石の精錬所','炉の口が赤く光り、ベルトが鉱石を運び上げる。火の粉が夜に散る。'],
 ['崖の僧院','岩を削った窓と長い石段。鐘の下で、灯りが一つずつともる。'],
 ['砂嵐の見張り台','砂丘の上の見張り台。砂が流れ、信号灯が遠くへまたたく。'],
];
export const JADE_EXTRA=[
 ['蓮池の茶屋','蓮の葉の上に灯籠が浮かぶ。池を渡る橋の先に、小さな茶屋がある。'],
 ['竹林の小径','竹の間の細い道。灯籠の明かりに、蛍がゆっくり集まる。'],
 ['花の市場','色とりどりの鉢が並ぶ屋台。水を撒く音と、花を包む手。'],
 ['天空温室','高い温室の塔に、つるが絡む。水やりの小型機が窓から窓へ渡る。'],
];
export const RELAY_EXTRA=[
 ['整備ハンガー','開いた格納庫に小型艇。作業腕が動き、溶接の光が瞬く。'],
 ['観測ドーム','望遠鏡のドームが並ぶ。細い光が星を追い、ゆっくり向きを変える。'],
 ['太陽帆の係留所','広げた太陽帆が、星の光を受けている。係留ポッドが列を作る。'],
 ['信号塔の森','細いアンテナが林のように並ぶ。信号の光が、塔から塔へ渡っていく。'],
];

export function createInnerDistricts(a){
 const {rect,line,ellipse,poly,ir,tower,pagoda,dome,industry,gardenTree,boulder,sign,person,steam,drone,robot,crate,drawRelayRing,mod,shuttling}=a;

 // ================= Gorge Ridge (kind rock) =================
 const G_FLOOR=420;
 function cliff(c,x,w,h,p,r){boulder(c,x,G_FLOOR+30,w,h,p,r);}
 function gorge(){
  function ledges(c,x,bi,p,r){ // district 2 alt
   if(bi===1){for(let k=0;k<3;k++){rect(c,x+60+k*220,300+k*20,160,24,p.mid);line(c,x+60+k*220,300+k*20,x+220+k*220,300+k*20,p.trim,3);}industry(c,x+500,420,110,120,p,r);line(c,x+120,324,x+640,360,p.trim,4);}
   else{cliff(c,x+20,300,260,p,r);for(let k=0;k<5;k++)crate(c,x+380+k*60,390,40,30,p);line(c,x+360,300,x+700,300,p.trim,4);for(let k=0;k<4;k++)line(c,x+380+k*90,300,x+380+k*90,390,p.trim,2);}
  }
  function village(c,x,bi,p,r){ // district 3 alt
   if(bi===1){cliff(c,x+10,480,330,p,r);for(let k=0;k<6;k++){const yy=250+(k%3)*44;tower(c,x+60+k*70,yy+40,56,40,p,r);rect(c,x+56+k*70,yy+40,64,4,p.trim);}line(c,x+600,180,x+600,420,p.trim,3);rect(c,x+590,260,20,18,p.near);}
   else{cliff(c,x+300,420,300,p,r);for(let k=0;k<4;k++){tower(c,x+40+k*80,420,60,90+k*20,p,r);}for(let k=0;k<5;k++)rect(c,x+360+k*50,300+(k%2)*30,30,20,p.light+'55');}
  }
  function bridge(c,x,bi,p,r){
   cliff(c,x-40,200,300,p,r);cliff(c,x+560,240,320,p,r);
   const y0=250+bi*14,y1=260-bi*10;
   for(let s=0;s<2;s++){let px=x+140,py=y0-s*26;for(let i=1;i<=12;i++){const t=i/12,xx=x+140+(560-140)*t,yy=y0+(y1-y0)*t+50*4*t*(1-t)-s*26;line(c,px,py,xx,yy,p.trim,s?1:3);px=xx;py=yy;}}
   for(let i=1;i<12;i++){const t=i/12,xx=x+140+420*t,yy=y0+(y1-y0)*t+200*t*(1-t);line(c,xx,yy,xx,yy-26,p.trim);rect(c,xx+2,yy-20,10,7,['#d8573c','#e8c24a','#4a8ad8','#e8e0d0','#4aa86a'][i%5]);}
   sign(c,x+80,220,16,52,p,r,true,'吊橋');
  }
  function smelter(c,x,bi,p,r){
   const n=bi===1?2:3;for(let k=0;k<n;k++){const xx=x+60+k*(bi===1?300:210);rect(c,xx,260,90,160,p.mid);poly(c,[[xx-8,262],[xx+45,220],[xx+98,262]],p.near);rect(c,xx+30,300,30,40,'#2a1a14');glow(c,xx+30,300,30,40,'#ff8a3a',12);rect(c,xx+36,306,18,28,'#ffb347');line(c,xx+45,220,xx+45,150,p.trim,6);}
   line(c,x+20,400,x+700,300,p.trim,5);for(let k=0;k<10;k++)crate(c,x+40+k*66,396-k*9.4,16,10,p);sign(c,x+(bi===2?520:600),200,70,18,p,r,false,'ORE');
  }
  function monastery(c,x,bi,p,r){
   cliff(c,x+(bi===1?260:40),bi===1?420:520,360,p,r);
   const ox=x+(bi===1?300:120);for(let k=0;k<4;k++){const yy=150+k*55;rect(c,ox+k*20,yy,160-k*20,40,'#5a4a44');for(let j=0;j<3;j++)rect(c,ox+k*20+14+j*44,yy+10,20,22,j===1?p.light+'cc':'#2a2226');rect(c,ox+k*20-6,yy-4,172-k*20,5,p.trim);}
   for(let k=0;k<12;k++)rect(c,ox+180+k*10,410-k*16,14,4,p.trim);
   rect(c,ox+60,110,40,36,p.near);poly(c,[[ox+54,110],[ox+80,90],[ox+106,110]],p.trim);ellipse(c,ox+80,130,8,10,'#c9a24a');sign(c,ox+200,220,16,54,p,r,true,'僧院');
  }
  function watch(c,x,bi,p,r){
   for(let k=0;k<3;k++)poly(c,[[x+k*260-40,420],[x+k*260+100,360+bi*6],[x+k*260+260,420]],'#6a5040');
   const tx=x+(bi===2?520:300);for(const dx of [0,50])line(c,tx+dx,420,tx+dx+(dx?-10:10),200,p.trim,4);for(let yy=230;yy<400;yy+=30)line(c,tx+8,yy,tx+42,yy+20,p.trim,2);rect(c,tx-10,180,70,26,p.mid);poly(c,[[tx-16,180],[tx+25,160],[tx+66,180]],p.near);
   if(bi===1)industry(c,x+560,420,100,90,p,r);else sign(c,x+80,330,70,16,p,r,false,'POST 9');
  }
  function layer(c,x,d,depth,p,r){
   const bi=blockOf(x);
   if(depth===1){
    if(d===2&&bi){ledges(c,x,bi,p,r);return true;}
    if(d===3&&bi){village(c,x,bi,p,r);return true;}
    if(d===4){bridge(c,x,bi,p,r);return true;}if(d===5){smelter(c,x,bi,p,r);return true;}if(d===6){monastery(c,x,bi,p,r);return true;}if(d===7){watch(c,x,bi,p,r);return true;}
    return false;
   }
   if(d<4)return false;
   if(depth===0){const pp={...p,mid:p.far,near:p.far,trim:p.far};for(let k=0;k<3;k++)boulder(c,x+k*260+ir(r,-30,30),420,ir(r,180,300),ir(r,150,260),pp,r,false);return true;}
   if(d===7){for(let k=0;k<4;k++)poly(c,[[x+k*200,450],[x+k*200+90,428],[x+k*200+200,450]],'#4a3830');}
   else for(let k=0;k<2;k++)boulder(c,x+100+k*380,470,ir(r,80,140),ir(r,50,90),{...p,mid:'#222631',near:'#111b27',trim:'#574851'},r,false);
   return true;
  }
  function floor(c,d,width,p){rect(c,0,G_FLOOR,width,30,p.near);line(c,0,G_FLOOR,width,G_FLOOR,p.trim,2);if(d===7)for(let x=0;x<width;x+=40)rect(c,x+10,G_FLOOR+6,20,2,'#8a6a50');}
  function life(c,x,d,t,p,quiet,bi){
   if(d===4){const a=shuttling(t,40);const tt=a.f,xx=x+140+420*tt,yy=(250+bi*14)+(260-bi*10-(250+bi*14))*tt+200*tt*(1-tt);person(c,xx,yy,t,p,{walk:true,dir:a.dir,carry:true,coat:'#6a5a4a'});}
   else if(d===5){for(let k=0;k<(quiet?4:10);k++){const f=mod(t*.6+k/10,1);rect(c,x+100+(k%3)*210+Math.sin(k+t)*10,250-f*90,2,2,f<.5?'#ffd08a':'#ff8a3a');}for(let k=0;k<4;k++){const f=mod(t*.1+k/4,1);crate(c,x+40+f*640,396-f*90,16,10,p);}}
   else if(d===6){if(!quiet)for(let k=0;k<2;k++){const ox=x+(bi===1?300:120);person(c,ox+180+mod(t*6+k*40,110),410-mod(t*6+k*40,110)*1.6,t+k,p,{walk:true,coat:'#8a4a3a'});}}
   else if(d===7){for(let k=0;k<(quiet?8:22);k++){const f=mod(t*.8+k*.13,1);c.globalAlpha=.35;rect(c,x+mod(k*97+t*120,768),300+(k%7)*16,10+f*14,1,'#e8c8a0');c.globalAlpha=1;}if(Math.sin(t*3)>0)glow(c,x+(bi===2?540:320),176,10,6,p.neon,10);}
  }
  function wide(){}
  return {layer,floor,life,wide};
 }

 // ================= Jade Garden (kind garden) =================
 const J_FLOOR=405;
 function jade(){
  function nursery(c,x,bi,p,r){ // district 2 alt
   if(bi===1){for(let k=0;k<2;k++)dome(c,x+60+k*330,379,260,110,p,r,'SEEDS');for(let k=0;k<8;k++)gardenTree(c,x+40+k*90,379,40,r,p,k%2===0);}
   else{for(let k=0;k<5;k++){rect(c,x+30+k*140,330,110,49,p.mid);poly(c,[[x+24+k*140,330],[x+85+k*140,300],[x+146+k*140,330]],'#6aa89a66');for(let j=0;j<4;j++)rect(c,x+40+k*140+j*24,352,14,9,'#8a6660');}}
  }
  function waterside(c,x,bi,p,r){ // district 3 alt
   if(bi===1){rect(c,x,360,768,6,p.trim);for(let k=0;k<6;k++)rect(c,x+40+k*120,366,4,30,p.near);pagoda(c,x+300,360,140,110,p,r);gardenTree(c,x+60,360,120,r,p,true);gardenTree(c,x+620,360,110,r,p);}
   else{for(let k=0;k<3;k++){const xx=x+60+k*240;poly(c,[[xx,380],[xx+60,340],[xx+120,380]],p.trim);rect(c,xx,380,120,4,p.trim);}gardenTree(c,x+700,380,140,r,p,true);}
  }
  function teahouse(c,x,bi,p,r){
   for(let k=0;k<9;k++)ellipse(c,x+40+k*80+(k%2)*20,398+(k%3)*6,22,6,'#3f7a55');
   const tx=x+(bi===1?80:420);rect(c,tx,300,200,80,'#5a4038');roofLayer(c,tx-14,300,228,p);for(let k=0;k<4;k++)rect(c,tx+16+k*46,320,30,40,p.light+'99');
   poly(c,[[x+(bi===1?300:160),398],[x+(bi===1?360:240),370],[x+(bi===1?420:320),398]],p.trim);sign(c,tx+90,270,16,40,p,r,true,'茶');gardenTree(c,x+(bi===1?600:60),405,160,r,p,true);
  }
  function roofLayer(c,x,y,w,p){poly(c,[[x,y],[x+w,y],[x+w-20,y-26],[x+20,y-26]],'#2f3f3a');line(c,x-4,y,x+w+4,y,p.trim,2);}
  function bamboo(c,x,bi,p,r){
   for(let k=0;k<26;k++){const bx=x+k*30+ir(r,0,10),h=ir(r,220,360);rect(c,bx,J_FLOOR-h,6,h,k%3?'#4a8a5a':'#5fa06a');for(let yy=J_FLOOR-h+20;yy<J_FLOOR;yy+=34)rect(c,bx-1,yy,8,2,'#2f5f3f');for(let j=0;j<3;j++)poly(c,[[bx+3,J_FLOOR-h+j*30],[bx+22,J_FLOOR-h+j*30+6],[bx+3,J_FLOOR-h+j*30+10]],'#3f7a4a');}
   rect(c,x,J_FLOOR-8,768,8,'#6a5a44');for(let k=0;k<3;k++){const lx=x+120+k*240+bi*30;rect(c,lx,J_FLOOR-40,10,32,'#8a7a60');rect(c,lx-3,J_FLOOR-52,16,12,'#e8d8a0');glow(c,lx-2,J_FLOOR-50,14,10,'#ffe7a1',8);}
  }
  function flowers(c,x,bi,p,r){
   const cols=['#faa2c3','#ffe7a1','#c8a2fa','#ff8a8a','#93e9ba'];
   tower(c,x+(bi===2?600:20),J_FLOOR,120,170,p,r);
   for(let k=0;k<4;k++){const xx=x+(bi===2?40:180)+k*130;rect(c,xx,J_FLOOR-40,110,40,p.near);poly(c,[[xx-6,J_FLOOR-40],[xx+116,J_FLOOR-40],[xx+106,J_FLOOR-58],[xx+4,J_FLOOR-58]],k%2?'#5a8a6a':'#8a5a6a');for(let j=0;j<9;j++){rect(c,xx+6+j*11,J_FLOOR-48,8,8,'#8a6660');ellipse(c,xx+10+j*11,J_FLOOR-52,5,4,cols[(j+k+bi)%5]);}}
   sign(c,x+(bi===2?300:420),270,90,18,p,r,false,'FLOWERS');
  }
  function skyhouse(c,x,bi,p,r){
   const n=bi===1?2:3;for(let k=0;k<n;k++){const xx=x+60+k*(bi===1?340:230),h=200+k*40;rect(c,xx,J_FLOOR-h,120,h,'#1f4a4488');for(let yy=J_FLOOR-h;yy<J_FLOOR;yy+=24)line(c,xx,yy,xx+120,yy,p.trim+'aa');for(let j=0;j<=4;j++)line(c,xx+j*30,J_FLOOR-h,xx+j*30,J_FLOOR,p.trim+'aa');dome(c,xx,J_FLOOR-h,120,40,p,r,' ');for(let j=0;j<6;j++)gardenTree(c,xx+10+j*18,J_FLOOR-h+60+j*30,30,r,p,j%2===0);}
  }
  function layer(c,x,d,depth,p,r){
   const bi=blockOf(x);
   if(depth===1){
    if(d===2&&bi){nursery(c,x,bi,p,r);return true;}
    if(d===3&&bi){waterside(c,x,bi,p,r);return true;}
    if(d===4){teahouse(c,x,bi,p,r);return true;}if(d===5){bamboo(c,x,bi,p,r);return true;}if(d===6){flowers(c,x,bi,p,r);return true;}if(d===7){skyhouse(c,x,bi,p,r);return true;}
    return false;
   }
   if(d<4)return false;
   if(depth===0){for(let k=0;k<4;k++)gardenTree(c,x+k*200+ir(r,0,40),380,ir(r,140,220),r,{...p,mid:p.far,near:p.far,trim:p.far});return true;}
   if(d===5){for(let k=0;k<3;k++)rect(c,x+k*260+40,300,10,150,'#1f3f2a');}
   else gardenTree(c,x+300+bi*100,478,150,r,p,d===4);
   return true;
  }
  function floor(c,d,width,p){rect(c,0,J_FLOOR,width,45,p.near);line(c,0,J_FLOOR,width,J_FLOOR,p.trim,2);if(d===4){c.globalAlpha=.5;rect(c,0,J_FLOOR+4,width,20,'#1a4a4a');c.globalAlpha=1;}}
  function life(c,x,d,t,p,quiet,bi){
   if(d===4){for(let k=0;k<(quiet?2:4);k++){const f=Math.sin(t*.6+k);rect(c,x+80+k*170+f*6,392,6,5,'#ffe7a1');glow(c,x+78+k*170+f*6,390,10,8,'#ffe7a1',6);}person(c,x+(bi===1?180:520),380,t,p,{action:'drink',coat:'#7a6a5a'});}
   else if(d===5){for(let k=0;k<(quiet?6:16);k++){const fx=x+mod(k*53+Math.sin(t*.7+k)*30,768),fy=300+Math.sin(t*1.3+k*2)*40+(k%4)*20;if(Math.sin(t*4+k)>0)glow(c,fx,fy,3,3,'#d8ff9a',6);}const a=shuttling(t,50);person(c,x+60+a.f*640,J_FLOOR-8,t,p,{walk:true,dir:a.dir,coat:'#5a6a5a'});}
   else if(d===6){for(let k=0;k<(quiet?2:4);k++)person(c,x+(bi===2?90:230)+k*130,J_FLOOR,t+k,p,{action:k%2?'work':'idle',coat:k%2?'#7a5a6a':'#5a7a6a'});if(!quiet)steam(c,x+(bi===2?100:240),J_FLOOR-60,t,p,3);}
   else if(d===7){const a=shuttling(t,24);drone(c,x+80+a.f*560,J_FLOOR-160-Math.sin(t)*20,t,p);}
  }
  function wide(){}
  return {layer,floor,life,wide};
 }

 // ================= Night Relay (kind void) =================
 function relay(){
  function podBay(c,x,bi,p,r){ // district 2 alt
   if(bi===1){rect(c,x+40,330,680,10,p.trim);for(let k=0;k<5;k++){rect(c,x+70+k*130,270,90,60,p.mid);rect(c,x+70+k*130,270,90,4,p.accent);rect(c,x+100+k*130,290,30,20,p.light+'66');}}
   else{drawRelayRing(c,x+200,200,70,p,0);rect(c,x+380,300,300,8,p.trim);for(let k=0;k<4;k++)sign(c,x+390+k*74,310,60,16,p,r,false,'DOCK '+(k+5));}
  }
  function wings(c,x,bi,p){ // district 3 alt
   if(bi===1){for(let k=0;k<3;k++){const xx=x+60+k*230;rect(c,xx,200,4,180,p.trim);poly(c,[[xx+4,200],[xx+180,230],[xx+180,300],[xx+4,280]],'#2a3a6a');for(let j=1;j<5;j++)line(c,xx+4+j*35,200+j*6,xx+4+j*35,280+j*4,p.accent+'55');}}
   else{rect(c,x+100,260,560,6,p.trim);for(let k=0;k<6;k++){poly(c,[[x+120+k*90,266],[x+190+k*90,266],[x+170+k*90,340],[x+140+k*90,340]],'#2a3a6a');}}
  }
  function hangar(c,x,bi,p,r){
   rect(c,x+80,190,560,200,p.mid);rect(c,x+80,190,560,8,p.trim);rect(c,x+110,220,500,170,'#0b1020');for(let k=0;k<10;k++)rect(c,x+120+k*50,224,30,4,p.light+'88');
   const sx=x+260+bi*30;poly(c,[[sx,340],[sx+140,320],[sx+220,340],[sx+140,360]],'#9aa4c0');rect(c,sx+60,330,60,10,p.accent+'88');
   for(const ax of [150,560]){line(c,x+ax,390,x+ax,300,p.trim,4);line(c,x+ax,300,x+ax+(ax<300?80:-80),280,p.trim,3);}
   sign(c,x+300,160,140,20,p,r,false,'HANGAR '+(bi+2));
  }
  function observatory(c,x,bi,p,r){
   rect(c,x,380,768,8,p.trim);for(let k=0;k<3;k++){const ox=x+80+k*240+(bi===1?40:0);dome(c,ox,380,140,80,p,r,' ');rect(c,ox+60,300,20,12,'#0b1020');line(c,ox+70,306,ox+110-bi*20,250,p.trim,4);}
   sign(c,x+(bi===2?560:40),300,90,16,p,r,false,'OBSERVE');
  }
  function sails(c,x,bi,p){
   for(let k=0;k<(bi===1?2:3);k++){const sx=x+60+k*(bi===1?340:240);line(c,sx,380,sx,120,p.trim,3);poly(c,[[sx,130],[sx+170,160],[sx+170,300],[sx,330]],'#3a4a8a88');for(let j=1;j<4;j++)line(c,sx,130+j*50,sx+170,160+j*35,p.accent+'66');line(c,sx,130,sx+170,160,p.light,1);}
   rect(c,x,380,768,6,p.trim);for(let k=0;k<6;k++){ellipse(c,x+60+k*120,395,18,10,p.mid);rect(c,x+50+k*120,392,20,4,p.accent+'88');}
  }
  function antennas(c,x,bi,p,r){
   for(let k=0;k<14;k++){const ax=x+20+k*54+ir(r,0,10),h=ir(r,120,300);line(c,ax,390,ax,390-h,p.trim,2);for(let yy=390-h+20;yy<390;yy+=40)line(c,ax-8,yy,ax+8,yy,p.trim);rect(c,ax-2,390-h-4,4,4,k%3?p.accent:p.neon);}
   rect(c,x,390,768,6,p.trim);if(bi===1)dome(c,x+300,390,160,70,p,r,'SIGNAL');
  }
  function layer(c,x,d,depth,p,r){
   const bi=blockOf(x);
   if(depth===1){
    if(d===2&&bi){podBay(c,x,bi,p,r);return true;}
    if(d===3&&bi){wings(c,x,bi,p);return true;}
    if(d===4){hangar(c,x,bi,p,r);return true;}if(d===5){observatory(c,x,bi,p,r);return true;}if(d===6){sails(c,x,bi,p);return true;}if(d===7){antennas(c,x,bi,p,r);return true;}
    return false;
   }
   if(d<4)return false;
   if(depth===0){for(let k=0;k<3;k++){rect(c,x+k*260+40,200+ir(r,0,80),140,6,p.far);rect(c,x+k*260+100,120,6,200,p.far);}return true;}
   rect(c,x+200+bi*120,420,180,10,p.near);return true;
  }
  function floor(){}
  function life(c,x,d,t,p,quiet,bi){
   if(d===4){const on=Math.sin(t*6)>.3;if(on)glow(c,x+(bi?300:330),330,8,8,'#fff3c4',10);robot(c,x+200,390,t,p,.9);}
   else if(d===5){for(let k=0;k<3;k++){const ox=x+80+k*240+(bi===1?40:0),ang=Math.sin(t*.2+k)*.6-1.2;c.save();c.globalAlpha=.15;poly(c,[[ox+70,300],[ox+70+Math.cos(ang)*300-8,300+Math.sin(ang)*300],[ox+70+Math.cos(ang)*300+8,300+Math.sin(ang)*300]],p.accent);c.restore();}}
   else if(d===6){for(let k=0;k<(quiet?2:4);k++){const f=mod(t*.05+k/4,1);ellipse(c,x+f*768,395,14,8,p.accent+'66');}}
   else if(d===7){for(let k=0;k<(quiet?3:7);k++){const f=mod(t*.9+k*.23,1);glow(c,x+20+mod(k*110+f*200,740),200+(k%4)*40,4,3,k%2?p.accent:p.neon,8);}}
  }
  function wide(){}
  return {layer,floor,life,wide};
 }
 return {rock:gorge(),garden:jade(),void:relay()};
}
