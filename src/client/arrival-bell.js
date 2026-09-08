// A separate output lets the arrival bell work with ambient audio muted.
export function createArrivalBell(settings){
 let context=null,pending=false;
 function play(testVolume){
  if(!context||context.state!=='running')return false;
  const volume=(testVolume??settings().bellVolume)/100;
  // One arrival cue: three phrases, with a brief gap after each decay.
  const start=context.currentTime;
  for(let phrase=0;phrase<3;phrase++){
  [659.25,523.25,783.99].forEach((hz,i)=>{
   const t=start+phrase*2.8+i*.36,o=context.createOscillator(),g=context.createGain();
   o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume*.18,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+1.65);
   o.connect(g).connect(context.destination);o.start(t);o.stop(t+1.7);o.onended=()=>{o.disconnect();g.disconnect();};
  });
  }return true;
 }
 return {
  async arm(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return false;context??=new A();await context.resume();if(pending&&settings().arrivalBell){pending=false;play();}return context.state==='running';}catch{return false;}},
  ring(){if(!settings().arrivalBell)return;pending=!play();},
  async test(volume){if(await this.arm())return play(volume);return false;},
  get ready(){return context?.state==='running';}
 };
}
