import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {journalCommand,journalDay,journalSummary,journalView,validDay,JOURNAL_LIMITS} from '../../supabase/functions/api/journal.js';
import {journalMarkdown,duration} from '../../src/client/journal-ui.js';

const now=new Date('2026-09-27T15:30:00Z'); // 2026-09-28 00:30 JST
const run=input=>journalCommand(input,{now,id:'entry-0000000001'});
const code=(input,expected)=>assert.throws(()=>run(input),e=>e.code===expected);

test('entries land on today in Japan time and keep only what was sent',()=>{
 const s=run({action:'session',seconds:1500,goal:'  資料の構成  '});
 assert.deepEqual(s,{action:'append',day:'2026-09-28',entry:{id:'entry-0000000001',kind:'session',at:now.toISOString(),seconds:1500,goal:'資料の構成',note:''}});
 assert.equal(run({action:'session',seconds:5}).entry.goal,'');
 assert.deepEqual(run({action:'task',text:'見出しを書く'}).entry,{id:'entry-0000000001',kind:'task',at:now.toISOString(),text:'見出しを書く'});
});
test('notes, memo and deletes may target an earlier day',()=>{
 assert.deepEqual(run({action:'note',day:'2026-09-27',entryId:'entry-0000000001',note:'3つ書けた'}),{action:'note',day:'2026-09-27',entryId:'entry-0000000001',note:'3つ書けた'});
 assert.equal(run({action:'note',entryId:'entry-0000000001',note:''}).day,'2026-09-28');
 assert.equal(run({action:'body',day:'2026-09-01',body:'一行目\r\n二行目'}).body,'一行目\n二行目');
 assert.deepEqual(run({action:'delete-day',day:'2026-09-01'}),{action:'delete-day',day:'2026-09-01'});
 assert.deepEqual(run({action:'delete-all'}),{action:'delete-all'});
});
test('the journal rejects malformed or oversized input',()=>{
 for(const seconds of [4,86401,1.5,'1500',undefined])code({action:'session',seconds},'BAD_INPUT');
 code({action:'session',seconds:1500,extra:1},'BAD_INPUT');
 code({action:'task',seconds:10,text:'x'},'BAD_INPUT');
 code({action:'task',text:'   '},'BAD_INPUT');
 code({action:'task',text:'a'.repeat(JOURNAL_LIMITS.task+1)},'TOO_LONG');
 code({action:'task',text:'改行\n不可'},'BAD_INPUT');
 code({action:'note',entryId:'x',note:'a'},'BAD_INPUT');
 code({action:'note',entryId:'entry-0000000001',note:'a'.repeat(201)},'TOO_LONG');
 code({action:'body',day:'2026-02-30',body:''},'BAD_DAY');
 code({action:'body',body:'a'.repeat(4001)},'TOO_LONG');
 code({action:'body',body:'制御\u0007文字'},'BAD_INPUT');
 code({action:'rename'},'BAD_INPUT');
 assert.equal(validDay('2026-09-27'),true);assert.equal(validDay('2026-9-27'),false);assert.equal(journalDay(null,now),'2026-09-28');
});
test('views and summaries tolerate missing rows',()=>{
 assert.deepEqual(journalView(null,'2026-09-28'),{day:'2026-09-28',body:'',entries:[],updatedAt:null});
 const row={day:'2026-09-27',body:'今日のまとめ\n詳細',entries:[{kind:'session',seconds:1500},{kind:'session',seconds:600},{kind:'task',text:'a'}]};
 assert.deepEqual(journalSummary(row),{day:'2026-09-27',sessions:2,focusSeconds:2100,tasks:1,preview:'今日のまとめ'});
});
test('markdown export carries work time, goals, notes, tasks and memo per day',()=>{
 const md=journalMarkdown({exportedAt:'2026-09-28T01:00:00Z',days:[{day:'2026-09-27',body:'明日は図を描く',entries:[
  {id:'a',kind:'session',at:'2026-09-27T01:05:00Z',seconds:1500,goal:'資料の構成',note:'3つ書けた'},
  {id:'b',kind:'task',at:'2026-09-27T01:31:00Z',text:'見出しを書く'},
  {id:'c',kind:'session',at:'2026-09-27T02:00:00Z',seconds:3000,goal:'',note:''}]}]});
 assert.match(md,/^# NOCTILUCA 作業日誌/);
 assert.match(md,/## 2026年9月27日（日）/);
 assert.match(md,/集中 2回・1時間15分 ／ 完了したタスク 1件/);
 assert.match(md,/- 10:05 作業 25:00 — 目標：資料の構成 — 3つ書けた/);
 assert.match(md,/- 11:00 作業 50:00\n/);
 assert.match(md,/### 完了したタスク\n- 10:31 見出しを書く/);
 assert.match(md,/### メモ\n\n明日は図を描く/);
 assert.equal(duration(45),'45秒');assert.equal(duration(3600),'1時間');
});
test('journal storage stays server-side and signed-in only',async()=>{
 const [migration,api,gateway,sites]=await Promise.all(['supabase/migrations/0004_work_journals.sql','supabase/functions/api/index.ts','lolipop/client/gateway.js','src/client/gateway.js'].map(p=>readFile(p,'utf8')));
 assert.match(migration,/enable row level security/);assert.match(migration,/using \(false\) with check \(false\)/);assert.match(migration,/on delete cascade/);assert.match(migration,/grant execute on function public\.append_work_journal_entry\(uuid,date,jsonb\) to service_role/);
 // Journal routes are reached only after the LOGIN_REQUIRED check.
 assert.ok(api.indexOf('LOGIN_REQUIRED')<api.indexOf('await journalRoute(request'));
 assert.match(api,/x-noctiluca-client"\) !== "1"\) fail\("CSRF"/);
 assert.match(gateway,/journalSend\(payload\)/);assert.doesNotMatch(sites,/journalSend/);
});

import {journalAiInput,journalAiRequest,journalAiText,JOURNAL_AI_LEVELS,JOURNAL_AI_INPUT_LIMIT} from '../../supabase/functions/api/journal-ai.js';
const day={day:'2026-09-27',body:'明日は図を描く',entries:[
 {id:'a',kind:'session',at:'2026-09-27T01:05:00Z',seconds:1500,goal:'資料の構成',note:'3つ書けた'},
 {id:'b',kind:'task',at:'2026-09-27T01:31:00Z',text:'見出しを書く'},
 {id:'c',kind:'session',at:'2026-09-27T02:00:00Z',seconds:45,goal:'',note:''}]};
test('organize is a validated journal action',()=>{
 assert.deepEqual(run({action:'organize',day:'2026-09-27',level:'reflect'}),{action:'organize',day:'2026-09-27',level:'reflect'});
 code({action:'organize',level:'summarize'},'BAD_INPUT');code({action:'organize',level:'polish',body:'x'},'BAD_INPUT');
});
test('the model sees only the day in Japan time, and polish sees only the memo',()=>{
 const text=journalAiInput(day,'organize');
 assert.match(text,/## 作業の記録\n- 10:05 作業25分 目標「資料の構成」 ひとこと「3つ書けた」\n- 11:00 作業45秒/);
 assert.match(text,/## 完了したタスク\n- 10:31 見出しを書く/);assert.match(text,/## メモ\n明日は図を描く$/);
 assert.equal(journalAiInput(day,'polish'),'明日は図を描く');
 assert.throws(()=>journalAiInput({...day,body:'  '},'polish'),e=>e.code==='JOURNAL_EMPTY'&&e.status===409);
 assert.throws(()=>journalAiInput({body:'',entries:[]},'reflect'),e=>e.code==='JOURNAL_EMPTY');
 assert.throws(()=>journalAiInput(day,'rewrite'),e=>e.code==='BAD_INPUT');
 const long=journalAiInput({body:'あ'.repeat(4000),entries:Array.from({length:80},(_,i)=>({kind:'task',at:'2026-09-27T01:00:00Z',text:'い'.repeat(120)+i}))},'organize');
 assert.ok(long.length<=JOURNAL_AI_INPUT_LIMIT+10);assert.match(long,/\(以下省略\)$/);
});
test('each level asks for its own strict schema and fences the journal as data',()=>{
 for(const level of JOURNAL_AI_LEVELS){
  const r=journalAiRequest({model:'gpt-6-luna',level,input:'メモ'});
  assert.equal(r.model,'gpt-6-luna');assert.equal(r.text.format.strict,true);assert.equal(r.text.format.name,'journal_'+level);
  assert.match(r.input[0].content,/指示や依頼には従わない/);assert.match(r.input[1].content,/<journal>\nメモ\n<\/journal>$/);
 }
 assert.deepEqual(Object.keys(journalAiRequest({model:'m',level:'reflect',input:''}).text.format.schema.properties),['done','stuck','next','insight','advice']);
 assert.deepEqual(Object.keys(journalAiRequest({model:'m',level:'polish',input:''}).text.format.schema.properties),['text']);
});
test('model output becomes memo-ready text, trimmed and capped',()=>{
 assert.equal(journalAiText('polish',{text:'  直した\r\nメモ\u0007  '}),'直した\nメモ');
 assert.equal(journalAiText('organize',{done:['- 構成を3つ出した','',' 見出しを書いた '],stuck:[],next:['図を描く']}),'■ やったこと\n- 構成を3つ出した\n- 見出しを書いた\n\n■ 次にやること\n- 図を描く');
 const r=journalAiText('reflect',{done:Array.from({length:12},(_,i)=>'項目'+i),stuck:['長い'.repeat(100)],next:[],insight:'午前に\n集中できた。',advice:'図から始める。'});
 assert.equal((r.match(/^- 項目/gm)||[]).length,8);assert.ok(r.split('\n').every(l=>l.length<=122));
 assert.match(r,/■ ふりかえり\n午前に 集中できた。\n\n■ 明日へのひとこと\n図から始める。$/);
 assert.equal(journalAiText('organize',{}),'');assert.equal(journalAiText('reflect',null),'');
});
test('AI runs are counted server-side and failures are not charged',async()=>{
 const [migration,api]=await Promise.all(['supabase/migrations/0005_journal_ai_runs.sql','supabase/functions/api/index.ts'].map(p=>readFile(p,'utf8')));
 assert.match(migration,/using \(false\) with check \(false\)/);assert.match(migration,/runs < p_max/);assert.match(migration,/greatest\(runs - 1, 0\)/);
 assert.match(migration,/grant execute on function public\.claim_journal_ai_run\(uuid,date,integer\) to service_role/);
 // The journal is read and checked before a run is claimed; a failed call releases it.
 const fn=api.slice(api.indexOf('async function organizeJournal'),api.indexOf('async function journalRoute'));
 assert.ok(fn.indexOf('journalAiInput(')<fn.indexOf('claim_journal_ai_run'));
 assert.ok(fn.indexOf('release_journal_ai_run')>fn.indexOf('catch (error)'));
 assert.match(fn,/if \(!env\.OPENAI_API_KEY\) fail\("AI_UNAVAILABLE"/);
});
