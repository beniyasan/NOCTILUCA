// Hand-drawn anime bust portraits for the platform conversation NPCs.
// Each portrait is a self-contained SVG (viewBox 120x132, same ratio as the
// 60x66 slot) whose background and palette follow the NPC's city.
const W=120,H=132;

// Shared face: skin, eyes, brows, nose, mouth, blush. `eye` = iris colour.
function face({skin,shade,eye,lash='#2a1d22',brow,mood='soft',blush='#f08a8a'}){
 const lids={
  soft:(x,m)=>`<path d="M${x-8},${63} Q${x},${56} ${x+8},${62}" stroke="${lash}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M${x+(m*8)},${62} l${m*3},-2" stroke="${lash}" stroke-width="1.6" stroke-linecap="round"/>`,
  smile:(x)=>`<path d="M${x-7},${67} Q${x},${59} ${x+7},${67}" stroke="${lash}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  sleepy:(x,m)=>`<path d="M${x-8},${65} Q${x},${60} ${x+8},${64}" stroke="${lash}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M${x+(m*8)},${64} l${m*2.5},-1.5" stroke="${lash}" stroke-width="1.6" stroke-linecap="round"/>`
 };
 const eyeAt=(x,m)=>{
  if(mood==='smile')return lids.smile(x);
  const top=mood==='sleepy'?63:61;
  return `<path d="M${x-7.5},${top+2} Q${x},${top-3} ${x+7.5},${top+1} L${x+6.5},${73} Q${x},${76} ${x-6.5},${73} Z" fill="#fbf7f2"/>
  <ellipse cx="${x+m*0.6}" cy="${68}" rx="5.2" ry="${mood==='sleepy'?5.6:6.6}" fill="url(#iris)"/>
  <ellipse cx="${x+m*0.6}" cy="${68.5}" rx="2.3" ry="3.2" fill="${lash}" opacity=".75"/>
  <circle cx="${x+m*0.6-1.8}" cy="${65.2}" r="1.8" fill="#fff"/><circle cx="${x+m*0.6+2.2}" cy="${71.4}" r=".9" fill="#fff" opacity=".85"/>
  ${lids[mood](x,m)}<path d="M${x-4},${74.6} Q${x},${75.8} ${x+4},${74.4}" stroke="${shade}" stroke-width="1" fill="none"/>`;
 };
 const mouth=mood==='smile'
  ?`<path d="M55,85 Q60,90 65,85 Q60,87.5 55,85 Z" fill="#9a4a4f"/>`
  :mood==='sleepy'?`<path d="M56.5,86 Q60,87.6 63.5,85.6" stroke="#8c4c4c" stroke-width="1.3" fill="none" stroke-linecap="round"/>`
  :`<path d="M56,85.4 Q60,88.4 64.5,85" stroke="#8c4c4c" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
 return `<defs><linearGradient id="iris" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1620"/><stop offset=".55" stop-color="${eye}"/><stop offset="1" stop-color="#fff6d8"/></linearGradient>
  <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade}"/><stop offset=".32" stop-color="${skin}"/></linearGradient></defs>
  <path d="M51,88 L51,104 Q60,110 69,104 L69,88 Z" fill="${shade}"/>
  <ellipse cx="38.5" cy="68" rx="4" ry="6.5" fill="${skin}"/><ellipse cx="81.5" cy="68" rx="4" ry="6.5" fill="${skin}"/>
  <path d="M38,56 C37,78 46,92 60,98 C74,92 83,78 82,56 C80,40 40,40 38,56 Z" fill="url(#skin)"/>
  <ellipse cx="46" cy="79" rx="5" ry="2.4" fill="${blush}" opacity=".38"/><ellipse cx="74" cy="79" rx="5" ry="2.4" fill="${blush}" opacity=".38"/>
  ${eyeAt(48,-1)}${eyeAt(72,1)}
  <path d="M41,${mood==='sleepy'?56:54} Q47,${mood==='sleepy'?53:50.5} 54,${mood==='sleepy'?55:53}" stroke="${brow}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
  <path d="M66,${mood==='sleepy'?55:53} Q73,${mood==='sleepy'?53:50.5} 79,${mood==='sleepy'?56:54}" stroke="${brow}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
  <path d="M60.5,77 l-1.2,2.4 l1.8,.2" stroke="${shade}" stroke-width="1" fill="none" stroke-linecap="round"/>${mouth}`;
}

// Hair shading: base mass plus a soft "angel ring" highlight and strand lines.
const shine=(d,c)=>`<path d="${d}" fill="${c}" opacity=".55"/>`;
const strands=(c,list)=>list.map(d=>`<path d="${d}" stroke="${c}" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/>`).join('');
const rain=(c,n,seed)=>{let s=seed,o='';for(let i=0;i<n;i++){s=(s*9301+49297)%233280;const x=s/233280*W;s=(s*9301+49297)%233280;const y=s/233280*H;o+=`<path d="M${x.toFixed(1)},${y.toFixed(1)} l-2,9" stroke="${c}" stroke-width=".8" opacity=".45"/>`;}return o;};

const PORTRAITS={
 // 月光食堂の店主。湯気と提灯、雨のネオン九龍。黒髪のお団子に箸のかんざし、割烹着。
 mei:()=>`
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1330"/><stop offset=".6" stop-color="#3a1640"/><stop offset="1" stop-color="#a91b4f"/></linearGradient>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="6" y="14" width="22" height="46" rx="3" fill="#1b0f25" stroke="#ff3974" stroke-width="1.6"/><text x="17" y="31" font-size="11" text-anchor="middle" fill="#ff7ea2" font-family="serif">月</text><text x="17" y="48" font-size="11" text-anchor="middle" fill="#ff7ea2" font-family="serif">光</text>
  <path d="M103,0 v10" stroke="#44505b" stroke-width="1.2"/><circle cx="103" cy="25" r="18" fill="#ffcd77" opacity=".16"/><rect x="97" y="10" width="12" height="3" fill="#3a2020"/><rect x="97" y="37" width="12" height="3" fill="#3a2020"/><ellipse cx="103" cy="25" rx="11" ry="13" fill="#e2493f"/><path d="M103,12 v26 M97,14 Q93,25 97,36 M109,14 Q113,25 109,36" stroke="#ffcd77" stroke-width=".8" fill="none" opacity=".7"/><path d="M103,40 v6" stroke="#ffcd77" stroke-width="1.4"/>
  ${rain('#66f7dd',26,11)}
  <path d="M60,22 C28,20 22,50 28,96 L40,100 C34,70 40,40 60,36 C80,40 86,70 80,100 L92,96 C98,50 92,20 60,22 Z" fill="#1d1a26"/>
  <circle cx="60" cy="20" r="13" fill="#1d1a26"/><path d="M52,15 Q60,9 68,15" stroke="#4a4660" stroke-width="2" fill="none"/>
  <path d="M68,16 L84,6 M70,19 L86,11" stroke="#c9884c" stroke-width="2.2" stroke-linecap="round"/><circle cx="85" cy="6" r="1.8" fill="#ff3974"/>
  <path d="M14,132 C16,112 34,103 51,101 L69,101 C86,103 104,112 106,132 Z" fill="#668b7a"/>
  <path d="M44,103 L60,120 L76,103 L69,101 L60,110 L51,101 Z" fill="#eee6d6"/><path d="M34,132 L38,110 L50,106 L60,120 L70,106 L82,110 L86,132 Z" fill="#f2ebdc"/>
  <path d="M40,118 h40" stroke="#668b7a" stroke-width="1.2" opacity=".5"/>
  ${face({skin:'#f7dccb',shade:'#e2b39f',eye:'#c7822e',brow:'#2a2230',mood:'smile'})}
  <path d="M37,60 C36,40 46,31 60,31 C74,31 84,40 83,60 C80,50 76,45 72,42 C70,50 64,54 58,55 C62,50 62,46 60,43 C56,50 48,54 42,55 C43,51 42,49 41,49 Z" fill="#1d1a26"/>
  ${shine('M44,40 Q60,33 76,40 Q72,42 60,40 Q48,42 44,40 Z','#6f6a8c')}
  ${strands('#3b3650',['M52,36 Q49,46 44,53','M66,36 Q70,46 76,52','M60,34 Q61,42 58,52'])}
  <path d="M100,118 q-4,-8 0,-14 q4,-7 0,-14" stroke="#fff" stroke-width="2" fill="none" opacity=".25" stroke-linecap="round"/>`,

 // 広告塔の整備士。看板の光を背に、キャップにゴーグル、頬に油汚れ。
 ren:()=>`
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#060e21"/><stop offset=".7" stop-color="#26122d"/><stop offset="1" stop-color="#57203d"/></linearGradient>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="70" y="8" width="44" height="30" rx="2" fill="#10182c" stroke="#66f7dd" stroke-width="1.6"/><path d="M76,18 h20 M76,26 h30 M76,32 h14" stroke="#66f7dd" stroke-width="2.4" opacity=".8"/>
  <rect x="4" y="30" width="18" height="56" fill="#1a1024" stroke="#ff3974" stroke-width="1.4"/><path d="M8,40 h10 M8,50 h10 M8,60 h10 M8,70 h10" stroke="#ff3974" stroke-width="2.4" opacity=".7"/>
  <path d="M0,96 L120,90" stroke="#44505b" stroke-width="3"/>
  ${rain('#66f7dd',22,37)}
  <path d="M36,58 C34,74 38,90 44,96 L48,80 Z M84,58 C86,74 82,90 76,96 L72,80 Z" fill="#3a2a28"/>
  <path d="M12,132 C14,111 32,103 50,100 L70,100 C88,103 106,111 108,132 Z" fill="#92776c"/>
  <path d="M50,100 L46,114 L60,106 L74,114 L70,100 Z" fill="#7a6258"/><rect x="56" y="112" width="8" height="20" fill="#6a544b"/>
  <path d="M28,132 L30,114" stroke="#d8c26a" stroke-width="3"/><circle cx="92" cy="118" r="3.4" fill="#44505b" stroke="#c9d1d8" stroke-width="1"/>
  ${face({skin:'#f1cfb6',shade:'#d6a88f',eye:'#2fb9ad',brow:'#3a2a28',mood:'soft'})}
  <ellipse cx="75" cy="82" rx="4.5" ry="1.6" fill="#44505b" opacity=".45"/>
  <path d="M36,62 C38,50 42,48 46,47 L44,60 L50,50 L52,58 L58,49 L62,57 L67,48 L70,57 L75,48 L78,58 L84,62 C86,50 80,44 60,43 C40,44 34,50 36,62 Z" fill="#3a2a28"/>
  ${strands('#5b4640',['M50,50 L46,60','M67,50 L71,58'])}
  <path d="M34,48 C34,28 48,22 60,22 C74,22 88,28 86,48 Z" fill="#2c3d4f"/><path d="M34,48 Q60,40 86,48 L100,52 Q98,56 86,54 Q60,46 34,54 Z" fill="#22303f"/>
  <rect x="40" y="31" width="40" height="11" rx="5.5" fill="#1a1f28"/><circle cx="50" cy="36.5" r="5" fill="#66f7dd" opacity=".85"/><circle cx="70" cy="36.5" r="5" fill="#66f7dd" opacity=".85"/><circle cx="48.5" cy="35" r="1.6" fill="#fff"/><circle cx="68.5" cy="35" r="1.6" fill="#fff"/>
  <path d="M58,24 h4 v6 h-4 Z" fill="#ff3974"/>`,

 // 廃船修理屋。溶接の火花と錆びた船体、白髪まじりの年配、額にルーペ。
 oru:()=>`
  <radialGradient id="bg" cx=".75" cy=".3" r=".9"><stop offset="0" stop-color="#8a5a3c"/><stop offset=".45" stop-color="#3a2f33"/><stop offset="1" stop-color="#0a101b"/></radialGradient>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <path d="M0,20 L40,12 L40,74 L0,80 Z" fill="#2a2d35"/><path d="M0,34 L40,28 M0,52 L40,47" stroke="#6d6d73" stroke-width="1.4"/><circle cx="8" cy="24" r="1.4" fill="#6d6d73"/><circle cx="30" cy="20" r="1.4" fill="#6d6d73"/><circle cx="8" cy="68" r="1.4" fill="#6d6d73"/>
  <path d="M90,8 L120,4 L120,70 L96,66 Z" fill="#343038"/><path d="M96,24 L120,22 M96,44 L120,42" stroke="#73655a" stroke-width="1.4"/>
  ${[[100,86],[106,78],[94,74],[110,92],[88,82]].map(([x,y],i)=>`<path d="M${x},${y} l${i%2?5:-4},${-6+i}" stroke="#ffd4a0" stroke-width="1.2" stroke-linecap="round"/>`).join('')}
  <circle cx="98" cy="84" r="5" fill="#ff8c6b" opacity=".45"/>
  <path d="M10,132 C12,110 30,102 50,99 L70,99 C90,102 108,110 110,132 Z" fill="#8b8880"/>
  <path d="M50,99 C52,108 68,108 70,99 L72,103 C68,114 52,114 48,103 Z" fill="#6d6b64"/><path d="M26,132 L32,108 L42,104 L44,132 Z M94,132 L88,108 L78,104 L76,132 Z" fill="#5b5953"/>
  <rect x="80" y="112" width="10" height="4" fill="#ffd4a0" opacity=".8"/>
  ${face({skin:'#ecc7ad',shade:'#cf9f86',eye:'#6b8f9a',brow:'#c9c4bb',mood:'sleepy',blush:'#d98870'})}
  <path d="M39,70 Q40,86 48,93 Q54,99 60,99 Q66,99 72,93 Q80,86 81,70 L79,72 Q78,84 72,90 Q68,91 66,89 Q60,91 54,89 Q52,91 48,90 Q42,84 41,72 Z" fill="#c9c4bb"/><path d="M54,89.5 Q60,94 66,89.5 Q60,92 54,89.5 Z" fill="#aeaaa3"/><path d="M52,83 Q56,81 59,82.6 M61,82.6 Q64,81 68,83" stroke="#c9c4bb" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M40,64 l3,1.4 M80,64 l-3,1.4" stroke="#b48870" stroke-width=".9" stroke-linecap="round"/>
  
  <path d="M36,66 C33,46 42,36 60,36 C78,36 87,46 84,66 C82,56 80,52 76,49 C70,53 60,53 52,50 C46,52 40,56 36,66 Z" fill="#aeaaa3"/>
  ${shine('M46,41 Q60,37 74,41 Q60,43 46,41 Z','#e6e2da')}
  ${strands('#7f7b75',['M50,40 Q46,46 42,54','M70,40 Q75,46 79,55'])}
  <path d="M34,46 C34,30 48,24 60,24 C72,24 86,30 86,46 C74,42 46,42 34,46 Z" fill="#4c4a45"/><path d="M32,46 Q60,38 88,46 L88,50 Q60,42 32,50 Z" fill="#3a3834"/>
  <circle cx="72" cy="36" r="7" fill="#1e2228" stroke="#c9a46a" stroke-width="2"/><circle cx="72" cy="36" r="4.6" fill="#8cf1df" opacity=".6"/><circle cx="70" cy="34" r="1.5" fill="#fff"/>`,

 // 船具の補給係。光る海とドーム、巨大な星。潮風になびく青緑の髪と襟のスカーフ、船乗り帽。
 nagi:()=>`
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#041425"/><stop offset=".55" stop-color="#064358"/><stop offset="1" stop-color="#14807f"/></linearGradient>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="22" cy="28" r="24" fill="#a1c5b6" opacity=".85"/><path d="M-2,26 Q22,20 46,30" stroke="#71fff0" stroke-width="1.4" opacity=".6" fill="none"/>
  <path d="M68,70 Q94,26 120,40 L120,72 Z" fill="none" stroke="#bbe9b6" stroke-width="1" opacity=".5"/>
  <path d="M0,96 Q30,90 60,96 T120,94 L120,132 L0,132 Z" fill="#0f5c66" opacity=".7"/><path d="M4,102 q10,-3 20,0 M76,100 q12,-3 24,0" stroke="#71fff0" stroke-width="1.2" opacity=".6" fill="none"/>
  <path d="M84,56 C98,60 108,52 116,58 C106,64 96,66 84,62 Z M36,58 C24,64 14,60 6,66 C16,70 28,68 38,64 Z" fill="#2f7f8f"/>
  <path d="M38,60 C34,78 36,94 42,100 L48,78 Z M82,60 C88,76 86,92 80,98 L72,78 Z" fill="#2f7f8f"/>
  <path d="M12,132 C14,111 32,103 50,100 L70,100 C88,103 106,111 108,132 Z" fill="#748f99"/>
  <path d="M42,102 L60,116 L78,102 L86,108 L60,124 L34,108 Z" fill="#eef4f0"/><path d="M52,112 L60,128 L68,112 Z" fill="#e0564f"/><path d="M68,110 C80,114 92,110 100,116 C90,120 80,118 70,116 Z" fill="#e0564f"/>
  ${face({skin:'#f0c9a8',shade:'#d49d80',eye:'#1fb5c9',brow:'#1f5561',mood:'soft',blush:'#ef8c7c'})}
  <path d="M36,64 C34,46 44,38 60,38 C78,38 88,46 84,64 C82,56 80,52 78,50 L74,58 L70,49 L64,56 L60,46 L54,56 L50,48 L46,57 L42,50 C40,54 38,58 36,64 Z" fill="#2f7f8f"/>
  ${shine('M46,44 Q60,40 74,44 Q60,47 46,44 Z','#9ff4ea')}
  ${strands('#1f5561',['M60,46 L60,54','M70,49 L73,56','M50,48 L47,56'])}
  <path d="M34,48 C36,32 48,26 60,26 C72,26 84,32 86,48 Q60,40 34,48 Z" fill="#f2f5f2"/><path d="M32,48 Q60,40 88,48 L88,53 Q60,45 32,53 Z" fill="#1f3a4c"/><path d="M40,34 Q60,28 80,34" stroke="#b9c9cc" stroke-width="1.2" fill="none"/>
  <path d="M55,36 l5,-4 l5,4 l-5,4 Z" fill="#e0b64a"/>`,

 // 麓の資材係。夕暮れの断崖、ヘルメットとバンダナ、頬の粉塵、首に下げた防塵マスク。
 toma:()=>`
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#191826"/><stop offset=".55" stop-color="#403447"/><stop offset="1" stop-color="#b8744c"/></linearGradient>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="24" cy="26" r="20" fill="#ffd690" opacity=".2"/><circle cx="24" cy="26" r="12" fill="#ffd690" opacity=".8"/>
  <path d="M0,40 L18,34 L26,60 L40,66 L40,132 L0,132 Z" fill="#4d3a43"/><path d="M120,50 L100,56 L94,78 L82,84 L82,132 L120,132 Z" fill="#423338"/>
  <path d="M100,56 L96,40 M104,54 L104,20" stroke="#83715f" stroke-width="1.6"/><rect x="100" y="14" width="8" height="10" fill="#ffd690" opacity=".7"/>
  ${[[10,20],[30,44],[88,34],[112,96],[20,108]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1" fill="#ffd690" opacity=".6"/>`).join('')}
  <path d="M12,132 C14,111 32,103 50,100 L70,100 C88,103 106,111 108,132 Z" fill="#ac9276"/>
  <path d="M30,132 L34,110 M90,132 L86,110" stroke="#e0a04a" stroke-width="4"/><path d="M34,112 l0,6 M86,112 l0,6" stroke="#fff4c8" stroke-width="4" opacity=".7"/>
  <path d="M46,100 Q60,112 74,100 Q72,108 60,112 Q48,108 46,100 Z" fill="#5b6a5f"/><circle cx="60" cy="106" r="3.6" fill="#3d4a42"/><circle cx="60" cy="106" r="1.4" fill="#8c9a8e"/>
  ${face({skin:'#e9bb98',shade:'#c9916f',eye:'#8a6a2c',brow:'#4a2e22',mood:'soft',blush:'#e0876a'})}
  <ellipse cx="44" cy="81" rx="3.6" ry="1.8" fill="#b58a6c" opacity=".35"/><circle cx="76" cy="78" r="2.2" fill="#c9a88c" opacity=".7"/><circle cx="72" cy="81" r="1.2" fill="#c9a88c" opacity=".7"/>
  <path d="M36,62 C36,50 40,46 44,45 L46,54 L52,48 L56,55 L62,47 L66,55 L72,48 L76,56 L80,50 C82,54 84,58 84,62 C88,46 80,40 60,40 C40,40 32,46 36,62 Z" fill="#5a3726"/>
  ${strands('#3b2219',['M52,48 L49,56','M72,48 L75,56'])}
  <path d="M36,46 L84,46 L84,40 L36,40 Z" fill="#c75d3a"/><path d="M84,42 l10,4 l-3,6 Z" fill="#c75d3a"/><circle cx="46" cy="43" r="1" fill="#f3d9b0"/><circle cx="58" cy="43" r="1" fill="#f3d9b0"/><circle cx="70" cy="43" r="1" fill="#f3d9b0"/>
  <path d="M34,42 C34,24 46,18 60,18 C74,18 86,24 86,42 Z" fill="#e8b33c"/><path d="M30,42 Q60,34 90,42 L90,46 Q60,38 30,46 Z" fill="#c8922a"/><path d="M58,19 h4 v16 h-4 Z" fill="#c8922a"/><path d="M42,28 Q50,22 58,21" stroke="#fff3c4" stroke-width="2" opacity=".6" fill="none" stroke-linecap="round"/>`,

 // 共同温室の作業係。木漏れ日と桜色の花びら、葉を編み込んだ三つ編み、土のついたエプロン。
 sui:()=>`
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#244f56"/><stop offset=".6" stop-color="#3f6c5d"/><stop offset="1" stop-color="#899785"/></linearGradient>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <path d="M0,0 L30,0 L6,60 Z" fill="#ffe7a1" opacity=".16"/><path d="M80,0 L104,0 L118,70 Z" fill="#ffe7a1" opacity=".14"/>
  ${[[8,20,20],[102,18,-30],[16,74,40],[108,62,10],[90,34,60],[26,40,-10]].map(([x,y,r])=>`<ellipse cx="${x}" cy="${y}" rx="7" ry="4" fill="#2b5758" transform="rotate(${r} ${x} ${y})"/>`).join('')}
  ${[[20,12],[96,48],[12,52],[106,86],[30,94],[84,14],[70,8]].map(([x,y],i)=>`<path d="M${x},${y} q3,-3 5,0 q-2,4 -5,0 Z" fill="#faa2c3" transform="rotate(${i*40} ${x} ${y})"/>`).join('')}
  <path d="M60,30 C30,30 28,56 32,86 L40,90 C36,64 42,44 60,42 C78,44 84,64 80,90 L88,86 C92,56 90,30 60,30 Z" fill="#35523f"/>
  <path d="M82,70 C92,84 90,100 84,118" stroke="#35523f" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M82,78 q6,2 7,6 M84,90 q6,2 6,7 M84,102 q5,2 5,7" stroke="#223a2c" stroke-width="1.2" fill="none"/>
  <ellipse cx="83" cy="120" rx="4" ry="2.4" fill="#faa2c3"/><path d="M86,112 q6,-4 10,0 q-5,4 -10,0 Z" fill="#93e9ba"/>
  <path d="M12,132 C14,111 32,103 50,100 L70,100 C88,103 106,111 108,132 Z" fill="#8c9f81"/>
  <path d="M44,104 L60,112 L76,104 L78,132 L42,132 Z" fill="#e9dfc8"/><path d="M44,104 L40,100 M76,104 L80,100" stroke="#e9dfc8" stroke-width="2.4"/><ellipse cx="52" cy="124" rx="4" ry="2" fill="#8a6a4a" opacity=".5"/><rect x="64" y="114" width="8" height="10" rx="1" fill="#d7ccb1"/><path d="M68,114 v-6 M66,110 l2,-2 l2,2" stroke="#4f8a5b" stroke-width="1.4" fill="none"/>
  ${face({skin:'#f8e0cf',shade:'#e0b7a0',eye:'#3f9b6a',brow:'#35523f',mood:'soft',blush:'#f39aa6'})}
  <path d="M37,64 C35,44 44,36 60,36 C76,36 85,44 83,64 C80,54 74,48 66,46 C66,50 64,53 62,55 C60,50 56,47 50,47 C48,52 44,56 40,58 Z" fill="#35523f"/>
  ${shine('M45,42 Q60,38 75,42 Q60,45 45,42 Z','#7fb58d')}
  ${strands('#223a2c',['M62,40 Q62,48 62,55','M52,42 Q48,50 42,56','M72,42 Q76,48 80,56'])}
  <path d="M40,44 q6,-8 14,-6 q-6,6 -14,6 Z" fill="#93e9ba"/><circle cx="44" cy="40" r="3.4" fill="#faa2c3"/><circle cx="44" cy="40" r="1.2" fill="#ffe7a1"/><circle cx="37" cy="46" r="2.4" fill="#faa2c3"/>`
};

const cache=new Map();
export function portraitSrc(id){
 if(!PORTRAITS[id])return null;
 if(!cache.has(id)){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${PORTRAITS[id]()}</svg>`;
  cache.set(id,'data:image/svg+xml,'+encodeURIComponent(svg.replace(/\s*\n\s*/g,' ')));
 }
 return cache.get(id);
}
export const PORTRAIT_IDS=Object.keys(PORTRAITS);
