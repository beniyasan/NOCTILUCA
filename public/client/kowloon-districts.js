// More of Neon Kowloon for the ride out of town: four extra districts (4-7) and
// alternate compositions for the canal and rooftop districts, so that the panes
// of a wide window rarely show the same block. Every block is 768 px wide and a
// tile holds three of them; `bi` (0-2) picks the composition for a block, so the
// three blocks of a tile differ and the tile still repeats seamlessly.
// View-only: nothing here is saved, sent or counted.
import {glow} from './pixel.js';

export const KOWLOON_EXTRA=[
 ['電脳街','部品の露店と、積み上がったモニター。ケーブルの束が路地の上を渡る。'],
 ['高架の乗換駅','二段の高架を、小さな列車がすれ違う。乗換の案内板が灯る。'],
 ['雨の歩道橋','傘の列が歩道橋を渡る。濡れた路面に、看板の色が伸びる。'],
 ['廟と屋台の路地','提灯の下で線香の煙が上る。屋台の湯気が、廟の屋根にかかる。'],
];
export const blockOf=x=>((Math.round(x/768)%3)+3)%3;

export function createKowloonDistricts(a){
 const {rect,line,ellipse,poly,ir,tower,pagoda,industry,sign,person,steam,drone,crate,mod,shuttling}=a;
 const FLOOR={4:405,5:430,6:410,7:400};
 const RED='#8a2a36',ROOF='#2c1b2a',LANTERN='#e2453c';
 // A drooping cable between two points.
 function cable(c,x1,y1,x2,y2,sag,col,w=1){let px=x1,py=y1;for(let i=1;i<=10;i++){const t=i/10,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t+sag*4*t*(1-t);line(c,px,py,x,y,col,w);px=x;py=y;}}
 function screens(c,x,y,cols,rows,p,w=22,h=14){for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const xx=x+i*(w+4),yy=y+j*(h+4);rect(c,xx,yy,w,h,'#0a1220');rect(c,xx+2,yy+2,w-4,h-4,(i+j)%3===0?p.accent+'66':(i+j)%3===1?p.neon+'55':p.light+'44');}}
 function lanterns(c,x1,x2,y,sag,p){cable(c,x1,y,x2,y,sag,p.trim);for(let i=1;i<8;i++){const t=i/8,xx=x1+(x2-x1)*t,yy=y+sag*4*t*(1-t);line(c,xx,yy,xx,yy+5,p.trim);ellipse(c,xx,yy+10,5,6,LANTERN);rect(c,xx-3,yy+4,6,1,'#f6c26b');glow(c,xx-2,yy+8,4,4,'#ff8a5c',6);}}
 function roofTiers(c,x,y,w,tiers,p){for(let k=0;k<tiers;k++){const ww=w-k*26,xx=x+k*13,yy=y-k*22;poly(c,[[xx-10,yy],[xx+ww+10,yy],[xx+ww-6,yy-12],[xx+6,yy-12]],ROOF);line(c,xx-12,yy,xx+ww+12,yy,p.neon+'aa',2);rect(c,xx-14,yy-3,4,3,p.trim);rect(c,xx+ww+10,yy-3,4,3,p.trim);}}
 function umbrella(c,x,y,col){ellipse(c,x,y-27,9,4,col);rect(c,x-9,y-27,18,3,col);line(c,x,y-27,x,y-17,'#20242e');}

 // ---- canal (2) and rooftops (3): the second and third block of a tile ----
 function canal(c,x,bi,p,r){
  if(bi===1){
   tower(c,x+40,339,88,170,p,r);tower(c,x+150,339,60,120,p,r);
   poly(c,[[x+250,329],[x+330,300],[x+410,300],[x+490,329]],p.trim);rect(c,x+250,329,240,6,p.trim);for(let k=0;k<7;k++)line(c,x+270+k*32,329,x+270+k*32,318-(k>1&&k<5?14:0),p.near,2);
   sign(c,x+530,210,18,70,p,r,true,'渡船');tower(c,x+560,339,120,200,p,r);
  }else{
   industry(c,x+30,339,120,110,p,r);rect(c,x+160,300,140,39,p.mid);line(c,x+160,300,x+300,300,p.trim,2);sign(c,x+175,306,110,18,p,r,false,'DOCK 9');
   line(c,x+360,339,x+360,190,p.trim,5);line(c,x+300,196,x+470,196,p.trim,4);line(c,x+450,196,x+450,250,p.trim);crate(c,x+438,250,24,18,p);
   tower(c,x+520,339,70,160,p,r);pagoda(c,x+610,340,110,120,p,r);
  }
 }
 function rooftops(c,x,bi,p,r){
  if(bi===1){
   for(let k=0;k<2;k++){const xx=x+30+k*300;tower(c,xx,428,150,110+k*40,p,r);const y=318-k*40;rect(c,xx+20,y-26,30,26,p.mid);ellipse(c,xx+35,y-26,15,5,p.trim);rect(c,xx+22,y-12,26,2,p.trim);for(let j=0;j<3;j++)line(c,xx+70+j*20,y,xx+70+j*20,y-40-j*8,p.trim);}
   rect(c,x+640,250,90,50,'#0b1322');rect(c,x+644,254,82,42,p.near);sign(c,x+648,262,74,26,p,r,false,'NOODLE');line(c,x+660,300,x+660,428,p.trim,3);line(c,x+715,300,x+715,428,p.trim,3);
  }else{
   tower(c,x+20,428,200,95,p,r);for(let k=0;k<6;k++){rect(c,x+30+k*30,318,16,12,'#3d5a44');ellipse(c,x+38+k*30,316,9,5,'#4f7a52');}
   tower(c,x+280,428,110,150,p,r);rect(c,x+276,272,118,6,p.trim);tower(c,x+450,428,140,120,p,r);industry(c,x+500,308,40,40,p,r);
   line(c,x+620,300,x+700,300,p.trim);for(let k=0;k<4;k++)rect(c,x+626+k*18,302,12,16,k%2?'#aa8e86':'#678c92');
  }
 }

 // ---- 4 電脳街 ----
 function electronics(c,x,bi,p,r){
  const f=FLOOR[4];
  if(bi===0){
   tower(c,x+20,f,110,210,p,r);tower(c,x+560,f,130,240,p,r);
   rect(c,x+150,292,390,f-292,p.mid);rect(c,x+150,292,390,4,p.trim);screens(c,x+168,318,13,3,p);
   sign(c,x+230,252,180,28,p,r,false,'DENNO');sign(c,x+152,300,16,70,p,r,true,'電脳');
   for(let k=0;k<4;k++)cable(c,x+130,220+k*9,x+560,236+k*7,30+k*6,k%2?p.trim:'#2a3140',2);
  }else if(bi===1){
   tower(c,x+60,f,170,280,p,r);for(let j=0;j<7;j++)for(let i=0;i<3;i++){const xx=x+74+i*50,yy=150+j*32;rect(c,xx,yy,16,10,p.trim);ellipse(c,xx+8,yy+5,3,3,p.near);}
   sign(c,x+250,210,120,24,p,r,false,'PARTS');sign(c,x+250,250,120,24,p,r,false,'CHIPS');
   for(let k=0;k<5;k++){const xx=x+260+k*70;rect(c,xx,f-34,58,34,p.near);rect(c,xx,f-34,58,3,p.accent);crate(c,xx+6,f-48,20,14,p);crate(c,xx+30,f-44,22,10,p);}
   tower(c,x+620,f,110,190,p,r);cable(c,x+230,170,x+620,200,40,p.trim,2);
  }else{
   for(let k=0;k<4;k++){const xx=x+30+k*120;rect(c,xx,f-40,100,40,p.near);rect(c,xx-4,f-58,108,8,k%2?p.neon:p.accent);screens(c,xx+8,f-36,3,1,p,26,16);}
   rect(c,x+520,160,10,f-160,p.accent+'44');rect(c,x+516,160,18,4,p.accent);glow(c,x+515,170,20,200,p.accent,10);
   tower(c,x+560,f,150,200,p,r);for(let k=0;k<9;k++)line(c,x+575+k*14,205,x+575+k*14,168-k%3*9,p.trim);
   sign(c,x+60,250,180,28,p,r,false,'ARCADE');
  }
 }
 // ---- 5 高架の乗換駅 ----
 function interchange(c,x,bi,p,r){
  const f=FLOOR[5];
  // buildings behind the viaduct, then shops tucked under the lower deck
  const behind=bi===0?[[20,100,230],[470,90,250]]:bi===1?[[300,150,280],[640,100,220]]:[[80,90,240],[520,110,260]];
  for(const [bx,bw,bh] of behind)tower(c,x+bx,f,bw,bh,p,r);
  rect(c,x,370,768,f-370,p.mid);for(let k=0;k<12;k++){const xx=x+8+k*64;rect(c,xx,382,48,f-392,'#1b1626');rect(c,xx+4,388,40,f-404,(k+bi)%3?p.light+'55':p.accent+'44');rect(c,xx,378,48,4,(k+bi)%2?p.neon:p.trim);}
  // two decks with pillars; the upper deck carries the platform
  rect(c,x,300,768,9,p.trim);rect(c,x,309,768,12,p.near);rect(c,x,352,768,8,p.trim);rect(c,x,360,768,10,p.near);
  for(let k=0;k<6;k++){rect(c,x+40+k*128,321,12,f-321,p.mid);rect(c,x+104+k*128,370,10,f-370,p.mid);}
  if(bi===0){
   rect(c,x+200,258,380,6,p.trim);for(let k=0;k<5;k++)rect(c,x+210+k*90,264,4,36,p.trim);for(let k=0;k<8;k++)glow(c,x+220+k*46,266,6,2,p.light,6);
   sign(c,x+592,230,18,62,p,r,true,'乗換');sign(c,x+300,232,110,20,p,r,false,'LINE 3');
  }else if(bi===1){
   for(let k=0;k<9;k++)rect(c,x+120+k*14,352-k*6,16,4,p.trim);rect(c,x+560,210,6,90,p.trim);rect(c,x+540,206,46,8,p.near);for(let k=0;k<3;k++)ellipse(c,x+548+k*14,210,3,3,k===1?'#5cf08a':'#3a2a2a');
  }else{
   rect(c,x+240,236,260,64,p.mid);rect(c,x+240,236,260,4,p.trim);for(let k=0;k<8;k++)rect(c,x+254+k*30,250,18,26,p.light+'55');sign(c,x+300,212,140,20,p,r,false,'TRANSFER');
  }
 }
 // ---- 6 雨の歩道橋 ----
 function footbridge(c,x,bi,p,r){
  const f=FLOOR[6];
  tower(c,x+10,f,90,230,p,r);tower(c,x+640,f,110,210,p,r);
  if(bi===2)tower(c,x+300,f,120,260,p,r);
  const left=bi===1?x+180:x+120,right=bi===1?x+620:x+590;
  rect(c,left,330,right-left,9,p.trim);rect(c,left,339,right-left,6,p.near);line(c,left,320,right,320,p.trim);for(let xx=left;xx<right;xx+=16)line(c,xx,320,xx,330,p.trim);
  for(let xx=left+40;xx<right-20;xx+=140){rect(c,xx,296,2,24,p.trim);rect(c,xx-4,294,10,3,p.trim);glow(c,xx-6,296,14,4,p.light,8);}
  for(const px of [left+80,right-80])rect(c,px,339,10,f-339,p.mid);
  const sx=bi===1?right:left,dir=bi===1?1:-1;for(let k=0;k<8;k++)rect(c,sx+dir*(k*8)-(dir<0?8:0),339+k*9,8,4,p.trim);
  if(bi===1){rect(c,x+40,f-44,80,4,p.trim);rect(c,x+44,f-40,3,40,p.trim);rect(c,x+113,f-40,3,40,p.trim);sign(c,x+52,f-38,56,14,p,r,false,'BUS');}
  if(bi===2){rect(c,x+700,f-120,4,120,p.trim);rect(c,x+694,f-128,16,22,'#0a1220');ellipse(c,x+702,f-121,3,3,'#ff4d5e');ellipse(c,x+702,f-112,3,3,'#3a2a2a');}
  sign(c,x+30,240,16,60,p,r,true);sign(c,x+660,250,70,20,p,r);
  for(let k=0;k<6;k++)rect(c,x+250+k*40,f+10,24,4,'#c9d6d6'+'22');
 }
 // ---- 7 廟と屋台の路地 ----
 function temple(c,x,bi,p,r){
  const f=FLOOR[7];
  if(bi===0){
   tower(c,x+10,f,120,190,p,r);tower(c,x+640,f,120,210,p,r);
   rect(c,x+250,352,260,f-352,p.mid);for(let k=0;k<5;k++)rect(c,x+262+k*58,300,10,f-300,RED);rect(c,x+250,296,260,8,p.trim);roofTiers(c,x+240,296,280,2,p);
   sign(c,x+372,316,18,56,p,r,true,'天后廟');rect(c,x+366,f-26,28,20,'#5a3a2a');ellipse(c,x+380,f-26,16,4,'#7a5a3a');
   lanterns(c,x+130,x+250,240,24,p);lanterns(c,x+510,x+640,236,26,p);
  }else if(bi===1){
   tower(c,x+30,f,100,230,p,r);tower(c,x+590,f,140,200,p,r);
   for(let k=0;k<4;k++){const xx=x+150+k*105;rect(c,xx,f-44,92,44,p.near);for(let s=0;s<6;s++)rect(c,xx-4+s*17,f-62,17,14,s%2?p.neon:'#e8d8c0');rect(c,xx+10,f-30,20,12,'#3a2f35');rect(c,xx+50,f-28,24,10,'#3a2f35');}
   sign(c,x+160,300,16,54,p,r,true,'ラーメン');sign(c,x+370,300,16,30,p,r,true,'粥');sign(c,x+480,300,16,46,p,r,true,'点心');
   lanterns(c,x+130,x+590,250,30,p);
  }else{
   tower(c,x+20,f,110,200,p,r);tower(c,x+600,f,130,230,p,r);
   rect(c,x+250,260,14,f-260,RED);rect(c,x+470,260,14,f-260,RED);rect(c,x+300,290,10,f-290,RED);rect(c,x+424,290,10,f-290,RED);
   roofTiers(c,x+238,262,258,2,p);sign(c,x+320,268,96,20,p,r,false,'KOWLOON');
   for(let k=0;k<5;k++){const sway=k%2*3;rect(c,x+140+k*18+sway,300,12,18,k%2?'#aa8e86':'#678c92');}line(c,x+130,298,x+240,298,p.trim);
  }
 }

 function layer(c,x,d,depth,p,r){
  const bi=blockOf(x);
  if(depth===1){
   if(d===2&&bi){canal(c,x,bi,p,r);return true;}
   if(d===3&&bi){rooftops(c,x,bi,p,r);return true;}
   if(d===4){electronics(c,x,bi,p,r);return true;}
   if(d===5){interchange(c,x,bi,p,r);return true;}
   if(d===6){footbridge(c,x,bi,p,r);return true;}
   if(d===7){temple(c,x,bi,p,r);return true;}
   return false;
  }
  if(d<4)return false;
  if(depth===0){
   const pp={...p,mid:p.far,near:p.far,trim:p.far};
   for(let k=0;k<5;k++)tower(c,x+k*150+ir(r,0,40),d===5?300:390,50+ir(r,0,30),140+ir(r,0,110)+(bi===1?40:0),pp,r,0);
   if(d===5){rect(c,x,262,768,6,p.far);for(let k=0;k<6;k++)poly(c,[[x+k*128,268],[x+k*128+128,268],[x+k*128+118,300],[x+k*128+10,300]],p.far);}
   if(d===7)pagoda(c,x+300+bi*90,380,110,120,pp,r);
   return true;
  }
  // foreground
  if(d===4){if(bi!==2){rect(c,x+300,418,26,32,'#0e1726');rect(c,x+303,421,20,12,p.accent+'77');}line(c,x,414,x+180,414,p.near,4);}
  else if(d===5){if(bi===1){rect(c,x+690,150,36,300,'#0b1220');rect(c,x+690,150,3,300,p.trim+'88');rect(c,x+723,150,3,300,'#05080f');for(let k=0;k<6;k++)rect(c,x+696,170+k*44,24,4,k%2?'#e8c24a':'#1a1a1a');rect(c,x+694,300,28,40,'#d8d0c0');rect(c,x+697,304,22,4,p.neon);}}
  else if(d===6){ellipse(c,x+200+bi*120,436,40,4,p.neon+'33');ellipse(c,x+520,440,30,3,p.accent+'33');line(c,x,424,x+768,424,p.near,3);for(let k=0;k<12;k++)rect(c,x+k*64,424,3,14,p.trim);}
  else if(d===7){lanterns(c,x,x+768,22,40,p);}
  return true;
 }
 function floor(c,d,width,p){
  const y=FLOOR[d];if(!y)return;rect(c,0,y,width,450-y,p.near);line(c,0,y,width,y,p.trim,2);
  if(d===6)for(let x=0;x<width;x+=92){c.globalAlpha=.16;rect(c,x+8,y+4,3,26,x%3?p.neon:p.accent);rect(c,x+50,y+6,2,18,p.light);c.globalAlpha=1;}
 }
 // Life for the new districts, block by block (same scroll as the district's own life).
 function life(c,x,d,t,p,quiet,bi){
  const f=FLOOR[d];
  if(d===4){
   for(let k=0;k<(quiet?2:4);k++){const xx=x+(bi===2?60+k*120:180+k*80);person(c,xx,f,t+k,p,{action:k%2?'read':'idle',dir:k%2?1:-1,coat:k%2?'#556c7a':'#7a5a6a'});}
   for(let k=0;k<6;k++){c.globalAlpha=.25+.25*Math.max(0,Math.sin(t*3+k*1.7));rect(c,x+170+k*52,320,22,14,k%2?p.accent:p.neon);}c.globalAlpha=1;
   const a=shuttling(t,29);drone(c,x+100+a.f*500,190,t,p,true);
  }else if(d===5){
   if(bi===0)for(let k=0;k<(quiet?2:3);k++)person(c,x+260+k*90,300,t+k,p,{coat:k%2?'#556c7a':'#8a6a5a'});
  }else if(d===6){
   const cols=[p.accent,p.neon,p.light,'#9aa8b8'];
   for(let k=0;k<(quiet?2:4);k++){const a=shuttling(t+k*7,40+k*6),y=k%2?330:418,xx=x+(k%2?170:60)+a.f*380;person(c,xx,y,t+k,p,{walk:true,dir:a.dir,coat:k%2?'#4a5a6a':'#6a4a5a'});umbrella(c,xx,y,cols[k]);}
  }else if(d===7){
   if(bi===0){steam(c,x+380,f-30,t,p,4);for(let k=0;k<2;k++)person(c,x+340+k*60,f,t+k,p,{action:'idle',dir:k?-1:1,coat:'#6a5a4a'});}
   else if(bi===1)for(let k=0;k<4;k++){person(c,x+170+k*105,f-2,t+k,p,{action:'work',coat:'#b39b81'});steam(c,x+185+k*105,f-46,t+k,p,3);}
   const a=shuttling(t,44);person(c,x+60+a.f*600,f+14,t,p,{walk:true,dir:a.dir,carry:bi===1});
  }
 }
 // Trains and cars run the whole width, not block by block, so they never pop at block edges.
 function wide(c,d,t,travel,width,p){
  if(d===5){
   for(const [y,speed,off] of [[284,70,0],[336,-54,520]]){
    const span=width+420,xx=mod(-travel*8.5+t*speed+off,span)-210;
    rect(c,xx,y,180,16,p.mid);rect(c,xx,y,180,3,p.accent);for(let k=0;k<13;k++)rect(c,xx+6+k*13,y+5,8,6,p.light+'cc');rect(c,xx+(speed>0?176:0),y+6,4,4,'#fff3c4');
   }
  }else if(d===6){
   for(const [off,speed,col] of [[0,90,'#fff3c4'],[700,-70,'#ff4d5e']]){
    const span=width+300,xx=mod(-travel*8.5+t*speed+off,span)-150;
    rect(c,xx,414,54,12,'#1a2230');rect(c,xx+8,408,34,7,'#1a2230');rect(c,xx+(speed>0?50:0),418,4,3,col);glow(c,xx+(speed>0?54:-14),418,14,3,col,8);
   }
  }
 }
 return {layer,floor,life,wide};
}
