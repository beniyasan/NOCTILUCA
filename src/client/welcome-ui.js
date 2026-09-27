// First-visit welcome: one short card that says what this is and offers the two
// ways in (focus, or just watch). Shown once per device, and only on a fresh
// journey, so returning players on a new device are not greeted again.
const $=id=>document.getElementById(id);
const KEY='noctiluca.welcomed';

export function createWelcomeUI(gateway,engine){
 const dialog=$('welcome-dialog');if(!dialog)return;
 let seen=false;try{seen=localStorage.getItem(KEY)==='1';}catch{/* show it this visit */}
 const s=gateway.snapshot?.state||{},visits=Object.values(s.visits||{}).reduce((n,v)=>n+(Number(v)||0),0);
 if(seen||s.storyView?.introSeen||visits>1||s.suspended)return;
 const done=()=>{try{localStorage.setItem(KEY,'1');}catch{/* this visit only */}if(dialog.open)dialog.close();};
 // The train is already rolling behind the card, so the first thing seen is a journey under way.
 engine.startMoving?.();
 $('welcome-focus')?.addEventListener('click',()=>{done();$('timer-open')?.click();});
 $('welcome-watch')?.addEventListener('click',done);
 dialog.addEventListener('cancel',done);
 dialog.showModal();$('welcome-focus')?.focus();
}
