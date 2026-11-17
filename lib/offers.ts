import type {Portfolio} from './portfolio';
export type Offer={id:string;title:string;description:string;price:string;usdPrice?:string};
// An absent offers field identifies an older record. An explicit empty array
// means the owner removed all offers; never silently resurrect a legacy service.
export function offersFor(p:Portfolio):Offer[]{
 if(Array.isArray(p.offers))return p.offers;
 return p.service?[{id:'legacy-service',title:p.service,description:p.bio.slice(0,600),price:p.rate}]:[];
}
export function preparePitch(p:Portfolio):Portfolio{return {...p,offers:offersFor(p)}}
export function matchesNeed(p:Portfolio,query:string){
 const text=[p.name,p.headline,p.bio,p.location,...p.skills,...offersFor(p).flatMap(o=>[o.title,o.description])].join(' ').toLowerCase();
 return query.toLowerCase().trim().split(/\s+/).filter(Boolean).every(word=>text.includes(word));
}
export function enquiryLink(p:Portfolio,title?:string){
 const message=`Hi ${p.name}, I saw your Taste Folio pitch${title?` and I'm interested in ${title}`:" and I'd like to discuss working together"}.`;
 if(p.phone)return `https://wa.me/${p.phone}?text=${encodeURIComponent(message)}`;
 if(p.email)return `mailto:${p.email}?subject=${encodeURIComponent(title?'Enquiry: '+title:'Let’s work together')}&body=${encodeURIComponent(message)}`;
 return '';
}

