import {chapterFourHint} from './chapter-four.js';
import {chapterThreeHint} from './chapter-three.js';
import {chapterTwoHint} from './chapter-two.js';
import content from './scenario-content.js';
import {dailyScene} from './aftercare.js';
export function freshNarrative(existing=false){return {version:1,introSeen:existing,endingSeen:false,finalEndingSeen:false,active:null,ending:null,finale:null};}
export function validNarrative(n){
 const record=n?.finale;
 const validFinal=record===null||(record&&Array.isArray(record.pages)&&record.pages.length===5&&record.pages.every(p=>typeof p.title==='string'&&Array.isArray(p.lines)&&p.lines.every(t=>typeof t==='string'))&&typeof record.future==='string'&&Number.isSafeInteger(record.cash));
 return n&&n.version===1&&typeof n.introSeen==='boolean'&&typeof n.endingSeen==='boolean'&&typeof n.finalEndingSeen==='boolean'&&validFinal&&(n.active===null||(n.active&&['intro','ending','finale'].includes(n.active.kind)&&Number.isInteger(n.active.page)&&n.active.page>=0&&n.active.page<(n.active.kind==='finale'?5:3)))&&(n.ending===null||(n.ending&&Object.hasOwn(content.endings,n.ending.route)&&typeof n.ending.line==='string'&&typeof n.ending.scene==='string'&&Number.isSafeInteger(n.ending.cash)&&Array.isArray(n.ending.ledger)))&&(!n.endingSeen||!!n.ending)&&(!n.finalEndingSeen||!!record)&&(!(n.active?.kind==='finale')||!!record);
}
function finalRecord(s){
 const c=s.commerce,a=s.chapterTwo,b=s.chapterThree,r=s.chapterFour,mei=c.firstBuyer==='mei',sold=c.followup.decision==='sold';
 const future=mei?content.finale.future_mei:content.finale.future_ren;
 const first=mei?(sold?content.finale.mei_sold:content.finale.mei_declined):(sold?content.finale.ren_sold:content.finale.ren_declined);
 const gorge=a.decision==='declined'?content.finale.gorge_declined:a.chosen==='small'?content.finale.gorge_small:content.finale.gorge_large;
 const jade=b.decision==='declined'?content.finale.jade_declined:b.reasonHeard?content.finale.jade_ask:content.finale.jade_leave;
 const relay=r.decision==='declined'?content.finale.relay_declined:content.finale.relay_sold;
 return {cash:c.cash,future,pages:[
  {title:content.finale.title_two,lines:[gorge,content.finale.closing_two]},
  {title:content.finale.title_three,lines:[jade,content.finale.closing_three]},
  {title:content.finale.title_four,lines:[relay,content.finale.closing_four]},
  {title:content.finale.title_return,lines:[first,mei?(sold?content.finale.mei_last_sold:content.finale.mei_last_declined):(sold?content.finale.ren_last_sold:content.finale.ren_last_declined),content.finale.closing_return]},
  {title:content.finale.title_final,lines:[content.finale.cash_prefix+c.cash+content.finale.cash_suffix,future,content.finale.future_unpromised,content.finale.closing_final]}
 ]};
}
function endingRecord(s){
 const c=s.commerce,d=dailyScene(s),route=c.firstBuyer+'-'+c.followup.decision,branch=content.endings[route];
 return {route,line:branch.line,last:branch.last,cash:c.cash,ledger:c.transactions.map(({item,type,amount})=>({item,type,amount})),scene:c.firstBuyer==='mei'?(d.tableOpen?'軒先では、二人が器を手に休んでいる。店の奥では、メイが鍋を見ていた。':'軒先の台は畳まれている。店の中には客がいて、メイが器を重ねていた。'):'補助表示盤の正面で、傘を差した二人が待ち合わせている。塔の上では、別の広告が切り替わった。'};
}
export function narrativeView(s){
 const n=s.narrative,c=s.commerce,ready=c.followup.resultHeard&&!n.endingSeen;
 let pages=[];
 if(n.active?.kind==='finale'&&n.finale)pages=n.finale.pages;
 if(n.active?.kind==='intro')pages=content.intro;
 if(n.active?.kind==='ending'&&n.ending){const e=n.ending;pages=[
  {title:'同じ窓際',lines:[e.scene,'街は、相変わらず忙しい。列車の窓に、最初と同じ雨が流れる。']},
  {title:'金額の、次の行',lines:['帳面には、仕入れ値と売値。残り '+e.cash+' cr。',e.line],ledger:e.ledger},
  {title:'ひと箱の灯り',lines:[e.last,'売却済みの行の横に、使われていた場所を書き足した。何のために書いたのかは、自分でもよく分からなかった。','次の駅を告げる音がした。まだ、白いページがある。']}
 ];}
 return {finalReady:s.chapterFour.observed&&!n.finalEndingSeen,pageCount:pages.length||3,title:content.title,chapterOneReviewed:n.endingSeen,finalEndingSeen:n.finalEndingSeen,introSeen:n.introSeen,endingSeen:n.endingSeen,ready,active:n.active,page:n.active?pages[n.active.page]:null,ending:n.endingSeen?n.ending:null};
}
export function narrativeAction(s,type,payload,fail){
 const n=s.narrative;
 if(type==='story.start'){
  if(Object.keys(payload).length!==1||!['intro','ending','finale'].includes(payload.kind))fail('BAD_INPUT','読む場面を選んでください。');
  if(n.active)fail('STORY_OPEN','開いている帳面の続きを読んでください。',409);
  if(s.activeDialogue)fail('DIALOGUE_OPEN','話を聞き終えてから、帳面を開いてください。',409);
  if(s.location.world!=='kowloon'||s.location.mode!=='train'||!s.location.atStation)fail('WINDOW_REQUIRED','九龍に停車中の列車へ戻り、窓際で帳面を開いてください。',409);
  if(payload.kind==='intro'){
   if(n.introSeen)fail('INTRO_SEEN','最初のページは、もう帳面に残っています。',409);
  }else if(payload.kind==='finale'){
   if(!s.chapterFour.observed||!n.endingSeen||n.finalEndingSeen)fail('FINALE_NOT_READY','リレーで今回の判断の続きを確かめてから、九龍へ戻ってください。',409);
   n.finale=finalRecord(s);
  }else{
   if(!s.commerce.followup.resultHeard||n.endingSeen)fail('ENDING_NOT_READY','取引先で、その後の暮らしを聞いてから。',409);
   n.ending=endingRecord(s);
  }
  n.active={kind:payload.kind,page:0};s.activeAmbient=null;return {checkpoint:true};
 }
 if(Object.keys(payload).length)fail('BAD_INPUT','帳面から操作してください。');
 if(type==='story.close'){n.active=null;return {checkpoint:true};}
 if(type!=='story.next'||!n.active)fail('STORY_MISMATCH','帳面を開き直してください。',409);
 if(n.active.page<(n.active.kind==='finale'?4:2)){n.active.page++;return {checkpoint:true};}
 const kind=n.active.kind;n.active=null;
 if(kind==='intro')n.introSeen=true;
 else if(kind==='finale'){n.finalEndingSeen=true;s.story.chapter='daily-life';s.location.atStation=false;}
 else {n.introSeen=true;n.endingSeen=true;s.story.chapter='chapter-two';s.location.atStation=false;}
 return {checkpoint:true,storyCompleted:kind};
}
export function journeyHint(s){
 const c=s.commerce,n=s.narrative,who=c.firstBuyer==='mei'?'メイ':'レン';
 if(!n.introSeen)return s.location.world==='kowloon'?'帳面を開くと、最初の旅が始まります。眺めるだけでも。':'最初の帳面は、九龍の列車の窓際で開けます。今はこのまま旅を続けても。';
 if(n.finalEndingSeen)return '帳面の続きは、次の便で。旅や雑談へ戻れます。まだ扱っていない品があれば、商売帳から。';
 if(s.chapterFour.observed)return '九龍へ戻り、列車の窓際で「次の便で」の帳面を開く。今は旅を続けても。';
 if(n.endingSeen)return s.chapterThree.returnHeard?chapterFourHint(s):s.chapterTwo.resultHeard?chapterThreeHint(s):chapterTwoHint(s);
 if(c.followup.resultHeard)return '九龍の列車に戻り、窓際でひと箱ぶんの帳面を開く。';
 if(!c.firstBuyer){
  if(!c.known.mei||!c.known.ren)return '九龍で下車し、メイとレンに「商売の話」を聞く。';
  return c.cargo?'電源を九龍へ。商売帳から、用途の合う相手に売る。':'航路図でスクラップ・ベルトへ。オルに商売の話を聞き、商売帳で仕入れる。';
 }
 const f=c.followup;
 if(c.installations[c.firstBuyer]==='pending')return '別の星を訪れて九龍へ戻る。運んだ電源が使われ始める。';
 if(!f.observed)return who+'に「商売の話」を聞き、電源の使われ方を確かめる。';
 if(!f.available)return '別の星を訪れて九龍へ。次の便で、'+who+'の暮らしを聞く。';
 if(!f.heard)return who+'に「商売の話」を聞く。今日は、その先の事情がある。';
 if(f.decision==='declined'||f.delivery==='installed')return who+'に「商売の話」を聞き、今回の判断のあとの暮らしを確かめる。';
 if(f.delivery==='pending')return '別の星を訪れて九龍へ。品物が使われる様子と、本人の話を確かめる。';
 if(f.cargo)return '九龍へ品物を届ける。商売帳で売却。未販売ならオルへ返せる。';
 return f.decision==='considering'?'今は保留。扱うならオルへ、見送るなら九龍の商売帳へ。':'商売帳で、追加の商い・今回は扱わない・まだ考えるを選べる。';
}
