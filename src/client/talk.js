const $=id=>document.getElementById(id);
const el=(tag,cls='',text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const button=(label,fn,cls='talk-choice')=>{const b=el('button',cls,label);b.type='button';b.addEventListener('click',fn);return b;};
export function createTalk(engine,g,catalog){
 const {state,worlds}=engine;
 const ui={view:null,actor:null,episode:null,shown:0,completed:false,busy:false,tab:'notes',back:null};
 const air={active:null,age:0,shown:0,wait:5,busy:false,completed:false,epoch:0};
 const snapshot=()=>g.snapshot.state;
 const world=()=>worlds[state.index].id;
 function title(eyebrow,name,sub,back=false){
  $('talk-eyebrow').textContent=eyebrow;$('talk-title').textContent=name;$('talk-subtitle').textContent=sub;$('talk-back').hidden=!back;
  $('talk-body').replaceChildren();$('talk-actions').replaceChildren();$('talk-panel').classList.toggle('is-notebook',ui.view==='notes');
  $('talk-footer').textContent=g.authenticated?'会話の完了時にサーバーへ記録します。話を聞くだけでは仕事を引き受けません。':'ゲストの会話です。記憶はこのページを閉じるまで。';
 }
 function portrait(n){
  const c=el('canvas','npc-portrait');c.width=60;c.height=66;c.setAttribute('aria-hidden','true');const x=c.getContext('2d');
  const p=worlds.find(w=>w.id===n.world);x.fillStyle=p.mid;x.fillRect(0,0,60,66);x.fillStyle=p.accent+'55';x.fillRect(7,9,15,14);
  x.fillStyle='#111b25';x.fillRect(17,55,28,11);x.fillStyle=n.coat;x.fillRect(21,32,19,27);x.fillRect(16,36,5,18);x.fillRect(40,36,5,18);
  x.fillStyle='#c9a994';x.fillRect(24,20,13,14);x.fillStyle='#25303a';x.fillRect(21,17,18,6);
  if(n.hat){x.fillStyle=p.light;x.fillRect(20,14,19,7);x.fillRect(17,20,25,3);}x.fillStyle=p.near;x.fillRect(4,57,52,9);x.fillStyle=p.trim;x.fillRect(4,56,52,2);return c;
 }
 function open(view){ui.back=document.activeElement;ui.view=view;clearAir();engine.setHeld();$('talk-panel').hidden=false;$('app').classList.add('reading');}
 function close(restore=true){
  if(!ui.view)return;
  const unfinished=ui.view==='dialogue'&&ui.episode&&!ui.completed;
  ui.view=null;ui.actor=null;ui.episode=null;$('talk-panel').hidden=true;$('app').classList.remove('reading');
  clearAir();if(unfinished&&!g.blocked)g.send('dialogue.close').catch(e=>engine.toast(e.message));
  if(restore&&ui.back?.isConnected)ui.back.focus({preventScroll:true});update();
 }
 function openPeople(){
  if(!engine.canAct()){engine.toast('停車してから、駅の人に話しかけられます。');return;}
  if(snapshot().location.mode!=='station'){engine.toast('「下車する」でホームへ降りてから話しかけてください。');return;}
  const people=catalog.people.filter(n=>n.world===world());if(!people.length){engine.toast('この駅の直接会話は、まだ用意していません。');return;}
  open('people');renderPeople();$('talk-body').querySelector('button')?.focus({preventScroll:true});
 }
 function renderPeople(){
  ui.view='people';title('PLATFORM CONVERSATIONS',worlds[state.index].station,'誰と話そう。何も買わず、話だけでも。');
  const list=el('div','npc-list');
  for(const n of catalog.people.filter(n=>n.world===world())){
   const b=button('',()=>start(n.id,'greeting'),'npc-card');b.setAttribute('aria-label',n.name+'と話す');b.dataset.npc=n.id;
   const copy=el('span','npc-copy');copy.append(el('small','',n.role),el('strong','',n.name),el('span','',snapshot().actors[n.id]?.met?'顔を知っている人':'まだ話したことのない人'));
   b.append(portrait(n),copy,el('span','npc-arrow','↗'));list.append(b);
  }
  $('talk-body').append(list,el('p','talk-context','ホームでは、それぞれの一日が続いています。'));
  $('talk-actions').append(button('ホームに戻る',()=>close(),'talk-text-button'));update();
 }
 async function start(npc,topic){
  if(ui.busy||g.blocked)return;ui.busy=true;update();
  try{await g.send('dialogue.start',{npc,topic});}catch(e){engine.toast(e.message);}finally{ui.busy=false;update();}
 }
 function renderDialogue(){
  const e=ui.episode,n=catalog.people.find(n=>n.id===ui.actor);if(!e||!n)return;
  title('駅での会話 / '+worlds[state.index].station,n.name,n.role+' · '+n.where,true);
  const who=el('div','speaker-id');who.append(portrait(n),el('span','speaker-code',n.en));$('talk-body').append(who);
  const thread=el('div','dialogue-thread');thread.id='dialogue-thread';thread.setAttribute('aria-live','polite');
  for(const l of e.lines.slice(0,ui.shown)){
   const row=el('div','dialogue-line'+(l.speaker==='self'?' is-self':''));row.append(el('small','',l.speaker==='self'?snapshot().displayName:n.name),el('p','',l.text));thread.append(row);
  }
  $('talk-body').append(thread);
  if(ui.shown<e.lines.length){const b=button('もう少し聞く →',()=>{ui.shown++;renderDialogue();$('talk-next')?.focus({preventScroll:true});},'talk-next');b.id='talk-next';$('talk-actions').append(b);}
  else if(!ui.completed){
   const b=button(e.id.startsWith('greeting:')?'話題を選ぶ':'話を聞き終える',async()=>{if(ui.busy)return;ui.busy=true;update();try{await g.send('dialogue.complete',{sessionId:e.sessionId});}catch(error){engine.toast(error.message);}finally{ui.busy=false;update();}},'talk-next');b.id='talk-complete';$('talk-actions').append(b);
  }else{
   if(e.note&&snapshot().notes.includes(e.note))$('talk-body').append(el('div','note-saved',g.authenticated?'手帳に記録しました · 保存済み':'手帳に記録しました · ゲスト'));
   const choices=el('div','topic-choices');for(const t of catalog.topics){const b=button(t.label,()=>start(n.id,t.id));b.dataset.topic=t.id;choices.append(b);}$('talk-actions').append(choices);if(e.topic==='trade')$('talk-actions').append(button('商売帳で品物を確認する',()=>engine.commerce?.open(),'talk-next'));
  }
  $('talk-actions').append(button('ホームに戻る',()=>close(),'talk-text-button'));update();
  requestAnimationFrame(()=>{$('talk-body').scrollTop=$('talk-body').scrollHeight;});
 }
 function openNotes(tab='notes'){close(false);open('notes');ui.tab=tab;renderNotes();$('talk-body').querySelector('button')?.focus({preventScroll:true});}
 function renderNotes(){
  title('THE WINDOW SEAT NOTEBOOK','旅の手帳','売った先を、聞いた話を、忘れないために。');
  const tabs=el('div','notebook-tabs');tabs.setAttribute('role','tablist');
  for(const [id,name] of [['notes','商売のメモ'],['heard','ホームの雑談']]){const b=button(name,()=>{ui.tab=id;renderNotes();},'notebook-tab');b.setAttribute('role','tab');b.setAttribute('aria-selected',String(ui.tab===id));tabs.append(b);}
  $('talk-body').append(tabs);
  const entries=ui.tab==='notes'?snapshot().noteDetails:snapshot().heardDetails;
  if(!entries?.length)$('talk-body').append(el('p','notebook-empty',ui.tab==='notes'?'まだ、白いページ。\n話を聞くうちに、ここに少しずつ記憶が残ります。':'ホームで最後まで流れた雑談が、ここに残ります。\n聞き逃しても、旅に不利益はありません。'));
  for(const e of [...(entries||[])].reverse()){
   const box=el('article','memo-card');box.append(el('small','memo-source',worlds.find(w=>w.id===e.world).name),el('h3','',e.title));
   if(ui.tab==='notes')box.append(el('p','',e.body),el('p','memo-foot',e.foot));
   else for(const line of e.lines){const row=el('div','heard-turn');row.append(el('small','',line.speaker),el('p','',line.text));box.append(row);}
   $('talk-body').append(box);
  }
  $('talk-body').append(el('p','notebook-disclaimer','聞いた情報は、依頼の受諾ではありません。取引と荷物は商売帳で確認できます。'));
  $('talk-actions').append(button('手帳を閉じる',()=>close(),'talk-text-button'));
 }
 function clearAir(){air.epoch++;air.active=null;air.shown=0;air.age=0;air.wait=7;air.completed=false;$('overheard').hidden=true;}
 function renderAir(){
  const a=air.active;if(!a)return;$('air-place').textContent=a.channel==='machine'?'保守回線から、短い通信':a.place+'から、話し声';$('air-lines').replaceChildren();
  for(const l of a.lines.slice(0,air.shown)){const row=el('div','air-turn');row.append(el('small','',l.speaker),el('p','',l.text));$('air-lines').append(row);}$('overheard').hidden=false;
 }
 function tick(dt){
  const can=!state.transition&&state.stop.phase==='stop'&&!state.immersive&&!ui.view&&!document.querySelector('dialog[open]')&&snapshot().settings.chatter&&!snapshot().suspended&&!g.blocked&&!!snapshot().displayName;
  if(!can){if(air.active)clearAir();return;}
  if(!dt||state.paused||document.hidden)return;
  if(!air.active){
   air.wait-=dt;if(air.wait>0||air.busy||g.busy)return;
   air.busy=true;const epoch=air.epoch;
   g.send('ambient.next').then(r=>{if(epoch!==air.epoch)return;air.active=r.outcome.ambient;air.age=0;air.shown=1;air.completed=false;if(air.active)renderAir();else air.wait=20;}).catch(e=>{air.wait=20;}).finally(()=>air.busy=false);return;
  }
  air.age+=dt;const shown=Math.min(air.active.lines.length,1+Math.floor(air.age/7.2));if(shown!==air.shown){air.shown=shown;renderAir();}
  if(air.age>=air.active.lines.length*7.2&&!air.completed){air.completed=true;g.send('ambient.complete',{sessionId:air.active.sessionId}).catch(()=>{});}
  if(air.age>=air.active.lines.length*7.2+2){clearAir();air.wait=snapshot().settings.frequency==='quiet'?38:16;}
 }
 function update(){
  const stopped=!state.transition&&state.stop.phase==='stop',supported=catalog.people.some(n=>n.world===world());
  $('talk-open').hidden=!stopped||!supported||snapshot().location.mode!=='station'||snapshot().suspended;
  $('talk-open').disabled=!!ui.view||!!g.busy||g.blocked;
  $('notebook-count').textContent=snapshot().notes.length||'';
  for(const b of $('talk-panel').querySelectorAll('button'))b.disabled=ui.busy||g.blocked;
  // Closing a failed conversation must always remain possible to reach the retry UI.
  $('talk-close').disabled=false;
  if(ui.view==='people'||ui.view==='dialogue'){$('station-action').disabled=true;$('stop-phase').textContent='会話中 · ホームの日常は続いています';}
 }
 function init(){
  $('talk-open').addEventListener('click',openPeople);$('open-notebook').addEventListener('click',()=>openNotes());$('talk-close').addEventListener('click',()=>close());
  $('talk-back').addEventListener('click',()=>{close(false);openPeople();});$('air-replay').addEventListener('click',()=>openNotes('heard'));
  $('air-hide').addEventListener('click',()=>{clearAir();g.send('settings.set',{chatter:false}).catch(e=>engine.toast(e.message));});
  $('chat-enabled').checked=snapshot().settings.chatter;$('chat-frequency').value=snapshot().settings.frequency;
  $('chat-enabled').addEventListener('change',e=>{clearAir();g.send('settings.set',{chatter:e.target.checked}).catch(e=>engine.toast(e.message));});
  $('chat-frequency').addEventListener('change',e=>g.send('settings.set',{frequency:e.target.value}).catch(e=>engine.toast(e.message)));
  document.addEventListener('keydown',e=>{
   if(e.ctrlKey||e.metaKey||e.altKey||e.isComposing||document.querySelector('dialog[open]')||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
   const key=e.key.toLowerCase();
   if(ui.view){
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}
    if(e.key==='Tab'){
     const b=[...$('talk-panel').querySelectorAll('button:not(:disabled)')].filter(n=>n.getClientRects().length),first=b[0],last=b.at(-1);
     if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    }
    if(['s','t','n','h','arrowleft','arrowright',' '].includes(key)){e.stopImmediatePropagation();if(e.target.tagName!=='BUTTON')e.preventDefault();}return;
   }
   if(state.immersive)return;
   if(key==='t'){e.preventDefault();e.stopImmediatePropagation();openPeople();}
   if(key==='n'){e.preventDefault();e.stopImmediatePropagation();openNotes();}
  },true);
  g.addEventListener('change',e=>{
   if(e.detail.reason==='dialogue.start'&&e.detail.outcome.dialogue){const d=e.detail.outcome.dialogue;open('dialogue');ui.actor=d.npc;ui.episode=d;ui.shown=1;ui.completed=false;renderDialogue();$('talk-next')?.focus({preventScroll:true});}
   if(e.detail.reason==='dialogue.complete'&&ui.view==='dialogue'){ui.completed=true;renderDialogue();}
   if(e.detail.reason==='settings.set'){$('chat-enabled').checked=snapshot().settings.chatter;$('chat-frequency').value=snapshot().settings.frequency;}
   update();
  });
 }
 return {init,tick,update,close,clearAir,openPeople,openNotes,enter(){close(false);clearAir();},get isDirect(){return ui.view==='people'||ui.view==='dialogue';},get status(){return {view:ui.view,actor:ui.actor,episode:ui.episode?.id,shown:ui.shown,notes:snapshot().notes,heard:snapshot().heard,ambient:air.active?.id};}};
}
