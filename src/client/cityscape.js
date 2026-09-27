// Sky, building painters, parallax layer tiles and ambient street life.
// Everything here is deterministic from the world seed; nothing reads engine
// state directly — visits and density arrive as arguments.
import {surface,rect,poly,line,ellipse,glow,gradient,text,cjk,pixelWidth,rand,ir,pick,mod,smooth,shuttling,HEIGHT,TILE} from './pixel.js';
import {person,cat,robot,drone,crate,steam,rotatingFan,workCrane,shipBoat} from './sprites.js';
import {worlds} from './worlds.js';
export function lifeClock(v,time){return Math.max(0,time-v.started)+v.offset;}
export function scenePositions(s,travel,width,fn){
 const start=-mod(travel*8.5,TILE);
 for(let x=start;x<width+430;x+=TILE){for(const h of [s.heroX,s.heroX+1180]){const px=x+h;if(px>-440&&px<width+440)fn(px);}}
}
export function windowGrid(c,x,y,w,h,p,r,depth=1,cols=0){
 const dx=depth===0?ir(r,4,7):ir(r,6,10),dy=depth===0?ir(r,5,8):ir(r,8,12),ww=depth===0?ir(r,1,2):ir(r,2,4),wh=depth===0?2:ir(r,3,5);
 for(let yy=y+6;yy<y+h-5;yy+=dy)for(let xx=x+5;xx<x+w-4;xx+=dx){let v=r();if(v>.60)continue;let col=v>.31?p.light:(v>.17?p.accent:p.trim);c.globalAlpha=depth===0?(.25+r()*.43):(.43+r()*.5);rect(c,xx,yy,ww,wh,col);if(depth>0&&v>.42){c.globalAlpha=.13;rect(c,xx-1,yy+wh,ww+2,2,col);}}
 c.globalAlpha=1;
}
export function sign(c,x,y,w,h,p,r,vertical=false,label=''){
 rect(c,x-2,y-2,w+4,h+4,'#090e1c');const col=r()>.45?p.accent:p.neon;
 c.save();c.shadowColor=col;c.shadowBlur=8;c.strokeStyle=col;c.lineWidth=1;c.strokeRect(Math.round(x)+.5,Math.round(y)+.5,w,h);c.restore();rect(c,x+2,y+2,w-4,h-4,p.near);rect(c,x+w,y+4,2,h,'#030b15');
 if(vertical){const chars=label||pick(r,['夜行','銀河','旅館','月光','ラーメン','夢見','星海','電脳']);const size=Math.min(13,w-3);for(let i=0;i<chars.length;i++)cjk(c,chars[i],x+(w-size)/2,y+5+i*(size+3),col,size);}
 else{const word=label||pick(r,['LUNA','NOVA','HOTEL','OPEN','ORBIT','RAMEN','24:00','RADIO']);let ss=w>72?2:1;if(pixelWidth(word,ss)>w-6)ss=1;text(c,word,x+w/2,y+(h-7*ss)/2,col,ss,'center');}
 if(r()>.5){c.globalAlpha=.3;rect(c,x+2,y+h+3,w,2,col);c.globalAlpha=1;}
}
export function roof(c,x,y,w,p,r,garden=false){
 poly(c,[[x-10,y+8],[x-5,y+6],[x+2,y+6],[x+11,y-3],[x+17,y-6],[x+w-17,y-6],[x+w-9,y+3],[x+w+6,y+7],[x+w+11,y+6],[x+w+8,y+11],[x-9,y+11]],'#071821');
 poly(c,[[x-8,y+7],[x+1,y+6],[x+13,y-5],[x+w-15,y-5],[x+w-4,y+5],[x+w+8,y+8],[x-8,y+8]],p.mid);
 for(let xx=x+10;xx<x+w-5;xx+=4){line(c,xx,y-3,xx-2,y+5,xx%3?p.trim:p.near);}
 line(c,x-7,y+8,x+w+8,y+8,r()>.5?p.neon:p.accent);for(let xx=x+4;xx<x+w-8;xx+=8){c.globalAlpha=.48;rect(c,xx,y+1,2,4,p.accent);}c.globalAlpha=1;line(c,x+14,y-6,x+w-16,y-6,p.trim);rect(c,x-9,y+10,w+18,3,'#080e19');
 if(garden){for(let i=0;i<w/4;i++){let xx=x+r()*w;rect(c,xx,y-8-r()*5,ir(r,2,7),ir(r,2,4),pick(r,['#34756a','#5b9c73','#749f70']));}}
}
export function pagoda(c,x,base,w,h,p,r,garden=false){
 let floors=Math.max(2,Math.floor(h/37)),fh=h/floors;const wood=p.kind==='neon'?'#392631':p.mid;rect(c,x,base-h,w,h,p.near);rect(c,x+w-7,base-h,7,h,'#101624');
 for(let f=0;f<floors;f++){let yy=base-h+f*fh;rect(c,x+3,yy+13,w-9,fh-16,wood);for(let xx=x+8;xx<x+w-13;xx+=15){rect(c,xx,yy+17,10,Math.max(9,fh-21),'#080f1e');if(r()>.22){rect(c,xx+1,yy+18,8,Math.max(6,fh-25),r()>.6?p.accent:p.light);rect(c,xx+4,yy+17,1,fh-21,p.near);rect(c,xx,yy+22,10,2,p.near);rect(c,xx,yy+29,10,1,p.near);}else{line(c,xx,yy+19,xx+9,yy+31,p.trim);line(c,xx+9,yy+19,xx,yy+31,p.trim);}}
 roof(c,x-2,yy+3,w+4,p,r,garden);
 rect(c,x-5,yy+fh-3,w+8,3,p.trim);for(let q=x;q<x+w;q+=7)rect(c,q,yy+fh-8,1,5,p.trim);
 if(r()>.44){rect(c,x+w-20,yy+fh-11,12,7,'#65676b');rect(c,x+w-18,yy+fh-10,5,5,'#283039');for(let z=0;z<3;z++)rect(c,x+w-11,yy+fh-10+z*2,3,1,'#33373d');}}
 for(let xx=x+2;xx<x+w;xx+=Math.max(20,w/3))rect(c,xx,base-h+13,3,h-13,p.trim);
 if(r()>.2)sign(c,x+w-4,base-h+20,16,55,p,r,true);
 // Shopfronts below the eaves.
 if(w>62){rect(c,x+9,base-22,w-23,20,'#072025');rect(c,x+12,base-20,w-29,12,p.accent);for(let xx=x+15;xx<x+w-13;xx+=10)rect(c,xx,base-20,2,17,p.mid);sign(c,x+10,base-35,w-24,11,p,r,false,pick(r,['TEA','RAMEN','NOVA','24H']));}
}
export function tower(c,x,base,w,h,p,r,depth=1){
 let y=base-h;rect(c,x,y,w,h,p.mid);rect(c,x+w-7,y,7,h,p.near);rect(c,x+1,y,2,h,p.trim+'55');rect(c,x+5,y-5,w-12,5,p.mid);
 if(r()>.3){let rw=ir(r,6,Math.max(6,w/2));rect(c,x+w/2-rw/2,y-ir(r,8,17),rw,15,p.mid);line(c,x+w/2,y-8,x+w/2,y-ir(r,18,34),p.trim);if(r()>.5)rect(c,x+w/2,y-24,2,2,p.neon);}
 windowGrid(c,x,y,w,h,p,r,depth);
 if(depth){
  // Wear and infrastructure are deterministic and cached, not random each frame.
  c.save();c.globalAlpha=.10;for(let n=0;n<h*.14;n++)rect(c,x+ir(r,2,Math.max(3,w-6)),y+ir(r,3,h-4),ir(r,1,6),ir(r,1,3),r()>.5?p.light:p.trim);c.restore();
  if(w>35){for(let n=0;n<2;n++){let ax=x+6+n*14;rect(c,ax,y-8,10,7,p.trim);rect(c,ax+2,y-7,5,4,p.near);rect(c,ax+1,y-2,8,1,p.near);}}
  if(w>43&&r()>.55){const lx=x+w-11;line(c,lx,y+18,lx,base-3,p.trim);line(c,lx+5,y+18,lx+5,base-3,p.trim);for(let yy=y+20;yy<base-3;yy+=5)line(c,lx,yy,lx+5,yy,p.trim);for(let yy=y+36;yy<base-4;yy+=33){rect(c,lx-7,yy,15,3,p.near);rect(c,lx-7,yy-4,15,1,p.trim);}}
  if(h>190&&r()>.58){let col=r()>.5?p.neon:p.accent;for(let yy=y+13;yy<base-12;yy+=12){c.globalAlpha=.65;rect(c,x+2,yy,2,7,col);}c.globalAlpha=1;}
 }
 if(depth){for(let k=0;k<ir(r,1,3);k++){let xx=x+ir(r,3,w-9);rect(c,xx,y+3,1,h-3,p.trim+'44');}for(let yy=y+28;yy<base-5;yy+=ir(r,21,43)){rect(c,x,yy,w,3,p.near);rect(c,x+1,yy,Math.max(0,w-8),1,p.trim+'66');if(r()>.72){rect(c,x+3,yy-7,10,6,'#48505a');rect(c,x+4,yy-6,5,4,p.near);}}
 if(w>30&&h>115&&r()>.55)sign(c,x+w-2,y+ir(r,15,45),ir(r,10,16),ir(r,35,65),p,r,true);
 if(w>45&&r()>.63)sign(c,x+5,y+ir(r,10,Math.min(h-25,80)),w-13,18,p,r);
 }
}
export function pipe(c,points,p,width=4){for(let i=1;i<points.length;i++){const[a,b]=[points[i-1],points[i]];line(c,a[0],a[1],b[0],b[1],p.near,width+3);line(c,a[0],a[1],b[0],b[1],p.trim,width);line(c,a[0]-1,a[1]-1,b[0]-1,b[1]-1,'#a5ac9255',1);}}
export function dome(c,x,base,w,h,p,r,label){
 rect(c,x,base-h*.66,w,h*.66,p.mid);ellipse(c,x+w/2,base-h*.65,w/2,h*.37,p.trim);ellipse(c,x+w/2,base-h*.64,w/2-3,h*.35,p.mid);gradient(c,x+3,base-h*.65,w-6,h*.65,[p.mid,p.near]);
 c.save();c.strokeStyle=p.accent;c.globalAlpha=.6;c.lineWidth=1;c.beginPath();c.ellipse(x+w/2,base-h*.66,w/2-3,h*.33,0,Math.PI,Math.PI*2);c.stroke();c.beginPath();c.ellipse(x+w/2,base-h*.66,w*.28,h*.33,0,Math.PI,Math.PI*2);c.stroke();c.restore();rect(c,x,base-h*.64,w,3,p.trim);windowGrid(c,x+2,base-h*.6,w-4,h*.6,p,r);for(let xx=x+9;xx<x+w;xx+=13)rect(c,xx,base-h*.58,2,h*.58,p.trim+'55');
 sign(c,x+w*.22,base-h*.5,w*.57,14,p,r,false,label||pick(r,['OCEAN','DOCK','NEREID','PORT 23']));
}
export function industry(c,x,base,w,h,p,r){
 rect(c,x,base-h*.68,w,h*.68,p.mid);rect(c,x+w-9,base-h*.68,9,h*.68,p.near);windowGrid(c,x+2,base-h*.6,w-5,h*.6,p,r);
 if(r()>.38){let ch=w*.23;rect(c,x+9,base-h,ch,h*.6,p.near);rect(c,x+10,base-h,ch-3,h*.6,p.trim);for(let yy=base-h+6;yy<base-h*.4;yy+=16){rect(c,x+8,yy,ch+2,3,p.mid);if(r()>.6)rect(c,x+9,yy+3,ch,4,p.neon);}rect(c,x+7,base-h-3,ch+4,4,p.near);}
 const tx=x+w*.58,ty=base-h*.62;ellipse(c,tx,ty,w*.26,h*.17,p.trim);rect(c,tx-w*.26,ty,w*.52,h*.4,p.trim);ellipse(c,tx,ty+h*.4,w*.26,h*.1,p.mid);rect(c,tx-w*.26+3,ty-2,4,h*.4,'#b9a18866');for(let yy=ty;yy<ty+h*.3;yy+=10)rect(c,tx-w*.27,yy,w*.54,2,p.near);pipe(c,[[x-7,base-8],[x-7,base-h*.35],[x+w+8,base-h*.35],[x+w+8,base-3]],p,3);
 line(c,x+w-8,base-h*.7,x+w-8,base-3,p.light);for(let yy=base-h*.7;yy<base-3;yy+=5)rect(c,x+w-12,yy,8,1,p.trim);
 if(w>48)sign(c,x+4,base-h*.55,w*.4,13,p,r,false,pick(r,['03','ORE','FUEL','OX-9']));
}
export function spire(c,x,base,w,h,p,r){
 let y=base-h;poly(c,[[x,y+h*.22],[x+w*.28,y+h*.1],[x+w*.5,y-18],[x+w*.72,y+h*.1],[x+w,y+h*.22],[x+w,base],[x,base]],p.mid);poly(c,[[x+w*.5,y-18],[x+w*.72,y+h*.1],[x+w,y+h*.22],[x+w,base],[x+w*.64,base]],p.near);line(c,x+w*.5,y-18,x+w*.5,base,p.trim);line(c,x+2,y+h*.24,x+2,base,p.trim);
 for(let xx=x+7;xx<x+w-5;xx+=7){let ys=y+h*.23+Math.abs(xx-x-w/2)*.8;rect(c,xx,ys,2,base-ys-9,r()>.4?p.light:p.accent);for(let yy=ys;yy<base;yy+=15)rect(c,xx,yy,2,7,p.mid);}
 for(let yy=y+h*.35;yy<base;yy+=h*.22){rect(c,x-4,yy,w+8,4,p.trim);rect(c,x-1,yy+4,w+2,2,p.near);}rect(c,x+w/2-1,y-19,2,4,p.light);
}
export function gardenTree(c,x,y,size,r,p,pink=false){
 const dark=pink?'#653f60':'#153d3b',middle=pink?'#af6687':'#34705b',light=pink?'#e79bb0':'#739b74';
 line(c,x,y,x-2,y-size*.63,'#514954',Math.max(2,size/11));line(c,x,y-size*.3,x-size*.22,y-size*.65,'#514954',2);line(c,x,y-size*.25,x+size*.2,y-size*.59,'#514954',2);
 for(let i=0;i<28;i++){let a=r()*Math.PI*2,d=Math.sqrt(r())*size*.43,xx=x+Math.cos(a)*d,yy=y-size*.67+Math.sin(a)*d*.5;rect(c,xx,yy,ir(r,6,Math.max(7,size/3)),ir(r,3,Math.max(4,size/6)),i<10?dark:i<21?middle:light);}
}
export function moon(c,x,y,r,p,rng,ring=false){
 c.save();c.globalAlpha=p.kind==='neon'?.55:.92;
 // Pixel-stepped, banded planet. Horizontal spans avoid antialiased edges.
 for(let yy=-r;yy<=r;yy++){const len=Math.floor(Math.sqrt(r*r-yy*yy));const shade=(yy+r)/(2*r);rect(c,x-len,y+yy,len*2,1,p.planet);c.globalAlpha=(p.kind==='neon'?.5:.78)*(0.17+shade*.33);rect(c,x-len,y+yy,len*2,1,p.sky[0]);c.globalAlpha=p.kind==='neon'?.5:.92;}
 c.save();c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.clip();for(let i=0;i<14;i++){let yy=y-r+rng()*2*r;c.globalAlpha=.07+rng()*.13;rect(c,x-r,yy,2*r,ir(rng,1,5),rng()>.5?p.accent:p.sky[0]);}c.globalAlpha=.68;ellipse(c,x+r*.56,y-r*.13,r*.83,r*1.02,p.sky[0]);c.restore();
 c.globalAlpha=.6;line(c,x-r*.57,y-r*.8,x-r*.31,y-r*.94,p.light);c.restore();
 if(ring){c.save();c.translate(x,y);c.rotate(-.26);for(let i=0;i<6;i++){c.strokeStyle=i%2?p.light:p.accent;c.globalAlpha=i%2?.23:.15;c.lineWidth=i%2?1:2;c.beginPath();c.ellipse(0,0,r*1.9+i*2,r*.3+i,0,0,Math.PI*2);c.stroke();}c.restore();}
}
export function drawSky(p,width){
 const e=surface(width,HEIGHT),c=e.getContext('2d'),r=rand(p.seed+41);gradient(c,0,0,width,HEIGHT,p.sky);
 // Wide, low-contrast nebula clouds baked only once.
 c.save();for(let i=0;i<9;i++){let x=r()*width,y=r()*HEIGHT*.75;const g=c.createRadialGradient(x,y,0,x,y,120+r()*100);g.addColorStop(0,p.haze+'16');g.addColorStop(1,p.haze+'00');c.fillStyle=g;c.fillRect(0,0,width,HEIGHT);}c.restore();
 for(let i=0;i<width*.3;i++){const x=ir(r,0,width),y=ir(r,6,280),alpha=(1-y/350)*(.15+r()*.6);c.globalAlpha=alpha;rect(c,x,y,1,1,p.light);if(r()>.975){rect(c,x-2,y,5,1,p.accent);rect(c,x,y-2,1,5,p.accent);}}c.globalAlpha=1;
 if(p.kind==='neon'){moon(c,width*.76,92,50,p,r,false);c.save();c.globalAlpha=.23;c.strokeStyle=p.accent;c.lineWidth=1;c.beginPath();c.ellipse(width*.76,80,width*.40,55,-.20,0,Math.PI*2);c.stroke();c.restore();}
 if(p.kind==='water'){moon(c,width*.73,97,80,p,r,true);for(let yy=310;yy<HEIGHT;yy+=3){c.globalAlpha=.1+(yy-310)/1300;let rr=rand(yy+37);for(let i=0;i<28;i++)rect(c,rr()*width,yy,4+rr()*29,1,rr()>.4?p.accent:p.light);}c.globalAlpha=1;}
 if(p.kind==='desert'||p.kind==='rock'){moon(c,width*.72,98,71,p,r,false);for(let i=0;i<3;i++){const pts=[[0,HEIGHT]];for(let x=-20;x<width+40;x+=20)pts.push([x,271+i*31+Math.sin(x/(95-i*15)+i)*18+Math.cos(x/170)*13]);pts.push([width,HEIGHT]);poly(c,pts,[p.kind==='rock'?'#56454b':'#84424b',p.kind==='rock'?'#735448':'#965148',p.kind==='rock'?'#423841':'#77464a'][i]);}}
 if(p.kind==='garden'){moon(c,width*.72,84,57,p,r,false);moon(c,width*.24,63,12,{...p,planet:'#c9dad0'},r,false);c.save();c.globalAlpha=.10;for(let i=0;i<4;i++){c.strokeStyle=p.accent;c.lineWidth=5-i;c.beginPath();c.moveTo(-10,109+i*9);c.bezierCurveTo(width*.3,50+i*10,width*.55,149+i*10,width+20,81+i*6);c.stroke();}c.restore();}
 if(p.kind==='ivory'){
  moon(c,width*.76,91,54,p,r,false);
  c.save();c.translate(width*.55,208);c.rotate(-.37);for(let k=0;k<9;k++){c.strokeStyle=k<4?p.light:p.trim;c.globalAlpha=k<4?.5:.35;c.lineWidth=1;c.beginPath();c.ellipse(0,0,width*.53+k,148+k*.7,0,0,Math.PI*2);c.stroke();}for(let k=0;k<44;k++){let a=k/44*Math.PI*2;const x=Math.cos(a)*(width*.53+4),y=Math.sin(a)*151;c.globalAlpha=.7;rect(c,x,y,4,2,p.light);}c.restore();
 }
 if(p.kind==='scrap'){moon(c,width*.78,94,45,p,r,true);c.save();c.globalAlpha=.42;for(let i=0;i<34;i++){let x=r()*width,y=r()*230,s=ir(r,5,26);poly(c,[[x-s,y],[x-s*.4,y-s*.7],[x+s*.6,y-s*.5],[x+s,y],[x+s*.3,y+s*.6],[x-s*.6,y+s*.5]],i%3?p.planet:p.trim);rect(c,x-s*.5,y-s*.4,s,1,p.trim);}c.restore();c.save();c.strokeStyle=p.accent;c.globalAlpha=.13;c.beginPath();c.moveTo(-10,146);c.bezierCurveTo(width*.25,90,width*.65,200,width+30,132);c.stroke();c.restore();}
 if(p.kind==='void'){moon(c,width*.80,105,37,p,r,true);c.save();c.globalAlpha=.4;for(let i=0;i<22;i++){let x=r()*width,y=r()*320,s=ir(r,2,17);poly(c,[[x-s,y],[x-s*.4,y-s*.7],[x+s*.6,y-s*.5],[x+s,y],[x+s*.3,y+s*.6],[x-s*.6,y+s*.5]],p.planet);rect(c,x-s*.5,y-s*.4,s,1,p.trim);}c.restore();}
 // Still dither instead of animated noise or an expensive per-frame pixel read.
 c.globalAlpha=.055;for(let i=0;i<width*HEIGHT*.08;i++)rect(c,ir(r,0,width),ir(r,0,HEIGHT),1,1,r()>.5?'#e7c9cb':'#000814');c.globalAlpha=1;return e;
}
function heroNeon(c,x,p,r){
 const y=57,w=72,h=208;
 rect(c,x-9,y+7,w+17,260,p.near);rect(c,x-5,y+3,w+6,256,'#4a263e');rect(c,x+3,y-13,w-8,20,'#391d34');rect(c,x+11,y-23,w-24,13,'#251b2c');line(c,x+w*.58,y-23,x+w*.58,y-47,p.trim);rect(c,x+w*.58,y-48,2,2,p.neon);
 glow(c,x,y,w,h,p.neon,14);gradient(c,x+3,y+3,w-6,h-6,['#fc3c78','#c82463','#902145']);for(let yy=y+5;yy<y+h;yy+=3)rect(c,x+2,yy,w-4,1,'#611a4355');
 // An original, pixel-built astronaut advertisement.
 ellipse(c,x+37,y+54,14,15,'#24132d');rect(c,x+20,y+55,31,8,'#24132d');rect(c,x+33,y+50,17,3,'#f1aac58a');
 poly(c,[[x+29,y+68],[x+47,y+68],[x+51,y+110],[x+21,y+113]],'#24132d');poly(c,[[x+27,y+73],[x+18,y+79],[x+9,y+63],[x+4,y+65],[x+12,y+88],[x+26,y+86]],'#24132d');poly(c,[[x+45,y+73],[x+54,y+82],[x+61,y+78],[x+64,y+83],[x+53,y+94],[x+46,y+89]],'#24132d');
 poly(c,[[x+24,y+109],[x+36,y+109],[x+29,y+148],[x+24,y+168],[x+13,y+168],[x+15,y+160]],'#24132d');poly(c,[[x+38,y+107],[x+50,y+108],[x+48,y+138],[x+57,y+158],[x+55,y+166],[x+45,y+165],[x+35,y+139]],'#24132d');
 glow(c,x+7,y+47,2,9,p.light,7);glow(c,x+3,y+51,10,1,p.light,5);
 text(c,'MOON',x+w/2,y+17,'#ffe6df',2,'center');text(c,'DUST',x+w/2,y+181,'#ffe6df',2,'center');
 rect(c,x-5,y+h+4,w+12,6,p.near);for(let yy=y+8;yy<y+h-10;yy+=20){rect(c,x+w+7,yy,4,9,p.light);}
 sign(c,x-20,y+113,15,60,p,r,true,'月光');
 rect(c,x-3,y+h+13,w+5,41,'#201c2c');for(let xx=x+3;xx<x+w-4;xx+=11){rect(c,xx,y+h+17,7,14,p.light);rect(c,xx,y+h+22,7,2,p.near);rect(c,xx+3,y+h+16,1,17,p.near);}sign(c,x+5,y+h+35,w-8,15,p,r,false,'AIR / 07');
 for(let yy=y+9;yy<y+h;yy+=16){rect(c,x-7,yy,2,2,p.light);}

}
// The second landmark along the Kowloon front: a noodle house stacked under a round sign,
// so neighbouring panes of a wide window never show the same billboard twice.
function heroNeonB(c,x,p,r){
 const w=96,top=112,base=319;
 rect(c,x-6,top,w+12,base-top,p.near);rect(c,x-2,top+4,w+4,base-top-8,'#2e2034');
 for(let k=0;k<4;k++){const yy=top+22+k*38;rect(c,x+4,yy-8,w-8,3,p.trim);for(let j=0;j<5;j++)rect(c,x+10+j*17,yy,10,14,(k+j)%3?p.light+'bb':p.accent+'88');}
 ellipse(c,x+w/2,top-34,38,38,'#0b1020');glow(c,x+w/2-32,top-66,64,64,p.neon,12);ellipse(c,x+w/2,top-34,34,34,'#c8245f');ellipse(c,x+w/2,top-34,28,28,'#e83a72');
 cjk(c,'麺',x+w/2-13,top-47,'#fff1e6',26);rect(c,x+w/2-2,top+2,4,6,p.trim);
 for(let k=0;k<3;k++)line(c,x+30+k*18,top-76,x+34+k*18,top-90,'#f6d9e4aa',2);
 sign(c,x+w+4,top+30,15,70,p,r,true,'二十四時');
 rect(c,x-10,base-38,w+20,6,p.neon);for(let xx=x-8;xx<x+w+8;xx+=12)rect(c,xx,base-32,8,10,Math.round(xx/12)%2?'#e8d8c0':p.light);
 sign(c,x+6,base-18,w-12,15,p,r,false,'NOODLE 24H');
}
function heroWater(c,x,p,r){
 const y=152;rect(c,x+42,y+44,20,163,p.near);pipe(c,[[x+46,y+67],[x+21,y+67],[x+21,y+130],[x+3,y+130]],p,4);
 ellipse(c,x+53,y+31,67,61,'#112a3b');ellipse(c,x+53,y+28,63,57,'#317785');ellipse(c,x+53,y+27,58,52,'#123f59');
 c.save();c.globalAlpha=.16;ellipse(c,x+42,y+10,44,34,p.accent);c.restore();for(let q=0;q<5;q++){c.save();c.strokeStyle=p.accent;c.globalAlpha=.27;c.lineWidth=1;c.beginPath();c.ellipse(x+53,y+28,16+q*10,54,0,0,Math.PI*2);c.stroke();c.restore();}rect(c,x-7,y+26,121,2,p.trim);rect(c,x-3,y+1,113,1,p.trim);rect(c,x+7,y+53,92,1,p.trim);
 for(let i=0;i<14;i++){let xx=x+ir(r,10,90),yy=y+ir(r,23,57);rect(c,xx,yy,ir(r,3,8),ir(r,2,5),r()>.5?p.accent:p.light);}sign(c,x+4,y+96,96,22,p,r,false,'NEREID');text(c,'DOCK 23',x+53,y+126,p.light,1,'center');
 // Tall gantry crane.
 line(c,x+141,112,x+141,314,p.trim,5);line(c,x+136,112,x+136,314,p.near,3);line(c,x+100,123,x+239,123,p.trim,4);line(c,x+140,104,x+213,122,p.accent,1);line(c,x+211,124,x+211,193,p.trim);rect(c,x+207,191,9,7,p.near);for(let yy=133;yy<295;yy+=15){line(c,x+133,yy,x+144,yy+10,p.trim);}glow(c,x+139,103,3,2,p.neon);
}
// Second landmarks for the Scrap Belt and Pelagic Dock fronts (see heroNeonB).
function heroScrapB(c,x,p,r,base=319){
 // A salvaged bow standing on end, turned into a lodging house.
 const top=base-207;poly(c,[[x,base],[x+18,top+38],[x+60,top],[x+102,top+38],[x+120,base]],'#5a3a2a');poly(c,[[x+10,base],[x+26,top+48],[x+60,top+16],[x+94,top+48],[x+110,base]],p.mid);
 for(let k=0;k<6;k++)for(let j=0;j<3;j++)rect(c,x+30+j*22,top+60+k*22,12,10,(k+j)%3?p.light+'bb':p.accent+'77');
 for(let k=0;k<4;k++)line(c,x+12,top+78+k*32,x+108,top+78+k*32,p.trim,2);sign(c,x+124,top+64,15,70,p,r,true,'船宿');sign(c,x+14,base-26,92,16,p,r,false,'BOW INN');
 line(c,x+60,top,x+60,top-32,p.trim,2);rect(c,x+56,top-34,8,4,p.neon);glow(c,x+54,top-36,12,6,p.neon,8);
}
function heroWaterB(c,x,p,r,base=319){
 // A tide-signal mast with a turning radar, a lit pilot office at its foot.
 line(c,x+60,90,x+60,base,p.trim,5);line(c,x+56,90,x+56,base,p.near,2);for(let yy=110;yy<base-20;yy+=18)line(c,x+48,yy,x+68,yy+12,p.trim);
 rect(c,x+30,84,60,8,p.trim);ellipse(c,x+60,78,26,5,p.near);rect(c,x+36,74,48,4,p.accent);glow(c,x+34,70,52,8,p.accent,10);
 for(let k=0;k<5;k++)rect(c,x+80,130+k*26,24,6,k%2?p.neon:p.light);
 rect(c,x+10,base-57,110,57,p.mid);rect(c,x+10,base-61,110,5,p.trim);for(let k=0;k<5;k++)rect(c,x+18+k*20,base-47,12,14,p.light+'bb');sign(c,x+14,base-23,102,16,p,r,false,'PILOT 12');
}
function heroRockB(c,x,p,r){
 // A mesa of carved balconies with a cage lift running up its face.
 boulder(c,x-30,450,230,280,p,r);for(let k=0;k<4;k++){const yy=210+k*46;rect(c,x+10+k*6,yy,120-k*12,26,'#241c22');rect(c,x+6+k*6,yy+26,128-k*12,4,p.trim);for(let j=0;j<3;j++)rect(c,x+20+k*6+j*34,yy+6,18,14,(k+j)%2?p.light+'cc':p.accent+'66');}
 line(c,x+210,150,x+210,450,p.trim,3);line(c,x+232,150,x+232,450,p.trim,3);rect(c,x+204,144,34,8,p.near);rect(c,x+208,300,26,30,p.near);rect(c,x+211,304,20,12,p.light+'aa');sign(c,x+242,200,16,60,p,r,true,'昇降');sign(c,x+20,176,90,16,p,r,false,'LIFT / 3');
}
function heroGardenB(c,x,p,r){
 // A conservatory of stacked glass domes, vines spilling from each tier.
 for(let k=0;k<3;k++){const w=150-k*36,xx=x+k*18,yy=370-k*70;rect(c,xx,yy-56,w,56,'#1f4a4499');dome(c,xx,yy-56,w,34,p,r,' ');for(let j=0;j<=4;j++)line(c,xx+j*w/4,yy-56,xx+j*w/4,yy,p.trim+'aa');for(let j=0;j<5;j++)gardenTree(c,xx+8+j*w/5,yy-4,22,r,p,j%2===0);}
 sign(c,x+160,250,16,56,p,r,true,'温室塔');sign(c,x+14,376,120,15,p,r,false,'LOTUS HALL');
}
function heroVoidB(c,x,p,r){
 // A receiving station: a big dish on a lattice mast.
 for(const dx of [20,70])line(c,x+dx,378,x+45,230,p.trim,3);for(let yy=250;yy<370;yy+=20)line(c,x+28,yy,x+62,yy+12,p.trim);
 ellipse(c,x+45,214,58,20,p.mid);ellipse(c,x+45,210,52,15,'#1a2240');line(c,x+45,210,x+45,170,p.trim,2);rect(c,x+41,166,8,6,p.accent);glow(c,x+39,164,12,8,p.accent,10);
 rect(c,x-10,340,110,38,p.mid);for(let k=0;k<4;k++)rect(c,x-2+k*26,350,16,12,p.light+'aa');sign(c,x+110,280,18,62,p,r,true,'受信所');
}
function heroDesert(c,x,p,r){
 industry(c,x,352,108,220,p,r);const tx=x+117;rect(c,tx,127,29,225,p.mid);rect(c,tx+5,113,19,16,p.trim);for(let yy=137;yy<342;yy+=22){rect(c,tx-5,yy,39,5,p.trim);for(let xx=tx;xx<tx+29;xx+=6)rect(c,xx,yy+3,2,7,p.near);}poly(c,[[tx,127],[tx+6,100],[tx+22,100],[tx+29,127]],p.near);rect(c,tx+4,97,21,4,p.neon);pipe(c,[[x+20,230],[x-21,230],[x-21,306],[tx+45,306],[tx+45,257]],p,6);sign(c,x-14,245,17,58,p,r,true,'赤砂');
 const bx=x+24,by=164;ellipse(c,bx,by,36,36,p.near);ellipse(c,bx,by,32,32,p.trim);ellipse(c,bx,by,27,27,'#302531');ellipse(c,bx,by,23,23,p.neon);ellipse(c,bx,by,17,17,'#352532');for(let i=0;i<8;i++){const a=i*Math.PI/4;line(c,bx+Math.cos(a)*7,by+Math.sin(a)*7,bx+Math.cos(a)*22,by+Math.sin(a)*22,p.light,2);}text(c,'SOL-41',bx,by+47,p.light,1,'center');
}
function heroGarden(c,x,p,r){
 // Terraces carry the trees, rather than a simple recolour of the neon city.
 for(let i=0;i<4;i++){let xx=x+i*9,yy=154+i*49,ww=121-i*7;rect(c,xx,yy,ww,44,p.mid);windowGrid(c,xx+5,yy+5,ww-10,35,p,r);rect(c,xx-10,yy-3,ww+20,6,p.trim);rect(c,xx-8,yy-2,ww+16,3,'#548369');for(let j=0;j<3;j++)gardenTree(c,xx+12+j*41,yy-5,ir(r,26,48),r,p,j%2===0);for(let j=0;j<14;j++){let vx=xx+r()*ww;rect(c,vx,yy+4,2,ir(r,7,22),'#41755b');rect(c,vx-2,yy+11,5,3,'#659971');}}
 sign(c,x+95,214,18,56,p,r,true,'庭園');line(c,x+7,148,x+112,148,p.light);text(c,'EDEN',x+55,333,p.light,1,'center');
}
function heroIvory(c,x,p,r){
 spire(c,x+12,362,78,258,p,r);spire(c,x+99,365,45,199,p,r);spire(c,x-37,365,34,176,p,r);const y=234;poly(c,[[x-49,y],[x+158,y],[x+149,y+12],[x-38,y+12]],p.trim);rect(c,x-34,y+12,183,5,p.mid);glow(c,x-35,y+2,186,2,p.light,8);
 c.save();c.strokeStyle=p.light;c.lineWidth=3;c.beginPath();c.arc(x+51,174,55,Math.PI*1.05,Math.PI*1.95);c.stroke();c.restore();line(c,x+51,72,x+51,92,p.light);text(c,'ASTERION',x+54,279,p.light,1,'center');
}
function heroScrap(c,x,p,r){
 const y=174;poly(c,[[x-40,y+38],[x+18,y-8],[x+142,y+9],[x+178,y+82],[x+121,y+129],[x-23,y+122]],p.mid);poly(c,[[x+12,y+2],[x+133,y+18],[x+161,y+73],[x+116,y+112],[x+3,y+105]],p.near);
 for(let i=0;i<7;i++){let xx=x+8+i*21;line(c,xx,y+5,xx-17,y+102,p.trim,2);}for(let i=0;i<4;i++){let yy=y+28+i*20;line(c,x-8,yy,x+147,yy,p.trim,2);}rect(c,x+24,y+42,57,34,'#101925');windowGrid(c,x+26,y+44,53,30,p,r,1,0);sign(c,x+87,y+44,54,16,p,r,false,'SCRAP');
 line(c,x+170,107,x+170,310,p.trim,5);line(c,x+110,120,x+201,120,p.trim,4);line(c,x+170,122,x+170,219,p.trim,2);rect(c,x+165,217,10,8,p.near);line(c,x+128,127,x+167,127,p.accent,1);sign(c,x-12,y+58,18,62,p,r,true,'回収');
 rect(c,x-28,y+129,214,6,p.trim);rect(c,x-26,y+135,210,4,p.near);
}
function heroRock(c,x,p,r){
 poly(c,[[x-55,366],[x-16,279],[x+32,233],[x+80,282],[x+143,196],[x+191,213],[x+205,366]],p.mid);poly(c,[[x-10,366],[x+37,258],[x+91,298],[x+151,224],[x+190,249],[x+205,366]],p.near);
 rect(c,x+16,276,44,70,'#1b222d');windowGrid(c,x+18,282,40,61,p,r);rect(c,x+112,229,38,83,'#161e2a');windowGrid(c,x+114,235,34,72,p,r);sign(c,x+8,312,48,14,p,r,false,'RIDGE');sign(c,x+104,287,17,59,p,r,true,'鉱区');
 line(c,x+24,244,x+153,208,p.trim,2);line(c,x+46,233,x+177,198,p.trim,1);for(let i=0;i<4;i++){let gx=x+38+i*26,gy=239-i*7;rect(c,gx,gy,8,6,p.near);glow(c,gx+7,gy+2,2,2,p.light,5);}line(c,x+178,140,x+178,208,p.trim,3);rect(c,x+174,140,8,9,p.near);glow(c,x+176,141,4,2,p.neon,4);
}
function heroVoid(c,x,p,r){
 rect(c,x+17,224,49,154,p.mid);rect(c,x+24,222,6,150,p.trim);rect(c,x+48,210,6,162,p.trim);for(let yy=235;yy<365;yy+=14){rect(c,x+30,yy,18,2,p.accent);rect(c,x+18,yy+5,8,3,p.neon);}pipe(c,[[x-30,365],[x-30,280],[x+85,280],[x+85,339]],p,5);sign(c,x-21,303,19,65,p,r,true,'深宇宙');rect(c,x-19,248,122,8,p.trim);rect(c,x-23,252,130,3,p.neon);text(c,'RELAY / 88',x+43,275,p.light,1,'center');
}
function createLayer(p,depth,width){
 if(['scrap','water','rock'].includes(p.kind))return specializedLayer(p,depth,width);
 const e=surface(TILE,HEIGHT),c=e.getContext('2d'),r=rand(p.seed+depth*177);c.imageSmoothingEnabled=false;
 if(depth===0){
  if(p.kind==='neon'){
   const pp={...p,mid:'#221b31',near:'#1d192b',trim:'#39293c'};
   for(let k=0;k<5;k++){const xx=[-18,width*.07,width*.55,width*.92,1640][k];tower(c,xx,416,ir(r,35,68),ir(r,345,470),pp,r,0);}
  }
  for(let x=0;x<TILE;){const w=ir(r,12,42),h=ir(r,48,p.kind==='neon'?282:190),base=p.kind==='water'?336:400;const pp={...p,mid:p.far,near:p.far,trim:p.far};tower(c,x,base,w,h,pp,r,0);x+=w+ir(r,p.kind==='void'?40:2,p.kind==='void'?100:13);}
  const haze=c.createLinearGradient(0,170,0,450);haze.addColorStop(0,p.haze+'00');haze.addColorStop(1,p.haze+'40');c.fillStyle=haze;c.fillRect(0,170,TILE,280);return e;
 }
 if(depth===1){
  let x=-4;
  while(x<TILE){const w=ir(r,26,68),h=ir(r,85,p.kind==='neon'?321:237),base=405+ir(r,-8,15);
   if(p.kind==='ivory')spire(c,x,base,w,h,p,r);
   else if(p.kind==='desert'||p.kind==='rock')industry(c,x,base,w,h*.83,p,r);
   else if(p.kind==='water'){if(r()>.55)dome(c,x,base,w,h*.65,p,r);else tower(c,x,base,w,h*.85,p,r);}
   else if(p.kind==='garden'){tower(c,x,base,w,h*.85,p,r);if(r()>.25)gardenTree(c,x+w*.5,base-h*.85,30,r,p);}
   else tower(c,x,base,w,h,p,r);
   x+=w+ir(r,p.kind==='void'?40:12,p.kind==='void'?115:63);
  }
  // One carefully composed landmark in every strip, plus a second far away.
  const heroX=width<420?Math.max(65,width*.31):width*.27;
  const heroes={neon:heroNeon,scrap:heroScrap,water:heroWater,rock:heroRock,garden:heroGarden,ivory:heroIvory,void:heroVoid,desert:heroDesert};
  const second={neon:heroNeonB,garden:heroGardenB,void:heroVoidB}[p.kind]||heroes[p.kind];
  heroes[p.kind](c,heroX,p,r);second(c,heroX+1180,p,r);
  c.globalAlpha=.05;rect(c,0,0,TILE,HEIGHT,p.haze);c.globalAlpha=1;return e;
 }
 if(depth===2){
  for(let x=-47;x<TILE;){let w=ir(r,63,120),h=ir(r,50,148),base=459;
   const pp={...p,mid:p.near,near:'#0c1622',trim:p.trim};
   if(p.kind==='neon'||p.kind==='garden')pagoda(c,x,base,w,h,pp,r,p.kind==='garden');
   else if(p.kind==='water')dome(c,x,base,w,h*.8,pp,r);
   else if(p.kind==='desert'||p.kind==='rock')industry(c,x,base,w,h,pp,r);
   else if(p.kind==='ivory')spire(c,x,base,w,h,pp,r);
   else {tower(c,x,base,w,h,pp,r);ellipse(c,x+w*.5,base-h-6,w*.28,8,p.trim);line(c,x+w*.5,base-h-6,x+w*.5+10,base-h-24,p.accent);}
   if(p.kind==='garden'){gardenTree(c,x+w*.25,base-h-4,46,r,p,true);for(let k=0;k<10;k++){let vx=x+r()*w,vy=base-h+12;rect(c,vx,vy,2,ir(r,10,50),'#396658');}}
   x+=w+ir(r,46,139);
  }
  if(p.kind==='neon'){
   const pp={...p,mid:'#291f2b',near:'#101b23',trim:'#5a4952'};
   pagoda(c,-61,462,157,233,pp,r);pagoda(c,width+46,460,145,208,pp,r);
   pagoda(c,1100,465,161,211,pp,r);
   // Water tanks, aerials and a few plants break up the roof line.
   for(const xx of [11,width+94,1168]){
    rect(c,xx,209,20,20,'#272d35');ellipse(c,xx+10,209,10,3,'#565359');rect(c,xx+2,211,3,17,'#635455');rect(c,xx-2,220,24,2,'#161b27');line(c,xx-4,230,xx-4,250,p.trim,2);line(c,xx+22,230,xx+22,250,p.trim,2);line(c,xx+28,234,xx+28,202,p.trim);line(c,xx+19,206,xx+38,206,p.trim);line(c,xx+22,211,xx+35,211,p.trim);
   }
   // Sidewalk lanterns and a cyan pharmacy sign.
   sign(c,69,304,18,73,p,r,true,'夜の市');
   for(let i=0;i<4;i++){let lx=14+i*18;line(c,lx,369,lx,377,p.trim);ellipse(c,lx,383,4,6,p.neon);rect(c,lx-2,378,1,9,p.light);rect(c,lx-3,387,6,2,p.near);}
   gardenTree(c,-12,249,64,r,{...p,kind:'garden'});gardenTree(c,width+147,270,75,r,{...p,kind:'garden'});
  }
  // Hanging wires, rare rather than a moving picket fence.
  for(let k=0;k<4;k++){let xx=185+k*545,yy=296+ir(r,-25,40);c.strokeStyle='#0c1523';c.lineWidth=1;c.beginPath();c.moveTo(xx,yy);c.quadraticCurveTo(xx+125,yy+52,xx+246,yy-10);c.stroke();c.beginPath();c.moveTo(xx,yy+4);c.quadraticCurveTo(xx+125,yy+58,xx+246,yy-6);c.stroke();}
  return e;
 }
 return e;
}
// Planets painted by another module register here (frontier-scenes.js), so
// this module never imports them: {sky,layer,life} for the station district.
export const PAINTERS={};
export function makeScene(index,width){
 const p=worlds[index],r=rand(p.seed+149),custom=PAINTERS[p.kind],station={...p,district:0};
 const s={p,index,width,heroX:width<420?Math.max(65,width*.31):width*.27,sky:custom?custom.sky(station,width):drawSky(p,width),layers:[],traffic:[],particles:[],beacons:[],station:null};
 for(let d=0;d<3;d++)s.layers.push(custom?custom.layer(station,d,width):createLayer(p,d,width));
 for(let i=0;i<12;i++)s.traffic.push({x:r()*2000,y:105+r()*190,speed:(10+r()*19)*(i%2?1:-1),size:r()>.65?1.1:.65,phase:r()*50});
 for(let i=0;i<180;i++)s.particles.push({x:r()*1500,y:r()*HEIGHT,z:.3+r()*.8,phase:r()*Math.PI*2});
 return s;
}
export function drawStrip(c,e,offset,width){const x=-mod(Math.floor(offset),TILE);for(let q=x;q<width;q+=TILE)c.drawImage(e,q,0);}
// Landforms are cached by world seed. The visit only changes ambient activity.
export function boulder(c,x,base,w,h,p,r,detail=true){
 const pts=[[x,base],[x+w*.07,base-h*.62],[x+w*.22,base-h*.86],[x+w*.45,base-h],[x+w*.69,base-h*.95],[x+w*.92,base-h*.45],[x+w,base]];
 poly(c,pts,p.mid);poly(c,[[x+w*.45,base-h],[x+w*.69,base-h*.95],[x+w*.92,base-h*.45],[x+w,base],[x+w*.53,base],[x+w*.61,base-h*.48]],p.near);
 line(c,x+w*.22,base-h*.86,x+w*.45,base-h,p.trim,1);
 if(detail){c.save();c.beginPath();pts.forEach((a,i)=>i?c.lineTo(...a):c.moveTo(...a));c.closePath();c.clip();
 for(let j=0;j<16;j++){const yy=base-h+j*h/16;line(c,x,yy,x+w,yy+Math.sin(j*1.3)*9,p.trim+'66');}
 for(let j=0;j<60;j++)rect(c,x+r()*w,base-r()*h,1+r()*9,1+r()*2,r()>.6?p.trim+'55':p.near+'66');
 c.restore();}
}
export function wreck(c,x,y,w,h,p,r,inhabited=false,label='HULL CAFE'){
 poly(c,[[x,y+h*.3],[x+w*.17,y],[x+w*.82,y+7],[x+w,y+h*.56],[x+w*.87,y+h],[x+w*.14,y+h*.92]],p.mid);
 poly(c,[[x+w*.14,y+h*.54],[x+w*.9,y+h*.58],[x+w*.87,y+h],[x+w*.14,y+h*.92]],p.near);
 for(let k=0;k<8;k++){let xx=x+w*.16+k*w*.085;line(c,xx,y+5,xx-12,y+h*.92,p.trim,2);}
 line(c,x+w*.18,y+2,x+w*.8,y+8,p.trim,2);
 ellipse(c,x+w*.82,y+h*.48,h*.28,h*.28,p.near);ellipse(c,x+w*.82,y+h*.48,h*.20,h*.20,p.trim);ellipse(c,x+w*.82,y+h*.48,h*.14,h*.14,p.near);
 for(let k=0;k<9;k++)rect(c,x+r()*w,y+r()*h,ir(r,2,14),2,p.trim+'55');
 if(inhabited){
  c.save();c.beginPath();c.moveTo(x+w*.18,y+9);c.lineTo(x+w*.76,y+12);c.lineTo(x+w*.69,y+h*.87);c.lineTo(x+w*.12,y+h*.87);c.closePath();c.clip();
  for(let j=0;j<80;j++){let px=x+w*.14+r()*w*.61,py=y+7+r()*h*.78;rect(c,px,py,3+r()*13,1+r()*3,r()>.5?'#88736744':'#a3b6bc22');}
  for(let j=0;j<12;j++){let px=x+w*.18+j*w*.043;rect(c,px,y+12,2,2,p.trim);rect(c,px-10,y+h*.83,2,2,p.trim);}
  c.restore();
  for(let k=0;k<4;k++){const xx=x+w*.2+k*25;rect(c,xx,y+h*.36,16,17,'#080f19');rect(c,xx+2,y+h*.36+2,12,12,k%2?p.light:p.accent);rect(c,xx+7,y+h*.36,2,17,p.mid);}
  rect(c,x+w*.14,y+h*.73,w*.52,7,p.trim);sign(c,x+w*.2,y+h*.73-17,76,15,p,r,false,label);
  for(let k=0;k<3;k++)crate(c,x+w*.17+k*18,y+h-13,14,12,p);
 }
}
function specializedLayer(p,depth,width){
 const e=surface(TILE,HEIGHT),c=e.getContext('2d'),r=rand(p.seed+depth*177),hx=width<420?Math.max(65,width*.31):width*.27;
 if(p.kind==='scrap'){
  if(depth===0){
   const pp={...p,mid:p.far,near:'#242631',trim:'#53505a'};
   for(let x=-100;x<TILE;x+=310){wreck(c,x,238+r()*39,280+r()*90,78+r()*70,pp,r);line(c,x+160,214,x+160,355,pp.trim,3);line(c,x+130,231,x+240,231,pp.trim,2);}
  }else if(depth===1){
   for(let x=-190,k=0;x<TILE;x+=470,k++){wreck(c,x,302+ir(r,-12,5),235,79,p,r,true,['WELD','PARTS','BUNK','TOOLS','NOODLE','RADIO'][k%6]);for(let k=0;k<5;k++)crate(c,x+25+k*28,398-18-(k%2)*14,26,17,p);}
   // The second landmark is a different building, so wide windows do not show the cafe twice.
   for(const [i,h] of [hx,hx+1180].entries()){
    if(i){rect(c,h-40,354,200,6,p.trim);rect(c,h-40,360,200,2,p.near);heroScrapB(c,h,p,r,354);continue;}
    wreck(c,h-78,201,309,153,p,r,true);rect(c,h-82,354,325,6,p.trim);rect(c,h-82,360,325,2,p.near);
    // Broken arc of an old engine behind the salvagers' walkway.
    c.strokeStyle=p.trim;c.lineWidth=5;c.beginPath();c.arc(h+80,245,78,Math.PI*1.13,Math.PI*1.87);c.stroke();
    line(c,h+226,144,h+226,354,p.trim,5);line(c,h+145,161,h+300,161,p.trim,4);line(c,h+225,146,h+289,161,p.accent,1);
    for(let yy=174;yy<350;yy+=17)line(c,h+221,yy,h+230,yy+12,p.trim);
    sign(c,h-74,268,16,62,p,r,true,'船底食堂');
   }
  }else{
   for(let x=-80;x<TILE;x+=360){poly(c,[[x,450],[x+20,416],[x+56,433],[x+80,385],[x+105,392],[x+128,421],[x+186,429],[x+222,450]],p.near);wreck(c,x+5,418,80,38,{...p,mid:p.near,near:'#0a1520'},r);line(c,x+12,417,x+64,436,p.trim+'88');}
   rect(c,0,438,TILE,4,p.near);line(c,0,438,TILE,438,p.trim);
  }
 }else if(p.kind==='water'){
  if(depth===0){
   for(let x=70;x<TILE;x+=520){rect(c,x-15,281,200,6,p.far);for(let k=0;k<5;k++){const xx=x+k*32,hh=18+r()*22;rect(c,xx,282-hh,27,hh,'#164653');ellipse(c,xx+13,282-hh,13,10,'#256274');c.save();c.globalAlpha=.25;for(let z=0;z<3;z++)rect(c,xx+5+z*7,279-hh,2,hh-4,p.accent);c.restore();}}
  }else if(depth===1){
   for(const [i,h] of [hx,hx+1180].entries()){
    if(i){rect(c,h-60,324,240,10,p.trim);rect(c,h-58,331,236,5,p.near);for(let k=0;k<4;k++)rect(c,h-40+k*62,336,6,37,p.near);heroWaterB(c,h,p,r,324);continue;}
    // Floating habitat and a recognizable striped lighthouse.
    rect(c,h-90,324,309,10,p.trim);rect(c,h-88,331,305,5,p.near);
    for(let k=0;k<5;k++){rect(c,h-60+k*58,336,6,37,p.near);rect(c,h-62+k*58,362,10,3,p.trim);}
    dome(c,h-75,323,94,70,p,r);dome(c,h+24,323,59,47,p,r);
    rect(c,h+118,222,23,103,p.mid);rect(c,h+123,222,12,103,p.trim);for(let yy=232;yy<318;yy+=20)rect(c,h+118,yy,23,5,p.near);
    rect(c,h+112,219,35,4,p.trim);rect(c,h+115,201,29,18,p.near);rect(c,h+119,204,21,10,p.light);rect(c,h+125,201,2,18,p.trim);
    poly(c,[[h+110,201],[h+129,189],[h+150,201]],p.mid);sign(c,h-24,298,78,15,p,r,false,'PIER / 03');
    line(c,h+170,272,h+170,323,p.trim,3);line(c,h+165,274,h+202,274,p.trim,2);
   }
  }else{
   // Lots of open water, with only occasional near buoys and service platforms.
   for(let x=110;x<TILE;x+=580){rect(c,x,404,3,21,p.trim);ellipse(c,x+1,425,9,3,p.near);rect(c,x-2,401,7,3,p.neon);}
   rect(c,0,444,TILE,3,p.near);line(c,0,443,TILE,443,p.trim+'66');
  }
 }else if(p.kind==='rock'){
  if(depth===0){
   for(let x=-120;x<TILE;x+=180){const pp={...p,mid:'#5d4850',near:'#3d3743',trim:'#82665f'};boulder(c,x,410,ir(r,140,250),ir(r,180,320),pp,r,false);}
  }else if(depth===1){
   for(let x=-80;x<TILE;x+=450)boulder(c,x,450,170,ir(r,180,255),p,r);
   for(const [i,h] of [hx,hx+1180].entries()){
    if(i){heroRockB(c,h,p,r);continue;}
    boulder(c,h-53,450,243,311,p,r);boulder(c,h+345,450,91,275,p,r);
    for(let k=0;k<3;k++){const xx=h-12+k*48,yy=278+(k%2)*28;rect(c,xx,yy,39,41,p.near);rect(c,xx-4,yy-3,48,4,p.trim);windowGrid(c,xx+2,yy+3,35,35,p,r);rect(c,xx-4,yy+41,48,4,p.trim);}
    sign(c,h+20,275,65,14,p,r,false,'RIDGE / 41');
    rect(c,h-17,347,257,5,p.trim);rect(c,h-14,352,250,3,p.near);for(let k=0;k<5;k++){line(c,h+2+k*45,354,h+16+k*45,374,p.trim,2);line(c,h+2+k*45,347,h+2+k*45,337,p.trim,1);}line(c,h-15,337,h+237,337,p.trim+'88');
    line(c,h+201,208,h+201,394,p.trim,2);line(c,h+225,208,h+225,394,p.trim,2);rect(c,h+197,200,32,8,p.near);
    for(let yy=218;yy<393;yy+=17)line(c,h+202,yy,h+224,yy+14,p.trim+'55');
    line(c,h+148,152,h+394,171,p.trim,2);line(c,h+148,156,h+394,175,p.trim+'88');
    rect(c,h+137,146,6,107,p.trim);rect(c,h+393,164,6,107,p.trim);
   }
  }else{
   for(let x=-100;x<TILE;x+=540)boulder(c,x,475,146,ir(r,75,160),{...p,mid:'#222631',near:'#111b27',trim:'#574851'},r);
   line(c,0,438,TILE,438,p.trim+'55');rect(c,0,440,TILE,4,p.near);
  }
 }
 return e;
}
export function waterSurface(c,s,t,travel,width,v){
 const p=s.p,top=p.kind==='water'?273:350,depth=HEIGHT-top;
 gradient(c,0,top,width,depth,p.kind==='water'?['#125365','#104457','#071e35']:[p.mid,p.near,p.sky[0]]);
 const r=rand(p.seed+24);c.save();
 for(let i=0;i<210;i++){const y=top+5+r()*(depth-6),len=(y-top+2)*.14+r()*20,x=mod(r()*width+Math.sin(t*.3+i)*5-travel*.4,width);c.globalAlpha=(.06+r()*.16)*(v.variant===1?.6:1);rect(c,x,y,len,1,i%4?p.accent:p.light);}
 // Broad, moving fragments of moonlight rather than a still repeated texture.
 for(let j=0;j<47;j++){let y=top+5+j*(depth-12)/47,spread=7+j*1.5,xx=width*.73+Math.sin(j*1.5+t*.55)*spread;c.globalAlpha=.12*(1-j/56);rect(c,xx,y,8+j*.9,1,p.light);}
 c.restore();
}
export function worldLife(c,s,time,travel,width,v,low){
 const p=s.p,t=lifeClock(v,time);
 if(PAINTERS[p.kind]){PAINTERS[p.kind].life(c,s,t,travel,width,low);return;}
 scenePositions(s,travel,width,x=>{
  if(p.kind==='neon'){
   if(v.variant===1){c.save();c.globalAlpha=.28;rect(c,x,57,72,208,'#101423');c.restore();}
   // A narrow, inhabited terrace alongside the familiar advertisement.
   rect(c,x+140,331,129,5,p.trim);rect(c,x+141,336,125,4,p.near);rect(c,x+147,305,42,25,p.near);rect(c,x+148,302,49,5,p.neon);text(c,'SOUP',x+152,313,p.light,1);
   person(c,x+170,330,t,p,{action:'work',coat:'#b59d83'});steam(c,x+184,315,t,p);
   rotatingFan(c,x+231,318,8,t,p);cat(c,x+220,331,t,p);
   if(!low){const d=shuttling(t+15,34);person(c,x+198+d.f*37,331,t,p,{dir:d.dir,walk:d.u<.45||d.u>.55,coat:'#628285'});}
   const d=shuttling(t,48);drone(c,x+31+d.f*95,139+d.f*30,t,p,false);
   if(d.f>.91){c.save();c.globalAlpha=.16;poly(c,[[x+128,169],[x+85,184],[x+85,154]],p.accent);c.restore();}
  }else if(p.kind==='scrap'){
   workCrane(c,x+242,165,t,p);
   person(c,x+178,354,t,p,{hat:true,action:'work',coat:'#a78d73'});
   const weld=mod(t,12);if(weld<5){glow(c,x+187,342,2,2,p.accent,6);if(!low)for(let k=0;k<5;k++){let a=mod(t*.9+k*.2,1);rect(c,x+189+a*13,343+a*a*9,1,1,p.light);}}
   steam(c,x-7,299,t,p);rotatingFan(c,x+45,236,10,t,p);
   if(!low){const a=shuttling(t+14,27);person(c,x-49+a.f*84,354,t,p,{hat:true,walk:true,carry:a.dir>0,dir:a.dir});}
  }else if(p.kind==='water'){
   const a=shuttling(t,30),ny=309+a.f*25;line(c,x+195,275,x+195,ny,p.trim);poly(c,[[x+184,ny],[x+206,ny],[x+202,ny+15],[x+188,ny+15]],'#54837c88');for(let k=0;k<5;k++)line(c,x+185+k*4,ny,x+189+k*2.8,ny+14,p.accent+'55');
   person(c,x+161,323,t,p,{hat:true,action:'work',coat:'#799696'});
   c.save();c.globalAlpha=.06;const a2=Math.sin(t*.13);poly(c,[[x+129,207],[x+129+a2*330,168],[x+129+a2*340,242]],p.light);c.restore();
   if(!low)shipBoat(c,x-118+Math.sin(t*.08)*29,351,t,p,.65);
  }else if(p.kind==='rock'){
   const a=shuttling(t,42),gy=209+a.f*161;rect(c,x+197,gy,32,3,p.trim);rect(c,x+200,gy+3,26,20,p.near);rect(c,x+202,gy+5,22,13,p.accent+'66');crate(c,x+204,gy+9,12,11,p);line(c,x+213,207,x+213,gy,p.trim);
   const g=shuttling(t+11,49),gx=x+151+g.f*241,yy=152+g.f*19;line(c,gx,yy,gx,yy+17,p.trim);rect(c,gx-11,yy+17,23,14,p.near);rect(c,gx-9,yy+19,18,6,p.light);rect(c,gx-8,yy+26,16,3,p.trim);
   person(c,x+130,347,t,p,{hat:true,action:'read',coat:'#aa8b68'});
   if(!low){steam(c,x+60,300,t,{...p,light:'#b6a199'},4);}
  }else if(p.kind==='garden'){
   const y=351;rect(c,x+122,y,123,5,p.trim);rect(c,x+125,y-3,118,3,'#54715e');
   for(let k=0;k<4;k++){rect(c,x+135+k*27,y-9,11,7,'#8a6660');rect(c,x+138+k*27,y-16,5,8,'#7cba8a');rect(c,x+133+k*27,y-14,14,3,'#548568');}
   const a=shuttling(t,36);person(c,x+129+a.f*77,y,t,p,{walk:a.f<.88,action:a.f>.88?'work':'idle',dir:a.dir,coat:'#8b9b80'});
   if(mod(t,24)<13&&!low){const sx=x+230;for(let k=0;k<15;k++){const f=mod(t*.4+k/15,1);rect(c,sx-f*73,y-23-29*Math.sin(f*Math.PI)+f*20,1,2,p.accent+'99');}}
   rotatingFan(c,x+140,309,9,t*.7,p);cat(c,x+247,y,t,p);
  }else if(p.kind==='void'){
   const a=shuttling(t,39),dx=x+118+a.f*33,dy=248-a.f*86;
   drone(c,dx,dy,t,p);if(a.f>.87){c.save();c.globalAlpha=.12;poly(c,[[dx-10,dy],[x+88,dy-18],[x+88,dy+17]],p.accent);c.restore();}
   rect(c,x+106,276,39,7,p.trim);rect(c,x+110,277,31,2,p.accent);robot(c,x-4,378,t,p,.7);
  }
 });
 if(p.kind==='scrap'&&!low){
  const u=mod(t,77);if(u<48){const x=width+160-u*(width+340)/48,y=105+Math.sin(t*.2)*3;drone(c,x,y,t,p);line(c,x+18,y,x+58,y+7,p.trim);wreck(c,x+58,y-3,62,27,p,rand(808));}
 }
 if(p.kind==='water'){
  const u=mod(t,86);if(u<43){const x=width+160-u*(width+410)/43,y=378;c.save();c.globalAlpha=.24;poly(c,[[x-138,y],[x-89,y-17],[x+8,y-22],[x+72,y-7],[x+96,y-18],[x+89,y+6],[x+62,y+19],[x+8,y+16],[x-70,y+12]],'#021d31');c.restore();}
  const x=mod(t*7+width*.3,width+170)-85;shipBoat(c,x,347,t,p,.65);
  if(!low)shipBoat(c,mod(width*.8-t*4,width+210)-105,390,t+4,p,.86);
 }
}
