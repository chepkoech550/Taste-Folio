import {getChatGPTUser} from '../chatgpt-auth';
import {OpportunityBoard} from '../work-ui';
export const dynamic='force-dynamic';
export default async function Opportunities(){return <OpportunityBoard signedIn={!!await getChatGPTUser()}/>}
