// The three outer planets: an undersea arcology, a volcanic caldera and a city
// above the clouds. Each owns its sky, all four districts (the station front
// and three more), their residents and a foreground of bubbles, embers or
// cloud. Painters are pure: the same drawing serves the live view and the
// route-map thumbnails. Registering with cityscape lets makeScene paint the
// station district without cityscape importing this module.
import {surface,rect,line,ellipse,poly,gradient,glow,rand,ir,mod,shuttling,HEIGHT,TILE} from './pixel.js';
import {person,robot,crate,steam,rotatingFan} from './sprites.js';
import {tower,dome,industry,pagoda,sign,moon,PAINTERS} from './cityscape.js';

export const FRONTIER_KINDS=['undersea','volcano','sky'];
// Names for the extra districts (4-7) the painters draw for each outer planet.
export const FRONTIER_EXTRA={
 abyss:[['潜水艇の格納庫','開いた格納庫に潜水艇が出入りする。作業灯が水をぼんやり照らす。'],['深海の市場','泡のドームに屋台の灯り。管の通路を、潜水服の客が行き来する。'],['沈没船の礼拝堂','沈んだ船の窓に色ガラス。鐘の下を、クラゲがゆっくり通る。'],['熱水噴出孔の工房','噴出孔から湯気が立ちのぼる。熱を使う工房の窓が明るい。']],
 caldera:[['黒曜石の工房','黒く光る壁の工房。砥石が回り、炉の口から火の粉が散る。'],['溶岩流の見張り所','足元を溶岩がゆっくり流れる。見張り台で、人がその光を眺めている。'],['火山灰の畑','灰色の畑に、半円の温室が並ぶ。風よけの柵の向こうで農夫が働く。'],['灯籠祭りの坂','長い坂に灯籠の列。屋台の赤い屋根と、坂を上る人たち。']],
 aerie:[['雲海の灯台','雲の海に紅白の灯台。光がゆっくり、浮島のあいだを掃く。'],['風の鐘楼','浮島ごとに鐘楼が立つ。風が吹くと、鐘と凧が揺れる。'],['空中庭園','花の咲く浮島から、細い滝が雲へ落ちていく。'],['気球の発着場','色とりどりの気球が係留されている。一つずつ、夜空へ昇っていく。']],
};
const CELL=768;
const hex2=(a)=>Math.round(Math.max(0,Math.min(1,a))*255).toString(16).padStart(2,'0');
function dither(c,width,r,cols){c.globalAlpha=.05;for(let i=0;i<width*HEIGHT*.06;i++)rect(c,ir(r,0,width),ir(r,0,HEIGHT),1,1,r()>.5?cols[0]:cols[1]);c.globalAlpha=1;}
// Depth-1 cells of the strip, with a per-cell clock offset like the other planets.
function cells(travel,width,fn){const start=-mod(travel*8.5,CELL);for(let x=start-CELL;x<width+CELL;x+=CELL)fn(x,mod(Math.round((x+travel*8.5)/CELL),3));}

// ---------------------------------------------------------------- shared sprites
export function fish(c,x,y,dir,col){rect(c,x-3,y-1,6,3,col);poly(c,[[x-3*dir,y+.5],[x-6*dir,y-2],[x-6*dir,y+3]],col);rect(c,x+2*dir,y-1,1,1,'#0b1a26');}
export function school(c,x,y,t,n,col,spread=40,dir=1){for(let k=0;k<n;k++){const a=t*.7+k*2.39,fx=x+Math.cos(a*.6+k)*spread*.6+Math.sin(t*.9+k)*6,fy=y+Math.sin(a*.8+k*1.7)*spread*.22;fish(c,fx,fy,dir,col);}}
export function jelly(c,x,y,t,p,scale=1,col=p.neon){
 const pulse=Math.sin(t*2.2)*.12;c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale*(1+pulse),scale*(1-pulse));
 c.globalAlpha=.75;ellipse(c,0,0,9,6,col);rect(c,-9,0,18,2,col);c.globalAlpha=.9;ellipse(c,0,-1,5,3,'#ffe2f4');
 c.globalAlpha=.55;for(let k=-2;k<=2;k++)line(c,k*3.5,2,k*3.5+Math.sin(t*2+k)*2,13+Math.abs(k)*2,col);c.restore();
}
export function submarine(c,x,y,t,p,scale=1,dir=1,lit=true){
 c.save();c.translate(Math.round(x),Math.round(y+Math.sin(t*.8)*1.5));c.scale(scale*dir,scale);
 ellipse(c,0,0,24,8,'#c9a24a');rect(c,-20,-2,40,5,'#b08c3c');rect(c,-6,-13,13,7,'#b08c3c');rect(c,-4,-16,2,4,p.trim);
 for(let k=0;k<3;k++){ellipse(c,-10+k*9,0,3,3,'#18313e');rect(c,-11+k*9,-2,2,2,lit?p.light:'#35535e');}
 poly(c,[[-24,0],[-31,-7],[-31,7]],'#9a7a34');rotatingFan(c,-31,0,3,t*6,p);
 if(lit){c.globalAlpha=.12;poly(c,[[23,-1],[95,-22],[95,24]],p.light);c.globalAlpha=1;glow(c,23,-1,2,2,p.light,6);}
 c.restore();
}
export function diver(c,x,y,t,p,dir=1,work=false){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(dir,1);
 const kick=Math.sin(t*5)*3;
 line(c,-9,1,-17,1+kick,'#2b4a58',3);line(c,-9,3,-17,4-kick,'#2b4a58',3);rect(c,-20,kick-1,4,3,p.accent);rect(c,-20,3-kick,4,3,p.accent);
 rect(c,-9,-2,12,6,'#e0a84a');rect(c,-7,-5,7,3,'#8a9aa6');ellipse(c,6,0,5,5,'#c7d5d8');ellipse(c,7,0,3,3,'#1d3542');rect(c,7,-1,2,1,p.light);
 if(work)line(c,3,3,10,6+Math.sin(t*6)*2,'#e0a84a',2);
 c.restore();
 for(let k=0;k<3;k++){const f=mod(t*.8+k/3,1);c.globalAlpha=.5*(1-f);ellipse(c,x+6*dir,y-8-f*26,1+f*1.5,1+f*1.5,p.light);}c.globalAlpha=1;
}
export function blimp(c,x,y,t,p,scale=1,dir=1,label=''){
 c.save();c.translate(Math.round(x),Math.round(y+Math.sin(t*.6)*2));c.scale(scale*dir,scale);
 ellipse(c,0,0,46,14,'#d9cdb3');ellipse(c,0,-3,44,9,'#efe6d2');rect(c,-40,-1,80,2,'#b9ab8f');
 for(let k=-3;k<=3;k++)line(c,k*12,-13,k*12,13,'#c4b69a');
 poly(c,[[-38,-2],[-54,-14],[-50,-2]],'#a8452f');poly(c,[[-38,2],[-54,14],[-50,2]],'#a8452f');
 rect(c,-12,13,26,7,'#3a3f5a');for(let k=0;k<4;k++)rect(c,-9+k*6,15,3,3,p.light);line(c,-10,13,-14,9,'#3a3f5a');line(c,12,13,16,9,'#3a3f5a');
 rotatingFan(c,-17,17,3,t*5,p);
 if(label){c.fillStyle='#6a3024';c.font='bold 7px monospace';c.textBaseline='middle';c.fillText(label,-14,0);}
 c.restore();
}
export function kite(c,x,y,t,col,tail='#fff1c9'){
 const s=Math.sin(t*2)*2;poly(c,[[x,y-9],[x+6,y],[x,y+9],[x-6,y]],col);line(c,x,y-9,x,y+9,'#00000044');line(c,x-6,y,x+6,y,'#00000044');
 for(let k=0;k<5;k++)rect(c,x+Math.sin(t*3+k)*3,y+10+k*5+s,2,3,k%2?tail:col);
}
export function balloon(c,x,y,col){ellipse(c,x,y,5,6,col);rect(c,x-2,y-3,2,2,'#ffffff66');line(c,x,y+6,x+Math.sin(y*.1)*2,y+18,'#d8d0e088');}
export function bird(c,x,y,t,col='#d8def5'){const f=Math.sin(t*9)>0?-3:1;line(c,x-5,y+f,x,y,col,2);line(c,x,y,x+5,y+f,col,2);}
export function ember(c,x,y,a,col){c.globalAlpha=a;rect(c,x,y,2,2,col);c.globalAlpha=a*.4;rect(c,x-1,y+2,1,3,col);c.globalAlpha=1;}

