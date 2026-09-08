// Wall-clock deadlines keep the timer independent of animation speed and frames.
// A missed deadline emits only once; no skipped cycles are simulated on wake-up.
export function createFocusClock(now=()=>Date.now()){
 let phase='idle',total=0,deadline=0,remaining=0,paused=false,waiting=false,completed=0;
 return {
  start(kind,seconds){total=seconds;phase=kind;remaining=seconds*1000;deadline=now()+remaining;paused=false;waiting=false;},
  stop(){phase='idle';paused=false;waiting=false;},
  resetCount(){completed=0;},
  completeWork(){completed++;},
  pause(){if(phase==='idle'||paused||waiting)return;remaining=Math.max(0,deadline-now());paused=true;},
  resume(){if(!paused)return;deadline=now()+remaining;paused=false;},
  poll(){if(phase==='idle'||paused||waiting||now()<deadline)return null;waiting=true;remaining=0;return phase;},
  get view(){const remainingMs=paused||waiting?remaining:Math.max(0,deadline-now());return {phase,total,paused,waiting,completed,active:phase!=='idle',remainingMs,seconds:Math.ceil(remainingMs/1000)};}
 };
}
export function formatTime(seconds){const n=Math.max(0,Math.ceil(seconds));return Math.floor(n/60).toString().padStart(2,'0')+':'+(n%60).toString().padStart(2,'0');}
