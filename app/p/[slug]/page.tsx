import Ownwork from '../../ownwork';
import { getChatGPTUser } from '../../chatgpt-auth';
import {publicPitch} from '../../../lib/public-pitches';
export const dynamic='force-dynamic';
export default async function Profile({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <Ownwork signedIn={!!await getChatGPTUser()} mode="profile" initial={await publicPitch(slug)}/>}
