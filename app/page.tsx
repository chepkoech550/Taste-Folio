import Ownwork from './ownwork';
import {getChatGPTUser} from './chatgpt-auth';
import {db} from '../lib/server';
export const dynamic='force-dynamic';
export default async function Home(){
 const [user,rows]=await Promise.all([getChatGPTUser(),db().prepare('SELECT id,slug,published,published_at FROM portfolios WHERE published IS NOT NULL ORDER BY published_at DESC LIMIT 100').all<any>()]);
 const people=rows.results.map(r=>({id:r.id,slug:r.slug,profile:JSON.parse(r.published),publishedAt:r.published_at}));
 return <Ownwork signedIn={!!user} mode="browse" initialItems={people}/>;
}
