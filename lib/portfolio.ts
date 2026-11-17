import { z } from 'zod';
import { offersFor } from './offers';
import {usdCents,flashUsername} from './checkout-contract.mjs';
const short=z.string().trim().max(160).default('');
const paragraph=z.string().trim().max(2000).default('');
const web=z.string().trim().max(500).refine(v=>!v||/^https:\/\//i.test(v)&&(()=>{try{const u=new URL(v);return !!u.hostname&&!u.username&&!u.password}catch{return false}})(),'Use a full https:// link').default('');
const image=z.string().refine(v=>!v||/^\/api\/media\/[a-f0-9-]{36}$/.test(v),'Upload an image through Taste Folio').default('');
export const projectSchema=z.object({id:short,title:short,kind:z.enum(['Client work','Employment','Personal project','Study project']).default('Client work'),context:paragraph,role:short,contribution:paragraph,outcome:paragraph,skills:z.array(short).max(20).default([]),image,link:web});
export const offerSchema=z.object({id:short,title:short,description:z.string().trim().max(600).default(''),price:short,usdPrice:z.string().trim().max(8).refine(v=>!v||usdCents(v)!==null,'Enter a USD price from 0.01 to 10000.00, with up to two decimal places').optional()});
export const profileSchema=z.object({
 offers:z.array(offerSchema).max(3).optional(),
 name:short,headline:short,location:short,bio:paragraph,skills:z.array(short).max(20).default([]),avatar:image,
 availability:z.array(z.enum(['Employment','Freelance projects','Collaborations'])).max(3).default([]),
 projects:z.array(projectSchema).max(8).default([]),
 experience:z.array(z.object({role:short,organisation:short,period:short,description:paragraph})).max(8).default([]),
 credentials:z.array(z.object({name:short,issuer:short,year:short,link:web})).max(8).default([]),
 acceptTips:z.boolean().default(false),
 service:short,rate:short,email:z.string().trim().max(200).refine(v=>!v||z.string().email().safeParse(v).success,'Enter a valid email').default(''),
 phone:z.string().trim().max(20).refine(v=>!v||/^[1-9]\d{7,14}$/.test(v),'Use country code and digits, for example 2547XXXXXXXX').default(''),
 mpesaType:z.enum(['','phone','till','paybill']).default(''),mpesaNumber:z.string().trim().max(15).default(''),mpesaAccount:short,paymentName:short,
 lightning:z.string().trim().max(200).refine(v=>!v||/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v),'Enter a Lightning address').default('')
}).superRefine((p,ctx)=>{if(p.mpesaType){let valid=p.mpesaType==='phone'?/^(?:0[17]\d{8}|254[17]\d{8})$/.test(p.mpesaNumber):/^\d{4,10}$/.test(p.mpesaNumber);if(!valid)ctx.addIssue({code:'custom',path:['mpesaNumber'],message:'Enter a valid receiving number'});if(!p.paymentName)ctx.addIssue({code:'custom',path:['paymentName'],message:'Add the recipient name'});if(p.mpesaType==='paybill'&&!p.mpesaAccount)ctx.addIssue({code:'custom',path:['mpesaAccount'],message:'Add a PayBill account number'})}});
export type Portfolio=z.infer<typeof profileSchema>;
export type Published={id:string;slug:string;profile:Portfolio;publishedAt:string;sample?:boolean;nostrPubkey?:string;nostrNpub?:string};
export const emptyPortfolio:Portfolio={offers:[],name:'',headline:'',location:'',bio:'',skills:[],avatar:'',availability:['Freelance projects'],projects:[],experience:[],credentials:[],service:'',rate:'',email:'',phone:'',mpesaType:'',mpesaNumber:'',mpesaAccount:'',paymentName:'',lightning:'',acceptTips:false};
export function publishErrors(p:Portfolio){let errors:string[]=[];if(!p.name)errors.push('Add your name.');if(!p.headline)errors.push('Explain your value in one clear line.');if(!p.bio)errors.push('Write your pitch: who do you help and what can you do for them?');const offers=offersFor(p);if(offers.some(o=>o.usdPrice)&&!flashUsername(p.lightning))errors.push('Add your username@flashapp.me receiving address to accept USD offer payments.');if(new Set(offers.map(o=>o.id)).size!==offers.length||offers.some(o=>!o.id))errors.push('Each offer needs a unique ID. Remove and re-add any duplicate offer.');if(!offers.length)errors.push('Add at least one clear offer or contribution.');offers.forEach((o,i)=>{if(!o.title||!o.description)errors.push(`Offer ${i+1}: explain what you offer and what someone gets.`)});if(!p.skills.length)errors.push('Add at least one skill.');if(!p.projects.length)errors.push('Add at least one project as evidence of your skills.');p.projects.forEach((w,i)=>{if(!w.title||!w.role||!w.contribution)errors.push(`Project ${i+1}: add a title, your role and your contribution.`)});if(p.acceptTips&&!p.mpesaType&&!p.lightning)errors.push('Add M-Pesa or Lightning receiving details to accept tips.');if(!p.email&&!p.phone)errors.push('Add an email or WhatsApp number so people can contact you.');return errors}
export function imageIds(p:Portfolio){return [p.avatar,...p.projects.map(p=>p.image)].filter(Boolean).map(s=>s.split('/').pop()!)}

