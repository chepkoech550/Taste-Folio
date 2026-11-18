// Standalone Cloudflare authentication. Only verified Supabase users become
// the trusted identity consumed by the existing portfolio ownership checks.
const ACCESS = '__Host-tf-access';
const REFRESH = '__Host-tf-refresh';
const CSRF = '__Host-tf-csrf';
const RECOVERY_FLOW = '__Host-tf-recovery-flow';
const RECOVERY_ACCESS = '__Host-tf-recovery-access';
const RECOVERY_SECONDS = 900;
const WEEK = 7 * 24 * 60 * 60;
const AUTH_PATHS = new Set(['/auth/sign-in','/auth/sign-up','/auth/sign-out','/signin-with-chatgpt','/signout-with-chatgpt','/auth/forgot-password','/auth/reset-password','/auth/callback']);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeReturnTo(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return '/edit';
  try {
    const u = new URL(value, 'https://local.invalid');
    if (u.origin !== 'https://local.invalid' || u.pathname.startsWith('/auth/') || AUTH_PATHS.has(u.pathname) || u.pathname === '/callback') return '/edit';
    return u.pathname + u.search;
  } catch { return '/edit'; }
}
function configuration(env) {
  try {
    const u = new URL(env.SUPABASE_URL);
    if (u.protocol !== 'https:' || u.username || u.password || !u.hostname.endsWith('.supabase.co') || u.pathname !== '/') return null;
    const key = env.SUPABASE_PUBLISHABLE_KEY;
    if (typeof key !== 'string' || !key.startsWith('sb_publishable_')) return null;
    return { base: u.origin + '/auth/v1', key };
  } catch { return null; }
}
function readCookies(request) {
  const values = new Map();
  for (const pair of (request.headers.get('cookie') || '').split(';')) {
    const i = pair.indexOf('=');
    if (i < 0) continue;
    const key = pair.slice(0,i).trim();
    // Reject duplicate security cookie names rather than choose one.
    if (values.has(key)) values.set(key, '');
    else { try { values.set(key, decodeURIComponent(pair.slice(i+1).trim())); } catch { values.set(key, ''); } }
  }
  return values;
}
const cookie = (name,value,age) => `${name}=${encodeURIComponent(value)}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${age}`;
function sessionCookies(session) {
  return [cookie(ACCESS,session.access_token,Math.min(Number(session.expires_in) || 3600,3600)), cookie(REFRESH,session.refresh_token,WEEK)];
}
const clearCookies = () => [cookie(ACCESS,'',0),cookie(REFRESH,'',0)];
function redirectTo(path, cookies = []) {
  const headers = new Headers({Location:path,'Cache-Control':'private, no-store','Referrer-Policy':'same-origin'});
  for (const item of cookies) headers.append('Set-Cookie',item);
  return new Response(null,{status:303,headers});
}
async function api(config, path, {method='GET',body,token} = {}, fetcher) {
  const headers = {apikey:config.key,'Content-Type':'application/json'};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetcher(config.base + path,{method,headers,body:body ? JSON.stringify(body) : undefined,signal:AbortSignal.timeout(12000)});
  const data = await response.json().catch(()=>null);
  return {ok:response.ok,status:response.status,data};
}
function validSession(data) { return data && typeof data.access_token === 'string' && typeof data.refresh_token === 'string' && data.access_token.length < 12000 && data.refresh_token.length < 12000; }
async function verifiedUser(config,token,fetcher) {
  const result = await api(config,'/user',{token},fetcher);
  const user = result.data;
  return {...result,user:result.ok && typeof user?.id === 'string' && typeof user?.email === 'string' ? user : null};
}
function passwordField({id='password',label='Password',signup=false}={}) {
  return `<label for="${id}">${label}</label>${signup?`<small class="hint" id="${id}-hint">Use at least 12 characters.</small>`:''}<div class="password-wrap"><input id="${id}" type="password" name="${id}" autocomplete="${signup?'new-password':'current-password'}" minlength="${signup?12:1}" maxlength="128" ${signup?`aria-describedby="${id}-hint" `:''}required><button class="password-toggle" type="button" data-password-toggle="${id}" aria-controls="${id}" aria-label="Show ${label.toLowerCase()}" aria-pressed="false">Show</button></div>`;
}
function page({mode='sign-in',returnTo='/edit',message='',status=200,configured=true,csrf='',email='',canReset=false,extraCookies=[]}) {
  const token = csrf || crypto.randomUUID(), nonce=crypto.randomUUID().replaceAll('-','');
  const signup=mode==='sign-up', logout=mode==='sign-out', forgot=mode==='forgot-password', reset=mode==='reset-password';
  const title=logout?'Sign out?':forgot?'Let’s get you back in.':reset?'A fresh start.':signup?'Let your work speak.':'Your work belongs here.';
  const heading=logout?'Leave your account securely':forgot?'Forgot your password?':reset?'Choose a new password':signup?'Create your account':'Welcome back';
  const emailField=`<label for="email">Email address</label><input id="email" type="email" name="email" autocomplete="email" maxlength="254" value="${escapeHtml(email)}" required>`;
  const hidden=`<input type="hidden" name="csrf" value="${escapeHtml(token)}"><input type="hidden" name="return_to" value="${escapeHtml(returnTo)}">`;
  let form;
  if(!configured)form='<p class="notice" role="status">Sign in is being connected. You can browse portfolios or continue drafting on this device.</p><a class="primary" href="/edit">Continue your draft</a>';
  else if(reset&&!canReset)form='<p>Request a reset email, then open its link in the same browser where you requested it.</p><a class="primary" href="/auth/forgot-password">Request a new reset link</a>';
  else {
    const fields=logout?'<p>Your portfolio stays saved to your account.</p>':forgot?'<p>Enter your account email. Open the reset link in this browser.</p>'+emailField:reset?passwordField({label:'New password',signup:true})+passwordField({id:'password_confirm',label:'Confirm password',signup:true}):emailField+passwordField({signup});
    const button=logout?'Sign out':forgot?'Send reset link':reset?'Save new password':signup?'Create account':'Sign in';
    form=`<form method="post" action="/auth/${mode}">${hidden}${fields}${signup?'<small>After creating your account, check your inbox and spam folder for the confirmation email.</small>':''}<button class="primary" type="submit">${button}</button></form>`;
    if(!logout&&!signup&&!forgot&&!reset)form+=`<a class="form-link" href="/auth/forgot-password?return_to=${encodeURIComponent(returnTo)}">Forgot password?</a>`;
    form+=logout?'<a class="switch" href="/edit">Return to your pitch</a>':forgot||reset?`<p class="switch"><a href="/auth/sign-in?return_to=${encodeURIComponent(returnTo)}">Back to sign in</a></p>`:`<p class="switch">${signup?'Already have an account?':'New to Taste Folio?'} <a href="/auth/${signup?'sign-in':'sign-up'}?return_to=${encodeURIComponent(returnTo)}">${signup?'Sign in':'Create an account'}</a></p>`;
  }
  const script=`document.querySelectorAll('[data-password-toggle]').forEach(button=>button.addEventListener('click',()=>{const input=document.getElementById(button.dataset.passwordToggle);const show=input.type==='password';input.type=show?'text':'password';button.textContent=show?'Hide':'Show';button.setAttribute('aria-pressed',String(show));button.setAttribute('aria-label',(show?'Hide ':'Show ')+(input.id==='password_confirm'?'confirm password':${reset?'true':'false'}?'new password':'password'));}));`;
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${logout?'Sign out':forgot?'Forgot password':reset?'Reset password':signup?'Create account':'Sign in'} | Taste Folio</title><style>*{box-sizing:border-box}body{margin:0;background:#faf7f2;color:#34151e;font:16px/1.6 system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:32px 24px}.brand{font:700 24px Georgia,serif;color:#601d35;text-decoration:none}.grid{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;min-height:78vh}.story{max-width:440px}.eyebrow{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#805d21}h1{font:clamp(38px,5vw,64px)/1.12 Georgia,serif;margin:20px 0}.story p{color:#6b5c61;font-size:18px}.card{background:white;padding:36px;border:1px solid #e6dce0;border-radius:20px;box-shadow:0 16px 48px #601d3508}h2{font:28px Georgia,serif;margin-top:0}label{display:block;margin:20px 0 6px;font-weight:600}input{width:100%;padding:13px;border:1px solid #bbaab0;border-radius:9px;font:inherit}input:focus-visible,a:focus-visible,button:focus-visible{outline:3px solid #c39642;outline-offset:3px}.primary{display:block;width:100%;padding:14px 20px;margin-top:24px;background:#601d35;color:#fff;border:0;border-radius:9px;font:600 16px system-ui;text-align:center;text-decoration:none;cursor:pointer}a{color:#601d35}small{display:block;color:#6b5c61;margin-top:8px}.switch{text-align:center;font-size:14px;margin:24px 0 0}.notice{padding:14px;background:#fbf3df;border-left:3px solid #b78a36;color:#514328}.back{display:inline-block;margin-top:24px;font-size:14px}.footer{font-size:13px;color:#74666b}@media(max-width:700px){main{padding:24px 20px}.grid{grid-template-columns:1fr;gap:28px;min-height:0;padding:40px 0}.story p{font-size:16px}.card{padding:26px}h1{font-size:42px}} .password-wrap{position:relative}.password-wrap input{padding-right:78px}.password-toggle{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:transparent;border:0;padding:8px;color:#601d35;font:600 14px system-ui;cursor:pointer}.form-link{display:inline-block;margin-top:12px;font-size:14px}.hint{margin:0 0 8px}button:disabled{opacity:.65} .reference{font-size:12px}</style></head><body><main><a class="brand" href="/">Taste Folio<span style="color:#b78a36">.</span></a><div class="grid"><section class="story"><span class="eyebrow">Get paid for your skills.</span><h1>${title}</h1><p>Show what you do, share the work behind it, and give people a reason to choose you.</p><a class="back" href="/">Browse talent</a></section><section class="card" aria-label="Account"><h2>${heading}</h2>${message?`<p class="notice" role="status">${escapeHtml(message)}</p>`:''}${form}</section></div><p class="footer">Your pitch details become public when you publish. Your account password stays private.</p></main><script nonce="${nonce}">${script}</script></body></html>`;
  const headers=new Headers({'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','Referrer-Policy':'same-origin','X-Content-Type-Options':'nosniff','Content-Security-Policy':`default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'`});
  headers.append('Set-Cookie',cookie(CSRF,token,3600));for(const c of extraCookies)headers.append('Set-Cookie',c);
  return new Response(html,{status,headers});
}
export function authFailure(result,mode) {
  const code=result.data?.code || result.data?.error_code;
  const known={email_address_not_authorized:'Account emails are not available for this address yet. Please contact Taste support. Reference: AUTH_EMAIL_SETUP.',over_email_send_rate_limit:'The email service has reached its sending limit. Please try again later. Reference: AUTH_EMAIL_LIMIT.',email_address_invalid:'Enter a real, valid email address.',weak_password:'This password does not meet the account security rules. Use a longer password with a mix of characters.',signup_disabled:'New accounts are temporarily unavailable. Please contact Taste support. Reference: AUTH_SIGNUP_DISABLED.',email_provider_disabled:'Email accounts are temporarily unavailable. Please contact Taste support. Reference: AUTH_EMAIL_DISABLED.',email_not_confirmed:'Confirm your email using the link in your inbox or spam folder, then sign in.',captcha_failed:'The account verification check could not complete. Please contact Taste support. Reference: AUTH_CAPTCHA.',same_password:'Choose a different password from your current one.'};
  if(known[code])return known[code];
  if(result.status===429)return 'Too many attempts. Please wait before trying again.';
  if(result.status>=500)return 'The account service is temporarily unavailable. Please try again shortly. Reference: AUTH_PROVIDER.';
  return mode==='sign-up'?'We could not create the account. Try again, or sign in if you already registered.':mode==='forgot-password'?'The reset email could not be requested. Please try again shortly.':mode==='reset-password'?'Your password could not be updated. Request a new reset link and try again.':'Check your email and password. If you just registered, confirm your email first.';
}
async function recoveryFlow() {
  const bytes=crypto.getRandomValues(new Uint8Array(32));
  const verifier=btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
  const challenge=btoa(String.fromCharCode(...new Uint8Array(digest))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
  return {verifier,challenge};
}
/** Intercept account routes or return a sanitised, provider-verified request. */
export async function authenticateRequest(request,env,fetcher=fetch) {
  const headers = new Headers(request.headers);
  for (const name of [...headers.keys()]) if (name.toLowerCase().startsWith('oai-authenticated-')) headers.delete(name);
  request = new Request(request,{headers});
  const url = new URL(request.url), config = configuration(env), cookies = readCookies(request);
  const returnTo = safeReturnTo(url.searchParams.get('return_to') || '/edit');
  if (AUTH_PATHS.has(url.pathname)) {
    if(url.pathname==='/auth/callback') {
      if(request.method!=='GET')return {response:new Response('Method not allowed',{status:405})};
      const code=url.searchParams.get('code'),verifier=cookies.get(RECOVERY_FLOW);
      if(!config||!code||code.length>2048||!verifier||!/^[A-Za-z0-9_-]{43}$/.test(verifier)||url.searchParams.has('error'))return {response:page({mode:'reset-password',message:'This reset link is invalid or expired. Request a new link.',extraCookies:[cookie(RECOVERY_FLOW,'',0),cookie(RECOVERY_ACCESS,'',0)]})};
      try {
        const result=await api(config,'/token?grant_type=pkce',{method:'POST',body:{auth_code:code,code_verifier:verifier}},fetcher);
        const verified=validSession(result.data)?await verifiedUser(config,result.data.access_token,fetcher):null;
        if(!result.ok||!verified?.user)return {response:page({mode:'reset-password',message:'This reset link is invalid or expired. Request a new link.',extraCookies:[cookie(RECOVERY_FLOW,'',0),cookie(RECOVERY_ACCESS,'',0)]})};
        const response=redirectTo('/auth/reset-password',[cookie(RECOVERY_FLOW,'',0),cookie(RECOVERY_ACCESS,result.data.access_token,RECOVERY_SECONDS)]);
        response.headers.set('Referrer-Policy','no-referrer');return {response};
      }catch{return {response:page({mode:'forgot-password',message:'Password recovery is temporarily unavailable. Request a new link shortly.',status:503,extraCookies:[cookie(RECOVERY_FLOW,'',0),cookie(RECOVERY_ACCESS,'',0)]})};}
    }
    const mode=url.pathname.endsWith('forgot-password')?'forgot-password':url.pathname.endsWith('reset-password')?'reset-password':url.pathname.includes('signout')||url.pathname.endsWith('sign-out')?'sign-out':url.pathname.endsWith('sign-up')?'sign-up':'sign-in';
    if(request.method==='GET')return {response:page({mode,returnTo,configured:!!config,canReset:!!cookies.get(RECOVERY_ACCESS),message:mode==='sign-in'&&url.searchParams.get('reset')==='success'?'Your password was updated. Sign in with your new password.':''})};
    if(request.method!=='POST')return {response:new Response('Method not allowed',{status:405,headers:{Allow:'GET, POST','Cache-Control':'no-store'}})};
    if(!config)return {response:page({configured:false,status:503})};
    if(request.headers.get('origin')!==url.origin||request.headers.get('sec-fetch-site')==='cross-site')return {response:new Response('Invalid origin',{status:403})};
    if(Number(request.headers.get('content-length')||0)>4096)return {response:new Response('Form too large',{status:413})};
    const raw=await request.text();if(raw.length>4096)return {response:new Response('Form too large',{status:413})};
    const form=new URLSearchParams(raw),csrf=form.get('csrf'),target=safeReturnTo(form.get('return_to')||'/edit');
    const email=(form.get('email')||'').trim(),password=form.get('password')||'';
    const render=(message,status=400,options={})=>({response:page({mode,returnTo:target,csrf:csrf||'',email:email.slice(0,254),canReset:!!cookies.get(RECOVERY_ACCESS),message,status,...options})});
    if(!csrf||csrf!==cookies.get(CSRF))return render('Please try again using this form.',403,{csrf:''});
    try {
      if(mode==='sign-out') {
        const token=cookies.get(ACCESS);if(token){try{await api(config,'/logout?scope=local',{method:'POST',token},fetcher)}catch{}}
        return {response:redirectTo('/',[...clearCookies(),cookie(CSRF,'',0),cookie(RECOVERY_FLOW,'',0),cookie(RECOVERY_ACCESS,'',0)])};
      }
      if(mode==='reset-password') {
        const token=cookies.get(RECOVERY_ACCESS);if(!token)return render('Request a reset email and open its link before changing your password.',401,{canReset:false});
        if(password.length<12||password.length>128)return render('Use a password of 12 to 128 characters.');
        if(password!==form.get('password_confirm'))return render('The passwords do not match. Please enter them again.');
        const verified=await verifiedUser(config,token,fetcher);if(!verified.user)return render('Your reset session has expired. Request a new reset link.',401,{canReset:false,extraCookies:[cookie(RECOVERY_ACCESS,'',0)]});
        const result=await api(config,'/user',{method:'PUT',token,body:{password}},fetcher);
        if(!result.ok)return render(authFailure(result,mode),result.status===429?429:400);
        // End this recovery session; do not silently sign in the browser.
        try{await api(config,'/logout?scope=local',{method:'POST',token},fetcher)}catch{}
        return {response:redirectTo('/auth/sign-in?reset=success',[...clearCookies(),cookie(RECOVERY_FLOW,'',0),cookie(RECOVERY_ACCESS,'',0),cookie(CSRF,'',0)])};
      }
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return render('Enter a valid email address.');
      if(mode==='forgot-password') {
        const flow=await recoveryFlow();
        const result=await api(config,'/recover?redirect_to='+encodeURIComponent(url.origin+'/auth/callback'),{method:'POST',body:{email,code_challenge:flow.challenge,code_challenge_method:'s256'}},fetcher);
        if(!result.ok)return render(authFailure(result,mode),result.status===429?429:400);
        return render('If an account exists for this email, a reset link has been requested. Check your inbox and spam folder. Open it in this browser within the next 15 minutes.',200,{extraCookies:[cookie(RECOVERY_FLOW,flow.verifier,RECOVERY_SECONDS),cookie(RECOVERY_ACCESS,'',0)]});
      }
      if(password.length>128||password.length<(mode==='sign-up'?12:1))return render(mode==='sign-up'?'Use a password of 12 to 128 characters.':'Enter your password.');
      const endpoint=mode==='sign-up'?'/signup?redirect_to='+encodeURIComponent(url.origin+'/auth/sign-in'):'/token?grant_type=password';
      const result=await api(config,endpoint,{method:'POST',body:{email,password}},fetcher);
      if(!result.ok){console.warn(JSON.stringify({event:'auth_provider_failure',action:mode,status:result.status,code:['email_address_not_authorized','over_email_send_rate_limit','weak_password','signup_disabled','email_not_confirmed','email_address_invalid','email_provider_disabled','captcha_failed'].includes(result.data?.code)?result.data.code:'provider_error'}));return render(authFailure(result,mode),result.status===429?429:400)}
      if(!validSession(result.data))return {response:page({mode:'sign-in',returnTo:target,email,message:'Check your inbox and spam folder to confirm your email, then sign in.'})};
      const verified=await verifiedUser(config,result.data.access_token,fetcher);if(!verified.user)return render('We could not verify your account. Please try again.',401);
      return {response:redirectTo(target,[...sessionCookies(result.data),cookie(CSRF,'',0)])};
    }catch{return render('The account service is temporarily unavailable. Please try again shortly.',503)}
  }
  // Static assets require no account lookup.
  if (!config || url.pathname.startsWith('/_next/') || url.pathname === '/favicon.ico') return {request,cookies:[]};
  let access = cookies.get(ACCESS), refresh = cookies.get(REFRESH), updates = [];
  if (!access && !refresh) return {request,cookies:updates};
  try {
    let verified = access ? await verifiedUser(config,access,fetcher) : null;
    if (!verified?.user && (!verified || verified.status===401 || verified.status===403) && refresh) {
      const refreshed = await api(config,'/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:refresh}},fetcher);
      if (refreshed.ok && validSession(refreshed.data)) {
        verified = await verifiedUser(config,refreshed.data.access_token,fetcher);
        if (verified.user) updates = sessionCookies(refreshed.data);
      } else if (refreshed.status===400 || refreshed.status===401 || refreshed.status===403) updates = clearCookies();
    }
    if (verified?.user) {
      const h = new Headers(request.headers);
      h.set('oai-authenticated-user-id',verified.user.id);
      h.set('oai-authenticated-user-email',verified.user.email);
      // Display name remains a portfolio field, not a trusted identity claim.
      request = new Request(request,{headers:h});
    }
  } catch { /* Fail closed without deleting cookies during provider outages. */ }
  return {request,cookies:updates};
}
export function withSessionCookies(response,cookies=[]) {
  // Any account-specific response must bypass shared caches, even without refresh.
  const headers = new Headers(response.headers);
  headers.set('Cache-Control','private, no-store');
  headers.append('Vary','Cookie');
  for (const item of cookies) headers.append('Set-Cookie',item);
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

