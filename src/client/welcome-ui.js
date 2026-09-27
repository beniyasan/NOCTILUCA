// First visit: a short opening over the window, then one card that says what
// this is and offers the two ways in (focus, or just watch). Shown once per
// device, and only on a fresh journey, so returning players are not greeted again.
// A signed-in player without a name is asked for one first (the server accepts no
// other command until then), so all of this waits for the name and that dialog.
import {playOpening} from './opening-ui.js';
const $=id=>document.getElementById(id);
const KEY='noctiluca.welcomed';

export function createWelcomeUI(gateway,engine){
 const dialog=$('welcome-dialog');if(!dialog)return;
 let seen=false;try{seen=localStorage.getItem(KEY)==='1';}catch{/* show it this visit */}
 const s=gateway.snapshot?.state||{},visits=Object.values(s.visits||{}).reduce((n,v)=>n+(Number(v)||0),0);
 if(seen||s.storyView?.introSeen||visits>1||s.suspended)return;
 // The intro story holds back while the welcome is still to come.
 engine.welcomePending=true;
 const done=()=>{engine.welcomePending=false;try{localStorage.setItem(KEY,'1');}catch{/* this visit only */}if(dialog.open)dialog.close();};
 // Just watching: the first page of the notebook opens at the Kowloon window (it can only open
 // there). Reading it leaves the train at the platform so the player can step off and ask
 // around, as it says; putting it off lets the train go on.
 let introPending=false;
 function watch(){
  done();const now=gateway.snapshot.state;
  if(!now.storyView?.introSeen&&now.location.world==='kowloon'&&now.location.atStation)introPending=true;
  else engine.startMoving?.();
 }
 gateway.addEventListener('change',e=>{
  if(!introPending)return;
  const {reason,outcome}=e.detail;
  if(reason==='story.close'){introPending=false;engine.startMoving?.();}
  if(reason==='story.next'&&outcome?.storyCompleted==='intro'){introPending=false;engine.setHeld?.();$('platform-toggle')?.classList.add('nudge');}
 });
 $('platform-toggle')?.addEventListener('click',()=>$('platform-toggle').classList.remove('nudge'));
 $('welcome-focus')?.addEventListener('click',()=>{done();$('timer-open')?.click();});
 $('welcome-watch')?.addEventListener('click',watch);
 dialog.addEventListener('cancel',watch);
 let started=false;
 async function begin(){
  const now=gateway.snapshot?.state||{};
  if(started||!now.displayName||now.suspended||gateway.blocked||document.querySelector('dialog[open]'))return false;
  started=true;
  await playOpening(engine);
  dialog.showModal();$('welcome-focus')?.focus();return true;
 }
 const wait=setInterval(()=>{if(started||!engine.welcomePending)clearInterval(wait);else void begin();},400);
 window.addEventListener('pagehide',()=>clearInterval(wait),{once:true});
 void begin();
}
