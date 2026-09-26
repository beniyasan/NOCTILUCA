import {createResetUI} from './reset-ui.js';
const $=id=>document.getElementById(id);
export function createJourneyUI(g,engine){
 const account=$('account-dialog'),resume=$('resume-dialog');let uiBusy=false,lastProfileName=null;
 function message(text,error=false){$('account-message').textContent=text;$('account-message').classList.toggle('error',error);}
 function openAccount(){if(resume.open)resume.close();engine.talk.close();engine.setHeld();render();if(!account.open)account.showModal();}
 function closeAccount(){account.close();if(g.snapshot.state.suspended&&!resume.open)resume.showModal();}
 function fileDownload(data,name){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
 async function run(fn){if(uiBusy)return;uiBusy=true;render();try{const result=await fn();return result;}catch(e){message(e.message,true);engine.toast(e.message);}finally{uiBusy=false;render();}}
 function render(){
  const s=g.snapshot.state,world=engine.worlds.find(w=>w.id===s.location.world),busy=uiBusy||!!g.busy;
  $('traveler-name').textContent=g.authenticated?(s.displayName||'名前のない旅'):'旅の記録';
  $('save-status').textContent=g.blocked?'保存未確認 · 要確認':g.busy?'記録中…':g.authenticated?(g.mode==='local'?'ローカルDB · 保存済み':'旅の記録 · 保存済み'):g.mode==='unavailable'?'保存サーバー未接続':'ゲスト · ログインできます';
  $('account-open').classList.toggle('is-pending',g.blocked);
  $('signed-out-view').hidden=g.authenticated;$('signed-in-view').hidden=!g.authenticated;
  const local=g.mode==='local';$('runtime-badge').hidden=!local;
  const signInPath=typeof g.signInPath==='function'?g.signInPath():local?'/dev/login':'/signin-with-chatgpt?return_to=%2F';
  const signOutPath=typeof g.signOutPath==='function'?g.signOutPath():local?'/dev/logout':'/signout-with-chatgpt?return_to=%2F';
  $('signin-link').href=signInPath;$('signin-link').textContent=typeof g.authLabel==='function'?g.authLabel():local?'ローカルのテストユーザーを選ぶ':'ChatGPTでログイン';
  $('signout-link').href=signOutPath;
  $('platform-toggle').hidden=engine.state.transition||engine.state.stop.phase!=='stop'||s.suspended;
  $('platform-toggle').disabled=busy||g.blocked||engine.talk.isDirect;
  $('platform-toggle').textContent=s.location.mode==='station'?'列車に戻る':'下車する';
  if(lastProfileName!==s.displayName){$('player-name').value=s.displayName;lastProfileName=s.displayName;}
  $('ticket-number').textContent='REV '+String(g.snapshot.revision).padStart(4,'0');$('ticket-place').textContent=world.station;
  $('ticket-description').textContent=s.suspended?'ここで旅を中断しています。':s.location.mode==='station'?'ホームで過ごしています。列車はここで待っています。':s.location.atStation?'列車が駅に停まっています。':'列車で移動中。次回はこの星の走行区間から再開します。';
  $('ticket-memory').textContent='手帳 '+s.notes.length+'件 / 面識 '+Object.values(s.actors).filter(a=>a.met).length+'人';
  $('ticket-save').textContent=g.snapshot.updatedAt?'記録 '+new Date(g.snapshot.updatedAt).toLocaleTimeString('ja-JP'):'ゲストの旅';
  $('name-save').disabled=busy||g.blocked||!g.authenticated;
  $('save-and-rest').disabled=busy||g.blocked||s.location.mode!=='station'||s.suspended||!s.displayName;
  $('save-hint').textContent=s.suspended?'保存を確認しました。この画面を閉じて大丈夫です。':s.location.mode==='station'?'中断しても、離れている間に物語は進みません。':'停車中に「下車する」を押すと、この駅で中断できます。';
  for(const id of ['export-save','restore-save','import-local','import-file'])$(id).disabled=busy||g.blocked||!g.authenticated;
  $('save-problem').hidden=!g.error;
  $('save-problem-message').textContent=(g.error?.message||'')+(g.localNotice?' '+g.localNotice:'');
  $('retry-save').disabled=!g.pending||busy;$('reload-save').disabled=!g.authenticated||busy;
  $('connection-alert').hidden=!g.blocked&&g.mode!=='unavailable';
  $('connection-text').textContent=g.blocked?'旅の保存を確認できていません。移動せず、記録をご確認ください。':'保存サーバーに接続できません。現在は記録しない閲覧です。';
  $('resume-description').textContent=(s.displayName||'旅人')+'の旅は、'+world.station+'で待っています。';
  $('resume-journey').disabled=busy||g.blocked;
 }
 $('account-open').addEventListener('click',openAccount);$('account-close').addEventListener('click',closeAccount);
 account.addEventListener('cancel',e=>{e.preventDefault();closeAccount();});resume.addEventListener('cancel',e=>e.preventDefault());
 $('guest-continue').addEventListener('click',()=>{closeAccount();});$('connection-details').addEventListener('click',openAccount);
 $('name-form').addEventListener('submit',e=>{e.preventDefault();const name=$('player-name').value;run(async()=>{await g.send('profile.set',{name});message('名前を保存しました。停車中に「下車する」でホームへどうぞ。');});});
 $('platform-toggle').addEventListener('click',()=>run(async()=>{
  if(!engine.canAct())throw new Error('駅での停車を待ってください。');
  if(!g.snapshot.state.displayName){openAccount();return;}
  engine.talk.close();engine.setHeld();await g.send(g.snapshot.state.location.mode==='station'?'journey.board':'journey.alight');
 }));
 $('save-and-rest').addEventListener('click',()=>run(async()=>{
  engine.talk.close();await g.send('journey.checkpoint');message('保存完了。この画面を閉じて、また戻ってこられます。');
 }));
 $('resume-journey').addEventListener('click',()=>run(async()=>{await g.send('journey.resume');resume.close();message('');}));
 $('resume-account').addEventListener('click',openAccount);
 $('export-save').addEventListener('click',()=>run(async()=>{fileDownload(await g.export(),'noctiluca-journey-'+new Date().toISOString().slice(0,10)+'.json');message('バックアップを書き出しました。同じアカウント・同じサイトで復元できます。');}));
 $('restore-save').addEventListener('click',()=>$('restore-file').click());
 $('restore-file').addEventListener('change',e=>run(async()=>{
  const file=e.target.files[0];e.target.value='';if(!file)return;if(file.size>96*1024)throw new Error('ファイルが大きすぎます。');
  const document=JSON.parse(await file.text());if(!confirm('現在の旅を、選んだバックアップの時点に戻します。同じアカウントの記録だけを復元します。続けますか？'))return;
  await g.send('backup.restore',{document});message('復元しました。記録を閉じて、この駅から再開できます。');
 }));
 async function importLegacy(m){if(!confirm('旧版の面識と手帳を、この新しい旅へ取り込みます。元の記録は削除しません。'))return;const r=await g.send('legacy.import',{memory:m});message('旧版のメモを '+r.outcome.importedNotes+' 件取り込みました。');}
 $('import-local').addEventListener('click',()=>run(async()=>{let raw;try{raw=localStorage.getItem('noctiluca.conversations.v1');}catch{throw new Error('このブラウザでは旧記録を読み取れません。');}if(!raw)throw new Error('この保存領域には旧版の記録がありません。別URL・HTMLの記録は、旧版側でJSONを書き出して取り込んでください。');await importLegacy(JSON.parse(raw));}));
 $('import-file').addEventListener('click',()=>$('legacy-file').click());
 $('legacy-file').addEventListener('change',e=>run(async()=>{const f=e.target.files[0];e.target.value='';if(!f)return;if(f.size>64*1024)throw new Error('旧記録のファイルが大きすぎます。');await importLegacy(JSON.parse(await f.text()));}));
 $('retry-save').addEventListener('click',()=>run(async()=>{await g.retry();message('サーバーで保存を確認しました。');}));
 $('reload-save').addEventListener('click',()=>run(async()=>{if(g.pending&&!confirm('未確認の操作の再送をやめ、サーバー側の最新の旅を読み込みます。すでに確定した記録は残ります。続けますか？'))return;await g.reload();message('サーバーの最新の記録を読み込みました。');}));
 $('signout-link').addEventListener('click',e=>{if(g.busy||g.blocked){e.preventDefault();message('保存を確認してからログアウトしてください。',true);}});
 window.addEventListener('beforeunload',e=>{if(g.authenticated&&(g.busy||g.blocked)){e.preventDefault();e.returnValue='';}});
 g.addEventListener('change',e=>{render();if(['reload','backup.restore','journey.checkpoint'].includes(e.detail.reason)&&g.snapshot.state.suspended&&!account.open&&!resume.open)resume.showModal();});
 setInterval(render,400);render();
 if(g.authenticated&&!g.snapshot.state.displayName)openAccount();else if(g.authenticated&&g.snapshot.state.suspended)resume.showModal();
 createResetUI(g,engine,{message});
 return {openAccount,render};
}
