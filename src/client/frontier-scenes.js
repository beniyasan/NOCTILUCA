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
