import {npubEncode} from 'nostr-tools/nip19';
import {db} from './server';
import {ensureWorkSchema} from './work-schema.mjs';
function pitch(row:any){return {id:row.id,slug:row.slug,profile:JSON.parse(row.published),publishedAt:row.published_at,...(row.pubkey?{nostrPubkey:row.pubkey,nostrNpub:npubEncode(row.pubkey)}:{})}}
const columns='p.id,p.slug,p.published,p.published_at,n.pubkey';
export async function publicPitches(){await ensureWorkSchema(db());const rows=await db().prepare(`SELECT ${columns} FROM portfolios p LEFT JOIN nostr_identities n ON n.user_id=p.owner_id WHERE p.published IS NOT NULL ORDER BY p.published_at DESC LIMIT 100`).all<any>();return rows.results.map(pitch)}
export async function publicPitch(slug:string){await ensureWorkSchema(db());const row=await db().prepare(`SELECT ${columns} FROM portfolios p LEFT JOIN nostr_identities n ON n.user_id=p.owner_id WHERE p.slug=? AND p.published IS NOT NULL`).bind(slug).first<any>();return row?pitch(row):null}
