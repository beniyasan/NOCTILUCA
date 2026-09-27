import {freshSidequests,validSidequests,migrateSidequests,sidequestAction,sidequestArrival,sidequestView} from './sidequests.js';
import {SIDEQUESTS} from './sidequests-content.js';
import {freshChapterFour,validChapterFour,chapterFourEpisode,chapterFourComplete,chapterFourArrival,chapterFourEligible,chapterFourAction,chapterFourView} from './chapter-four.js';
import {freshChapterThree,validChapterThree,chapterThreeEpisode,chapterThreeComplete,chapterThreeArrival,chapterThreeEligible,chapterThreeAction,chapterThreeView,chapterThreeNote} from './chapter-three.js';
import {freshChapterTwo,validChapterTwo,chapterTwoEpisode,chapterTwoComplete,chapterTwoArrival,chapterTwoEligible,chapterTwoAction,chapterTwoView} from './chapter-two.js';
import {freshNarrative,validNarrative,narrativeView,narrativeAction,journeyHint} from './narrative.js';
import {freshAftercare,aftercareAction,aftercareEligible} from './aftercare.js';
import {freshCommerce,validCommerce,tradeEpisode,commerceComplete,commerceArrival,transact,commerceView} from './commerce.js';
/** Pure, deterministic game rules. The server is authoritative for signed-in users.
 * No DOM, storage or database code is allowed in this module.
 */
