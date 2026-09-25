import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('lolipop edition is isolated from ChatGPT Sites and uses the Supabase commit boundary', async () => {
  const [gateway, api, migration, build] = await Promise.all([
    readFile('lolipop/client/gateway.js', 'utf8'),
    readFile('supabase/functions/api/index.ts', 'utf8'),
    readFile('supabase/migrations/0001_lolipop_initial.sql', 'utf8'),
    readFile('scripts/build-lolipop.mjs', 'utf8'),
  ]);
  assert.match(gateway, /auth\/v1\/otp/);
  assert.match(gateway, /auth\/v1\/authorize\?provider=google/);
  assert.doesNotMatch(gateway, /oai-authenticated-user/);
  assert.match(api, /commit_journey_command/);
  assert.match(api, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(migration, /security definer/);
  assert.match(migration, /for update/);
  assert.match(build, /dist-lolipop/);
});
