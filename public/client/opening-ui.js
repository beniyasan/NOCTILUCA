// First-visit opening: a few lines drift over the real window while the train
// runs in toward Kowloon, pulling in as the last line shows. About sixteen
// seconds, skippable, no clicks needed. It fills in who you are and what the
// work is, so the notebook's first pages can go straight to the people.
const $=id=>document.getElementById(id);
export const OPENING_LINES=[
 '外縁環状線。九つの星を、夜行列車がめぐっている。',
 '街にはそれぞれの暮らしと、少しずつ足りないものがある。',
 '窓際の席には、帳面と 120 cr。仕入れて、届けるのが仕事だ。',
 '―― 次は、九龍東ホーム。',
];
const SHOW=3.2,FADE=.8;

export function playOpening(engine){
 const box=$('opening'),line=$('opening-line'),skip=$('opening-skip');
 if(!box||!line)return Promise.resolve();
 return new Promise(resolve=>{
  const timers=[];let finished=false;
  const finish=immediate=>{
   if(finished)return;finished=true;timers.forEach(clearTimeout);
   engine.endOpening?.(immediate);box.hidden=true;document.body.classList.remove('opening-on');line.classList.remove('show');resolve();
  };
  engine.beginOpening?.();box.hidden=false;document.body.classList.add('opening-on');skip?.focus({preventScroll:true});
  skip?.addEventListener('click',()=>finish(true),{once:true});
  OPENING_LINES.forEach((text,i)=>{
   const at=i*(SHOW+FADE)*1000;
   timers.push(setTimeout(()=>{line.textContent=text;line.classList.add('show');},at));
   if(i<OPENING_LINES.length-1)timers.push(setTimeout(()=>line.classList.remove('show'),at+SHOW*1000));
  });
  // The last line announces the stop: start pulling in with it (the train takes ~6 s to stop).
  const last=(OPENING_LINES.length-1)*(SHOW+FADE)*1000;
  timers.push(setTimeout(()=>engine.endOpening?.(false),last));
  timers.push(setTimeout(()=>finish(false),last+6200));
 });
}
