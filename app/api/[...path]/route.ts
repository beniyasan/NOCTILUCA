import {headers} from 'next/headers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {handleApi} from '../../../src/server/api.js';
import {gameEnvironment} from '../../../db/game-environment';
export const dynamic = 'force-dynamic';
async function dispatch(request: Request) {
 const user = await getChatGPTUser();
 const identity = user ? (await headers()).get('oai-authenticated-user-id') : null;
 if (user && !identity) return Response.json({error:{code:'IDENTITY_UNAVAILABLE',message:'ログイン情報を確認できません。もう一度ログインしてください。'}},{status:503,headers:{'Cache-Control':'no-store'}});
 return handleApi(request,gameEnvironment(),identity);
}
export const GET=dispatch;
export const POST=dispatch;
