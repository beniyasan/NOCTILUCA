import {formatTime} from './focus-clock.js';

// Work journal: one page per day (JST), kept by the server apart from the journey save.
// Only the Lolipop gateway provides journal* methods; elsewhere the button stays hidden.
const $=id=>document.getElementById(id);
const clockTime=iso=>new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
const dayLabel=day=>{const [y,m,d]=day.split('-').map(Number),w='日月火水木金土'[new Date(Date.UTC(y,m-1,d)).getUTCDay()];return y+'年'+m+'月'+d+'日（'+w+'）';};
export function duration(seconds){const h=Math.floor(seconds/3600),m=Math.round(seconds%3600/60);return h?h+'時間'+(m?m+'分':''):seconds<60?seconds+'秒':m+'分';}
function stats(entries){const sessions=entries.filter(e=>e.kind==='session');return {sessions:sessions.length,seconds:sessions.reduce((n,e)=>n+e.seconds,0),tasks:entries.filter(e=>e.kind==='task').length};}
function statsLine(s){return s.sessions||s.tasks?'集中 '+s.sessions+'回・'+duration(s.seconds)+' ／ 完了したタスク '+s.tasks+'件':'';}

export function journalMarkdown(doc){
 const out=['# NOCTILUCA 作業日誌','','書き出し日時：'+new Date(doc.exportedAt).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})];
 for(const day of doc.days){
  const s=stats(day.entries),sessions=day.entries.filter(e=>e.kind==='session'),tasks=day.entries.filter(e=>e.kind==='task');
  out.push('','## '+dayLabel(day.day));const line=statsLine(s);if(line)out.push('',line);
  if(sessions.length){out.push('','### 作業');for(const e of sessions)out.push('- '+clockTime(e.at)+' 作業 '+formatTime(e.seconds)+(e.goal?' — 目標：'+e.goal:'')+(e.note?' — '+e.note:''));}
  if(tasks.length){out.push('','### 完了したタスク');for(const e of tasks)out.push('- '+clockTime(e.at)+' '+e.text);}
  if(day.body)out.push('','### メモ','',day.body);
 }
 return out.join('\n')+'\n';
}

