import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState,reduce,viewState} from '../../src/game/rules.js';
import {createSidequestsUI} from '../../src/client/sidequests-ui.js';
import data from '../../src/server/content.js';
class Element extends EventTarget{
 constructor(tag='div'){super();this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.textContent='';this.open=false;this.disabled=false;}
 append(...a){this.children.push(...a);}replaceChildren(...a){this.children=a;}
 querySelectorAll(tag){return walk(this).filter(n=>n.tagName===tag.toUpperCase());}
 showModal(){this.open=true;}close(){this.open=false;this.dispatchEvent(new Event('close'));}
 focus(){document.activeElement=this;}
 querySelector(sel){const key=sel.match(/data-quest-action="(.*)"/)?.[1];return walk(this).find(n=>n.dataset.questAction===key);}
}
const walk=n=>[n,...n.children.flatMap(walk)];
test('quest UI supports request, source conversation, purchase, saved handover and completion history',async()=>{
 const nodes=new Map(['sidequests-dialog','sidequests-body','sidequests-open','sidequests-close'].map(id=>[id,new Element()]));
 const previous={document:globalThis.document,CSS:globalThis.CSS};
 globalThis.document={getElementById:id=>nodes.get(id),createElement:tag=>new Element(tag),activeElement:null};globalThis.CSS={escape:s=>s};
 let state=freshState();state.displayName='読者';state.location.mode='station';state.narrative.introSeen=true;
 class G extends EventTarget{constructor(){super();this.authenticated=true;this.busy=0;this.blocked=false;this.failNext=false;this.update();}update(){this.snapshot={state:viewState(state,data)};this.dispatchEvent(new CustomEvent('change',{detail:{reason:'update'}}));}async send(type,payload){if(this.failNext){this.failNext=false;throw new Error('保存を確認できませんでした。');}const result=reduce(state,{type,payload,id:crypto.randomUUID()},data);state=result.state;this.update();return result;}}
 const g=new G(),body=nodes.get('sidequests-body');
 const click=async key=>{const b=walk(body).find(n=>n.dataset.questAction===key);assert.ok(b,'button '+key);assert.ok(!b.disabled,key+' enabled');b.onclick();await new Promise(r=>setImmediate(r));};
 const text=()=>walk(body).map(n=>n.textContent).join('\n');
 const listen=async id=>{await click(id+':talk');while(state.sidequests.active)await click('next');};
 const choose=async(id,type)=>{await click(id+':'+type);await click('confirm');};
 const go=async world=>{await g.send('journey.board',{});await g.send('travel.arrive',{world});await g.send('journey.alight',{});};
 try{
  const ui=createSidequestsUI(g,{talk:{close(){}},setHeld(){},state:{}});ui.open();assert.match(text(),/静かな耳/);assert.match(text(),/雨の日の傘置き/);
  await listen('quiet_ears');await choose('quiet_ears','accept');await go('scrap');assert.match(text(),/オル/);await listen('quiet_ears');await choose('quiet_ears','buy');assert.equal(state.commerce.cash,96);
  await go('kowloon');await click('quiet_ears:deliver');assert.match(text(),/96 → 128/);g.failNext=true;await click('confirm');assert.equal(state.commerce.cash,96);assert.match(text(),/保存を確認できません/);assert.doesNotMatch(text(),/支払いを確認し/);
  await click('confirm');assert.equal(state.commerce.cash,128);assert.match(text(),/32 cr、お確かめ/);assert.match(text(),/済んだ仕事/);
  await go('scrap');await go('kowloon');await listen('quiet_ears');assert.equal(state.sidequests.quests.quiet_ears.stage,'completed');
  await go('scrap');await listen('shears_return');await click('shears_return:accept');assert.match(text(),/布巻きの剪定ばさみを預かります/);assert.match(text(),/スイへの引き渡し/);await click('confirm');
  await go('jade');await click('shears_return:deliver');assert.match(text(),/翡翠ガーデンのスイ/);assert.match(text(),/オルから預かった/);await click('confirm');assert.equal(state.commerce.cash,142);
  await go('scrap');await listen('glove_drying');await choose('glove_drying','accept');await go('gorge');await listen('glove_drying');await go('scrap');await click('glove_drying:deliver');assert.match(text(),/トマから聞いた話をオルに伝えます/);await click('confirm');assert.equal(state.commerce.cash,152);
  assert.match(text(),/スクラップ・ベルトに、仕事の続き/);
  await go('pelagic');assert.match(text(),/昼飯は、こっち/);assert.match(text(),/潮待ちの腰掛け/);
  await listen('wave_cups');await click('wave_cups:accept');assert.match(text(),/青い波模様のカップの箱を預かります/);await click('confirm');await go('kowloon');await click('wave_cups:deliver');assert.match(text(),/メイに、ナギから預かった/);await click('confirm');assert.equal(state.commerce.cash,166);
  await go('pelagic');await listen('tide_seat');await choose('tide_seat','accept');await go('gorge');await listen('tide_seat');await go('pelagic');await click('tide_seat:deliver');assert.match(text(),/トマから聞いた話をナギに伝えます/);await click('confirm');assert.equal(state.commerce.cash,176);
  await go('gorge');assert.match(text(),/風にめくられない頁/);await listen('cat_descent');await choose('cat_descent','accept');await go('jade');await listen('cat_descent');await go('gorge');await choose('cat_descent','deliver');assert.equal(state.commerce.cash,186);
  await go('relay');assert.match(text(),/第四章/);assert.doesNotMatch(text(),/空箱の着く音/);
  Object.assign(state.chapterFour,{orderRead:true,decision:'declined',observed:true});g.update();assert.match(text(),/空箱の着く音/);assert.match(text(),/作業票を読む/);
  await click('empty_count:talk');assert.match(text(),/続きを読む/);while(state.sidequests.active){if(state.sidequests.active.line===2)assert.match(text(),/記録を読み終える/);await click('next');}
  await choose('empty_count','accept');await go('pelagic');await listen('empty_count');await go('relay');assert.match(text(),/調査結果を登録する/);await choose('empty_count','deliver');assert.equal(state.commerce.cash,196);assert.match(text(),/照会結果を登録/);
  nodes.get('sidequests-close').dispatchEvent(new Event('click'));assert.equal(nodes.get('sidequests-dialog').open,false);
 }finally{globalThis.document=previous.document;globalThis.CSS=previous.CSS;}
});

