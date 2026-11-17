import {db,owner,response} from '../../../lib/server';
import {nostrIdentity,nostrAction} from '../../../lib/nostr-talent.mjs';
export const dynamic='force-dynamic';
export async function GET(){const user=await owner();if(!user)return response({error:'Sign in to connect Nostr.'},401);return response(await nostrIdentity(db(),user))}
export async function POST(request:Request){const origin=new URL(request.url).origin;if(request.headers.get('origin')!==origin)return response({error:'Invalid origin.'},403);const user=await owner();if(!user)return response({error:'Sign in to connect Nostr.'},401);try{const raw=await request.text();if(raw.length>40000)return response({error:'The Nostr request is too large.'},413);return response(await nostrAction(db(),user,origin,JSON.parse(raw)))}catch(error:any){return response({error:error.code?error.message:'The Nostr request could not be completed.'},error.code||503)}}
