// First-visit welcome: one short card that says what this is and offers the two
// ways in (focus, or just watch). Shown once per device, and only on a fresh
// journey, so returning players on a new device are not greeted again.
// A signed-in player without a name is asked for one first (the server accepts no
// other command until then), so the card waits for the name and for that dialog.
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
 // there), and once it is read or put off, the train leaves so the view is a journey under way.
 let departAfterIntro=false;
 function watch(){
  done();const now=gateway.snapshot.state;
  if(!now.storyView?.introSeen&&now.location.world==='kowloon'&&now.location.atStation)departAfterIntro=true;
  else engine.startMoving?.();
 }
 gateway.addEventListener('change',e=>{
  if(!departAfterIntro)return;
  const {reason,outcome}=e.detail;
  if(reason==='story.close'||(reason==='story.next'&&outcome?.storyCompleted==='intro')){departAfterIntro=false;engine.startMoving?.();}
 });
 $('welcome-focus')?.addEventListener('click',()=>{done();$('timer-open')?.click();});
 $('welcome-watch')?.addEventListener('click',watch);
 dialog.addEventListener('cancel',watch);
 function show(){
  const now=gateway.snapshot?.state||{};
  if(!now.displayName||now.suspended||gateway.blocked||document.querySelector('dialog[open]'))return false;
  dialog.showModal();$('welcome-focus')?.focus();return true;
 }
 if(show())return;
 const wait=setInterval(()=>{if(show()||!engine.welcomePending)clearInterval(wait);},400);
 window.addEventListener('pagehide',()=>clearInterval(wait),{once:true});
}
