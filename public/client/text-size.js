// "文字の大きさ" preference, kept on this device only. The CSS applies it on wider
// screens; phones keep their own sizes.
const KEY='noctiluca.textSize',SIZES=['normal','large','xlarge'];
export function initTextSize(){
 let size='normal';
 try{const saved=localStorage.getItem(KEY);if(SIZES.includes(saved))size=saved;}catch{/* default size */}
 document.documentElement.dataset.textSize=size;
 const select=document.getElementById('text-size');if(!select)return;
 select.value=size;
 select.addEventListener('change',()=>{
  const next=SIZES.includes(select.value)?select.value:'normal';
  document.documentElement.dataset.textSize=next;
  try{localStorage.setItem(KEY,next);}catch{/* this visit only */}
  // Canvas layers size themselves from the layout, so let them re-measure.
  window.dispatchEvent(new Event('resize'));
 });
}
