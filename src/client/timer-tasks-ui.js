const $=id=>document.getElementById(id);
export function createTimerTasksUI(g,active,onComplete,notion=()=>null){
 const list=$('timer-task-list'),input=$('timer-task-input'),composer=$('timer-task-composer'),toggle=$('timer-task-toggle');let busy=false,last='',lastQuick='',editingPlayer=g.snapshot.playerId,messageExpiresAt=0;
 // The focus dialog can add tasks before the timer starts; completing them stays with the running timer.
 const quickList=$('timer-quick-task-list'),quickInput=$('timer-quick-task-input'),quickAdd=$('timer-quick-task-add');
 function message(text,temporary=false){$('timer-task-message').textContent=text;messageExpiresAt=temporary?Date.now()+3000:0;}
 function quickMessage(text){if($('timer-quick-task-message'))$('timer-quick-task-message').textContent=text;}
 function render(){
  if(messageExpiresAt&&Date.now()>=messageExpiresAt)message('');
  const tasks=g.snapshot.state.focusTasks||[],disabled=busy||!!g.busy||g.blocked;
  if(!active())composer.open=false;
  $('timer-tasks').hidden=!active();$('timer-overlay').dataset.tasks=String(active());
  $('timer-task-empty').hidden=!!tasks.length;
  const signature=JSON.stringify(tasks);
  // Timer ticks never replace the input or task buttons while they have focus.
  if(signature!==last){
   const focused=document.activeElement?.dataset?.taskId;last=signature;list.replaceChildren();
   for(const task of tasks){
    const row=document.createElement('li'),text=document.createElement('span'),button=document.createElement('button');
    row.className='timer-task-row';text.textContent=task.text;button.type='button';button.textContent='完了';button.dataset.taskId=task.id;button.setAttribute('aria-label',task.text+'を完了して一覧から削除');
    button.addEventListener('click',()=>void send('complete',{id:task.id}).then(ok=>{if(ok)onComplete?.(task);}));row.append(text,button);list.append(row);
   }
   if(focused)(composer.open?input:toggle).focus({preventScroll:true});
  }
  for(const button of list.querySelectorAll('button'))button.disabled=disabled||!active();
  $('timer-task-add').disabled=disabled||!active()||!input.value.trim()||tasks.length>=20;
  if(!quickList)return;
  if(signature!==lastQuick){lastQuick=signature;quickList.replaceChildren(...tasks.map(task=>{const li=document.createElement('li');li.textContent=task.text;return li;}));}
  quickAdd.disabled=disabled||!quickInput.value.trim()||tasks.length>=20;
  const full='タスクは20件までです。終わったものは、始めたあと完了にできます。',note=$('timer-quick-task-message');
  if(tasks.length>=20&&!busy)quickMessage(full);else if(note?.textContent===full)quickMessage('');
 }
 async function addBeforeStart(){
  const text=quickInput.value.trim();if(!text||busy||g.busy||g.blocked)return;
  quickMessage('保存中…');
  if(await send('add',{text},{anytime:true,say:quickMessage})){if(quickInput.value.trim()===text)quickInput.value='';if($('timer-quick-task-message')?.textContent==='保存中…')quickMessage('');render();}
 }
 async function send(action,payload,{anytime=false,say=message}={}){
  if(busy||g.busy||g.blocked||(!anytime&&!active()))return false;
  busy=true;if(say===message)message('保存中…');render();
  // While connected to Notion, a new task is saved here first, then created there.
  const link=action==='add'&&notion()?.sending;if(link)payload={...payload,notion:'pending'};
  try{
   await g.send('focus.task.'+action,payload);
   if(link){const task=[...(g.snapshot.state.focusTasks||[])].reverse().find(t=>t.notion==='pending'&&t.text===payload.text.trim());if(task&&!await notion().added(task))say('Notionに送れませんでした。次に「集中する」を開いたときに送り直します。');}
   return true;
  }
  catch(e){say(e.message+(g.blocked?' 「旅の記録」で保存を確認してください。':''));return false;}
  finally{busy=false;render();}
 }
 $('timer-task-form').addEventListener('submit',e=>{e.preventDefault();if(!e.target.reportValidity()||!input.value.trim())return;void send('add',{text:input.value.trim()});});
 input.addEventListener('input',render);
 quickInput?.addEventListener('input',render);
 quickAdd?.addEventListener('click',()=>void addBeforeStart());
 // Enter adds the task instead of submitting the dialog (which would start the timer).
 quickInput?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();void addBeforeStart();}});
 g.addEventListener('change',e=>{
  if(g.snapshot.playerId!==editingPlayer||['reload','guest','backup.restore','journey.reset'].includes(e.detail.reason)){
   composer.open=false;input.value='';if(quickInput)quickInput.value='';quickMessage('');editingPlayer=g.snapshot.playerId;message('');
  }else if(e.detail.reason==='focus.task.add'){
   // Preserve any next task typed while the preceding addition was saving.
   const added=g.snapshot.state.focusTasks?.at(-1);if(added?.text===input.value.trim()){
    input.value='';const focused=document.activeElement===input||document.activeElement===$('timer-task-add');composer.open=false;if(focused)toggle.focus({preventScroll:true});
   }
   message('タスクを追加しました。',true);
  }else if(e.detail.reason==='focus.task.complete')message('完了しました。',true);
  render();
 });
 render();return {render};
}
