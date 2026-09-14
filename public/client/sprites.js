// Animated actors and vehicles. Pure painters: everything needed comes in as
// arguments, so the same drawing serves the live scene and cached thumbnails.
import {rect,poly,line,ellipse,glow} from './pixel.js';
import {mod,ease as smooth} from './anim-utils.js';
export function person(c,x,y,t,p,opts={}){
 // A 9 x 25 pixel sprite; foot position is the anchor, not the head.
 const {dir=1,walk=false,carry=false,hat=false,coat=p.trim,action='idle',scale=1}=opts;
 const step=walk?Math.sin(t*7):0,bob=walk?Math.abs(step)*.6:Math.sin(t*.9)*.25;
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(dir*scale,scale);
 c.globalAlpha=.24;ellipse(c,0,1,6,1.7,'#01080d');c.globalAlpha=1;
 line(c,-2,-8,-2-step*2.8,0,'#151d29',3);line(c,2,-8,2+step*2.8,0,'#202838',3);
 rect(c,-4,-17-bob,8,11,coat);rect(c,-3,-18-bob,6,2,coat);rect(c,-2,-23-bob,5,5,'#c9a994');rect(c,-3,-24-bob,7,2,'#27303a');
 if(hat){rect(c,-4,-25-bob,8,4,p.light);rect(c,-5,-22-bob,11,1,p.light);}
 if(action==='read'){line(c,2,-16,6,-12,coat,2);rect(c,4,-15,7,7,'#aec9c9');rect(c,5,-14,4,1,'#476673');}
 else if(action==='drink'){const lift=(Math.sin(t*.65)>.25?4:0);line(c,2,-16,7,-13-lift,coat,2);rect(c,6,-16-lift,3,4,p.light);}
 else if(action==='work'){line(c,3,-16,8,-14+Math.sin(t*2)*2,coat,2);rect(c,8,-14+Math.sin(t*2)*2,2,1,p.light);}
 else if(carry){line(c,-3,-16,7,-12,coat,2);crate(c,4,-16,10,9,p);}
 else{line(c,3,-16,4-step*2,-10,coat,2);line(c,-3,-16,-3+step*2,-10,coat,2);}
 c.restore();
}
export function crate(c,x,y,w,h,p){rect(c,x,y,w,h,p.trim);rect(c,x+1,y+1,w-2,h-2,p.mid);rect(c,x+2,y+2,Math.max(1,w-4),1,p.light+'88');line(c,x+w*.5,y+1,x+w*.5,y+h-1,p.trim);rect(c,x+2,y+h-3,3,1,p.accent);}
export function steam(c,x,y,t,p,n=5){
 c.save();for(let i=0;i<n;i++){const a=mod(t*.5+i/n,1),dx=Math.sin(t*.8+i*1.7)*3;c.globalAlpha=(1-a)*.2;rect(c,x+dx-a*4,y-a*27,3+a*9,2+a*3,p.light);}c.restore();
}
export function cat(c,x,y,t,p){
 rect(c,x-6,y-5,12,5,'#a78d80');rect(c,x+3,y-8,6,6,'#bda698');poly(c,[[x+3,y-7],[x+3,y-11],[x+6,y-8]],'#bda698');poly(c,[[x+6,y-8],[x+9,y-10],[x+9,y-6]],'#bda698');
 if(mod(t,7)<6.6){rect(c,x+5,y-6,1,1,p.accent);rect(c,x+8,y-6,1,1,p.accent);}
 line(c,x-5,y-2,x-10,y-4+Math.sin(t*.7)*2,'#a78d80',2);
}
export function robot(c,x,y,t,p,scale=1){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);
 ellipse(c,0,0,9,2,'#07131c');rect(c,-8,-11,16,9,p.trim);rect(c,-5,-15,10,5,p.mid);rect(c,-4,-14,8,3,p.accent);rect(c,-10,-4,3,4,p.near);rect(c,7,-4,3,4,p.near);rect(c,-5,-7,10,2,p.near);
 line(c,-10,-2,-13,-1+Math.sin(t*4)*1,p.trim,1);line(c,10,-2,13,-1-Math.sin(t*4)*1,p.trim,1);c.restore();
}
export function drone(c,x,y,t,p,cargo=false){
 const yy=y+Math.sin(t*1.8)*2;c.save();c.translate(Math.round(x),Math.round(yy));
 rect(c,-10,-3,20,7,p.near);rect(c,-6,-5,12,5,p.trim);rect(c,-3,-4,6,2,p.accent);line(c,-17,0,17,0,p.trim,2);rect(c,-19,-2,7,1,p.light);rect(c,12,-2,7,1,p.light);
 if(cargo){line(c,-5,4,-5,11,p.trim);line(c,5,4,5,11,p.trim);crate(c,-7,11,14,10,p);}c.restore();
}
export function rotatingFan(c,x,y,r,t,p){
 ellipse(c,x,y,r+2,r+2,p.near);ellipse(c,x,y,r,r,p.trim);ellipse(c,x,y,r-1,r-1,p.mid);
 for(let k=0;k<3;k++){const a=t*.7+k*Math.PI*2/3;line(c,x+Math.cos(a)*2,y+Math.sin(a)*2,x+Math.cos(a+.3)*(r-2),y+Math.sin(a+.3)*(r-2),p.trim,3);}rect(c,x-1,y-1,3,3,p.light);
}
export function drawHovercraft(c,x,y,s,p,direction,time){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(s*(direction<0?-1:1),s);rect(c,-9,0,20,3,p.near);poly(c,[[-14,3],[-9,-1],[0,-4],[8,-3],[16,3]],'#131e2e');rect(c,-2,-3,8,2,p.accent);rect(c,-12,3,30,2,p.trim);glow(c,14,1,3,1,p.light,5);glow(c,-14,3,3,2,p.neon,5);c.globalAlpha=.23;rect(c,-27,4,13,1,p.neon);c.restore();
}
export function drawTrain(c,x,y,p,time,scale=1){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);
 for(let k=0;k<4;k++){let xx=k*76;rect(c,xx,0,71,22,'#102330');rect(c,xx+3,-2,64,3,p.trim);rect(c,xx,20,71,4,p.near);rect(c,xx,17,71,2,p.neon);for(let j=0;j<4;j++){let wx=xx+6+j*15;rect(c,wx,4,12,9,p.accent);rect(c,wx+1,4,3,7,'#d2ffed');poly(c,[[wx+5,4],[wx+10,4],[wx+2,11],[wx,11]],'#e0fff580');}rect(c,xx+67,1,3,18,p.trim);rect(c,xx+71,9,5,11,'#081321');rect(c,xx+8,24,8,3,p.near);rect(c,xx+52,24,8,3,p.near);}
 glow(c,-2,14,3,2,p.light,8);c.restore();
}
export function drawElevatedRail(c,s,time,travel,width){
 const p=s.p,y=387;
 c.save();c.globalAlpha=.74;rect(c,0,y+23,width,5,p.near);rect(c,0,y+25,width,1,p.trim);rect(c,0,y+33,width,3,p.near);
 let of=mod(travel*15,156);for(let x=-of;x<width;x+=156){rect(c,x,y+35,9,HEIGHT-y,p.near);line(c,x+9,y+37,x+42,y+55,p.near,4);rect(c,x-2,y+33,13,3,p.trim);}c.restore();
 const tx=mod(220+time*26-travel*6,width+520)-365;drawTrain(c,tx,y-1,p,time,.83);
}
export function drawRelayRing(c,x,y,r,p,t){
 c.save();c.translate(Math.round(x),Math.round(y));c.strokeStyle=p.trim;c.lineWidth=7;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.stroke();c.lineWidth=2;c.strokeStyle=p.neon;c.shadowBlur=10;c.shadowColor=p.neon;c.beginPath();c.arc(0,0,r-4,0,Math.PI*2);c.stroke();c.shadowBlur=0;c.lineWidth=1;c.strokeStyle=p.accent;c.beginPath();c.arc(0,0,r+6,0,Math.PI*2);c.stroke();
 for(let i=0;i<12;i++){const a=i*Math.PI/6+t*.023;const xx=Math.cos(a)*r,yy=Math.sin(a)*r;c.save();c.translate(xx,yy);c.rotate(a);rect(c,-8,-4,16,8,p.near);rect(c,-5,-3,6,6,p.light);c.restore();}c.globalAlpha=.25;line(c,-r*.7,0,r*.7,0,p.neon);line(c,0,-r*.7,0,r*.7,p.neon);ellipse(c,0,0,8,8,p.accent);c.restore();
}
export function drawRay(c,x,y,scale,t,p){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);c.globalAlpha=.36;const wing=Math.sin(t*.7)*5;poly(c,[[-39,wing-9],[-23,4],[-7,8],[0,0],[7,8],[23,4],[39,wing-9],[22,15],[8,15],[0,9],[-8,15],[-22,15]],p.accent);line(c,0,8,4,32,p.accent);line(c,4,32,1,42,p.accent);c.globalAlpha=.8;rect(c,-3,3,2,1,p.light);rect(c,3,3,2,1,p.light);c.restore();
}
export function workCrane(c,x,y,t,p){
 // Lower -> grip -> lift -> translate -> lower -> release -> return.
 const u=mod(t,32),from=x-50,to=x+35;let cx=from,cy=y+50,loaded=false;
 if(u<4){cy=y+50+smooth(u/4)*61;}
 else if(u<7){cy=y+111;loaded=u>5;}
 else if(u<12){cy=y+111-smooth((u-7)/5)*80;loaded=true;}
 else if(u<18){cx=from+(to-from)*smooth((u-12)/6);cy=y+31;loaded=true;}
 else if(u<22){cx=to;cy=y+31+smooth((u-18)/4)*80;loaded=true;}
 else if(u<25){cx=to;cy=y+111;loaded=u<23;}
 else{cx=to+(from-to)*smooth((u-25)/7);cy=y+111-smooth((u-25)/7)*61;}
 rect(c,cx-5,y-2,10,5,p.near);line(c,cx,y+3,cx,cy,p.trim);line(c,cx-3,cy,cx,cy+4,p.light);line(c,cx,cy+4,cx+3,cy,p.light);
 if(loaded)crate(c,cx-10,cy+5,21,17,p);
 if(u<=5)crate(c,from-10,y+116,21,17,p);
 if(u>=23)crate(c,to-10,y+116,21,17,p);
}
export function shipBoat(c,x,y,t,p,scale=1){
 c.save();c.translate(Math.round(x),Math.round(y+Math.sin(t*.7)*1.2));c.scale(scale,scale);
 c.globalAlpha=.25;rect(c,-30,12,69,1,p.accent);c.globalAlpha=1;
 poly(c,[[-26,2],[28,2],[19,12],[-19,12]],p.near);rect(c,-8,-12,21,14,p.trim);rect(c,-5,-10,14,6,p.accent);rect(c,-11,-14,28,3,p.near);line(c,0,-15,0,-29,p.trim);rect(c,1,-27,11,5,p.neon);glow(c,24,1,2,2,p.light,3);c.restore();
}
