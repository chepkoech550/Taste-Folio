import Ownwork from './ownwork';
import {getChatGPTUser} from './chatgpt-auth';
import {publicPitches} from '../lib/public-pitches';
export const dynamic='force-dynamic';
export default async function Home(){
 const [user,people]=await Promise.all([getChatGPTUser(),publicPitches()]);
 return <Ownwork signedIn={!!user} mode="browse" initialItems={people}/>;
}

