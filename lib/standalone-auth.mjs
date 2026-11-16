// Standalone Cloudflare authentication. Only verified Supabase users become
// the trusted identity consumed by the existing portfolio ownership checks.
const ACCESS = '__Host-tf-access';
const REFRESH = '__Host-tf-refresh';
const CSRF = '__Host-tf-csrf';
const WEEK = 7 * 24 * 60 * 60;
const AUTH_PATHS = new Set(['/auth/sign-in','/auth/sign-up','/auth/sign-out','/signin-with-chatgpt','/signout-with-chatgpt']);
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
  const headers = new Headers({Location:path,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'});
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
function page({mode='sign-in',returnTo='/edit',message='',status=200,configured=true,csrf=''}) {
  const token = csrf || crypto.randomUUID();
  const signup = mode === 'sign-up', logout = mode === 'sign-out';
  const title = logout ? 'Sign out?' : signup ? 'Let your work speak.' : 'Your work belongs here.';
  const action = logout ? '/auth/sign-out' : signup ? '/auth/sign-up' : '/auth/sign-in';
  const form = !configured ? '<p class="notice" role="status">Sign in is being connected. You can browse portfolios or continue drafting on this device.</p><a class="primary" href="/edit">Continue your draft</a>' : `<form method="post" action="${action}"><input type="hidden" name="csrf" value="${escapeHtml(token)}"><input type="hidden" name="return_to" value="${escapeHtml(returnTo)}">${logout ? '<p>Your portfolio stays saved to your account.</p>' : `<label for="email">Email address</label><input id="email" type="email" name="email" autocomplete="email" maxlength="254" required><label for="password">Password</label><input id="password" type="password" name="password" autocomplete="${signup?'new-password':'current-password'}" minlength="${signup?12:1}" maxlength="128" required>${signup?'<small>Use at least 12 characters. You will receive a confirmation email.</small>':''}`}<button class="primary" type="submit">${logout?'Sign out':signup?'Create account':'Sign in'}</button></form>${logout?'<a class="switch" href="/edit">Return to your portfolio</a>':`<p class="switch">${signup?'Already have an account?':'New to Taste Folio?'} <a href="/auth/${signup?'sign-in':'sign-up'}?return_to=${encodeURIComponent(returnTo)}">${signup?'Sign in':'Create an account'}</a></p>`}`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${logout?'Sign out':signup?'Create account':'Sign in'} | Taste Folio</title><style>*{box-sizing:border-box}body{margin:0;background:#faf7f2;color:#34151e;font:16px/1.6 system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:32px 24px}.brand{font:700 24px Georgia,serif;color:#601d35;text-decoration:none}.grid{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;min-height:78vh}.story{max-width:440px}.eyebrow{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#805d21}h1{font:clamp(38px,5vw,64px)/1.12 Georgia,serif;margin:20px 0}.story p{color:#6b5c61;font-size:18px}.card{background:white;padding:36px;border:1px solid #e6dce0;border-radius:20px;box-shadow:0 16px 48px #601d3508}h2{font:28px Georgia,serif;margin-top:0}label{display:block;margin:20px 0 6px;font-weight:600}input{width:100%;padding:13px;border:1px solid #bbaab0;border-radius:9px;font:inherit}input:focus-visible,a:focus-visible,button:focus-visible{outline:3px solid #c39642;outline-offset:3px}.primary{display:block;width:100%;padding:14px 20px;margin-top:24px;background:#601d35;color:#fff;border:0;border-radius:9px;font:600 16px system-ui;text-align:center;text-decoration:none;cursor:pointer}a{color:#601d35}small{display:block;color:#6b5c61;margin-top:8px}.switch{text-align:center;font-size:14px;margin:24px 0 0}.notice{padding:14px;background:#fbf3df;border-left:3px solid #b78a36;color:#514328}.back{display:inline-block;margin-top:24px;font-size:14px}.footer{font-size:13px;color:#74666b}@media(max-width:700px){main{padding:24px 20px}.grid{grid-template-columns:1fr;gap:28px;min-height:0;padding:40px 0}.story p{font-size:16px}.card{padding:26px}h1{font-size:42px}}</style></head><body><main><a class="brand" href="/">Taste Folio<span style="color:#b78a36">.</span></a><div class="grid"><section class="story"><span class="eyebrow">Your skills. Your story.</span><h1>${title}</h1><p>Show what you do, share the work behind it, and give people a reason to choose you.</p><a class="back" href="/">Browse portfolios</a></section><section class="card" aria-label="Account"><h2>${logout?'Leave your account securely':signup?'Create your account':'Welcome back'}</h2>${message?`<p class="notice" role="status">${escapeHtml(message)}</p>`:''}${form}</section></div><p class="footer">Your portfolio details become public when you publish. Your account password stays private.</p></main></body></html>`;
  return new Response(html,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",'Set-Cookie':cookie(CSRF,token,3600)}});
}
/** Intercept account routes or return a sanitised, provider-verified request. */
export async function authenticateRequest(request,env,fetcher=fetch) {
  const headers = new Headers(request.headers);
  for (const name of [...headers.keys()]) if (name.toLowerCase().startsWith('oai-authenticated-')) headers.delete(name);
  request = new Request(request,{headers});
  const url = new URL(request.url), config = configuration(env), cookies = readCookies(request);
  const returnTo = safeReturnTo(url.searchParams.get('return_to') || '/edit');
  if (AUTH_PATHS.has(url.pathname)) {
    const mode = url.pathname.includes('signout') || url.pathname.endsWith('sign-out') ? 'sign-out' : url.pathname.endsWith('sign-up') ? 'sign-up' : 'sign-in';
    if (request.method === 'GET') return {response:page({mode,returnTo,configured:!!config})};
    if (request.method !== 'POST') return {response:new Response('Method not allowed',{status:405,headers:{Allow:'GET, POST','Cache-Control':'no-store'}})};
    if (!config) return {response:page({configured:false,status:503})};
    if (request.headers.get('origin') !== url.origin || request.headers.get('sec-fetch-site') === 'cross-site') return {response:new Response('Invalid origin',{status:403})};
    if (Number(request.headers.get('content-length') || 0) > 4096) return {response:new Response('Form too large',{status:413})};
    const raw = await request.text();
    if (raw.length > 4096) return {response:new Response('Form too large',{status:413})};
    const form = new URLSearchParams(raw), csrf = form.get('csrf');
    const target = safeReturnTo(form.get('return_to') || '/edit');
    if (!csrf || csrf !== cookies.get(CSRF)) return {response:page({mode,returnTo:target,message:'Please try again using this form.',status:403})};
    try {
      if (mode === 'sign-out') {
        const token = cookies.get(ACCESS);
        if (token) { try { await api(config,'/logout?scope=local',{method:'POST',token},fetcher); } catch { /* Clear this browser even during provider outages. */ } }
        return {response:redirectTo('/',[...clearCookies(),cookie(CSRF,'',0)])};
      }
      const email = (form.get('email') || '').trim(), password = form.get('password') || '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length > 128 || password.length < (mode === 'sign-up'?12:1)) return {response:page({mode,returnTo:target,csrf,message:'Enter a valid email and '+(mode==='sign-up'?'a password of at least 12 characters.':'your password.'),status:400})};
      const endpoint = mode === 'sign-up' ? '/signup?redirect_to='+encodeURIComponent(url.origin+'/auth/sign-in') : '/token?grant_type=password';
      const result = await api(config,endpoint,{method:'POST',body:{email,password}},fetcher);
      if (!result.ok) return {response:page({mode,returnTo:target,csrf,message:result.status===429?'Too many attempts. Please wait before trying again.':mode==='sign-up'?'We could not create the account. Try again, or sign in if you already registered.':'Check your email and password. If you just registered, confirm your email first.',status:result.status===429?429:400})};
      if (!validSession(result.data)) return {response:page({mode:'sign-in',returnTo:target,message:'Check your inbox to confirm your email, then sign in.'})};
      const verified = await verifiedUser(config,result.data.access_token,fetcher);
      if (!verified.user) return {response:page({mode,returnTo:target,message:'We could not verify your account. Please try again.',status:401})};
      return {response:redirectTo(target,[...sessionCookies(result.data),cookie(CSRF,'',0)])};
    } catch { return {response:page({mode,returnTo:target,csrf,message:'Sign in is temporarily unavailable. Please try again shortly.',status:503})}; }
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
