import { notFound } from 'next/navigation';
import { db } from '../../../../lib/server';
import CardStudio from '../../../portfolio-card';
export const dynamic='force-dynamic';
export default async function PortfolioCard({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const row=await db().prepare('SELECT slug,published FROM portfolios WHERE slug=? AND published IS NOT NULL').bind(slug).first<{slug:string;published:string}>();
 if(!row)notFound();
 const p=JSON.parse(row.published);
 // Only explicitly selected public snapshot fields reach the card designer.
 return <CardStudio slug={row.slug} name={p.name} headline={p.headline} phone={p.phone||''} email={p.email||''} acceptTips={!!p.acceptTips}/>;
}
