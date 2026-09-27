import {pelagicDockPose} from './pelagic-moments.js';
import {ease} from './anim-utils.js';
// Six authored travel scenes. All motion uses the engine's pausable local
// clock; geometry and actors share world coordinates, including tile wrapping.
export function createPlaceScenes(a){
 const {surface,rect,line,ellipse,poly,rand,ir,tower,sign,person,crate,mod}=a;
 const owns=p=>p.district===1&&['neon','water','rock','scrap','garden','void'].includes(p.kind);
 const anchors=(travel,speed,span,width,fn)=>{
  const first=Math.floor(travel*speed/span);
  for(let n=first-1;n<first+Math.ceil(width/span)+1;n++)fn(n*span-travel*speed,mod(n,3));
 };
 function sky(p,width,height){
  if(!owns(p))return null;
  const e=surface(width,height),c=e.getContext('2d');
  const g=c.createLinearGradient(0,0,0,height);
  const colors={water:['#04182b','#376b7b','#183a4d'],rock:['#262233','#946d63','#392f40'],neon:['#0a1223','#391c35','#482338'],scrap:['#080f1b','#282934','#60514b'],garden:['#102e35','#517d72','#1b4246'],void:['#040918','#080d20','#12182c']}[p.kind];
  colors.forEach((v,i)=>g.addColorStop(i/2,v));c.fillStyle=g;c.fillRect(0,0,width,height);
  const r=rand(p.seed);
  if(p.kind!=='garden')for(let n=0;n<(p.kind==='void'?90:55);n++)rect(c,r()*width,r()*(p.kind==='void'?height:175),1,1,p.light+'55');
  if(p.kind==='water'){
   // Low, horizontal cloud banks leave most of the sky open.
   for(let n=0;n<8;n++)rect(c,r()*width,171+n*5,90+r()*240,2,p.accent+'0b');
   line(c,0,224,width,224,'#9cd6cf66');
  }
  return e;
 }
 function cliff(c,x,base,w,h,p,r,near=false){
  const top=base-h,col=near?'#20232e':p.mid;
  poly(c,[[x,base],[x+5,top+h*.16],[x+w*.23,top],[x+w*.51,top+12],[x+w*.66,top+h*.18],[x+w*.91,top+h*.22],[x+w,base]],col);
  poly(c,[[x+w*.23,top],[x+w*.36,top+19],[x+w*.3,base],[x+7,base]],near?'#292a33':p.trim+'44');
  for(let k=0;k<18;k++){
   const y=top+35+k*h/18,xx=x+18+r()*w*.2;
   line(c,xx,y,x+w*.83,y-7-r()*8,near?'#5a505044':p.trim+'44',1);
   if(k%3===0)line(c,xx+12,y,xx+7,y+21,near?'#121b29':p.near,2);
  }
 }
 function layer(p,depth,width,TILE,HEIGHT){
  if(!owns(p))return null;
  const e=surface(TILE,HEIGHT),c=e.getContext('2d'),r=rand(p.seed+depth*997);
  if(p.kind==='scrap'){workshopLayer(c,p,depth,TILE,r);return e;}
  if(p.kind==='garden'){groveLayer(c,p,depth,TILE,r);return e;}
  if(p.kind==='void'){relayLayer(c,p,depth,TILE);return e;}
  if(p.kind==='neon'){
   if(depth===0){
    for(let x=-32;x<TILE;x+=76){const h=ir(r,260,475);tower(c,x,410,ir(r,54,72),h,{...p,mid:'#281e34',near:'#1c1b2d',trim:'#423144'},r,0);}
   }else if(depth===1){
    rect(c,0,396,TILE,54,'#18232e');
    for(let x=0;x<TILE;x+=192){
     const h=ir(r,244,410),top=396-h;
     tower(c,x+3,396,146,h,p,r);
     // Set back an alley between the tall shop houses.
     rect(c,x+151,219,37,177,'#101b2a');rect(c,x+161,324,17,46,'#89795d');
     rect(c,x+161,330,17,36,'#234044');line(c,x+149,218,x+188,239,p.trim);
     // Twelve shop houses per tile, each a little different, so wide windows do not repeat.
     const u=Math.round(x/192);
     for(let y=top+38;y<316;y+=48){
      rect(c,x+11,y,30,18,'#6b77704d');line(c,x+24,y,x+24,y+18,p.trim);
      rect(c,x+98,y+14,26,14,'#202d37');line(c,x+95,y+29,x+128,y+29,p.trim,2);
      if(u%3===1){c.strokeStyle='#5a6670';c.lineWidth=1;c.strokeRect(x+50.5,y-4.5,40,26);for(let k=1;k<5;k++)line(c,x+50+k*8,y-4,x+50+k*8,y+21,'#5a667088');}
     }
     for(let k=0;k<3;k++){const xx=x+12+k*44;rect(c,xx,346,38,49,'#102330');rect(c,xx+3,351,30,23,k===1?'#be956888':'#4b8a8288');line(c,xx+18,351,xx+18,377,p.near,2);}
     poly(c,[[x,340],[x+146,340],[x+153,349],[x-4,349]],['#73505a','#3d5a60','#6a5a3a'][u%3]);line(c,x,340,x+146,340,u%2?p.accent:p.neon,2);
     sign(c,x+121,201,20,100,p,r,true,['深夜飯','茶と麺','修理店','薬局','占い','両替','焼味','カラオケ'][u%8]);
     if(u%4===3){rect(c,x+8,300,132,20,p.near);sign(c,x+10,300,128,18,p,r,false,['DUMPLING','MARKET','KARAOKE'][u%3]);}
     else{rect(c,x+54,320,55,16,p.near);sign(c,x+55,320,53,15,p,r,false,['OPEN','24H','RAMEN'][u%3]);}
     line(c,x+6,top+18,x+6,332,p.trim,3);line(c,x+6,285,x+27,285,p.trim,3);
    }
    for(let x=0;x<TILE;x+=768){c.strokeStyle='#121d2a';c.beginPath();c.moveTo(x,115);c.quadraticCurveTo(x+220,165,x+490,101);c.stroke();}
   }else{
    for(let x=0;x<TILE;x+=768){
     rect(c,x+18,0,13,450,'#101b27');rect(c,x+21,0,2,450,'#526168');
     line(c,x+27,49,x+122,49,'#111b27',10);line(c,x+27,46,x+122,46,'#48545c',2);
     for(let y=37;y<450;y+=87)rect(c,x+15,y,19,5,'#303b45');
     rect(c,x+110,40,18,17,'#263540');line(c,x+119,57,x+119,73,'#647274');
    }
   }
  }else if(p.kind==='water'){
   if(depth===0){
    for(let x=0;x<TILE;x+=768){
     poly(c,[[x+220,241],[x+283,217],[x+324,227],[x+364,214],[x+432,241]],'#355b68');
     rect(c,x+297,220,21,4,'#668184');rect(c,x+306,202,3,18,'#73928f');
    }
   }
   // Floating piers belong to life(), so their mooring lines and deck agree.
   if(depth===2)for(let x=0;x<TILE;x+=1152){rect(c,x+24,409,7,41,'#1a3543');ellipse(c,x+27,410,7,3,'#6d9292');}
  }else{
   if(depth===0){
    for(let x=0;x<TILE;x+=384){
     cliff(c,x,480,345,ir(r,290,425),{...p,mid:'#594551',trim:'#bc8b71'},r);
     for(let k=0;k<5;k++){const xx=x+60+k*45,yy=225+k%3*42;rect(c,xx,yy,12,6,'#edbd8077');line(c,xx-12,yy+9,xx+24,yy+9,'#ba8b6b66');}
    }
   }else if(depth===1){
    for(let x=0;x<TILE;x+=768){
     cliff(c,x-39,489,203,414,p,r);cliff(c,x+664,490,143,360,p,r);
     for(let k=0;k<3;k++){rect(c,x+55+k*26,229,18,24,p.near);rect(c,x+59+k*26,233,8,9,p.light+'99');}
     rect(c,x+47,255,92,5,p.trim);line(c,x+40,222,x+136,222,p.trim,2);
     // A sagging crossing, with a separate upper haul cable.
     for(let k=0;k<32;k++){
      const u=k/32,v=(k+1)/32,xx=x+136+u*534,yy=260+Math.sin(u*Math.PI)*21;
      line(c,xx,yy,x+136+v*534,260+Math.sin(v*Math.PI)*21,p.trim,3);
      line(c,xx,yy-15,x+136+v*534,245+Math.sin(v*Math.PI)*21,p.trim,1);
      line(c,xx,yy-15,xx,yy,p.trim,1);
     }
     line(c,x+136,200,x+670,200,p.trim,2);
     for(const xx of [136,670]){line(c,x+xx,179,x+xx,260,p.trim,3);rect(c,x+xx-5,194,10,5,p.near);}
    }
   }else for(let x=0;x<TILE;x+=1152){cliff(c,x-28,500,152,550,p,r,true);}
  }
  return e;
 }
 function background(c,s,t,travel,width){
  const p=s.p;if(!owns(p)||p.kind!=='water')return;
  const g=c.createLinearGradient(0,225,0,450);g.addColorStop(0,'#426f7b');g.addColorStop(.25,'#205362');g.addColorStop(1,'#0b2b42');c.fillStyle=g;c.fillRect(0,225,width,225);
  // A rare visitor is selected by the visit director, not a looping timer.
  const visitor=s.momentState?.active?.id==='deep_shadow'?s.momentState.active:null;
  const progress=visitor?.progress??0,x=-220+progress*(width+440),cy=335;
  if(visitor){
   c.save();c.globalAlpha=.32*Math.sin(progress*Math.PI);
   poly(c,[[x-110,cy],[x-65,cy-13],[x-14,cy-54],[x+41,cy-14],[x+100,cy],[x+34,cy+9],[x+2,cy+40],[x-33,cy+10]],'#071f32');
   line(c,x-72,cy,x-171,cy+Math.sin(t*.35)*8,'#071f32',4);c.restore();
   for(let k=0;k<16;k++){
    const side=k%2?1:-1,scatter=Math.sin(progress*Math.PI),fx=width*.5+(k%5-2)*11+side*scatter*135;
    c.save();c.globalAlpha=Math.sin(progress*Math.PI);rect(c,fx,321+Math.floor(k/5)*7+side*scatter*14,4,1,p.accent+'66');c.restore();
   }
  }
  for(let row=0;row<37;row++){
   const y=232+row*6,spacing=38+row*2;
   for(let k=-1;k<width/spacing+1;k++){
    const xx=k*spacing+mod(t*(1+row*.18)-travel*(.6+row*.08)+row*23,spacing);
    const wake=visitor?Math.exp(-Math.pow((xx-x-16)/120,2))*Math.exp(-Math.pow((y-324)/32,2)):0;
    const shine=(Math.sin(row*13+k*7)+1)*.025+.055;
    c.globalAlpha=shine+wake*.12;
    line(c,xx,y+Math.sin(t*.6+row)*1.4+wake*Math.sin(t*1.2+row)*3,xx+9+row*.7,y,p.accent);
   }
  }
  c.globalAlpha=1;
 }
 function life(c,s,t,travel,width,quiet){
  const p=s.p;if(!owns(p))return;
  anchors(travel,8.5,768,width,(x,cell)=>{
   const clock=t+cell*13;
   if(p.kind==='scrap'){workshopLife(c,p,x,clock,quiet,s.momentState,cell);return;}
   if(p.kind==='garden'){groveLife(c,p,x,clock,quiet);return;}
   if(p.kind==='void'){relayLife(c,p,x,clock,quiet);return;}
   if(p.kind==='neon'){
    for(let j=0;j<4;j++){
     if(j===1||j===3)continue; // Cat café and closing stall have their own actors.
     const xx=x+j*192,phase=mod(clock+j*2.7,18);
     // A courier yields at the alley while another person crosses it.
     const walk=phase<5?phase/5*.43:phase<8?.43:.43+Math.min(1,(phase-8)/10)*.57;
     c.save();c.globalAlpha=ease(phase/.8)*ease((18-phase)/.8);
     person(c,xx+18+walk*126,400,clock,p,{walk:phase<5||phase>=8,carry:true,dir:1,coat:'#a79783'});c.restore();
     if(phase>4&&phase<9)person(c,xx+174-(phase-4)*20,397,clock,p,{walk:true,dir:-1,coat:'#678c95'});
     if(!quiet)person(c,xx+39,386,clock+j,p,{action:'work',coat:'#a89c82'});
     for(let n=0;n<(quiet?3:6);n++){
      const age=mod(clock*.25+n/6+j*.17,1),wind=ease((age-.2)/.8);
      c.globalAlpha=(1-age)*.13;
      ellipse(c,xx+43+wind*37,348-age*46,3+age*12,2+age*7,'#b9c4c4');
     }
     c.globalAlpha=1;
     const lit=Math.floor(mod(clock*.65+j,4));
     for(let n=0;n<4;n++)rect(c,xx+123,207+n*23,2,14,n<=lit?p.light:p.trim);
     // Wet paving and window drips keep the weather tied to the buildings.
     for(let n=0;n<5;n++){const yy=406+n*7;line(c,xx+118-n*2+Math.sin(clock+n)*2,yy,xx+140+n*2,yy,(n%2?p.accent:p.neon)+'44');}
     for(let n=0;n<3;n++){const f=mod(clock*.12+n*.31+j*.17,1);rect(c,xx+17+n*43,270+f*30,1,3,p.accent+'66');}
    }
   }else if(p.kind==='water'){
    const {pierY,boatY,boatX,roll}=pelagicDockPose(clock,s.momentState,cell);
    line(c,x+83,327,x+101,pierY,p.trim,2);
    rect(c,x+78,300,6,56,'#315360');rect(c,x+76,299,10,4,p.light);
    // Hinged gangway, then a floating deck that responds a little later.
    line(c,x+82,330,x+123,pierY,p.trim,3);rect(c,x+118,pierY,70,6,'#53777d');
    for(let j=0;j<3;j++)ellipse(c,x+127+j*25,pierY+7,10,4,'#173744');
    if(boatX<240)line(c,x+143,pierY,x+boatX-20,boatY+2,p.trim);
    c.save();c.translate(x+boatX,boatY);c.rotate(roll);
    poly(c,[[-39,0],[34,0],[25,13],[-26,13]],'#142d3c');line(c,-39,0,34,0,p.trim,2);
    rect(c,-12,-12,24,12,'#456671');rect(c,-8,-10,13,6,p.light+'aa');line(c,8,-12,8,-31,p.trim);
    c.restore();
    for(let j=0;j<3;j++){
     const age=mod(clock*.17+j/3,1);c.globalAlpha=(1-age)*.17;
     ellipse(c,x+boatX-4,boatY+15,24+age*29,2+age*4,p.accent);
    }
    c.globalAlpha=1;
    // Infrequent seabirds skim the horizon, leaving the sky mostly empty.
    if(!quiet){const q=mod(clock,37);if(q<14){const bx=x-50+q*48,by=246-Math.sin(q/14*Math.PI)*30;line(c,bx-4,by-2+Math.sin(q*4)*2,bx,by,p.light);line(c,bx,by,bx+4,by-2+Math.sin(q*4)*2,p.light);}}
   }else{
    const phase=mod(clock,64),forward=phase<32,q=mod(phase,32),u=ease((q-3)/25),f=forward?u:1-u;
    const xx=x+141+f*524,move=q>3&&q<28;
    // Rollers crossing a support kick the suspended load; the swing decays.
    const since=q-4.5,kick=since>=0&&since<7?Math.sin(since*3)*Math.exp(-since*.55)*.10:0;
    const sway=move?Math.sin(clock*.8)*.015+kick:0;
    rect(c,xx-7,197,14,5,p.near);ellipse(c,xx-4,199,3,3,p.trim);ellipse(c,xx+4,199,3,3,p.trim);
    c.save();c.translate(xx,202);c.rotate(sway);line(c,0,0,0,34,p.trim,2);
    rect(c,-17,34,34,23,p.near);rect(c,-14,37,28,15,'#726658');line(c,-17,34,17,34,p.trim,2);
    rect(c,-9,40,7,6,p.light+'88');line(c,8,35,8,56,p.trim);c.restore();
    // Windborne dust is restricted to the open gap, then occluded by near rock.
    for(let n=0;n<(quiet?6:18);n++){
     const u=mod(clock*.055+n*.071,1),xx=x+165+u*480;
     c.globalAlpha=Math.sin(u*Math.PI)*.17;
     line(c,xx,310+n%6*19+Math.sin(clock*.3+n)*3,xx+7,310+n%6*19,p.light);
    }
    c.globalAlpha=1;
   }
  });
 }
 function workshopLayer(c,p,depth,TILE,r){
  for(let x=0;x<=TILE;x+=768){
   r=rand(p.seed+depth*997+mod(x,TILE)*31);
   if(depth===0){
    // An unlit wreck behind the cutaway gives the workshop its scale.
    poly(c,[[x-110,146],[x+88,61],[x+437,106],[x+526,220],[x+412,273],[x-60,236]],'#252630');
    for(let k=0;k<8;k++)line(c,x+15+k*49,103+k*3,x-18+k*52,238,'#5c505344',3);
    continue;
   }
   if(depth===2){
    poly(c,[[x+30,0],[x+49,0],[x+22,154],[x+3,283],[x+35,450],[x+12,450],[x-19,282],[x+1,149]],'#101b27');
    for(let k=0;k<7;k++)rect(c,x+8,42+k*59,5,3,'#746663');
    continue;
   }
   // Ship ribs frame a hollow interior; small doors sit inside the ship.
   poly(c,[[x-62,110],[x+61,22],[x+424,48],[x+575,162],[x+514,397],[x-43,397]],'#4b4548');
   poly(c,[[x-18,127],[x+80,54],[x+403,78],[x+531,176],[x+482,375],[x-7,375]],'#15202b');
   for(let k=0;k<8;k++){
    const xx=x+50+k*58;
    poly(c,[[xx,76+k*4],[xx+9,78+k*4],[xx-18,229],[xx-12,373],[xx-22,373],[xx-29,229]],'#625858');
    line(c,xx+2,82+k*4,xx-23,223,'#b19a7a44');
   }
   for(let k=0;k<4;k++)line(c,x+10,145+k*55,x+490,170+k*47,'#514850',2);
   rect(c,x+34,302,187,78,'#292d35');
   for(let k=0;k<3;k++){
    rect(c,x+45+k*56,325,37,51,'#101c29');rect(c,x+50+k*56,333,27,20,p.light+'88');
    line(c,x+63+k*56,333,x+63+k*56,354,p.near,2);
   }
   sign(c,x+49,307,85,14,p,r,false,'HULL / 04');
   rect(c,x-30,380,562,9,p.trim);rect(c,x-27,389,559,13,p.near);
   for(let k=0;k<22;k++)line(c,x-20+k*25,381,x-14+k*25,387,'#c6a07677',2);
   // Gantry is bolted to the hull floor, not suspended in empty space.
   line(c,x+276,118,x+276,380,p.trim,7);line(c,x+443,118,x+443,380,p.trim,7);
   line(c,x+276,168,x+322,119,p.trim,3);line(c,x+399,119,x+443,168,p.trim,3);
   rect(c,x+266,111,187,12,p.trim);rect(c,x+266,123,187,5,p.near);
   rect(c,x+331,122,34,13,'#b29777');ellipse(c,x+338,124,5,5,p.near);ellipse(c,x+358,124,5,5,p.near);
   rect(c,x+309,376,78,4,'#a98b6b');
  }
 }
 function workshopLife(c,p,x,t,quiet,state,cell){
  const q=mod(t,34);
  // Lower empty jaws → grip → take up slack → lift → settle → lower → release.
  const lift=q<9?0:q<16?ease((q-9)/7):q<22?1:q<29?1-ease((q-22)/7):0;
  const boxY=351-lift*113;
  const gripping=q>=7&&q<30;
  const hookY=q<6?247+ease(q/6)*95:q<30?boxY-9:342-ease((q-30)/4)*95;
  const since=q-9,sway=gripping&&since>0?Math.sin(since*1.9)*Math.exp(-since*.25)*4:0;
  const slack=q>=6&&q<9?Math.sin((q-6)/3*Math.PI)*4:0;
  line(c,x+348,134,x+348+sway*.5+slack,(134+hookY)/2,p.trim,2);
  line(c,x+348+sway*.5+slack,(134+hookY)/2,x+348+sway,hookY,p.trim,2);
  rect(c,x+343+sway,hookY-3,10,7,p.trim);
  const jaw=25-8*ease((q-6)/2)*(1-ease((q-29)/2));
  line(c,x+345+sway,hookY,x+348+sway-jaw,hookY+18,p.trim,2);
  line(c,x+351+sway,hookY,x+348+sway+jaw,hookY+18,p.trim,2);
  crate(c,x+329+sway,boxY,38,25,p);
  if(!quiet)person(c,x+241,380,t,p,{action:'work',hat:true,coat:'#9f9280'});
  const welding=mod(t+8,17),flash=welding<2.4&&Math.sin(welding*11)>.15;
  if(flash){
   poly(c,[[x+199,353],[x+154,278],[x+245,293]],'#9cdde418');
   line(c,x+208,257,x+214,346,'#c0f3e066',2);ellipse(c,x+199,353,3,3,'#d8fff2');
   if(!quiet)for(let k=0;k<6;k++){const age=mod(welding*1.6+k/6,1);rect(c,x+199+age*(18+k*3),353+age*age*26,2,1,p.light);}
  }
  // A tug and its trailing load ease through a turn at different times.
  const passage=state?.active?.id==='salvage_passage'?state.active:state?.done?.salvage_passage;
  if(passage?.cell===cell)t-=Math.min(passage.duration,Math.max(0,state.time-passage.start));
  const tx=z=>x+630+Math.sin(z*.075)*50,ty=z=>162+Math.cos(z*.075)*27;
  const bx=tx(t-1.5)+44,by=ty(t-1.5)+18;
  line(c,tx(t)+13,ty(t)+4,bx,by,p.trim);
  rect(c,tx(t)-12,ty(t)-5,25,12,p.near);rect(c,tx(t)-8,ty(t)-4,10,4,p.accent+'aa');
  poly(c,[[bx,by-9],[bx+27,by-13],[bx+37,by+6],[bx+5,by+10]],'#746963');
  line(c,bx+5,by-7,bx+29,by+4,p.trim,2);
 }
 function leaves(c,x,y,size,color){
  poly(c,[[x-size,y],[x-size*.3,y-size*.42],[x+size*.45,y-size*.3],[x+size,y],[x+size*.2,y+size*.4],[x-size*.5,y+size*.27]],color);
 }
 function groveLayer(c,p,depth,TILE,r){
  for(let x=0;x<=TILE;x+=768){
   r=rand(p.seed+depth*997+mod(x,TILE)*31);
   if(depth===0){
    for(let k=0;k<7;k++){
     const xx=x+k*112;poly(c,[[xx,440],[xx+17,0],[xx+35,0],[xx+28,440]],'#284d4c');
     for(let j=0;j<9;j++)leaves(c,xx+ir(r,-75,85),ir(r,30,290),ir(r,22,53),'#3e685c');
    }
   }else if(depth===1){
    // Architecture glimpsed through the grove, not a skyline topped by trees.
    poly(c,[[x+165,375],[x+165,264],[x+304,220],[x+462,264],[x+462,375]],'#2b5955');
    poly(c,[[x+179,360],[x+179,273],[x+304,234],[x+447,273],[x+447,360]],'#83ac9255');
    for(let k=0;k<7;k++){const xx=x+181+k*43;line(c,xx,274,xx,365,p.trim,2);line(c,xx,274,x+304,232,p.trim);}
    line(c,x+174,308,x+452,308,p.trim,2);
    for(let k=0;k<10;k++){
     const xx=x+192+k*25;rect(c,xx,343,17,14,'#6e6b57');leaves(c,xx+8,337,13,'#56836a');
    }
    rect(c,x-12,381,624,8,'#3a5653');line(c,x-12,360,x+612,360,p.trim,2);
    for(let k=0;k<13;k++)line(c,x+k*48,360,x+k*48,381,p.trim,2);
    for(const xx of [x+24,x+548]){
     poly(c,[[xx-23,405],[xx-8,248],[xx+8,0],[xx+35,0],[xx+17,268],[xx+26,405]],'#22423f');
     line(c,xx+4,185,xx+83,109,'#31544a',13);line(c,xx+11,244,xx-49,177,'#31544a',10);
     for(let k=0;k<31;k++)leaves(c,xx+ir(r,-64,156),ir(r,0,152),ir(r,12,35),k%3?'#315e4d':'#48765a');
    }
   }else{
    // The near trunk leaves broad openings for the walkway and glasshouse.
    poly(c,[[x+16,450],[x+37,213],[x+24,0],[x+52,0],[x+61,215],[x+48,450]],'#112e32');
    line(c,x+49,220,x+53,437,'#346052',3);
    for(let k=0;k<22;k++)leaves(c,x+ir(r,-80,179),ir(r,-18,45),ir(r,18,47),k%3?'#173e3a':'#285246');
    for(let k=0;k<12;k++)leaves(c,x+ir(r,-30,110),ir(r,418,470),ir(r,13,28),'#234b40');
   }
  }
 }
 function groveLife(c,p,x,t,quiet){
  const gust=z=>Math.pow(Math.max(0,Math.sin(z*.19)),3);
  for(let k=0;k<(quiet?4:9);k++){
   const xx=x+204+k*26,alpha=.03+gust(t-k*.25)*.10;
   c.save();c.globalAlpha=alpha;poly(c,[[xx,244],[xx+7,248],[xx+47,359],[xx+18,359]],'#d8ecad');c.restore();
   const age=mod(t*.08+k*.17,1);rect(c,xx,277+age*68,1,3,p.accent+'66');
  }
  const q=mod(t,44),f=ease(q<22?q/19:(44-q)/19);
  if(!quiet)person(c,x+123+f*352,381,t,p,{walk:q<19||q>25,dir:q<22?1:-1,coat:'#8caa85',carry:true});
 }
 function relayLayer(c,p,depth,TILE){
  for(let x=0;x<=TILE;x+=768){
   if(depth===0){
    rect(c,x+383,279,43,4,'#303449');rect(c,x+402,240,3,40,'#4c4c63');
    line(c,x+385,240,x+426,240,'#44465d');rect(c,x+401,239,3,2,p.accent+'88');
   }else if(depth===1){
    rect(c,x+84,255,13,131,'#323647');rect(c,x+88,258,3,128,'#737086');
    rect(c,x+36,385,170,9,'#363b4c');rect(c,x+57,394,120,10,'#141e30');
    for(let k=0;k<5;k++)rect(c,x+66+k*22,399,9,2,p.accent+'55');
    rect(c,x+162,339,29,47,'#1c283c');rect(c,x+169,345,15,17,'#0c172a');
    line(c,x+174,328,x+174,339,p.trim,2);
    // The exposed service rail deliberately ends before a long empty span.
    line(c,x+184,381,x+367,381,'#45495f',3);line(c,x+184,388,x+367,388,'#262e43',2);
    for(let k=0;k<6;k++)line(c,x+193+k*31,382,x+208+k*31,388,'#45495f');
   }else{
    // A huge nearby structural rib passes close to the train in deep shadow.
    poly(c,[[x+14,-20],[x+45,-20],[x+115,135],[x+88,308],[x+27,470],[x-2,470],[x+61,302],[x+88,140]],'#0a1223');
    line(c,x+43,7,x+105,139,'#373b5355',2);line(c,x+105,139,x+79,302,'#373b5355',2);
    for(let k=0;k<3;k++)rect(c,x+59+k*13,62+k*28,3,5,p.accent+'44');
   }
  }
 }
 function relayLife(c,p,x,t,quiet){
  // Dish slews, settles, then stays pointed at the link for most of its cycle.
  const q=mod(t,60),angle=q<10?-.2+ease(q/10)*.32:q<39?.12:.12-ease((q-39)/12)*.32;
  c.save();c.translate(x+90,235);c.rotate(angle);
  line(c,0,10,0,22,p.trim,8);
  poly(c,[[-73,-23],[-47,9],[-17,23],[20,22],[51,7],[77,-23],[41,-5],[-39,-5]],'#5b5d72');
  poly(c,[[-67,-22],[-39,-5],[39,-5],[70,-22],[40,-13],[-40,-13]],'#a19b9f');
  line(c,-52,-17,0,-65,p.trim,2);line(c,54,-17,0,-65,p.trim,2);rect(c,-3,-67,6,7,p.accent+'bb');
  c.restore();
  const pulse=mod(t,12);
  for(let k=0;k<5;k++)rect(c,x+86,270+k*20,4,3,pulse>=k*.55&&pulse<k*.55+1?p.accent:'#41475a');
  // A rail robot waits to inspect, turns its head, then returns to the dock.
  const z=mod(t,38),out=z<12?ease(z/12):z<24?1:1-ease((z-24)/14),xx=x+196+out*143;
  rect(c,xx-9,369,18,9,'#667080');rect(c,xx-6,378,12,4,p.near);
  const looking=z>=12&&z<24,head=looking?ease((z-13)/3)*6-ease((z-20)/3)*6:0;
  line(c,xx,369,xx+head,362,p.trim,2);rect(c,xx-4+head,358,8,6,'#a09c9b');rect(c,xx+2+head,360,2,2,p.accent);
  if(looking&&!quiet){c.save();c.globalAlpha=.07;poly(c,[[xx+6+head,362],[xx+32,375],[xx+15,378]],p.accent);c.restore();}
  const dock=mod(t+11,49),f=ease(Math.min(dock/9,(49-dock)/9)),px=x+174+(1-f)*143,py=318-(1-f)*82;
  rect(c,px-10,py-5,20,10,'#39475d');rect(c,px-5,py-3,8,3,p.accent+'aa');
  // Only approach/braking and departure burn; no continuous exhaust.
  if((dock>4&&dock<9)||(dock>40&&dock<45))poly(c,[[px+10,py-2],[px+18,py],[px+10,py+2]],'#c0cdf088');
 }
 function foreground(c,s,t,travel,width,quiet){
  if(!owns(s.p)||s.p.kind!=='garden')return;
  const p=s.p;
  anchors(travel,23.5,768,width,(x,cell)=>{
   const clock=t+cell*13,q=mod(clock,32);
   const gust=z=>Math.pow(Math.max(0,Math.sin(z*.19)),3);
   const angleAt=z=>{
    const q=mod(z,32),land=ease((q-8)/.6)*(1-ease((q-18)/.35));
    const rebound=q>=18&&q<22?Math.sin((q-18)*5)*Math.exp(-(q-18)*1.6)*.016:0;
    return gust(z)*.018+(quiet?0:land*.028+rebound);
   };
   const angle=angleAt(clock);
   c.save();c.translate(x+46,128);c.rotate(angle);
   poly(c,[[0,-5],[91,-28],[169,-31],[213,-22],[167,-26],[93,-19],[0,6]],'#315947');
   for(let k=0;k<15;k++){
    const xx=36+k*11,yy=-18-Math.sin(k*.21)*13,sway=gust(clock-k*.13)*3;
    line(c,xx,yy,xx+6,yy-10-sway,'#477555');
    leaves(c,xx+9,yy-12-sway,10+k%3*3,k%3?'#426f4f':'#638c60');
   }
   const bird=(bx,by,flying)=>{
    ellipse(c,bx,by,5,3,'#c5c9a0');rect(c,bx+3,by-3,4,4,'#d9dcba');line(c,bx+7,by-1,bx+10,by,'#a49a76');
    if(flying){const flap=Math.sin(clock*8)*7;line(c,bx-5,by-2,bx-1,by-flap,'#779688',2);}
    else{line(c,bx-1,by+3,bx-1,by+6,'#879582');line(c,bx+3,by+3,bx+3,by+6,'#879582');}
   };
   if(!quiet){
    if(q<8){const f=ease(q/8);c.globalAlpha=ease(q);bird(334-124*f,-94+66*f,true);c.globalAlpha=1;}
    else if(q<18)bird(210,-28,false);
    else if(q<23){const f=ease((q-18)/5);c.globalAlpha=1-ease((q-21)/2);bird(210+f*170,-28-f*100,true);c.globalAlpha=1;}
   }
   c.restore();
   // A drop accumulates, detaches, then accelerates; its release point is fixed.
   for(let k=0;k<(quiet?1:3);k++){
    const age=mod(clock+k*2.1,8),localX=88+k*34,localY=-38;
    const a=angleAt(clock-Math.max(0,age-6));
    const dx=x+46+localX*Math.cos(a)-localY*Math.sin(a),dy=128+localX*Math.sin(a)+localY*Math.cos(a);
    if(age<6)ellipse(c,dx,dy+3,1,1+age/4,p.accent+'77');
    else{const fall=age-6;rect(c,dx+fall*3,dy+4+fall*fall*86,1,4,p.accent+'99');}
   }
  });
 }
 return {owns,sky,layer,background,life,foreground};
}
