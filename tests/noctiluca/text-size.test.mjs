import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('every px font size goes through a scalable variable that phones leave untouched',async()=>{
 const [scene,journey,html]=await Promise.all(['src/client/scene.css','src/client/journey.css','src/client/index.template.html'].map(p=>readFile(p,'utf8')));
 const css=scene+journey;
 assert.doesNotMatch(css,/font-size:\d+px|font:\d+px/,'no fixed px font sizes left');
 const used=new Set([...css.matchAll(/var\(--fs-(\d+)\)/g)].map(m=>m[1]));
 for(const n of used)assert.match(scene,new RegExp(`--fs-${n}:calc\\(max\\(${n}px,var\\(--text-min\\)\\)\\*var\\(--text-scale\\)\\)`),'--fs-'+n+' is defined');
 // Defaults leave sizes as authored; only wide screens with a fine pointer raise and scale them.
 assert.match(scene,/:root\{--text-min:0px;--text-scale:1;/);
 assert.match(scene,/@media\(min-width:691px\) and \(pointer:fine\)\{:root\{--text-min:12px\}:root\[data-text-size="large"\]\{--text-scale:1\.15\}:root\[data-text-size="xlarge"\]\{--text-scale:1\.3\}\}/);
 assert.match(html,/<select id="text-size"><option value="normal" selected>標準<\/option><option value="large">大きめ<\/option><option value="xlarge">特大<\/option><\/select>/);
});
test('first visit: opening, then a welcome card that waits for a name; the intro keeps the train at Kowloon',async()=>{
 const [welcome,opening,story,engine,html,scenario,narrative]=await Promise.all(['src/client/welcome-ui.js','src/client/opening-ui.js','src/client/story-ui.js','src/client/engine.js','src/client/index.template.html','content/scenario.json','src/game/narrative.js'].map(p=>readFile(p,'utf8')));
 assert.match(welcome,/if\(seen\|\|s\.storyView\?\.introSeen\|\|visits>1\|\|s\.suspended\)return;/,'only on a fresh journey, once per device');
 // A signed-in player without a name is asked for it first; the opening and card wait.
 assert.match(welcome,/if\(started\|\|!now\.displayName\|\|now\.suspended\|\|gateway\.blocked\|\|document\.querySelector\('dialog\[open\]'\)\)return false;/);
 assert.ok(welcome.indexOf('await playOpening(engine)')<welcome.indexOf('dialog.showModal()'),'the opening plays before the card');
 // Reading the intro keeps the train at the platform (it says to step off); putting it off lets it go.
 assert.match(welcome,/if\(reason==='story\.close'\)\{introPending=false;engine\.startMoving\?\.\(\);\}/);
 assert.match(welcome,/outcome\?\.storyCompleted==='intro'\)\{introPending=false;engine\.setHeld\?\.\(\);/);
 // The opening is visual only: it rolls in toward the saved station and stops there, held.
 assert.match(engine,/endOpening\(immediate=false\)\{if\(state\.stop\.phase!=='cruise'\)return;state\.stop=immediate\?\{phase:'stop',t:0,held:true\}:\{phase:'arrive',t:0,held:true\}/);
 assert.doesNotMatch(engine.slice(engine.indexOf('beginOpening()'),engine.indexOf('endOpening(')),/notify\(/);
 assert.match(opening,/skip\?\.addEventListener\('click',\(\)=>finish\(true\)/);
 assert.match(engine,/startMoving\(\)\{\n  const s=gateway\.snapshot\.state;if\(!s\.displayName\|\|/);
 // The intro is only started where the server accepts it, never over a timer or before the welcome.
 assert.match(story,/!engine\?\.timer\?\.active&&!engine\?\.welcomePending&&introPlace\(s\)&&!document\.querySelector\('dialog\[open\]'\)/);
 assert.match(story,/if\(kind==='intro'&&!introPlace\(s\)\)throw new Error/);
 assert.match(html,/id="welcome-focus"[^>]*>集中して始める</);assert.match(html,/id="welcome-watch"[^>]*>しばらく眺める</);
 // The intro keeps its three pages (page turns are fixed at three) and names the real buttons.
 const intro=JSON.parse(scenario).intro;assert.equal(intro.length,3);
 assert.match(JSON.stringify(intro),/「下車する」/);assert.match(JSON.stringify(intro),/ひと箱だけ/);
 assert.doesNotMatch(narrative,/航路図/,'hints use the button name 路線図');
});
