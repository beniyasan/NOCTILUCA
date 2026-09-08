/** The second chapter owns its milestones; money and the one-box shelf remain shared. */
export const CONTAINERS = [
 {id:'small',name:'小型の積み重ね式密閉容器',cost:48,price:64,spec:'幅28 × 奥行24 × 高さ18cm・3個組。昇降機の入口幅35cmを通せる。',purpose:'粉塵を避け、そのまま上の作業場へ運ぶ。',use:'昇降機の脇に小型容器が重なっている。作業員が一つ持ち、上の足場へ向かった。'},
 {id:'large',name:'大型の密閉容器',cost:36,price:54,spec:'幅48 × 奥行36 × 高さ40cm・1個。入口幅35cmの昇降機には載せず、麓で使う。',purpose:'麓でまとめて保管する。上へ運ぶ分は、今ある小箱へ詰め替える。',use:'麓の置き場に大型容器がある。蓋を開けた作業員が、小箱へ今日の分を移している。'}
];
export const freshChapterTwo=()=>({version:1,needsHeard:false,supplyHeard:false,decision:'undecided',cargo:null,chosen:null,delivery:'none',away:false,resultHeard:false});
export function validChapterTwo(c){return c&&c.version===1&&['needsHeard','supplyHeard','away','resultHeard'].every(k=>typeof c[k]==='boolean')&&['undecided','considering','trading','sold','declined'].includes(c.decision)&&[null,'small','large'].includes(c.cargo)&&[null,'small','large'].includes(c.chosen)&&['none','pending','installed'].includes(c.delivery)&&(!c.cargo||(c.decision==='trading'&&c.delivery==='none'&&c.chosen===null))&&(c.delivery==='none'||(c.decision==='sold'&&c.chosen!==null&&!c.cargo))&&(!c.resultHeard||c.decision==='declined'||c.delivery==='installed')&&(c.decision!=='declined'||(!c.cargo&&!c.chosen&&c.delivery==='none'));}
export function chapterTwoEpisode(n,s){
 if(!['nagi','toma'].includes(n))return null;
 if(!s.narrative.endingSeen)return n+'-waiting';
 const c=s.chapterTwo;
 if(n==='nagi')return c.resultHeard?'nagi-memory':'nagi-supply';
 if(c.decision==='declined')return 'toma-declined';
 if(c.delivery==='installed')return 'toma-'+c.chosen+'-result';
 if(c.delivery==='pending')return 'toma-sold';
 return 'toma-needs';
}
export function chapterTwoComplete(s,id){
 if(!s.narrative.endingSeen)return;
 const c=s.chapterTwo;
 if(id==='toma-needs')c.needsHeard=true;
 if(id==='nagi-supply')c.supplyHeard=true;
 if((id==='toma-declined'&&c.decision==='declined')||(id==='toma-'+c.chosen+'-result'&&c.delivery==='installed'))c.resultHeard=true;
}
export function chapterTwoArrival(s,from,to){
 const c=s.chapterTwo;if(from===to||c.delivery!=='pending')return;
 if(to!=='gorge')c.away=true;
 if(to==='gorge'&&c.away)c.delivery='installed';
}
export function chapterTwoEligible(e,s){return (!e.chapterTwoUse||(s.chapterTwo.delivery==='installed'&&s.chapterTwo.chosen===e.chapterTwoUse))&&(!e.chapterTwoResult||s.chapterTwo.resultHeard)&&(!e.chapterTwoAbsent||s.chapterTwo.delivery!=='installed');}
export function chapterTwoAction(s,type,p,now,id,fail){
 const c=s.chapterTwo,m=s.commerce;
 if(!s.narrative.endingSeen)fail('CHAPTER_LOCKED','九龍の窓際で、ひと箱ぶんの帳面を振り返ってから。',409);
 if(s.location.mode!=='station'||!s.location.atStation)fail('NOT_ASHORE','下車してから商売帳を開いてください。',409);
 if(s.activeDialogue)fail('DIALOGUE_OPEN','話を聞き終えてから判断してください。',409);
 const world=s.location.world;
 if(type==='chapter2.decide'){
  if(Object.keys(p).some(k=>k!=='decision')||!['declined','considering'].includes(p.decision))fail('BAD_INPUT','判断を選び直してください。');
  if(world!=='gorge'||!c.needsHeard)fail('NEEDS_REQUIRED','峡谷のトマに、用途と予算を聞いてください。',409);
  if(c.cargo||c.delivery!=='none'||c.decision==='declined')fail('DECISION_LOCKED','売却や見送りは確定済みです。未販売なら蒼海で返却できます。',409);
  c.decision=p.decision;return {checkpoint:true,decision:c.decision};
 }
 if(c.delivery!=='none'||c.decision==='declined')fail('TRADE_COMPLETE','この商いの判断は帳面に残っています。',409);
 if(m.transactions.length>=198)fail('TRADE_LIMIT','この旅の取引記録が上限に達しました。',409);
 let o,amount;
 if(type==='chapter2.buy'){
  if(Object.keys(p).some(k=>k!=='item'))fail('BAD_INPUT','品物だけを選んでください。');
  o=CONTAINERS.find(o=>o.id===p.item);if(!o)fail('BAD_ITEM','容器を選び直してください。');
  if(world!=='pelagic'||!c.supplyHeard)fail('SUPPLIER_REQUIRED','蒼海のナギに容器の話を聞いてください。',409);
  if(!c.needsHeard)fail('NEEDS_REQUIRED','購入前に、峡谷のトマへ用途と予算を確かめてください。',409);
  if(c.cargo||m.cargo||m.followup.cargo||s.chapterThree.cargo||s.chapterFour.cargo)fail('CARGO_FULL','荷物棚はひと箱ぶんです。積んでいる品物を売るか、仕入れ先へ返してください。',409);
  if(m.cash<o.cost)fail('INSUFFICIENT_FUNDS','仕入れ代が足りません。保留や見送りも選べます。',409);
  amount=-o.cost;c.cargo=o.id;c.decision='trading';
 }else{
  if(Object.keys(p).length)fail('BAD_INPUT','積んでいる品物から金額を確認します。');
  o=CONTAINERS.find(o=>o.id===c.cargo);if(!o)fail('NO_CARGO','未販売の容器がありません。',409);
  if(type==='chapter2.return'){
   if(world!=='pelagic')fail('SUPPLIER_REQUIRED','未販売の容器を蒼海のナギへ戻してください。',409);
   amount=o.cost;c.cargo=null;c.decision='considering';
  }else if(type==='chapter2.sell'){
   if(world!=='gorge'||!c.needsHeard)fail('BUYER_REQUIRED','峡谷のトマへ届けてください。',409);
   amount=o.price;c.chosen=o.id;c.cargo=null;c.decision='sold';c.delivery='pending';c.away=false;
  }else fail('UNKNOWN_COMMAND','この取引はありません。');
 }
 m.cash+=amount;const transaction={id,type,buyer:'toma',item:o.name,amount,balance:m.cash,at:now};m.transactions.push(transaction);return {checkpoint:true,transaction};
}
export function chapterTwoHint(s){
 const c=s.chapterTwo;
 if(c.resultHeard)return '第二章の判断を帳面に残した。九龍へ寄るのも、このまま旅をするのも。次の商いの話は、翡翠ガーデンのスイへ。';
 if(!c.needsHeard)return '次の商いは岩海峡谷へ。下車し、トマに用途と予算を聞く。蒼海で先に品物を見ても。';
 if(c.delivery==='installed'||c.decision==='declined')return '峡谷のトマに商売の話を聞き、判断のあとの暮らしを確かめる。';
 if(c.delivery==='pending')return '容器は売却済み。別の星を訪れて峡谷へ戻ると、使われ方を確かめられる。';
 if(c.cargo)return '容器を岩海峡谷へ。売却前なら、蒼海のナギへ仕入れ値で返せる。';
 if(!c.supplyHeard)return '蒼海ドックのナギに商売の話を聞く。見送り・保留は峡谷の商売帳で。';
 return c.decision==='considering'?'今回は保留中。扱うなら蒼海で容器を選ぶ。見送るなら峡谷で判断を伝える。':'蒼海の商売帳で容器を比較する。小型は上へ運び、大型は麓で使う。';
}
export function chapterTwoView(s){const c=s.chapterTwo;return {...c,unlocked:s.narrative.endingSeen,offers:CONTAINERS,cargoItem:CONTAINERS.find(o=>o.id===c.cargo)||null,scene:c.delivery==='installed'?CONTAINERS.find(o=>o.id===c.chosen).use:c.decision==='declined'?'今ある小箱を拭き、今日の分を昇降機へ運んでいる。':'麓と上の作業場を、小さな昇降機が行き来している。',hint:chapterTwoHint(s)};}
