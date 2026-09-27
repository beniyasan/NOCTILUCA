import {operationId} from './operation-id.js';
import {createTalkPool} from './talk-pool.js';
export class ApiError extends Error {constructor(code,message,status=0){super(message);this.code=code;this.status=status;}}

const config=()=>({url:(globalThis.NOCTILUCA_SUPABASE_URL||'').replace(/\/$/,''),anon:globalThis.NOCTILUCA_SUPABASE_ANON_KEY||'',api:(globalThis.NOCTILUCA_API_URL||'').replace(/\/$/,'')});
const SESSION_KEY='noctiluca.lolipop.supabase.session';
function authHeaders(c,token){return {'Content-Type':'application/json','apikey':c.anon,...(token?{Authorization:`Bearer ${token}`}:{})};}
function readHash(){const hash=new URLSearchParams(location.hash.replace(/^#/,''));if(!hash.get('access_token'))return null;const session={access_token:hash.get('access_token'),refresh_token:hash.get('refresh_token'),expires_in:Number(hash.get('expires_in')||3600),expires_at:Math.floor(Date.now()/1000)+Number(hash.get('expires_in')||3600)};history.replaceState(null,'',location.pathname+location.search);return session;}
async function authFetch(path,options={}){const c=config();const r=await fetch(`${c.url}${path}`,{...options,headers:{...authHeaders(c),...(options.headers||{})}});const body=await r.json().catch(()=>({}));if(!r.ok)throw new ApiError(body.msg||body.error_description||'AUTH_ERROR','ログイン処理に失敗しました。',r.status);return body;}
export class Gateway extends EventTarget {
 constructor(){super();this.authenticated=false;this.mode='supabase';this.snapshot=null;this.pending=null;this.error=null;this.busy=0;this.tail=Promise.resolve();this.guest=null;this.localNotice='';this.session=null;this.talkPool=createTalkPool(want=>this.request('/passenger-talk?want='+want));}
 emit(reason,outcome={}){this.dispatchEvent(new CustomEvent('change',{detail:{reason,outcome}}));}
 get blocked(){return !!this.pending&&!!this.error;}
 key(){return 'noctiluca.pending.'+this.snapshot?.playerId;}
 persistPending(){if(!this.authenticated)return;try{if(this.pending)localStorage.setItem(this.key(),JSON.stringify(this.pending));else localStorage.removeItem(this.key());}catch{this.localNotice='未送信操作の端末保存が使えません。';}}
 signInPath(){return '#supabase-sign-in';}
 signOutPath(){return '#supabase-sign-out';}
 authLabel(){return 'メールリンクでログイン';}
 async restoreSession(){const fromHash=readHash();if(fromHash){this.session=fromHash;localStorage.setItem(SESSION_KEY,JSON.stringify(fromHash));return fromHash;}let saved;try{saved=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');}catch{}if(!saved)return null;if(saved.expires_at>Date.now()/1000+30)return saved;if(!saved.refresh_token)return null;const body=await authFetch('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:saved.refresh_token})});const next={...body,expires_at:Math.floor(Date.now()/1000)+Number(body.expires_in||3600)};this.session=next;localStorage.setItem(SESSION_KEY,JSON.stringify(next));return next;}
 async currentUser(){if(!this.session)return null;const c=config();const r=await fetch(`${c.url}/auth/v1/user`,{headers:authHeaders(c,this.session.access_token)});if(r.status===401)return null;if(!r.ok)throw new ApiError('AUTH_USER','ログイン状態を確認できません。',r.status);return r.json();}
 async signIn(){const email=prompt('ログイン用メールアドレスを入力してください');if(!email)return;await authFetch('/auth/v1/otp',{method:'POST',body:JSON.stringify({email:email.trim(),create_user:true,options:{emailRedirectTo:location.origin+location.pathname}})});alert('ログイン用リンクをメールで送信しました。メールのリンクを開いてください。');}
 async signInWithGoogle(){const c=config();location.href=`${c.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(location.origin+location.pathname)}`;}
 async signOut(){if(this.session){const c=config();await fetch(`${c.url}/auth/v1/logout`,{method:'POST',headers:authHeaders(c,this.session.access_token)}).catch(()=>{});}this.session=null;localStorage.removeItem(SESSION_KEY);location.reload();}
 async request(path,options={}){const c=config();if(!c.api)throw new ApiError('SUPABASE_CONFIG','Supabase API URLが設定されていません。',503);const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{const r=await fetch(`${c.api}${path}`,{credentials:'omit',cache:'no-store',...options,headers:{...(options.headers||{}),...(this.session?{Authorization:`Bearer ${this.session.access_token}`}:{})},signal:controller.signal});const body=await r.json().catch(()=>null);if(!body)throw new ApiError('INVALID_RESPONSE','サーバーからの応答を確認できませんでした。',503);if(!r.ok)throw new ApiError(body.error?.code||'HTTP_ERROR',body.error?.message||'通信に失敗しました。',r.status);return body;}catch(e){if(e instanceof ApiError)throw e;throw new ApiError('NETWORK','接続を確認できません。操作を保持しています。再試行してください。');}finally{clearTimeout(timer);}}
 async init(){try{this.session=await this.restoreSession();const u=await this.currentUser();this.authenticated=!!u;if(this.authenticated){const s=await this.request('/session');this.snapshot=s;try{const p=JSON.parse(localStorage.getItem(this.key())||'null');if(p?.id&&p?.type&&Number.isSafeInteger(p.expectedRevision)){this.pending=p;this.error=new ApiError('PENDING','前回、保存を確認できなかった操作があります。再試行してください。');}}catch{}}else await this.useGuest(false);}catch(e){this.mode='unavailable';this.error=e;await this.useGuest(false);}void this.talkPool.refresh();this.emit('init');}
 async useGuest(notify=true){this.authenticated=false;this.guest=await (await import('./guest.js')).createGuest();this.snapshot=this.guest.initial();if(notify)this.emit('guest');}
 send(type,payload={}){if(this.blocked)return Promise.reject(this.error||new ApiError('PENDING','未確認の保存を先に解決してください。'));this.busy++;this.emit('busy');const task=this.tail.then(async()=>{const c={id:operationId(),expectedPlayerId:this.snapshot.playerId,expectedRevision:this.snapshot.revision,type,payload};if(!this.authenticated){const r=await this.guest.command(c);this.snapshot=r;this.emit(type,r.outcome);return r;}this.pending=c;this.persistPending();return this.commit(c);});this.tail=task.catch(()=>{});return task.finally(()=>{this.busy--;this.emit('idle');});}
 async commit(c){try{const r=await this.request('/commands',{method:'POST',headers:{'Content-Type':'application/json','X-Noctiluca-Client':'1'},body:JSON.stringify(c)});this.snapshot={...this.snapshot,...r};this.pending=null;this.error=null;this.persistPending();this.emit(c.type,r.outcome);return r;}catch(e){this.error=e;const keep=!e.status||e.status>=500||[401,409,429].includes(e.status);if(!keep)this.pending=null;this.persistPending();this.emit('error');throw e;}}
 async retry(){if(!this.pending||this.busy)return;this.busy++;try{return await this.commit(this.pending);}finally{this.busy--;this.emit('idle');}}
 async reload(){if(this.busy)return;const r=await this.request('/session');this.pending=null;this.snapshot=r;this.error=null;this.persistPending();this.emit('reload');return r;}
 async export(){return this.request('/export');}
 // Work journal (signed-in only). Stored apart from the journey save, so it skips the pending/retry queue.
 journalDay(day){return this.request('/journal/day'+(day?'?day='+encodeURIComponent(day):''));}
 journalDays(before){return this.request('/journal/days'+(before?'?before='+encodeURIComponent(before):''));}
 journalSend(payload){return this.request('/journal',{method:'POST',headers:{'Content-Type':'application/json','X-Noctiluca-Client':'1'},body:JSON.stringify(payload)});}
 journalExport(){return this.request('/journal/export');}
 // Passenger talk from the day's headlines; null means "use the templates".
 passengerTalk(ask){try{return this.talkPool.take(ask);}catch{return null;}}
}
