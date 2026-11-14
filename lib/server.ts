import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../app/chatgpt-auth';
export function db(){if(!env.DB)throw new Error('Database unavailable');return env.DB}
export async function owner(){return (await getChatGPTUser())?.userId||null}
export function sameOrigin(req:Request){let origin=req.headers.get('origin');return !origin||origin===new URL(req.url).origin}
export function response(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store'}})}
export { env };
