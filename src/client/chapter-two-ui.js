const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
export function createChapterTwoUI(send,refresh){
 let selection=null;
 return {reset(){selection=null;},render(s,body,blocked,here){
  const v=s.chapterTwoView;if(!v?.unlocked)return;
  const box=node('section','trade-supply');box.append(node('h3','','第二章 · 違う場所の使い方'),node('p','trade-status',v.hint));
  const button=(label,fn,disabled=false)=>{const b=node('button','subtle-button',label);b.type='button';b.disabled=blocked||disabled;b.onclick=fn;return b;};
  const command=(type,p={})=>{selection=null;send(type,p);};
  const select=(type,item)=>{selection={type,item};refresh();};
  if(selection){
   const {type,item}=selection,o=v.offers.find(o=>o.id===item);
   if(type==='chapter2.decide')box.append(node('p','','今回は容器を扱わない、とトマへ伝えます。今ある小箱での仕事は続きます。この判断は帳面に残ります。'),button('今回は扱わないと伝える',()=>command(type,{decision:'declined'}),!here||s.location.world!=='gorge'));
   else if(o){
    const amount=type.endsWith('.buy')?-o.cost:type.endsWith('.sell')?o.price:o.cost;
    const label=type.endsWith('.buy')?'ナギから仕入れる':type.endsWith('.sell')?'トマへ売る':'ナギへ返却する';
    box.append(node('h4','',o.name),node('p','',o.purpose),node('p','trade-spec',o.spec),node('p','trade-total','所持金 '+s.commerce.cash+' → '+(s.commerce.cash+amount)+' cr'),node('p','trade-hint',type.endsWith('.sell')?'峡谷の作業場へ売却します。次の再訪で、使われ方を確かめられます。':'未販売なら、蒼海で仕入れ値の全額を返してもらえます。'),button(label+' · 確定',()=>command(type,type.endsWith('.buy')?{item}:{}),!here));
   }
   box.append(button('まだ決めない',()=>{selection=null;refresh();}));body.append(box);return;
  }
  if(s.location.world==='gorge')box.append(node('p','trade-cargo',v.scene));
  if(v.resultHeard)box.append(node('p','trade-status','第二章の振り返りは帳面に残っています。旅の手帳で、使われていた場所を読み返せます。'));
  if(v.needsHeard)box.append(node('p','','トマの用途：粉塵を避ける保管。小型は上の作業場へ、大型は麓へ。買い取りはどちらか一組。'));
  if(v.supplyHeard||v.needsHeard)for(const o of v.offers){
   const card=node('article','trade-offer');card.append(node('h4','',o.name),node('p','',o.purpose),node('p','trade-spec',o.spec),node('p','','仕入れ '+o.cost+' → 売価 '+o.price+' cr ／ 差額 +'+(o.price-o.cost)+' cr'));
   if(s.location.world==='pelagic'&&here&&v.supplyHeard&&v.delivery==='none'&&v.decision!=='declined'&&!v.cargo){
    card.append(button('この容器を確認する',()=>select('chapter2.buy',o.id),!v.needsHeard||!!s.tradeView.cargoItem||s.commerce.cash<o.cost));
   }box.append(card);
  }
  if(!v.needsHeard)box.append(node('p','trade-hint','仕入れる前に、峡谷でトマの話を最後まで聞く。品物を見るだけでは約束になりません。'));
  if(v.cargo&&here){
   if(s.location.world==='pelagic')box.append(button('未販売の容器を返す',()=>select('chapter2.return',v.cargo)));
   if(s.location.world==='gorge')box.append(button('トマへ容器を見せる',()=>select('chapter2.sell',v.cargo)));
  }
  if(v.needsHeard&&!v.cargo&&v.delivery==='none'&&v.decision!=='declined'&&here&&s.location.world==='gorge')box.append(button('今回は扱わない',()=>select('chapter2.decide')),button('まだ考える',()=>command('chapter2.decide',{decision:'considering'})));
  body.append(box);
 }};
}
