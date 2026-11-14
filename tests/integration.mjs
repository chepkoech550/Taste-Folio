import { Miniflare } from 'miniflare';
import { unstable_getMiniflareWorkerOptions } from 'wrangler';
import { dirname,resolve } from 'node:path';
import { readFileSync,readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const options=unstable_getMiniflareWorkerOptions('dist/server/wrangler.json');
const rootDir=dirname(options.main);const files=readdirSync(rootDir,{recursive:true}).filter(f=>/\.m?js$/.test(f)&&f!=='index.js');const modules=['index.js',...files].map(f=>({type:'ESModule',path:resolve(rootDir,f)}));const mf=new Miniflare({...options.workerOptions,modules,modulesRoot:rootDir,cf:false});
try{
 const db=await mf.getD1Database('DB');for(const sql of readFileSync('drizzle/0000_fat_daredevil.sql','utf8').split('--> statement-breakpoint').filter(s=>s.trim()))await db.prepare(sql).run();
 const root='https://ownwork.test';
 const identity={'oai-authenticated-user-id':'qa-portfolio-owner','oai-authenticated-user-email':'qa@example.test'};
 async function call(path,method='GET',body,headers={}){const r=await mf.dispatchFetch(root+path,{method,headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});let value;try{value=await r.json()}catch{}return {r,value}}
 let p={name:'QA Portfolio',headline:'Indoor plant stylist',location:'Nairobi',bio:'Test portfolio for the publishing journey.',skills:['Plant selection'],availability:['Freelance projects'],projects:[{id:'project-1',title:'Office styling',kind:'Personal project',context:'A test brief.',role:'Stylist',contribution:'Selected plants and planned placement.',outcome:'Documented a placement plan.',skills:['Plant selection'],image:'',link:'https://example.com/work'}],email:'qa@example.test'};
 assert.equal((await call('/api/portfolio','POST',{profile:p,action:'publish'})).r.status,401);
 assert.equal((await call('/api/portfolio','POST',{profile:p,action:'publish'},{...identity,Origin:'https://other.example'})).r.status,403);
 assert.equal((await call('/api/portfolio','POST',{profile:{...p,projects:[]},action:'publish'},identity)).r.status,400);
 let draft=await call('/api/portfolio','POST',{profile:p,action:'draft'},identity);assert.equal(draft.r.status,200,JSON.stringify(draft.value));let slug=draft.value.slug;
 assert(!(await call('/api/profiles')).value.profiles.some(x=>x.slug===slug));
 assert.equal((await call('/api/portfolio','POST',{profile:p,action:'publish'},identity)).r.status,200);
 assert((await call('/api/profiles')).value.profiles.some(x=>x.slug===slug&&x.profile.name==='QA Portfolio'));
 let other=await call('/api/portfolio','GET',undefined,{'oai-authenticated-user-id':'qa-other','oai-authenticated-user-email':'other@example.test'});assert.equal(other.value.portfolio,null);
 await call('/api/portfolio','POST',{profile:{...p,name:'Edited draft'},action:'draft'},identity);assert.equal((await call('/api/profiles')).value.profiles.find(x=>x.slug===slug).profile.name,'QA Portfolio');
 const page=await mf.dispatchFetch(root+'/p/'+slug);assert.equal(page.status,200);assert((await page.text()).includes('Selected work'));
 const file=new File([Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=','base64'))],'pixel.png',{type:'image/png'});let form=new FormData();form.append('file',file);const uploadRequest=new Request(root+'/api/upload',{method:'POST',headers:identity,body:form});let uploaded=await mf.dispatchFetch(root+'/api/upload',{method:'POST',headers:Object.fromEntries(uploadRequest.headers),body:await uploadRequest.arrayBuffer()});let uploadResult=await uploaded.json();assert.equal(uploaded.status,200,JSON.stringify(uploadResult));let {url}=uploadResult;assert.equal((await mf.dispatchFetch(root+url)).status,404);assert.equal((await mf.dispatchFetch(root+url,{headers:identity})).status,200);
 assert.equal((await call('/api/portfolio','POST',{profile:{...p,avatar:url},action:'publish'},{'oai-authenticated-user-id':'qa-other','oai-authenticated-user-email':'other@example.test'})).r.status,400);
 p.projects[0].image=url;assert.equal((await call('/api/portfolio','POST',{profile:p,action:'publish'},identity)).r.status,200);assert.equal((await mf.dispatchFetch(root+url)).status,200);
 await call('/api/portfolio','POST',{profile:p,action:'unpublish'},identity);assert(!(await call('/api/profiles')).value.profiles.some(x=>x.slug===slug));assert.equal((await mf.dispatchFetch(root+url)).status,404);
 assert.equal((await call('/api/portfolio','POST',{profile:{...p,projects:[{...p.projects[0],link:'javascript:alert(1)'}]},action:'draft'},identity)).r.status,400);
 console.log('Passed: auth, origin checks, publish validation, drafts, published snapshots, owner isolation, SSR portfolios, image upload/access, unpublishing and unsafe-link rejection.');
}finally{await mf.dispose()}
