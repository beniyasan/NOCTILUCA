// Shared helpers for the *-moments modules: visit-local ambient incidents.
// Selection state lives in each director; these functions only read its view.
export const mod=(x,n)=>(x%n+n)%n;
export const unit=x=>Math.max(0,Math.min(1,x));
export const ease=x=>{const t=unit(x);return t*t*(3-2*t);};
export function random(seed){let n=seed|0;return()=>{n=(Math.imul(n,1664525)+1013904223)|0;return(n>>>0)/4294967296;};}
export const momentEvent=(state,id,cell)=>state?.active?.id===id&&state.active.cell===cell?state.active:state?.done?.[id]?.cell===cell?state.done[id]:null;
export const momentPhase=(state,id,cell)=>{const e=momentEvent(state,id,cell);return e?e.progress*e.duration:-1;};
export const installedAt=world=>(state,id)=>state?.quests?.[id]?.installed.includes(world);
