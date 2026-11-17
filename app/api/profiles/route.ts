import { response } from '../../../lib/server';
import {publicPitches} from '../../../lib/public-pitches';
export const dynamic='force-dynamic';
export async function GET(){return response({profiles:await publicPitches()})}
