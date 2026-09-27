// Notion connection screen (Lolipop edition, signed-in players): connect through
// Notion's own permission page, pick the task database and its "done" column,
// or disconnect. Only the Lolipop gateway has notion* methods; elsewhere the
// entry stays hidden. Task syncing itself lives with the timer tasks.
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

 function paint(){
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
 }
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
 paint();
 return {get status(){return status;},refresh:()=>refresh().then(paint)};
}