export function createJournalUI(gateway){
 const supported=typeof gateway.journalDay==='function',dialog=$('journal-dialog');
 let today=null,viewing=null,page=null,days=[],more=false,busy=false,noteEntry=null,editing=null,loadedList=false,drawn='',breaks=0,ai=null,aiResult=null,organizing=false;
 const signedIn=()=>supported&&gateway.authenticated;
 const errorText=e=>e?.code==='NETWORK'?'接続を確認できません。少し待ってから、もう一度お試しください。':e?.message||'日誌を保存できませんでした。';
 function message(text){$('journal-message').textContent=text;}
 function setTab(list){$('journal-tab-day').setAttribute('aria-selected',String(!list));$('journal-tab-list').setAttribute('aria-selected',String(list));$('journal-day').hidden=list;$('journal-list').hidden=!list;}
 async function run(task,done){if(busy)return;busy=true;paint();try{await task();if(done)message(done);}catch(e){message(errorText(e));}finally{busy=false;paint();}}
 function entryRow(e){
  const li=document.createElement('li'),head=document.createElement('div'),time=document.createElement('span'),what=document.createElement('span');
  li.className='journal-entry-row journal-'+e.kind;time.className='journal-time';time.textContent=clockTime(e.at);head.className='journal-entry-head';head.append(time,what);li.append(head);
  if(e.kind==='task'){what.textContent='完了：'+e.text;return li;}
  what.textContent='作業 '+formatTime(e.seconds)+(e.goal?' · '+e.goal:'');
  if(editing===e.id){
   const form=document.createElement('form'),input=document.createElement('input'),save=document.createElement('button'),cancel=document.createElement('button');
   form.className='timer-task-entry journal-note-form';input.maxLength=200;input.value=e.note||'';input.setAttribute('aria-label','この区間のひとこと');input.autocomplete='off';save.type='submit';save.textContent='保存';cancel.type='button';cancel.textContent='やめる';
   cancel.addEventListener('click',()=>{editing=null;paint();});
   form.addEventListener('submit',ev=>{ev.preventDefault();void run(async()=>{const r=await gateway.journalSend({action:'note',day:viewing,entryId:e.id,note:input.value});page=r.journal;editing=null;},'ひとことを保存しました。');});
   form.append(input,save,cancel);li.append(form);queueMicrotask(()=>input.focus());return li;
  }
  const note=document.createElement('p'),edit=document.createElement('button');note.className='journal-note';note.textContent=e.note||'';note.hidden=!e.note;
  edit.type='button';edit.className='journal-link';edit.textContent=e.note?'ひとことを直す':'ひとことを書く';edit.addEventListener('click',()=>{editing=e.id;paint();});li.append(note,edit);return li;
 }
 function paintDay(){
  const entries=page?.entries||[];$('journal-date').textContent=viewing?dayLabel(viewing):'';$('journal-today').hidden=!viewing||viewing===today;
  $('journal-tab-day').textContent=!viewing||viewing===today?'今日':viewing.slice(5).split('-').map(Number).join('/');
  $('journal-stats').textContent=statsLine(stats(entries));$('journal-empty').hidden=!!entries.length||!page;
  // Rebuild only when the records or the row being edited change, so typing is never interrupted.
  const signature=viewing+'|'+editing+'|'+JSON.stringify(entries);if(signature!==drawn){drawn=signature;$('journal-entries').replaceChildren(...entries.map(entryRow));}
 }
 const LEVEL_KEY='noctiluca.journal.aiLevel';
 const level=()=>document.querySelector('input[name="journal-level"]:checked')?.value||'organize';
 function paintAi(){
  const section=$('journal-ai');section.hidden=!ai?.enabled;if(section.hidden)return;
  const run=$('journal-ai-run'),result=aiResult?.day===viewing;
  run.textContent=organizing?'整理しています…':'この日を整理する';run.disabled=busy||ai.remaining<=0;
  $('journal-ai-remaining').textContent=ai.remaining>0?'今日はあと'+ai.remaining+'回（1日'+ai.limit+'回まで）':'今日の回数を使い切りました。明日また使えます。';
  $('journal-ai-result').hidden=!result;for(const id of ['journal-ai-append','journal-ai-replace'])$(id).disabled=busy;
 }
 async function organize(){
  if(busy)return;try{localStorage.setItem(LEVEL_KEY,level());}catch{/* remembering the choice is optional */}
  busy=organizing=true;message('');paint();
  try{const r=await gateway.journalOrganize(viewing,level());ai=r.ai;aiResult={day:r.day,text:r.text};$('journal-ai-text').value=r.text;message('整理しました。内容を確かめてから、メモに入れてください。');}
  catch(e){if(e?.code==='AI_LIMIT')ai={...ai,remaining:0};message(e?.code==='NETWORK'?'応答がありませんでした。回数に数えられていないか、日誌を開き直して確かめてください。':errorText(e));}
  finally{busy=organizing=false;paint();}
 }
 function applyAi(append){
  const text=$('journal-ai-text').value.trim(),memo=$('journal-body').value.trim();if(!text||aiResult?.day!==viewing)return;
  const body=append&&memo?memo+'\n\n'+text:text;
  if([...body].length>4000){message('メモは4000文字までです。追記せずに置き換えるか、内容を短くしてください。');return;}
  if(!append&&memo&&!window.confirm('今のメモを、整理した内容で置き換えますか？'))return;
  void run(async()=>{const r=await gateway.journalSend({action:'body',day:viewing,body});page=r.journal;$('journal-body').value=page.body;aiResult=null;},append?'メモに追記しました。':'メモを置き換えました。');
 }
 function paintList(){
  const list=$('journal-days');list.replaceChildren(...days.map(d=>{
   const li=document.createElement('li'),b=document.createElement('button'),title=document.createElement('strong'),sub=document.createElement('span');
   b.type='button';title.textContent=dayLabel(d.day);sub.textContent=[statsLine({sessions:d.sessions,seconds:d.focusSeconds,tasks:d.tasks}),d.preview].filter(Boolean).join(' ／ ')||'メモのみ';
   b.append(title,sub);b.addEventListener('click',()=>void openDay(d.day));li.append(b);return li;
  }));
  $('journal-days-empty').hidden=!loadedList||!!days.length;$('journal-more').hidden=!more;
 }
 function paint(){
  $('journal-open').hidden=!supported;if(!supported)return;
  $('journal-guest').hidden=signedIn();$('journal-main').hidden=!signedIn();
  for(const id of ['journal-body-save','journal-delete-day','journal-export','journal-delete-all','journal-more'])$(id).disabled=busy;
  $('journal-delete-day').hidden=!page||(!page.entries.length&&!page.body);
  if(signedIn()){paintDay();paintList();paintAi();}
 }
 async function openDay(day){await run(async()=>{const r=await gateway.journalDay(day);today=r.today;viewing=r.journal.day;page=r.journal;ai=r.ai||null;aiResult=null;editing=null;$('journal-body').value=page.body;setTab(false);});}
 async function loadList(append=false){await run(async()=>{const r=await gateway.journalDays(append?days.at(-1)?.day:undefined);today=r.today;days=append?days.concat(r.days):r.days;more=r.more;loadedList=true;});}
 async function open(){message('');paint();if(!dialog.open)dialog.showModal();if(signedIn()){setTab(false);await openDay();}}
 async function download(){
  await run(async()=>{
   const doc=await gateway.journalExport();if(!doc.days.length){message('書き出す日誌がまだありません。');return;}
   const url=URL.createObjectURL(new Blob([journalMarkdown(doc)],{type:'text/markdown;charset=utf-8'})),a=document.createElement('a');
   a.href=url;a.download='noctiluca-work-journal-'+(today||'export')+'.md';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
   message(doc.days.length+'日分を書き出しました。');
  });
 }
 $('journal-open')?.addEventListener('click',()=>void open());
 $('journal-close')?.addEventListener('click',()=>dialog.close());
 $('journal-tab-day')?.addEventListener('click',()=>{setTab(false);paint();});
 $('journal-tab-list')?.addEventListener('click',()=>{setTab(true);void loadList();});
 $('journal-today')?.addEventListener('click',()=>void openDay());
 $('journal-more')?.addEventListener('click',()=>void loadList(true));
 $('journal-body-form')?.addEventListener('submit',e=>{e.preventDefault();void run(async()=>{const r=await gateway.journalSend({action:'body',day:viewing,body:$('journal-body').value});page=r.journal;},'メモを保存しました。');});
 $('journal-delete-day')?.addEventListener('click',()=>{if(!window.confirm(dayLabel(viewing)+'の日誌を削除しますか？元に戻せません。'))return;void run(async()=>{const r=await gateway.journalSend({action:'delete-day',day:viewing});page=r.journal;$('journal-body').value='';loadedList=false;aiResult=null;},'この日の日誌を削除しました。');});
 $('journal-delete-all')?.addEventListener('click',()=>{if(!window.confirm('すべての作業日誌を削除しますか？元に戻せません。'))return;void run(async()=>{await gateway.journalSend({action:'delete-all'});days=[];more=false;page={day:viewing,body:'',entries:[]};$('journal-body').value='';aiResult=null;},'すべての日誌を削除しました。');});
 $('journal-export')?.addEventListener('click',()=>void download());
 $('journal-ai-run')?.addEventListener('click',()=>void organize());
 $('journal-ai-append')?.addEventListener('click',()=>applyAi(true));
 $('journal-ai-replace')?.addEventListener('click',()=>applyAi(false));
 $('journal-ai-discard')?.addEventListener('click',()=>{aiResult=null;paint();});
 try{const saved=localStorage.getItem(LEVEL_KEY),input=document.querySelector('input[name="journal-level"][value="'+saved+'"]');if(input)input.checked=true;}catch{/* default level */}

 // Break-time note in the window timer: appears once the finished session is on today's page.
 const noteForm=$('timer-journal-note'),noteInput=$('timer-journal-input');
 function showNote(entry){noteEntry=entry;noteForm.hidden=!entry;noteInput.value='';$('timer-journal-message').textContent='';}
 noteForm?.addEventListener('submit',e=>{
  e.preventDefault();const text=noteInput.value.trim();if(!noteEntry||!text)return;$('timer-journal-save').disabled=true;
  gateway.journalSend({action:'note',day:noteEntry.day,entryId:noteEntry.id,note:text}).then(()=>{noteForm.hidden=true;noteEntry=null;},err=>{$('timer-journal-message').textContent=errorText(err);}).finally(()=>{$('timer-journal-save').disabled=false;});
 });
 // Recording is best effort: a failed journal write never interrupts the timer.
 async function record(payload){if(!signedIn())return null;try{const r=await gateway.journalSend(payload);if(dialog.open&&viewing===r.journal.day){page=r.journal;paint();}return {id:r.entryId,day:r.journal.day};}catch(e){console.warn('NOCTILUCA_JOURNAL_RECORD_FAILED',e?.code||e?.message);return null;}}
 const api={
  get available(){return signedIn();},
  async sessionEnded(seconds,goal){const rest=++breaks,entry=await record({action:'session',seconds,goal:goal||''});if(rest===breaks)showNote(entry);},
  breakEnded(){breaks++;showNote(null);},
  recordTask(text){void record({action:'task',text});}
 };
 gateway.addEventListener('change',e=>{if(['reload','guest'].includes(e.detail.reason)){showNote(null);page=null;days=[];loadedList=false;aiResult=null;ai=null;}paint();});
 paint();return api;
}
