import {createTimerTasksUI} from './timer-tasks-ui.js';
import {createFocusClock,formatTime} from './focus-clock.js';

export function createTimerUI(engine,gateway){
 const $=id=>document.getElementById(id),clock=createFocusClock();
 let showReady=false,busy=false,error='',target=null,epoch=0,originalTitle=document.title;
 let quickGoalDraft=null,durationDraft=null,settingsReturnToQuick=false;
 const tasks=createTimerTasksUI(gateway,()=>clock.view.active,task=>engine.journal?.recordTask(task.text));
 const prefs=()=>gateway.snapshot?.state?.settings||{};
 const state=()=>gateway.snapshot?.state||{};
 const setText=(id,value)=>{const n=$(id);if(n)n.textContent=value;};
 const setHidden=(id,value)=>{const n=$(id);if(n)n.hidden=!!value;};
 const setDisabled=(id,value)=>{const n=$(id);if(n)n.disabled=!!value;};
 const show=id=>{const d=$(id);if(d&&!d.open)d.showModal();};
 const close=id=>{const d=$(id);if(d?.open)d.close();};
 function message(text){setText('timer-message',text);}
 function detailsMessage(text){setText('timer-settings-message',text);}
 function blockedReason({includeStation=true}={}){
  const s=state();
  if(gateway.blocked)return '「旅の記録」で未確認の保存を解決してから始められます。';
  if(s.suspended)return '旅を再開してから始められます。';
  if(engine.state.transition)return '到着を待ってから始められます。';
  if(includeStation&&s.location?.mode==='station')return '列車に戻ると始められます。';
  if(s.narrative?.active)return '帳面を閉じてから始められます。';
  if(engine.talk?.isDirect)return '会話を終えてから始められます。';
  return '';
 }
 // Quick durations are edited in whole minutes; untouched values keep any seconds set in the detailed settings.
 function durations(){const p=prefs();return {focus:durationDraft?.focus??p.focusSeconds,rest:durationDraft?.rest??p.breakSeconds};}
 function minutes(seconds){return seconds%60?formatTime(seconds):seconds/60+'分';}
 function fillDurations(){const d=durations();if($('quick-focus'))$('quick-focus').value=Math.max(1,Math.round(d.focus/60));if($('quick-break'))$('quick-break').value=Math.max(1,Math.round(d.rest/60));}
 function editDurations(){const f=numberValue('quick-focus'),r=numberValue('quick-break'),ok=n=>Number.isInteger(n)&&n>=1&&n<=1440;durationDraft={focus:ok(f)?f*60:durations().focus,rest:ok(r)?r*60:durations().rest};paint();}
 function pickPreset(button){durationDraft={focus:Number(button.dataset.focus)*60,rest:Number(button.dataset.rest)*60};fillDurations();paint();}
 function fillQuick(){if(quickGoalDraft===null)quickGoalDraft=prefs().focusGoal||'';if($('timer-goal'))$('timer-goal').value=quickGoalDraft;fillDurations();}
 function fillSettings(){
  const p=prefs();if($('timer-standard'))$('timer-standard').checked=p.travelSeconds===null;
  for(const [prefix,value] of [['travel',p.travelSeconds??120],['focus',p.focusSeconds],['break',p.breakSeconds],['long',p.longBreakSeconds]]){if($(prefix+'-min'))$(prefix+'-min').value=Math.floor(value/60);if($(prefix+'-sec'))$(prefix+'-sec').value=value%60;}
  if($('long-every'))$('long-every').value=p.longBreakEvery;if($('bell-enabled'))$('bell-enabled').checked=p.arrivalBell;if($('bell-volume'))$('bell-volume').value=p.bellVolume;setText('bell-level',p.bellVolume+'%');standard();
 }
 function standard(){const checked=$('timer-standard')?.checked??true;for(const id of ['travel-min','travel-sec'])setDisabled(id,checked);}
 function numberValue(id,fallback=0){const n=Number($(id)?.value);return Number.isFinite(n)?n:fallback;}
 function settingsPayload(){
  const form=$('timer-form');if(form&&!form.reportValidity())throw new Error('時間の入力を確認してください。');
  const seconds=prefix=>numberValue(prefix+'-min')*60+numberValue(prefix+'-sec');
  const p={focusGoal:prefs().focusGoal||'',travelSeconds:$('timer-standard')?.checked?null:seconds('travel'),focusSeconds:seconds('focus'),breakSeconds:seconds('break'),longBreakSeconds:seconds('long'),longBreakEvery:numberValue('long-every'),arrivalBell:!!$('bell-enabled')?.checked,bellVolume:numberValue('bell-volume')};
  if(p.travelSeconds!==null&&(p.travelSeconds<30||p.travelSeconds>86400))throw new Error('駅間時間は30秒〜24時間で指定してください。');
  if([p.focusSeconds,p.breakSeconds,p.longBreakSeconds].some(n=>n<5||n>86400))throw new Error('作業と休憩は5秒〜24時間で指定してください。');
  return p;
 }
 async function saveSettings(){const p=settingsPayload();await gateway.send('settings.set',p);showReady=true;return p;}
 async function saveQuick(){
  const goal=($('timer-goal')?.value??quickGoalDraft??prefs().focusGoal??'').trim(),p=prefs(),d=durations(),patch={};quickGoalDraft=goal;
  if(goal!==(p.focusGoal||''))patch.focusGoal=goal;if(d.focus!==p.focusSeconds)patch.focusSeconds=d.focus;if(d.rest!==p.breakSeconds)patch.breakSeconds=d.rest;
  if(Object.keys(patch).length)await gateway.send('settings.set',patch);durationDraft=null;return {...p,...patch};
 }
 async function saveQuickGoal(){const goal=($('timer-goal')?.value??quickGoalDraft??prefs().focusGoal??'').trim();quickGoalDraft=goal;if(goal!==(prefs().focusGoal||''))await gateway.send('settings.set',{focusGoal:goal});return {...prefs(),focusGoal:goal};}
 function nextPhase(v,p){if(v.phase==='work'){const long=(v.completed+1)%p.longBreakEvery===0;return (long?'長い休憩 ':'休憩 ')+formatTime(long?p.longBreakSeconds:p.breakSeconds);}return '作業 '+formatTime(p.focusSeconds);}
 function phaseLabel(phase){return phase==='work'?'作業中':phase==='long'?'長い休憩':phase==='break'?'休憩中':'ポモドーロ';}
 function paint(){
  const v=clock.view,p=prefs(),label=phaseLabel(v.phase),reason=v.active?'':blockedReason();
  setText('timer-phase',v.waiting?(error?'確認が必要です':'到着・発車を確認中'):label+(v.paused?' · 一時停止':''));const d=durations(),next=v.active?'次は '+nextPhase(v,p):'';setText('timer-time',formatTime(v.active?v.seconds:d.focus));setText('timer-summary','作業 '+formatTime(d.focus)+' → 休憩 '+formatTime(d.rest)+' · '+p.longBreakEvery+'回ごとに長い休憩 '+formatTime(p.longBreakSeconds));setHidden('timer-summary',v.active);setText('timer-next',next);setHidden('timer-next',!next);
  setHidden('timer-quick-durations',v.active);setText('timer-start',minutes(d.focus)+'の集中を始める');for(const b of document.querySelectorAll('.timer-presets button')){b.setAttribute('aria-pressed',String(Number(b.dataset.focus)*60===d.focus&&Number(b.dataset.rest)*60===d.rest));b.disabled=busy;}
  setText('timer-start-reason',reason);setHidden('timer-start-reason',!reason||v.active);
  const goal=v.active?(p.focusGoal||''):(quickGoalDraft??(p.focusGoal||''));for(const id of ['timer-goal-display','timer-overlay-goal']){setText(id,goal?'目標 · '+goal:'');setHidden(id,!goal);}setText('timer-count','このタブで '+v.completed+' 回完了');
  setHidden('timer-start',v.active);setHidden('timer-pause',!v.active);setHidden('timer-stop',!v.active);setText('timer-pause',error?'再試行':v.paused?'再開する':'一時停止');setDisabled('timer-start',busy||!!reason);setDisabled('timer-pause',busy);setDisabled('timer-stop',busy);setHidden('timer-goal-save',!v.active);setDisabled('timer-goal-save',busy);setDisabled('timer-save',busy);
  const journey=engine.travelTimer,custom=p.travelSeconds!==null;tasks.render();setHidden('timer-overlay',!(v.active||custom||showReady));
  const overlayPhase=v.active?(v.waiting?(error?'確認が必要です':'到着・発車を確認中'):label+(v.paused?' · 一時停止':'')):custom?(journey.active?(engine.state.paused?'次の駅まで · 一時停止':'次の駅まで'):'発車待ち'):'作業タイマー · 開始待ち';setText('timer-overlay-phase',overlayPhase);setText('timer-overlay-time',formatTime(v.active?v.seconds:custom?(journey.active?journey.seconds:p.travelSeconds):p.focusSeconds));setText('timer-overlay-foot',v.active?(v.waiting?'':'次は '+nextPhase(v,p)+' · ')+v.completed+' 回完了':'押して集中を始める');
  const overlayReason=v.active&&blockedReason({includeStation:false})&&!v.waiting?blockedReason({includeStation:false}):(v.waiting&&error?error:'');setText('timer-overlay-message',overlayReason);setHidden('timer-overlay-message',!overlayReason);setHidden('timer-overlay-pause',!v.active);setHidden('timer-overlay-stop',!v.active);setText('timer-overlay-pause',error?'再試行':v.waiting?'到着を確認':v.paused?'再開する':'一時停止');setDisabled('timer-overlay-pause',busy);setDisabled('timer-overlay-stop',busy);
  setText('timer-mini',v.active?label+' '+formatTime(v.seconds)+(v.paused?' ⏸':''):p.focusSeconds?minutes(p.focusSeconds)+' / 休憩'+minutes(p.breakSeconds):'');if(v.active){const progress=$('progress');if(progress)progress.style.width=Math.min(100,Math.max(0,1-v.seconds/v.total)*100+'%');setText('journey-mode',label+(v.paused?' · 一時停止':''));setText('countdown',formatTime(v.seconds));document.title=formatTime(v.seconds)+' '+label+' | NOCTILUCA';}else document.title=originalTitle;
 }
 function stop(){epoch++;showReady=false;clock.stop();engine.journal?.breakEnded();target=null;error='';quickGoalDraft=null;engine.setTimerPaused(false);engine.state.stop.held=false;engine.resetTravelClock();message('タイマーを終了しました。');paint();}
 async function boundary(){
  if(busy||!clock.view.waiting)return;
  const reason=blockedReason({includeStation:false});if(reason){error=reason;message(error);paint();return;}
  busy=true;error='';paint();const generation=epoch,phase=clock.view.phase;
  try{if(phase==='work'){target??=(engine.state.index+1)%engine.worlds.length;await engine.timerArrive(target);if(generation!==epoch)return;const worked=clock.view.total;clock.completeWork();void engine.journal?.sessionEnded(worked,prefs().focusGoal);const p=prefs(),long=clock.view.completed%p.longBreakEvery===0;clock.start(long?'long':'break',long?p.longBreakSeconds:p.breakSeconds);target=null;message(engine.worlds[engine.state.index].station+'に到着しました。ひと休みしましょう。');}else{await engine.timerDepart();if(generation!==epoch)return;engine.journal?.breakEnded();clock.start('work',prefs().focusSeconds);message('発車しました。次の駅まで、作業の時間です。');}}
  catch(e){error=e.message;engine.setTimerPaused(true);message(error+' 「旅の記録」で保存を確認してから再試行できます。');}finally{busy=false;paint();}
 }
 async function toggle(){
  if(busy)return;if(clock.view.waiting){if(gateway.blocked){message(blockedReason());paint();return;}engine.setTimerPaused(false);await boundary();return;}
  if(clock.view.paused){const reason=blockedReason({includeStation:false});if(reason){message(reason||'列車に戻り、会話や保存の確認を終えてから再開してください。');paint();return;}await engine.bell.arm();clock.resume();engine.setTimerPaused(false);message('タイマーを再開しました。');}else{clock.pause();engine.setTimerPaused(true);message('作業と休憩の時間を一時停止しました。');}paint();
 }
 function pulse(){if(clock.view.active&&!busy){const reason=blockedReason({includeStation:false});if(reason&&!clock.view.paused&&!clock.view.waiting){clock.pause();engine.setTimerPaused(true);message(reason+' タイマーを一時停止しました。');}if(clock.poll())void boundary();}paint();}
 async function startFromQuick(event){
  event?.preventDefault();if(busy||clock.view.active)return;const reason=blockedReason();if(reason){message(reason);paint();return;}if(!window.confirm('この設定で集中を始めますか？'))return;busy=true;error='';paint();
  try{await engine.bell.arm();const p=await saveQuick();await engine.timerDepart();clock.resetCount();clock.start('work',p.focusSeconds);showReady=true;target=null;message('次の駅まで、作業の時間です。');quickGoalDraft=null;close('timer-dialog');}
  catch(e){message(e.message);}finally{busy=false;paint();}
 }
 async function saveGoal(){if(busy)return;busy=true;paint();try{await saveQuickGoal();message('目標を保存しました。');detailsMessage('目標を保存しました。');}catch(e){message(e.message);detailsMessage(e.message);}finally{busy=false;paint();}}
 async function submitSettings(event){event?.preventDefault();if(busy)return;busy=true;paint();try{await saveSettings();durationDraft=null;detailsMessage(gateway.authenticated?'設定を保存しました。':'設定しました。');}catch(e){detailsMessage(e.message);message(e.message);}finally{busy=false;paint();}}
 function openQuick(){close('route-dialog');fillQuick();paint();show('timer-dialog');}
 function openSettings(fromQuick=false){settingsReturnToQuick=!!fromQuick;fillSettings();paint();if(fromQuick)close('timer-dialog');close('route-dialog');show('timer-settings-dialog');}
 function closeSettings(){const returnToQuick=settingsReturnToQuick;settingsReturnToQuick=false;close('timer-settings-dialog');if(returnToQuick)openQuick();}
 const quickForm=$('timer-quick-form'),start=$('timer-start');quickForm?.addEventListener('submit',startFromQuick);if(start&&(!quickForm||start.form!==quickForm))start.addEventListener('click',startFromQuick);
 $('timer-pause')?.addEventListener('click',toggle);$('timer-stop')?.addEventListener('click',stop);$('timer-overlay-pause')?.addEventListener('click',toggle);$('timer-overlay-stop')?.addEventListener('click',stop);$('timer-form')?.addEventListener('submit',submitSettings);$('timer-goal-save')?.addEventListener('click',saveGoal);$('timer-goal')?.addEventListener('input',()=>{quickGoalDraft=$('timer-goal').value;paint();});$('timer-standard')?.addEventListener('change',standard);$('bell-volume')?.addEventListener('input',()=>setText('bell-level',$('bell-volume').value+'%'));$('bell-test')?.addEventListener('click',async()=>{const ok=await engine.bell.test(numberValue('bell-volume'));const text=ok?'到着ベルの試聴です。':'音を開始できませんでした。ブラウザの音声設定を確認してください。';message(text);detailsMessage(text);});
 $('timer-open')?.addEventListener('click',openQuick);$('timer-overlay-open')?.addEventListener('click',openQuick);$('route-timer-open')?.addEventListener('click',openQuick);$('timer-settings-open')?.addEventListener('click',()=>openSettings(true));$('timer-close')?.addEventListener('click',()=>{quickGoalDraft=null;durationDraft=null;close('timer-dialog');paint();});$('timer-dialog')?.addEventListener('cancel',()=>{quickGoalDraft=null;durationDraft=null;});
 for(const id of ['quick-focus','quick-break'])$(id)?.addEventListener('input',editDurations);for(const b of document.querySelectorAll('.timer-presets button'))b.addEventListener('click',()=>pickPreset(b));$('timer-settings-close')?.addEventListener('click',closeSettings);$('timer-settings-dialog')?.addEventListener('cancel',event=>{event.preventDefault();closeSettings();});
 const timer={get active(){return clock.view.active;},get view(){return clock.view;},toggle,stop,paint};engine.timer=timer;
 gateway.addEventListener('change',e=>{if(e.detail.reason==='journey.reset'){stop();clock.resetCount();engine.setHeld();paint();return;}if(['reload','journey.resume','backup.restore','guest'].includes(e.detail.reason)&&clock.view.active)stop();paint();});
 document.addEventListener('visibilitychange',pulse);setInterval(pulse,250);fillQuick();fillSettings();paint();return timer;
}