export const SCHEMA = 1;
export const PREVIOUS_CONTENT_VERSION = 'phase2a-2026-09-07';
export const CONTENT_VERSION = 'finale-2026-09-07';
export const SUPPORTED_CONTENT_VERSIONS=[PREVIOUS_CONTENT_VERSION,'phase2c-2026-09-07','phase2d-2026-09-07','phase2e-2026-09-07','chapter2-2026-09-07','chapter3-2026-09-07','chapter4-2026-09-07',CONTENT_VERSION];
export const WORLDS = [
  {id:'kowloon',name:'ネオン九龍',station:'九龍東ホーム'},
  {id:'scrap',name:'スクラップ・ベルト',station:'サルベージ中央停留所'},
  {id:'pelagic',name:'蒼海ドック',station:'蒼海第3埠頭'},
  {id:'gorge',name:'岩海峡谷',station:'峡谷リッジ駅'},
  {id:'jade',name:'翡翠ガーデン',station:'翡翠園前駅'},
  {id:'relay',name:'ナイト・リレー',station:'リレー88 接続環'},
  {id:'abyss',name:'深藍アビス',station:'深藍第7気密駅'},
  {id:'caldera',name:'紅蓮カルデラ',station:'カルデラ環状駅'},
  {id:'aerie',name:'蒼穹アルカ',station:'雲上アルカ駅'}
];
export class GameError extends Error {
  constructor(code,message,status=400){super(message);this.code=code;this.status=status;}
}
export function fail(code,message,status=400){throw new GameError(code,message,status);}
export function object(v){return !!v && typeof v==='object' && !Array.isArray(v);}
// A focus task linked to Notion keeps its page ID; 'pending' means it still has to be sent there.
const notionPageId=v=>typeof v==='string'&&/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(v);
const notionTaskRef=v=>v==='pending'||notionPageId(v);
export function exactKeys(v,allowed){
  if(!object(v)||Object.keys(v).some(k=>!allowed.includes(k)))fail('BAD_INPUT','送信内容を確認してください。');
}
export function displayName(value){
  if(typeof value!=='string')fail('BAD_NAME','名前を入力してください。');
  const n=value.normalize('NFC').trim();
  if([...n].length<1 || [...n].length>20 || /[\p{Cc}\p{Cf}<>]/u.test(n))
    fail('BAD_NAME','名前は1〜20文字で、改行・制御文字・山括弧を使わず入力してください。');
  return n;
}
export function freshState(){return {
  schemaVersion:SCHEMA,contentVersion:CONTENT_VERSION,displayName:'',
  location:{world:'kowloon',mode:'train',atStation:true},suspended:false,
  visits:{kowloon:1,scrap:0,pelagic:0,gorge:0,jade:0,relay:0,abyss:0,caldera:0,aerie:0},
  actors:{},plays:{},completed:{},last:{},notes:[],heard:[],
  activeDialogue:null,activeAmbient:null,legacyImported:false,focusTasks:[],
  settings:{chatter:true,frequency:'normal',auto:true,dwell:120,stopDuration:24,density:'normal',hints:true,speed:1,stationStops:true,travelSeconds:null,focusSeconds:1500,focusGoal:'',breakSeconds:300,longBreakSeconds:900,longBreakEvery:4,arrivalBell:true,bellVolume:60,musicTrack:'waltz',musicVolume:35},
  sidequests:freshSidequests(),commerce:freshCommerce(),narrative:freshNarrative(),chapterTwo:freshChapterTwo(),chapterThree:freshChapterThree(),chapterFour:freshChapterFour(),
  story:{id:'tsuginobin',chapter:'prologue',flags:{}}
};}
export function checkState(s){
  if(!object(s)||s.schemaVersion!==SCHEMA || !SUPPORTED_CONTENT_VERSIONS.includes(s.contentVersion))
    fail('SAVE_VERSION','このセーブ形式には対応していません。上書きせず、アプリの更新を確認してください。',409);
  if(!object(s.location)||!WORLDS.some(w=>w.id===s.location.world)||!['train','station'].includes(s.location.mode))
    fail('SAVE_INVALID','保存データの現在地を読み取れません。',409);
  for(const k of ['actors','plays','completed','last','visits','settings','story'])if(!object(s[k]))fail('SAVE_INVALID','保存データに不足があります。',409);
  for(const k of ['notes','heard'])if(!Array.isArray(s[k]))fail('SAVE_INVALID','保存データに不足があります。',409);
  for(const [key,value] of Object.entries(freshState().settings))if(s.settings[key]===undefined)s.settings[key]=value;
  if(s.focusTasks===undefined)s.focusTasks=[];
  if(!Array.isArray(s.focusTasks)||s.focusTasks.length>20||new Set(s.focusTasks.map(t=>t?.id)).size!==s.focusTasks.length||s.focusTasks.some(t=>!object(t)||typeof t.id!=='string'||!t.id||t.id.length>80||typeof t.text!=='string'||!t.text.trim()||t.text.length>120||/[\u0000-\u001f\u007f]/u.test(t.text)||(t.notion!==undefined&&!notionTaskRef(t.notion))))fail('SAVE_INVALID','タスクの保存データを読み取れません。',409);
  const existing=s.contentVersion!==CONTENT_VERSION;
  const was2E=s.contentVersion==='phase2e-2026-09-07';
  const wasChapterTwo=s.contentVersion==='chapter2-2026-09-07';
  const wasChapterFour=s.contentVersion==='chapter4-2026-09-07';
  const wasChapterThree=s.contentVersion==='chapter3-2026-09-07';
  if(s.contentVersion===PREVIOUS_CONTENT_VERSION){s.commerce=freshCommerce();s.contentVersion=CONTENT_VERSION;}
  if(s.contentVersion==='phase2c-2026-09-07'&&s.commerce?.version===1){
    const n=s.commerce.firstBuyer;s.commerce.followup=freshAftercare(!!n&&!!s.completed[n+'-installed']);s.commerce.version=2;s.contentVersion=CONTENT_VERSION;
  }
  if(existing){
    if(!wasChapterTwo&&!wasChapterThree&&!wasChapterFour){if(!was2E)s.narrative=freshNarrative(true);else if(s.narrative)s.narrative.finalEndingSeen=false;s.chapterTwo=freshChapterTwo();}
    if(!wasChapterThree&&!wasChapterFour)s.chapterThree=freshChapterThree();
    if(!wasChapterFour)s.chapterFour=freshChapterFour();
    if(s.narrative){s.narrative.finale=null;s.narrative.finalEndingSeen=false;}
    s.contentVersion=CONTENT_VERSION;
  }
  if(!validChapterFour(s.chapterFour))fail('SAVE_INVALID','第四章の記録を読み取れません。',409);
  if(!validChapterThree(s.chapterThree))fail('SAVE_INVALID','第三章の記録を読み取れません。',409);
  if(!validChapterTwo(s.chapterTwo))fail('SAVE_INVALID','第二章の記録を読み取れません。',409);
  if(s.narrative?.endingSeen){s.narrative.introSeen=true;s.story.chapter=s.narrative.finalEndingSeen?'daily-life':s.chapterFour.observed?'chapter-four-complete':s.chapterThree.returnHeard?'chapter-four':s.chapterTwo.resultHeard?'chapter-three':'chapter-two';}
  if(!validNarrative(s.narrative))fail('SAVE_INVALID','帳面の記録を読み取れません。上書きせず、記録をご確認ください。',409);
  if(!validCommerce(s.commerce))fail('SAVE_INVALID','商売の記録を読み取れません。上書きせず、記録をご確認ください。',409);
  if(s.sidequests===undefined)s.sidequests=freshSidequests();
  migrateSidequests(s.sidequests);
  if(!validSidequests(s.sidequests))fail('SAVE_INVALID','寄り道の仕事の記録を読み取れません。',409);
  if(s.sidequests.cargo&&(s.commerce.cargo||s.commerce.followup.cargo||s.chapterTwo.cargo||s.chapterThree.cargo||s.chapterFour.cargo))fail('SAVE_INVALID','荷物棚の記録が一致しません。',409);
  return s;
}
export function eligible(e,s){
  const variant=Math.max(0,(s.visits[s.location.world]||1)-1)%3;
  return (!e.sidequest||s.sidequests?.quests[e.sidequest]?.installed.includes(e.world))&&chapterFourEligible(e,s)&&chapterThreeEligible(e,s)&&chapterTwoEligible(e,s)&&aftercareEligible(e,s)&&(!e.beforeSale||s.commerce.installations[e.beforeSale]==='none')&&(!e.installation||s.commerce.installations[e.installation]==='installed')&&(e.variant===undefined||e.variant===variant)&&(!e.requires||e.requires.every(k=>s.notes.includes(k)));
}
function choose(pool,bucket,s){
  let a=pool.filter(e=>eligible(e,s));if(!a.length)return null;
  // An unfinished episode remains uncompleted; starts and completions are separate.
  const unseen=a.filter(e=>!s.completed[e.id]);if(unseen.length)a=unseen;
  const recent=a.filter(e=>e.id!==s.last[bucket]);if(recent.length)a=recent;
  const min=Math.min(...a.map(e=>s.plays[e.id]||0));a=a.filter(e=>(s.plays[e.id]||0)===min);
  const contextual=a.filter(e=>e.variant!==undefined||e.requires?.length||e.installation||e.aftercareBuyer||e.chapterTwoUse||e.chapterTwoResult||e.thirdRack||e.thirdAbsent||e.thirdReturn||e.fourthInstalled||e.fourthDeclined||e.sidequest);if(contextual.length)a=contextual;
  const total=Object.values(s.plays).reduce((x,n)=>x+n,0);
  return a[(total+(s.visits[s.location.world]||0))%a.length];
}
function recordStart(s,id,bucket){s.plays[id]=Math.min(1000000,(s.plays[id]||0)+1);s.last[bucket]=id;}
function station(s){if(!s.location.atStation)fail('NOT_AT_STATION','駅に停車してから操作してください。',409);}
function ashore(s){station(s);if(s.location.mode!=='station')fail('NOT_ASHORE','先に列車を降りてください。',409);}
function npcFor(data,id,s){const n=data.npcs.find(n=>n.id===id&&n.world===s.location.world);if(!n)fail('NPC_UNAVAILABLE','この駅では、その人とは話せません。',409);return n;}
function actor(s,id){return s.actors[id] ||= {met:false,meetings:0,lastVisit:0,completed:[]};}
function remember(s,e){
  const first=!s.completed[e.id];s.completed[e.id]=true;
  if(e.note&&!s.notes.includes(e.note))s.notes.push(e.note);
  return first;
}
export function reduce(current,command,data,context={}){
  checkState(current);const s=structuredClone(current),{type,payload={}}=command;
  const now=context.now||new Date().toISOString(),token=context.token||command.id;
  if(type==='journey.reset'){
    exactKeys(payload,['confirmation']);if(payload.confirmation!=='reset-journey')fail('RESET_CONFIRMATION','初期化の確認画面から、もう一度操作してください。');
    const reset=freshState();reset.displayName=s.displayName;reset.settings=structuredClone(s.settings);
    return {state:reset,outcome:{reset:true,checkpoint:true}};
  }
  if(type==='focus.task.link'){
    exactKeys(payload,['id','notion']);
    const task=s.focusTasks.find(t=>t.id===payload.id);
    if(!task)fail('TASK_MISSING','このタスクは完了済みか、見つかりません。記録を読み込み直してください。',409);
    if(!notionPageId(payload.notion))fail('BAD_TASK','Notionのページを確認してください。');
    if(task.notion!=='pending')fail('TASK_LINKED','このタスクはすでにNotionとつながっています。',409);
    task.notion=payload.notion;
    return {state:s,outcome:{taskChanged:true,checkpoint:true}};
  }
  if(type==='focus.task.add'||type==='focus.task.complete'){
    exactKeys(payload,type==='focus.task.add'?['text','notion']:['id']);
    if(type==='focus.task.add'){
      if(typeof payload.text!=='string'||!payload.text.trim()||payload.text.length>120||/[\u0000-\u001f\u007f]/u.test(payload.text))fail('BAD_TASK','タスクは1〜120文字で入力してください。');
      if(s.focusTasks.length>=20)fail('TASK_LIMIT','タスクは20件までです。終わったものを完了してください。',409);
      if(payload.notion!==undefined&&!notionTaskRef(payload.notion))fail('BAD_TASK','Notionのページを確認してください。');
      if(notionPageId(payload.notion)&&s.focusTasks.some(t=>t.notion===payload.notion))fail('TASK_EXISTS','このNotionのタスクは、もう取り込んでいます。',409);
      s.focusTasks.push({id:command.id,text:payload.text.trim(),...(payload.notion!==undefined?{notion:payload.notion}:{})});
    }else{
      if(typeof payload.id!=='string'||!s.focusTasks.some(t=>t.id===payload.id))fail('TASK_MISSING','このタスクは完了済みか、見つかりません。記録を読み込み直してください。',409);
      s.focusTasks=s.focusTasks.filter(t=>t.id!==payload.id);
    }
    return {state:s,outcome:{taskChanged:true,checkpoint:true}};
  }
  let outcome={};
  const always=['profile.set','settings.set','journey.resume','legacy.import'];
  if(s.suspended&&!always.includes(type))fail('SUSPENDED','まず旅を再開してください。',409);
  if(!s.displayName&&!['profile.set','legacy.import'].includes(type))fail('NAME_REQUIRED','旅で使う名前を決めてください。',409);
  if(s.narrative.active&&!['story.next','story.close','profile.set','settings.set','journey.resume','journey.checkpoint'].includes(type))fail('STORY_OPEN','帳面を閉じてから操作してください。',409);
  if(type.endsWith('.buy')&&!type.startsWith('sidequest.')&&s.sidequests.cargo)fail('CARGO_FULL','寄り道の荷物を先に届けるか、受け取った駅へ戻してください。',409);
  switch(type){
    case 'sidequest.talk':case 'sidequest.next':case 'sidequest.close':case 'sidequest.accept':case 'sidequest.buy':case 'sidequest.deliver':case 'sidequest.return':case 'sidequest.cancel':
      exactKeys(payload,type==='sidequest.close'?[]:['quest']);outcome=sidequestAction(s,type,payload,now,command.id,fail);
      if(type==='sidequest.talk'){
        const q=SIDEQUESTS.find(q=>q.id===payload.quest),name=s.location.world===q.origin?q.owner:q.contact,n=data.npcs.find(n=>n.name===name&&n.world===s.location.world);
        if(n){const a=actor(s,n.id),visit=s.visits[s.location.world];if(a.lastVisit!==visit)a.meetings++;a.met=true;a.lastVisit=visit;}
      }break;
    case 'story.start':case 'story.next':case 'story.close':
      exactKeys(payload,type==='story.start'?['kind']:[]);outcome=narrativeAction(s,type,payload,fail);break;
    case 'profile.set':exactKeys(payload,['name']);s.displayName=displayName(payload.name);break;
    case 'travel.arrive':{
      exactKeys(payload,['world']);
      if(s.location.mode==='station')fail('STILL_ASHORE','列車に戻ってから移動してください。',409);
      if(!WORLDS.some(w=>w.id===payload.world))fail('BAD_WORLD','行き先が見つかりません。');
      sidequestArrival(s,s.location.world,payload.world);commerceArrival(s,s.location.world,payload.world);chapterTwoArrival(s,s.location.world,payload.world);chapterThreeArrival(s,s.location.world,payload.world);chapterFourArrival(s,s.location.world,payload.world);
      s.location={world:payload.world,mode:'train',atStation:s.settings.stationStops};
      s.visits[payload.world]=Math.min(1000000,(s.visits[payload.world]||0)+1);
      s.activeDialogue=null;s.activeAmbient=null;break;
    }
    case 'station.stop':exactKeys(payload,[]);s.location.atStation=true;break;
    case 'station.depart':
      exactKeys(payload,[]);if(s.location.mode==='station')fail('STILL_ASHORE','列車に戻ってください。',409);
      if(s.activeDialogue)fail('DIALOGUE_OPEN','会話を閉じてから発車してください。',409);
      s.location.atStation=false;s.activeAmbient=null;break;
    case 'journey.alight':exactKeys(payload,[]);station(s);s.location.mode='station';break;
    case 'journey.board':exactKeys(payload,[]);ashore(s);s.location.mode='train';s.activeDialogue=null;s.sidequests.active=null;break;
    case 'journey.checkpoint':
      exactKeys(payload,[]);ashore(s);s.suspended=true;s.activeDialogue=null;s.activeAmbient=null;s.sidequests.active=null;
      outcome={checkpoint:true,savedAt:now};break;
    case 'journey.resume':exactKeys(payload,[]);s.suspended=false;break;
    case 'dialogue.start':{
      exactKeys(payload,['npc','topic']);ashore(s);
      const n=npcFor(data,payload.npc,s),a=actor(s,n.id);let e;
      if(payload.topic==='greeting'){
        const visit=s.visits[s.location.world];
        const lines=!a.met?n.greetings.first:a.lastVisit===visit?n.greetings.same:[n.greetings.return[(a.meetings-1)%n.greetings.return.length]];
        if(a.lastVisit!==visit)a.meetings++;
        a.met=true;a.lastVisit=visit;
        const shared=n.id===s.commerce.firstBuyer?(s.commerce.followup.heard?(n.id==='mei'?'この前のトレーの話だけど、続きなら鍋を見ながらでいい？':'この前の光の話か。表示盤は今日も動いてる。'):(s.commerce.installations[n.id]==='installed'?'あの電源、使ってるよ。':null)):null;
        e={id:'greeting:'+n.id,lines:(shared?[shared]:lines).map(text=>({speaker:'npc',text}))};
        const scrapMemories=[['steady_grips','あの持ち手、よく使う二本に付けた。ほかの工具は、まだ今のままでいい。'],['amber_window','窓の端だけ、少し柔らかい色になった。入口の灯りはそのままだ。'],['shears_return','剪定ばさみの場所に、返却札を付けておいた。次の修理を並べられる。'],['glove_drying','手袋は壁際に干してる。通るとき、もう頭を下げなくていい。'],['gauge_return','G-17、いつもの壁に掛けてある。さっきも小さい部品を測ったところだ。']].filter(([id])=>s.sidequests.quests[id].installed.includes('scrap'));
        const harborMemories=[['lunch_tags','丸い札の方が昼飯。今日は持ち手をつかむ前に確かめたよ。'],['salt_scraper','売店のへら、窓の横に掛かってる。また白くなったら使うんだ。'],['wave_cups','カップの棚に、いつものポットを移した。奥のものをどかさずに取れるよ。'],['tide_seat','腰掛けは岸側。荷役中は畳むことにしたよ。']].filter(([id])=>s.sidequests.quests[id].installed.includes('pelagic'));
        const laterMemories=SIDEQUESTS.filter(q=>q.origin===n.world&&q.owner===n.name&&q.afterChapterFour===false&&s.sidequests.quests[q.id].installed.includes(n.world)).map(q=>q.result[0]);
        if(n.id==='sui'&&s.sidequests.quests.pot_stones.installed.includes('jade'))laterMemories.push('谷の石、鉢の足元に使ってる。角が丸いから、位置を直しやすいよ。');
        const cups=s.sidequests.quests.wave_cups.installed.includes('kowloon');
        const aside=laterMemories.length?laterMemories[(Math.max(1,a.meetings)-1)%laterMemories.length]:n.id==='nagi'&&harborMemories.length?harborMemories[(Math.max(1,a.meetings)-1)%harborMemories.length][1]:n.id==='mei'&&cups&&(!s.sidequests.quests.late_tea.installed.includes('kowloon')||a.meetings%2===0)?'港のカップ、水飲み用に使ってるよ。持ち手が大きくて、手を掛けやすいね。':n.id==='oru'&&scrapMemories.length?scrapMemories[(Math.max(1,a.meetings)-1)%scrapMemories.length][1]:n.id==='sui'&&s.sidequests.quests.shears_return.installed.includes('jade')?'戻ってきたはさみ、いつもの布が目印。ほかの道具と混ざっても分かるよ。':n.id==='mei'&&s.sidequests.quests.late_tea.installed.includes('kowloon')?'あのお茶、夜の献立に入れたよ。今日は一杯、飲んでいく？':n.id==='ren'&&s.sidequests.quests.chair_home.installed.includes('kowloon')?'トマの椅子、届けてくれて助かった。空いたところで次の工具を広げてる。':null;
        if(aside)e.lines.push({speaker:'npc',text:aside});
      }else{
        if(!a.met)fail('NOT_MET','先に挨拶をしてください。',409);
        if(!data.topics.some(t=>t.id===payload.topic))fail('BAD_TOPIC','その話題はありません。');
        e=payload.topic==='trade'?n.episodes.find(e=>e.id===(chapterFourEpisode(n.id,s)||chapterThreeEpisode(n.id,s)||chapterTwoEpisode(n.id,s)||tradeEpisode(n.id,s))):choose(n.episodes.filter(e=>e.topic===payload.topic),'direct:'+n.id+':'+payload.topic,s);
        if(!e)fail('NO_DIALOGUE','今は、その話の続きはありません。',409);
        recordStart(s,e.id,'direct:'+n.id+':'+payload.topic);
      }
      s.activeDialogue={sessionId:token,npc:n.id,episodeId:e.id,startedAt:now};s.activeAmbient=null;
      outcome={dialogue:{...e,npc:n.id,sessionId:token}};break;
    }
    case 'dialogue.complete':{
      exactKeys(payload,['sessionId']);ashore(s);
      const a=s.activeDialogue;
      if(!a||a.sessionId!==payload.sessionId)fail('DIALOGUE_MISMATCH','会話の状態が変わりました。もう一度話しかけてください。',409);
      const n=npcFor(data,a.npc,s),e=n.episodes.find(e=>e.id===a.episodeId);
      if(e){commerceComplete(s,e.id);chapterTwoComplete(s,e.id);chapterThreeComplete(s,e.id);chapterFourComplete(s,e.id);const first=remember(s,e);const person=actor(s,n.id);if(!person.completed.includes(e.id))person.completed.push(e.id);outcome={firstCompletion:first,note:e.note||null};}
      s.activeDialogue=null;break;
    }
    case 'dialogue.close':exactKeys(payload,[]);s.activeDialogue=null;break;
    case 'ambient.next':{
      exactKeys(payload,[]);station(s);
      if(s.activeDialogue||s.sidequests.active||!s.settings.chatter){outcome={ambient:null};break;}
      const e=choose(data.ambient.filter(e=>e.world===s.location.world),'ambient:'+s.location.world,s);
      if(e){recordStart(s,e.id,'ambient:'+s.location.world);s.activeAmbient={episodeId:e.id,sessionId:token};outcome={ambient:{...e,sessionId:token}};}
      else outcome={ambient:null};break;
    }
    case 'ambient.complete':{
      exactKeys(payload,['sessionId']);station(s);const a=s.activeAmbient;
      if(!a||a.sessionId!==payload.sessionId)fail('AMBIENT_MISMATCH','周囲の会話が切り替わりました。',409);
      s.completed[a.episodeId]=true;s.heard=s.heard.filter(id=>id!==a.episodeId);s.heard.push(a.episodeId);s.heard=s.heard.slice(-30);s.activeAmbient=null;break;
    }
    case 'chapter4.read':case 'chapter4.decide':case 'chapter4.buy':case 'chapter4.sell':case 'chapter4.return':case 'chapter4.observe':
      exactKeys(payload,type==='chapter4.decide'?['decision']:[]);outcome=chapterFourAction(s,type,payload,now,command.id,fail);break;
    case 'chapter3.decide':case 'chapter3.buy':case 'chapter3.sell':case 'chapter3.return':case 'chapter3.observe':case 'chapter3.respond':
      exactKeys(payload,type==='chapter3.decide'?['decision']:type==='chapter3.respond'?['choice']:[]);outcome=chapterThreeAction(s,type,payload,now,command.id,fail);break;
    case 'chapter2.decide':case 'chapter2.buy':case 'chapter2.sell':case 'chapter2.return':
      outcome=chapterTwoAction(s,type,payload,now,command.id,fail);break;
    case 'followup.decide':case 'followup.buy':case 'followup.sell':case 'followup.return':
      exactKeys(payload,type==='followup.decide'?['decision']:[]);outcome=aftercareAction(s,type,payload,now,command.id,fail);break;
    case 'trade.buy':case 'trade.sell':case 'trade.return':
      outcome=transact(s,type,payload,now,command.id,fail);break;
    case 'settings.set':{
      exactKeys(payload,Object.keys(s.settings));
      for(const [k,v] of Object.entries(payload)){
        const valid=['chatter','auto','hints','stationStops','arrivalBell'].includes(k)?typeof v==='boolean':
          k==='frequency'?['normal','quiet'].includes(v):k==='density'?['normal','quiet'].includes(v):
          k==='dwell'?[60,120,240,600].includes(v):k==='stopDuration'?[24,45,90].includes(v):
          k==='speed'?[.5,1,1.5,2].includes(v):
          k==='travelSeconds'?(v===null||(Number.isSafeInteger(v)&&v>=30&&v<=86400)):
          ['focusSeconds','breakSeconds','longBreakSeconds'].includes(k)?Number.isSafeInteger(v)&&v>=5&&v<=86400:
          k==='longBreakEvery'?Number.isSafeInteger(v)&&v>=1&&v<=12:
          ['bellVolume','musicVolume'].includes(k)?Number.isSafeInteger(v)&&v>=0&&v<=100:
          k==='focusGoal'?typeof v==='string'&&v.length<=120&&!/[\u0000-\u001f\u007f]/u.test(v):
          k==='musicTrack'?['waltz','amber','musicbox'].includes(v):false;
        if(!valid)fail('BAD_SETTING','設定値が正しくありません。');s.settings[k]=k==='focusGoal'?v.trim():v;
      }break;
    }
    case 'legacy.import':{
      exactKeys(payload,['memory']);const m=payload.memory;
      if(s.legacyImported||Object.keys(s.completed).length||Object.values(s.actors).some(a=>a.met))fail('IMPORT_NOT_EMPTY','旧版の取り込みは、会話を始める前の旅に一度だけ行えます。',409);
      if(!object(m)||m.schema!==1)fail('BAD_LEGACY','Phase 2Aの会話データではありません。');
      // Import documented legacy memories only. Never import money, affinity or story outcomes.
      const noteIds=new Set(data.notes.map(n=>n.id));s.notes=[...new Set((Array.isArray(m.notes)?m.notes:[]).filter(k=>noteIds.has(k)))];
      const ambIds=new Set(data.ambient.map(e=>e.id));s.heard=[...new Set((Array.isArray(m.heard)?m.heard:[]).filter(k=>ambIds.has(k)))].slice(-30);
      for(const n of data.npcs)if(object(m.actors?.[n.id])&&Number.isSafeInteger(m.actors[n.id].count)&&m.actors[n.id].count>0){const a=actor(s,n.id);a.met=true;a.meetings=1;}
      // Old 'plays' counted starts, not finishes: deliberately NOT converted to completions.
      s.legacyImported=true;outcome={importedNotes:s.notes.length};break;
    }
    default:fail('UNKNOWN_COMMAND','この操作には対応していません。');
  }
  if(s.narrative.endingSeen)s.story.chapter=s.narrative.finalEndingSeen?'daily-life':s.chapterFour.observed?'chapter-four-complete':s.chapterThree.returnHeard?'chapter-four':s.chapterTwo.resultHeard?'chapter-three':'chapter-two';
  return {state:s,outcome};
}
export function viewState(s,data){
  const v=structuredClone(s);
  // Session IDs stay server-side except for the currently issued dialogue outcome.
  delete v.activeDialogue;delete v.activeAmbient;
  v.sidequestView=sidequestView(s);
  v.chapterFourView=chapterFourView(s);v.chapterThreeView=chapterThreeView(s);v.chapterTwoView=chapterTwoView(s);v.tradeView=commerceView(s);v.storyView=narrativeView(s);v.journeyHint=journeyHint(s);
  v.noteDetails=data.notes.filter(n=>s.notes.includes(n.id)).map(n=>{
    const buyer=n.id==='mei-power'?'mei':n.id==='ren-power'?'ren':null;
    if(buyer&&!s.commerce.known[buyer])return {...n,body:'以前の旅で、電源の用途について話を聞いた。',foot:'今回の仕様と予算は、本人に商売の話を聞き直して確認する。'};
    if(buyer&&s.commerce.installations[buyer]!=='none')return {...n,foot:s.commerce.installations[buyer]==='installed'?'この用途の電源は売却済み。今は街で使われている。':'この用途の電源は売却済み。取り付けは次の訪問で。'};
    return n;
  });
  for(const q of SIDEQUESTS)if(s.sidequests.quests[q.id].stage==='completed')v.noteDetails.push({id:'sidequest:'+q.id,title:q.title,world:q.origin,body:q.memo,foot:s.sidequests.quests[q.id].installed.includes(q.origin)?q.effect:'仕事は完了。次に戻ると、その後の様子を見られる。'});
  if(s.narrative.finalEndingSeen)v.noteDetails.push({id:'finale',title:'終章・次の便で',world:'kowloon',body:s.narrative.finale.future,foot:'注文ではなく、次に聞いてみたいこと。'});
  if(s.narrative.endingSeen)v.noteDetails.push({id:'ending',title:'第一章・ひと箱の灯り',world:'kowloon',body:s.narrative.ending.line,foot:'窓際の帳面に残した一行。'});
  if(s.chapterTwo.resultHeard)v.noteDetails.push({id:'chapter-two-result',title:'第二章・違う場所の使い方',world:'gorge',body:chapterTwoView(s).scene,foot:s.chapterTwo.decision==='declined'?'容器は今回は扱わないと伝えた。':'トマの使う場所を、売却済みの行の横に書いた。'});
  if(s.chapterThree.resolved||s.chapterThree.observed)v.noteDetails.push({id:'chapter-three-result',title:'第三章・渡したあとは',world:'jade',body:chapterThreeNote(s),foot:s.chapterThree.returnHeard?'九龍でも、前に売った品の続きを確かめた。':s.chapterThree.resolved?'九龍の取引先へ、もう一度寄ってみる。':'使い方をたずねるか、見た様子だけを残すか。まだ決めていない。'});
  const relay=v.chapterFourView;
  if(relay.orderRead)v.noteDetails.push({id:'relay-order',title:'リレー88・受入条件',world:'relay',body:relay.offer.spec,foot:'受入数量1組・支払 '+relay.offer.price+' cr。持込期限なし。確認だけでは納品の約束にならない。'});
  if(relay.receipt)v.noteDetails.push({id:'relay-receipt',title:'受領票 '+relay.receipt.number,world:'relay',body:relay.receipt.item+' ／ 検収完了・支払 '+relay.receipt.amount+' cr',foot:relay.status});
  if(relay.observed)v.noteDetails.push({id:'chapter-four-result',title:'第四章・返事のない仕事',world:'relay',body:relay.note,foot:'ホームでは、定期清掃が続いている。'});
  v.heardDetails=s.heard.map(id=>data.ambient.find(e=>e.id===id)).filter(Boolean);
  return v;
}
export function stationPeople(data,world){return data.npcs.filter(n=>n.world===world).map(({id,name,role,en,where,detail,coat,hat})=>({id,name,role,en,where,detail,coat,hat}));}
