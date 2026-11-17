import {requireChatGPTUser} from '../chatgpt-auth';
import {OpportunityBoard} from '../work-ui';
export const dynamic='force-dynamic';
export default async function MyWork(){await requireChatGPTUser('/work');return <OpportunityBoard signedIn mine/>}
