const $=id=>document.getElementById(id);
export function createResetUI(g,engine,{message}){
 const dialog=$('reset-dialog'),consent=$('reset-consent');let busy=false,review=null;
 const available=()=>g.authenticated&&!g.busy&&!g.blocked&&!busy&&!engine.state.transition;
 function render(){
  $('reset-open').disabled=!available();
  $('reset-confirm').disabled=!available()||!review||!consent.checked;
  $('reset-cancel').disabled=busy;consent.disabled=busy;
 }
 function close(){if(busy)return;dialog.close();}
 function invalidate(){review=null;consent.checked=false;}
 $('reset-open').addEventListener('click',()=>{
  if(!available())return;
  review={playerId:g.snapshot.playerId,revision:g.snapshot.revision};consent.checked=false;
  $('reset-name').textContent=g.snapshot.state.displayName||'未設定';$('reset-error').textContent='';
  engine.setHeld();dialog.showModal();render();$('reset-cancel').focus();
 });
 consent.addEventListener('change',render);$('reset-cancel').addEventListener('click',close);
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 dialog.addEventListener('close',()=>{invalidate();render();$('reset-open').focus();});
 $('reset-form').addEventListener('submit',async e=>{
  e.preventDefault();if(!available()||!consent.checked||!review)return;
  if(review.playerId!==g.snapshot.playerId||review.revision!==g.snapshot.revision){invalidate();$('reset-error').textContent='旅の記録が更新されました。いったん戻り、内容を確認してください。';render();return;}
  busy=true;render();$('reset-error').textContent='';
  try{await g.send('journey.reset',{confirmation:'reset-journey'});}
  catch(e){$('reset-error').textContent=e.message;message('初期化の保存を確認できません。「同じ操作を再試行」または最新版の読み込みで確認してください。',true);}
  finally{busy=false;render();}
 });
 g.addEventListener('change',e=>{
  if(e.detail.reason==='journey.reset'){
   busy=false;invalidate();
   for(const d of document.querySelectorAll('dialog[open]'))if(d.id!=='account-dialog')d.close();
   engine.setHeld();message('初期化を保存しました。名前と設定を残し、九龍から新しい旅を始められます。');
  }else if(review&&!busy&&(review.playerId!==g.snapshot.playerId||review.revision!==g.snapshot.revision||!g.authenticated)){
   invalidate();if(dialog.open){$('reset-error').textContent='旅の記録が更新されました。いったん戻り、内容を確認してください。';}
  }
  render();
 });
 render();return {render};
}
