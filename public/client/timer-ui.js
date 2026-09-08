import {createTimerTasksUI} from './timer-tasks-ui.js';
import {createFocusClock,formatTime} from './focus-clock.js';
export function createTimerUI(engine,gateway){
 const $=id=>document.getElementById(id),clock=createFocusClock();
 let showReady=false,busy=false,error='',target=null,epoch=0,originalTitle=document.title;
 const tasks=createTimerTasksUI(gateway,()=>clock.view.active);
 const prefs=()=>gateway.snapshot.state.settings;
 const blocked=()=>gateway.blocked||gateway.snapshot.state.suspended||gateway.snapshot.state.location.mode==='station'||gateway.snapshot.state.narrative?.active||engine.talk.isDirect;
 function message(text){$('timer-message').textContent=text;}
 function fill(){
  const p=prefs();$('timer-goal').value=p.focusGoal||'';$('timer-standard').checked=p.travelSeconds===null;
  for(const [prefix,value] of [['travel',p.travelSeconds??120],['focus',p.focusSeconds],['break',p.breakSeconds],['long',p.longBreakSeconds]]){$(prefix+'-min').value=Math.floor(value/60);$(prefix+'-sec').value=value%60;}
  $('long-every').value=p.longBreakEvery;$('bell-enabled').checked=p.arrivalBell;$('bell-volume').value=p.bellVolume;$('bell-level').textContent=p.bellVolume+'%';standard();
 }
 function standard(){for(const id of ['travel-min','travel-sec'])$(id).disabled=$('timer-standard').checked;}
 function payload(){
  if(!$('timer-form').reportValidity())throw new Error('時間の入力を確認してください。');
  const seconds=prefix=>Number($(prefix+'-min').value)*60+Number($(prefix+'-sec').value);
  const p={focusGoal:$('timer-goal').value.trim(),travelSeconds:$('timer-standard').checked?null:seconds('travel'),focusSeconds:seconds('focus'),breakSeconds:seconds('break'),longBreakSeconds:seconds('long'),longBreakEvery:Number($('long-every').value),arrivalBell:$('bell-enabled').checked,bellVolume:Number($('bell-volume').value)};
  if(p.travelSeconds!==null&&(p.travelSeconds<30||p.travelSeconds>86400))throw new Error('駅間時間は30秒〜24時間で指定してください。');
  if([p.focusSeconds,p.breakSeconds,p.longBreakSeconds].some(n=>n<5||n>86400))throw new Error('作業と休憩は5秒〜24時間で指定してください。');
  return p;
 }
 async function save(){const p=payload();await gateway.send('settings.set',p);showReady=true;return p;}
 function paint(){
  const v=clock.view,label=v.phase==='work'?'作業中':v.phase==='long'?'長い休憩':v.phase==='break'?'休憩中':'ポモドーロ';
  $('timer-phase').textContent=v.waiting?(error?'確認が必要です':'到着・発車を確認中'):label+(v.paused?' · 一時停止':'');
  $('timer-time').textContent=formatTime(v.active?v.seconds:prefs().focusSeconds);
  const goal=v.active?(prefs().focusGoal||''):'';
  for(const id of ['timer-goal-display','timer-overlay-goal']){$(id).textContent=goal?'目標 · '+goal:'';$(id).hidden=!goal;}
  $('timer-count').textContent='このタブで '+v.completed+' 回完了';
  $('timer-start').hidden=v.active;$('timer-pause').hidden=!v.active;$('timer-stop').hidden=!v.active;
  $('timer-pause').textContent=error?'再試行':v.paused?'再開する':'一時停止';
  for(const id of ['timer-start','timer-pause','timer-stop','timer-save'])$(id).disabled=busy;
  const journey=engine.travelTimer,custom=prefs().travelSeconds!==null;
  tasks.render();
  $('timer-overlay').hidden=!(v.active||custom||showReady);
  $('timer-overlay').dataset.phase=v.active?v.phase:'ready';
  $('timer-overlay-phase').textContent=v.active?(v.waiting?(error?'確認が必要です':'到着・発車を確認中'):label+(v.paused?' · 一時停止':'')):custom?(journey.active?(engine.state.paused?'次の駅まで · 一時停止':'次の駅まで'):'発車待ち'):'作業タイマー · 開始待ち';
  $('timer-overlay-time').textContent=formatTime(v.active?v.seconds:custom?(journey.active?journey.seconds:prefs().travelSeconds):prefs().focusSeconds);
  $('timer-overlay-foot').textContent=v.active?v.completed+' 回完了 · 押して操作':'押してタイマーを操作';
  $('timer-mini').textContent=v.active?label+' '+formatTime(v.seconds)+(v.paused?' ⏸':''):'';
  if(v.active){$('progress').style.width=Math.min(100,Math.max(0,1-v.seconds/v.total)*100)+'%';$('journey-mode').textContent=label+(v.paused?' · 一時停止':'');$('countdown').textContent=formatTime(v.seconds);document.title=formatTime(v.seconds)+' '+label+' | NOCTILUCA';}
  else document.title=originalTitle;
 }
 function stop(){epoch++;showReady=false;clock.stop();target=null;error='';engine.setTimerPaused(false);engine.state.stop.held=false;engine.resetTravelClock();message('タイマーを終了しました。');paint();}
 async function boundary(){
  if(busy||!clock.view.waiting)return;
  if(blocked()){error='下車・会話・未確認の保存を解決してから再試行してください。';message(error);paint();return;}
  busy=true;error='';paint();const generation=epoch,phase=clock.view.phase;
  try{
   if(phase==='work'){
    target??=(engine.state.index+1)%engine.worlds.length;
    await engine.timerArrive(target);
    if(generation!==epoch)return;
    clock.completeWork();const p=prefs(),long=clock.view.completed%p.longBreakEvery===0;
    clock.start(long?'long':'break',long?p.longBreakSeconds:p.breakSeconds);target=null;
    message(engine.worlds[engine.state.index].station+'に到着しました。ひと休みしましょう。');
   }else{
    await engine.timerDepart();if(generation!==epoch)return;clock.start('work',prefs().focusSeconds);message('発車しました。次の駅まで、作業の時間です。');
   }
  }catch(e){error=e.message;engine.setTimerPaused(true);message(error+' 「旅の記録」で保存を確認してから再試行できます。');}
  finally{busy=false;paint();}
 }
 async function toggle(){
  if(busy)return;
  if(clock.view.waiting){if(gateway.blocked){message('「旅の記録」で未確認の保存を解決してください。');return;}engine.setTimerPaused(false);await boundary();return;}
  if(clock.view.paused){if(blocked()){message('列車に戻り、会話や保存の確認を終えてから再開してください。');return;}await engine.bell.arm();clock.resume();engine.setTimerPaused(false);message('タイマーを再開しました。');}
  else{clock.pause();engine.setTimerPaused(true);message('作業と休憩の時間を一時停止しました。');}paint();
 }
 function pulse(){
  if(clock.view.active&&!busy){
   if(blocked()&&!clock.view.paused&&!clock.view.waiting){clock.pause();engine.setTimerPaused(true);message('下車・会話・保存の確認中はタイマーを一時停止します。');}
   if(clock.poll())void boundary();
  }paint();
 }
 $('timer-start').addEventListener('click',async()=>{
  if(busy)return;if(engine.state.transition||blocked()){message('到着を待ち、列車に戻ってから始めてください。');return;}
  busy=true;paint();
  try{await engine.bell.arm();const p=await save();await engine.timerDepart();clock.resetCount();clock.start('work',p.focusSeconds);error='';target=null;message('次の駅まで、作業の時間です。');}
  catch(e){message(e.message);}finally{busy=false;paint();}
 });
 $('timer-pause').addEventListener('click',toggle);$('timer-stop').addEventListener('click',stop);
 $('timer-form').addEventListener('submit',async e=>{e.preventDefault();if(busy)return;busy=true;paint();try{await save();message(gateway.authenticated?'設定を保存しました。':'設定しました。ゲストの設定はこのページ内だけです。');}catch(e){message(e.message);}finally{busy=false;paint();}});
 for(const id of ['timer-open','route-timer-open','timer-overlay-open'])$(id).addEventListener('click',()=>{$('route-dialog').close();fill();paint();$('timer-dialog').showModal();});
 $('timer-close').addEventListener('click',()=>$('timer-dialog').close());$('timer-standard').addEventListener('change',standard);
 $('bell-volume').addEventListener('input',()=>{$('bell-level').textContent=$('bell-volume').value+'%';});
 $('bell-test').addEventListener('click',async()=>{message(await engine.bell.test(Number($('bell-volume').value))?'到着ベルの試聴です。':'音を開始できませんでした。ブラウザの音声設定を確認してください。');});
 const timer={get active(){return clock.view.active;},get view(){return clock.view;},toggle,stop,paint};engine.timer=timer;
 gateway.addEventListener('change',e=>{if(e.detail.reason==='journey.reset'){stop();clock.resetCount();engine.setHeld();paint();return;}if(['reload','journey.resume','backup.restore','guest'].includes(e.detail.reason)&&clock.view.active)stop();});
 document.addEventListener('visibilitychange',pulse);setInterval(pulse,250);fill();paint();return timer;
}
