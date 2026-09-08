import {operationId} from './operation-id.js';
export class ApiError extends Error {constructor(code,message,status=0){super(message);this.code=code;this.status=status;}}
export class Gateway extends EventTarget {
  constructor(){super();this.authenticated=false;this.mode='loading';this.snapshot=null;this.pending=null;this.error=null;this.busy=0;this.tail=Promise.resolve();this.guest=null;this.localNotice='';}
  emit(reason,outcome={}){this.dispatchEvent(new CustomEvent('change',{detail:{reason,outcome}}));}
  get blocked(){return !!this.pending && !!this.error;}
  key(){return 'noctiluca.pending.'+this.snapshot?.playerId;}
  persistPending(){
    if(!this.authenticated)return;
    try{if(this.pending)localStorage.setItem(this.key(),JSON.stringify(this.pending));else localStorage.removeItem(this.key());}
    catch{this.localNotice='未送信操作の端末保存が使えません。保存の確認前に画面を閉じないでください。';}
  }
  async request(path,options={}){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try{
      const r=await fetch(path,{credentials:'same-origin',cache:'no-store',...options,signal:controller.signal});
      let body;try{body=await r.json();}catch{throw new ApiError('INVALID_RESPONSE','サーバーからの応答を確認できませんでした。',503);}
      if(!r.ok)throw new ApiError(body.error?.code||'HTTP_ERROR',body.error?.message||'通信に失敗しました。',r.status);
      return body;
    }catch(e){if(e instanceof ApiError)throw e;throw new ApiError('NETWORK','接続を確認できません。操作を保持しています。再試行してください。');}
    finally{clearTimeout(timer);}
  }
  async init(){
    try{
      const s=await this.request('/api/session');this.mode=s.mode;this.authenticated=s.authenticated;
      if(s.authenticated){this.snapshot=s;try{const p=JSON.parse(localStorage.getItem(this.key())||'null');if(p?.id&&p?.type&&Number.isSafeInteger(p.expectedRevision)){this.pending=p;this.error=new ApiError('PENDING','前回、保存を確認できなかった操作があります。再試行または最新版の読み込みを選んでください。');}}catch{} }
      else await this.useGuest(false);
    }catch(e){this.mode='unavailable';this.error=e;await this.useGuest(false);}
    this.emit('init');
  }
  async useGuest(notify=true){this.authenticated=false;this.guest=await (await import('./guest.js')).createGuest();this.snapshot=this.guest.initial();if(notify)this.emit('guest');}
  send(type,payload={}){
    if(this.blocked)return Promise.reject(this.error||new ApiError('PENDING','未確認の保存を先に解決してください。'));
    this.busy++;this.emit('busy');
    const task=this.tail.then(async()=>{
      if(this.blocked)throw this.error;
      const c={id:operationId(),expectedPlayerId:this.snapshot.playerId,expectedRevision:this.snapshot.revision,type,payload};
      if(!this.authenticated){const r=await this.guest.command(c);this.snapshot=r;this.error=null;this.emit(type,r.outcome);return r;}
      this.error=null;this.pending=c;this.persistPending();return this.commit(c);
    });
    this.tail=task.catch(()=>{});
    return task.finally(()=>{this.busy--;this.emit('idle');});
  }
  async commit(c){
    try{
      const r=await this.request('/api/commands',{method:'POST',headers:{'Content-Type':'application/json','X-Noctiluca-Client':'1'},body:JSON.stringify(c)});
      this.snapshot={...this.snapshot,...r};this.pending=null;this.error=null;this.persistPending();this.emit(c.type,r.outcome);return r;
    }catch(e){
      this.error=e;
      const keep=!e.status||e.status>=500||[401,409,429].includes(e.status);
      if(!keep)this.pending=null;
      this.persistPending();this.emit('error');throw e;
    }
  }
  async retry(){if(!this.pending||this.busy)return;this.busy++;this.emit('busy');try{return await this.commit(this.pending);}finally{this.busy--;this.emit('idle');}}
  async reload(){
    if(this.busy)return;
    const r=await this.request('/api/session');if(!r.authenticated)throw new ApiError('LOGIN_REQUIRED','ログインし直してください。',401);
    // A failed operation is discarded only by the user's explicit reload choice.
    this.pending=null;this.persistPending();this.snapshot=r;this.error=null;this.emit('reload');return r;
  }
  async export(){return this.request('/api/export');}
}
