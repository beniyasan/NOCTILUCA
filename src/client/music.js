// Original miniature scores, rendered locally once and looped by the audio clock.
// Buffer playback stays continuous when the visual frame loop is in the background.
export const TRACKS=[
 {id:'waltz',name:'窓辺のワルツ',detail:'柔らかな鍵盤と三拍子。遠ざかる街を見送る、小さなワルツ。',bpm:74,beats:3,tone:'felt',
  chords:[[48,55,59,64],[45,52,55,60],[41,48,52,57],[43,50,53,59],[40,47,50,55],[45,52,55,60],[38,45,53,57],[43,50,53,59]],
  melody:[[64,null,67,71,69,67],[64,60,null,64,62,null],[60,64,69,null,67,64],[62,null,59,62,65,null],[59,62,67,66,64,null],[64,60,57,null,60,64],[65,null,64,62,60,57],[59,62,67,null,65,62],[64,67,71,null,72,71],[69,null,67,64,60,null],[64,69,72,null,71,69],[67,65,62,null,59,62],[64,null,62,59,55,null],[57,60,64,67,64,60],[62,65,69,null,67,65],[62,null,59,null,60,null]]},
 {id:'amber',name:'琥珀のホーム',detail:'少し揺れる電気ピアノ。雨のホームで聴く、古いラジオのように。',bpm:66,beats:4,tone:'tape',
  chords:[[46,53,57,62],[43,50,53,58],[39,46,50,55],[41,48,51,57],[38,45,48,53],[43,50,53,58],[36,43,51,55],[41,48,51,57]],
  melody:[[62,null,65,69,null,67,65,null],[62,58,null,62,65,null,62,60],[58,null,62,67,null,65,62,null],[60,null,57,null,60,63,62,null],[57,60,65,null,64,62,null,60],[58,null,62,65,69,null,65,62],[63,62,60,null,58,null,55,null],[57,null,60,63,null,60,58,null],[65,null,69,70,null,69,67,65],[62,null,65,67,null,65,62,null],[62,67,70,null,69,67,65,null],[63,null,60,57,null,60,62,null],[65,64,62,null,60,57,null,null],[58,62,65,null,62,58,55,null],[60,null,63,67,65,null,63,60],[60,57,null,null,58,null,null,null]]},
 {id:'musicbox',name:'遠い日のオルゴール',detail:'小さな金属の音と長い余韻。眠りかけの車内に残る、懐かしい旋律。',bpm:62,beats:3,tone:'box',
  chords:[[53,60,64,69],[50,57,60,65],[46,53,57,62],[48,55,58,64],[45,52,55,60],[50,57,60,65],[43,50,58,62],[48,55,58,64]],
  melody:[[77,null,81,84,81,null],[77,74,null,77,76,null],[74,77,82,null,81,77],[76,null,72,null,74,76],[72,76,79,null,77,null],[77,74,69,null,74,77],[79,null,77,74,70,null],[72,76,79,null,77,null],[81,84,86,null,84,81],[81,null,77,74,77,null],[82,null,81,77,74,77],[79,76,72,null,76,null],[77,76,72,null,69,null],[74,77,81,79,77,74],[74,79,82,null,81,79],[76,null,72,null,77,null]]}
];
export function scoreFor(track){
 const beat=60/track.bpm,bar=beat*track.beats,events=[];
 for(let b=0;b<16;b++){
  const chord=track.chords[b%8],at=b*bar;
  events.push({at,note:chord[0]-12,length:bar*.92,level:.075,voice:'bass',pan:-.08});
  // Arpeggiated accompaniment leaves room around the melody.
  for(let i=1;i<chord.length;i++)events.push({at:at+(i-1)*beat*.5,note:chord[i],length:beat*2.1,level:.037,voice:track.tone,pan:(i-2)*.22});
  if(track.beats===4)for(let i=1;i<3;i++)events.push({at:at+beat*(2+i*.35),note:chord[i],length:beat*1.4,level:.023,voice:track.tone,pan:.15});
  track.melody[b].forEach((note,i)=>{if(note!==null)events.push({at:at+i*beat*.5,note,length:beat*(track.tone==='box'?2.2:1.6),level:.065*(i%2?.88:1),voice:track.tone,pan:Math.sin(b*.7)*.12});});
 }
 return {duration:16*bar,events};
}
async function renderTrack(track,live){
 const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
 if(!Offline)throw new Error('このブラウザではBGMの音を準備できません。');
 const score=scoreFor(track),rate=32000,frames=Math.round(score.duration*rate),duration=frames/rate;
 const a=new Offline(2,frames*2,rate),bus=a.createGain(),filter=a.createBiquadFilter(),limit=a.createDynamicsCompressor();
 filter.type='lowpass';filter.frequency.value=track.tone==='box'?4600:track.tone==='tape'?2300:3200;
 bus.connect(filter);filter.connect(limit);limit.threshold.value=-17;limit.knee.value=18;limit.ratio.value=2.5;limit.connect(a.destination);
 const impulse=a.createBuffer(2,rate*2,rate);let seed=81;
 for(let ch=0;ch<2;ch++){const data=impulse.getChannelData(ch);for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;data[i]=(seed/2147483648)*Math.exp(-i/rate*3.5)*.14;}}
 const room=a.createConvolver(),wet=a.createGain();room.buffer=impulse;wet.gain.value=track.tone==='box'?.25:.13;filter.connect(room);room.connect(wet);wet.connect(limit);
 for(let pass=0;pass<2;pass++)for(const e of score.events){
  const t=pass*duration+e.at,envelope=a.createGain(),pan=a.createStereoPanner();pan.pan.value=e.pan;envelope.connect(pan);pan.connect(bus);
  const attack=e.voice==='bass'?.055:e.voice==='tape'?.025:.008;
  envelope.gain.setValueAtTime(0,t);envelope.gain.linearRampToValueAtTime(e.level,t+attack);envelope.gain.exponentialRampToValueAtTime(.0001,t+e.length);
  const harmonics=e.voice==='bass'?[[1,1],[2,.09]]:e.voice==='box'?[[1,1],[2.76,.11],[5.4,.018]]:e.voice==='tape'?[[1,1],[2,.24],[3,.065]]:[[1,1],[2,.18],[3,.055]];
  for(const [multiple,level] of harmonics){const o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=440*2**((e.note-69)/12)*multiple;o.detune.value=e.voice==='tape'?Math.sin(e.at*.63)*4:Math.sin(e.note)*.8;g.gain.value=level;o.connect(g);g.connect(envelope);o.start(t);o.stop(t+e.length+.02);}
 }
 const rendered=await a.startRendering(),loop=live.createBuffer(2,frames,rate);
 // Take a warmed-up cycle so the preceding bar's reverb crosses the loop seam.
 for(let ch=0;ch<2;ch++)loop.copyToChannel(rendered.getChannelData(ch).subarray(frames,frames*2),ch);
 return loop;
}
export function createMusicPlayer(){
 let context=null,master=null,current=null,volume=.35,request=0,selected=null;
 const cache=new Map(),voices=new Set();
 function fadeOut(voice){const t=context.currentTime;voice.gain.gain.cancelScheduledValues(t);voice.gain.gain.setTargetAtTime(0,t,.3);voice.source.stop(t+1.8);}
 return {
  async play(id){
   const track=TRACKS.find(t=>t.id===id);if(!track)throw new Error('曲を選んでください。');
   const generation=++request,A=window.AudioContext||window.webkitAudioContext;if(!A)throw new Error('このブラウザでは音楽を再生できません。');
   if(!context){context=new A();master=context.createGain();master.gain.value=volume;master.connect(context.destination);}
   await context.resume();
   if(generation!==request)return false;
   if(current&&selected===id)return true;
   if(!cache.has(id))cache.set(id,renderTrack(track,context).catch(e=>{cache.delete(id);throw e;}));
   const buffer=await cache.get(id);if(generation!==request)return false;
   while(cache.size>2){const key=[...cache.keys()].find(k=>k!==id);cache.delete(key);}
   const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=0;source.connect(gain);gain.connect(master);
   const voice={source,gain};voices.add(voice);source.onended=()=>{source.disconnect();gain.disconnect();voices.delete(voice);};
   gain.gain.setTargetAtTime(.85,context.currentTime,.45);source.start();if(current)fadeOut(current);current=voice;selected=id;return true;
  },
  stop(){request++;if(current){fadeOut(current);current=null;}selected=null;},
  setVolume(percent){volume=Math.max(0,Math.min(100,percent))/100;if(master)master.gain.setTargetAtTime(volume,context.currentTime,.08);},
  get playing(){return current!==null;},
  get track(){return selected;}
 };
}
