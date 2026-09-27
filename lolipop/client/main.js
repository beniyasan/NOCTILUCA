import {createSidequestsUI} from './sidequests-ui.js';
import {createMusicUI} from './music-ui.js';
import {createTimerUI} from './timer-ui.js';
import {createJournalUI} from './journal-ui.js';
import {createStoryUI} from './story-ui.js';
import {createCommerceUI} from './commerce-ui.js';
import {Gateway} from './gateway.js';
import {createEngine} from './engine.js';
import {createJourneyUI} from './journey-ui.js';

const gateway=new Gateway();
function wireAuth(){const signIn=document.getElementById('signin-link');const signOut=document.getElementById('signout-link');signIn?.addEventListener('click',e=>{e.preventDefault();gateway.signIn().catch(error=>gateway.error=error);});signOut?.addEventListener('click',e=>{e.preventDefault();gateway.signOut();});const google=document.createElement('button');google.type='button';google.id='google-signin';google.className='subtle-button';google.textContent='Googleでログイン';google.addEventListener('click',()=>gateway.signInWithGoogle());signIn?.after(google);}
try{const [_,r]=await Promise.all([gateway.init(),fetch('/content/catalog.json')]);if(!r.ok)throw new Error('人物データを読み込めませんでした。');const engine=createEngine(gateway,await r.json());createJourneyUI(gateway,engine);wireAuth();engine.journal=createJournalUI(gateway);createTimerUI(engine,gateway);engine.music=createMusicUI(engine,gateway);engine.commerce=createCommerceUI(gateway,engine);engine.sidequests=createSidequestsUI(gateway,engine);engine.story=createStoryUI(gateway,engine);Object.defineProperty(window,'NOCTILUCA_JOURNEY',{value:{get status(){return {authenticated:gateway.authenticated,mode:gateway.mode,revision:gateway.snapshot.revision,pending:!!gateway.pending,busy:gateway.busy,displayName:gateway.snapshot.state.displayName,location:{...gateway.snapshot.state.location},suspended:gateway.snapshot.state.suspended,notes:[...gateway.snapshot.state.notes],error:gateway.error?.code||null};}}});}catch(error){const n=document.createElement('div');n.className='connection-alert';n.setAttribute('role','alert');n.textContent='起動できませんでした：'+error.message+'。接続を確認して、ページを再読み込みしてください。';document.body.append(n);console.error('NOCTILUCA_LOLIPOP_BOOT_FAILED',error.message);}
