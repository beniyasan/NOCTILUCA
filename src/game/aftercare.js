/** Chapter milestones are saved; everyday presentation never mutates equipment. */
export const FOLLOWUP_OFFERS = [
 {buyer:'mei',name:'蓋付きの重ねトレー',purpose:'月光食堂の準備と片付けを、まとめて運ぶ',spec:'食堂の棚に収まる幅28cm・蓋付き3枚組／重ねて持てる',cost:32,price:44,person:'メイ',seller:'月光食堂'},
 {buyer:'ren',name:'補助表示盤の遮光フード',purpose:'向かいの窓への反射を抑える。横からの見やすさは少し下がる',spec:'R型表示盤・幅24cmの取付枠／下向きの遮光フード',cost:40,price:56,person:'レン',seller:'広告塔・設備整備係'}
];
export function freshAftercare(observed=false){return {observed,away:false,available:false,circumstanceVisit:null,heard:false,decision:'undecided',supplierKnown:false,cargo:false,delivery:'none',resultHeard:false};}
export function validAftercare(f){return f&&(f.circumstanceVisit===null||(Number.isSafeInteger(f.circumstanceVisit)&&f.circumstanceVisit>=1))&&['observed','away','available','heard','supplierKnown','cargo','resultHeard'].every(k=>typeof f[k]==='boolean')&&['undecided','considering','trading','declined','sold'].includes(f.decision)&&['none','pending','installed'].includes(f.delivery)&&(!f.available||f.observed)&&(!f.heard||f.available)&&(!f.cargo||f.decision==='trading')&&(f.delivery==='none'||f.decision==='sold')&&(!f.resultHeard||f.decision==='declined'||f.delivery==='installed');}
export function aftercareEpisode(n,s){
 const c=s.commerce,f=c.followup;if(!c.firstBuyer)return null;
 if(n==='oru')return f.heard?`oru-follow-${c.firstBuyer}`:null;
 if(n!==c.firstBuyer)return null;
 if(f.resultHeard)return n+(f.decision==='declined'?'-after-declined':'-after-memory');
 if(f.decision==='declined')return n+'-declined';
 if(f.delivery==='installed')return n+'-second-result';
 if(f.delivery==='pending')return n+'-second-sold';
 if(f.heard)return n+'-follow-reminder';
 if(f.available)return n+'-circumstances';
 if(f.observed)return n+'-first-memory';
 return null;
}
export function aftercareComplete(s,id){
 const c=s.commerce,f=c.followup,n=c.firstBuyer;if(!n)return;
 if(id===n+'-installed'&&!f.observed){f.observed=true;f.away=false;s.story.chapter='first-use-seen';}
 if(id===n+'-circumstances'){f.heard=true;s.story.chapter='second-choice';}
 if(id===`oru-follow-${n}`&&f.heard)f.supplierKnown=true;
 if((id===n+'-second-result'&&f.delivery==='installed')||(id===n+'-declined'&&f.decision==='declined')){f.resultHeard=true;s.story.chapter='ending-ready';}
}
export function aftercareArrival(s,from,to){
 const c=s.commerce,f=c.followup;if(!c.firstBuyer||from===to)return;
 if(to!=='kowloon'&&f.observed)f.away=true;
 if(to==='kowloon'&&f.away){
  if(f.observed&&!f.available){f.available=true;f.circumstanceVisit=(s.visits.kowloon||0)+1;s.story.chapter='life-after-sale';}
  if(f.delivery==='pending'){f.delivery='installed';s.story.chapter='second-use';}
 }
}
export function dailyScene(s){
 const c=s.commerce,f=c.followup;
 // First use remains visible until heard. The circumstances scene stays folded until heard.
 const tableOpen=c.installations.mei==='installed'&&(!f.available||(f.heard&&s.visits.kowloon!==f.circumstanceVisit&&(s.visits.kowloon%2===1)));
 return {tableOpen,trays:c.firstBuyer==='mei'&&f.delivery==='installed',hood:c.firstBuyer==='ren'&&f.delivery==='installed'};
}
export function aftercareEligible(e,s){
 const c=s.commerce,f=c.followup,d=dailyScene(s);
 return (!e.aftercareBuyer||c.firstBuyer===e.aftercareBuyer)&&(!e.aftercareHeard||f.heard)&&(!e.secondInstalled||f.delivery==='installed')&&(!e.beforeHood||!d.hood)&&(e.tableOpen===undefined||e.tableOpen===d.tableOpen);
}
export function aftercareAction(s,type,payload,now,id,fail){
 const c=s.commerce,f=c.followup,o=FOLLOWUP_OFFERS.find(o=>o.buyer===c.firstBuyer);
 if(!o||!f.heard)fail('CONTEXT_REQUIRED','最初の取引先で、使い方と予算の話を最後まで聞いてください。',409);
 if(s.location.mode!=='station'||!s.location.atStation)fail('NOT_ASHORE','下車してから話を続けてください。',409);
 if(s.activeDialogue)fail('DIALOGUE_OPEN','話を聞き終えてから判断してください。',409);
 if(type==='followup.decide'){
  if(Object.keys(payload).some(k=>k!=='decision')||!['declined','considering'].includes(payload.decision))fail('BAD_INPUT','判断を選び直してください。');
  if(s.location.world!=='kowloon')fail('BUYER_REQUIRED','九龍の取引先で判断を伝えてください。',409);
  if(f.cargo||f.delivery!=='none'||f.decision==='declined')fail('DECISION_LOCKED','未販売の品はオルへ返却できます。確定した判断や売却は変更できません。',409);
  f.decision=payload.decision;s.story.chapter=f.decision==='declined'?'second-declined':'second-choice';return {checkpoint:true,decision:f.decision};
 }
 if(Object.keys(payload).length)fail('BAD_INPUT','品物と金額は、聞いた用途から確認します。');
 if(c.transactions.length>=198)fail('TRADE_LIMIT','この旅の取引記録が上限に達しました。',409);
 if(f.decision==='declined'||f.delivery!=='none')fail('SECOND_TRADE_COMPLETE','今回の判断は帳面に残っています。取引先で、その後の話を聞けます。',409);
 let amount;
 if(type==='followup.buy'){
  if(s.location.world!=='scrap'||!f.supplierKnown)fail('SUPPLIER_REQUIRED','オルに今回の用途を伝え、品物の話を聞いてください。',409);
  if(c.cargo||f.cargo||s.chapterTwo.cargo||s.chapterThree.cargo||s.chapterFour.cargo)fail('CARGO_FULL','荷物棚はひと箱ぶんです。',409);
  if(c.cash<o.cost)fail('INSUFFICIENT_FUNDS','仕入れに必要なお金が足りません。',409);
  amount=-o.cost;f.cargo=true;f.decision='trading';s.story.chapter='second-cargo';
 }else if(type==='followup.return'){
  if(s.location.world!=='scrap'||!f.cargo)fail('NOT_RETURNABLE','未販売の品物をオルの作業台へ持ち帰ってください。',409);
  amount=o.cost;f.cargo=false;f.decision='considering';s.story.chapter='second-choice';
 }else if(type==='followup.sell'){
  if(s.location.world!=='kowloon'||!f.cargo)fail('ITEM_MISMATCH','用途に合う品物を九龍の取引先へ届けてください。',409);
  amount=o.price;f.cargo=false;f.delivery='pending';f.decision='sold';f.away=false;s.story.chapter='second-sold';
 }else fail('UNKNOWN_COMMAND','その操作はありません。');
 c.cash+=amount;const transaction={id,type,buyer:o.buyer,item:o.name,amount,balance:c.cash,at:now};c.transactions.push(transaction);return {checkpoint:true,transaction};
}
