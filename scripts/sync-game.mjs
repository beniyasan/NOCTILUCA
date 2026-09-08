import {cp,writeFile,readFile} from 'node:fs/promises';
await cp('src/client/place-scenes.js','public/client/place-scenes.js');
await cp('src/client/relay-moments.js','public/client/relay-moments.js');
await cp('src/client/jade-moments.js','public/client/jade-moments.js');
await cp('src/client/gorge-moments.js','public/client/gorge-moments.js');
await cp('src/client/pelagic-moments.js','public/client/pelagic-moments.js');
await cp('src/client/scrap-moments.js','public/client/scrap-moments.js');
await cp('src/client/kowloon-moments.js','public/client/kowloon-moments.js');
for(const file of ['engine.js','scenery.js','focus-clock.js','arrival-bell.js','timer-ui.js','music.js','music-ui.js','scene.css','journey.css','main.js','gateway.js','talk.js','journey-ui.js','guest.js','commerce-ui.js'])await cp('src/client/'+file,'public/client/'+file);
await cp('src/game/rules.js','public/game/rules.js');
await cp('src/game/commerce.js','public/game/commerce.js');
const data=JSON.parse(await readFile('content/conversations.json','utf8'));
await writeFile('src/server/content.js','// Generated from content/conversations.json\nexport default '+JSON.stringify(data)+';\n');
await writeFile('public/content/conversations.json',JSON.stringify(data));
await writeFile('public/content/catalog.json',JSON.stringify({topics:data.topics,people:data.npcs.map(({id,name,role,en,where,detail,coat,hat,world})=>({id,name,role,en,where,detail,coat,hat,world}))}));

await cp('src/game/aftercare.js','public/game/aftercare.js');

await writeFile('src/game/scenario-content.js','// Generated from content/scenario.json\nexport default '+JSON.stringify(JSON.parse(await readFile('content/scenario.json','utf8')))+';\n');
for(const file of ['narrative.js','scenario-content.js'])await cp('src/game/'+file,'public/game/'+file);
await cp('src/client/story-ui.js','public/client/story-ui.js');

await cp('src/client/operation-id.js','public/client/operation-id.js');

await cp('src/game/chapter-two.js','public/game/chapter-two.js');
await cp('src/client/chapter-two-ui.js','public/client/chapter-two-ui.js');

await cp('src/game/chapter-three.js','public/game/chapter-three.js');
await cp('src/client/chapter-three-ui.js','public/client/chapter-three-ui.js');

await cp('src/game/chapter-four.js','public/game/chapter-four.js');
await cp('src/client/chapter-four-ui.js','public/client/chapter-four-ui.js');

for(const file of ['sidequests.js','sidequests-content.js'])await cp('src/game/'+file,'public/game/'+file);
await cp('src/client/sidequests-ui.js','public/client/sidequests-ui.js');

await cp('src/client/sidequest-scenes.js','public/client/sidequest-scenes.js');

await cp('src/client/reset-ui.js','public/client/reset-ui.js');

await cp('src/client/timer-tasks-ui.js','public/client/timer-tasks-ui.js');
