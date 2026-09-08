const $=id=>document.getElementById(id);
export function createTimerTasksUI(g,active){
 const list=$('timer-task-list'),input=$('timer-task-input'),composer=$('timer-task-composer'),toggle=$('timer-task-toggle');let busy=false,last='',editingPlayer=g.snapshot.playerId,messageExpiresAt=0;
 function message(text,temporary=false){$('timer-task-message').textContent=text;messageExpiresAt=temporary?Date.now()+3000:0;}
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
    button.addEventListener('click',()=>send('complete',{id:task.id}));row.append(text,button);list.append(row);
   }
   if(focused)(composer.open?input:toggle).focus({preventScroll:true});
  }
  for(const button of list.querySelectorAll('button'))button.disabled=disabled||!active();
  $('timer-task-add').disabled=disabled||!active()||!input.value.trim()||tasks.length>=20;
 }
 async function send(action,payload){
  if(busy||g.busy||g.blocked||!active())return;
  busy=true;message('保存中…');render();
  try{await g.send('focus.task.'+action,payload);}
  catch(e){message(e.message+(g.blocked?' 「旅の記録」で保存を確認してください。':''));}
  finally{busy=false;render();}
 }
 $('timer-task-form').addEventListener('submit',e=>{e.preventDefault();if(!e.target.reportValidity()||!input.value.trim())return;void send('add',{text:input.value.trim()});});
 input.addEventListener('input',render);
 g.addEventListener('change',e=>{
  if(g.snapshot.playerId!==editingPlayer||['reload','guest','backup.restore','journey.reset'].includes(e.detail.reason)){
   composer.open=false;input.value='';editingPlayer=g.snapshot.playerId;message('');
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
