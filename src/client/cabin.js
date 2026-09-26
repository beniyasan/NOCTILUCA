// The carriage around the view: an old wood-panelled commuter car with long
// seats. The scene canvas is placed inside the window band this layer leaves
// open; everything here is static and redrawn only when the layout changes.
const TOP=26,BOTTOM=42,SIDE=5,MULLION=8;
const Q={wall:'#6b4428',wallHi:'#85573a',wallLo:'#4a2e1c',wood:'#7a4e2e',woodHi:'#9a6a42',woodLo:'#3e2616',sash:'#2a180c',
 ceil:'#8a7e66',ceilLine:'#7a6f58',metal:'#8c9290',metalLo:'#5a605f',seat:'#2f4466',seatHi:'#40587e',seatLo:'#223350',tape:'#8e8a70',
 paper:'#e6dcc0',paperLo:'#cbbd98',ink:'#6b6250',bulb:'#ffe2a0',shade:'#e8e2cc'};

export function createCabin(host){
 const canvas=document.createElement('canvas');canvas.className='cabin';canvas.setAttribute('aria-hidden','true');
 host.querySelector('#scene').after(canvas);
 const c=canvas.getContext('2d');let key='';
 const R=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};

 function panes(w,h){
  const bw=w-SIDE*2,bh=h-TOP-BOTTOM,n=Math.max(1,Math.min(5,Math.round(bw/bh/1.25))),pw=(bw-(n-1)*MULLION)/n;
  return Array.from({length:n},(_,i)=>({x:SIDE+i*(pw+MULLION),y:TOP,w:pw,h:bh}));
 }
 function holes(list){c.beginPath();for(const p of list)c.roundRect(p.x,p.y,p.w,p.h,4);c.rect(canvas.width,0,-canvas.width,canvas.height);}
 function glow(x,y,r,a){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(255,190,110,${a})`);g.addColorStop(1,'rgba(255,190,110,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
 function cat(x,y){R(x,y+4,20,7,'#3a3440');R(x+15,y+1,9,7,'#3a3440');R(x+16,y-1,2,3,'#3a3440');R(x+21,y-1,2,3,'#3a3440');R(x+18,y+4,1,1,'#ffcd77');R(x+21,y+4,1,1,'#ffcd77');R(x-5,y+8,6,2,'#3a3440');R(x+2,y+5,12,1,'#4a4452');}
 function toolBag(x,y){R(x,y,28,14,'#5d5a44');R(x,y,28,2,'#6f6c52');R(x+4,y-4,20,2,'#3f3d2e');R(x+3,y-4,2,6,'#3f3d2e');R(x+23,y-4,2,6,'#3f3d2e');R(x+10,y+6,8,4,'#4a4836');R(x+31,y-3,6,17,'#7a3b32');R(x+31,y-3,6,2,'#9c9c96');}

 function draw(w,h){
  c.clearRect(0,0,w,h);
  const list=panes(w,h),by=h-BOTTOM;
  // wall: varnished vertical planks with grain and knots, only around the glass
  c.save();holes(list);c.clip('evenodd');
  R(0,0,w,h,Q.wall);
  for(let x=0;x<w;x+=12){R(x,0,1,h,Q.wallLo);R(x+1,0,1,h,Q.wallHi+'66');}
  for(let i=0;i<Math.ceil(w/7);i++)R((i*53)%w+4,(i*97)%h,1,6+(i%6)*3,i%3?Q.wallLo+'88':Q.wallHi+'55');
  c.restore();
  // ceiling, bare bulbs in plain shades, a vent
  R(0,0,w,9,Q.ceil);for(let x=0;x<w;x+=30)R(x,0,1,9,Q.ceilLine);R(0,9,w,2,Q.woodLo);R(0,11,w,1,Q.woodHi);
  const bulbs=[w*.18,w*.82].map(Math.round);
  for(const lx of bulbs){R(lx,0,1,3,'#3a3a3a');R(lx-6,3,13,3,Q.shade);R(lx-4,6,9,1,'#b8b09a');R(lx-2,7,5,3,Q.bulb);}
  R(Math.round(w/2)-12,1,24,7,'#6e644f');for(let i=0;i<4;i++)R(Math.round(w/2)-10+i*6,2,3,5,'#5a5140');
  // luggage rack: iron rail and net, a duffel and a cardboard box
  R(0,13,w,1,Q.metal);R(0,17,w,1,Q.metalLo);for(let x=0;x<w;x+=10)R(x,14,1,3,Q.metalLo);
  for(let x=20;x<w;x+=140)R(x,10,2,9,Q.metal);
  R(Math.round(w*.26),6,32,7,'#4b4a3a');R(Math.round(w*.26),6,32,1,'#5e5d4a');R(Math.round(w*.26)+14,5,5,2,'#3a392d');
  R(Math.round(w*.7),5,22,8,'#8a6e4a');R(Math.round(w*.7)+11,5,1,8,'#6a5236');
  // strap bar and white triangle straps, a couple missing
  R(0,20,w,1,Q.metal);
  for(let i=0,x=14;x<w-8;i++,x+=34){if(i%5===3)continue;R(x,21,1,5,'#6f6a5e');R(x-3,26,7,1,'#d9d4c4');R(x-3,27,1,3,'#d9d4c4');R(x+3,27,1,3,'#d9d4c4');R(x-2,30,5,1,'#d9d4c4');}
  // window sashes: wooden two-stage frames, meeting rail, latches, glass sheen
  for(const p of list){
   c.save();c.beginPath();c.roundRect(p.x-3,p.y-3,p.w+6,p.h+6,6);c.roundRect(p.x,p.y,p.w,p.h,4);c.fillStyle=Q.woodLo;c.fill('evenodd');
   c.beginPath();c.roundRect(p.x-3,p.y-3,p.w+6,p.h+6,6);c.roundRect(p.x-2,p.y-2,p.w+4,p.h+4,5);c.fillStyle=Q.woodHi;c.fill('evenodd');
   c.beginPath();c.roundRect(p.x-1,p.y-1,p.w+2,p.h+2,5);c.roundRect(p.x,p.y,p.w,p.h,4);c.fillStyle=Q.sash;c.fill('evenodd');c.restore();
   const rail=Math.round(p.y+p.h*.3);
   c.fillStyle='#0000001a';c.fillRect(p.x,p.y,p.w,rail-p.y);
   R(p.x,rail,p.w,3,Q.wood);R(p.x,rail,p.w,1,Q.woodHi);R(p.x,rail+3,p.w,1,Q.woodLo);
   R(p.x+p.w/2-4,rail+4,8,2,'#9c8a5a');R(p.x+6,p.y+p.h-5,6,2,'#9c8a5a');R(p.x+p.w-12,p.y+p.h-5,6,2,'#9c8a5a');
   c.save();c.beginPath();c.roundRect(p.x,p.y,p.w,p.h,4);c.clip();c.fillStyle='#ffffff0e';
   for(const [o,s] of [[p.w*.08,p.w*.08],[p.w*.2,p.w*.025],[p.w*.62,p.w*.1],[p.w*.75,p.w*.03]]){c.beginPath();c.moveTo(p.x+o,p.y+p.h);c.lineTo(p.x+o+s,p.y+p.h);c.lineTo(p.x+o+s+p.h*.5,p.y);c.lineTo(p.x+o+p.h*.5,p.y);c.fill();}
   c.restore();
  }
  // a hand-written notice taped in the corner of one pane
  if(list.length>1){const p=list[Math.floor(list.length/2)],x=Math.round(p.x+p.w-24),y=Math.round(p.y+p.h-18);R(x,y,16,12,Q.paper);R(x,y,16,1,Q.paperLo);for(let i=0;i<2;i++)R(x+2,y+4+i*3,i?7:12,1,Q.ink);R(x-1,y-1,4,2,'#d8cf9a88');R(x+13,y-1,4,2,'#d8cf9a88');}
  // sill, wainscot panels, then the facing long seat
  R(0,by+2,w,3,Q.woodHi);R(0,by+2,w,1,'#b98a5c');R(0,by+5,w,1,Q.woodLo);
  R(0,by+6,w,8,Q.wallLo);for(let x=0;x<w;x+=60){R(x,by+6,1,8,'#3a2414');R(x+4,by+8,52,4,'#553520');}
  R(SIDE,by+14,w-SIDE*2,12,Q.seat);R(SIDE,by+14,w-SIDE*2,1,Q.seatHi);for(let x=SIDE+90;x<w-SIDE;x+=90)R(x,by+15,1,11,Q.seatLo);
  R(0,by+26,w,2,Q.seatHi);R(0,by+28,w,BOTTOM-28,Q.seat);
  R(Math.round(w*.18),by+17,18,6,'#3c5073');
  R(Math.round(w*.63),by+29,16,3,Q.tape);R(Math.round(w*.63)+4,by+28,8,5,Q.tape);
  for(let i=0,x=16;x<w-8;i++,x+=37)R(x,by+15+((i*7)%9),1,1,Q.seatLo);
  for(const x of [0,w-4])R(x,by-10,4,BOTTOM+10,Q.wood);
  R(10,by+7,26,6,Q.sash);c.fillStyle='#c9c2a8';c.font='bold 6px monospace';c.textBaseline='top';c.fillText('オハ 07',12,by+7);
  if(w>=260){cat(Math.round(w*.46),by+17);toolBag(Math.round(w*.74),by+14);}
  // night: dim the carriage (never the view), vignette, warm pools under the bulbs
  c.save();holes(list);c.clip('evenodd');
  c.fillStyle='rgba(12,7,4,.36)';c.fillRect(0,0,w,h);
  const v=c.createRadialGradient(w/2,h*.45,Math.min(w,h)*.3,w/2,h/2,Math.max(w,h)*.7);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(6,3,2,.38)');c.fillStyle=v;c.fillRect(0,0,w,h);
  c.globalCompositeOperation='lighter';for(const lx of bulbs)glow(lx,8,Math.min(90,w*.18),.2);
  c.restore();
  for(const lx of bulbs)R(lx-2,7,5,3,Q.bulb);
  return list;
 }

 // Lay the carriage out for a window of `width`x`height` CSS px.
 // Returns the scene box in CSS px, or null when the carriage is hidden.
 function layout(width,height,enabled){
  const on=enabled&&height>=230&&width>=240;
  canvas.hidden=!on;host.classList.toggle('has-cabin',on);
  if(!on){key='';return null;}
  const s=Math.max(2,Math.round(height/225)),w=Math.ceil(width/s),h=Math.ceil(height/s),k=w+'x'+h+'@'+s;
  if(k!==key){key=k;canvas.width=w;canvas.height=h;canvas.style.width=w*s+'px';canvas.style.height=h*s+'px';c.imageSmoothingEnabled=false;draw(w,h);}
  return {x:SIDE*s,y:TOP*s,w:(w-SIDE*2)*s,h:(h-TOP-BOTTOM)*s};
 }
 return {layout,canvas};
}
