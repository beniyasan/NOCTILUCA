import {createPlaceScenes} from './place-scenes.js';
import {unit} from './anim-utils.js';
import {frontier} from './frontier-scenes.js';
import {KOWLOON_EXTRA,createKowloonDistricts} from './kowloon-districts.js';
import {SCRAP_EXTRA,createScrapDistricts} from './scrap-districts.js';
import {PELAGIC_EXTRA,createPelagicDistricts} from './pelagic-districts.js';
// View-only districts. These never send commands or modify a player's world.
export const DISTRICTS={
 kowloon:[['駅前の広告街','重なる看板と、小さな高架列車。'],['深夜の市場','重なる看板と濡れた窓。路地を譲り合い、湯気が換気口へ流れる。'],['運河沿い','建物が途切れ、水面に広告の灯りが伸びる。荷船が橋をくぐる。'],['屋上の住宅街','物干しと給水塔。換気扇のそばで、誰かが夜食をとっている。'],...KOWLOON_EXTRA],
 scrap:[['船底の工房街','回収船の骨組みに、工房の明かりが残る。'],['廃船の泊地','船殻の内側に小さな工房。クレーンが荷をつかみ、ゆっくり持ち上げる。'],['資材の選別場','ベルトが部品を運び、クレーンが次の箱を持ち上げる。'],['機関の修理区','外された推進機。作業灯の下で、試運転と手入れが続く。'],...SCRAP_EXTRA],
 pelagic:[['灯台の埠頭','浮体港の灯台が、入港する船を照らす。'],['外海の観測帯','水平線の手前で、船と浮桟橋が揺れる。水面の下を大きな影が渡る。'],['船の整備ドック','停泊船の側面を、整備台が上り下りしている。'],['養殖の入り江','丸い生け簀の間を、給餌艇が巡回する。'],...PELAGIC_EXTRA],
 gorge:[['岩棚の居住区','昇降機が、谷の上と下をつないでいる。'],['峡谷を渡る橋','手前の岩壁が途切れ、深い谷が開ける。吊られた荷が揺れながら橋を渡る。'],['段々の採石場','切り出した石が、斜面の搬送路を少しずつ下っていく。'],['崖沿いの集落','岩に沿った窓と通路。小さなリフトが生活の荷物を運ぶ。']],
 jade:[['段々温室','花のある温室と、庭師の作業場。'],['大樹の回廊','葉の奥に温室が見える。鳥が止まって枝がしなり、葉先から滴が落ちる。'],['苗の育成区','低い温室が並び、散水の列が奥から順に動く。'],['水庭のほとり','水を渡る細い橋。せせらぎと、ゆっくり動く手入れ舟。']],
 relay:[['中継環の周辺','無人の接続環で、いつもの点検が続く。'],['遠距離アンテナ群','暗い余白に受信皿が浮かぶ。信号灯が伝わり、点検機が止まって確かめる。'],['貨物の接続区','搬送ポッドが列を作り、一つずつ接続口へ入っていく。'],['外縁の集電翼','集電パネルが星へ角度を合わせる。点検機が枠をたどる。']],
 abyss:[['気密ドーム街','ドームを気密通路がつなぎ、配達カプセルが行き来する。'],['珊瑚の居住塔','珊瑚に覆われた塔。発光するイソギンチャクと、魚の群れ。'],['海溝の研究所','二つの岩棚の間に、暗い海溝が口を開ける。調査艇がケーブルで上下する。'],['昆布の水耕畑','昆布の列が潮になびく。収穫艇が畝の間をゆっくり進む。']],
 caldera:[['溶岩運河の街','溶岩の運河を橋が渡り、荷車と職人が行き交う。'],['鋳造街','るつぼが梁を渡り、型へ赤い金属を注ぐ。火花が散る。'],['地熱発電の塔群','冷却塔が湯気を吐き、タービンが回り続ける。'],['火口縁の湯の町','段々の湯けむりと、揺れる提灯。宿の窓が暖かい。']],
 aerie:[['浮島の駅前','吊り橋とゴンドラが、浮かぶ島々をつないでいる。'],['浮遊島の市場','小さな島ごとに屋台が並ぶ。風船がふわりと昇っていく。'],['風車の発電群','島の上で風車が回る。雲の上で凧が揺れている。'],['飛行船の港','係留塔に飛行船が寄り、荷を下ろす。']]
};
// `count` is how many districts besides the station a world has (Kowloon has more).
export function districtAt(distance,visit=0,count=3){
 const step=Math.floor((Math.max(0,distance)+14)/22)%4;
 return step===0?0:1+(step-1+Math.max(0,visit)%count)%count;
}
// Fixed geography for a journey with a destination. Duration stretches the
// stay in each district, never the route order or the number of visits.
export const ROUTES={
 kowloon:[0,1,3,2],scrap:[0,3,2,1],pelagic:[0,2,3,1],
 gorge:[0,3,2,1],jade:[0,2,1,3],relay:[0,2,1,3],
 abyss:[0,1,3,2],caldera:[0,1,2,3],aerie:[0,2,1,3]
};
// Kowloon has more districts than one ride shows, so the ride out of town takes a
// different street each visit. Each order still visits three districts once.
export const ROUTE_VARIANTS={
 kowloon:[[0,1,3,2],[0,4,5,2],[0,6,7,3],[0,5,1,6],[0,7,4,2],[0,4,6,3]],
 scrap:[[0,3,2,1],[0,5,4,6],[0,7,2,6],[0,4,3,5],[0,7,5,1],[0,2,4,6]],
 pelagic:[[0,2,3,1],[0,4,5,6],[0,7,2,6],[0,5,3,4],[0,4,7,1],[0,5,2,6]],
};
export function routeOrder(world,visit=0){const v=ROUTE_VARIANTS[world];return v?v[Math.max(0,visit)%v.length]:ROUTES[world];}
export function routeScene(world,progress,duration,visit=0){
 const order=routeOrder(world,visit),p=unit(progress),boundaries=[.10,.36,.67];
 const fade=Math.min(.09,3/Math.max(.1,duration));
 for(let i=2;i>=0;i--)if(p>=boundaries[i]){
  const mix=unit((p-boundaries[i])/fade);
  return {from:mix===1?order[i+1]:order[i],to:order[i+1],mix};
 }
 return {from:0,to:0,mix:1};
}
// Arriving comes in through the outer district of the same visit's route, the one the ride
// out will leave by.
export function approachScene(world,progress,visit=0){
 const outer=routeOrder(world,visit)[3],mix=unit((progress-.20)/.72);
 return {from:mix===1?0:outer,to:mix===0?outer:0,mix:mix===0?1:mix};
}
export function focusPassage(total,remainingMs){
 const elapsed=unit(1-remainingMs/(total*1000))*total;
 const departure=Math.min(8,total*.1),crossing=Math.min(13.8,total*.4);
 const outbound=Math.max(.1,total-crossing-departure);
 return {elapsed,departure:unit(elapsed/departure),duration:outbound,
  progress:unit((elapsed-departure)/outbound),
  crossing:remainingMs<=crossing*1000?unit(1-remainingMs/(crossing*1000)):null};
}
// A short, serial crossfade also returns smoothly to the station when stopping.
// The engine passes zero elapsed time while paused; nothing uses wall-clock time.
export function createDistrictJourney(){
 let distance=0,from=0,to=0,mix=1;
 return {
  reset(){distance=0;from=0;to=0;mix=1;},
  advance(dt,movement,visit,atStation,count=3){
   if(dt<=0)return;
   if(!atStation)distance+=dt*Math.max(0,movement);
   mix=Math.min(1,mix+dt/3);
   const next=atStation?0:districtAt(distance,visit,count);
   if(mix===1){from=to;if(next!==to){to=next;mix=0;}}
  },
  get view(){return {from,to,mix,distance};}
 };
}
export function createDistrictRenderer(a){
 const places=createPlaceScenes(a);
 // Worlds with more than four districts draw the extras (and alternate blocks) in their own module.
 const extras={neon:createKowloonDistricts(a),scrap:createScrapDistricts(a),water:createPelagicDistricts(a)};
 const {surface,rect,line,ellipse,poly,rand,ir,tower,pagoda,dome,industry,gardenTree,boulder,wreck,crate,sign,person,steam,drone,robot,rotatingFan,workCrane,shipBoat,drawRay,drawRelayRing,mod,shuttling}=a;
 function layer(p,depth,width,TILE,HEIGHT){
  if(frontier.owns(p))return frontier.layer(p,depth,width);
  if(places.owns(p))return places.layer(p,depth,width,TILE,HEIGHT);
  const e=surface(TILE,HEIGHT),c=e.getContext('2d'),d=p.district;
  const pp=depth===0?{...p,mid:p.far,near:p.far,trim:p.trim}:p;
  if(depth===1){
   const floor=p.kind==='neon'?(d===1?387:d===3?428:0):p.kind==='garden'?(d===1?405:d===2?379:0):p.kind==='scrap'?400:0;
   if(extras[p.kind]&&d>=4)extras[p.kind].floor(c,d,TILE,p);
   if(floor){rect(c,0,floor,TILE,HEIGHT-floor,p.near);line(c,0,floor,TILE,floor,p.trim,2);for(let x=0;x<TILE;x+=48){line(c,x,floor+14,x+23,floor+14,p.trim+'44');line(c,x+31,floor+31,x+53,floor+31,p.trim+'33');}}
  }
  // Reuse the established pixel sprites, with different massing and open space.
  for(let x=-768;x<=TILE;x+=768){
   const r=rand(p.seed+depth*177+mod(x,TILE)*31);
   if(extras[p.kind]?.layer(c,x,d,depth,p,r))continue;
   if(depth===0){
    if(p.kind==='rock'){boulder(c,x,420,d===1?165:330,d===1?220:300,pp,r,false);if(d!==1)boulder(c,x+290,420,200,240,pp,r,false);}
    else if(p.kind==='water'){if(d!==1){dome(c,x+30,286,130,d===2?84:48,pp,r);dome(c,x+230,286,90,42,pp,r);}}
    else if(p.kind==='scrap'){wreck(c,x,220,d===1?460:180,d===1?150:65,pp,r);}
    else if(p.kind==='garden'){if(d===1){gardenTree(c,x+80,348,220,r,pp);gardenTree(c,x+350,320,180,r,pp);rect(c,x-10,348,243,9,p.far);rect(c,x+260,320,231,9,p.far);}else{dome(c,x+60,322,180,74,pp,r,'GARDEN');rect(c,x+48,322,204,7,p.far);}}
    else if(p.kind==='neon'){for(let k=0;k<(d===2?2:5);k++)tower(c,x+k*86,390,55,d===3?110+ir(r,0,65):150+ir(r,0,90),pp,r,0);}
    else{if(d===2)tower(c,x+90,335,100,105,pp,r,0);}
    continue;
   }
   if(depth===2){
    if(p.kind==='water'||(p.kind==='garden'&&d===3)||(p.kind==='neon'&&d===2)){rect(c,x+42,429,5,21,p.trim);ellipse(c,x+44,449,14,3,p.near);}
    else if(p.kind==='rock'){boulder(c,x+50,478,d===1?74:140,90,{...p,mid:p.near},r,false);}
    else if(p.kind==='garden'){gardenTree(c,x+15,478,155,r,p,d!==1);}
    else if(p.kind==='scrap'){crate(c,x+40,423,33,28,p);crate(c,x+73,432,26,19,p);}
    else if(p.kind==='neon'){line(c,x,415,x+200,415,p.near,5);line(c,x+8,415,x+8,450,p.trim,3);}
    else{rect(c,x+20,432,60,6,p.trim);rect(c,x+23,438,5,12,p.near);}
    continue;
   }
   if(p.kind==='neon'){
    if(d===1){
     for(let k=0;k<4;k++){pagoda(c,x+20+k*100,387,83,90+ir(r,0,48),p,r);rect(c,x+18+k*100,349,87,7,k%2?p.neon:p.trim);}
     line(c,x,325,x+423,325,p.trim);for(let k=0;k<12;k++){line(c,x+15+k*34,325,x+15+k*34,332,p.trim);ellipse(c,x+15+k*34,339,4,6,k%2?p.neon:p.light);}
    }else if(d===2){
     tower(c,x+5,339,66,191,p,r);pagoda(c,x+350,340,126,165,p,r);
     rect(c,x-20,329,515,9,p.trim);for(let k=0;k<4;k++){rect(c,x+15+k*130,338,11,37,p.near);line(c,x+26+k*130,340,x+48+k*130,354,p.trim,2);}
     sign(c,x+366,195,17,65,p,r,true,'水路');
    }else{
     for(let k=0;k<3;k++){const xx=x+20+k*146;tower(c,xx,428,122,120+k%2*30,p,r);rect(c,xx-4,303-k%2*30,130,5,p.trim);industry(c,xx+40,303-k%2*30,38,43,p,r);line(c,xx+5,277-k%2*30,xx+105,277-k%2*30,p.trim);}
    }
   }else if(p.kind==='scrap'){
    if(d===1){wreck(c,x-30,202,462,190,p,r,false);line(c,x-30,394,x+440,394,p.trim,4);for(let k=0;k<8;k++)line(c,x+5+k*51,207,x-14+k*51,367,p.trim,3);}
    else if(d===2){
     industry(c,x+10,385,114,141,p,r);rect(c,x+127,365,311,8,p.trim);for(let k=0;k<6;k++){crate(c,x+166+k*41,385-k%2*24,38,23,p);ellipse(c,x+147+k*52,370,7,7,p.near);}line(c,x+339,196,x+339,370,p.trim,5);line(c,x+258,211,x+397,211,p.trim,4);
    }else{wreck(c,x+5,306,187,78,p,r,true);for(let k=0;k<2;k++){ellipse(c,x+253+k*95,311,60,60,p.near);ellipse(c,x+253+k*95,311,54,54,p.trim);ellipse(c,x+253+k*95,311,44,44,p.mid);}rect(c,x+180,379,255,7,p.trim);rect(c,x+244,366,19,34,p.trim);rect(c,x+339,366,19,34,p.trim);}
   }else if(p.kind==='water'){
    if(d===1){rect(c,x+75,348,46,7,p.trim);line(c,x+99,348,x+99,300,p.trim,2);rect(c,x+94,299,11,5,p.light);}
    else if(d===2){wreck(c,x+3,309,357,76,p,r,false);for(let k=0;k<9;k++)rect(c,x+33+k*32,330,16,7,p.accent+'88');rect(c,x-25,389,468,8,p.trim);line(c,x+74,177,x+74,389,p.trim,5);line(c,x+18,192,x+163,192,p.trim,4);line(c,x+395,230,x+395,385,p.trim,3);line(c,x+421,230,x+421,385,p.trim,3);}
    else{for(let k=0;k<4;k++){ellipse(c,x+40+k*99,365+(k%2)*20,42,14,p.trim);ellipse(c,x+40+k*99,365+(k%2)*20,39,11,'#164c59');line(c,x+k*99,365,x+79+k*99,365,p.accent+'77');}dome(c,x+140,328,106,64,p,r,'FARM');rect(c,x+128,329,132,6,p.trim);}
   }else if(p.kind==='rock'){
    if(d===1){boulder(c,x-62,451,111,261,p,r);boulder(c,x+417,451,90,286,p,r);line(c,x+20,262,x+460,262,p.trim,4);line(c,x+20,278,x+460,278,p.trim,2);for(let k=0;k<11;k++)line(c,x+25+k*40,264,x+45+k*40,278,p.trim);}
    else if(d===2){for(let k=0;k<4;k++){rect(c,x+k*35,275+k*34,395-k*38,31,p.mid);line(c,x+k*35,275+k*34,x+395-k*3,275+k*34,p.trim,3);}industry(c,x+283,403,80,95,p,r);line(c,x+30,296,x+279,404,p.trim,6);}
    else{boulder(c,x-25,465,456,320,p,r);for(let k=0;k<5;k++){const yy=245+k%3*47;tower(c,x+20+k*78,yy+52,65,52,p,r);rect(c,x+15+k*78,yy+52,77,4,p.trim);}line(c,x+425,191,x+425,421,p.trim,3);line(c,x+451,191,x+451,421,p.trim,3);}
   }else if(p.kind==='garden'){
    if(d===1){for(let k=0;k<3;k++)gardenTree(c,x+40+k*145,405,170+ir(r,0,75),r,p,k===2);rect(c,x-5,365,448,5,p.trim);for(let k=0;k<5;k++)rect(c,x+9+k*103,370,5,35,p.trim);line(c,x-5,347,x+443,347,p.trim);for(let k=0;k<12;k++)line(c,x+k*39,347,x+k*39,365,p.trim);}
    else if(d===2){for(let k=0;k<3;k++){dome(c,x+8+k*139,379,128,96,p,r,'NURSERY');for(let j=0;j<5;j++){rect(c,x+18+k*139+j*21,362,14,9,'#8a6660');line(c,x+25+k*139+j*21,361,x+25+k*139+j*21,350,p.accent,3);}}}
    else{gardenTree(c,x+10,320,110,r,p,true);gardenTree(c,x+383,321,102,r,p);rect(c,x-31,320,86,78,p.mid);rect(c,x+344,321,85,77,p.mid);rect(c,x-20,349,467,6,p.trim);for(let k=0;k<6;k++)rect(c,x+20+k*75,355,4,39,p.near);for(let k=0;k<5;k++){ellipse(c,x+52+k*84,406+(k%2)*10,15,4,'#43816b');}}
   }else if(p.kind==='void'){
    if(d===1){for(let k=0;k<2;k++){rect(c,x+62+k*217,281,12,104,p.trim);rect(c,x+28+k*217,382,82,7,p.near);}}
    else if(d===2){rect(c,x-20,366,464,10,p.trim);for(let k=0;k<4;k++){rect(c,x+10+k*108,331,87,33,p.near);sign(c,x+22+k*108,336,61,17,p,r,false,'BAY '+(k+1));}}
    else{rect(c,x+184,270,23,115,p.trim);rect(c,x-15,384,431,6,p.near);}
   }
  }
  return e;
 }
 function life(c,s,clock,travel,width,quiet){
  if(frontier.owns(s.p)){frontier.life(c,s,clock,travel,width,quiet);return;}
  if(places.owns(s.p)){places.life(c,s,clock,travel,width,quiet);return;}
  const p=s.p,d=p.district,start=-mod(travel*8.5,768);
  if(extras[p.kind]&&d>=4)extras[p.kind].wide(c,d,clock,travel,width,p);
  for(let x=start-768;x<width+768;x+=768){
   const t=clock+mod(Math.round((x+travel*8.5)/768),3)*11;
   if(extras[p.kind]&&d>=4){extras[p.kind].life(c,x,d,t,p,quiet,mod(Math.round((x+travel*8.5)/768),3));continue;}
   if(p.kind==='neon'){
    if(d===1){for(let k=0;k<(quiet?2:4);k++){const xx=x+45+k*100;person(c,xx,387,t+k,p,{action:'work',coat:'#b39b81'});steam(c,xx+15,364,t+k,p,3);}const a=shuttling(t,37);person(c,x+30+a.f*340,402,t,p,{walk:true,dir:a.dir,carry:true});}
    else if(d===2){if(s.momentState?.active?.id!=='boat_yield'&&!s.momentState?.done?.boat_yield)shipBoat(c,x+mod(t*8,440),391,t,p,.9);const a=shuttling(t,51);person(c,x+40+a.f*380,329,t,p,{walk:true,dir:a.dir});}
    else{for(let k=0;k<3;k++){const xx=x+20+k*146,y=303-k%2*30;rotatingFan(c,xx+106,y-14,10,t,p);if(k>0){for(let j=0;j<4;j++){const sway=Math.sin(t*.6+j)*2;rect(c,xx+9+j*19+sway,y-25,12,17,j%2?'#678c92':'#aa8e86');}person(c,xx+22,y,t,p,{action:'drink',scale:.8});}}}
   }else if(p.kind==='scrap'){
    if(d===1){const q=shuttling(t,58),xx=x+50+q.f*240;drone(c,xx,169,t,p);line(c,xx+16,169,xx+55,180,p.trim);wreck(c,xx+55,166,72,32,p,rand(100));}
    else if(d===2){for(let k=0;k<5;k++)crate(c,x+133+mod(t*9+k*57,280),347,22,16,p);workCrane(c,x+339,212,t,p);person(c,x+112,385,t,p,{hat:true,action:'work'});}
    else{for(let k=0;k<2;k++)rotatingFan(c,x+253+k*95,311,42,t*.3,p);/* Repair workers belong to the incidental scene so their tools stay in their hands. */if(!quiet&&mod(t,13)<4)for(let k=0;k<7;k++){const f=mod(t+k/7,1);rect(c,x+224+f*23,363+f*f*18,1,2,p.light);}}
   }else if(p.kind==='water'){
    if(d===1){drawRay(c,x+mod(t*7,560),368,1.8,t,p);for(let k=0;k<(quiet?5:16);k++){const xx=x+mod(t*13+k*13,490),yy=327+Math.sin(t*.7+k)*6+k%3*9;rect(c,xx,yy,5,2,p.accent);line(c,xx-2,yy-1,xx-2,yy+3,p.light);}}
    else if(d===2){workCrane(c,x+82,193,t,p);const y=244+shuttling(t,31).f*122;rect(c,x+389,y,39,5,p.trim);person(c,x+408,y,t,p,{hat:true,action:'work'});}
    else{shipBoat(c,x+mod(t*6,438),408,t,p,.6);if(!quiet)for(let k=0;k<5;k++){const f=mod(t*.45+k/5,1);ellipse(c,x+40+k*99,365+k%2*20,4+f*19,1+f*4,p.accent+'44');}}
   }else if(p.kind==='rock'){
    if(d===1){const a=shuttling(t,49),xx=x+28+a.f*416;line(c,xx,261,xx,294,p.trim);crate(c,xx-14,294,29,19,p);}
    else if(d===2){for(let k=0;k<6;k++){const f=mod(t*.025+k/6,1);crate(c,x+30+249*f,281+108*f,17,13,p);}person(c,x+160,343,t,p,{hat:true,action:'work'});}
    else{const yy=200+shuttling(t,39).f*202;rect(c,x+421,yy,35,4,p.trim);crate(c,x+431,yy-15,15,15,p);const q=shuttling(t,35);person(c,x+179+q.f*50,391,t,p,{walk:true,dir:q.dir,carry:true});}
   }else if(p.kind==='garden'){
    if(d===1){const q=shuttling(t,55);person(c,x+40+q.f*350,365,t,p,{walk:true,dir:q.dir});if(!quiet)for(let k=0;k<5;k++){const xx=x+mod(t*12+k*28,470),yy=227+k%2*16;line(c,xx-4,yy+Math.sin(t*5+k)*3,xx,yy,p.light);line(c,xx,yy,xx+4,yy+Math.sin(t*5+k)*3,p.light);}}
    else if(d===2){for(let k=0;k<3;k++){const on=mod(t+k*8,27)<13;if(on)for(let j=0;j<(quiet?5:14);j++){const f=mod(t*.6+j/14,1);rect(c,x+116+k*139-f*98,331-Math.sin(f*Math.PI)*23+f*21,1,2,p.accent+'99');}}/* Nursery worker and bud are drawn together by the Jade scene. */}
    else{shipBoat(c,x+mod(t*4,410),415,t,p,.6);for(let k=0;k<9;k++){const f=mod(t*.4+k/9,1);rect(c,x+212+Math.sin(f*6)*4,323+f*61,2,4,p.accent+'88');}const q=shuttling(t,54);person(c,x+30+q.f*360,349,t,p,{walk:true,dir:q.dir,coat:'#93ad9b'});}
   }else if(p.kind==='void'){
    if(d===1){for(let k=0;k<2;k++){const xx=x+68+k*217;c.save();c.translate(xx,258);c.rotate(Math.sin(t*.07+k)*.24);ellipse(c,0,0,76,23,p.trim);ellipse(c,0,-3,68,18,p.near);line(c,-48,-7,0,-41,p.trim,2);line(c,48,-7,0,-41,p.trim,2);rect(c,-3,-43,6,6,p.accent);c.restore();}drone(c,x+150+Math.sin(t*.1)*67,310,t,p);}
    else if(d===2){drawRelayRing(c,x+210,237,65,p,t);for(let k=0;k<(quiet?2:5);k++){const xx=x+mod(t*18+k*75,449);drone(c,xx,305,t,p,true);}}
    else{const h=26+Math.sin(t*.09)*15;for(let k=0;k<4;k++){const xx=x+5+k*103;rect(c,xx,275-h,92,h*2,p.trim);rect(c,xx+3,278-h,86,h*2-6,'#213858');for(let j=1;j<5;j++)line(c,xx+j*18,278-h,xx+j*18,272+h,p.accent+'66');line(c,xx+3,275,xx+89,275,p.accent+'66');}robot(c,x+20+shuttling(t,47).f*360,384,t,p,.9);}
   }
  }
 }
 // The outer planets own every district, including the station front.
 return {layer,life,
  owns:p=>frontier.owns(p)||places.owns(p),
  sky:(p,w,h)=>frontier.owns(p)?frontier.sky(p,w):places.sky(p,w,h),
  background:(c,s,...rest)=>frontier.owns(s.p)?frontier.background(c,s,...rest):places.background(c,s,...rest),
  foreground:(c,s,...rest)=>frontier.owns(s.p)?frontier.foreground(c,s,...rest):places.foreground(c,s,...rest)};
}
