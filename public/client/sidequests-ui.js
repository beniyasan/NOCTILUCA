const $=id=>document.getElementById(id);
const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
export function createSidequestsUI(g,engine){
 const dialog=$('sidequests-dialog'),body=$('sidequests-body');let selection=null,busy=false,error='',notice='',response=[];
 const labels={available:'まだ聞いていない話',offered:'条件を聞いた',accepted:'引き受けた',carrying:'荷物を運んでいる',informed:'話を持ち帰る',completed:'仕事を終えた'};
 const button=(text,fn,disabled=false,key=text)=>{const b=node('button','subtle-button',text);b.type='button';b.disabled=disabled;b.dataset.questAction=key;b.onclick=fn;return b;};
 function open(){engine.talk.close();engine.setHeld();selection=null;error='';if(!dialog.open)dialog.showModal();render();}
 async function send(type,quest){
  if(busy||g.busy||g.blocked)return;busy=true;error='';render();
  try{const r=await g.send('sidequest.'+type,type==='close'?{}:{quest});notice=r.outcome.questNotice||'';response=r.outcome.questLines||[];selection=null;}
  catch(e){error=e.message;}finally{busy=false;render();}
 }
 function render(){
  const s=g.snapshot.state,v=s.sidequestView;if(!v||!dialog.open)return;
  const focused=document.activeElement?.dataset?.questAction,blocked=busy||g.busy||g.blocked||!!s.narrative.active||!!engine.state.transition;
  body.replaceChildren();
  body.append(node('p','trade-cargo','所持金 '+s.commerce.cash+' cr ／ '+(s.tradeView.cargoItem?(s.tradeView.cargoItem.entrusted?'預かり荷物：':'荷物：')+s.tradeView.cargoItem.name:'荷物棚は空いている。')));
  if(!g.authenticated)body.append(node('p','trade-hint','ゲストの記録は、ページを閉じると消えます。旅の記録からログインすると保存できます。'));
  if(error||g.blocked)body.append(node('p','trade-error',error||'保存は未確認です。旅の記録から同じ操作を再試行してください。'));
  if(notice){body.append(node('p','trade-notice',notice));for(const text of response)body.append(node('p','quest-response',text));}
  if(v.active){
   const a=v.active;body.append(node('p','quest-meta',a.title+' ／ '+(a.line+1)+'・'+a.total),node('h3','',a.speaker),node('p','quest-dialogue',a.text));
   body.append(button(a.line+1<a.total?(a.machine?'続きを読む':'続きを聞く'):(a.machine?'記録を読み終える':'話を聞き終える'),()=>send('next',a.quest),blocked||s.suspended,'next'),button('いったん話を閉じる',()=>send('close'),blocked,'close-talk'));
  }else if(selection){
   const q=v.quests.find(q=>q.id===selection.quest),type=selection.type;
   const amount=type==='buy'?-q.cost:type==='return'&&q.kind!=='配送'?q.cost:type==='deliver'?q.payment:0;
   body.append(node('h3','',q.title),node('p','',type==='cancel'?'今回は取りやめると伝えます。後で同じ条件で引き受け直せます。':type==='return'?q.kind==='配送'?q.owner+'へ預かり荷物を返します。運賃は発生しません。':'購入した相手へ、未使用の品を仕入れ値で返します。':type==='accept'?q.kind==='配送'?q.item+'を預かります。荷物棚を一つ使い、'+q.contact+'への引き渡しで運賃'+q.payment+' crを受け取ります。':'期限のない依頼です。行き先と条件を帳面に残します。':type==='buy'?q.item+'を一つ購入します。未使用のままなら、購入した駅で返品できます。':q.kind==='情報収集'?q.contact+'から聞いた話を'+q.owner+'に伝えます。':q.kind==='配送'?q.sourceName+'の'+q.contact+'に、'+q.owner+'から預かった'+q.item+'を渡します。':q.owner+'へ '+q.item+'を渡します。'));
   if(amount)body.append(node('p','trade-total','所持金 '+s.commerce.cash+' → '+(s.commerce.cash+amount)+' cr'));
   const action=q.actions.find(a=>a.type===type);
   body.append(button('この内容で確定する',()=>send(type,q.id),blocked||!q.here||!action||!!action.unavailable,'confirm'),button('まだ決めない',()=>{selection=null;render();},blocked,'back'));
  }else{
   if(s.location.mode!=='station'||!s.location.atStation||s.suspended)body.append(node('p','trade-hint','相手と話したり荷物を渡したりするときは、旅を再開し、駅で下車してください。'));
   body.append(node('p','trade-hint','立ち寄った駅で引き受ける、小さな商いと運び仕事。期限はありません。'));
   const visible=v.quests.filter(q=>q.visible),unfinished=visible.filter(q=>q.stage!=='completed').sort((a,b)=>Number(b.origin===s.location.world)-Number(a.origin===s.location.world)),finished=visible.filter(q=>q.stage==='completed');
   for(const q of unfinished)card(q,body,blocked);
   if(v.lockedReason)body.append(node('p','trade-hint',v.lockedReason));
   else if(!visible.length)body.append(node('p','','各駅で下車すると、その駅の依頼の話を聞けます。'));
   if(finished.length){const history=node('details','trade-history');history.append(node('summary','','済んだ仕事と、その後の話'));for(const q of finished)card(q,history,blocked);body.append(history);}
  }
  if(focused)body.querySelector('[data-quest-action="'+CSS.escape(focused)+'"]')?.focus({preventScroll:true});
 }
 function card(q,target,blocked){
  const box=node('article','trade-offer quest-card');box.append(node('p','quest-meta',q.originName+' · '+q.kind+' ／ '+labels[q.stage]),node('h3','',q.title),node('p','',q.owner+' · '+q.ownerRole));
  box.append(node('p','trade-spec','行き先：'+q.sourceName+' ／ '+q.contact));
  box.append(node('p','trade-total',q.cost?'購入 '+q.cost+' cr → 受取 '+q.payment+' cr ／ 利益 '+(q.payment-q.cost)+' cr':(q.kind==='配送'?'運賃 ':'聞き取りの謝礼 ')+q.payment+' cr'));
  box.append(node('p','trade-status',q.hint));
  for(const a of q.actions){if(a.unavailable)box.append(node('p','trade-hint',a.unavailable));box.append(button(a.label,()=>{error='';notice='';response=[];if(a.type==='talk')send('talk',q.id);else{selection={quest:q.id,type:a.type};render();}},blocked||!q.here||!!a.unavailable,q.id+':'+a.type));}
  if(q.receipt)box.append(node('p','trade-spec','受取済み '+q.receipt.amount+' cr ／ '+(q.installed.includes(q.origin)?q.originName+'に、仕事の続きが残っている。':'次の訪問で、その後を確かめられる。')));
  target.append(box);
 }
 $('sidequests-open').addEventListener('click',open);$('sidequests-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{selection=null;error='';notice='';response=[];});
 g.addEventListener('change',e=>{if(['reload','guest','init','backup.restore','journey.reset'].includes(e.detail.reason)){selection=null;notice='';response=[];}render();});
 return {open};
}