test('reset confirmation needs consent, invalidates on account changes and reports success only after save',async()=>{
 const {createResetUI}=await import('../../src/client/reset-ui.js');
 const nodes=new Map(['account-dialog','reset-dialog','reset-open','reset-confirm','reset-consent','reset-cancel','reset-form','reset-name','reset-error'].map(id=>{const n=new Element();n.id=id;return [id,n];}));
 const previous=globalThis.document;globalThis.document={getElementById:id=>nodes.get(id),querySelectorAll:()=>[...nodes.values()].filter(n=>n.id.endsWith('dialog')&&n.open),activeElement:null};
 const messages=[];let sends=0;
 class G extends EventTarget{
  constructor(){super();this.authenticated=true;this.busy=0;this.blocked=false;this.snapshot={playerId:'a',revision:3,state:{displayName:'旅人'}};}
  change(reason){this.dispatchEvent(new CustomEvent('change',{detail:{reason}}));}
  async send(type,payload){sends++;assert.equal(type,'journey.reset');assert.deepEqual(payload,{confirmation:'reset-journey'});this.busy=1;this.change('busy');await new Promise(r=>setImmediate(r));this.busy=0;this.blocked=true;this.change('error');throw new Error('接続を確認できません。');}
 }
 const g=new G(),click=id=>nodes.get(id).dispatchEvent(new Event('click')),submit=async()=>{nodes.get('reset-form').dispatchEvent(new Event('submit',{cancelable:true}));await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));},consent=()=>{nodes.get('reset-consent').checked=true;nodes.get('reset-consent').dispatchEvent(new Event('change'));};
 try{
  createResetUI(g,{state:{},setHeld(){}},{message:(t,error)=>messages.push({t,error})});nodes.get('account-dialog').showModal();
  click('reset-open');assert.equal(nodes.get('reset-dialog').open,true);assert.equal(nodes.get('reset-confirm').disabled,true);await submit();assert.equal(sends,0);
  consent();assert.equal(nodes.get('reset-confirm').disabled,false);click('reset-cancel');assert.equal(sends,0);assert.equal(nodes.get('reset-dialog').open,false);
  click('reset-open');assert.equal(nodes.get('reset-consent').checked,false);consent();g.snapshot.playerId='b';g.change('reload');assert.equal(nodes.get('reset-confirm').disabled,true);await submit();assert.equal(sends,0);click('reset-cancel');
  click('reset-open');consent();await submit();assert.equal(sends,1);assert.equal(nodes.get('reset-dialog').open,true);assert.match(nodes.get('reset-error').textContent,/接続/);assert.ok(messages.every(m=>!m.t.includes('初期化を保存しました')));
  click('reset-cancel');assert.equal(nodes.get('reset-open').disabled,true);
  g.blocked=false;g.snapshot.revision++;g.change('journey.reset');assert.equal(nodes.get('reset-dialog').open,false);assert.equal(nodes.get('account-dialog').open,true);assert.match(messages.at(-1).t,/初期化を保存しました/);
 }finally{globalThis.document=previous;}
});

