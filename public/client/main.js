import {createSidequestsUI} from './sidequests-ui.js';
import {createMusicUI} from './music-ui.js';
import {createTimerUI} from './timer-ui.js';
import {createJournalUI} from './journal-ui.js';
import {initTextSize} from './text-size.js';
import {createNotionUI} from './notion-ui.js';
import {createStoryUI} from './story-ui.js';
import {createCommerceUI} from './commerce-ui.js';
import {Gateway} from './gateway.js';
import {createEngine} from './engine.js';
import {createJourneyUI} from './journey-ui.js';
initTextSize();
const gateway=new Gateway();
try{
 const [_,r]=await Promise.all([gateway.init(),fetch('/content/catalog.json')]);if(!r.ok)throw new Error('人物データを読み込めませんでした。');
 const engine=createEngine(gateway,await r.json());
 createJourneyUI(gateway,engine);
 engine.journal=createJournalUI(gateway);
  engine.notion=createNotionUI(gateway);
  createTimerUI(engine,gateway);
 engine.music=createMusicUI(engine,gateway);
 engine.commerce=createCommerceUI(gateway,engine);
 engine.sidequests=createSidequestsUI(gateway,engine);
 engine.story=createStoryUI(gateway,engine);
 Object.defineProperty(window,'NOCTILUCA_JOURNEY',{value:{get status(){return {authenticated:gateway.authenticated,mode:gateway.mode,revision:gateway.snapshot.revision,pending:!!gateway.pending,busy:gateway.busy,displayName:gateway.snapshot.state.displayName,location:{...gateway.snapshot.state.location},suspended:gateway.snapshot.state.suspended,notes:[...gateway.snapshot.state.notes],error:gateway.error?.code||null};}}});
}catch(error){
 const n=document.createElement('div');n.className='connection-alert';n.setAttribute('role','alert');n.textContent='起動できませんでした：'+error.message+'。接続を確認して、ページを再読み込みしてください。';document.body.append(n);console.error('NOCTILUCA_BOOT_FAILED',error.message);
}
