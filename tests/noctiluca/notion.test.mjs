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
