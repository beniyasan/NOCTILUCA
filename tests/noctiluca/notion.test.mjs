import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {signState,verifyState,sealTokens,openTokens,authorizeUrl,summarizeSource,checkMapping,connectionView,NOTION_VERSION} from '../../supabase/functions/api/notion.js';

const KEY='k'.repeat(40),OTHER='o'.repeat(40),PLAYER='3f1c2c8e-0000-4000-8000-000000000001';
test('the OAuth state names the player, and rejects tampering, other keys and old links',async()=>{
 const now=Date.parse('2026-09-27T10:00:00Z'),state=await signState(PLAYER,KEY,now);
 assert.equal(await verifyState(state,KEY,now+60e3),PLAYER);
 assert.equal(await verifyState(state,OTHER,now),null);
 assert.equal(await verifyState(state,KEY,now+11*60e3),null,'expires after ten minutes');
 const [body,sig]=state.split('.');const forged=Buffer.from(JSON.stringify({p:'someone-else',e:now+60e3,n:'x'})).toString('base64url');
 assert.equal(await verifyState(forged+'.'+sig,KEY,now),null);
 assert.equal(await verifyState(body,KEY,now),null);assert.equal(await verifyState(null,KEY,now),null);assert.equal(await verifyState('a.b.c',KEY,now),null);
 await assert.rejects(signState(PLAYER,'short'),/NOTION_TOKEN_KEY/);
});
test('tokens are stored encrypted and only the same key opens them',async()=>{
 const sealed=await sealTokens({access:'ntn_access',refresh:'nrt_refresh'},KEY);
 assert.ok(!sealed.includes('ntn_access')&&!sealed.includes('nrt_refresh'));
 assert.notEqual(sealed,await sealTokens({access:'ntn_access',refresh:'nrt_refresh'},KEY),'a fresh IV each time');
 assert.deepEqual(await openTokens(sealed,KEY),{access:'ntn_access',refresh:'nrt_refresh'});
 await assert.rejects(openTokens(sealed,OTHER));
});
test('the authorize URL asks Notion for a user-owned connection back to our callback',()=>{
 const u=new URL(authorizeUrl({clientId:'cid',redirectUri:'https://x.supabase.co/functions/v1/api/notion/callback',state:'s.t'}));
 assert.equal(u.origin+u.pathname,'https://api.notion.com/v1/oauth/authorize');
 assert.deepEqual(Object.fromEntries(u.searchParams),{client_id:'cid',response_type:'code',owner:'user',redirect_uri:'https://x.supabase.co/functions/v1/api/notion/callback',state:'s.t'});
 assert.equal(NOTION_VERSION,'2026-03-11');
});
const source={id:'ds-1',title:[{plain_text:'仕事の'},{plain_text:'タスク'}],properties:{
 Name:{id:'title',name:'Name',type:'title',title:{}},
 Done:{id:'a%3Db',name:'Done',type:'checkbox',checkbox:{}},
 Status:{id:'stat',name:'Status',type:'status',status:{options:[{id:'o1',name:'未着手'},{id:'o2',name:'進行中'},{id:'o3',name:'完了'}],groups:[{name:'To-do',option_ids:['o1']},{name:'In progress',option_ids:['o2']},{name:'Complete',option_ids:['o3']}]}},
 Due:{id:'due',name:'Due',type:'date',date:{}},
}};
test('a data source is reduced to its title column and possible done columns',()=>{
 const s=summarizeSource(source);
 assert.equal(s.name,'仕事のタスク');assert.deepEqual(s.titleProperty,{id:'title',name:'Name'});
 assert.deepEqual(s.done.map(p=>[p.name,p.type]),[['Done','checkbox'],['Status','status']]);
 assert.equal(s.done[1].suggested,'o3','the first option in the Complete group');
 assert.equal(s.done[1].options[1].group,'In progress');
 assert.equal(summarizeSource({id:'x',title:[],properties:{}}).name,'無題のデータベース');
});
test('a mapping is checked against the live columns before it is saved',()=>{
 const s=summarizeSource(source);
 assert.deepEqual(checkMapping(s,{doneProperty:'a%3Db'}),{data_source_id:'ds-1',data_source_name:'仕事のタスク',title_property:'title',done_property:'a%3Db',done_property_name:'Done',done_type:'checkbox',done_option:null,done_option_name:null});
 assert.equal(checkMapping(s,{doneProperty:'stat',doneOption:'o3'}).done_option_name,'完了');
 assert.throws(()=>checkMapping(s,{doneProperty:'due'}),e=>e.code==='NOTION_BAD_COLUMN');
 assert.throws(()=>checkMapping(s,{doneProperty:'stat'}),e=>e.code==='NOTION_BAD_OPTION');
 assert.throws(()=>checkMapping(s,{doneProperty:'stat',doneOption:'nope'}),e=>e.code==='NOTION_BAD_OPTION');
 assert.throws(()=>checkMapping({...s,titleProperty:null},{doneProperty:'a%3Db'}),e=>e.code==='NOTION_NO_TITLE');
});
test('the page never sees tokens',()=>{
 const row={tokens:'sealed',bot_id:'b',workspace_id:'w',workspace_name:'My WS',data_source_id:'ds-1',data_source_name:'仕事のタスク',done_property_name:'Status',done_type:'status',done_option_name:'完了'};
 const v=connectionView(row,true);assert.ok(!JSON.stringify(v).includes('sealed'));
 assert.deepEqual(v,{available:true,connected:true,workspaceName:'My WS',source:{id:'ds-1',name:'仕事のタスク',doneName:'Status',doneType:'status',doneOptionName:'完了'}});
 assert.deepEqual(connectionView(null,false),{available:false,connected:false});
 assert.equal(connectionView({...row,data_source_id:null},true).source,null);
});
test('Notion storage and routes stay server-side',async()=>{
 const [migration,api,gateway,sites]=await Promise.all(['supabase/migrations/0006_notion_connections.sql','supabase/functions/api/index.ts','lolipop/client/gateway.js','src/client/gateway.js'].map(p=>readFile(p,'utf8')));
 assert.match(migration,/enable row level security/);assert.match(migration,/using \(false\) with check \(false\)/);assert.match(migration,/on delete cascade/);
 // The callback has no login header, so it is routed before the login check and trusts only the signed state.
 assert.ok(api.indexOf('notion/callback")) return await notionCallback')<api.indexOf('LOGIN_REQUIRED'));
 assert.ok(api.indexOf('LOGIN_REQUIRED')<api.indexOf('await notionRoute(request'));
 assert.match(api,/verifyState\(url\.searchParams\.get\("state"\), notionKey\)/);
 assert.match(api,/sealTokens\(\{ access: t\.access_token, refresh: t\.refresh_token \}/);
 assert.match(api,/start_cursor: cursor/);assert.match(api,/data\.has_more/);
 assert.match(gateway,/notionPost\(action/);assert.doesNotMatch(sites,/notion/i);
});

import {openTaskFilter,taskTitle,taskFromPage,newTaskPage,doneUpdate} from '../../supabase/functions/api/notion.js';
import {freshState,reduce} from '../../src/game/rules.js';
const PAGE='59b8df07-1111-4222-8333-944455556666',PAGE2='59b8df07111142228333944455557777';
const cmd=(s,type,payload,id='cmd-0000000001')=>reduce(s,{id,type,payload},{},{now:'2026-09-27T12:00:00Z'}).state;
test('focus tasks may carry a Notion page, or wait to be sent there',()=>{
 let s=freshState();s.displayName='旅人';
 s=cmd(s,'focus.task.add',{text:'資料をまとめる',notion:PAGE},'task-a');s=cmd(s,'focus.task.add',{text:'図を描く',notion:'pending'},'task-b');s=cmd(s,'focus.task.add',{text:'ここだけのメモ'},'task-c');
 assert.deepEqual(s.focusTasks,[{id:'task-a',text:'資料をまとめる',notion:PAGE},{id:'task-b',text:'図を描く',notion:'pending'},{id:'task-c',text:'ここだけのメモ'}]);
 assert.throws(()=>cmd(s,'focus.task.add',{text:'二重',notion:PAGE},'task-d'),e=>e.code==='TASK_EXISTS');
 for(const notion of ['nope','',42,'pending-x'])assert.throws(()=>cmd(s,'focus.task.add',{text:'x',notion},'task-e'),e=>e.code==='BAD_TASK');
 s=cmd(s,'focus.task.link',{id:'task-b',notion:PAGE2},'link-1');assert.equal(s.focusTasks[1].notion,PAGE2);
 assert.throws(()=>cmd(s,'focus.task.link',{id:'task-b',notion:PAGE},'link-2'),e=>e.code==='TASK_LINKED');
 assert.throws(()=>cmd(s,'focus.task.link',{id:'task-c',notion:PAGE},'link-3'),e=>e.code==='TASK_LINKED','only pending tasks are linked');
 assert.throws(()=>cmd(s,'focus.task.link',{id:'missing',notion:PAGE},'link-4'),e=>e.code==='TASK_MISSING');
 assert.throws(()=>cmd(s,'focus.task.link',{id:'task-a',notion:'pending'},'link-5'),e=>e.code==='BAD_TASK');
});
const checkboxRow={data_source_id:'ds-1',title_property:'title',done_type:'checkbox',done_property:'a%3Db',done_option:null,done_option_name:null};
const statusRow={...checkboxRow,done_type:'status',done_property:'stat',done_option:'o3',done_option_name:'完了'};
test('open tasks are filtered and written by the chosen done column',()=>{
 assert.deepEqual(openTaskFilter(checkboxRow),{property:'a%3Db',checkbox:{equals:false}});
 assert.deepEqual(openTaskFilter(statusRow),{property:'stat',status:{does_not_equal:'完了'}});
 assert.deepEqual(doneUpdate(checkboxRow),{properties:{'a%3Db':{checkbox:true}}});
 assert.deepEqual(doneUpdate(statusRow),{properties:{stat:{status:{id:'o3'}}}});
 assert.deepEqual(newTaskPage(statusRow,' 図を\n描く '),{parent:{type:'data_source_id',data_source_id:'ds-1'},properties:{title:{title:[{type:'text',text:{content:'図を 描く'}}]}}});
 assert.throws(()=>newTaskPage(statusRow,'  '),e=>e.code==='BAD_TASK');
});
test('Notion titles become valid focus tasks',()=>{
 assert.equal(taskTitle('a'.repeat(200)).length,120);assert.equal(taskTitle('一行目\n二行目\t終わり'),'一行目 二行目 終わり');
 assert.deepEqual(taskFromPage({id:PAGE,properties:{Name:{id:'title',type:'title',title:[{plain_text:'資料'},{plain_text:'をまとめる'}]},Done:{id:'x',type:'checkbox',checkbox:false}}},'title'),{id:PAGE,title:'資料をまとめる'});
 assert.equal(taskFromPage({id:PAGE,properties:{}},'title').title,'');
});

test('task sync cannot duplicate pages or lose completions',async()=>{
 const [migration,api,ui]=await Promise.all(['supabase/migrations/0007_notion_sync.sql','supabase/functions/api/index.ts','src/client/notion-ui.js'].map(p=>readFile(p,'utf8')));
 for(const table of ['notion_task_pages','notion_outbox'])assert.match(migration,new RegExp('alter table public\\.'+table+' enable row level security'));
 // Create is keyed by the NOCTILUCA task: a known page is returned before anything is created.
 const create=api.slice(api.indexOf('path.endsWith("/notion/tasks/create")'),api.indexOf('path.endsWith("/notion/tasks/complete")'));
 assert.match(create,/exactKeys\(input, \["taskId", "text"\]\)/);
 assert.ok(create.indexOf('return { pageId: known.data.page_id }')<create.indexOf('"/pages", { method: "POST"'));
 assert.ok(create.indexOf('insert({ player_id: playerId, task_id: taskId })')<create.indexOf('"/pages", { method: "POST"'),'claimed before creating');
 // Completions Notion refused wait in the outbox; the device keeps every one that never reached us.
 assert.match(api,/from\("notion_outbox"\)\.upsert/);assert.doesNotMatch(ui,/slice\(-\d+\)/);
 assert.match(ui,/notionPost\('tasks\/create',\{taskId:task\.id/);
 // Rotated refresh tokens are kept for the rest of the request.
 assert.match(api,/row\.tokens = await sealTokens\(tokens, notionKey\)/);
 // Disconnecting clears the sync records too.
 assert.match(api,/\["notion_outbox", "notion_task_pages", "notion_connections"\]/);
});
