import { Miniflare, createFetchMock } from 'miniflare';
import { unstable_getMiniflareWorkerOptions } from 'wrangler';
import { dirname,resolve } from 'node:path';
import { readFileSync,readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import bolt11 from 'bolt11';
import {finalizeEvent,getPublicKey} from 'nostr-tools/pure';
const checkoutInvoice=bolt11.sign(bolt11.encode({satoshis:1000,timestamp:Math.floor(Date.now()/1000),tags:[{tagName:'payment_hash',data:'b'.repeat(64)},{tagName:'description',data:'Checkout fixture'},{tagName:'expire_time',data:300}]}),'1'.repeat(64)).paymentRequest;
const fetchMock=createFetchMock();fetchMock.disableNetConnect();
const authPool=fetchMock.get('https://test-project.supabase.co');
for(const [token,id,email] of [['qa-owner','qa-portfolio-owner','qa@example.test'],['qa-other','qa-other','other@example.test'],['qa-legacy','qa-legacy','legacy@example.test'],['qa-stranger','qa-stranger','stranger@example.test']]) authPool.intercept({path:'/auth/v1/user',method:'GET',headers:{authorization:'Bearer '+token}}).reply(200,{id,email}).persist();
authPool.intercept({path:'/auth/v1/token?grant_type=password',method:'POST'}).reply(200,{access_token:'qa-owner',refresh_token:'qa-refresh',expires_in:3600}).persist();
const flashPool=fetchMock.get('https://api.flashapp.me');
flashPool.intercept({path:'/graphql',method:'POST',headers:{'x-api-key':'fk_integration_fixture'}}).reply(200,{data:{me:{defaultAccount:{wallets:[{walletCurrency:'BTC',id:'private-fixture-wallet'}]}}}});
// Miniflare passes streaming request bodies to Undici. Ordered one-shot replies
// cover the connection, recipient lookup and creation; the status reply persists.
for (const [operation,data] of [
 ['recipient',{me:{defaultAccount:{wallets:[{id:'pilot-btc',walletCurrency:'BTC'}]}},recipient:{id:'pilot-btc',walletCurrency:'BTC'},globals:{network:'mainnet'}}],
 ['create',{lnInvoiceCreate:{errors:[],invoice:{paymentRequest:'lnbc210n1fixture',satoshis:21}}}],
 ['status',{lnInvoicePaymentStatus:{errors:[],status:'PENDING'}}],
 ['usd-recipient',{me:{defaultAccount:{wallets:[{id:'pilot-usd',walletCurrency:'USD'}]}},recipient:{id:'pilot-usd',walletCurrency:'USD'},globals:{network:'mainnet'}}],
 ['usd-create',{lnUsdInvoiceCreateOnBehalfOfRecipient:{errors:[],invoice:{paymentRequest:'lnbc10u1fixture',satoshis:null}}}],
 ['usd-status',{lnInvoicePaymentStatus:{errors:[],status:'PENDING'}}],
]) {
 const mock=flashPool.intercept({path:'/graphql',method:'POST',headers:{'x-api-key':'fk_integration_fixture'}}).reply(200,{data});
 if(operation==='status')mock.times(2);
 if(operation==='usd-status')mock.times(2);
}
flashPool.intercept({path:'/graphql',method:'POST',headers:{'x-api-key':'fk_integration_fixture'}}).reply(200,{data:{recipient:{id:'checkout-usd',walletCurrency:'USD'},globals:{network:'mainnet'}}});
flashPool.intercept({path:'/graphql',method:'POST',headers:{'x-api-key':'fk_integration_fixture'}}).reply(200,{data:{lnUsdInvoiceCreateOnBehalfOfRecipient:{errors:[],invoice:{paymentRequest:checkoutInvoice,satoshis:null}}}});
flashPool.intercept({path:'/graphql',method:'POST',headers:{'x-api-key':'fk_integration_fixture'}}).reply(200,{data:{lnInvoicePaymentStatus:{errors:[],status:'PAID'}}});
// Verify the professional's Flash account before accepting paid work.
flashPool.intercept({path:'/graphql',method:'POST',headers:{'x-api-key':'fk_integration_fixture'}}).reply(200,{data:{recipient:{id:'work-cash-wallet',walletCurrency:'USD'},globals:{network:'mainnet'}}});
// Milestone invoices follow the existing offer checkout checks.
for(let milestone=0;milestone<2;milestone++){
 flashPool.intercept({path:'/graphql',method:'POST',headers:{'x-api-key':'fk_integration_fixture'}}).reply(200,{data:{recipient:{id:'work-cash-wallet',walletCurrency:'USD'},globals:{network:'mainnet'}}});
 const invoice=bolt11.sign(bolt11.encode({satoshis:1000,timestamp:Math.floor(Date.now()/1000),tags:[{tagName:'payment_hash',data:(milestone?'d':'c').repeat(64)},{tagName:'description',data:'Milestone fixture'},{tagName:'expire_time',data:300}]}),'1'.repeat(64)).paymentRequest;
 flashPool.intercept({path:'/graphql',method:'POST',headers:{'x-api-key':'fk_integration_fixture'}}).reply(200,{data:{lnUsdInvoiceCreateOnBehalfOfRecipient:{errors:[],invoice:{paymentRequest:invoice,satoshis:null}}}});
 if(milestone===0)flashPool.intercept({path:'/graphql',method:'POST',headers:{'x-api-key':'fk_integration_fixture'}}).reply(200,{data:{lnInvoicePaymentStatus:{errors:[],status:'PENDING'}}});
 flashPool.intercept({path:'/graphql',method:'POST',headers:{'x-api-key':'fk_integration_fixture'}}).reply(200,{data:{lnInvoicePaymentStatus:{errors:[],status:'PAID'}}});
}
const options=unstable_getMiniflareWorkerOptions('dist/server/wrangler.json');
const rootDir=dirname(options.main);const files=readdirSync(rootDir,{recursive:true}).filter(f=>/\.m?js$/.test(f)&&f!=='index.js');const modules=['index.js',...files].map(f=>({type:'ESModule',path:resolve(rootDir,f)}));const mf=new Miniflare({...options.workerOptions,modules,modulesRoot:rootDir,cf:false,fetchMock,bindings:{...options.workerOptions.bindings,SUPABASE_URL:'https://test-project.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',FLASH_API_URL:'https://api.flashapp.me/graphql',FLASH_API_KEY:'fk_integration_fixture'}});
try{
 const db=await mf.getD1Database('DB');for(const sql of readFileSync('drizzle/0000_fat_daredevil.sql','utf8').split('--> statement-breakpoint').filter(s=>s.trim()))await db.prepare(sql).run();
 const root='https://ownwork.test';
 const loginPage=await mf.dispatchFetch(root+'/auth/sign-in');assert.equal(loginPage.status,200);assert((await loginPage.text()).includes('Welcome back'));const csrf=loginPage.headers.getSetCookie().find(v=>v.startsWith('__Host-tf-csrf=')).split(';')[0];
 const login=await mf.dispatchFetch(root+'/auth/sign-in',{method:'POST',redirect:'manual',headers:{Origin:root,Cookie:csrf,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrf:decodeURIComponent(csrf.split('=')[1]),email:'qa@example.test',password:'qa test password',return_to:'/edit'}).toString()});assert.equal(login.status,303);assert.equal(login.headers.get('location'),'/edit');assert(login.headers.getSetCookie().some(v=>v.startsWith('__Host-tf-access=qa-owner;')));
 const identity={Cookie:'__Host-tf-access=qa-owner'};
 const otherIdentity={Cookie:'__Host-tf-access=qa-other'};
 async function call(path,method='GET',body,headers={}){const r=await mf.dispatchFetch(root+path,{method,headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});let value;try{value=await r.json()}catch{}return {r,value}}
 // The payment diagnostic is authenticated, requires an exact Origin and is never cached.
 assert.equal((await call('/api/flash/connection','POST',undefined,{Origin:root})).r.status,401);
 assert.equal((await call('/api/flash/connection','POST',undefined,{Origin:root,'oai-authenticated-user-id':'forged','oai-authenticated-user-email':'fake@example.test'})).r.status,401);
 assert.equal((await call('/api/flash/connection','POST',undefined,identity)).r.status,403);
 assert.equal((await call('/api/flash/connection','POST',undefined,{...identity,Origin:'https://attacker.example'})).r.status,403);
 const flashCheck=await call('/api/flash/connection','POST',undefined,{...identity,Origin:root});
 assert.equal(flashCheck.r.status,200);assert.equal(flashCheck.value.status,'connected');assert(!JSON.stringify(flashCheck.value).includes('fixture'));
 assert.equal(flashCheck.r.headers.get('cache-control'),'private, no-store');
 const flashSettings=await mf.dispatchFetch(root+'/settings/flash',{headers:identity});
 assert.equal(flashSettings.status,200);assert((await flashSettings.text()).includes('Check connection'));
 let p={offers:[{id:'offer-1',title:'Office plant consultation',description:'Review light, choose plants and plan their placement.',price:'KSh 3,500'}],name:'QA Portfolio',headline:'Indoor plant stylist',location:'Nairobi',bio:'Test portfolio for the publishing journey.',skills:['Plant selection'],availability:['Freelance projects'],projects:[{id:'project-1',title:'Office styling',kind:'Personal project',context:'A test brief.',role:'Stylist',contribution:'Selected plants and planned placement.',outcome:'Documented a placement plan.',skills:['Plant selection'],image:'',link:'https://example.com/work'}],email:'qa@example.test'};
 assert.equal((await call('/api/portfolio','POST',{profile:p,action:'publish'})).r.status,401);
 assert.equal((await call('/api/portfolio','POST',{profile:p,action:'publish'},{'oai-authenticated-user-id':'forged','oai-authenticated-user-email':'fake@example.test'})).r.status,401);
 assert.equal((await call('/api/portfolio','POST',{profile:p,action:'publish'},{...identity,Origin:'https://other.example'})).r.status,403);
 assert.equal((await call('/api/portfolio','POST',{profile:{...p,projects:[]},action:'publish'},identity)).r.status,400);
 let draft=await call('/api/portfolio','POST',{profile:p,action:'draft'},identity);assert.equal(draft.r.status,200,JSON.stringify(draft.value));let slug=draft.value.slug;
 assert(!(await call('/api/profiles')).value.profiles.some(x=>x.slug===slug));
 assert.equal((await call('/api/portfolio','POST',{profile:p,action:'publish'},identity)).r.status,200);
 assert((await call('/api/profiles')).value.profiles.some(x=>x.slug===slug&&x.profile.name==='QA Portfolio'));
 let other=await call('/api/portfolio','GET',undefined,otherIdentity);assert.equal(other.value.portfolio,null);
 await call('/api/portfolio','POST',{profile:{...p,name:'Edited draft'},action:'draft'},identity);assert.equal((await call('/api/profiles')).value.profiles.find(x=>x.slug===slug).profile.name,'QA Portfolio');
 const beforeCard=await mf.dispatchFetch(root+'/p/'+slug+'/card');assert.equal(beforeCard.status,200);const beforeCardHtml=await beforeCard.text();assert(beforeCardHtml.includes('QA Portfolio'));assert(!beforeCardHtml.includes('Edited draft'));assert(beforeCardHtml.includes('Print 10 cards'));assert(beforeCardHtml.includes('Download QR as SVG'));
 const page=await mf.dispatchFetch(root+'/p/'+slug);assert.equal(page.status,200);assert((await page.text()).includes('Work behind the offer'));
 const file=new File([Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=','base64'))],'pixel.png',{type:'image/png'});let form=new FormData();form.append('file',file);const uploadRequest=new Request(root+'/api/upload',{method:'POST',headers:identity,body:form});let uploaded=await mf.dispatchFetch(root+'/api/upload',{method:'POST',headers:Object.fromEntries(uploadRequest.headers),body:await uploadRequest.arrayBuffer()});let uploadResult=await uploaded.json();assert.equal(uploaded.status,200,JSON.stringify(uploadResult));let {url}=uploadResult;assert.equal((await mf.dispatchFetch(root+url)).status,404);assert.equal((await mf.dispatchFetch(root+url,{headers:identity})).status,200);
 assert.equal((await call('/api/portfolio','POST',{profile:{...p,avatar:url},action:'publish'},otherIdentity)).r.status,400);
 p.projects[0].image=url;assert.equal((await call('/api/portfolio','POST',{profile:p,action:'publish'},identity)).r.status,200);assert.equal((await mf.dispatchFetch(root+url)).status,200);
 // Multi-photo drafts remain private until publish, with the same ownership checks as legacy photos.
 const newPhotos=[];
 for(let i=0;i<4;i++){
  const data=new FormData();data.append('file',file);
  const request=new Request(root+'/api/upload',{method:'POST',headers:identity,body:data});
  const result=await mf.dispatchFetch(request.url,{method:'POST',headers:Object.fromEntries(request.headers),body:await request.arrayBuffer()});
  assert.equal(result.status,200);
  newPhotos.push((await result.json()).url);
 }
 const gallery={...p,offers:[{...p.offers[0],images:newPhotos.slice(0,3)}],projects:[{...p.projects[0],images:[url,newPhotos[3]]}]};
 const saveGallery=(profile,action='draft',headers=identity)=>call('/api/portfolio','POST',{profile,action},headers);
 assert.equal((await saveGallery({...gallery,offers:[{...gallery.offers[0],images:newPhotos}]})).r.status,400);
 assert.equal((await saveGallery({...gallery,projects:[{...gallery.projects[0],images:[url,...newPhotos]}]})).r.status,400);
 assert.equal((await saveGallery({...gallery,projects:p.projects.map(project=>({...project,image:''}))},'draft',otherIdentity)).r.status,400);
 assert.equal((await saveGallery(gallery)).r.status,200);
 for(const photo of newPhotos)assert.equal((await mf.dispatchFetch(root+photo)).status,404);
 assert.equal((await saveGallery(gallery,'publish')).r.status,200);
 const galleryHtml=await (await mf.dispatchFetch(root+'/p/'+slug)).text();
 for(const photo of newPhotos){
  assert(galleryHtml.includes('src="'+photo+'"'));
  assert.equal((await mf.dispatchFetch(root+photo)).status,200);
 }
 assert.equal((await saveGallery({...gallery,offers:[{...gallery.offers[0],images:[]}],projects:[{...gallery.projects[0],images:[]}]},'publish')).r.status,200);
 for(const photo of [url,...newPhotos])assert.equal((await mf.dispatchFetch(root+photo)).status,404);
 await call('/api/portfolio','POST',{profile:p,action:'unpublish'},identity);assert(!(await call('/api/profiles')).value.profiles.some(x=>x.slug===slug));assert.equal((await mf.dispatchFetch(root+url)).status,404);
 assert.equal((await mf.dispatchFetch(root+'/p/'+slug+'/card')).status,404);
 assert.equal((await call('/api/portfolio','POST',{profile:{...p,acceptTips:true},action:'publish'},identity)).r.status,400);
 p={...p,acceptTips:true,lightning:'artist@example.test'};p.projects[0].link='https://example.com/performance';
 assert.equal((await call('/api/portfolio','POST',{profile:p,action:'publish'},identity)).r.status,200);
 const performerPage=await mf.dispatchFetch(root+'/p/'+slug);const performerHtml=await performerPage.text();assert(performerHtml.includes('Leave a tip'));assert(performerHtml.includes('Enquire'));assert(performerHtml.includes('Enquiry%3A%20Office%20plant%20consultation'));assert(performerHtml.includes('https://example.com/performance'));assert(performerHtml.includes('QR code &amp; business card'));
 const performerCard=await mf.dispatchFetch(root+'/p/'+slug+'/card');const cardHtml=await performerCard.text();assert.equal(performerCard.status,200);assert(cardHtml.includes('Offers · Tips · Enquiries'));assert(cardHtml.includes('https://taste-folio.violakorir24.workers.dev/p/'+slug));assert(!cardHtml.includes('artist@example.test'));
 assert.equal((await call('/api/portfolio','POST',{profile:{...p,projects:[{...p.projects[0],link:'javascript:alert(1)'}]},action:'draft'},identity)).r.status,400);
 assert(performerHtml.indexOf('What I can do for you')<performerHtml.indexOf('Work behind the offer'));
 const home=await mf.dispatchFetch(root+'/');const homeHtml=await home.text();assert(homeHtml.includes('Get paid'));assert(homeHtml.includes('Office plant consultation'));
 assert.equal((await call('/api/portfolio','POST',{profile:{...p,offers:[]},action:'publish'},identity)).r.status,400);
 assert.equal((await call('/api/portfolio','POST',{profile:{...p,offers:Array.from({length:4},(_,i)=>({...p.offers[0],id:'offer-'+i}))},action:'draft'},identity)).r.status,400);
 assert.equal((await call('/api/portfolio','POST',{profile:{...p,offers:[{...p.offers[0],description:''}]},action:'publish'},identity)).r.status,400);
 const legacy={...p,bio:'My legacy pitch. '+'Plant styling. '.repeat(50),offers:undefined,service:'Legacy plant offer',rate:'KSh 2,000',avatar:'',projects:p.projects.map(w=>({...w,image:''}))};
 const legacySaved=await call('/api/portfolio','POST',{profile:legacy,action:'publish'},{Cookie:'__Host-tf-access=qa-legacy'});assert.equal(legacySaved.r.status,200,JSON.stringify(legacySaved.value));
 const legacyPage=await mf.dispatchFetch(root+'/p/'+legacySaved.value.slug);const legacyHtml=await legacyPage.text();assert(legacyHtml.includes('Legacy plant offer'));assert(legacyHtml.includes('KSh 2,000'));
 assert.equal((await call('/api/portfolio','POST',{profile:{...legacy,offers:[]},action:'publish'},{Cookie:'__Host-tf-access=qa-legacy'})).r.status,400);
 // Only the fixed pilot owner can create or inspect a private invoice.
 assert.equal((await call('/api/flash/invoice-test','POST',{action:'create'},{Origin:root})).r.status,401);
 assert.equal((await call('/api/flash/invoice-test','POST',{action:'create'},identity)).r.status,403);
 assert.equal((await call('/api/flash/invoice-test','POST',{action:'create'},{...otherIdentity,Origin:root})).r.status,403);
 await db.prepare('UPDATE portfolios SET slug=? WHERE owner_id=?').bind('viola-korir-dcd4b1a1','qa-portfolio-owner').run();
 const privateSettings=await mf.dispatchFetch(root+'/settings/flash',{headers:identity});
 assert((await privateSettings.text()).includes('Create $1 USD test invoice'));
 assert.equal((await call('/api/flash/invoice-test','POST',{action:'send'},{...identity,Origin:root})).r.status,400);
 const testInvoice=await call('/api/flash/invoice-test','POST',{action:'create'},{...identity,Origin:root});
 assert.equal(testInvoice.r.status,200,JSON.stringify(testInvoice.value));
 assert.equal(testInvoice.value.status,'created',JSON.stringify(testInvoice.value));
 assert.equal(testInvoice.value.paymentStatus,'PENDING');
 assert(!JSON.stringify(testInvoice.value).includes('lnbc'));
 const testInvoiceAgain=await call('/api/flash/invoice-test','POST',{action:'create'},{...identity,Origin:root});
 assert.equal(testInvoiceAgain.value.paymentStatus,'PENDING');
 assert.equal((await call('/api/flash/invoice-test','POST',{action:'status'},{...otherIdentity,Origin:root})).r.status,403);
 assert.equal((await call('/api/flash/invoice-test','POST',{action:'create',currency:'USDT'},{...identity,Origin:root})).r.status,400);
 const usdInvoice=await call('/api/flash/invoice-test','POST',{action:'create',currency:'USD'},{...identity,Origin:root});
 assert.equal(usdInvoice.value.status,'created',JSON.stringify(usdInvoice.value));
 assert.equal(usdInvoice.value.currency,'USD');assert.equal(usdInvoice.value.amount,100);assert.equal(usdInvoice.value.paymentStatus,'PENDING');
 assert(!JSON.stringify(usdInvoice.value).includes('lnbc'));
 const usdAgain=await call('/api/flash/invoice-test','POST',{action:'create',currency:'USD'},{...identity,Origin:root});
 assert.equal(usdAgain.value.currency,'USD');assert.equal(usdAgain.value.paymentStatus,'PENDING');
 const bucket=await mf.getR2Bucket('BUCKET');
 const privateRecord=await bucket.get('internal/flash-invoice-test/qa-portfolio-owner.json');
 assert(privateRecord);assert((await privateRecord.json()).paymentRequest==='lnbc210n1fixture');
 const usdRecord=await bucket.get('internal/flash-invoice-test/usd/qa-portfolio-owner.json');
 assert(usdRecord);assert((await usdRecord.json()).paymentRequest==='lnbc10u1fixture');
 // Public offer checkout: immutable published price/recipient, no buyer login, exact origin.
 const checkoutProfile={...p,lightning:'boodaboo@flashapp.me',offers:[{...p.offers[0],usdPrice:'25.50'}]};
 assert.equal((await call('/api/portfolio','POST',{profile:{...checkoutProfile,lightning:''},action:'publish'},identity)).r.status,400);
 const publishedCheckout=await call('/api/portfolio','POST',{profile:checkoutProfile,action:'publish'},identity);
 assert.equal(publishedCheckout.r.status,200,JSON.stringify(publishedCheckout.value));
 const checkoutSlug=publishedCheckout.value.slug;
 const publicCheckoutPage=await mf.dispatchFetch(root+'/p/'+checkoutSlug);
 assert((await publicCheckoutPage.text()).includes('Pay with Lightning'));
 const checkoutId='12345678-1234-4123-8123-123456789abc';
 const checkoutInput={id:checkoutId,slug:checkoutSlug,offerId:'offer-1',amount:1,recipient:'attacker'};
 assert.equal((await call('/api/checkout','POST',checkoutInput,{Origin:'https://other.example'})).r.status,403);
 assert.equal((await call('/api/checkout','POST',{...checkoutInput,slug:'missing'},{Origin:root})).r.status,404);
 const checkoutCreated=await call('/api/checkout','POST',checkoutInput,{Origin:root});
 assert.equal(checkoutCreated.r.status,200,JSON.stringify(checkoutCreated.value));
 assert.equal(checkoutCreated.value.checkout.stage,'ready',JSON.stringify(checkoutCreated.value));
 assert.equal(checkoutCreated.value.checkout.usdCents,2550);assert.equal(checkoutCreated.value.checkout.recipient,'boodaboo@flashapp.me');
 assert.equal((await call('/api/checkout','POST',checkoutInput,{Origin:root})).value.checkout.paymentRequest,checkoutInvoice);
 const paidCheckout=await call('/api/checkout/'+checkoutId);
 assert.equal(paidCheckout.value.checkout.paymentStatus,'PAID',JSON.stringify(paidCheckout.value));
 assert.equal((await call('/api/checkout/not-a-valid-id')).r.status,404);
 assert.equal((await call('/api/checkout/12345678-1234-4123-8123-123456789abd')).r.status,404);
 await call('/api/portfolio','POST',{profile:{...checkoutProfile,offers:[{...checkoutProfile.offers[0],usdPrice:'50'}]},action:'draft'},identity);
 assert.equal((await call('/api/checkout','POST',checkoutInput,{Origin:root})).value.checkout.usdCents,2550);
 await call('/api/portfolio','POST',{profile:checkoutProfile,action:'unpublish'},identity);
 assert.equal((await call('/api/checkout','POST',{...checkoutInput,id:'12345678-1234-4123-8123-123456789abd'},{Origin:root})).r.status,404);
 // Paid opportunities: role boundaries, agreement, private delivery and real provider state.
 await call('/api/portfolio','POST',{profile:checkoutProfile,action:'publish'},identity);
 const buyer={...otherIdentity,Origin:root},seller={...identity,Origin:root},stranger={Cookie:'__Host-tf-access=qa-stranger',Origin:root};
 const brief={buyerName:'Office buyer',title:'Office plant plan',outcome:'Create a plant plan',criteria:'Five plants and care notes',location:'Nairobi',skills:['Plant styling'],deadline:new Date(Date.now()+86400000).toISOString().slice(0,10),budgetUsd:'60',milestones:[{title:'Booking',criteria:'Reserve the consultation',usdPrice:'20',kind:'upfront'},{title:'Plant plan',criteria:'Five plants and care notes',usdPrice:'40',kind:'delivery'}]};
 assert.equal((await call('/api/opportunities','POST',brief,{Origin:root})).r.status,401);
 assert.equal((await call('/api/opportunities','POST',brief,otherIdentity)).r.status,403);
 assert.equal((await call('/api/opportunities','POST',{...brief,budgetUsd:'61'},buyer)).r.status,400);
 const posted=await call('/api/opportunities','POST',brief,buyer);assert.equal(posted.r.status,201,JSON.stringify(posted.value));const job=posted.value.opportunity.id,path='/api/opportunities/'+job;
 assert((await call('/api/opportunities')).value.opportunities.some(o=>o.id===job));
 assert.equal((await call(path,'POST',{action:'apply',proposal:'Cannot apply to own work'},buyer)).r.status,400);
 assert.equal((await call(path,'POST',{action:'apply',proposal:'PRIVATE APPLICATION: my approach'},seller)).r.status,200);
 const strangerView=await call(path,'GET',undefined,stranger);assert(!JSON.stringify(strangerView.value).includes('PRIVATE APPLICATION'));
 const applications=(await call(path,'GET',undefined,buyer)).value.opportunity.applications;
 assert.equal((await call(path,'POST',{action:'select',applicationId:applications[0].id},stranger)).r.status,403);
 const selected=await call(path,'POST',{action:'select',applicationId:applications[0].id},buyer);assert.equal(selected.value.opportunity.status,'selection');const first=selected.value.opportunity.milestones[0].id,second=selected.value.opportunity.milestones[1].id;
 assert.equal((await call(path,'POST',{action:'pay',milestoneId:first},buyer)).r.status,400);
 assert.equal((await call(path,'POST',{action:'accept'},stranger)).r.status,403);
 const accepted=await call(path,'POST',{action:'accept'},seller);assert.equal(accepted.value.opportunity.agreement,'accepted');assert.equal(accepted.value.opportunity.milestones[0].payment,'unpaid');
 assert.equal((await call(path,'POST',{action:'pay',milestoneId:second},buyer)).r.status,400);
 assert.equal((await call(path,'POST',{action:'pay',milestoneId:first},seller)).r.status,403);
 const booking=await call(path,'POST',{action:'pay',milestoneId:first,amount:1,recipient:'attacker'},buyer);assert.equal(booking.r.status,200,JSON.stringify(booking.value));assert.equal(booking.value.checkout.usdCents,2000);assert.equal(booking.value.checkout.recipient,'boodaboo@flashapp.me');
 const pending=await call(path,'POST',{action:'check_payment',milestoneId:first},seller);assert.equal(pending.value.opportunity.milestones[0].payment,'unpaid');
 const receiptKey='internal/offer-payments/'+booking.value.checkout.id+'.json';const receipt=await bucket.get(receiptKey);const receiptValue=await receipt.json();await bucket.put(receiptKey,JSON.stringify({...receiptValue,lastCheckedAt:0}));
 const bookingPaid=await call(path,'POST',{action:'check_payment',milestoneId:first},buyer);assert.equal(bookingPaid.value.opportunity.milestones[0].payment,'paid',JSON.stringify(bookingPaid.value));
 assert.equal((await call(path,'POST',{action:'deliver',milestoneId:second,note:'Wrong actor'},buyer)).r.status,403);
 const delivery=await call(path,'POST',{action:'deliver',milestoneId:second,note:'PRIVATE DELIVERY: care plan',url:'https://example.test/delivery'},seller);assert.equal(delivery.r.status,200);
 assert(!JSON.stringify((await call(path)).value).includes('PRIVATE DELIVERY'));
 assert(!JSON.stringify((await call(path,'GET',undefined,stranger)).value).includes('PRIVATE DELIVERY'));
 assert.equal((await call(path,'POST',{action:'approve',milestoneId:second},seller)).r.status,403);
 await call(path,'POST',{action:'request_changes',milestoneId:second,note:'Add care intervals'},buyer);
 await call(path,'POST',{action:'deliver',milestoneId:second,note:'PRIVATE DELIVERY updated',url:'https://example.test/final'},seller);
 const approved=await call(path,'POST',{action:'approve',milestoneId:second},buyer);assert.equal(approved.value.opportunity.milestones[1].state,'approved');assert.equal(approved.value.opportunity.milestones[1].payment,'unpaid');
 assert.equal((await call(path,'POST',{action:'mark_paid',milestoneId:second},buyer)).r.status,400);
 const finalInvoice=await call(path,'POST',{action:'pay',milestoneId:second},buyer);assert.equal(finalInvoice.value.checkout.usdCents,4000,JSON.stringify(finalInvoice.value));
 const complete=await call(path,'POST',{action:'check_payment',milestoneId:second},seller);assert.equal(complete.value.opportunity.status,'completed',JSON.stringify(complete.value));
 assert.equal((await call(path,'POST',{action:'new_invoice',milestoneId:second},buyer)).r.status,400);
 assert((await call('/api/opportunities?mine=1','GET',undefined,identity)).value.opportunities.some(o=>o.id===job));
 // Optional Nostr ownership proof and signed listing, with no real relay publication.
 const nostrKey=new Uint8Array(32).fill(7),pubkey=getPublicKey(nostrKey);
 assert.equal((await call('/api/nostr','POST',{action:'challenge',pubkey},{Origin:root})).r.status,401);
 const challenge=await call('/api/nostr','POST',{action:'challenge',pubkey},seller);assert.equal(challenge.r.status,200,JSON.stringify(challenge.value));
 const signedChallenge=finalizeEvent(challenge.value.event,nostrKey);
 assert.equal((await call('/api/nostr','POST',{action:'connect',challengeId:challenge.value.challengeId,event:{...signedChallenge,sig:'0'.repeat(128)}},seller)).r.status,400);
 assert.equal((await call('/api/nostr','POST',{action:'connect',challengeId:challenge.value.challengeId,event:signedChallenge},buyer)).r.status,400);
 const connected=await call('/api/nostr','POST',{action:'connect',challengeId:challenge.value.challengeId,event:signedChallenge},seller);assert.equal(connected.value.identity.pubkey,pubkey,JSON.stringify(connected.value));
 assert.equal((await call('/api/nostr','POST',{action:'connect',challengeId:challenge.value.challengeId,event:signedChallenge},seller)).r.status,400);
 const publicPitch=(await call('/api/profiles')).value.profiles.find(o=>o.slug===checkoutSlug);assert.equal(publicPitch.nostrPubkey,pubkey);
 const previewListing=await call('/api/nostr','POST',{action:'preview'},seller);assert.equal(previewListing.value.event.kind,30402);assert(!previewListing.value.event.content.includes('PRIVATE DELIVERY'));
 const changed=finalizeEvent({...previewListing.value.event,content:'FORGED LISTING'},nostrKey);assert.equal((await call('/api/nostr','POST',{action:'sign_listing',event:changed},seller)).r.status,400);
 const listing=finalizeEvent(previewListing.value.event,nostrKey);assert.equal((await call('/api/nostr','POST',{action:'sign_listing',event:listing},seller)).r.status,200);
 assert.equal((await call('/api/nostr','POST',{action:'disconnect'},seller)).r.status,200);
 assert.equal((await call('/api/profiles')).value.profiles.find(o=>o.slug===checkoutSlug).nostrPubkey,undefined);
 console.log('Passed: auth, origin checks, publish validation, drafts, published snapshots, owner isolation, SSR portfolios, image upload/access, unpublishing, tipping validation, offer validation and enquiry links, legacy service compatibility, server-rendered discovery, performer actions, public card snapshot boundaries and unsafe-link rejection; opportunity agreement, delivery privacy, milestone invoice and payment confirmation; Nostr signature, replay protection and listing privacy.');
}finally{await mf.dispose()}