// ---------------------------------------------------------------- undersea
function undersea(){
 const seabed=(c,y,p,r,col=p.near)=>{const pts=[[0,HEIGHT]];for(let x=0;x<=TILE;x+=32)pts.push([x,y+Math.sin(x*.013)*6+ir(r,-2,2)]);pts.push([TILE,HEIGHT]);poly(c,pts,col);for(let x=0;x<TILE;x+=ir(r,12,40))rect(c,x,y+6+ir(r,0,30),ir(r,2,6),1,p.trim+'55');};
 const tube=(c,x1,x2,y,p,h=16)=>{rect(c,x1,y,x2-x1,h,p.trim);rect(c,x1,y+2,x2-x1,h-4,'#123648');rect(c,x1,y+h/2-1,x2-x1,2,p.accent+'66');for(let x=x1;x<x2;x+=14)rect(c,x,y,2,h,p.near);};
 const porthole=(c,x,y,rad,p,on=true)=>{ellipse(c,x,y,rad+2,rad+2,p.trim);ellipse(c,x,y,rad,rad,on?p.light+'cc':'#173847');if(on)rect(c,x-rad*.4,y-rad*.4,2,2,'#ffffff');};
 const coral=(c,x,base,h,r,cols)=>{for(let k=0;k<5;k++){const col=cols[k%cols.length],a=-Math.PI/2+(k-2)*.35+(r()-.5)*.3;let px=x,py=base;for(let s=0;s<4;s++){const nx=px+Math.cos(a+(r()-.5)*.6)*h/4,ny=py+Math.sin(a)*h/4;line(c,px,py,nx,ny,col,Math.max(1,4-s));px=nx;py=ny;}ellipse(c,px,py,2,2,col);}};
 const anemone=(c,x,y,p,col)=>{ellipse(c,x,y,6,3,'#402a3c');for(let k=0;k<7;k++)line(c,x-6+k*2,y-1,x-8+k*2.6,y-9,col,1);};
 const dwelling=(c,x,base,w,h,p,r)=>{tower(c,x,base,w,h,{...p,neon:p.accent},r);for(let yy=base-h+14;yy<base-8;yy+=22)porthole(c,x+w/2,yy,3,p,r()>.3);};

 // Districts 1-3: the second and third blocks of a tile get their own composition.
 const trenchWalls=(c,x,p)=>{poly(c,[[x,120],[x+60,110],[x+150,170],[x+210,300],[x+230,400],[x+260,HEIGHT],[x,HEIGHT]],p.near);poly(c,[[x+480,392],[x+500,280],[x+560,190],[x+660,130],[x+CELL,120],[x+CELL,HEIGHT],[x+450,HEIGHT]],p.near);gradient(c,x+232,300,238,150,['#03101d00','#03101d','#000308']);};
 function altLayer(c,x,d,bi,p,r){
  if(d===1){ // 珊瑚の居住塔
   if(bi===1){dwelling(c,x+300,410,90,330,p,r);for(let k=0;k<4;k++){const yy=170+k*60,w=170-k*20;rect(c,x+345-w/2,yy,w,6,p.trim);coral(c,x+345-w/2+8,yy,30+k*6,r,['#ff7aa8','#c784ff']);coral(c,x+345+w/2-8,yy,26+k*6,r,['#ffd07a','#ff9a5a']);}
    for(let k=0;k<5;k++)anemone(c,x+50+k*40,406,p,k%2?'#7cf5e0':'#ff9ad0');dome(c,x+520,410,150,80,p,r,'CORAL 3');coral(c,x+700,410,70,r,['#ff7aa8','#ff9a5a']);tube(c,x+390,x+520,360,p,12);}
   else{poly(c,[[x,410],[x+120,330],[x+300,300],[x+480,320],[x+640,360],[x+CELL,410]],'#3a2440');for(let k=0;k<5;k++){const xx=x+60+k*140,yy=[380,330,312,326,366][k];dome(c,xx,yy,110,50+k%2*16,p,r,' ');coral(c,xx+110,yy,40,r,['#ff7aa8','#c784ff','#ffd07a']);}
    for(let k=0;k<4;k++)tube(c,x+170+k*140,x+200+k*140,[340,318,322,350][k],p,10);sign(c,x+340,210,16,48,p,r,true,'珊瑚');}
  }else if(d===2){ // 海溝の研究所
   trenchWalls(c,x,p);
   if(bi===1){tube(c,x+200,x+510,236,p,14);line(c,x+355,250,x+355,280,p.trim,2);rect(c,x+300,280,110,52,p.mid);rect(c,x+300,280,110,4,p.trim);for(let j=0;j<3;j++)porthole(c,x+325+j*30,305,6,p,true);
    for(let k=0;k<3;k++)porthole(c,x+80+k*26,200+k*30,5,p,k!==1);for(let k=0;k<3;k++)porthole(c,x+620-k*20,190+k*40,5,p,true);sign(c,x+300,210,110,15,p,r,false,'DEEP LINK');line(c,x+355,332,x+355,HEIGHT,p.trim,1);}
   else{ellipse(c,x+110,240,46,40,p.trim);ellipse(c,x+110,240,40,34,'#0e2e3e');ellipse(c,x+110,240,40,34,p.light+'33');rect(c,x+80,226,20,4,'#ffffff44');sign(c,x+60,300,100,15,p,r,false,'ABYSS OBS');
    line(c,x+500,280,x+492,440,p.trim,3);line(c,x+512,282,x+504,440,p.trim,1);for(let k=0;k<3;k++){rect(c,x+560+k*40,150+k*50,70,28,p.mid);rect(c,x+560+k*40,150+k*50,70,3,p.trim);porthole(c,x+595+k*40,164+k*50,4,p,true);}}
  }else{ // 昆布の水耕畑
   if(bi===1){for(let k=0;k<3;k++){const fx=x+50+k*240;rect(c,fx,200,5,204,p.trim);rect(c,fx+170,200,5,204,p.trim);for(let j=0;j<5;j++)line(c,fx,210+j*44,fx+175,210+j*44,p.trim+'88');rect(c,fx-4,196,183,6,p.trim);}sign(c,x+300,160,90,16,p,r,false,'HARVEST');}
   else{industry(c,x+40,404,150,170,p,r);for(let k=0;k<3;k++){rect(c,x+230+k*70,330,50,74,p.mid);ellipse(c,x+255+k*70,330,25,8,p.trim);rect(c,x+236+k*70,350,38,30,'#2f6a3e88');}dome(c,x+470,404,160,90,p,r,'DRYING');tube(c,x+440,x+470,380,p,10);for(let k=0;k<4;k++)crate(c,x+660,390-k*16,40,16,p);}
  }
 }
 function altLife(c,x,d,bi,t,p,quiet){
  if(d===1){if(bi===1){for(let k=0;k<5;k++){c.globalAlpha=.35+.25*Math.sin(t*1.5+k);ellipse(c,x+50+k*40,402,8,3,k%2?'#7cf5e0':'#ff9ad0');}c.globalAlpha=1;const q=shuttling(t,40);diver(c,x+420+q.f*120,260-q.f*60,t,p,q.dir);}
   else{const q=shuttling(t,50);submarine(c,x+80+q.f*600,240,t,p,.45,q.dir);}
   school(c,x+(bi===1?560:200),220+Math.sin(t*.2)*20,t,quiet?5:11,'#ffb07a',50,Math.sin(t*.1)>0?1:-1);}
  else if(d===2){if(bi===1){const q=shuttling(t,40);submarine(c,x+260+q.f*220,380,t,p,.5,q.dir);if(Math.sin(t*2)>0)glow(c,x+353,276,4,4,p.accent,10);}
   else{const q=shuttling(t,36);rect(c,x+494-q.f*8,290+q.f*140,16,14,'#e0a84a');rect(c,x+497-q.f*8,294+q.f*140,10,4,p.light);const a=t*.3;glow(c,x+340+Math.sin(a)*60,380+Math.cos(a*1.3)*20,6,6,'#9fffe8',12);}}
  else{if(bi===1){for(let k=0;k<3;k++)for(let j=0;j<4;j++)kelp(c,x+80+k*240+j*36,400,150+((k+j)%3)*30,t,p,k+j);const q=shuttling(t,44);diver(c,x+100+q.f*540,300,t,p,q.dir,true);}
   else{const q=mod(t*.04,1),sx=x+CELL-q*CELL;submarine(c,sx,300,t,p,.55,-1);line(c,sx+30,302,sx+60,312,p.trim);crate(c,sx+56,306,20,14,p);robot(c,x+560+shuttling(t,30).f*80,404,t,p,.8);}}
 }
 // Extra districts (4-7) and the second and third station blocks of a tile, so a wide window
 // does not repeat the same airlock. `bi` is the block of the tile (0-2).
 function extraLayer(c,x,d,bi,p,r){
  if(d===0){
   if(bi===1){dome(c,x+60,406,260,150,p,r,'MARKET HALL');dwelling(c,x+360,406,60,240,p,r);dwelling(c,x+430,406,50,190,p,r);tube(c,x+320,x+360,330,p,12);rect(c,x+620,0,26,300,p.trim);rect(c,x+624,0,18,300,'#123648');dome(c,x+520,406,170,90,p,r,'LIFT B');}
   else{dwelling(c,x+80,406,110,330,p,r);for(let k=0;k<3;k++)dome(c,x+230+k*150,406,120,60+k*14,p,r,k===1?'ABYSS 1':' ');tube(c,x+190,x+700,300,p,12);coral(c,x+700,406,60,r,['#ff7aa8','#ffd07a']);}
   return;
  }
  if(d===4){ // 潜水艇の格納庫
   const hx=x+(bi===1?300:80);dome(c,hx,406,360,200,p,r,' ');rect(c,hx+60,300,240,106,'#04111c');rect(c,hx+60,300,240,4,p.accent+'88');for(let k=0;k<6;k++)rect(c,hx+70+k*40,296,14,4,p.light+'aa');
   line(c,hx+380,406,hx+380,200,p.trim,4);line(c,hx+300,210,hx+470,210,p.trim,3);sign(c,hx+120,250,120,18,p,r,false,'SUB BAY '+(bi+1));
   if(bi!==1)dwelling(c,x+560,406,70,220,p,r);else dwelling(c,x+40,406,80,240,p,r);
  }else if(d===5){ // 深海の市場
   for(let k=0;k<4;k++){const mx=x+40+k*180,w=140;dome(c,mx,406,w,90+((k+bi)%2)*20,p,r,' ');for(let j=0;j<3;j++){rect(c,mx+20+j*38,370,30,30,'#1a3a4a');rect(c,mx+20+j*38,366,30,4,['#ff7ad9','#5ff0d8','#ffd07a'][(j+k)%3]);glow(c,mx+26+j*38,374,18,10,p.light,6);}}
   tube(c,x+180,x+220,360,p,10);tube(c,x+360,x+400,360,p,10);tube(c,x+540,x+580,360,p,10);sign(c,x+(bi===2?520:260),250,100,18,p,r,false,'BAZAAR');
  }else if(d===6){ // 沈没船の礼拝堂
   const sx=x+(bi===1?260:60);poly(c,[[sx,406],[sx+20,300],[sx+420,280],[sx+460,330],[sx+440,406]],'#2a3a44');poly(c,[[sx+30,390],[sx+40,316],[sx+400,300],[sx+420,390]],'#1a2a34');
   for(let k=0;k<6;k++){const wx=sx+70+k*56;rect(c,wx,320,20,34,'#0b1a26');rect(c,wx+2,322,16,30,['#ff7ad9','#5ff0d8','#ffd07a','#c784ff'][k%4]+'88');}
   line(c,sx+240,280,sx+240,210,p.trim,3);rect(c,sx+232,206,16,6,p.trim);ellipse(c,sx+240,224,8,10,'#c9a24a');coral(c,sx+20,406,70,r,['#ff7aa8','#c784ff']);coral(c,sx+450,406,50,r,['#ff9a5a','#ffd07a']);sign(c,sx+180,250,16,40,p,r,true,'礼拝');
  }else{ // 熱水噴出孔の工房
   for(let k=0;k<3;k++){const vx=x+80+k*240+bi*20,h=110+k*30;poly(c,[[vx-30,406],[vx-12,406-h],[vx+12,406-h],[vx+30,406]],'#2a2226');rect(c,vx-10,406-h-6,20,6,'#ff7a3a');glow(c,vx-8,406-h-10,16,8,'#ff8a4a',10);}
   for(let k=0;k<2;k++){rect(c,x+180+k*250,330,120,76,p.mid);rect(c,x+180+k*250,330,120,4,p.trim);for(let j=0;j<3;j++)porthole(c,x+210+k*250+j*30,360,5,p,true);}
   tube(c,x+300,x+430,340,p,10);sign(c,x+(bi===1?560:40),250,80,18,p,r,false,'VENT WORKS');
  }
 }
 function extraLife(c,x,d,bi,t,p,quiet){
  if(d===0){const q=shuttling(t,40);diver(c,x+(bi===1?380:260)+q.f*200,320-q.f*30,t,p,q.dir);if(!quiet)school(c,x+400,220,t,7,'#6fd6d0',36,1);return;}
  if(d===4){const f=mod(t*.05,1),sx=x+(bi===1?300:80)+80+Math.sin(f*Math.PI*2)*40;submarine(c,sx,350,t,p,.8,1,true);}
  else if(d===5){for(let k=0;k<(quiet?1:3);k++){const q=shuttling(t+k*9,36);diver(c,x+60+k*200+q.f*120,396,t+k,p,q.dir);}if(!quiet)for(let k=0;k<2;k++)jelly(c,x+200+k*300,160+Math.sin(t*.5+k)*20,t+k,p,.8);}
  else if(d===6){for(let k=0;k<(quiet?1:3);k++)jelly(c,x+100+k*220,140+Math.sin(t*.4+k)*30,t+k,p,.9,k%2?p.accent:p.neon);}
  else if(d===7){for(let k=0;k<3;k++){const vx=x+80+k*240+bi*20,h=110+k*30;for(let j=0;j<(quiet?4:9);j++){const f=mod(t*.5+j/9,1);c.globalAlpha=(1-f)*.35;ellipse(c,vx+Math.sin(t+j)*6,406-h-10-f*140,4+f*10,3+f*6,'#c8d8d8');c.globalAlpha=1;}}robot(c,x+(bi===1?600:220),406,t,p,.9);}
 }
 function sky(p,width){
  const e=surface(width,HEIGHT),c=e.getContext('2d'),r=rand(p.seed+41);gradient(c,0,0,width,HEIGHT,p.sky);
  // The far-off surface: a bright rippling ceiling of light.
  for(let y=0;y<30;y+=2){c.globalAlpha=.22*(1-y/30);for(let i=0;i<width/18;i++)rect(c,ir(r,0,width),y,ir(r,6,30),1,p.light);}
  c.globalAlpha=1;
  for(let k=0;k<7;k++){const x=r()*width,w=18+r()*50;c.globalAlpha=.045;poly(c,[[x,0],[x+w,0],[x+w*2.2+90,HEIGHT],[x+60,HEIGHT]],p.light);}
  c.globalAlpha=1;
  for(let i=0;i<width*.22;i++){const y=ir(r,40,HEIGHT);c.globalAlpha=.08+r()*.18;rect(c,ir(r,0,width),y,1,1,p.light);}
  c.globalAlpha=1;
  // A remote ridge of the continental shelf.
  const pts=[[0,HEIGHT]];for(let x=0;x<=width+20;x+=20)pts.push([x,300+Math.sin(x/140)*26+Math.cos(x/57)*9]);pts.push([width,HEIGHT]);poly(c,pts,'#06243a');
  dither(c,width,r,['#8fe6e0','#00060e']);return e;
 }
 function layer(p,depth){
  const e=surface(TILE,HEIGHT),c=e.getContext('2d'),d=p.district||0,r=rand(p.seed+depth*177+d*31);c.imageSmoothingEnabled=false;
  if(depth===0){
   const pp={...p,mid:p.far,near:p.far,trim:'#123a4c'};
   for(let x=-CELL;x<=TILE;x+=CELL){
    if(d===2){poly(c,[[x,170],[x+180,210],[x+260,HEIGHT],[x,HEIGHT]],p.far);poly(c,[[x+520,200],[x+CELL,160],[x+CELL,HEIGHT],[x+450,HEIGHT]],p.far);}
    else for(let k=0;k<4;k++){const sx=x+40+k*190+ir(r,-20,20),h=ir(r,90,d===1?220:160);poly(c,[[sx-30,HEIGHT],[sx-10,HEIGHT-h],[sx+6,HEIGHT-h-14],[sx+24,HEIGHT-h+10],[sx+40,HEIGHT]],p.far);}
    if(d!==2)for(let k=0;k<3;k++)dome(c,x+100+k*230,360,ir(r,50,90),ir(r,30,55),pp,r,' ');
   }
   c.globalAlpha=.3;gradient(c,0,200,TILE,250,[p.haze+'00',p.haze+'55']);c.globalAlpha=1;return e;
  }
  if(depth===1){
   if(d!==2)seabed(c,410,p,r);
   for(let x=-CELL;x<=TILE;x+=CELL){
    const bi=((Math.round(x/CELL)%3)+3)%3;if(bi&&d>=1&&d<=3){altLayer(c,x,d,bi,p,r);continue;}if(d>=4||(d===0&&bi)){extraLayer(c,x,d,bi,p,r);continue;}
    if(d===0){
     // A lift tube climbs out of sight towards the surface habitats.
     rect(c,x+118,0,26,300,p.trim);rect(c,x+122,0,18,300,'#123648');for(let yy=10;yy<300;yy+=24)rect(c,x+118,yy,26,3,p.near);
     dwelling(c,x+300,406,70,300,p,r);dwelling(c,x+372,406,46,220,p,r);dwelling(c,x+620,406,60,260,p,r);
     dome(c,x+30,406,150,120,p,r,'AIRLOCK 7');dome(c,x+420,406,170,96,p,r,'HABITAT');tube(c,x+178,x+422,352,p);tube(c,x+588,x+CELL+32,366,p,14);
     dwelling(c,x+240,406,54,150,p,r);tube(c,x+370,x+620,230,p,12);for(let k=0;k<4;k++)porthole(c,x+470+k*28,360,4,p,k!==2);
     line(c,x+690,406,x+690,250,p.trim,3);rect(c,x+684,244,12,8,p.trim);glow(c,x+688,246,4,3,p.accent,8);
    }else if(d===1){
     for(let k=0;k<3;k++){const xx=x+40+k*250,h=190+ir(r,0,90);dwelling(c,xx,410,70,h,p,r);coral(c,xx+10,410-h+30,50,r,['#ff7aa8','#ff9a5a','#c784ff']);coral(c,xx+60,410-h*.5,40,r,['#ff9a5a','#ffd07a']);coral(c,xx+120,410,60,r,['#ff7aa8','#c784ff','#ff9a5a']);anemone(c,xx+150,408,p,'#7cf5e0');}
     tube(c,x+110,x+290,300,p,12);tube(c,x+360,x+540,270,p,12);
    }else if(d===2){
     // Two ledges and the dark mouth of the trench between them.
     // Cliff faces rise on both sides; the lab clings to them in stacked modules.
     poly(c,[[x,120],[x+60,110],[x+150,170],[x+210,300],[x+230,400],[x+260,HEIGHT],[x,HEIGHT]],p.near);poly(c,[[x+480,392],[x+500,280],[x+560,190],[x+660,130],[x+CELL,120],[x+CELL,HEIGHT],[x+450,HEIGHT]],p.near);
     for(let k=0;k<3;k++){rect(c,x+20+k*40,190+k*50,90-k*10,34,p.mid);rect(c,x+20+k*40,190+k*50,90-k*10,3,p.trim);for(let j=0;j<3;j++)porthole(c,x+36+k*40+j*22,207+k*50,4,p,(j+k)%3!==0);}
     for(let k=0;k<3;k++){rect(c,x+600+k*30-k*k*10,160+k*60,90,30,p.mid);rect(c,x+600+k*30-k*k*10,160+k*60,90,3,p.trim);porthole(c,x+640+k*30-k*k*10,175+k*60,5,p,true);}
     line(c,x+150,170,x+200,90,p.trim,2);rect(c,x+194,84,12,8,p.trim);glow(c,x+198,86,4,3,p.neon,10);
     gradient(c,x+232,300,238,150,['#03101d00','#03101d','#000308']);line(c,x+210,300,x+230,400,p.trim+'88',2);line(c,x+500,280,x+480,392,p.trim+'88',2);line(c,x+150,170,x+210,300,p.trim+'55');line(c,x+560,190,x+500,280,p.trim+'55');
     industry(c,x+40,396,120,150,p,r);rect(c,x+160,330,110,6,p.trim);line(c,x+262,336,x+262,HEIGHT,p.trim,2);
     for(let k=0;k<3;k++){rect(c,x+510+k*70,340,54,52,p.mid);rect(c,x+510+k*70,340,54,4,p.trim);porthole(c,x+537+k*70,364,7,p,true);}
     for(let k=0;k<4;k++){line(c,x+520+k*55,392,x+516+k*55,HEIGHT,p.trim,3);}
     sign(c,x+60,300,86,15,p,r,false,'TRENCH LAB');
    }else{
     for(let k=0;k<6;k++){const xx=x+20+k*125;rect(c,xx,404,96,5,p.trim);for(let j=0;j<4;j++)rect(c,xx+10+j*24,398,4,8,'#3a6a4a');}
     dome(c,x+330,404,120,70,p,r,'KELP FARM');tube(c,x+450,x+CELL-10,380,p,12);
     // A tethered buoy tower where the harvest is lifted to the surface.
     line(c,x+700,404,x+700,60,p.trim,3);rect(c,x+688,120,24,90,p.mid);rect(c,x+688,120,24,3,p.trim);porthole(c,x+700,150,5,p,true);porthole(c,x+700,180,5,p,true);rect(c,x+684,52,32,10,p.trim);glow(c,x+700,50,3,3,p.accent,10);
    }
   }
   return e;
  }
  // Foreground rocks and weed, darkest and fastest.
  for(let x=-47;x<TILE;x+=ir(r,110,260)){const w=ir(r,40,120),h=ir(r,18,55);poly(c,[[x,HEIGHT],[x+w*.15,HEIGHT-h],[x+w*.5,HEIGHT-h-8],[x+w*.85,HEIGHT-h*.7],[x+w,HEIGHT]],'#030d17');if(r()>.4)coral(c,x+w*.5,HEIGHT-h,30+h,r,['#29405a','#35264a']);}
  return e;
 }
 function background(c,s,t,travel,width){
  const p=s.p;
  // Slowly wandering shafts of light from the surface.
  for(let k=0;k<4;k++){const x=mod(k*width/3.3+Math.sin(t*.05+k)*60-travel*1.2,width+200)-100,w=30+k*12;c.globalAlpha=.05+.02*Math.sin(t*.3+k);poly(c,[[x,0],[x+w,0],[x+w*2+120,HEIGHT],[x+80,HEIGHT]],p.light);}
  c.globalAlpha=1;
  if(s.p.district!==2)for(let k=0;k<2;k++)school(c,mod(t*9+k*width*.55-travel*2,width+160)-80,150+k*60,t+k*3,9,'#3b7f96',50,1);
 }
 function life(c,s,t0,travel,width,quiet){
  const p=s.p,d=p.district||0;
  cells(travel,width,(x,cell)=>{const t=t0+cell*11;
   if(cell&&d>=1&&d<=3){altLife(c,x,d,cell,t,p,quiet);return;}if(d>=4||(d===0&&cell)){extraLife(c,x,d,cell,t,p,quiet);return;}
   if(d===0){
    const lift=shuttling(t,48);rect(c,x+123,30+lift.f*250,16,20,'#e0a84a');rect(c,x+126,34+lift.f*250,10,5,p.light);
    const u=mod(t*.06,1);rect(c,x+178+u*244-10,355,20,10,'#e0a84a');rect(c,x+178+u*244-6,357,12,3,p.light);
    const q=shuttling(t,40);diver(c,x+470+q.f*170,300-q.f*20,t,p,q.dir);
    if(!quiet)school(c,x+300,250,t,7,'#6fd6d0',36,1);
    for(let k=0;k<5;k++){const f=mod(t*.25+k/5,1);c.globalAlpha=.5*(1-f);ellipse(c,x+106+Math.sin(t+k)*3,284-f*120,1+f*2,1+f*2,p.light);}c.globalAlpha=1;
   }else if(d===1){
    for(let k=0;k<3;k++){const xx=x+40+k*250;c.globalAlpha=.35+.25*Math.sin(t*1.5+k);ellipse(c,xx+150,402,8,3,'#7cf5e0');c.globalAlpha=1;}
    school(c,x+200,230+Math.sin(t*.2)*20,t,quiet?6:14,'#ffb07a',60,Math.sin(t*.1)>0?1:-1);
    const q=shuttling(t,55);submarine(c,x+120+q.f*520,180,t,p,.55,q.dir);
   }else if(d===2){
    // The research sub works the trench on its cable.
    const q=shuttling(t,46),y=345+q.f*90;line(c,x+262,336,x+262,y-8,p.trim);submarine(c,x+262,y,t,p,.6,1);
    c.globalAlpha=.08+.04*Math.sin(t);poly(c,[[x+270,y],[x+470,y+60],[x+470,y-40]],p.light);c.globalAlpha=1;
    for(let k=0;k<3;k++){const f=mod(t*.12+k/3,1);c.globalAlpha=.6*(1-f);ellipse(c,x+537+k*70,364,7+f*9,7+f*9,p.accent+'33');}c.globalAlpha=1;
   }else{
    for(let k=0;k<6;k++)for(let j=0;j<4;j++)kelp(c,x+32+k*125+j*24,400,120+((k*7+j*13)%5)*38,t,p,k+j);
    const q=shuttling(t,60);submarine(c,x+60+q.f*620,300,t,p,.5,q.dir,true);
   }
  });
 }
 function kelp(c,x,base,h,t,p,phase){let px=x,py=base;const n=Math.max(3,Math.floor(h/12));for(let i=1;i<=n;i++){const nx=x+Math.sin(t*.8+phase+i*.45)*i*1.1,ny=base-i*h/n;line(c,px,py,nx,ny,'#3f8a52',2);if(i%2)rect(c,nx+(i%4?1:-5),ny,4,2,'#5eb46a');px=nx;py=ny;}}
 function foreground(c,s,t,travel,width,quiet){
  const p=s.p,n=quiet?14:34,r=rand(s.p.seed+9);
  for(let i=0;i<n;i++){const bx=mod(r()*width*1.3-travel*(6+i%4*5),width+20)-10,by=mod(r()*HEIGHT-t*(8+i%5*4),HEIGHT+20)-10;c.globalAlpha=.25+(i%3)*.12;ellipse(c,bx+Math.sin(t+i)*2,by,1+i%3,1+i%3,p.light);}
  c.globalAlpha=1;
  if(!quiet){for(let k=0;k<2;k++){const x=mod(width*(.2+k*.5)-travel*3+Math.sin(t*.1+k)*30,width+80)-40,y=120+k*70+Math.sin(t*.4+k)*12;jelly(c,x,y,t+k,p,.8);}}
 }
 return {sky,layer,background,life,foreground};
}

