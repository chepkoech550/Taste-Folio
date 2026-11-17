import { owner, response, env } from '../../../../lib/server';
import { checkFlashConnection } from '../../../../lib/flash.mjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return response({ error: 'Invalid origin.' }, 403);
  }
  if (!await owner()) return response({ error: 'Sign in to check the payment connection.' }, 401);
  const result = await checkFlashConnection(env);
  return response(result);
}
