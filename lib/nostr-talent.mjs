import {verifyEvent} from 'nostr-tools/pure';
import {npubEncode} from 'nostr-tools/nip19';
import {ensureWorkSchema} from './work-schema.mjs';
import {WorkError} from './opportunities.mjs';
import {offerPrice} from './checkout-contract.mjs';

const canonical='https://taste-folio.violakorir24.workers.dev';
const validKey=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const safe=value=>String(value||'').replace(/[\\`*_{}\[\]<>]/g,'\\$&');
const authContent='Connect this Nostr identity to my Taste account. This does not authorise a payment or publish a post.';
export function listingTemplate(row){
 const p=JSON.parse(row.published),url=canonical+'/p/'+row.slug;
 const offers=Array.isArray(p.offers)?p.offers:p.service?[{title:p.service,price:p.rate,description:p.bio.slice(0,600)}]:[];
 const lines=[safe(p.name),safe(p.headline),safe(p.bio),'','Skills: '+(p.skills||[]).map(safe).join(', '),'','Offers:',...offers.map(o=>safe(o.title)+' — '+safe(offerPrice(o))+'\n'+safe(o.description)),'','Work evidence:',...(p.projects||[]).map(w=>safe(w.title)+(w.link?'\n'+w.link:'')),...(p.credentials||[]).filter(c=>c.link).map(c=>safe(c.name)+' ('+safe(c.issuer)+')\n'+c.link),'',url,'','Claims are supplied by the professional. Evidence links are not independent verification.'];
 return {kind:30402,content:lines.join('\n'),tags:[['d','taste-folio:'+row.slug],['title',p.headline],['summary',p.bio.slice(0,160)],['location',p.location||''],['published_at',String(Math.floor(Date.parse(row.published_at)/1000))],['status','active'],['t','talent'],['t','taste-folio'],...(p.skills||[]).slice(0,8).map(s=>['t',s.toLowerCase()]),['r',url]]};
}
export function validSignedEvent(event,pubkey,template){
 try{return validKey(pubkey)&&event?.pubkey===pubkey&&event.kind===template.kind&&event.content===template.content&&JSON.stringify(event.tags)===JSON.stringify(template.tags)&&Math.abs(event.created_at-Math.floor(Date.now()/1000))<=300&&verifyEvent(event)}catch{return false}
}
export async function nostrIdentity(db,userId){await ensureWorkSchema(db);const row=await db.prepare('SELECT pubkey,listing_json FROM nostr_identities WHERE user_id=?').bind(userId).first();return {identity:row?{pubkey:row.pubkey,npub:npubEncode(row.pubkey),hasSignedListing:!!row.listing_json}:null}}
export async function nostrAction(db,userId,origin,input){
 await ensureWorkSchema(db);const action=input?.action;
 if(action==='challenge'){
  if(!validKey(input.pubkey))throw new WorkError('The signer did not provide a valid public key.');
  await db.prepare('DELETE FROM nostr_challenges WHERE expires_at<? OR (user_id=? AND used=0)').bind(Date.now(),userId).run();
  const id=crypto.randomUUID(),nonce=crypto.randomUUID(),tags=[['u',origin+'/api/nostr'],['method','POST'],['challenge',nonce]];
  await db.prepare('INSERT INTO nostr_challenges(id,user_id,pubkey,nonce,expires_at) VALUES(?,?,?,?,?)').bind(id,userId,input.pubkey,nonce,Date.now()+300000).run();
  return {challengeId:id,event:{kind:27235,created_at:Math.floor(Date.now()/1000),content:authContent,tags}};
 }
 if(action==='connect'){
  const challenge=await db.prepare('SELECT * FROM nostr_challenges WHERE id=? AND user_id=? AND used=0 AND expires_at>?').bind(input.challengeId||'',userId,Date.now()).first();
  if(!challenge||!validSignedEvent(input.event,challenge.pubkey,{kind:27235,content:authContent,tags:[['u',origin+'/api/nostr'],['method','POST'],['challenge',challenge.nonce]]}))throw new WorkError('The identity signature is invalid or the challenge expired.');
  const consumed=await db.prepare('UPDATE nostr_challenges SET used=1 WHERE id=? AND user_id=? AND used=0 AND expires_at>?').bind(challenge.id,userId,Date.now()).run();if(consumed.meta.changes!==1)throw new WorkError('This connection challenge has already been used.',409);
  try{await db.prepare('INSERT INTO nostr_identities(user_id,pubkey,connected_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET pubkey=excluded.pubkey,listing_json=NULL,connected_at=excluded.connected_at').bind(userId,challenge.pubkey,new Date().toISOString()).run()}catch{throw new WorkError('That Nostr identity is already connected to another Taste account.',409)}
  return nostrIdentity(db,userId);
 }
 if(action==='disconnect'){await db.prepare('DELETE FROM nostr_identities WHERE user_id=?').bind(userId).run();return {identity:null}}
 const identity=await db.prepare('SELECT pubkey FROM nostr_identities WHERE user_id=?').bind(userId).first();if(!identity)throw new WorkError('Connect your Nostr identity first.');
 const row=await db.prepare('SELECT slug,published,published_at FROM portfolios WHERE owner_id=? AND published IS NOT NULL').bind(userId).first();if(!row)throw new WorkError('Publish your pitch before sharing a talent listing.');
 const template=listingTemplate(row);
 if(action==='preview')return {event:{...template,pubkey:identity.pubkey,created_at:Math.floor(Date.now()/1000)}};
 if(action==='sign_listing'){
  if(!validSignedEvent(input.event,identity.pubkey,template))throw new WorkError('The signed listing does not match your published pitch. Refresh its preview.');
  await db.prepare('UPDATE nostr_identities SET listing_json=? WHERE user_id=? AND pubkey=?').bind(JSON.stringify(input.event),userId,identity.pubkey).run();
  return {event:input.event};
 }
 throw new WorkError('Unknown Nostr action.');
}