// ---------------------------------------------------------------- volcano
function volcano(){
 const lava=(c,x,y,w,h)=>{gradient(c,x,y,w,h,['#ffcf5a','#ff6a1a','#a3200c']);};
 const coolingTower=(c,x,base,w,h,p)=>{poly(c,[[x,base],[x+w*.18,base-h*.55],[x+w*.1,base-h],[x+w*.9,base-h],[x+w*.82,base-h*.55],[x+w,base]],p.mid);poly(c,[[x+w*.6,base],[x+w*.75,base-h*.55],[x+w*.7,base-h],[x+w*.9,base-h],[x+w*.82,base-h*.55],[x+w,base]],p.near);rect(c,x+w*.1,base-h,w*.8,3,p.trim);for(let k=1;k<5;k++)line(c,x+w*.12,base-h*k/5,x+w*.88,base-h*k/5,p.trim+'44');};
 const basalt=(c,x,base,w,h,p,r)=>{for(let k=0;k<w;k+=9){const hh=h-ir(r,0,h*.4);rect(c,x+k,base-hh,8,hh,k%18?p.mid:p.near);rect(c,x+k,base-hh,8,2,p.trim);}};
 const onsen=(c,x,y,w)=>{ellipse(c,x,y,w,w*.22,'#4a3a36');ellipse(c,x,y-1,w-4,w*.18,'#7fb8b4');ellipse(c,x,y-2,w-8,w*.13,'#a8d8d0');rect(c,x-w*.3,y-3,w*.25,1,'#e8fbf6');};
 const lanternRow=(c,x1,x2,y,sag)=>{let px=x1,py=y;for(let i=1;i<=10;i++){const t=i/10,xx=x1+(x2-x1)*t,yy=y+sag*4*t*(1-t);line(c,px,py,xx,yy,'#6e4a3c');if(i<10){ellipse(c,xx,yy+8,5,6,i%2?'#e2453c':'#ffb347');glow(c,xx-3,yy+5,6,6,'#ff8a4a',6);}px=xx;py=yy;}};

 // Districts 1-3: the second and third blocks of a tile get their own composition (see undersea).
 function altLayer(c,x,d,bi,p,r){
  if(d===1){ // 鋳造街
   rect(c,x,286,CELL,6,p.trim);
   if(bi===1){for(let k=0;k<4;k++){const sx=x+20+k*190,h=90+(k%2)*20;rect(c,sx,408-h,150,h,p.mid);poly(c,[[sx-8,408-h],[sx+158,408-h],[sx+140,408-h-24],[sx+10,408-h-24]],p.near);rect(c,sx+40,340,70,68,'#2a1210');glow(c,sx+44,350,62,50,'#ff8a3a',12);rect(c,sx+120,408-h-70,14,50,p.near);rect(c,sx+117,408-h-74,20,5,p.trim);}
    sign(c,x+170,220,16,52,p,r,true,'鍛冶');sign(c,x+500,236,80,14,p,r,false,'ANVIL ROW');}
   else{for(const px of [60,420])rect(c,x+px,150,12,258,p.trim);rect(c,x+60,150,372,10,p.trim);line(c,x+246,160,x+246,210,p.trim,2);ellipse(c,x+246,226,34,20,'#3a2a26');ellipse(c,x+246,214,28,6,'#ffb347');
    for(let k=0;k<5;k++){rect(c,x+90+k*66,378,50,20,'#2a1210');rect(c,x+94+k*66,380,42,8,k%2?'#ff6a1a':'#6a2a1a');}rect(c,x+540,120,70,288,p.near);rect(c,x+536,116,78,8,p.trim);for(let yy=140;yy<390;yy+=30)rect(c,x+556,yy,20,10,'#ff8a3a88');sign(c,x+120,250,80,14,p,r,false,'CAST 3');}
  }else if(d===2){ // 地熱発電の塔群
   if(bi===1){for(let k=0;k<3;k++){const wx=x+60+k*170;poly(c,[[wx,408],[wx+30,300],[wx+60,408]],p.near);line(c,wx+30,300,wx+30,408,p.trim);rect(c,wx+22,296,16,8,p.trim);}
    coolingTower(c,x+560,408,150,220,p);rect(c,x+300,330,120,78,p.mid);rect(c,x+300,330,120,4,p.trim);for(let j=0;j<4;j++)rect(c,x+310+j*28,346,18,12,p.light+'88');sign(c,x+320,300,80,14,p,r,false,'GEO 2');}
   else{rect(c,x+40,300,440,108,p.mid);rect(c,x+40,300,440,5,p.trim);for(let j=0;j<10;j++)rect(c,x+56+j*42,320,26,40,'#ffb34744');for(const cx of [110,380]){rect(c,x+cx,200,26,100,p.near);rect(c,x+cx-3,196,32,6,p.trim);}
    for(let k=0;k<2;k++){const tx=x+560+k*120;line(c,tx,408,tx+20,220,p.trim,2);line(c,tx+40,408,tx+20,220,p.trim,2);line(c,tx,240,tx+40,240,p.trim,2);line(c,tx+4,300,tx+36,300,p.trim);}line(c,x+580,240,x+700,240,p.trim+'88');sign(c,x+200,270,90,16,p,r,false,'POWER');}
   line(c,x,370,x+CELL,370,p.trim,6);line(c,x,378,x+CELL,378,p.near,3);
  }else{ // 火口縁の湯の町
   for(let k=0;k<3;k++){const yy=330+k*26;rect(c,x,yy,CELL,26,k%2?p.mid:p.near);rect(c,x,yy,CELL,2,p.trim);}
   if(bi===1){pagoda(c,x+220,330,320,190,{...p,neon:'#ffb347'},r);onsen(c,x+380,370,150);for(let k=0;k<3;k++){rect(c,x+320+k*44,250,36,26,k===1?'#c84a3a':'#3a4a6a');}sign(c,x+360,220,16,40,p,r,true,'湯');onsen(c,x+100,390,50);onsen(c,x+650,390,50);}
   else{for(let k=0;k<3;k++)pagoda(c,x+20+k*190,330-(k%2)*10,120+(k%2)*30,90+k*16,{...p,neon:'#ffb347'},r);for(let k=0;k<3;k++)onsen(c,x+140+k*220,392,60);rect(c,x+630,250,6,80,'#c84a3a');rect(c,x+700,250,6,80,'#c84a3a');rect(c,x+620,246,96,8,'#c84a3a');rect(c,x+626,258,84,4,'#c84a3a');}
   for(let k=0;k<10;k++)line(c,x+k*77,300,x+k*77+77,300,p.trim);
  }
 }
 function altLife(c,x,d,bi,t,p,quiet){
  if(d===1){if(bi===1){for(let k=0;k<4;k++){const sx=x+20+k*190,u=mod(t*1.4+k*.3,1);if(u<.3&&!quiet)for(let j=0;j<5;j++)rect(c,sx+75+Math.cos(j)*u*40,380-Math.sin(j+1)*u*30,2,1,'#ffd08a');person(c,sx+70,408,t+k,p,{action:'work',hat:k%2===0,coat:'#6a4a3a'});}}
   else{const u=mod(t,20),tilt=u>8&&u<13;if(tilt)for(let j=0;j<8;j++)rect(c,x+270,228+j*18,3,18,j%2?'#ffcf5a':'#ff8a3a');for(let k=0;k<5;k++)steam(c,x+114+k*66,372,t+k,{...p,light:'#c9a6a0'},2);const q=shuttling(t,40);person(c,x+100+q.f*300,408,t,p,{walk:true,dir:q.dir,hat:true,coat:'#7a5a44'});}}
  else if(d===2){if(bi===1){for(let k=0;k<3;k++){for(let j=0;j<(quiet?2:5);j++){const f=mod(t*.2+j/5+k*.3,1);c.globalAlpha=.35*(1-f);ellipse(c,x+90+k*170+Math.sin(t+j)*5,292-f*100,6+f*18,4+f*8,'#d9c8c0');}c.globalAlpha=1;}for(let j=0;j<(quiet?3:6);j++){const f=mod(t*.12+j/6,1);c.globalAlpha=.35*(1-f);ellipse(c,x+635+Math.sin(t*.3+j)*8*f,188-f*120,14+f*40,8+f*16,'#d9c8c0');}c.globalAlpha=1;}
   else{for(const cx of [123,393])steam(c,x+cx,196,t,{...p,light:'#c9a6a0'},4);for(let k=0;k<2;k++)if(Math.sin(t*2+k)>0)glow(c,x+578+k*120,216,4,4,'#ff4b2b',8);robot(c,x+60+shuttling(t,44).f*400,408,t,p,.9);}}
  else{const pools=bi===1?[[380,370,150],[100,390,50],[650,390,50]]:[[140,392,60],[360,392,60],[580,392,60]];
   for(const [cx,cy,w] of pools){for(let j=0;j<(quiet?2:4);j++){const f=mod(t*.2+j/4+cx*.001,1);c.globalAlpha=.3*(1-f);ellipse(c,x+cx+Math.sin(t+j)*6,cy-8-f*40,8+f*w*.1,3+f*4,'#f2e0d8');}c.globalAlpha=1;ellipse(c,x+cx-12,cy-3,4,4,'#e2b896');rect(c,x+cx-16,cy-9,8,3,'#2c211b');}
   for(let k=0;k<10;k++){const lx=x+20+k*77,sw=Math.sin(t*1.3+k)*2;line(c,lx,300,lx+sw,307,p.trim);ellipse(c,lx+sw,311,4,5,'#ff7a3a');rect(c,lx+sw-1,309,2,3,'#ffd08a');}
   const q=shuttling(t,44);person(c,x+60+q.f*600,330,t,p,{walk:true,dir:q.dir,coat:bi===1?'#d8c8b0':'#8a5a5a'});}
 }
 // Extra districts (4-7) and the second and third station blocks (see undersea).
 function extraLayer(c,x,d,bi,p,r){
  if(d===0){
   if(bi===1){basalt(c,x+20,408,200,160,p,r);lava(c,x+240,396,300,12);rect(c,x+240,382,300,8,p.trim);for(let k=0;k<5;k++)rect(c,x+250+k*60,390,6,18,p.near);tower(c,x+580,408,90,210,p,r);sign(c,x+590,260,70,16,p,r,false,'FORGE 2');}
   else{pagoda(c,x+60,408,200,160,p,r);onsen(c,x+160,420,70);coolingTower(c,x+420,408,120,190,p);industry(c,x+580,408,120,130,p,r);sign(c,x+80,236,16,48,p,r,true,'湯宿');}
   return;
  }
  if(d===4){ // 黒曜石の工房
   for(let k=0;k<3;k++){const ox=x+40+k*240+(bi===1?30:0),h=160+((k+bi)%2)*50;rect(c,ox,408-h,180,h,'#1a1216');for(let j=0;j<6;j++)line(c,ox+10+j*28,408-h+10,ox+30+j*28,408-h+40,'#6a5a6a88');rect(c,ox+20,408-60,50,60,'#2a1a14');glow(c,ox+24,408-56,42,40,'#ff8a3a',10);ellipse(c,ox+130,380,18,18,p.trim);ellipse(c,ox+130,380,12,12,'#3a2a2a');}
   sign(c,x+(bi===2?520:300),220,16,48,p,r,true,'黒曜');
  }else if(d===5){ // 溶岩流の見張り所
   lava(c,x,418,CELL,18);for(let k=0;k<14;k++)rect(c,x+k*56+(k%3)*8,422+(k%2)*5,24,4,'#3a1a14');
   const dx=x+(bi===1?380:120);rect(c,dx,330,260,8,p.trim);for(let k=0;k<5;k++)rect(c,dx+10+k*60,338,6,70,p.near);line(c,dx,318,dx+260,318,p.trim);for(let k=0;k<14;k++)line(c,dx+k*20,318,dx+k*20,330,p.trim);
   sign(c,dx+80,290,100,18,p,r,false,'LAVA VIEW');basalt(c,x+(bi===1?40:500),408,160,120,p,r);
  }else if(d===6){ // 火山灰の畑
   for(let k=0;k<10;k++)rect(c,x+k*76,396,60,12,'#4a4442');for(let k=0;k<3;k++){const gx=x+60+k*230+(bi===1?40:0);ellipse(c,gx+60,396,60,40,'#3a4a4a');ellipse(c,gx+60,396,54,34,'#5a7a6a88');rect(c,gx,396,120,12,'#2a2a2a');}
   for(let k=0;k<20;k++)rect(c,x+k*38,360,3,48,'#5a4a3a');line(c,x,362,x+CELL,362,'#5a4a3a');industry(c,x+(bi===2?40:600),408,90,90,p,r);
  }else{ // 灯籠祭りの坂
   for(let k=0;k<14;k++)rect(c,x+80+k*44,408-k*14,48,6,p.trim);pagoda(c,x+(bi===1?80:560),408,150,140,p,r);
   for(let k=0;k<3;k++){const sx=x+120+k*200;rect(c,sx,408-k*50-40,80,40,p.mid);poly(c,[[sx-6,408-k*50-40],[sx+86,408-k*50-40],[sx+76,408-k*50-56],[sx+4,408-k*50-56]],'#8a2a2a');}
   lanternRow(c,x+40,x+400,200,40);lanternRow(c,x+380,x+740,180,46);
  }
 }
 function extraLife(c,x,d,bi,t,p,quiet){
  if(d===0){if(!quiet)for(let k=0;k<8;k++){const f=mod(t*.3+k/8,1);ember(c,x+100+k*80,400-f*200,1-f,'#ffb347');}const q=shuttling(t,34);person(c,x+300+q.f*200,408,t,p,{walk:true,dir:q.dir,coat:'#8a5a3a'});return;}
  if(d===4){for(let k=0;k<(quiet?3:8);k++){const f=mod(t*1.2+k/8,1);rect(c,x+170+(k%3)*240+(bi===1?30:0)+Math.sin(k)*8,380-f*20+f*f*40,1,2,'#ffd08a');}person(c,x+150+(bi===1?30:0),408,t,p,{action:'work',hat:true,coat:'#5a3a2a'});}
  else if(d===5){for(let k=0;k<(quiet?6:14);k++){const f=mod(t*.08+k/14,1);rect(c,x+f*CELL,424+(k%3)*4,6,1,'#fff0a0');}for(let k=0;k<(quiet?1:3);k++)person(c,x+(bi===1?400:140)+k*60,330,t+k,p,{action:'idle',coat:'#6a4a3a'});}
  else if(d===6){for(let k=0;k<(quiet?6:16);k++){const f=mod(t*.1+k/16,1);c.globalAlpha=.3;rect(c,x+mod(k*83+t*20,CELL),200+f*200,2,2,'#c8c0b8');c.globalAlpha=1;}const q=shuttling(t,40);person(c,x+60+q.f*600,396,t,p,{walk:true,dir:q.dir,hat:true,coat:'#6a6a5a'});}
  else{for(let k=0;k<(quiet?2:4);k++){const q=shuttling(t+k*8,30);const u=q.f;person(c,x+80+u*600,408-u*190,t+k,p,{walk:true,dir:q.dir,coat:k%2?'#8a3a3a':'#5a4a6a'});}if(!quiet)for(let k=0;k<6;k++){const f=mod(t*.25+k/6,1);ember(c,x+200+k*90,300-f*150,1-f,'#ffb347');}}
 }
 function sky(p,width){
  const e=surface(width,HEIGHT),c=e.getContext('2d'),r=rand(p.seed+41);gradient(c,0,0,width,HEIGHT,p.sky);
  for(let i=0;i<width*.12;i++){const y=ir(r,5,200);c.globalAlpha=(1-y/220)*(.1+r()*.4);rect(c,ir(r,0,width),y,1,1,p.light);}c.globalAlpha=1;
  // The mother volcano, its crater glowing into a heavy plume.
  const vx=width*.66;
  for(let k=0;k<14;k++){const px=vx-40+k*9+Math.sin(k)*30,py=150-k*9;c.globalAlpha=.55;ellipse(c,px,py,40+k*5,20+k*2,k%2?'#2a1418':'#34181c');}
  c.globalAlpha=1;
  const g=c.createRadialGradient(vx,215,5,vx,215,130);g.addColorStop(0,'#ff8a3a88');g.addColorStop(1,'#ff4b2b00');c.fillStyle=g;c.fillRect(vx-140,90,280,250);
  poly(c,[[vx-360,HEIGHT],[vx-70,212],[vx-30,205],[vx+30,207],[vx+75,214],[vx+380,HEIGHT]],'#1c0d10');
  rect(c,vx-30,204,60,4,'#ff7a2a');
  for(let k=0;k<5;k++){const sx=vx-20+k*10;c.globalAlpha=.8;line(c,sx,208,sx+(k-2)*30+Math.sin(k)*14,300+k*18,k%2?'#ff5a1f':'#ffb347',2);}c.globalAlpha=1;
  const pts=[[0,HEIGHT]];for(let x=0;x<=width+20;x+=20)pts.push([x,320+Math.sin(x/80)*14+Math.cos(x/33)*6]);pts.push([width,HEIGHT]);poly(c,pts,'#170a0e');
  dither(c,width,r,['#ffb08a','#0a0204']);return e;
 }
 function layer(p,depth){
  const e=surface(TILE,HEIGHT),c=e.getContext('2d'),d=p.district||0,r=rand(p.seed+depth*177+d*31);c.imageSmoothingEnabled=false;
  if(depth===0){
   const pp={...p,mid:p.far,near:p.far,trim:'#3a1c1c'};
   for(let x=-CELL;x<=TILE;x+=CELL){
    for(let k=0;k<5;k++){const sx=x+k*160+ir(r,-20,20),h=ir(r,70,150);poly(c,[[sx-50,HEIGHT],[sx-8,HEIGHT-h],[sx+12,HEIGHT-h-6],[sx+60,HEIGHT]],p.far);}
    if(d===2)for(let k=0;k<3;k++)coolingTower(c,x+80+k*240,380,90,150,pp);
    else for(let k=0;k<4;k++){const xx=x+60+k*180;rect(c,xx,260,14,120,p.far);glow(c,xx+5,256,4,3,'#ff6a2a',10);}
   }
   c.globalAlpha=.35;gradient(c,0,250,TILE,200,[p.haze+'00',p.haze+'66']);c.globalAlpha=1;return e;
  }
  if(depth===1){
   rect(c,0,408,TILE,HEIGHT-408,p.near);line(c,0,408,TILE,408,p.trim,2);
   for(let x=-CELL;x<=TILE;x+=CELL){
    const bi=((Math.round(x/CELL)%3)+3)%3;if(bi&&d>=1&&d<=3){altLayer(c,x,d,bi,p,r);continue;}if(d>=4||(d===0&&bi)){extraLayer(c,x,d,bi,p,r);continue;}
    if(d===0){
     for(let k=0;k<3;k++)industry(c,x+20+k*170,408,110,150+k%2*60,{...p,neon:p.neon},r);
     lava(c,x,420,CELL,16);rect(c,x+560,410,160,8,p.trim);rect(c,x+568,418,8,20,p.near);rect(c,x+704,418,8,20,p.near);line(c,x+560,410,x+720,410,p.light+'88');
     sign(c,x+600,300,60,16,p,r,false,'CALDERA');tower(c,x+640,408,70,190,p,r);
    }else if(d===1){
     for(let k=0;k<2;k++){const xx=x+30+k*380;
      // Blast furnace tower behind the casting hall.
      rect(c,xx+40,90,56,170,p.near);rect(c,xx+36,86,64,8,p.trim);for(let yy=110;yy<250;yy+=26){rect(c,xx+40,yy,56,3,p.trim);rect(c,xx+50,yy+8,10,8,'#ff8a3a88');}glow(c,xx+68,90,6,2,'#ff6a1a',12);
      rect(c,xx,260,300,148,p.mid);poly(c,[[xx-10,262],[xx+150,210],[xx+310,262]],p.near);for(let j=0;j<12;j++)line(c,xx+j*25,262-Math.min(j,12-j)*8.3,xx+j*25,262,p.trim+'55');
      gradient(c,xx+20,300,260,70,['#6a2a14','#2a1210']);for(let j=0;j<6;j++){rect(c,xx+30+j*44,310,30,48,'#ffb34766');rect(c,xx+30+j*44,310,30,3,'#ffd08a');}
      rect(c,xx+250,150,24,110,p.near);rect(c,xx+247,146,30,6,p.trim);sign(c,xx+110,236,80,14,p,r,false,k?'CAST 2':'FOUNDRY');}
     rect(c,x,286,CELL,6,p.trim);for(let k=0;k<8;k++)rect(c,x+k*96,292,4,116,p.trim);
    }else if(d===2){
     for(let k=0;k<3;k++)coolingTower(c,x+30+k*250,408,140,210,p);
     for(let k=0;k<3;k++){rect(c,x+170+k*250,340,80,68,p.mid);rect(c,x+170+k*250,340,80,4,p.trim);}
     line(c,x,370,x+CELL,370,p.trim,6);line(c,x,378,x+CELL,378,p.near,3);
    }else{
     // Terraced hot springs down the crater rim, inns behind.
     for(let k=0;k<3;k++){const yy=330+k*26;rect(c,x,yy,CELL,26,k%2?p.mid:p.near);rect(c,x,yy,CELL,2,p.trim);}
     for(let k=0;k<3;k++)pagoda(c,x+30+k*250,330,140,120,{...p,neon:'#ffb347'},r);
     for(let k=0;k<5;k++)onsen(c,x+80+k*150,352+(k%2)*26,46);
     for(let k=0;k<10;k++){line(c,x+k*77,300,x+k*77+77,300,p.trim);}
    }
   }
   return e;
  }
  for(let x=-40;x<TILE;x+=ir(r,140,300)){basalt(c,x,HEIGHT,ir(r,40,110),ir(r,25,70),{...p,mid:'#150b0e',near:'#0d0609',trim:'#3a1c18'},r);if(r()>.5){rect(c,x+10,HEIGHT-4,30,2,'#ff5a1f88');}}
  return e;
 }
 function background(c,s,t,travel,width){
  const vx=width*.66,f=.5+.5*Math.sin(t*.7)+.2*Math.sin(t*2.3);
  const g=c.createRadialGradient(vx,205,2,vx,205,60+f*20);g.addColorStop(0,'#ffb347'+hex2(.35+.2*f));g.addColorStop(1,'#ff4b2b00');c.fillStyle=g;c.fillRect(vx-100,120,200,180);
  // Volcanic lightning in the plume, rare and brief.
  const u=mod(t,23);if(u<.35){c.globalAlpha=.8;let x=vx-30+Math.sin(t)*60,y=60;for(let k=0;k<6;k++){const nx=x+Math.sin(k*3+t)*12,ny=y+14;line(c,x,y,nx,ny,'#fff1c9',1);x=nx;y=ny;}c.globalAlpha=1;}
 }
 function life(c,s,t0,travel,width,quiet){
  const p=s.p,d=p.district||0;
  cells(travel,width,(x,cell)=>{const t=t0+cell*11;
   if(cell&&d>=1&&d<=3){altLife(c,x,d,cell,t,p,quiet);return;}if(d>=4||(d===0&&cell)){extraLife(c,x,d,cell,t,p,quiet);return;}
   if(d===0){
    for(let k=0;k<(quiet?8:20);k++){const f=mod(t*.05+k/20,1);rect(c,x+f*CELL,424+(k%3)*3,3+k%4,1,k%2?'#fff0a0':'#ffcf5a');}
    const q=shuttling(t,34);crate(c,x+566+q.f*130,396,16,14,p);person(c,x+560+q.f*130,408,t,p,{walk:true,dir:q.dir,hat:true,coat:'#8a5a3a'});
    steam(c,x+60,258,t,{...p,light:'#c9a6a0'},4);
   }else if(d===1){
    // Crucibles pour along the gantry; the moulds glow while they are fresh.
    for(let k=0;k<2;k++){const xx=x+30+k*380,u=mod(t+k*9,18),gx=xx+40+Math.min(1,u/6)*200;rect(c,gx-14,286,28,8,p.near);line(c,gx,294,gx,312,p.trim);ellipse(c,gx,318,11,8,'#3a2a26');ellipse(c,gx,314,9,3,'#ffb347');
     if(u>6&&u<11){for(let j=0;j<8;j++)rect(c,gx+8,318+j*6,3,6,j%2?'#ffcf5a':'#ff8a3a');if(!quiet)for(let j=0;j<6;j++){const a=mod(t*2+j/6,1);rect(c,gx+10+a*20*Math.cos(j),366-a*14,1,1,'#fff1a0');}}
     rect(c,xx+190,362,70,14,'#2a1210');rect(c,xx+194,364,62,6,u>8?'#ff6a1a':'#6a2a1a');}
    person(c,x+350,408,t,p,{hat:true,action:'work',coat:'#7a5a44'});
   }else if(d===2){
    for(let k=0;k<3;k++){const xx=x+100+k*250;for(let j=0;j<(quiet?3:6);j++){const f=mod(t*.12+j/6+k*.3,1);c.globalAlpha=.35*(1-f);ellipse(c,xx+Math.sin(t*.3+j)*8*f,198-f*120,14+f*40,8+f*16,'#d9c8c0');}c.globalAlpha=1;rotatingFan(c,x+210+k*250,372,12,t*2,p);}
    robot(c,x+60+shuttling(t,44).f*600,408,t,p,.9);
   }else{
    for(let k=0;k<5;k++){const cx=x+80+k*150,cy=352+(k%2)*26;for(let j=0;j<(quiet?2:4);j++){const f=mod(t*.2+j/4+k*.17,1);c.globalAlpha=.3*(1-f);ellipse(c,cx+Math.sin(t+j)*6,cy-8-f*40,8+f*10,3+f*4,'#f2e0d8');}c.globalAlpha=1;
     if(k%2===0){ellipse(c,cx-12,cy-3,4,4,'#e2b896');rect(c,cx-16,cy-9,8,3,'#2c211b');ellipse(c,cx+10,cy-3,4,4,'#c99673');rect(c,cx+6,cy-9,8,3,'#1d1a1c');}}
    for(let k=0;k<10;k++){const lx=x+20+k*77,sw=Math.sin(t*1.3+k)*2;line(c,lx,300,lx+sw,307,p.trim);ellipse(c,lx+sw,311,4,5,'#ff7a3a');rect(c,lx+sw-1,309,2,3,'#ffd08a');}
    const q=shuttling(t,50);person(c,x+60+q.f*600,330,t,p,{walk:true,dir:q.dir,coat:'#c8c0b0'});
   }
  });
 }
 function foreground(c,s,t,travel,width,quiet){
  const r=rand(s.p.seed+9),n=quiet?16:40;
  for(let i=0;i<n;i++){const ex=mod(r()*width*1.4-travel*(5+i%4*6)+Math.sin(t*.7+i)*8,width+20)-10,ey=mod(r()*HEIGHT-t*(10+i%5*6),HEIGHT+20)-10;ember(c,ex,ey,.35+.35*Math.sin(t*3+i),i%3?'#ffb347':'#ff5a1f');}
  c.globalAlpha=.1;for(let i=0;i<(quiet?10:26);i++){rect(c,mod(r()*width-travel*14-t*6,width),mod(r()*HEIGHT+t*9,HEIGHT),2,1,'#b8a8a0');}c.globalAlpha=1;
 }
 return {sky,layer,background,life,foreground};
}

