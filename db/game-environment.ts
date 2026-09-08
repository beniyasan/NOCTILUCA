import {env} from 'cloudflare:workers';
export function gameEnvironment() {
 const bindings=env as unknown as {DB: unknown; IDENTITY_KEY: string};
 return {DB:bindings.DB, IDENTITY_KEY:bindings.IDENTITY_KEY};
}
