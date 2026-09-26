import {SIDEQUESTS,KOWLOON_QUESTS,SCRAP_QUESTS,PELAGIC_QUESTS,LATER_QUESTS,QUEST_WORLD_NAMES} from './sidequests-content.js';
const stages=['available','offered','accepted','carrying','informed','completed'];
const record=()=>({stage:'available',sourceHeard:false,installed:[],receipt:null});
export function freshSidequests(){return {version:4,cargo:null,active:null,quests:Object.fromEntries(SIDEQUESTS.map(q=>[q.id,record()]))};}
function validate(v,definitions,version){
 if(!v||v.version!==version||!v.quests||Object.keys(v.quests).length!==definitions.length||![null,...definitions.map(q=>q.id)].includes(v.cargo))return false;
 for(const q of definitions){const r=v.quests[q.id];
  if(!r||!stages.includes(r.stage)||typeof r.sourceHeard!=='boolean'||!Array.isArray(r.installed)||new Set(r.installed).size!==r.installed.length||r.installed.some(w=>!q.sceneWorlds.includes(w)))return false;
  if((r.stage==='carrying')!==(v.cargo===q.id)||r.stage==='carrying'&&!q.item||r.stage==='informed'&&q.kind!=='情報収集')return false;
  if(r.stage==='completed'){if(!r.receipt||r.receipt.amount!==q.payment||typeof r.receipt.id!=='string'||typeof r.receipt.at!=='string')return false;}else if(r.receipt!==null||r.installed.length)return false;
 }
 if(v.active){const a=v.active,q=definitions.find(q=>q.id===a.quest);if(!q||!['request','source','result'].includes(a.kind)||!Number.isInteger(a.line)||a.line<0||a.line>=linesFor(q,a.kind).length)return false;}
 return true;
}
export const validSidequests=v=>validate(v,SIDEQUESTS,4);
export function migrateSidequests(v){
 if(v?.version===1&&validate(v,KOWLOON_QUESTS,1)){
  for(const q of SCRAP_QUESTS)v.quests[q.id]=record();
  v.version=2;
 }
 if(v?.version===2&&validate(v,[...KOWLOON_QUESTS,...SCRAP_QUESTS],2)){
  for(const q of PELAGIC_QUESTS)v.quests[q.id]=record();
  v.version=3;
 }
 if(v?.version===3&&validate(v,[...KOWLOON_QUESTS,...SCRAP_QUESTS,...PELAGIC_QUESTS],3)){
  for(const q of LATER_QUESTS)v.quests[q.id]=record();
  v.version=4;
 }
 return v;
}
export function sidequestCargo(s){const q=SIDEQUESTS.find(q=>q.id===s.sidequests?.cargo);return q?{name:q.item,quest:q.id,entrusted:q.kind==='配送'}:null;}
export function anyCargo(s){return !!(s.commerce.cargo||s.commerce.followup.cargo||s.chapterTwo.cargo||s.chapterThree.cargo||s.chapterFour.cargo||s.sidequests?.cargo);}
const linesFor=(q,kind)=>kind==='request'?q.request:kind==='source'?q.sourceLines:q.result;
const unlocked=(s,q)=>!q.afterChapterFour||s.chapterFour.observed;
function topic(s,q,r){
 if(!unlocked(s,q))return null;
 const w=s.location.world;
 if(w===q.origin&&['available','offered'].includes(r.stage))return 'request';
 if(w===q.source&&r.stage==='accepted'&&q.kind!=='配送')return 'source';
 if(w===q.origin&&r.stage==='completed'&&r.installed.includes(q.origin))return 'result';
 return null;
}
export function sidequestArrival(s,from,to){
 s.sidequests.active=null;if(from===to)return;
 for(const q of SIDEQUESTS){const r=s.sidequests.quests[q.id];if(r.stage==='completed'&&q.sceneWorlds.includes(to)&&!r.installed.includes(to))r.installed.push(to);}
}
function hint(q,r){
 if(r.stage==='available'&&q.afterChapterFour)return '保守端末の追加作業票を読む。';
 if(r.stage==='available')return q.owner+'に、依頼の話を聞く。';
 if(r.stage==='offered')return '条件を聞いた。引き受けるかは、まだ決めていない。';
 if(r.stage==='accepted')return QUEST_WORLD_NAMES[q.source]+'で'+q.contact+'に'+(q.kind==='情報収集'?'話を聞く。':r.sourceHeard?'品物を見せてもらい、購入する。':'用途を伝え、品物の話を聞く。');
 if(r.stage==='carrying')return q.kind==='配送'?QUEST_WORLD_NAMES[q.source]+'の'+q.contact+'へ預かり荷物を届ける。':QUEST_WORLD_NAMES[q.origin]+'の'+q.owner+'へ品物を届ける。';
 if(r.stage==='informed')return QUEST_WORLD_NAMES[q.origin]+'の'+q.owner+'へ、聞いてきた話を伝える。';
 return r.installed.includes(q.origin)?q.effect:'仕事は完了。別の星を訪れて'+QUEST_WORLD_NAMES[q.origin]+'へ戻ると、その後を確かめられる。';
}
export function sidequestView(s){
 const v=s.sidequests,here=s.location.mode==='station'&&s.location.atStation&&!s.suspended;
 return {lockedReason:s.location.world==='relay'&&!s.chapterFour.observed?'追加作業票は、本編第四章の取引結果、または今回は納めない判断の結果を確認すると開きます。':null,quests:SIDEQUESTS.map(q=>{const r=v.quests[q.id],local=s.location.world===q.origin,source=s.location.world===q.source;
  const canDeliver=(r.stage==='carrying'&&(q.kind==='配送'?source:local))||(r.stage==='informed'&&local);
  const actions=[];
  if(topic(s,q,r))actions.push({type:'talk',label:q.afterChapterFour&&local?(r.stage==='completed'?'作業記録を確認する':'作業票を読む'):r.stage==='completed'?'その後の話を聞く':source?(q.kind==='情報収集'?'現地の工夫を聞く':'用途の話を聞く'):'依頼の話を聞く'});
  if(local&&r.stage==='offered')actions.push({type:'accept',label:q.kind==='配送'?q.item+'を預かる · 引き受ける':'この依頼を引き受ける',unavailable:q.kind==='配送'&&anyCargo(s)?'荷物棚はひと箱ぶんです。今の荷物を先に届けてください。':null});
  if(source&&r.stage==='accepted'&&r.sourceHeard&&q.item)actions.push({type:'buy',label:q.item+'を購入 · '+q.cost+' cr',unavailable:anyCargo(s)?'荷物棚が埋まっています。':s.commerce.cash<q.cost?'所持金が足りません。':null});
  if(canDeliver)actions.push({type:'deliver',label:(q.afterChapterFour&&local?(q.kind==='情報収集'?'調査結果を登録する':'納品する'):q.kind==='情報収集'?'話を伝える':q.kind==='配送'?'荷物を渡す':'品物を渡す')+' · '+q.payment+' cr受け取る'});
  if(r.stage==='carrying'&&(q.kind==='配送'?local:source))actions.push({type:'return',label:q.kind==='配送'?'預かり荷物を返す':'未使用の品を返品 · '+q.cost+' cr'});
  if(['accepted','informed'].includes(r.stage)&&local)actions.push({type:'cancel',label:'今回は取りやめる'});
  return {id:q.id,title:q.title,kind:q.kind,owner:q.owner,ownerRole:q.ownerRole,origin:q.origin,originName:QUEST_WORLD_NAMES[q.origin],source:q.source,contact:q.contact,sourceName:QUEST_WORLD_NAMES[q.source],item:q.item,cost:q.cost,payment:q.payment,stage:r.stage,hint:hint(q,r),effect:r.stage==='completed'?q.effect:null,installed:[...r.installed],receipt:r.receipt,here,actions:unlocked(s,q)?actions:[],visible:unlocked(s,q)&&(local||r.stage!=='available'),handover:q.handover};
 }),active:v.active?(()=>{const a=v.active,q=SIDEQUESTS.find(q=>q.id===a.quest),lines=linesFor(q,a.kind);return {...a,machine:q.afterChapterFour&&a.kind!=='source',title:q.title,speaker:a.kind==='source'?q.contact:q.owner,text:lines[a.line],total:lines.length};})():null};
}
export function sidequestAction(s,type,payload,now,id,fail){
 const v=s.sidequests;
 if(type==='sidequest.close'){v.active=null;return {};}
 if(s.location.mode!=='station'||!s.location.atStation)fail('NOT_ASHORE','下車してから、依頼の相手に会えます。',409);
 if(s.activeDialogue)fail('DIALOGUE_OPEN','今の会話を閉じてから、依頼の話をしてください。',409);
 if(type==='sidequest.next'){
  const a=v.active;if(!a||payload.quest!==a.quest)fail('QUEST_DIALOGUE','依頼の話を開き直してください。',409);
  const q=SIDEQUESTS.find(q=>q.id===a.quest),r=v.quests[q.id];
  if(topic(s,q,r)!==a.kind)fail('QUEST_DIALOGUE','この駅では、その話を続けられません。',409);
  if(a.line+1<linesFor(q,a.kind).length){a.line++;return {};}
  if(a.kind==='request')r.stage='offered';
  if(a.kind==='source'){r.sourceHeard=true;if(q.kind==='情報収集')r.stage='informed';}
  v.active=null;return {questNotice:'話を帳面に控えた。'};
 }
 const q=SIDEQUESTS.find(q=>q.id===payload.quest);if(!q)fail('BAD_QUEST','その依頼はありません。');
 if(!unlocked(s,q))fail('QUEST_LOCKED','本編第四章の結果を確認すると、追加作業票を読めます。',409);
 const r=v.quests[q.id];
 if(v.active)fail('QUEST_DIALOGUE','依頼の話を聞き終えるか、閉じてから操作してください。',409);
 if(type==='sidequest.talk'){
  const kind=topic(s,q,r);if(!kind)fail('QUEST_LOCATION','この駅では、今その話はできません。',409);
  v.active={quest:q.id,kind,line:0};s.activeAmbient=null;return {};
 }
 const action=sidequestView(s).quests.find(x=>x.id===q.id).actions.find(x=>'sidequest.'+x.type===type);
 if(!action)fail('QUEST_ORDER','依頼の手順と、現在の駅を確認してください。',409);
 if(action.unavailable)fail('QUEST_UNAVAILABLE',action.unavailable,409);
 let amount=null;
 if(type==='sidequest.accept'){
  if(q.kind==='配送'){r.stage='carrying';v.cargo=q.id;}else r.stage='accepted';
 }else if(type==='sidequest.buy'){
  if(s.commerce.transactions.length>=198)fail('TRADE_LIMIT','帳面の取引欄がいっぱいです。',409);
  amount=-q.cost;r.stage='carrying';v.cargo=q.id;
 }else if(type==='sidequest.return'){
  v.cargo=null;r.stage=q.kind==='配送'?'offered':'accepted';if(q.cost)amount=q.cost;
 }else if(type==='sidequest.cancel'){r.stage='offered';r.sourceHeard=false;
 }else if(type==='sidequest.deliver'){
  amount=q.payment;v.cargo=v.cargo===q.id?null:v.cargo;r.stage='completed';r.receipt={id,at:now,amount};
 }else fail('UNKNOWN_COMMAND','この操作には対応していません。');
 if(amount!==null){
  if(s.commerce.transactions.length>=200||s.commerce.cash+amount>1000000)fail('TRADE_LIMIT','この旅の取引記録の上限に達しました。',409);
  s.commerce.cash+=amount;
  s.commerce.transactions.push({id,type,item:q.item||q.title,amount,balance:s.commerce.cash,at:now,quest:q.id,label:type==='sidequest.buy'?'買付':type==='sidequest.return'?'返品':q.kind==='配送'?'運賃':q.kind==='情報収集'?'聞き取りの謝礼':q.kind==='探し物'?'品代と謝礼':'買取'});
 }
 return {checkpoint:true,questNotice:type==='sidequest.deliver'?'支払いを確認し、仕事を帳面に残した。':type==='sidequest.accept'?'依頼を引き受けた。期限はない。':type==='sidequest.buy'?'品物を荷物棚に積んだ。':type==='sidequest.return'?'荷物を返した。': '今回は取りやめると伝えた。',questLines:type==='sidequest.deliver'?q.handover:null};
}
