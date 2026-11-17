import { requireChatGPTUser } from '../../chatgpt-auth';
import FlashConnection from './connection';
import { db } from '../../../lib/server';
import { FLASH_TEST_OWNER_SLUG } from '../../../lib/flash-invoice-test.mjs';

export const dynamic = 'force-dynamic';

export default async function FlashSettings() {
  const user = await requireChatGPTUser('/settings/flash');
  const pilot = await db().prepare('SELECT owner_id FROM portfolios WHERE slug=?').bind(FLASH_TEST_OWNER_SLUG).first<{ owner_id: string }>();
  return <FlashConnection canTestInvoice={pilot?.owner_id === user.userId} />;
}
