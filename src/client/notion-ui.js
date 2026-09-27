// Notion connection screen (Lolipop edition, signed-in players): connect through
// Notion's own permission page, pick the task database and its "done" column,
// or disconnect. Only the Lolipop gateway has notion* methods; elsewhere the
// entry stays hidden. Also keeps focus tasks in step with the chosen database:
// picking open Notion tasks, sending tasks added here, and marking them done there.
const $=id=>document.getElementById(id);
const RETURNS={
 connected:'Notionと連携しました。使うデータベースと、完了を表す列を選んでください。',
 denied:'Notionでの許可がキャンセルされました。',
 expired:'時間が経ちすぎたため、連携を完了できませんでした。もう一度お試しください。',
 unavailable:'Notion連携は、いまは使えません。',
 error:'Notionと連携できませんでした。少し時間をおいて、もう一度お試しください。',
};

export function createNotionUI(gateway){
 const supported=typeof gateway.notionStatus==='function',dialog=$('notion-dialog');
 let status=null,editing=false,busy=false,summary=null,sources=null;
 const signedIn=()=>supported&&gateway.authenticated;
 const errorText=e=>e?.code==='NETWORK'?'接続を確認できません。少し待ってから、もう一度お試しください。':e?.message||'Notionとやりとりできませんでした。';
 function message(text){$('notion-message').textContent=text;}
 function options(select,list,placeholder){select.replaceChildren(...(placeholder?[new Option(placeholder,'')]:[]),...list.map(([value,label])=>new Option(label,value)));}
 async function run(task){if(busy)return;busy=true;paint();try{await task();}catch(e){message(errorText(e));if(e?.code==='NOTION_REAUTH')status={...status,connected:false};}finally{busy=false;paint();}}

 let paint=function(){
  $('notion-open').hidden=!supported||(status&&!status.available&&signedIn());
  if(!dialog)return;
  const connected=!!status?.connected,setup=connected&&(!status.source||editing);
  $('notion-guest').hidden=signedIn();$('notion-off').hidden=!signedIn()||connected;
  $('notion-setup').hidden=!signedIn()||!setup;$('notion-on').hidden=!signedIn()||!connected||setup;
  $('notion-workspace').textContent=connected?'ワークスペース：'+(status.workspaceName||'（名前なし）'):'';
  if(connected&&status.source){const s=status.source;$('notion-summary').textContent='ワークスペース「'+(status.workspaceName||'')+'」のデータベース「'+s.name+'」を使っています。完了は「'+s.doneName+'」'+(s.doneType==='status'?'が「'+s.doneOptionName+'」':'のチェック')+'です。';}
  const done=summary?.done.find(p=>p.id===$('notion-done').value);
  $('notion-done-field').hidden=!summary;$('notion-option-field').hidden=done?.type!=='status';
  $('notion-save').disabled=busy||!summary||!done||(done.type==='status'&&!$('notion-option').value);
  for(const id of ['notion-connect','notion-reconnect','notion-change','notion-disconnect'])$(id).disabled=busy;
 };
 async function loadSources(){
  await run(async()=>{
   const r=await gateway.notionSources();sources=r.sources;summary=null;
   if(r.truncated)message('共有されたデータベースが多いため、先頭の1000件だけを表示しています。見つからないときは、連携しなおして共有するデータベースを絞ってください。');
   options($('notion-source'),sources.map(s=>[s.id,s.name]),sources.length?'選んでください':'共有されたデータベースがありません');
   if(status?.source&&sources.some(s=>s.id===status.source.id)){$('notion-source').value=status.source.id;}
  });
  if($('notion-source').value)await loadColumns();
 }
 async function loadColumns(){
  const id=$('notion-source').value;summary=null;paint();if(!id)return;
  await run(async()=>{
   summary=await gateway.notionSource(id);
   if(!summary.titleProperty){message('このデータベースにはタイトルの列がありません。');summary=null;return;}
   if(!summary.done.length){message('このデータベースには、チェックボックスかステータスの列がありません。Notionで列を追加してから選んでください。');summary=null;return;}
   message('');options($('notion-done'),summary.done.map(p=>[p.id,p.name+(p.type==='status'?'（ステータス）':'（チェックボックス）')]));
   const current=status?.source?.id===id?summary.done.find(p=>p.name===status.source.doneName):null;if(current)$('notion-done').value=current.id;
   fillOptions(current?status.source.doneOptionName:null);
  });
 }
 function fillOptions(currentName){
  const done=summary?.done.find(p=>p.id===$('notion-done').value);if(done?.type!=='status')return;
  options($('notion-option'),done.options.map(o=>[o.id,o.name+(o.group?'（'+o.group+'）':'')]));
  const pick=done.options.find(o=>o.name===currentName)?.id||done.suggested;if(pick)$('notion-option').value=pick;
 }
 async function refresh(){if(!signedIn()){status=null;return;}status=await gateway.notionStatus();}
 async function open(note=''){
  message(note);editing=false;paint();if(!dialog.open)dialog.showModal();
  if(!signedIn())return;
  await run(refresh);
  if(status?.connected&&!status.source)await loadSources();
 }
 $('notion-open')?.addEventListener('click',()=>void open());
 $('notion-close')?.addEventListener('click',()=>dialog.close());
 $('notion-connect')?.addEventListener('click',()=>void run(async()=>{const r=await gateway.notionPost('start');location.href=r.url;}));
 $('notion-reconnect')?.addEventListener('click',()=>void run(async()=>{const r=await gateway.notionPost('start');location.href=r.url;}));
 $('notion-change')?.addEventListener('click',()=>{editing=true;message('');paint();void loadSources();});
 $('notion-source')?.addEventListener('change',()=>void loadColumns());
 $('notion-done')?.addEventListener('change',()=>{fillOptions(null);paint();});
 $('notion-option')?.addEventListener('change',paint);
 $('notion-save')?.addEventListener('click',()=>void run(async()=>{
  const done=summary.done.find(p=>p.id===$('notion-done').value);
  status=await gateway.notionPost('configure',{dataSourceId:$('notion-source').value,doneProperty:done.id,...(done.type==='status'?{doneOption:$('notion-option').value}:{})});
  editing=false;message('設定しました。');
 }));
 $('notion-disconnect')?.addEventListener('click',()=>{if(!window.confirm('Notionとの連携を解除しますか？NOCTILUCAに保存している連携情報も消えます。'))return;void run(async()=>{status=await gateway.notionPost('disconnect');summary=null;sources=null;message('連携を解除しました。');});});
 gateway.addEventListener('change',e=>{if(['reload','guest'].includes(e.detail.reason)){status=null;summary=null;}paint();});

 // Back from Notion's permission page: /#notion=<result>. Tidy the address, then show the outcome.
 const back=/^#notion=(\w+)$/.exec(location.hash)?.[1];
 if(back&&supported){history.replaceState(null,'',location.pathname+location.search);void open(RETURNS[back]||RETURNS.error);}
 else if(signedIn())void refresh().then(paint,()=>{});
 // ---- task sync ----
 const isPage=v=>typeof v==='string'&&v!=='pending';
 const ready=()=>signedIn()&&!!status?.source;
 const tasks=()=>gateway.snapshot?.state?.focusTasks||[];
 // Completions that could not reach Notion wait on this device and are retried later.
 const doneKey=()=>'noctiluca.notion.pendingDone.'+(gateway.snapshot?.playerId||'');
 const readDone=()=>{try{return JSON.parse(localStorage.getItem(doneKey())||'[]');}catch{return [];}};
 const writeDone=list=>{try{localStorage.setItem(doneKey(),JSON.stringify(list.slice(-50)));}catch{/* retried only while the page is open */}};
 let flushing=false;
 async function push(task){const r=await gateway.notionPost('tasks/create',{text:task.text});await gateway.send('focus.task.link',{id:task.id,notion:r.pageId});}
 async function complete(task){
  if(!isPage(task?.notion))return true;
  try{await gateway.notionPost('tasks/complete',{pageId:task.notion});return true;}
  catch{writeDone([...readDone().filter(id=>id!==task.notion),task.notion]);return false;}
 }
 // Resend what failed before: tasks still marked pending, completions still queued.
 async function flush(){
  if(flushing||!ready()||gateway.blocked)return;flushing=true;
  try{
   for(const task of tasks().filter(t=>t.notion==='pending')){try{await push(task);}catch{break;}}
   let queued=readDone();
   for(const pageId of [...queued]){try{await gateway.notionPost('tasks/complete',{pageId});queued=queued.filter(id=>id!==pageId);}catch(e){if(e?.code!=='NOTION_NOT_FOUND')break;queued=queued.filter(id=>id!==pageId);}}
   writeDone(queued);
  }finally{flushing=false;}
 }
 // Picking open Notion tasks in the focus dialog, before the timer starts.
 let picks=[],picking=false;
 function pickMessage(text){$('notion-pick-message').textContent=text;}
 function paintPick(){
  const box=$('notion-pick');if(!box)return;box.hidden=!ready();
  const open=!$('notion-pick-panel').hidden,chosen=[...$('notion-pick-list').querySelectorAll('input:checked')].length,room=20-tasks().length;
  $('notion-pick-open').setAttribute('aria-expanded',String(open));$('notion-pick-open').hidden=open;
  $('notion-pick-add').disabled=picking||!chosen||chosen>room;$('notion-pick-add').textContent=chosen?chosen+'件を取り込む':'選んだタスクを取り込む';
  if(chosen>room)pickMessage('タスクは20件までです。あと'+Math.max(0,room)+'件選べます。');
 }
 async function openPick(){
  $('notion-pick-panel').hidden=false;pickMessage('読み込み中…');$('notion-pick-list').replaceChildren();paintPick();
  try{
   const r=await gateway.notionTasks(),have=new Set(tasks().map(t=>t.notion).filter(isPage));picks=r.tasks.filter(t=>!have.has(t.id));
   $('notion-pick-list').replaceChildren(...picks.map(t=>{const li=document.createElement('li'),label=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.value=t.id;box.addEventListener('change',paintPick);label.append(box,document.createTextNode(t.title));li.append(label);return li;}));
   pickMessage(picks.length?(r.more?'最近更新した100件から表示しています。':''):'取り込める未完了のタスクはありません。');
  }catch(e){pickMessage(errorText(e));}
  paintPick();
 }
 async function addPicked(){
  const ids=[...$('notion-pick-list').querySelectorAll('input:checked')].map(b=>b.value),chosen=picks.filter(t=>ids.includes(t.id));
  picking=true;paintPick();let added=0;
  try{for(const t of chosen){await gateway.send('focus.task.add',{text:t.title,notion:t.id});added++;}$('notion-pick-panel').hidden=true;pickMessage('');}
  catch(e){pickMessage(errorText(e));}
  finally{picking=false;paintPick();if(added&&$('timer-quick-task-message'))$('timer-quick-task-message').textContent='Notionから'+added+'件取り込みました。';}
 }
 $('notion-pick-open')?.addEventListener('click',()=>void openPick());
 $('notion-pick-close')?.addEventListener('click',()=>{$('notion-pick-panel').hidden=true;pickMessage('');paintPick();});
 $('notion-pick-add')?.addEventListener('click',()=>void addPicked());
 for(const id of ['timer-open','timer-overlay-open','route-timer-open'])$(id)?.addEventListener('click',()=>{$('notion-pick-panel').hidden=true;paintPick();void flush();});
 gateway.addEventListener('change',()=>paintPick());
 const repaint=paint;paint=()=>{repaint();paintPick();};
 paint();
 return {
  get status(){return status;},refresh:()=>refresh().then(paint),
  // A task has just been added here: send it to Notion when connected. Returns false if it has to wait.
  get sending(){return ready();},
  async added(task){if(!ready()||task?.notion!=='pending')return true;try{await push(task);return true;}catch{return false;}},
  completed:complete,flush,
 };
}
