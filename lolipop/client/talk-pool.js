// The day's passenger talk, fetched from the Edge Function (Lolipop edition).
// Talks are used in a shuffled order; once every talk of a kind has been used,
// the next batch is requested and the used ones play again meanwhile. When
// nothing is available the caller falls back to the template generator.
const POLL=90e3,RETRY=10*60e3;

export function createTalkPool(fetchPool,{random=Math.random,now=()=>Date.now()}={}){
 let talks=[],used=new Set(),batches=0,max=1,day='',want=1,busy=false,nextAt=0;
 const kind=(t,size,tone)=>t.size===size&&(size===3||t.tone===tone);
 async function refresh(){
  if(busy||now()<nextAt)return;busy=true;
  try{
   const r=await fetchPool(want);
   if(r.day!==day){day=r.day;used=new Set();want=Math.max(1,r.batches||1);}
   talks=Array.isArray(r.talks)?r.talks:[];batches=r.batches||0;max=r.maxBatches||1;
   // Still being written: look again soon. Otherwise only when we run out.
   nextAt=now()+(r.generating?POLL:batches>=want?Infinity:RETRY);
  }catch{nextAt=now()+RETRY;}
  finally{busy=false;}
 }
 function fill(text,names,ctx){return text.replace(/\{(n[123]|st|next)\}/g,(_,k)=>k==='st'?ctx.station||'この駅':k==='next'?ctx.next||'次の駅':names[Number(k[1])-1]||'ねえ').replace(/\{\w*\}/g,'');}
 return {
  refresh,
  // Lines for a group of `size`, or null to use the templates.
  take({size,tone='chat',names=[],station='',next=''}={}){
   const all=talks.filter(t=>kind(t,size,tone));
   if(!all.length){void refresh();return null;}
   let fresh=all.filter(t=>!used.has(t.id));
   if(!fresh.length){
    // A full lap: ask for the next batch (the server caps it per day), and replay.
    if(batches<max&&want<=batches){want=batches+1;nextAt=0;}
    void refresh();
    for(const t of all)used.delete(t.id);fresh=all;
   }
   const t=fresh[Math.floor(random()*fresh.length)];used.add(t.id);
   return t.lines.map(l=>({who:l.who,text:fill(l.text,names,{station,next}),mark:l.mark||''}));
  },
  get status(){return {day,batches,max,want,talks:talks.length,used:used.size};},
 };
}
