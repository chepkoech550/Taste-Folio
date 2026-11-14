import Ownwork from './ownwork';
import { getChatGPTUser } from './chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Home(){return <Ownwork signedIn={!!await getChatGPTUser()} mode="browse"/>}
