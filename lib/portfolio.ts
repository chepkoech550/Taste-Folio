import { z } from 'zod';
const short=z.string().trim().max(160).default('');
const paragraph=z.string().trim().max(2000).default('');
const web=z.string().trim().max(500).refine(v=>!v||/^https:\/\//i.test(v)&&(()=>{try{const u=new URL(v);return !!u.hostname&&!u.username&&!u.password}catch{return false}})(),'Use a full https:// link').default('');
const image=z.string().refine(v=>!v||/^\/api\/media\/[a-f0-9-]{36}$/.test(v),'Upload an image through Taste Folio').default('');
export const projectSchema=z.object({id:short,title:short,kind:z.enum(['Client work','Employment','Personal project','Study project']).default('Client work'),context:paragraph,role:short,contribution:paragraph,outcome:paragraph,skills:z.array(short).max(20).default([]),image,link:web});
export const profileSchema=z.object({
 name:short,headline:short,location:short,bio:paragraph,skills:z.array(short).max(20).default([]),avatar:image,
 availability:z.array(z.enum(['Employment','Freelance projects','Collaborations'])).max(3).default([]),
 projects:z.array(projectSchema).max(8).default([]),
 experience:z.array(z.object({role:short,organisation:short,period:short,description:paragraph})).max(8).default([]),
 credentials:z.array(z.object({name:short,issuer:short,year:short,link:web})).max(8).default([]),
 service:short,rate:short,email:z.string().trim().max(200).refine(v=>!v||z.string().email().safeParse(v).success,'Enter a valid email').default(''),
 phone:z.string().trim().max(20).refine(v=>!v||/^[1-9]\d{7,14}$/.test(v),'Use country code and digits, for example 2547XXXXXXXX').default(''),
 mpesaType:z.enum(['','phone','till','paybill']).default(''),mpesaNumber:z.string().trim().max(15).default(''),mpesaAccount:short,paymentName:short,
 lightning:z.string().trim().max(200).refine(v=>!v||/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v),'Enter a Lightning address').default('')
}).superRefine((p,ctx)=>{if(p.mpesaType){let valid=p.mpesaType==='phone'?/^(?:0[17]\d{8}|254[17]\d{8})$/.test(p.mpesaNumber):/^\d{4,10}$/.test(p.mpesaNumber);if(!valid)ctx.addIssue({code:'custom',path:['mpesaNumber'],message:'Enter a valid receiving number'});if(!p.paymentName)ctx.addIssue({code:'custom',path:['paymentName'],message:'Add the recipient name'});if(p.mpesaType==='paybill'&&!p.mpesaAccount)ctx.addIssue({code:'custom',path:['mpesaAccount'],message:'Add a PayBill account number'})}});
export type Portfolio=z.infer<typeof profileSchema>;
export type Published={id:string;slug:string;profile:Portfolio;publishedAt:string;sample?:boolean};
export const emptyPortfolio:Portfolio={name:'',headline:'',location:'',bio:'',skills:[],avatar:'',availability:['Freelance projects'],projects:[],experience:[],credentials:[],service:'',rate:'',email:'',phone:'',mpesaType:'',mpesaNumber:'',mpesaAccount:'',paymentName:'',lightning:''};
export function publishErrors(p:Portfolio){let errors:string[]=[];if(!p.name)errors.push('Add your name.');if(!p.headline)errors.push('Add a clear professional headline.');if(!p.bio)errors.push('Write a short introduction.');if(!p.skills.length)errors.push('Add at least one skill.');if(!p.projects.length)errors.push('Add at least one project as evidence of your skills.');p.projects.forEach((w,i)=>{if(!w.title||!w.role||!w.contribution)errors.push(`Project ${i+1}: add a title, your role and your contribution.`)});if(!p.email&&!p.phone)errors.push('Add an email or WhatsApp number so people can contact you.');return errors}
export function imageIds(p:Portfolio){return [p.avatar,...p.projects.map(p=>p.image)].filter(Boolean).map(s=>s.split('/').pop()!)}
