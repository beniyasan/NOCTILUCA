const $=id=>document.getElementById(id);
const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;n.textContent=text;return n;};
export function createStoryUI(g,engine){
 const dialog=$('story-dialog');let busy=false,error='',attemptedIntro=false,lastPageKey='';
 async function run(fn){if(busy||g.busy||g.blocked)return;busy=true;error='';render();try{await fn();}catch(e){error=e.message;}finally{busy=false;render();}}
 function render(){
  const s=g.snapshot.state,v=s.storyView;if(!v)return;
  const observation=$('chapter-two-observation'),c2=s.chapterTwoView,c3=s.chapterThreeView,c4=s.chapterFourView;
  const fourth=s.location.world==='relay'&&c4?.unlocked&&(c4.delivery==='installed'||c4.decision==='declined');
  const third=s.location.world==='jade'&&c3?.unlocked&&(c3.delivery==='installed'||c3.decision==='declined');
  observation.hidden=!(s.location.atStation&&!engine.state.transition&&(fourth||third||(c2?.unlocked&&s.location.world==='gorge'&&(c2.delivery==='installed'||c2.decision==='declined'))));
  observation.textContent=(fourth?c4.scene:third?c3.scene:c2?.scene)||'';
  $('story-hint').textContent=error||s.journeyHint;$('story-hint').hidden=!s.settings.hints;
  const b=$('story-open');b.hidden=v.introSeen&&!v.ready&&!v.finalReady&&!v.active;
  b.textContent=v.active?'帳面の続きを開く':v.finalReady?'「次の便で」の帳面を開く':v.ready?'ひと箱ぶんの帳面を開く':'最初の帳面を開く';
  b.disabled=busy||g.busy||g.blocked||s.suspended||!s.displayName||!!engine.state.transition||s.location.world!=='kowloon';
  if(v.active&&!s.suspended){
   engine.setHeld();
   if(!dialog.open&&!document.querySelector('dialog[open]')){dialog.showModal();$('story-next').focus();}
   const pageKey=JSON.stringify([v.active,v.page,error,busy,g.busy,g.blocked]);if(pageKey===lastPageKey)return;lastPageKey=pageKey;
   $('story-part').textContent=(v.active.kind==='intro'?'序章':v.active.kind==='finale'?'終章・次の便で':'第一章・ひと箱の灯り')+' · '+(v.active.page+1)+' / '+v.pageCount;
   $('story-title').textContent=v.page.title;
   $('story-lines').replaceChildren(...v.page.lines.map(t=>node('p','',t)));
   const ledger=$('story-ledger');ledger.replaceChildren();ledger.hidden=!v.page.ledger;
   if(v.page.ledger)for(const t of v.page.ledger){const row=node('div','story-ledger-row','');row.append(node('span','',(t.label||(t.type.endsWith('.buy')?'仕入れ':t.type.endsWith('.sell')?'売却':'返却'))+' · '+t.item),node('span','',(t.amount>0?'+':'')+t.amount+' cr'));ledger.append(row);}
   $('story-next').textContent=v.active.page<v.pageCount-1?'次の行へ':v.active.kind==='intro'?'帳面を閉じ、ホームへ':'帳面を閉じ、次の便へ';
   $('story-next').disabled=busy||g.busy||g.blocked;$('story-later').disabled=busy||g.busy||g.blocked;
   $('story-error').textContent=error||(g.blocked?'保存を確認できていません。閉じるボタンで旅の記録へ戻り、未確認の操作を再試行してください。':'');
  }else {lastPageKey='';if(dialog.open)dialog.close();}
 }
 async function start(){
  if(engine.state.transition)throw new Error('次の駅に着いてから、帳面を開けます。');
  engine.talk.close();engine.setHeld();
  const s=g.snapshot.state;
  if(s.storyView.active){render();return;}
  if(s.location.mode==='station'&&s.location.world==='kowloon')await g.send('journey.board');
  await g.send('story.start',{kind:s.storyView.finalReady?'finale':s.storyView.ready?'ending':'intro'});
 }
 $('story-open').addEventListener('click',()=>run(start));
 $('story-next').addEventListener('click',()=>run(async()=>{await g.send('story.next');}));
 const later=()=>run(async()=>{await g.send('story.close');dialog.close();});
 $('story-later').addEventListener('click',later);
 $('story-dismiss').addEventListener('click',()=>{if(g.blocked){dialog.close();$('account-open').click();}else later();});
 dialog.addEventListener('cancel',e=>{e.preventDefault();if(g.blocked){dialog.close();$('account-open').click();}else later();});
 g.addEventListener('change',e=>{if(e.detail.reason==='journey.reset'){attemptedIntro=false;lastPageKey='';error='';}render();});
 const timer=setInterval(()=>{
  render();const s=g.snapshot.state;
  if(!attemptedIntro&&!s.storyView.introSeen&&!s.storyView.active&&s.displayName&&!s.suspended&&!g.busy&&!g.blocked&&!document.querySelector('dialog[open]')){attemptedIntro=true;run(start);}
 },500);
 window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});render();
 return {open:()=>run(start)};
}
