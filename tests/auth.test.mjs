import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authenticateRequest,safeReturnTo,withSessionCookies} from '../lib/standalone-auth.mjs';
const root='https://taste.test';
const env={SUPABASE_URL:'https://test-project.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'};
const session={access_token:'new-access',refresh_token:'new-refresh',expires_in:3600};
const user={id:'account-123',email:'me@example.test'};
const json=(data,status=200)=>Response.json(data,{status});
function post(path,fields={},headers={}){return new Request(root+path,{method:'POST',headers:{Origin:root,Cookie:'__Host-tf-csrf=test-csrf','Content-Type':'application/x-www-form-urlencoded',...headers},body:new URLSearchParams({csrf:'test-csrf',email:'me@example.test',password:'safe password 123',return_to:'/edit',...fields})})}
test('return paths cannot leave the site or loop through auth',()=>{
 for(const value of ['https://evil.test','//evil.test','/\\evil.test','/auth/sign-in','/callback','/\r\nevil']) assert.equal(safeReturnTo(value),'/edit');
 assert.equal(safeReturnTo('/p/example?view=1'),'/p/example?view=1');
});
test('missing configuration displays an honest setup page and strips forged identity',async()=>{
 const view=await authenticateRequest(new Request(root+'/auth/sign-in'),{});
 assert.match(await view.response.text(),/Sign in is being connected/);
 const result=await authenticateRequest(new Request(root+'/api/portfolio',{headers:{'oai-authenticated-user-id':'forged'}}),{});
 assert.equal(result.request.headers.get('oai-authenticated-user-id'),null);
});
test('rejects unsafe provider URL and secret key configuration',async()=>{
 for(const config of [{...env,SUPABASE_URL:'http://test-project.supabase.co'},{...env,SUPABASE_URL:'https://evil.test'},{...env,SUPABASE_PUBLISHABLE_KEY:'sb_secret_private'}]){
  const r=await authenticateRequest(new Request(root+'/auth/sign-in'),config);
  assert.match(await r.response.text(),/Sign in is being connected/);
 }
});
test('account forms use secure cookies, labels and a restrictive CSP',async()=>{
 const r=await authenticateRequest(new Request(root+'/auth/sign-up'),env);
 const html=await r.response.text();
 assert.match(html,/autocomplete="new-password"/);assert.match(html,/minlength="12"/);
 assert.match(r.response.headers.get('set-cookie'),/Secure; HttpOnly; SameSite=Lax/);
 assert.match(r.response.headers.get('content-security-policy'),/frame-ancestors 'none'/);
});
test('rejects cross origin, missing CSRF, oversized forms and unsupported methods before provider calls',async()=>{
 const fetcher=()=>{throw Error('must not call provider')};
 assert.equal((await authenticateRequest(post('/auth/sign-in',{}, {Origin:'https://evil.test'}),env,fetcher)).response.status,403);
 assert.equal((await authenticateRequest(post('/auth/sign-in',{csrf:'wrong'}),env,fetcher)).response.status,403);
 assert.equal((await authenticateRequest(post('/auth/sign-in',{password:'x'.repeat(5000)}),env,fetcher)).response.status,413);
 assert.equal((await authenticateRequest(new Request(root+'/auth/sign-in',{method:'DELETE'}),env,fetcher)).response.status,405);
});
test('password sign in verifies user before issuing HttpOnly session cookies and redirects locally',async()=>{
 const calls=[];
 const fetcher=async(url,init)=>{calls.push([url,init]);return url.endsWith('/user')?json(user):json(session)};
 const r=await authenticateRequest(post('/auth/sign-in',{return_to:'//evil.test'}),env,fetcher);
 assert.equal(r.response.status,303);assert.equal(r.response.headers.get('location'),'/edit');
 const values=r.response.headers.getSetCookie();assert.equal(values.length,3);assert.match(values[0],/__Host-tf-access=new-access/);assert.match(values[1],/__Host-tf-refresh=new-refresh/);
 assert(calls[0][0].endsWith('/token?grant_type=password'));assert.equal(calls[1][1].headers.Authorization,'Bearer new-access');
});
test('sign up requiring confirmation creates no session',async()=>{
 const r=await authenticateRequest(post('/auth/sign-up'),env,async()=>json({id:'new-user'}));
 assert.equal(r.response.status,200);assert.match(await r.response.text(),/Check your inbox/);
 assert(!r.response.headers.get('set-cookie').includes('__Host-tf-access'));
});
test('errors never echo credentials or provider internals',async()=>{
 const r=await authenticateRequest(post('/auth/sign-in'),env,async()=>json({error:'safe password 123 private provider details'},400));
 const html=await r.response.text();assert(!html.includes('safe password 123'));assert(!html.includes('private provider details'));assert.equal(r.response.status,400);
});
test('a valid cookie is checked with the provider, replacing every forged identity header',async()=>{
 const r=await authenticateRequest(new Request(root+'/api/portfolio',{headers:{Cookie:'__Host-tf-access=valid','oai-authenticated-user-id':'forged','oai-authenticated-user-full-name':'fake'}}),env,async()=>json(user));
 assert.equal(r.request.headers.get('oai-authenticated-user-id'),user.id);assert.equal(r.request.headers.get('oai-authenticated-user-email'),user.email);assert.equal(r.request.headers.get('oai-authenticated-user-full-name'),null);
});
test('expired access refreshes through provider and verifies the renewed token',async()=>{
 const calls=[];
 const fetcher=async(url,init)=>{calls.push(url);if(url.includes('grant_type=refresh_token'))return json(session);return init.headers.Authorization==='Bearer old'?json({},401):json(user)};
 const r=await authenticateRequest(new Request(root+'/edit',{headers:{Cookie:'__Host-tf-access=old; __Host-tf-refresh=refresh'}}),env,fetcher);
 assert.equal(r.request.headers.get('oai-authenticated-user-id'),user.id);assert.equal(r.cookies.length,2);assert.equal(calls.length,3);
});
test('invalid refresh clears cookies; provider outage fails closed without erasing session',async()=>{
 const req=()=>new Request(root+'/edit',{headers:{Cookie:'__Host-tf-refresh=invalid','oai-authenticated-user-id':'forged'}});
 const invalid=await authenticateRequest(req(),env,async()=>json({},400));assert.equal(invalid.cookies.length,2);assert(invalid.cookies.every(x=>x.includes('Max-Age=0')));
 const outage=await authenticateRequest(req(),env,async()=>{throw Error('offline')});assert.equal(outage.request.headers.get('oai-authenticated-user-id'),null);assert.equal(outage.cookies.length,0);
});
test('unverified login result cannot issue cookies',async()=>{
 const r=await authenticateRequest(post('/auth/sign-in'),env,async(url)=>url.endsWith('/user')?json({},401):json(session));
 assert.equal(r.response.status,401);assert(!r.response.headers.get('set-cookie').includes('__Host-tf-access'));
});
test('duplicate access cookies cannot authenticate a user',async()=>{
 const r=await authenticateRequest(new Request(root+'/api/portfolio',{headers:{Cookie:'__Host-tf-access=a; __Host-tf-access=b'}}),env,()=>{throw Error('must not fetch')});
 assert.equal(r.request.headers.get('oai-authenticated-user-id'),null);
});
test('sign out is a CSRF protected POST and clears browser session even during provider outage',async()=>{
 const req=post('/auth/sign-out',{}, {Cookie:'__Host-tf-csrf=test-csrf; __Host-tf-access=valid'});
 const r=await authenticateRequest(req,env,async()=>{throw Error('offline')});
 assert.equal(r.response.status,303);assert.equal(r.response.headers.get('location'),'/');assert(r.response.headers.getSetCookie().every(x=>x.includes('Max-Age=0')));
 const get=await authenticateRequest(new Request(root+'/auth/sign-out'),env);assert.match(await get.response.text(),/method="post"/);
});
test('responses containing account state cannot enter shared caches',()=>{
 const r=withSessionCookies(new Response('private',{headers:{'Cache-Control':'public, max-age=3600'}}),['cookie=value']);assert.equal(r.headers.get('cache-control'),'private, no-store');assert.match(r.headers.get('vary'),/Cookie/);
});
