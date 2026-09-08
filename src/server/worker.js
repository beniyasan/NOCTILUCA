/** Sites adapter. Enable ONLY behind the Sites identity gateway.
 * Official contract: /signin-with-chatgpt, /signout-with-chatgpt and
 * oai-authenticated-user-email (see docs/SITES_SETUP.md).
 * Arbitrary public Workers must not trust these headers.
 */
import {handleApi} from './api.js';
export function sitesIdentity(request,env){
  if(env.SITES_AUTH_TRUSTED!=='true'||!env.SITE_ORIGIN||new URL(request.url).origin!==env.SITE_ORIGIN)
    throw new Error('SITES_AUTH_NOT_CONFIGURED');
  const email=request.headers.get('oai-authenticated-user-email');
  if(!email)return null;
  if(email.length>320||!email.includes('@')||/[\r\n\u0000]/.test(email))throw new Error('INVALID_IDENTITY');
  return email;
}
export default {
  async fetch(request,env){
    if(new URL(request.url).pathname.startsWith('/api/')){
      let identity;try{identity=sitesIdentity(request,env);}catch{
        return Response.json({error:{code:'SITES_AUTH_NOT_CONFIGURED',message:'Sitesの認証接続はまだ有効になっていません。'}},{status:503,headers:{'Cache-Control':'no-store'}});
      }
      return handleApi(request,env,identity);
    }
    // Bind to the static assets of the actual Sites starter when importing this project.
    // This ASSETS binding is a reference adapter, not an assumed Sites SDK contract.
    if(env.ASSETS?.fetch)return env.ASSETS.fetch(request);
    return new Response('Static asset adapter not connected',{status:503});
  }
};
