import { db, env, response } from '../../../lib/server';
import { createCheckout, validCheckoutId } from '../../../lib/flash-checkout.mjs';
export const dynamic='force-dynamic';
// Best-effort burst protection per Worker isolate; no client IP is stored or sent to Flash.
const bursts = new Map<string,{until:number;count:number}>();
export async function POST(request:Request) {
  if(request.headers.get('origin')!==new URL(request.url).origin)return response({error:'Invalid origin.'},403);
  let input;
  try {const raw=await request.text();if(raw.length>1000)return response({error:'Invalid request.'},400);input=JSON.parse(raw);}catch{return response({error:'Invalid request.'},400)}
  if(!validCheckoutId(input?.id)||typeof input.slug!=='string'||input.slug.length>100||typeof input.offerId!=='string'||input.offerId.length>160)return response({error:'Invalid payment request.'},400);
  const ip=request.headers.get('cf-connecting-ip')||'local',now=Date.now(),counter=bursts.get(ip);
  if(counter&&counter.until>now){if(++counter.count>20)return response({error:'Too many requests. Try again in a minute.'},429)}else{if(bursts.size>1000)bursts.clear();bursts.set(ip,{until:now+60000,count:1})}
  const row=await db().prepare('SELECT id,slug,published FROM portfolios WHERE slug=? AND published IS NOT NULL').bind(input.slug).first<any>();
  if(!row)return response({error:'This offer is no longer published.'},404);
  try {const result=await createCheckout(env,input,{...row,profile:JSON.parse(row.published)});return response(result,result.code||200)}catch{return response({error:'The payment service could not complete the request. Retry this same request before starting another.'},503)}
}
