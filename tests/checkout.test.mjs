import test from 'node:test';
import assert from 'node:assert/strict';
import bolt11 from 'bolt11';
import {createCheckout,getCheckout,validateInvoice} from '../lib/flash-checkout.mjs';
import {usdCents,flashUsername,checkoutEnabled} from '../lib/checkout-contract.mjs';

const id='12345678-1234-4123-8123-123456789abc';
function bucket(){const data=new Map();let sequence=0;return {async get(key){const row=data.get(key);return row?{etag:row.etag,json:async()=>JSON.parse(row.value)}:null},async put(key,value,options){const prior=data.get(key),condition=options?.onlyIf;if(condition?.etagDoesNotMatch==='*'&&prior)return null;if(condition?.etagMatches&&condition.etagMatches!==prior?.etag)return null;const etag=String(++sequence);data.set(key,{value,etag});return {etag}}}}
function invoice(options={}){return bolt11.sign(bolt11.encode({satoshis:1000,timestamp:Math.floor(Date.now()/1000),tags:[{tagName:'payment_hash',data:'a'.repeat(64)},{tagName:'description',data:'Taste Folio fixture'},{tagName:'expire_time',data:300}],...options}),'1'.repeat(64)).paymentRequest}
const snapshot={id:'portfolio',slug:'pilot',profile:{name:'Pilot',lightning:'boodaboo@flashapp.me',offers:[{id:'offer',title:'Consultation',description:'One consultation',price:'',usdPrice:'25.50'}]}};
const input={id,slug:'pilot',offerId:'offer',amount:1,recipientWalletId:'attacker'};
function env(){return {FLASH_API_URL:'https://api.flashapp.me/graphql',FLASH_API_KEY:'fk_fixture_only',BUCKET:bucket()}}
test('USD pricing uses cents and accepts only Flash receiving addresses',()=>{
 assert.equal(usdCents('25.50'),2550);assert.equal(usdCents('0.01'),1);for(const value of ['1e2','-1','0','1.001','10000.01','NaN'])assert.equal(usdCents(value),null);
 assert.equal(flashUsername('boodaboo@flashapp.me'),'boodaboo');assert.equal(flashUsername('boodaboo@flashapp.me.attacker.test'),null);
 assert(checkoutEnabled(snapshot.profile,snapshot.profile.offers[0]));
});
test('invoice validation verifies checksum/signature recovery, amount, network and expiry',()=>{
 const request=invoice();assert.equal(validateInvoice({paymentRequest:request,satoshis:null}).millisatoshis,'1000000');
 assert.throws(()=>validateInvoice({paymentRequest:request,satoshis:999}));
 assert.throws(()=>validateInvoice({paymentRequest:request.slice(0,-1)+(request.endsWith('q')?'p':'q'),satoshis:null}));
 assert.throws(()=>validateInvoice({paymentRequest:invoice({timestamp:Math.floor(Date.now()/1000)-1000}),satoshis:null}));
 assert.throws(()=>validateInvoice({paymentRequest:invoice({network:{bech32:'tb',pubKeyHash:111,scriptHash:196,validWitnessVersions:[0,1]}}),satoshis:null}));
});
test('checkout binds amount and recipient to the published snapshot and reuses its invoice',async()=>{
 const configured=env();let creates=0;const request=invoice();
 const fetcher=async(_url,init)=>{const {query,variables}=JSON.parse(init.body);assert.equal(init.redirect,'manual');if(query.startsWith('query TasteFolioCheckoutRecipient')){assert.equal(variables.username,'boodaboo');return Response.json({data:{recipient:{id:'cash-wallet',walletCurrency:'USD'},globals:{network:'mainnet'}}})}creates++;assert.equal(variables.input.amount,2550);assert.equal(variables.input.recipientWalletId,'cash-wallet');return Response.json({data:{lnUsdInvoiceCreateOnBehalfOfRecipient:{errors:[],invoice:{paymentRequest:request,satoshis:null}}}})};
 const first=await createCheckout(configured,input,snapshot,fetcher);assert.equal(first.checkout.stage,'ready');assert.equal(first.checkout.usdCents,2550);assert.equal(first.checkout.recipient,'boodaboo@flashapp.me');assert(!JSON.stringify(first).includes('fk_fixture_only'));
 assert.equal((await createCheckout(configured,input,snapshot,fetcher)).checkout.paymentRequest,request);assert.equal(creates,1);
 const changed=structuredClone(snapshot);changed.profile.offers[0].usdPrice='1';assert.equal((await createCheckout(configured,input,changed,fetcher)).code,409);
});
test('provider errors never become paid; PAID is confirmed by Flash and cannot regress',async()=>{
 const configured=env(),request=invoice();
 await createCheckout(configured,input,snapshot,async(_url,init)=>JSON.parse(init.body).query.startsWith('query TasteFolioCheckoutRecipient')?Response.json({data:{recipient:{id:'cash-wallet',walletCurrency:'USD'},globals:{network:'mainnet'}}}):Response.json({data:{lnUsdInvoiceCreateOnBehalfOfRecipient:{invoice:{paymentRequest:request,satoshis:null},errors:[]}}}));
 const failure=await getCheckout(configured,id,async()=>new Response('failure',{status:500}));assert(failure.statusUnavailable);assert.equal(failure.checkout.paymentStatus,'PENDING');
 const paid=await getCheckout(configured,id,async()=>Response.json({data:{lnInvoicePaymentStatus:{status:'PAID',errors:[]}}}));assert.equal(paid.checkout.paymentStatus,'PAID');
 assert.equal((await getCheckout(configured,id,async()=>{throw new Error('must not downgrade paid')})).checkout.paymentStatus,'PAID');
});
test('an uncertain creation is saved and is never automatically retried',async()=>{
 const configured=env();let creates=0;const fetcher=async(_url,init)=>{if(JSON.parse(init.body).query.startsWith('query TasteFolioCheckoutRecipient'))return Response.json({data:{recipient:{id:'cash-wallet',walletCurrency:'USD'},globals:{network:'mainnet'}}});creates++;throw new DOMException('timeout','TimeoutError')};
 assert.equal((await createCheckout(configured,input,snapshot,fetcher)).checkout.stage,'failed');assert.equal((await createCheckout(configured,input,snapshot,fetcher)).checkout.stage,'failed');assert.equal(creates,1);
});
