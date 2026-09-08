import {createChapterFourUI} from './chapter-four-ui.js';
import {createChapterThreeUI} from './chapter-three-ui.js';
import {createChapterTwoUI} from './chapter-two-ui.js';
const $=id=>document.getElementById(id);
const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
export function createCommerceUI(g,engine){
 const dialog=$('commerce-dialog'),body=$('commerce-body');let selection=null,busy=false,error='',notice='';
 const snapshot=()=>g.snapshot.state;
 const chapterTwo=createChapterTwoUI(confirmTrade,render),chapterThree=createChapterThreeUI(confirmTrade,render),chapterFour=createChapterFourUI(confirmTrade,render);
 const button=(label,action,disabled=false,cls='subtle-button')=>{const b=node('button',cls,label);b.type='button';b.disabled=disabled;b.addEventListener('click',action);return b;};
 function open(){engine.talk.close();engine.setHeld();selection=null;chapterTwo.reset();chapterThree.reset();chapterFour.reset();error='';if(!dialog.open)dialog.showModal();render();}
 function render(){
  const s=snapshot(),c=s.tradeView,blocked=busy||g.busy||g.blocked;
  if(!c)return;
  const terminal=$('relay-open');terminal.hidden=!(s.chapterFourView?.unlocked&&s.location.world==='relay'&&s.location.mode==='station'&&s.location.atStation);terminal.disabled=blocked||s.suspended||!!engine.state.transition;
  $('commerce-wallet').textContent=c.cash+' cr · '+(c.cargoItem?'荷物 1 / 1':'荷物 0 / 1');
  if(!dialog.open&&!selection)return;
  body.replaceChildren();
  const money=node('div','trade-balance');money.append(node('span','','所持金'),node('strong','',c.cash+' cr'));body.append(money);
  body.append(node('p','trade-cargo',c.cargoItem?'荷物棚：'+c.cargoItem.name:'荷物棚：ひと箱ぶん、空いている。'));
  if(error)body.append(node('p','trade-error',error));if(notice)body.append(node('p','trade-notice',notice));
  if(g.blocked)body.append(node('p','trade-error','保存はまだ未確認です。商売帳を閉じ、右上の旅の記録から同じ操作を再試行してください。'));
  if(!g.authenticated)body.append(node('p','trade-hint','ゲストの旅です。ページを閉じると、この商いの記録も消えます。'));
  const here=s.location.mode==='station'&&s.location.atStation&&!s.suspended;
  if(selection){
   const second=selection.type.startsWith('followup.');
   if(selection.type==='followup.decide'){
    const box=node('article','trade-offer');box.append(node('h3','','今回は扱わない'),node('p','','この判断を相手に伝え、帳面に残します。相手は今の方法で暮らしを続けます。'),node('p','trade-hint','保留したいときは「まだ考える」を選んでください。'),button('今回は扱わないと伝える',()=>confirmTrade('followup.decide','declined'),blocked||!here,'primary-button'),button('戻る',()=>{selection=null;render();},blocked));body.append(box);return;
   }
   const offer=second?c.followupOffer:c.offers.find(o=>o.buyer===selection.buyer)||c.cargoItem;
   const {type}=selection,amount=type.endsWith('.buy')?-offer.cost:type.endsWith('.sell')?offer.price:offer.cost;
   const title=type.endsWith('.buy')?'オルから仕入れる':type.endsWith('.sell')?offer.person+'へ売る':'オルへ返却する';
   const box=node('article','trade-offer');box.append(node('h3','',offer.name),node('p','',offer.purpose),node('p','trade-spec',offer.spec),node('p','trade-total',(amount<0?'支払い ':'受け取り ')+Math.abs(amount)+' cr'),node('p','','所持金 '+c.cash+' → '+(c.cash+amount)+' cr'));
   box.append(node('p','trade-hint',type.endsWith('.sell')?'明細の宛名：'+offer.seller+'。取り付けは次の訪問で。':type.endsWith('.return')?'未販売の品を仕入れ値で戻します。':'用途を確認した品を一つ、荷物棚に積みます。'));
   box.append(button(title+' · 確定',()=>confirmTrade(type,offer.buyer),blocked||!here,'primary-button wide'),button('まだ決めない',()=>{selection=null;render();},blocked));body.append(box);return;
  }
  chapterFour.render(s,body,blocked,here);
  if(s.chapterFourView?.unlocked){const earlier=node('details','trade-history');earlier.append(node('summary','','第三章の商いを読み返す'));chapterThree.render(s,earlier,blocked,here);body.append(earlier);}else chapterThree.render(s,body,blocked,here);
  if(s.chapterThreeView?.unlocked){const earlier=node('details','trade-history');earlier.append(node('summary','','第二章の商いを読み返す'));chapterTwo.render(s,earlier,blocked,here);body.append(earlier);}else chapterTwo.render(s,body,blocked,here);
  const firstChapter=s.storyView?.endingSeen?node('details','trade-history'):body;
  if(firstChapter!==body){firstChapter.append(node('summary','','第一章の商い・九龍の未取引の品を見る'));body.append(firstChapter);}
  const known=node('section','trade-needs');known.append(node('h3','','九龍で聞いた用途'));
  for(const [buyer,name] of [['mei','メイ'],['ren','レン']]){
   const o=c.offers.find(o=>o.buyer===buyer),box=node('article','trade-offer');box.append(node('h4','',name));
   if(o)box.append(node('p','',o.purpose),node('p','trade-spec',o.spec),node('p','', '買取 '+o.price+' cr'));
   else box.append(node('p','trade-hint','本人に「商売の話」を聞くと、用途と予算を控えられます。'));
   if(c.installations[buyer]==='pending')box.append(node('p','trade-status','売却済み。取り付けは仕込み・整備のあと。別の星を訪れてから、九龍に戻る。'));
   if(c.installations[buyer]==='installed')box.append(node('p','trade-status',buyer==='mei'?(c.scene.tableOpen?'軒先で、小さな夜食台が使われている。':'夜食台の設備はある。今日は台を畳んで、店内で営業している。'):'足元の補助表示盤が、待ち合わせの目印になっている。'));
   if(here&&s.location.world==='kowloon'&&c.cargo===buyer)box.append(button(name+'へ品物を見せる',()=>select('trade.sell',buyer),blocked,'primary-button'));
   known.append(box);
  }firstChapter.append(known);
  if(!c.firstBuyer||(s.storyView?.endingSeen&&Object.values(c.installations).includes('none'))){
   const supply=node('section','trade-supply');supply.append(node('h3','','オルの作業台'));
   if(!c.known.mei||!c.known.ren)supply.append(node('p','trade-hint','まず九龍で、二人の用途と予算を聞いておく。話を聞くだけでは、約束にはならない。'));
   else if(s.location.world!=='scrap')supply.append(node('p','trade-hint',c.cargo?'九龍へ届ける。方針を変えるなら、スクラップ・ベルトのオルへ戻せる。':(s.storyView?.endingSeen?'もう一方の電源も扱うなら、スクラップ・ベルトのオルへ。今の章とは別に選べます。':'次の行き先はスクラップ・ベルト。下車してオルに商売の話を聞く。')));
   else if(!c.supplierKnown)supply.append(node('p','trade-hint','下車してオルに「商売の話」を聞く。用途に合わせて電源を選んでもらおう。'));
   else if(!here)supply.append(node('p','trade-hint','下車してから品物を確認できます。'));
   else if(c.cargo)supply.append(button('未販売の電源を返す · 80 cr',()=>select('trade.return',c.cargo),blocked));
   else if(c.known.mei&&c.known.ren)for(const o of c.offers.filter(o=>c.installations[o.buyer]==='none')){const box=node('article','trade-offer');box.append(node('h4','',o.name),node('p','trade-spec',o.spec),node('p','','仕入れ '+o.cost+' → 売価 '+o.price+' cr ／ 差額 +'+(o.price-o.cost)+' cr'),button('この電源を確認する',()=>select('trade.buy',o.buyer),blocked||c.cash<o.cost,'primary-button'));supply.append(box);}
   firstChapter.append(supply);
  }
  if(c.firstBuyer)renderFollowup(s,c,here,blocked,firstChapter);
  if(c.transactions.length){const ledger=node('section','trade-ledger');ledger.append(node('h3','','帳面に残った金額'));
   for(const t of [...c.transactions].reverse()){const row=node('p','trade-row');row.append(node('span','',(t.label|| (t.type==='chapter4.sell'?'納品':t.type.endsWith('.buy')?'仕入れ':t.type.endsWith('.sell')?'売却':'返却'))+' · '+t.item),node('strong','',(t.amount>0?'+':'')+t.amount+' cr'));ledger.append(row);}body.append(ledger);
  }
  body.append(node('p','trade-hint','今は買わずに、旅を続けても。街はいつもどおり。'));
 }
 function select(type,buyer){selection={type,buyer};error='';notice='';render();}
 function renderFollowup(s,c,here,blocked,target){
  const f=c.followup,o=c.followupOffer,who=c.firstBuyer==='mei'?'メイ':'レン';
  const box=node('section','trade-supply');box.append(node('h3','','明かりの届く範囲'));
  let hint;
  if(!f.observed)hint='最初の品が使われ始めたら、'+who+'に商売の話を聞く。';
  else if(!f.available)hint='使われ方を聞いた。別の星を訪れ、次の便で戻ったら、その後の暮らしを聞いてみる。';
  else if(!f.heard)hint=who+'に商売の話を聞く。使う人には、使う人の事情がある。';
  else if(f.resultHeard)hint=s.storyView?.endingSeen?'窓際の帳面に、使う相手の一行を残した。旅は続いている。':'九龍の列車に戻り、「ひと箱ぶんの帳面を開く」。最初の商いを振り返れる。';
  else if(f.decision==='declined')hint='今回は扱わないと決めた。'+who+'に商売の話を聞き、今の暮らしを確かめる。';
  else if(f.delivery==='pending')hint='品物を渡した。別の星を訪れて九龍に戻り、使い方を聞いてみる。';
  else if(f.delivery==='installed')hint='品物が使われ始めた。'+who+'に商売の話を聞き、その後を確かめる。';
  else if(f.cargo)hint='ひと箱を九龍へ。方針を変えるなら、売る前にオルへ戻せる。';
  else hint=f.decision==='considering'?'まだ考えている。周遊や雑談を続け、決まったら戻ってこられる。':'用途を聞いた。扱うかどうかは、まだ約束していない。';
  box.append(node('p','trade-status',hint));
  if(o){box.append(node('h4','',o.name),node('p','',o.purpose),node('p','trade-spec',o.spec),node('p','','買取予算 '+o.price+' cr'));
   if(f.supplierKnown)box.append(node('p','','仕入れ '+o.cost+' → 売価 '+o.price+' cr ／ 差額 +'+(o.price-o.cost)+' cr'));
   if(f.delivery==='none'&&f.decision!=='declined'){
    if(!f.cargo){
     if(s.location.world==='kowloon'&&here){box.append(button('今回は扱わない',()=>select('followup.decide',c.firstBuyer),blocked),button('まだ考える',()=>confirmTrade('followup.decide','considering'),blocked));}
     if(s.location.world==='scrap'&&here&&f.supplierKnown)box.append(button('この品を確認する',()=>select('followup.buy',c.firstBuyer),blocked||c.cash<o.cost,'primary-button'));
     else box.append(node('p','trade-hint','扱うなら、スクラップ・ベルトでオルに今回の用途を伝える。'));
    }else if(here){
     if(s.location.world==='scrap')box.append(button('未販売の品を返す · '+o.cost+' cr',()=>select('followup.return',c.firstBuyer),blocked));
     if(s.location.world==='kowloon')box.append(button(who+'へ品物を見せる',()=>select('followup.sell',c.firstBuyer),blocked,'primary-button'));
    }
   }
  }
  if(s.storyView?.ready&&here&&s.location.world==='kowloon')box.append(button('列車の窓際で、ひと箱ぶんの帳面を開く',()=>{dialog.close();engine.story?.open();},blocked,'primary-button'));
  target.append(box);
 }
 async function confirmTrade(type,buyer){if(busy||g.busy||g.blocked)return;if(type.endsWith('.buy')&&snapshot().sidequests?.cargo){error='寄り道の荷物を先に届けるか、受け取った駅へ戻してください。';render();return;}busy=true;error='';render();try{
  const payload=(type.startsWith('chapter2.')||type.startsWith('chapter3.')||type.startsWith('chapter4.'))?buyer:type==='followup.decide'?{decision:buyer}:type.startsWith('followup.')||type==='trade.return'?{}:{buyer};
  await g.send(type,payload);selection=null;
  notice=type==='chapter4.read'?'規格と受入条件を帳面に控えた。持込は、まだ約束していない。':type==='chapter4.observe'?'運転の記録を、帳面に残した。':type==='chapter4.sell'?'検収完了。支払と受領票を確認できます。':type==='chapter4.decide'?(buyer.decision==='declined'?'持込なし、と記録した。端末には定期清掃の記録が流れている。':'今は保留。受付に持込期限はない。'):type==='chapter3.observe'?'作業場で見た様子を控えた。理由は、まだ聞いていない。':type==='chapter3.respond'?(buyer.choice==='ask'?'スイに商売の話を聞いてみよう。':buyer.choice==='leave'?'見た様子だけを、帳面に残した。九龍の取引先へ寄ってみよう。':'今は保留。決まったら、この作業場へ戻ってこられる。'):(type==='followup.decide'||type==='chapter2.decide'||type==='chapter3.decide')?((type==='followup.decide'?buyer:buyer.decision)==='considering'?'保留を帳面に残した。まだ、約束はしていない。':'今回は扱わないと伝えた。相手の話を聞いてみよう。'):type.endsWith('.buy')?'ひと箱を、荷物棚に積んだ。':type.endsWith('.sell')?'品物を渡し、代金を受け取った。次の便で、使われ方を見に来よう。':'品物を作業台に戻し、仕入れ代を受け取った。';
 }catch(e){error=e.message;}finally{busy=false;render();}}
 $('relay-open').addEventListener('click',open);
 $('commerce-open').addEventListener('click',open);$('commerce-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{selection=null;chapterTwo.reset();chapterThree.reset();chapterFour.reset();error='';notice='';});
 g.addEventListener('change',()=>render());
 render();return {open};
}
