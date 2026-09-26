import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {jstDay,parseFeed,filterHeadlines,sanitizeTalks,talkRequest,responseText,TALK_SCHEMA} from '../../supabase/functions/api/passenger-talk.js';
import {createTalkPool} from '../../lolipop/client/talk-pool.js';
import {createPassengerDirector} from '../../src/client/passengers.js';
import {rand} from '../../src/client/pixel.js';

test('the pool day rolls over at midnight Japan time',()=>{
 assert.equal(jstDay(new Date('2026-09-26T14:59:00Z')),'2026-09-26');
 assert.equal(jstDay(new Date('2026-09-26T15:00:00Z')),'2026-09-27');
});
test('feed titles are read from RSS and Atom, and heavy news never reaches the model',()=>{
 const rss='<rss><channel><title>NHK</title><item><title><![CDATA[新しい駅弁が人気 &amp; 行列]]></title></item><item><title>大雨で被害拡大</title></item><item><title>首相が会見</title></item><item><title>決勝戦で逆転勝ち</title></item></channel></rss>';
 const atom='<feed><entry><title type="text">秋の新作スイーツが登場</title></entry></feed>';
 assert.deepEqual(parseFeed(rss),['新しい駅弁が人気 & 行列','大雨で被害拡大','首相が会見','決勝戦で逆転勝ち']);
 assert.deepEqual(filterHeadlines([...parseFeed(rss),...parseFeed(atom),'秋の新作スイーツが登場']),['新しい駅弁が人気 & 行列','決勝戦で逆転勝ち','秋の新作スイーツが登場']);
});
test('the model request asks for strict JSON and its answer is read back',()=>{
 const body=talkRequest({model:'gpt-6-luna',headlines:['秋の新作スイーツが登場'],batch:2});
 assert.equal(body.model,'gpt-6-luna');assert.equal(body.text.format.type,'json_schema');assert.equal(body.text.format.strict,true);
 assert.deepEqual(body.text.format.schema,TALK_SCHEMA);assert.match(body.input[1].content,/秋の新作スイーツ/);assert.match(body.input[1].content,/2回目/);
 assert.equal(responseText({output:[{type:'reasoning'},{type:'message',content:[{type:'output_text',text:'{"talks":[]}'}]}]}),'{"talks":[]}');
});
test('generated talks are trimmed to what fits the seat',()=>{
 const ok={size:2,tone:'chat',lines:[{who:0,text:'ねえ、新しい駅弁食べた?',mark:''},{who:1,text:'まだ。おいしいの?',mark:''},{who:0,text:'~行列すごかった。',mark:'~'}]};
 const out=sanitizeTalks({talks:[ok,
  {...ok,lines:[...ok.lines,{who:1,text:'事故があったらしい',mark:''}]},// heavy word
  {...ok,size:3},// a trio where one never speaks
  {...ok,lines:ok.lines.map(l=>({...l,who:5}))},
  {...ok,lines:[{who:0,text:'<b>あ</b>'.repeat(20),mark:''},...ok.lines]},
 ]});
 assert.equal(out.length,2);assert.deepEqual(out[0],ok);assert.equal(out[1].lines.length,3);
});
function pool(responses){
 const calls=[];let i=0;const t={now:0};
 const p=createTalkPool(async want=>{calls.push(want);return responses[Math.min(i++,responses.length-1)];},{random:rand(4),now:()=>t.now});
 return {p,calls,t};
}
const talk=(id,size,tone='chat')=>({id,size,tone,lines:[{who:0,text:'{n2}、{st}で降りる?',mark:''},{who:1,text:'うん、{next}はまた今度。',mark:''},{who:size-1,text:'~そっか。',mark:'~'}]});
test('the pool fills names and stops, and falls back to templates while empty',async()=>{
 const {p}=pool([{day:'2026-09-26',batches:1,maxBatches:3,generating:false,talks:[talk(1,2)]}]);
 assert.equal(p.take({size:2}),null);await new Promise(r=>setTimeout(r));
 const lines=p.take({size:2,names:['カナ','ユウ'],station:'九龍東ホーム',next:'蒼海ドック'});
 assert.equal(lines[0].text,'ユウ、九龍東ホームで降りる?');assert.equal(lines[1].text,'うん、蒼海ドックはまた今度。');
 assert.equal(p.take({size:3}),null,'no trio talk yet');
});
test('a full lap asks for the next batch once, up to the daily cap',async()=>{
 const {p,calls}=pool([
  {day:'d',batches:1,maxBatches:2,generating:false,talks:[talk(1,2),talk(2,2)]},
  {day:'d',batches:1,maxBatches:2,generating:true,talks:[talk(1,2),talk(2,2)]},
  {day:'d',batches:2,maxBatches:2,generating:false,talks:[talk(1,2),talk(2,2),talk(3,2)]},
 ]);
 await p.refresh();assert.deepEqual(calls,[1]);
 const seen=new Set();for(let i=0;i<2;i++)seen.add(p.take({size:2})[0].text+i);
 assert.deepEqual(calls,[1],'no request before the lap ends');
 assert.ok(p.take({size:2}),'replays while the next batch is written');await new Promise(r=>setTimeout(r));
 assert.deepEqual(calls,[1,2]);assert.equal(p.status.want,2);
});
test('the director uses supplied lines and still falls back to templates',()=>{
 const supplied=[{who:0,text:'今日の話',mark:''},{who:1,text:'うん',mark:''}];
 for(const talkFn of [()=>supplied,()=>null]){
  const d=createPassengerDirector({random:rand(9),talk:talkFn});d.seed({station:'x',next:'y'},2);
  let line=null;for(let i=0;i<300&&!line;i++){d.advance(.1,{width:460});line=d.view.line;}
  assert.ok(line);if(talkFn()===supplied)assert.equal(line.text,'今日の話');else assert.notEqual(line.text,'今日の話');
 }
});
test('only the Lolipop edition talks to the pool; the key stays on the server',async()=>{
 const [gateway,api,build,sitesGateway,migration]=await Promise.all(['lolipop/client/gateway.js','supabase/functions/api/index.ts','scripts/build-lolipop.mjs','src/client/gateway.js','supabase/migrations/0002_passenger_talk.sql'].map(f=>readFile(f,'utf8')));
 assert.match(gateway,/passenger-talk\?want=/);assert.doesNotMatch(sitesGateway,/passengerTalk/);
 assert.match(api,/OPENAI_API_KEY/);assert.doesNotMatch(gateway,/OPENAI|openai/);
 assert.match(build,/talk-pool\.js/);assert.match(migration,/for update/);assert.match(migration,/locked_until/);
});
