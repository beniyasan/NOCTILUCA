const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
export function createChapterThreeUI(send,refresh){
 let selected=null;
 return {reset(){selected=null;},render(s,body,blocked,here){
  const v=s.chapterThreeView;if(!v?.unlocked)return;
  const o=v.offer,world=s.location.world,box=node('section','trade-supply');
  box.append(node('h3','','第三章 · 渡したあとは'),node('p','trade-status',v.hint));
  const button=(label,fn,disabled=false)=>{const b=node('button','subtle-button',label);b.type='button';b.disabled=blocked||disabled;b.onclick=fn;return b;};
  const command=(type,p={})=>{selected=null;send(type,p);};
  const choose=type=>{selected=type;refresh();};
  if(selected){
   if(selected==='chapter3.decide'){
    box.append(node('p','','今回はラックを扱わない、とスイへ伝えます。スイは今ある木箱で仕事を続けます。この判断は帳面に残ります。'),button('今回は扱わないと伝える',()=>command(selected,{decision:'declined'}),!here||world!=='jade'));
   }else if(selected==='chapter3.leave'){
    box.append(node('p','','今回は使い方をたずねず、見た様子だけを帳面に残します。理由を聞いた記録は付きません。'),button('今回はたずねず、見た様子を残す',()=>command('chapter3.respond',{choice:'leave'}),!here||world!=='jade'));
   }else{
    const amount=selected.endsWith('.buy')?-o.cost:selected.endsWith('.sell')?o.price:o.cost;
    const label=selected.endsWith('.buy')?'オルから仕入れる':selected.endsWith('.sell')?'スイへ売る':'オルへ返却する';
    box.append(node('h4','',o.name),node('p','',o.purpose),node('p','trade-spec',o.spec),node('p','trade-total','所持金 '+s.commerce.cash+' → '+(s.commerce.cash+amount)+' cr'),node('p','trade-hint',selected.endsWith('.sell')?'翡翠の作業場へ売却します。使う場所や片付け方は、スイが決めます。':'未販売なら、オルへ仕入れ値で返却できます。'),button(label+' · 確定',()=>command(selected),!here));
   }
   box.append(button('まだ決めない',()=>{selected=null;refresh();}));body.append(box);return;
  }
  if(world==='jade'&&(v.delivery==='installed'||v.decision==='declined'))box.append(node('p','trade-cargo',v.scene));
  if(v.note)box.append(node('p','trade-status',v.note));
  if(v.needsHeard&&v.delivery==='none'&&v.decision!=='declined'){
   box.append(node('h4','',o.name),node('p','',o.purpose),node('p','trade-spec',o.spec),node('p','','仕入れ '+o.cost+' → 売価 '+o.price+' cr ／ 差額 +'+(o.price-o.cost)+' cr'));
   if(here&&v.cargo){
    if(world==='scrap')box.append(button('未販売のラックを返す',()=>choose('chapter3.return')));
    if(world==='jade')box.append(button('スイへラックを見せる',()=>choose('chapter3.sell')));
   }else if(here){
    if(world==='scrap'&&v.supplyHeard)box.append(button('ラックを確認する',()=>choose('chapter3.buy'),!!s.tradeView.cargoItem||s.commerce.cash<o.cost));
    if(world==='jade')box.append(button('今回は扱わない',()=>choose('chapter3.decide')),button('まだ考える',()=>command('chapter3.decide',{decision:'considering'})));
   }
  }
  if(world==='jade'&&here&&v.delivery==='installed'){
   if(!v.observed)box.append(button('見た様子を帳面に控える',()=>command('chapter3.observe')));
   else if(!v.resolved)box.append(button('使い方をスイに聞く',()=>command('chapter3.respond',{choice:'ask'})),button('今回はたずねない',()=>choose('chapter3.leave')),button('まだ考える',()=>command('chapter3.respond',{choice:'considering'})));
  }
  body.append(box);
 }};
}
