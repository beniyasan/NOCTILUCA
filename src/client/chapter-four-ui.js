const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
export function createChapterFourUI(send,refresh){
 let selected=null;
 return {reset(){selected=null;},render(s,body,blocked,here){
  const v=s.chapterFourView;if(!v?.unlocked)return;
  const o=v.offer,world=s.location.world,box=node('section','trade-supply');
  box.append(node('h3','','第四章 · 返事のない仕事'),node('p','trade-status',v.hint));
  const button=(label,fn,disabled=false)=>{const b=node('button','subtle-button',label);b.type='button';b.disabled=blocked||disabled;b.onclick=fn;return b;};
  const command=(type,p={})=>{selected=null;send(type,p);};
  const choose=type=>{selected=type;refresh();};
  if(selected){
   if(selected==='chapter4.decide')box.append(node('p','','この受付には、今回は持ち込まないと記録します。定期便による調達と現在の清掃は続きます。保留なら「まだ決めない」で戻れます。'),button('持込なし、と記録する',()=>command(selected,{decision:'declined'}),!here||world!=='relay'));
   else {
    const amount=selected.endsWith('.buy')?-o.cost:selected.endsWith('.sell')?o.price:o.cost;
    const label=selected.endsWith('.buy')?'オルから仕入れる':selected.endsWith('.sell')?'資材受付へ納品する':'オルへ返却する';
    box.append(node('h4','',o.name),node('p','trade-spec',o.spec),node('p','trade-total','所持金 '+s.commerce.cash+' → '+(s.commerce.cash+amount)+' cr'),node('p','trade-hint',selected.endsWith('.sell')?'適合品1組。検収と支払が確定すると受領票が残ります。交換は保守の作業順に行われます。':'未納品のブラシは、オルへ仕入れ値の全額で返却できます。'),button(label+' · 確定',()=>command(selected),!here));
   }
   box.append(button('まだ決めない',()=>{selected=null;refresh();}));body.append(box);return;
  }
  if(world==='relay'||v.orderRead){
   const terminal=node('article','relay-terminal');terminal.setAttribute('aria-label',v.terminal);
   terminal.append(node('h4','',world==='relay'?v.terminal:'保守端末の控え'),node('p','',v.orderId+' ／ '+o.name),node('p','trade-spec',o.spec),node('p','',o.purpose));
   for(const line of v.conditions)terminal.append(node('p','',line));
   if(v.orderRead)terminal.append(node('p','trade-status',v.status));
   if(!v.orderRead&&here&&world==='relay')terminal.append(button('規格と受入条件を控える',()=>command('chapter4.read')));
   if(v.orderRead&&!v.cargo&&v.delivery==='none'&&v.decision!=='declined'&&here&&world==='relay')terminal.append(button('今回は扱わない',()=>choose('chapter4.decide')),button('まだ考える',()=>command('chapter4.decide',{decision:'considering'})));
   if(v.cargo&&here&&world==='relay')terminal.append(button('受付へ交換ブラシを入れる',()=>choose('chapter4.sell')));
   if(v.decision==='declined')terminal.append(node('p','trade-status','この持込記録：持込なし ／ 受領票：なし'));
   box.append(terminal);
  }
  if(v.receipt){const receipt=node('article','relay-receipt');receipt.append(node('h4','','受領票 '+v.receipt.number),node('p','',v.receipt.item+' · 1組'),node('p','','検収：完了 ／ 支払：'+v.receipt.amount+' cr'),node('p','trade-spec',v.receipt.spec));box.append(receipt);}
  if(v.orderRead&&v.supplyHeard&&v.delivery==='none'&&v.decision!=='declined'){
   box.append(node('p','','仕入れ '+o.cost+' → 受入額 '+o.price+' cr ／ 差額 +'+(o.price-o.cost)+' cr'));
   if(here&&world==='scrap')box.append(v.cargo?button('未納品のブラシを返す',()=>choose('chapter4.return')):button('交換ブラシを確認する',()=>choose('chapter4.buy'),!!s.tradeView.cargoItem||s.commerce.cash<o.cost));
  }
  if(world==='relay'&&(v.delivery==='installed'||v.decision==='declined')){
   box.append(node('p','trade-cargo',v.scene));
   if(!v.observed&&here)box.append(button('運転の記録を帳面に残す',()=>command('chapter4.observe')));
  }
  if(v.note)box.append(node('p','trade-status',v.note));
  body.append(box);
 }};
}
