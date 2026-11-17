import test from 'node:test';
import assert from 'node:assert/strict';
import {finalizeEvent,getPublicKey} from 'nostr-tools/pure';
import {opportunitySchema,workView} from '../lib/opportunities.mjs';
import {listingTemplate,validSignedEvent} from '../lib/nostr-talent.mjs';

const deadline=new Date(Date.now()+86400000).toISOString().slice(0,10);
const brief={buyerName:'Buyer',title:'Office plant plan',outcome:'Deliver a plan',criteria:'Five plants with care notes',location:'Nairobi',skills:['Plant styling'],deadline,budgetUsd:'60.00',milestones:[{title:'Consultation',criteria:'Booking confirmed',usdPrice:'20',kind:'upfront'},{title:'Plan',criteria:'Five plants with care notes',usdPrice:'40',kind:'delivery'}]};
test('a brief requires a bounded budget, clear acceptance and matching milestone amounts',()=>{
 assert(opportunitySchema.safeParse(brief).success);
 assert(!opportunitySchema.safeParse({...brief,budgetUsd:'61'}).success);
 assert(!opportunitySchema.safeParse({...brief,criteria:''}).success);
 assert(!opportunitySchema.safeParse({...brief,milestones:Array(4).fill(brief.milestones[0])}).success);
 assert(!opportunitySchema.safeParse({...brief,deadline:'2000-01-01'}).success);
});
test('public opportunity views never expose applications, delivery or payment references',()=>{
 const p={...brief,id:'job',buyerId:'buyer',sellerId:'seller',status:'active',agreement:'accepted',applications:[{sellerId:'seller',proposal:'PRIVATE APPLICATION',status:'applied'},{sellerId:'other',proposal:'OTHER PRIVATE APPLICATION'}],milestones:[{id:'step',title:'Plan',criteria:'Five plants',usdCents:4000,kind:'delivery',delivery:{note:'PRIVATE DELIVERY'},checkoutId:'PRIVATE PAYMENT',payment:'unpaid'}]};
 for(const user of [null,'stranger','other']){const view=workView(p,user);assert(!JSON.stringify(view.milestones).includes('PRIVATE'));assert.equal(view.applications,undefined)}
 assert.equal(workView(p,'buyer').applications.length,2);
 assert(JSON.stringify(workView(p,'seller').milestones).includes('PRIVATE DELIVERY'));
 assert(!JSON.stringify(workView(p,'seller')).includes('OTHER PRIVATE APPLICATION'));
 assert.equal(workView({...p,sellerId:null},null).role,'visitor');
});
test('Nostr listing includes only published talent information and verifies a matching key signature',()=>{
 const p={name:'Seller',headline:'Plant stylist',bio:'I create plant plans',skills:['Plant styling'],offers:[{title:'Consultation',description:'Office assessment',usdPrice:'20'}],projects:[{title:'Office planting',link:'https://example.test/proof'}],credentials:[],email:'private@example.test',phone:'254700000000',applications:[{note:'PRIVATE APPLICATION'}],delivery:'PRIVATE DELIVERY'};
 const template=listingTemplate({slug:'seller',published:JSON.stringify(p),published_at:new Date().toISOString()});
 assert.equal(template.kind,30402);assert(template.content.includes('https://example.test/proof'));assert(!template.content.includes('PRIVATE'));assert(!template.content.includes('private@example.test'));assert(!template.content.includes('254700000000'));
 const key=new Uint8Array(32).fill(3),pubkey=getPublicKey(key),signed=finalizeEvent({...template,created_at:Math.floor(Date.now()/1000)},key);
 assert(validSignedEvent(signed,pubkey,template));assert(!validSignedEvent({...signed,content:'changed'},pubkey,template));assert(!validSignedEvent(signed,'a'.repeat(64),template));
});
