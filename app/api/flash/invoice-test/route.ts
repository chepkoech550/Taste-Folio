import { db, owner, response, env } from '../../../../lib/server';
import { FLASH_TEST_OWNER_SLUG, flashInvoiceTest } from '../../../../lib/flash-invoice-test.mjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return response({ error: 'Invalid origin.' }, 403);
  const user = await owner();
  if (!user) return response({ error: 'Sign in to run the invoice test.' }, 401);
  const allowed = await db().prepare('SELECT owner_id FROM portfolios WHERE slug=?').bind(FLASH_TEST_OWNER_SLUG).first<{ owner_id: string }>();
  if (allowed?.owner_id !== user) return response({ error: 'This private invoice test is available only to the pilot owner.' }, 403);
  if (Number(request.headers.get('content-length') || 0) > 100) return response({ error: 'Invalid request.' }, 400);
  let action;
  try {
    const raw = await request.text();
    if (raw.length > 100) return response({ error: 'Invalid request.' }, 400);
    action = JSON.parse(raw).action;
  } catch { return response({ error: 'Invalid request.' }, 400); }
  if (action !== 'create' && action !== 'status') return response({ error: 'Invalid action.' }, 400);
  try {
    return response(await flashInvoiceTest(env, user, action));
  } catch {
    return response({ status: 'storage_unavailable' });
  }
}
