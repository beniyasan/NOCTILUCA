import {sidequestCargo} from './sidequests.js';
import {RELAY_PART} from './chapter-four.js';
import {RACK} from './chapter-three.js';
import {CONTAINERS} from './chapter-two.js';
import {freshAftercare,validAftercare,aftercareEpisode,aftercareComplete,aftercareArrival,FOLLOWUP_OFFERS,dailyScene} from './aftercare.js';
/** Phase 2C: one cargo slot, one first trade, per-player consequences. */
export const OFFERS = [
 {buyer:'mei',name:'夜食台用の再生電源',purpose:'軒先の照明と小型保温器',spec:'食堂用・低圧M端子／照明と保温器の同時使用を確認',cost:80,price:100,person:'メイ',seller:'月光食堂'},
 {buyer:'ren',name:'補助表示盤用の再生電源',purpose:'広告塔の足元に置く、小さな補助表示盤',spec:'表示盤用・定電圧R端子／表示制御回路に合わせて調整',cost:80,price:116,person:'レン',seller:'広告塔・設備整備係'}
];
export function freshCommerce(){return {version:2,followup:freshAftercare(),cash:120,cargo:null,known:{mei:false,ren:false},supplierKnown:false,transactions:[],firstBuyer:null,installations:{mei:'none',ren:'none'},leftKowloon:false};}
export function validCommerce(c){return c&&c.version===2&&validAftercare(c.followup)&&Number.isSafeInteger(c.cash)&&c.cash>=0&&c.cash<=1000000&&[null,'mei','ren'].includes(c.cargo)&&[null,'mei','ren'].includes(c.firstBuyer)&&c.known&&['mei','ren'].every(n=>typeof c.known[n]==='boolean'&&['none','pending','installed'].includes(c.installations?.[n]))&&Array.isArray(c.transactions)&&c.transactions.length<=200&&typeof c.supplierKnown==='boolean'&&typeof c.leftKowloon==='boolean';}
export function tradeEpisode(n,s){
 const next=aftercareEpisode(n,s);if(next)return next;
 if(n==='oru')return 'oru-trade';
 const c=s.commerce;
 return c.installations[n]==='installed'?n+'-installed':c.installations[n]==='pending'?n+'-sold':n+'-trade';
}
export function commerceComplete(s,id){
 aftercareComplete(s,id);
 if(id==='mei-trade')s.commerce.known.mei=true;
 if(id==='ren-trade')s.commerce.known.ren=true;
 if(id==='oru-trade')s.commerce.supplierKnown=true;
}
export function commerceArrival(s,from,to){
 aftercareArrival(s,from,to);
 const c=s.commerce;if(!c.firstBuyer||from===to)return;
 if(to!=='kowloon')c.leftKowloon=true;
 if(to==='kowloon'&&c.leftKowloon){
  for(const buyer of ['mei','ren'])if(c.installations[buyer]==='pending'){c.installations[buyer]='installed';if(!s.narrative?.endingSeen)s.story.chapter='after-sale';}
 }
}
export function transact(s,type,payload,now,id,fail){
 const c=s.commerce;
 if(s.location.mode!=='station'||!s.location.atStation)fail('NOT_ASHORE','下車してから品物を確認してください。',409);
 if(s.activeDialogue)fail('DIALOGUE_OPEN','話を聞き終えてから取引してください。',409);
 if(c.transactions.length>=198)fail('TRADE_LIMIT','この旅の取引記録が上限に達しました。',409);
 let offer,amount;
 if(type==='trade.buy'){
  if(Object.keys(payload).some(k=>k!=='buyer'))fail('BAD_INPUT','品物の選択を確認してください。');
  offer=OFFERS.find(o=>o.buyer===payload.buyer);if(!offer)fail('BAD_ITEM','その品物は扱っていません。');
  if(s.location.world!=='scrap'||!c.supplierKnown)fail('SUPPLIER_REQUIRED','スクラップ・ベルトでオルから品物の話を聞いてください。',409);
  if(!c.known.mei||!c.known.ren)fail('NEEDS_REQUIRED','九龍でメイとレン、二人の用途と予算を聞いてから選べます。',409);
  if(c.firstBuyer&&(!s.narrative?.endingSeen||c.installations[offer.buyer]!=='none'))fail('FIRST_TRADE_COMPLETE','最初のひと箱は売却済みです。次は使われ方を見に行きましょう。',409);
  if(c.cargo||c.followup.cargo||s.chapterTwo.cargo||s.chapterThree.cargo||s.chapterFour.cargo)fail('CARGO_FULL','荷物棚はひと箱ぶんです。今の品物を売るか、オルへ戻してください。',409);
  if(c.cash<offer.cost)fail('INSUFFICIENT_FUNDS','仕入れに必要なお金が足りません。',409);
  c.cash-=offer.cost;c.cargo=offer.buyer;amount=-offer.cost;s.story.chapter='first-cargo';
 }else if(type==='trade.sell'){
  if(Object.keys(payload).some(k=>k!=='buyer'))fail('BAD_INPUT','売り先の選択を確認してください。');
  offer=OFFERS.find(o=>o.buyer===payload.buyer);
  if(!offer||s.location.world!=='kowloon'||!c.known[offer.buyer])fail('BUYER_REQUIRED','九龍で用途を確認した相手へ届けてください。',409);
  if(c.cargo!==offer.buyer||(c.firstBuyer&&!s.narrative?.endingSeen)||c.installations[offer.buyer]!=='none')fail('ITEM_MISMATCH','この相手に合う未販売の電源がありません。',409);
  c.cash+=offer.price;c.cargo=null;c.firstBuyer ||= offer.buyer;c.installations[offer.buyer]='pending';c.leftKowloon=false;amount=offer.price;s.story.chapter='sold';
 }else if(type==='trade.return'){
  if(Object.keys(payload).length)fail('BAD_INPUT','返却する品物を確認してください。');
  offer=OFFERS.find(o=>o.buyer===c.cargo);
  if(!offer||s.location.world!=='scrap'||(c.firstBuyer&&!s.narrative?.endingSeen))fail('NOT_RETURNABLE','未販売の電源をオルの作業台へ持ち帰ると返却できます。',409);
  c.cash+=offer.cost;c.cargo=null;amount=offer.cost;s.story.chapter='prologue';
 }else fail('UNKNOWN_COMMAND','この取引はありません。');
 const transaction={id,type,buyer:offer.buyer,item:offer.name,amount,balance:c.cash,at:now};c.transactions.push(transaction);
 return {transaction,checkpoint:true};
}
export function commerceView(s){
 const c=s.commerce;
 return {...c,scene:dailyScene(s),followupOffer:c.followup.heard?FOLLOWUP_OFFERS.find(o=>o.buyer===c.firstBuyer):null,offers:OFFERS.filter(o=>c.known[o.buyer]),cargoItem:sidequestCargo(s)||(s.chapterFour.cargo?RELAY_PART:s.chapterThree.cargo?RACK:s.chapterTwo.cargo?CONTAINERS.find(o=>o.id===s.chapterTwo.cargo):c.followup.cargo?FOLLOWUP_OFFERS.find(o=>o.buyer===c.firstBuyer):OFFERS.find(o=>o.buyer===c.cargo)||null)};
}
