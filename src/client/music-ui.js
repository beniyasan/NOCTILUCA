import {TRACKS,createMusicPlayer} from './music.js';
export function createMusicUI(engine,gateway){
 const $=id=>document.getElementById(id),player=createMusicPlayer();let busy=false,version=0;
 for(const t of TRACKS){const option=document.createElement('option');option.value=t.id;option.textContent=t.name;$('music-track').appendChild(option);}
 function update(){
  $('music-play').textContent=busy?'準備を中止':player.playing?'BGMを停止':'BGMを再生';
  $('music-track').disabled=busy;$('music-description').textContent=TRACKS.find(t=>t.id===$('music-track').value)?.detail||'';
  $('ambient-enabled').checked=engine.ambient.enabled;$('ambient-volume').value=Math.round(engine.ambient.volume*100);$('ambient-level').textContent=$('ambient-volume').value+'%';
  const on=player.playing||engine.ambient.enabled;$('sound').classList.toggle('active',on);$('sound').querySelector('use').setAttribute('href',on?'#i-sound':'#i-muted');
 }
 function load(){const p=gateway.snapshot.state.settings;$('music-track').value=p.musicTrack;$('music-volume').value=p.musicVolume;$('music-level').textContent=p.musicVolume+'%';player.setVolume(p.musicVolume);$('ambient-volume').value=Math.round(engine.ambient.volume*100);$('ambient-level').textContent=$('ambient-volume').value+'%';update();}
 async function play(save=false){
  const id=$('music-track').value,token=++version;busy=true;$('music-status').textContent='音楽を準備しています…';update();
  const results=await Promise.allSettled([player.play(id),save?gateway.send('settings.set',{musicTrack:id}):Promise.resolve()]);
  if(token!==version)return;busy=false;const failed=results.find(r=>r.status==='rejected');
  $('music-status').textContent=failed?failed.reason.message:TRACKS.find(t=>t.id===id).name+' を再生中';update();
 }
 function stop(){version++;busy=false;player.stop();$('music-status').textContent='BGMを停止しました。';update();}
 $('music-play').addEventListener('click',()=>{if(busy||player.playing)stop();else void play();});
 $('music-track').addEventListener('change',()=>void play(true));
 $('music-volume').addEventListener('input',()=>{player.setVolume(Number($('music-volume').value));$('music-level').textContent=$('music-volume').value+'%';});
 $('music-volume').addEventListener('change',async()=>{try{await gateway.send('settings.set',{musicVolume:Number($('music-volume').value)});}catch(e){$('music-status').textContent=e.message;}});
 $('ambient-enabled').addEventListener('change',async()=>{if($('ambient-enabled').checked!==engine.ambient.enabled)await engine.ambient.toggle();update();});
 $('ambient-volume').addEventListener('input',()=>{engine.ambient.setVolume(Number($('ambient-volume').value)/100);$('ambient-level').textContent=$('ambient-volume').value+'%';$('volume').value=$('ambient-volume').value;$('volume-value').textContent=$('ambient-volume').value+'%';});
 engine.openSoundSettings=()=>{$('route-dialog').close();update();$('music-dialog').showModal();};
 $('music-close').addEventListener('click',()=>$('music-dialog').close());
 gateway.addEventListener('change',e=>{if(['reload','guest','backup.restore'].includes(e.detail.reason)){stop();load();}});
 load();return {update};
}
