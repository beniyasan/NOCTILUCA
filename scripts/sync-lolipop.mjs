import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

// Keep the independent Supabase edition on the same authored rules/content,
// while keeping its deployable function tree self-contained.
await rm('supabase/functions/api/game', { recursive: true, force: true });
await mkdir('supabase/functions/api/game', { recursive: true });
await cp('src/game', 'supabase/functions/api/game', { recursive: true });
const content = await readFile('src/server/content.js', 'utf8');
await writeFile('supabase/functions/api/game/content.generated.js', content);
await writeFile('supabase/functions/api/game/content.js', "export { default } from './content.generated.js';\n");
