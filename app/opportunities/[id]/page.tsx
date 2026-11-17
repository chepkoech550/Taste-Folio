import {getChatGPTUser} from '../../chatgpt-auth';
import {db} from '../../../lib/server';
import {opportunityDetail,validWorkId} from '../../../lib/opportunities.mjs';
import {WorkDetail} from '../../work-ui';
export const dynamic='force-dynamic';
export default async function Detail({params}:{params:Promise<{id:string}>}){const {id}=await params,user=await getChatGPTUser();if(!validWorkId(id))return <main className="work-shell"><h1>Opportunity not found.</h1><a href="/opportunities">Find paid work</a></main>;try{const result=await opportunityDetail(db(),id,user?.userId||null);return <WorkDetail initial={result.opportunity} signedIn={!!user}/>}catch{return <main className="work-shell"><h1>This opportunity is unavailable.</h1><a href="/opportunities">Find paid work</a></main>}}
