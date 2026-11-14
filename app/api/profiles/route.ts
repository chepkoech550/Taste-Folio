import { db,response } from '../../../lib/server';
export const dynamic='force-dynamic';
export async function GET(){const rows=await db().prepare('SELECT id,slug,published,published_at FROM portfolios WHERE published IS NOT NULL ORDER BY published_at DESC LIMIT 100').all<any>();return response({profiles:rows.results.map(r=>({id:r.id,slug:r.slug,profile:JSON.parse(r.published),publishedAt:r.published_at}))})}