test('on-screen timer tasks preserve drafts and focus across ticks, and remove only after confirmation',async()=>{
 const {createTimerTasksUI}=await import('../../src/client/timer-tasks-ui.js');
 const nodes=new Map(['timer-task-composer','timer-task-toggle','timer-tasks','timer-overlay','timer-task-empty','timer-task-list','timer-task-add','timer-task-input','timer-task-form','timer-task-message'].map(id=>[id,new Element()]));
 const previous=globalThis.document;globalThis.document={getElementById:id=>nodes.get(id),createElement:tag=>{const el=new Element(tag);el.setAttribute=(k,v)=>{el[k]=v;};return el;},activeElement:null};nodes.get('timer-task-form').reportValidity=()=>true;nodes.get('timer-task-input').value='';
 let state=freshState(),running=true;state.displayName='旅人';
 class G extends EventTarget{
  constructor(){super();this.busy=0;this.blocked=false;this.fail=false;this.snapshot={playerId:'a',state};}
  emit(reason){this.snapshot={playerId:'a',state};this.dispatchEvent(new CustomEvent('change',{detail:{reason}}));}
  async send(type,payload){if(this.fail){this.fail=false;throw Error('保存できませんでした');}state=reduce(state,{type,payload,id:crypto.randomUUID()},data).state;this.emit(type);}
 }
 const g=new G(),input=nodes.get('timer-task-input'),list=nodes.get('timer-task-list'),flush=()=>new Promise(r=>setImmediate(r));
 try{
  const ui=createTimerTasksUI(g,()=>running);assert.equal(nodes.get('timer-tasks').hidden,false);
  assert.equal(nodes.get('timer-task-composer').open,false);nodes.get('timer-task-composer').open=true;input.value='資料を読む';input.dispatchEvent(new Event('input'));input.focus();for(let n=0;n<5;n++)ui.render();assert.equal(input.value,'資料を読む');assert.equal(document.activeElement,input);
  nodes.get('timer-task-form').dispatchEvent(new Event('submit',{cancelable:true}));await flush();assert.equal(input.value,'');assert.equal(nodes.get('timer-task-composer').open,false);assert.equal(state.focusTasks.length,1);assert.equal(list.children[0].children[0].textContent,'資料を読む');
  const button=list.children[0].children[1];button.focus();ui.render();assert.equal(document.activeElement,button);assert.equal(list.children[0].children[1],button);
  g.fail=true;button.dispatchEvent(new Event('click'));await flush();assert.equal(state.focusTasks.length,1);assert.equal(list.children.length,1);assert.match(nodes.get('timer-task-message').textContent,/保存できません/);
  button.dispatchEvent(new Event('click'));await flush();assert.equal(list.children.length,0);assert.equal(state.focusTasks.length,0);assert.equal(document.activeElement,nodes.get('timer-task-toggle'));
  running=false;ui.render();assert.equal(nodes.get('timer-tasks').hidden,true);running=true;ui.render();assert.equal(nodes.get('timer-tasks').hidden,false);
 }finally{globalThis.document=previous;}
});