// ---------------------------------------------------------------- sky
function skyCity(){
 const puff=(c,x,y,w,h,col)=>{for(let k=0;k<5;k++)ellipse(c,x+w*(k/4-.5)*.8,y-Math.sin(k/4*Math.PI)*h*.5,w*.28,h*.55,col);rect(c,x-w*.45,y,w*.9,h*.35,col);};
 function island(c,x,top,w,p,r,depth=60){
  const pts=[[x,top],[x+w,top]];for(let k=1;k<=6;k++){const f=k/6;pts.push([x+w-w*f*.5+ir(r,-6,6),top+Math.sin(f*Math.PI*.5)*depth+ir(r,-4,4)]);}
  pts.push([x+w*.46,top+depth+14]);for(let k=5;k>=1;k--){const f=k/6;pts.push([x+w*f*.5+ir(r,-6,6),top+Math.sin(f*Math.PI*.5)*depth+ir(r,-4,4)]);}
  poly(c,pts,'#4a3e52');poly(c,[[x+w*.5,top],[x+w,top],[x+w*.6,top+depth]],'#3a3044');rect(c,x-2,top-3,w+4,5,'#5f8a6a');rect(c,x,top+2,w,2,'#3f5f4c');
  for(let k=0;k<4;k++)line(c,x+w*(.25+k*.15),top+depth*.6,x+w*(.25+k*.15)+ir(r,-4,4),top+depth+ir(r,6,24),'#5f8a6a55');
 }
 const propeller=(c,x,y,t,p)=>{rect(c,x-2,y,4,10,p.trim);const a=Math.cos(t*14)*14;line(c,x-a,y+12,x+a,y+12,p.light,2);};
 const turbine=(c,x,base,h,t,p)=>{line(c,x,base,x,base-h,p.trim,4);rect(c,x-5,base-h-4,12,8,p.light);for(let k=0;k<3;k++){const a=t*1.2+k*Math.PI*2/3;line(c,x,base-h,x+Math.cos(a)*h*.45,base-h+Math.sin(a)*h*.45,'#e9e4d6',3);}};
 const shrub=(c,x,y,col)=>{ellipse(c,x,y-8,12,10,col);ellipse(c,x-8,y-4,8,6,col);ellipse(c,x+8,y-4,8,6,col);rect(c,x-1,y-2,2,6,'#4a3e52');};
 const bellTower=(c,x,base,h,p)=>{rect(c,x,base-h,30,h,p.mid);rect(c,x-4,base-h,38,5,p.trim);poly(c,[[x-6,base-h],[x+15,base-h-24],[x+36,base-h]],p.near);rect(c,x+8,base-h+10,14,16,'#1a2040');};

 const windmill=(c,x,base,h,p)=>{poly(c,[[x-16,base],[x-9,base-h],[x+9,base-h],[x+16,base]],p.mid);poly(c,[[x-12,base-h],[x,base-h-14],[x+12,base-h]],p.near);rect(c,x-5,base-24,10,24,p.light+'66');};
 // Districts 1-3: the second and third blocks of a tile get their own composition (see undersea).
 function altLayer(c,x,d,bi,p,r){
  if(d===1){ // 浮遊島の市場
   if(bi===1){island(c,x+80,330,480,p,r,100);poly(c,[[x+240,330],[x+320,230],[x+400,330]],'#c85a5a');rect(c,x+300,290,40,40,p.light+'66');for(let k=0;k<5;k++){if(k===2)continue;const sx=x+110+k*85;rect(c,sx,304,56,26,p.mid);poly(c,[[sx-4,304],[sx+28,290],[sx+60,304]],k%2?'#e0b060':'#9fe3ff');}
    island(c,x+620,300,110,p,r,40);line(c,x+560,300,x+620,290,p.trim);sign(c,x+280,200,80,16,p,r,false,'BAZAAR');}
   else{for(let k=0;k<3;k++){const bx=x+100+k*240,ry=290+(k%2)*40;line(c,bx-40,ry,bx,ry-110,p.trim);line(c,bx+60,ry,bx+20,ry-110,p.trim);ellipse(c,bx+10,ry-130,34,30,['#ffb0d0','#9fe3ff','#fff1c9'][k]);rect(c,bx-50,ry,120,8,'#8a6a4a');rect(c,bx-40,ry-24,100,24,p.mid);rect(c,bx-34,ry-18,88,10,p.light+'88');}
    line(c,x+170,300,x+290,330,p.trim);line(c,x+410,330,x+530,300,p.trim);}
  }else if(d===2){ // 風車の発電群
   if(bi===1){island(c,x+30,350,700,p,r,80);for(let k=0;k<4;k++)windmill(c,x+110+k*170,350,110+(k%2)*30,p);rect(c,x+380,330,50,20,p.mid);}
   else{island(c,x+200,340,340,p,r,90);line(c,x+370,340,x+370,120,p.trim,5);for(let k=0;k<3;k++)line(c,x+370,340,x+250+k*120,440,p.trim+'88');for(let k=0;k<3;k++){rect(c,x+230+k*80,310,60,30,p.mid);rect(c,x+238+k*80,318,44,8,'#9fffb8aa');}sign(c,x+420,290,80,16,p,r,false,'WIND 4');island(c,x+620,300,100,p,r,40);}
  }else{ // 飛行船の港
   if(bi===1){island(c,x+60,350,560,p,r,90);dome(c,x+120,350,400,160,p,r,'HANGAR');rect(c,x+220,270,200,80,'#0a1030');line(c,x+560,350,x+560,180,p.trim,4);line(c,x+560,184,x+660,184,p.trim,3);line(c,x+650,184,x+650,260,p.trim);}
   else{island(c,x+300,350,300,p,r,80);rect(c,x+440,140,14,210,p.trim);for(let yy=150;yy<340;yy+=20)line(c,x+440,yy,x+454,yy+10,p.near);rect(c,x+430,134,34,8,p.trim);rect(c,x+320,300,110,50,p.mid);for(let j=0;j<4;j++)rect(c,x+330+j*26,314,16,12,p.light+'88');line(c,x+300,330,x+220,330,p.trim,3);sign(c,x+330,280,90,15,p,r,false,'GATE 2');island(c,x+40,330,160,p,r,50);}
  }
 }
 function altLife(c,x,d,bi,t,p,quiet){
  if(d===1){if(bi===1){for(let k=0;k<(quiet?2:4);k++)person(c,x+130+k*110+Math.sin(t*.3+k)*14,330,t+k,p,{walk:k%2===1,coat:['#b58a6a','#6a7ab0','#8a6a9a','#6a9a8a'][k]});}
   else{for(let k=0;k<3;k++)person(c,x+100+k*240,290+(k%2)*40,t+k,p,{action:'work',coat:'#b58a6a'});}
   if(!quiet)for(let k=0;k<2;k++){const f=mod(t*.05+k/2,1);balloon(c,x+300+k*260+Math.sin(t+k)*6,300-f*260,['#ff7aa8','#ffd07a'][k]);}}
  else if(d===2){if(bi===1){for(let k=0;k<4;k++){const mx=x+110+k*170,my=350-(110+(k%2)*30)+4;for(let j=0;j<4;j++){const a=t*.9+k+j*Math.PI/2;line(c,mx,my,mx+Math.cos(a)*40,my+Math.sin(a)*40,'#e9e4d6',3);}}}
   else{const a=t*.7;for(let k=0;k<3;k++){const b=a+k*Math.PI*2/3;line(c,x+370,120,x+370+Math.cos(b)*80,120+Math.sin(b)*80,'#e9e4d6',4);}}
   for(let k=0;k<(quiet?1:3);k++)bird(c,x+mod(t*22+k*240,CELL),140+k*30,t+k);}
  else{if(bi===1){robot(c,x+220+shuttling(t,40).f*200,350,t,p,.8);const q=shuttling(t,30);rect(c,x+650-2,190+q.f*60,4,8,p.trim);crate(c,x+640,198+q.f*60,20,14,p);}
   else{const by=150+Math.sin(t*.5)*3;line(c,x+460,140,x+495,by,p.trim);blimp(c,x+530,by,t,p,.8,-1,'ARCA-5');const q=shuttling(t,36);person(c,x+230+q.f*180,330,t,p,{walk:true,dir:q.dir,carry:true,coat:'#7a86b8'});}}
 }
 // Extra districts (4-7) and the second and third station blocks (see undersea).
 function extraLayer(c,x,d,bi,p,r){
  if(d===0){
   if(bi===1){island(c,x+60,320,360,p,r,90);for(let k=0;k<4;k++){rect(c,x+80+k*80,294,60,26,p.mid);rect(c,x+76+k*80,290,68,5,['#ffb0d0','#9fe3ff','#fff1c9','#c8a8ff'][k]);}line(c,x+520,320,x+520,170,p.trim,4);rect(c,x+510,166,20,8,p.trim);island(c,x+470,330,140,p,r,50);sign(c,x+530,220,70,16,p,r,false,'MOOR 5');}
   else{island(c,x+40,300,220,p,r,70);bellTower(c,x+120,300,120,p);island(c,x+420,340,280,p,r,80);for(let k=0;k<3;k++)tower(c,x+450+k*80,340,56,90+k*30,p,r);line(c,x+260,296,x+420,330,p.trim,2);for(let k=0;k<9;k++)line(c,x+270+k*17,298+k*3.6,x+270+k*17,306+k*3.6,p.trim);}
   return;
  }
  if(d===4){ // 雲海の灯台
   const lx=x+(bi===1?480:160);island(c,lx-80,330,220,p,r,70);rect(c,lx,190,28,140,'#e8e0d0');for(let k=0;k<5;k++)rect(c,lx,200+k*26,28,8,'#c85a5a');rect(c,lx-6,182,40,8,p.trim);rect(c,lx+4,164,20,18,'#1a2040');
   island(c,x+(bi===1?80:500),350,180,p,r,50);sign(c,x+(bi===1?100:520),320,90,16,p,r,false,'BEACON');
  }else if(d===5){ // 風の鐘楼
   for(let k=0;k<3;k++){const ix=x+30+k*250,top=320+((k+bi)%2)*24;island(c,ix,top,180,p,r,60);bellTower(c,ix+30,top,100+k*20,p);bellTower(c,ix+110,top,80,p);}
  }else if(d===6){ // 空中庭園
   for(let k=0;k<3;k++){const ix=x+20+k*250+(bi===1?30:0),top=300+((k+bi)%3)*20;island(c,ix,top,200,p,r,70);for(let j=0;j<5;j++)shrub(c,ix+20+j*38,top,j%2?'#6aa86a':'#8ac87a');for(let j=0;j<4;j++)ellipse(c,ix+30+j*44,top-18,4,3,['#ffb0d0','#fff1c9','#c8a8ff','#ff9a9a'][j]);line(c,ix+180,top+30,ix+184,top+140,'#9fe3ff88',3);}
  }else{ // 気球の発着場
   const ix=x+(bi===1?260:60);island(c,ix,340,420,p,r,80);rect(c,ix+20,330,380,10,p.trim);for(let k=0;k<4;k++){const bx=ix+50+k*95;line(c,bx,330,bx,280,p.trim);ellipse(c,bx,262,20,24,['#ffb0d0','#9fe3ff','#fff1c9','#c8a8ff'][(k+bi)%4]);rect(c,bx-6,284,12,8,'#8a6a4a');}
   sign(c,ix+160,300,100,16,p,r,false,'BALLOONS');
  }
 }
 function extraLife(c,x,d,bi,t,p,quiet){
  if(d===0){for(let k=0;k<(quiet?1:3);k++)bird(c,x+mod(t*20+k*200,CELL),160+k*30,t+k);const q=shuttling(t,38);person(c,x+(bi===1?120:460)+q.f*160,bi===1?320:340,t,p,{walk:true,dir:q.dir,coat:'#7a86b8'});return;}
  if(d===4){const lx=x+(bi===1?480:160)+14,ang=t*.7;c.save();c.globalAlpha=.16;poly(c,[[lx,172],[lx+Math.cos(ang)*300,172+Math.sin(ang)*30-12],[lx+Math.cos(ang)*300,172+Math.sin(ang)*30+14]],'#fff1c9');c.restore();}
  else if(d===5){for(let k=0;k<3;k++){const ix=x+30+k*250,top=320+((k+bi)%2)*24,sw=Math.sin(t*2+k)*3;ellipse(c,ix+45+sw,top-100-k*20+26,5,6,'#c9a24a');ellipse(c,ix+125-sw,top-80+26,4,5,'#c9a24a');}for(let k=0;k<(quiet?1:3);k++)kite(c,x+100+k*260,120+Math.sin(t*.8+k)*20,t+k,['#ffb0d0','#9fe3ff','#fff1c9'][k]);}
  else if(d===6){for(let k=0;k<(quiet?1:3);k++)bird(c,x+mod(t*18+k*230,CELL),150+k*40,t+k);}
  else{for(let k=0;k<(quiet?1:3);k++){const f=mod(t*.03+k/3,1),bx=x+(bi===1?260:60)+60+k*140,by=260-f*240;ellipse(c,bx,by,16,20,['#ffb0d0','#9fe3ff','#fff1c9'][k]);line(c,bx-8,by+18,bx-4,by+30,p.trim);line(c,bx+8,by+18,bx+4,by+30,p.trim);rect(c,bx-5,by+30,10,7,'#8a6a4a');}}
 }
 function sky(p,width){
  const e=surface(width,HEIGHT),c=e.getContext('2d'),r=rand(p.seed+41);gradient(c,0,0,width,HEIGHT,p.sky);
  for(let i=0;i<width*.35;i++){const y=ir(r,4,260);c.globalAlpha=(1-y/300)*(.2+r()*.6);rect(c,ir(r,0,width),y,1,1,p.light);if(r()>.98){rect(c,ir(r,0,width),y,3,1,p.accent);}}
  c.globalAlpha=1;moon(c,width*.22,78,46,p,r,false);
  c.save();c.globalAlpha=.15;c.strokeStyle=p.accent;for(let k=0;k<3;k++){c.beginPath();c.moveTo(-10,60+k*12);c.bezierCurveTo(width*.3,20+k*14,width*.6,110+k*10,width+10,50+k*8);c.stroke();}c.restore();
  // Remote islands hanging over the cloud sea, too far to parallax.
  for(let k=0;k<5;k++){const x=r()*width,w=30+r()*50,y=180+r()*70;c.globalAlpha=.45;poly(c,[[x,y],[x+w,y],[x+w*.5,y+w*.7]],'#3b3f6a');rect(c,x+w*.3,y-12,6,12,'#3b3f6a');c.globalAlpha=1;rect(c,x+w*.3+2,y-9,2,2,p.light);}
  gradient(c,0,300,width,150,['#8fa3d800','#b8c4e8aa','#dfe3f2']);
  dither(c,width,r,['#ffffff','#0a1030']);return e;
 }
 function layer(p,depth){
  const e=surface(TILE,HEIGHT),c=e.getContext('2d'),d=p.district||0,r=rand(p.seed+depth*177+d*31);c.imageSmoothingEnabled=false;
  if(depth===0){
   for(let x=-CELL;x<=TILE;x+=CELL){
    for(let k=0;k<3;k++){const xx=x+60+k*260+ir(r,-30,30),w=ir(r,80,150),top=ir(r,230,290);c.globalAlpha=.8;island(c,xx,top,w,{...p},r,40);c.globalAlpha=1;for(let j=0;j<3;j++){const bw=ir(r,10,20);rect(c,xx+10+j*(w/3),top-ir(r,20,50),bw,50,'#34406a');}}
    for(let k=0;k<6;k++)puff(c,x+k*130,360,140,40,'#c9d2ee');
   }
   return e;
  }
  if(depth===1){
   for(let x=-CELL;x<=TILE;x+=CELL){
    const bi=((Math.round(x/CELL)%3)+3)%3;if(bi&&d>=1&&d<=3){altLayer(c,x,d,bi,p,r);continue;}if(d>=4||(d===0&&bi)){extraLayer(c,x,d,bi,p,r);continue;}
    if(d===0){
     island(c,x+20,330,300,p,r,90);island(c,x+440,300,260,p,r,80);
     for(let k=0;k<3;k++)tower(c,x+40+k*90,330,60,120+k%2*50,p,r);dome(c,x+470,300,120,80,p,r,'ARCA');tower(c,x+610,300,56,160,p,r);
     line(c,x+320,316,x+440,290,p.trim,2);line(c,x+320,322,x+440,296,p.trim,1);for(let k=0;k<7;k++)line(c,x+330+k*16,316-k*3.7,x+330+k*16,322-k*3.7,p.trim);
    }else if(d===1){
     for(let k=0;k<3;k++){const xx=x+20+k*250,top=320+(k%2)*30;island(c,xx,top,180,p,r,60);for(let j=0;j<3;j++){const sx=xx+14+j*56;rect(c,sx,top-26,44,26,p.mid);poly(c,[[sx-4,top-26],[sx+22,top-40],[sx+48,top-26]],j%2?'#c85a5a':'#e0b060');rect(c,sx+6,top-18,32,10,p.light+'88');}}
     line(c,x+200,280,x+270,300,p.trim);line(c,x+450,300,x+520,280,p.trim);
    }else if(d===2){
     for(let k=0;k<2;k++)island(c,x+60+k*380,340,260,p,r,70);
     for(let k=0;k<3;k++){rect(c,x+80+k*80,300,40,40,p.mid);rect(c,x+80+k*80,300,40,4,p.trim);}
    }else{
     island(c,x+40,340,380,p,r,80);
     for(let k=0;k<3;k++){const mx=x+120+k*230;if(mx>x+CELL-20)continue;line(c,mx,340,mx,170,p.trim,5);rect(c,mx-8,166,16,8,p.trim);for(let yy=180;yy<340;yy+=20)line(c,mx-6,yy,mx+6,yy+10,p.trim);}
     island(c,x+450,352,230,p,r,50);rect(c,x+440,320,240,10,p.trim);for(let k=0;k<5;k++)rect(c,x+450+k*48,330,6,40,p.near);sign(c,x+80,300,110,15,p,r,false,'AIRSHIP PORT');
    }
   }
   return e;
  }
  for(let x=-60;x<TILE;x+=ir(r,160,320))puff(c,x,HEIGHT-4,ir(r,140,260),ir(r,40,70),'#e8ecf8');
  return e;
 }
 function background(c,s,t,travel,width){
  for(let k=0;k<2;k++){const off=mod(t*(3+k*2)+travel*(1+k),width+400);for(let x=-off;x<width+400;x+=420)puff(c,x,382+k*22,300,40,k?'#d7ddf2':'#bfc9e8');}
  const x=mod(width*.9-t*6,width+300)-150;blimp(c,x,120,t,s.p,.45,-1);
 }
 function life(c,s,t0,travel,width,quiet){
  const p=s.p,d=p.district||0;
  cells(travel,width,(x,cell)=>{const t=t0+cell*11;
   if(cell&&d>=1&&d<=3){altLife(c,x,d,cell,t,p,quiet);return;}if(d>=4||(d===0&&cell)){extraLife(c,x,d,cell,t,p,quiet);return;}
   if(d===0){
    const u=shuttling(t,26),gx=x+330+u.f*104,gy=316-u.f*24;rect(c,gx-7,gy+3,14,11,'#c85a5a');rect(c,gx-5,gy+5,10,4,p.light);line(c,gx,gy,gx,gy+3,p.trim);
    for(let k=0;k<3;k++)propeller(c,x+80+k*90,418,t+k,p);propeller(c,x+560,380,t,p);
    const q=shuttling(t,38);person(c,x+470+q.f*170,300,t,p,{walk:true,dir:q.dir,coat:'#7a86b8'});
   }else if(d===1){
    for(let k=0;k<3;k++){const top=320+(k%2)*30;person(c,x+60+k*250,top,t+k,p,{action:'work',coat:'#b58a6a'});person(c,x+120+k*250+Math.sin(t*.3+k)*20,top,t,p,{walk:true,coat:'#6a7ab0'});}
    if(!quiet)for(let k=0;k<3;k++){const f=mod(t*.05+k/3,1);balloon(c,x+150+k*230+Math.sin(t+k)*6,300-f*260,['#ff7aa8','#9fe3ff','#ffd07a'][k]);}
    const g=shuttling(t,30);rect(c,x+200+g.f*70-6,280+g.f*20,12,9,'#e0b060');
   }else if(d===2){
    for(let k=0;k<2;k++)turbine(c,x+100+k*80,340,120,t+k,p);turbine(c,x+520,340,150,t*.8,p);turbine(c,x+610,340,110,t*1.1+2,p);
    for(let k=0;k<(quiet?2:4);k++){const kx=x+150+k*140+Math.sin(t*.4+k)*30,ky=140+Math.sin(t*.6+k*2)*25+k*15;line(c,kx,ky+9,x+100+k*80,300,'#fff1c944');kite(c,kx,ky,t+k,['#ff7aa8','#9fe3ff','#ffd07a','#b6ff9a'][k]);}
   }else{
    blimp(c,x+230,215+Math.sin(t*.5)*3,t,p,.9,1,'ARCA-2');line(c,x+120,170,x+190,208,p.trim);
    const q=mod(t*.03,1);blimp(c,x+CELL*1.2-q*CELL*1.4,110,t,p,.5,-1);
    robot(c,x+470+shuttling(t,33).f*190,320,t,p,.8);
   }
  });
 }
 function foreground(c,s,t,travel,width,quiet){
  const r=rand(s.p.seed+9);
  // Low mist streaming past, drawn as flat bands so overlaps never darken.
  for(let k=0;k<(quiet?2:4);k++){const x=mod(r()*width*1.5-travel*30-t*4,width+300)-150,y=300+r()*60,w=160+r()*120;c.globalAlpha=.16;rect(c,x,y,w,5,'#f4f6ff');rect(c,x+w*.2,y-4,w*.5,4,'#f4f6ff');}
  c.globalAlpha=1;
  if(!quiet){const u=mod(t,40);if(u<16){const bx=width+40-u*(width+120)/16;for(let k=0;k<7;k++)bird(c,bx+k*14+(k%2)*6,110+Math.abs(k-3)*7,t+k);}}
 }
 return {sky,layer,background,life,foreground};
}

const PAINT={undersea:undersea(),volcano:volcano(),sky:skyCity()};
export const owns=p=>FRONTIER_KINDS.includes(p?.kind);
export const frontier={
 owns,
 sky:(p,width)=>PAINT[p.kind].sky(p,width),
 layer:(p,depth)=>PAINT[p.kind].layer(p,depth),
 background:(c,s,t,travel,width)=>PAINT[s.p.kind].background(c,s,t,travel,width),
 life:(c,s,t,travel,width,quiet)=>PAINT[s.p.kind].life(c,s,t,travel,width,quiet),
 foreground:(c,s,t,travel,width,quiet)=>PAINT[s.p.kind].foreground(c,s,t,travel,width,quiet),
};
for(const kind of FRONTIER_KINDS)PAINTERS[kind]=frontier;
