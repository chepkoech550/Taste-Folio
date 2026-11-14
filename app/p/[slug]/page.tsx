import Ownwork from '../../ownwork';
import { getChatGPTUser } from '../../chatgpt-auth';
import { db } from '../../../lib/server';
export const dynamic='force-dynamic';
export default async function Profile({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const row=await db().prepare('SELECT id,slug,published,published_at FROM portfolios WHERE slug=? AND published IS NOT NULL').bind(slug).first<any>();return <Ownwork signedIn={!!await getChatGPTUser()} mode="profile" initial={row?{id:row.id,slug:row.slug,profile:JSON.parse(row.published),publishedAt:row.published_at}:null}/>}
