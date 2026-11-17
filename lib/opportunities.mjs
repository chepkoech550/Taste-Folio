import {z} from 'zod';
import {usdCents,flashUsername} from './checkout-contract.mjs';
import {createCheckout,getCheckout} from './flash-checkout.mjs';
import {ensureWorkSchema} from './work-schema.mjs';
import {graphql} from './flash-invoice-test.mjs';

const required=max=>z.string().trim().min(1).max(max);
const money=z.string().trim().refine(v=>usdCents(v)!==null,'Enter a USD amount from 0.01 to 10000.00.');
export const opportunitySchema=z.object({
 buyerName:required(100),title:required(120),outcome:required(2000),criteria:required(1000),location:required(100),skills:z.array(required(60)).min(1).max(8),
 deadline:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>Number.isFinite(Date.parse(v+'T23:59:59Z'))&&new Date(v+'T23:59:59Z').toISOString().slice(0,10)===v&&Date.parse(v+'T23:59:59Z')>=Date.now(),'Choose a current or future date.'),
 budgetUsd:money,milestones:z.array(z.object({title:required(120),criteria:required(1000),usdPrice:money,kind:z.enum(['upfront','delivery'])})).min(1).max(3),
}).superRefine((p,ctx)=>{const sum=p.milestones.reduce((n,m)=>n+(usdCents(m.usdPrice)||0),0);if(sum!==usdCents(p.budgetUsd))ctx.addIssue({code:'custom',path:['milestones'],message:'Milestone amounts must equal the total budget.'})});
export class WorkError extends Error {constructor(message,code=400){super(message);this.code=code}}
const fail=(message,code=400)=>{throw new WorkError(message,code)};
const text=(value,max)=>{if(typeof value!=='string'||!value.trim()||value.trim().length>max)fail('Add a valid message.');return value.trim()};
const https=value=>{if(!value)return '';try{const u=new URL(value);if(u.protocol==='https:'&&!u.username&&!u.password&&value.length<=500)return value}catch{}fail('Use a full HTTPS evidence link.')};
export const validWorkId=id=>typeof id==='string'&&/^[a-f0-9-]{36}$/.test(id);
async function read(db,id){const row=await db.prepare('SELECT * FROM opportunities WHERE id=?').bind(id).first();if(!row)fail('Opportunity not found.',404);return {...JSON.parse(row.record),version:row.version}}
async function write(db,p){const now=new Date().toISOString();const result=await db.prepare('UPDATE opportunities SET seller_id=?,record=?,version=version+1,updated_at=? WHERE id=? AND version=?').bind(p.sellerId||null,JSON.stringify({...p,updatedAt:now}),now,p.id,p.version).run();if(result.meta.changes!==1)fail('This work changed while you were editing. Refresh and try again.',409);return {...p,version:p.version+1,updatedAt:now}}
export function workView(p,userId){
 const base={id:p.id,title:p.title,buyerName:p.buyerName,outcome:p.outcome,criteria:p.criteria,location:p.location,skills:p.skills,deadline:p.deadline,budgetCents:p.budgetCents,status:p.status,createdAt:p.createdAt,updatedAt:p.updatedAt,applicationsCount:p.applications.length,milestones:p.milestones.map(m=>({id:m.id,title:m.title,criteria:m.criteria,usdCents:m.usdCents,kind:m.kind}))};
 const buyer=!!userId&&userId===p.buyerId,selected=!!userId&&userId===p.sellerId;
 const ownApplication=p.applications.find(a=>a.sellerId===userId);
 if(buyer||selected)return {...base,role:buyer?'buyer':'seller',agreement:p.agreement,sellerName:p.sellerName||'',sellerSlug:p.sellerSlug||'',sellerLightning:p.sellerLightning||'',canAccept:selected&&p.agreement==='pending',applications:buyer?p.applications.map(({sellerId,...a})=>({...a,id:sellerId})):undefined,milestones:p.milestones.map(m=>({...m})),canApply:false};
 return {...base,role:ownApplication?'applicant':'visitor',myApplication:ownApplication?{proposal:ownApplication.proposal,status:ownApplication.status}:undefined,canApply:!!userId&&p.status==='open'&&Date.parse(p.deadline+'T23:59:59Z')>=Date.now()&&!ownApplication};
}
export async function listOpportunities(db,userId,{mine=false,page=0}={}){
 await ensureWorkSchema(db);const count=20,offset=Math.max(0,Math.min(10000,Math.floor(Number(page)||0)))*count;
 const where=mine?'WHERE buyer_id=? OR seller_id=? OR EXISTS (SELECT 1 FROM json_each(opportunities.record,\'$.applications\') WHERE json_extract(value,\'$.sellerId\')=?)':"WHERE json_extract(record,'$.status')='open'";
 const sql=`SELECT record,version FROM opportunities ${where} ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`;
 const bindings=mine?[userId,userId,userId,count+1,offset]:[count+1,offset];const rows=await db.prepare(sql).bind(...bindings).all();
 return {opportunities:rows.results.slice(0,count).map(r=>workView({...JSON.parse(r.record),version:r.version},userId)),hasMore:rows.results.length>count};
}
export async function createOpportunity(db,userId,input){
 await ensureWorkSchema(db);const parsed=opportunitySchema.safeParse(input);if(!parsed.success)fail(parsed.error.issues.map(i=>i.message).join(' '));const v=parsed.data;
 const cap=await db.prepare('SELECT COUNT(*) AS n FROM opportunities WHERE buyer_id=?').bind(userId).first();if(cap.n>=50)fail('The pilot supports up to 50 opportunities per buyer.');
 const now=new Date().toISOString(),p={id:crypto.randomUUID(),buyerId:userId,buyerName:v.buyerName,title:v.title,outcome:v.outcome,criteria:v.criteria,location:v.location,skills:[...new Set(v.skills)],deadline:v.deadline,budgetCents:usdCents(v.budgetUsd),status:'open',agreement:'none',applications:[],milestones:v.milestones.map(m=>({id:crypto.randomUUID(),title:m.title,criteria:m.criteria,usdCents:usdCents(m.usdPrice),kind:m.kind,state:'agreed_later',payment:'unpaid',delivery:null,feedback:'',checkoutId:null})),createdAt:now,updatedAt:now,version:1};
 await db.prepare('INSERT INTO opportunities(id,buyer_id,record,version,created_at,updated_at) VALUES(?,?,?,1,?,?)').bind(p.id,userId,JSON.stringify(p),now,now).run();return {opportunity:workView(p,userId)};
}
export async function opportunityDetail(db,id,userId){await ensureWorkSchema(db);return {opportunity:workView(await read(db,id),userId)}}
export async function changeOpportunity(db,env,id,userId,input){
 await ensureWorkSchema(db);let p=await read(db,id);const buyer=p.buyerId===userId,selected=p.sellerId===userId;
 const action=input.action;
 if(action==='apply'){
  if(buyer||p.status!=='open'||Date.parse(p.deadline+'T23:59:59Z')<Date.now()||p.applications.some(a=>a.sellerId===userId))fail('You cannot apply to this opportunity.');if(p.applications.length>=20)fail('This opportunity has reached its pilot application limit.');
  const profile=await db.prepare('SELECT slug,published FROM portfolios WHERE owner_id=? AND published IS NOT NULL').bind(userId).first();if(!profile)fail('Publish your pitch before applying.');const seller=JSON.parse(profile.published);
  p.applications.push({sellerId:userId,name:seller.name,slug:profile.slug,proposal:text(input.proposal,1200),status:'applied',createdAt:new Date().toISOString()});
 }else if(action==='withdraw'){
  if(p.sellerId===userId)fail('Decline the selection before withdrawing.');const app=p.applications.find(a=>a.sellerId===userId);if(!app)fail('Application not found.',404);app.status='withdrawn';
 }else if(action==='select'){
  if(!buyer)fail('Only the buyer can select a professional.',403);if(p.status!=='open')fail('A selection is already in progress.');const app=p.applications.find(a=>a.sellerId===input.applicationId&&a.status==='applied');if(!app)fail('Application is unavailable.');p.sellerId=app.sellerId;p.sellerName=app.name;p.sellerSlug=app.slug;p.agreement='pending';p.status='selection';
 }else if(action==='accept'){
  if(!selected)fail('Only the selected professional can accept.',403);if(p.agreement!=='pending')fail('This selection is no longer pending.');
  const row=await db.prepare('SELECT slug,published FROM portfolios WHERE owner_id=? AND published IS NOT NULL').bind(userId).first();if(!row)fail('Keep your pitch published to accept work.');const profile=JSON.parse(row.published);if(!flashUsername(profile.lightning))fail('Publish your Flash receiving address before accepting work.');
  const wallet=await graphql(env,'query TasteFolioWorkRecipient($username: Username!) { recipient: accountDefaultWallet(username: $username, walletCurrency: USD) { id walletCurrency } globals { network } }',{username:flashUsername(profile.lightning)},fetch);
  if(wallet.status||wallet.data?.recipient?.walletCurrency!=='USD'||!wallet.data?.recipient?.id||wallet.data?.globals?.network!=='mainnet')fail('Your Flash USD receiving account could not be verified. Check your published address and try again.',503);
  p.sellerName=profile.name;p.sellerSlug=row.slug;p.sellerLightning=profile.lightning;p.agreement='accepted';p.acceptedAt=new Date().toISOString();p.status='active';p.milestones=p.milestones.map(m=>({...m,state:m.kind==='upfront'?'approved':'in_progress'}));
 }else if(action==='decline'){
  if(!selected||p.agreement!=='pending')fail('Only the selected professional can decline a pending selection.',403);p.applications.find(a=>a.sellerId===userId).status='declined';p.sellerId=null;p.sellerName='';p.sellerSlug='';p.status='open';p.agreement='none';
 }else if(action==='close'){
  if(!buyer)fail('Only the buyer can close this opportunity.',403);if(p.agreement==='accepted')fail('Active work must be completed through its agreed milestones.');p.status='closed';p.agreement='closed';
 }else{
  if(!buyer&&!selected)fail('Only the agreed buyer and professional can manage milestones.',403);if(p.agreement!=='accepted')fail('Both parties must agree the work first.');const m=p.milestones.find(m=>m.id===input.milestoneId);if(!m)fail('Milestone not found.',404);
  if(action==='deliver'){
   if(!selected)fail('Only the professional can submit work.',403);if(m.kind!=='delivery'||m.payment==='paid'||m.state==='approved')fail('This milestone cannot accept another delivery.');m.delivery={note:text(input.note,2000),url:https(input.url),submittedAt:new Date().toISOString()};m.state='submitted';m.feedback='';
  }else if(action==='approve'||action==='request_changes'){
   if(!buyer)fail('Only the buyer can review delivery.',403);if(m.state!=='submitted')fail('A delivery must be submitted first.');if(action==='approve'){m.state='approved';m.approvedAt=new Date().toISOString()}else{m.state='changes_requested';m.feedback=text(input.note,1000)}
  }else if(action==='pay'||action==='new_invoice'||action==='check_payment'){
   if(action!=='check_payment'&&!buyer)fail('Only the buyer can create a payment request.',403);if(m.state!=='approved')fail('This milestone is not approved for payment.');
   if(action==='check_payment'){
    if(!m.checkoutId)fail('No invoice has been created yet.');const result=await getCheckout(env,m.checkoutId);if(result.code)fail(result.error,result.code);
    if(result.checkout.paymentStatus==='PAID'){for(let attempt=0;attempt<3;attempt++){const latest=await read(db,id),item=latest.milestones.find(x=>x.id===m.id);if(item.checkoutId!==m.checkoutId)fail('The invoice changed. Refresh the work page.',409);item.payment='paid';item.paidAt=new Date().toISOString();if(latest.milestones.every(x=>x.payment==='paid'))latest.status='completed';try{p=await write(db,latest);break}catch(error){if(error.code!==409||attempt===2)throw error}}}
    return {opportunity:workView(p,userId),...result};
   }
   if(m.payment==='paid')fail('This milestone is already paid.');
   if(action==='new_invoice'&&m.checkoutId){const old=await getCheckout(env,m.checkoutId);if(old.code)fail('Check the earlier invoice before starting again.');if(old.checkout.paymentStatus==='PAID')fail('Flash confirms the earlier invoice is paid. Check payment status to update the milestone.');if(old.checkout.paymentStatus!=='EXPIRED'&&!(old.checkout.stage==='failed'&&Date.now()>old.checkout.retryAt))fail('Flash has not confirmed expiry. Check the earlier payment before replacing it.');m.checkoutId=null;}
   if(!m.checkoutId){m.checkoutId=crypto.randomUUID();p=await write(db,p)}
   const result=await createCheckout(env,{id:m.checkoutId,offerId:m.id,slug:id},{id:'work:'+p.id,slug:id,profile:{name:p.sellerName,lightning:p.sellerLightning,offers:[{id:m.id,title:m.title,usdPrice:(m.usdCents/100).toFixed(2)}]}});
   if(result.code)fail(result.error,result.code);return {opportunity:workView(p,userId),...result};
  }else fail('Unknown work action.');
 }
 p=await write(db,p);return {opportunity:workView(p,userId)};
}
