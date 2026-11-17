import { requireChatGPTUser } from '../../chatgpt-auth';
import FlashConnection from './connection';

export const dynamic = 'force-dynamic';

export default async function FlashSettings() {
  await requireChatGPTUser('/settings/flash');
  return <FlashConnection />;
}
