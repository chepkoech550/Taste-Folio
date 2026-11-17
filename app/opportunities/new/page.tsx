import {requireChatGPTUser} from '../../chatgpt-auth';
import {NewOpportunity} from '../../work-ui';
export const dynamic='force-dynamic';
export default async function New(){await requireChatGPTUser('/opportunities/new');return <NewOpportunity/>}
