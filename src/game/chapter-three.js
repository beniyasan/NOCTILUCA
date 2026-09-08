/** The buyer owns the use of a sold object. Observing and asking are distinct memories. */
export const RACK={name:'折り畳みの作業ラック',cost:44,price:60,purpose:'翡翠の作業場で苗鉢を並べる。使わない時は畳んで片付ける。',spec:'幅60cm・二段・耐荷重20kg。濡れた道具にも使える防錆仕上げ。畳んでひと箱に梱包。'};
export const freshChapterThree=()=>({version:1,needsHeard:false,supplyHeard:false,decision:'undecided',cargo:false,delivery:'none',away:false,observed:false,observedVisit:null,response:'undecided',reasonHeard:false,resolved:false,returnHeard:false});
export function validChapterThree(c){
 return c&&c.version===1&&(c.observedVisit===null||(Number.isSafeInteger(c.observedVisit)&&c.observedVisit>=1))&&(!c.observed||c.observedVisit!==null)&&['needsHeard','supplyHeard','cargo','away','observed','reasonHeard','resolved','returnHeard'].every(k=>typeof c[k]==='boolean')&&['undecided','considering','trading','sold','declined'].includes(c.decision)&&['none','pending','installed'].includes(c.delivery)&&['undecided','considering','ask','leave'].includes(c.response)&&(!c.cargo||(c.decision==='trading'&&c.delivery==='none'))&&(c.delivery==='none'||(c.decision==='sold'&&!c.cargo))&&(!c.observed||c.delivery==='installed')&&(c.response==='undecided'||c.observed)&&(!c.reasonHeard||(c.observed&&c.response==='ask'))&&(!c.resolved||(c.decision==='declined'||(c.observed&&(c.response==='leave'||c.reasonHeard))))&&(!c.returnHeard||c.resolved)&&(c.decision!=='declined'||(!c.cargo&&c.delivery==='none'&&!c.observed));
}
export function chapterThreeScene(s){
 const c=s.chapterThree;
 if(c.delivery==='installed')return !c.observed||s.visits.jade===c.observedVisit||s.visits.jade%2===0?'作業ラックに、洗った手袋と前掛けが掛かっている。苗鉢は木陰の地面に並んでいた。':'作業ラックには小さな苗鉢が並ぶ。脇のかごに、乾いた手袋が重ねてある。';
 return 'スイは今ある木箱に苗鉢を並べ、木陰へ運んでいる。小道を通る人のために、箱を少し寄せた。';
}
export function chapterThreeEpisode(n,s){
 const c=s.chapterThree;
 if(n==='sui'){
  if(!s.chapterTwo.resultHeard)return 'sui-waiting';
  if(c.decision==='declined')return 'sui-declined';
  if(c.resolved)return c.reasonHeard?'sui-memory-asked':'sui-memory-left';
  if(c.observed&&c.response==='ask')return 'sui-reason';
  if(c.delivery==='installed')return 'sui-working';
  if(c.delivery==='pending')return 'sui-sold';
  return 'sui-needs';
 }
 if(!s.chapterTwo.resultHeard)return null;
 if(n==='oru'&&c.needsHeard&&!c.resolved)return 'oru-rack';
 if(n===s.commerce.firstBuyer&&c.resolved&&!c.returnHeard)return n+'-third-return';
 return null;
}
export function chapterThreeComplete(s,id){
 if(!s.chapterTwo.resultHeard)return;
 const c=s.chapterThree;
 if(id==='sui-needs')c.needsHeard=true;
 if(id==='oru-rack'&&c.needsHeard)c.supplyHeard=true;
 if(id==='sui-reason'&&c.observed&&c.response==='ask'){c.reasonHeard=true;c.resolved=true;}
 if(id==='sui-declined'&&c.decision==='declined')c.resolved=true;
 if(id===s.commerce.firstBuyer+'-third-return'&&c.resolved)c.returnHeard=true;
}
export function chapterThreeArrival(s,from,to){
 const c=s.chapterThree;if(from===to||c.delivery!=='pending')return;
 if(to!=='jade')c.away=true;
 if(to==='jade'&&c.away)c.delivery='installed';
}
export function chapterThreeEligible(e,s){
 const c=s.chapterThree;
 return (!e.thirdRack||c.delivery==='installed')&&(!e.thirdAbsent||(s.chapterTwo.resultHeard&&c.decision==='declined'))&&(!e.thirdReturn||c.returnHeard);
}
export function chapterThreeAction(s,type,p,now,id,fail){
 const c=s.chapterThree,m=s.commerce;
 if(!s.chapterTwo.resultHeard)fail('CHAPTER_LOCKED','峡谷で、第二章の判断のあとの暮らしを確かめてから。',409);
 if(s.location.mode!=='station'||!s.location.atStation)fail('NOT_ASHORE','下車してから続きを確かめてください。',409);
 if(s.activeDialogue)fail('DIALOGUE_OPEN','話を閉じてから判断してください。',409);
 const world=s.location.world;
 if(type==='chapter3.observe'){
  if(world!=='jade'||c.delivery!=='installed'||c.observed)fail('OBSERVATION_UNAVAILABLE','次の再訪で、作業場の使われ方を確かめてください。',409);
  c.observed=true;c.observedVisit=s.visits.jade;return {checkpoint:true};
 }
 if(type==='chapter3.respond'){
  if(!['ask','leave','considering'].includes(p.choice))fail('BAD_INPUT','どうするか選び直してください。');
  if(world!=='jade'||!c.observed||c.resolved)fail('RESPONSE_UNAVAILABLE','翡翠で、まだ判断していない使われ方を確かめてください。',409);
  c.response=p.choice;if(p.choice==='leave')c.resolved=true;return {checkpoint:true};
 }
 if(type==='chapter3.decide'){
  if(!['declined','considering'].includes(p.decision))fail('BAD_INPUT','判断を選び直してください。');
  if(world!=='jade'||!c.needsHeard)fail('NEEDS_REQUIRED','翡翠のスイに用途と予算を聞いてください。',409);
  if(c.cargo||c.delivery!=='none'||c.decision==='declined')fail('DECISION_LOCKED','売却や見送りは確定済みです。未販売ならオルへ返却できます。',409);
  c.decision=p.decision;return {checkpoint:true};
 }
 if(c.decision==='declined'||c.delivery!=='none')fail('TRADE_COMPLETE','今回の商いは判断済みです。',409);
 if(m.transactions.length>=198)fail('TRADE_LIMIT','この旅の取引記録が上限に達しました。',409);
 let amount;
 if(type==='chapter3.buy'){
  if(world!=='scrap'||!c.needsHeard||!c.supplyHeard)fail('SUPPLIER_REQUIRED','スイの用途を聞き、オルにラックの話を聞いてください。',409);
  if(m.cargo||m.followup.cargo||s.chapterTwo.cargo||c.cargo||s.chapterFour.cargo)fail('CARGO_FULL','荷物棚はひと箱ぶんです。今の品物を売るか、仕入れ先へ戻してください。',409);
  if(m.cash<RACK.cost)fail('INSUFFICIENT_FUNDS','仕入れ代が足りません。保留や見送りも選べます。',409);
  amount=-RACK.cost;c.cargo=true;c.decision='trading';
 }else if(type==='chapter3.return'){
  if(world!=='scrap'||!c.cargo)fail('NOT_RETURNABLE','未販売のラックをオルの作業台へ持ち帰ってください。',409);
  amount=RACK.cost;c.cargo=false;c.decision='considering';
 }else if(type==='chapter3.sell'){
  if(world!=='jade'||!c.cargo||!c.needsHeard)fail('BUYER_REQUIRED','翡翠のスイへ未販売のラックを届けてください。',409);
  amount=RACK.price;c.cargo=false;c.decision='sold';c.delivery='pending';c.away=false;
 }else fail('UNKNOWN_COMMAND','この操作はありません。');
 m.cash+=amount;const transaction={id,type,buyer:'sui',item:RACK.name,amount,balance:m.cash,at:now};m.transactions.push(transaction);return {checkpoint:true,transaction};
}
export function chapterThreeHint(s){
 const c=s.chapterThree,who=s.commerce.firstBuyer==='mei'?'メイ':'レン';
 if(c.returnHeard)return '第三章の記録が帳面に残った。旅はこのまま続けられます。次はナイト・リレーの保守端末で、資材の受入条件を見られます。';
 if(c.resolved)return '九龍に戻り、'+who+'に商売の話を聞く。前に渡した品物の続きへ、もう一度。';
 if(c.decision==='declined')return 'スイに商売の話を聞き、今回の見送りを伝える。木箱での仕事は続いている。';
 if(!c.needsHeard)return '次は翡翠ガーデンへ。下車してスイに、作業場の道具の話を聞く。';
 if(c.delivery==='pending')return 'ラックは売却済み。別の星を訪れて翡翠へ戻り、作業場を見てみる。';
 if(c.delivery==='installed'&&!c.observed)return '翡翠の商売帳で、ラックが使われている様子を帳面に控える。';
 if(c.observed)return c.response==='ask'?'スイに商売の話を聞き、使い方の続きを聞く。途中で離れても、話は残ります。':'使い方をスイに聞くか、今回はたずねず見た様子を残すか。まだ考えていても。';
 if(c.cargo)return 'ラックを翡翠のスイへ。売却前なら、オルへ仕入れ値で返せる。';
 if(c.supplyHeard)return 'オルの作業台でラックを確認できます。扱わないなら翡翠へ戻り、商売帳から見送れます。';
 return c.decision==='considering'?'今は保留中。扱うならオルの作業台へ、見送るなら翡翠の商売帳で。':'スクラップ・ベルトでオルに、折り畳みの作業ラックの話を聞く。';
}
export function chapterThreeNote(s){
 const c=s.chapterThree;
 if(c.decision==='declined')return 'ラックは今回は扱わない。スイは今ある木箱を木陰へ運んでいた。';
 if(c.observed&&!c.resolved)return '苗鉢用に売ったラックに、手袋と前掛けが掛かっていた。理由はまだ聞いていない。';
 if(c.reasonHeard)return '苗鉢用に売ったラック。強い日差しの間は、手袋と前掛けを乾かす。苗鉢を載せる便はスイが決めている。';
 return '苗鉢用に売ったラックに、手袋と前掛けが掛かっていた。今回は理由をたずねず、見た様子だけを書いた。';
}
export function chapterThreeView(s){const c=s.chapterThree;return {...c,unlocked:s.chapterTwo.resultHeard,offer:RACK,scene:chapterThreeScene(s),hint:chapterThreeHint(s),note:c.resolved||c.observed?chapterThreeNote(s):null};}
