import html from '../src/client/index.template.html?raw';
import {chatGPTSignInPath, chatGPTSignOutPath} from './chatgpt-auth';
export const dynamic = 'force-dynamic';
export function GET() {
 const body = html.replace('href="/signin-with-chatgpt"', `target="_top" href="${chatGPTSignInPath('/') }"`).replace('href="/signout-with-chatgpt"', `target="_top" href="${chatGPTSignOutPath('/') }"`);
 return new Response(body, {headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'}});
}
