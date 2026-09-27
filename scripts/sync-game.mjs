import {cp,writeFile,readFile} from 'node:fs/promises';
// public/ is generated output — edit files under src/ or content/ only, then
// run this script. Keep the module list in sync with the import graph.

// Generated content modules are written before copying so public/game always
// carries the freshly generated scenario-content.js.
const data=JSON.parse(await readFile('content/conversations.json','utf8'));
await writeFile('src/server/content.js','// Generated from content/conversations.json\nexport default '+JSON.stringify(data)+';\n');
await writeFile('public/content/conversations.json',JSON.stringify(data));
await writeFile('public/content/catalog.json',JSON.stringify({topics:data.topics,people:data.npcs.map(({id,name,role,en,where,detail,coat,hat,world})=>({id,name,role,en,where,detail,coat,hat,world}))}));
await writeFile('src/game/scenario-content.js','// Generated from content/scenario.json\nexport default '+JSON.stringify(JSON.parse(await readFile('content/scenario.json','utf8')))+';\n');

const CLIENT=[
 'anim-utils.js','pixel.js','worlds.js','sprites.js','cityscape.js','station-scene.js','scene.js',
 'engine.js','cabin.js','passengers.js','scenery.js','place-scenes.js',
 'kowloon-moments.js','scrap-moments.js','pelagic-moments.js','gorge-moments.js','jade-moments.js','relay-moments.js','frontier-scenes.js','frontier-moments.js',
 'focus-clock.js','arrival-bell.js','timer-ui.js','timer-tasks-ui.js','journal-ui.js','music.js','music-ui.js',
 'main.js','gateway.js','portraits.js','talk.js','journey-ui.js','guest.js','story-ui.js','reset-ui.js','operation-id.js',
 'commerce-ui.js','chapter-two-ui.js','chapter-three-ui.js','chapter-four-ui.js','sidequests-ui.js','sidequest-scenes.js',
 'scene.css','journey.css'
];
const GAME=[
 'rules.js','commerce.js','aftercare.js','narrative.js','scenario-content.js',
 'chapter-two.js','chapter-three.js','chapter-four.js','sidequests.js','sidequests-content.js'
];
for(const file of CLIENT)await cp('src/client/'+file,'public/client/'+file);
for(const file of GAME)await cp('src/game/'+file,'public/game/'+file);
