import content from './scenario-content.js';
export const RELAY=content.relay;
export const RELAY_PART=RELAY.offer;
export const freshChapterFour=()=>({version:1,orderRead:false,supplyHeard:false,decision:'undecided',cargo:false,delivery:'none',away:false,receipt:null,observed:false});
export function validChapterFour(c){
 const receipt=c?.receipt;
 const validReceipt=receipt&&receipt.number==='R88-01'&&typeof receipt.transactionId==='string'&&typeof receipt.item==='string'&&typeof receipt.spec==='string'&&Number.isSafeInteger(receipt.amount)&&receipt.amount>=0&&typeof receipt.at==='string';
 return c&&c.version===1&&['orderRead','supplyHeard','cargo','away','observed'].every(k=>typeof c[k]==='boolean')&&['undecided','considering','trading','sold','declined'].includes(c.decision)&&['none','pending','installed'].includes(c.delivery)&&(!c.supplyHeard||c.orderRead)&&(!c.cargo||(c.decision==='trading'&&c.delivery==='none'&&c.supplyHeard))&&(c.delivery==='none'?receipt===null:(validReceipt&&c.decision==='sold'&&!c.cargo&&c.orderRead))&&(!c.observed||(c.delivery==='installed'||(c.decision==='declined'&&c.orderRead)))&&(c.decision!=='declined'||(!c.cargo&&c.delivery==='none'&&c.orderRead));
}
export function chapterFourEpisode(n,s){return n==='oru'&&s.chapterThree.returnHeard&&s.chapterFour.orderRead&&!s.chapterFour.observed&&s.chapterFour.decision!=='declined'?'oru-relay-brush':null;}
export function chapterFourComplete(s,id){if(id==='oru-relay-brush'&&s.chapterThree.returnHeard&&s.chapterFour.orderRead)s.chapterFour.supplyHeard=true;}
export function chapterFourArrival(s,from,to){
 const c=s.chapterFour;if(from===to||c.delivery!=='pending')return;
 if(to!=='relay')c.away=true;
 if(to==='relay'&&c.away)c.delivery='installed';
}
export function chapterFourEligible(e,s){return (!e.fourthInstalled||s.chapterFour.delivery==='installed')&&(!e.fourthDeclined||s.chapterFour.decision==='declined');}
export function chapterFourAction(s,type,p,now,id,fail){
 const c=s.chapterFour,m=s.commerce;
 if(!s.chapterThree.returnHeard)fail('CHAPTER_LOCKED','第三章の判断を終え、九龍の最初の取引先へ戻ってから。',409);
 if(s.location.mode!=='station'||!s.location.atStation)fail('NOT_ASHORE','停車したら下車し、端末か作業台で操作してください。',409);
 if(s.activeDialogue)fail('DIALOGUE_OPEN','会話を閉じてから操作してください。',409);
 const world=s.location.world;
 if(type==='chapter4.read'){
  if(world!=='relay')fail('TERMINAL_REQUIRED','ナイト・リレーの保守端末で確認してください。',409);
  if(c.orderRead)fail('ORDER_RECORDED','仕様と受入条件は帳面に残っています。',409);
  c.orderRead=true;return {checkpoint:true};
 }
 if(!c.orderRead)fail('ORDER_REQUIRED','ナイト・リレーの端末で、規格と受入条件を控えてください。',409);
 if(type==='chapter4.observe'){
  if(world!=='relay'||c.observed||(c.delivery!=='installed'&&c.decision!=='declined'))fail('OBSERVATION_UNAVAILABLE','リレーで、今回の判断のあとの運転を確かめてください。納品した場合は次の再訪で確認できます。',409);
  c.observed=true;return {checkpoint:true};
 }
 if(type==='chapter4.decide'){
  if(!['declined','considering'].includes(p.decision))fail('BAD_INPUT','判断を選び直してください。');
  if(world!=='relay')fail('TERMINAL_REQUIRED','リレーの端末で判断を記録してください。',409);
  if(c.cargo||c.delivery!=='none'||c.decision==='declined')fail('DECISION_LOCKED','納品や見送りは確定済みです。未販売ならオルへ返却できます。',409);
  c.decision=p.decision;return {checkpoint:true};
 }
 if(c.delivery!=='none'||c.decision==='declined')fail('TRADE_COMPLETE','今回の受付は判断済みです。',409);
 if(m.transactions.length>=198)fail('TRADE_LIMIT','この旅の取引記録が上限に達しました。',409);
 let amount;
 if(type==='chapter4.buy'){
  if(world!=='scrap'||!c.supplyHeard)fail('SUPPLIER_REQUIRED','オルに、端末で控えた交換ブラシの話を聞いてください。',409);
  if(m.cargo||m.followup.cargo||s.chapterTwo.cargo||s.chapterThree.cargo||c.cargo)fail('CARGO_FULL','荷物棚はひと箱ぶんです。今の品物を売るか、仕入れ先へ戻してください。',409);
  if(m.cash<RELAY_PART.cost)fail('INSUFFICIENT_FUNDS','仕入れ代が足りません。保留や見送りも選べます。',409);
  amount=-RELAY_PART.cost;c.cargo=true;c.decision='trading';
 }else if(type==='chapter4.return'){
  if(world!=='scrap'||!c.cargo)fail('NOT_RETURNABLE','未納品のブラシをオルへ持ち帰ってください。',409);
  amount=RELAY_PART.cost;c.cargo=false;c.decision='considering';
 }else if(type==='chapter4.sell'){
  if(world!=='relay'||!c.cargo)fail('TERMINAL_REQUIRED','交換ブラシをリレーの資材受付へ納めてください。',409);
  amount=RELAY_PART.price;c.cargo=false;c.decision='sold';c.delivery='pending';c.away=false;
  c.receipt={number:'R88-01',transactionId:id,item:RELAY_PART.name,spec:RELAY_PART.spec,amount,at:now};
 }else fail('UNKNOWN_COMMAND','この操作はありません。');
 m.cash+=amount;const transaction={id,type,buyer:'relay-terminal',item:RELAY_PART.name,amount,balance:m.cash,at:now};m.transactions.push(transaction);return {checkpoint:true,transaction};
}
export function chapterFourHint(s){
 const c=s.chapterFour;
 if(c.observed&&s.narrative.finalEndingSeen)return '受領や見送りの記録は帳面に残っています。リレーでは、いつもの清掃運転が続いています。';
 if(c.observed)return '第四章の記録を帳面に残した。九龍の列車へ戻ると、旅全体の帳面を開けます。今は周遊を続けても。';
 if(!c.orderRead)return '次はナイト・リレーへ。下車して保守端末を開き、規格と受入条件を控える。';
 if(c.decision==='declined')return '持込なし、と記録した。リレーの端末で、今の部品による運転を確かめる。';
 if(c.delivery==='installed')return 'リレーの端末にある納品ロットと、働く保守機械の記録を確かめる。';
 if(c.delivery==='pending')return '検収・支払は完了。別の星を訪れてリレーへ戻ると、交換後の運転を確かめられる。';
 if(c.cargo)return '交換ブラシをリレーの資材受付へ。未納品ならオルへ仕入れ値で返せる。';
 if(c.supplyHeard)return 'オルの作業台で、規格を確認した交換ブラシを仕入れられます。まだ決めなくても。';
 return c.decision==='considering'?'今は保留中。扱うならオルへ、見送るならリレーの保守端末へ。':'スクラップ・ベルトでオルに、清掃機88Bの交換ブラシの話を聞く。';
}
export function chapterFourView(s){
 const c=s.chapterFour;
 return {...c,unlocked:s.chapterThree.returnHeard,terminal:RELAY.terminal,orderId:RELAY.orderId,offer:RELAY_PART,conditions:RELAY.conditions,hint:chapterFourHint(s),scene:c.delivery==='installed'?RELAY.afterScene:RELAY.beforeScene,note:c.observed?(c.decision==='declined'?RELAY.declinedNote:RELAY.soldNote):null,status:c.delivery==='installed'?'定期清掃：実行中 ／ 使用ロット：R88-01':c.delivery==='pending'?'定期清掃：実行中 ／ 受領品：交換待ち':'定期清掃：実行中 ／ 現行部品を使用'};
}
