import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authenticateRequest,authFailure,safeReturnTo} from '../lib/standalone-auth.mjs';
const root='https://taste.test',env={SUPABASE_URL:'https://test-project.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'};
const session={access_token:'recovery-access',refresh_token:'recovery-refresh',expires_in:3600};
const user={id:'account-123',email:'person@example.test'};
const json=(data,status=200)=>Response.json(data,{status});
function post(path,fields={},cookie='',origin=root){return new Request(root+path,{method:'POST',headers:{Origin:origin,Cookie:'__Host-tf-csrf=test-csrf'+(cookie?'; '+cookie:''),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrf:'test-csrf',email:user.email,...fields})})}
const get=(path,cookie='')=>new Request(root+path,{headers:{Cookie:cookie}});
const cookieValue=(response,name)=>decodeURIComponent(response.headers.getSetCookie().find(c=>c.startsWith(name+'=')).split(';')[0].slice(name.length+1));
test('password visibility has accessible controls and a unique nonce under CSP',async()=>{
 for(const path of ['/auth/sign-in','/auth/sign-up']){
  const r=await authenticateRequest(get(path),env);const html=await r.response.text();
  assert.match(html,/type="button" data-password-toggle="password" aria-controls="password" aria-label="Show password" aria-pressed="false"/);
  assert.match(html,/input.type=show\?'text':'password'/);
  const nonce=html.match(/<script nonce="([^"]+)"/)[1];assert(r.response.headers.get('content-security-policy').includes("script-src 'nonce-"+nonce+"'"));
  assert(!r.response.headers.get('content-security-policy').includes("script-src 'unsafe-inline'"));
  if(path.endsWith('sign-in'))assert.match(html,/Forgot password\?/);
  else {assert.match(html,/id="password-hint"/);assert.match(html,/aria-describedby="password-hint"/);assert(!html.includes('${id}'));}
 }
});
test('signup errors distinguish email setup, disabled signup and password rules without echoing provider data',async()=>{
 for(const [code,expected] of [['email_address_not_authorized','AUTH_EMAIL_SETUP'],['signup_disabled','AUTH_SIGNUP_DISABLED'],['over_email_send_rate_limit','AUTH_EMAIL_LIMIT'],['weak_password','security rules']]){
  const r=await authenticateRequest(post('/auth/sign-up',{password:'valid password 123'}),env,async()=>json({code,msg:'secret internal details'},400));
  const html=await r.response.text();assert.match(html,new RegExp(expected));assert(!html.includes('secret internal details'));assert(!html.includes('valid password 123'));assert(html.includes('person@example.test'));
 }
 assert(!authFailure({status:400,data:{message:'private provider log'}},'sign-up').includes('private'));
});
test('forgot password uses S256 PKCE, secure short-lived verifier and no app session',async()=>{
 const calls=[];const r=await authenticateRequest(post('/auth/forgot-password'),env,async(url,init)=>{calls.push({url,init});return json({})});
 assert.equal(r.response.status,200);assert.match(await r.response.text(),/If an account exists/);
 const verifier=cookieValue(r.response,'__Host-tf-recovery-flow');assert.match(verifier,/^[A-Za-z0-9_-]{43}$/);
 const body=JSON.parse(calls[0].init.body);const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
 assert.equal(body.code_challenge,Buffer.from(digest).toString('base64url'));assert.equal(body.code_challenge_method,'s256');
 assert.equal(new URL(calls[0].url).searchParams.get('redirect_to'),root+'/auth/callback');
 assert(r.response.headers.getSetCookie().some(c=>/recovery-flow=.*Secure; HttpOnly; SameSite=Lax; Max-Age=900/.test(c)));
 assert(!r.response.headers.getSetCookie().some(c=>c.startsWith('__Host-tf-access=')));
});
test('recovery rejects CSRF, cross-origin and oversized requests before contacting provider',async()=>{
 const never=()=>{throw Error('must not call provider')};
 for(const path of ['/auth/forgot-password','/auth/reset-password']){
  assert.equal((await authenticateRequest(post(path,{},'', 'https://evil.test'),env,never)).response.status,403);
  assert.equal((await authenticateRequest(post(path,{csrf:'wrong'}),env,never)).response.status,403);
  assert.equal((await authenticateRequest(post(path,{email:'x'.repeat(5000)}),env,never)).response.status,413);
 }
});
test('callback exchanges a browser-bound code and keeps tokens in recovery-only cookies',async()=>{
 const calls=[];const verifier='v'.repeat(43);
 const r=await authenticateRequest(get('/auth/callback?code=single-use-code','__Host-tf-recovery-flow='+verifier),env,async(url,init)=>{calls.push({url,init});return json(url.endsWith('/user')?user:session)});
 assert.equal(r.response.status,303);assert.equal(r.response.headers.get('location'),'/auth/reset-password');assert.equal(r.response.headers.get('referrer-policy'),'no-referrer');
 assert.deepEqual(JSON.parse(calls[0].init.body),{auth_code:'single-use-code',code_verifier:verifier});assert(calls[0].url.endsWith('/token?grant_type=pkce'));
 assert.equal(cookieValue(r.response,'__Host-tf-recovery-access'),session.access_token);
 assert.equal(cookieValue(r.response,'__Host-tf-recovery-flow'),'');
 assert(!r.response.headers.getSetCookie().some(c=>c.startsWith('__Host-tf-access=')));
});
test('missing, stale, cross-browser and invalid reset links cannot establish recovery',async()=>{
 for(const [path,cookies] of [['/auth/callback?code=stolen',''],['/auth/callback','__Host-tf-recovery-flow='+'v'.repeat(43)],['/auth/callback?code=expired','__Host-tf-recovery-flow='+'v'.repeat(43)]]){
  const r=await authenticateRequest(get(path,cookies),env,async()=>json({},400));
  assert.match(await r.response.text(),/invalid or expired/);assert(r.response.headers.getSetCookie().every(c=>!c.startsWith('__Host-tf-recovery-access=')||c.includes('Max-Age=0')));
 }
 const unverified=await authenticateRequest(get('/auth/callback?code=unverified','__Host-tf-recovery-flow='+'v'.repeat(43)),env,async url=>url.endsWith('/user')?json({},401):json(session));assert.match(await unverified.response.text(),/invalid or expired/);
});
test('reset requires recovery token, matching strong passwords and verified user before PUT',async()=>{
 const never=()=>{throw Error('must not call provider')};
 assert.equal((await authenticateRequest(post('/auth/reset-password',{password:'new password 123',password_confirm:'new password 123'}),env,never)).response.status,401);
 for(const fields of [{password:'short',password_confirm:'short'},{password:'new password 123',password_confirm:'different password 456'}])assert.equal((await authenticateRequest(post('/auth/reset-password',fields,'__Host-tf-recovery-access=recovery-access'),env,never)).response.status,400);
 const expired=await authenticateRequest(post('/auth/reset-password',{password:'new password 123',password_confirm:'new password 123'},'__Host-tf-recovery-access=expired'),env,async()=>json({},401));assert.equal(expired.response.status,401);assert.match(await expired.response.text(),/session has expired/);
 const calls=[];const r=await authenticateRequest(post('/auth/reset-password',{password:'new password 123',password_confirm:'new password 123'},'__Host-tf-recovery-access=recovery-access'),env,async(url,init)=>{calls.push({url,init});return json(user)});
 assert.equal(r.response.status,303);assert.equal(r.response.headers.get('location'),'/auth/sign-in?reset=success');
 assert.equal(calls[1].init.method,'PUT');assert.equal(calls[1].init.headers.Authorization,'Bearer recovery-access');assert.deepEqual(JSON.parse(calls[1].init.body),{password:'new password 123'});
 assert(r.response.headers.getSetCookie().every(c=>c.includes('Max-Age=0')));
});
test('recovery tokens never authenticate normal portfolio requests and return paths cannot enter recovery',async()=>{
 const r=await authenticateRequest(get('/api/portfolio','__Host-tf-recovery-access=recovery-access'),env,()=>{throw Error('must not call provider')});assert.equal(r.request.headers.get('oai-authenticated-user-id'),null);
 for(const path of ['/auth/callback?code=secret','/auth/reset-password','/auth/forgot-password'])assert.equal(safeReturnTo(path),'/edit');
});
