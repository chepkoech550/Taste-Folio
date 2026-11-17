import test from 'node:test';
import assert from 'node:assert/strict';
import { checkFlashConnection } from '../lib/flash.mjs';

const env = { FLASH_API_URL: 'https://api.flashapp.me/graphql', FLASH_API_KEY: 'fk_fixture_secret' };
test('missing settings and unapproved endpoints never send credentials', async () => {
  const noFetch = async () => { throw new Error('Must not fetch'); };
  assert.deepEqual(await checkFlashConnection({}, noFetch), { status: 'not_configured' });
  for (const url of ['http://api.flashapp.me/graphql', 'https://example.test/graphql', 'https://api.flashapp.me.attacker.test/graphql']) {
    assert.deepEqual(await checkFlashConnection({ ...env, FLASH_API_URL: url }, noFetch), { status: 'invalid_endpoint' });
  }
});
test('authenticated check is read-only and never exposes account details or key', async () => {
  const result = await checkFlashConnection(env, async (url, init) => {
    assert.equal(url, env.FLASH_API_URL);
    assert.equal(init.headers['X-API-KEY'], env.FLASH_API_KEY);
    assert.equal(init.redirect, 'error');
    assert(!JSON.parse(init.body).query.includes('mutation'));
    return Response.json({ data: { me: { defaultAccount: { wallets: [{ walletCurrency: 'BTC', id: 'private-wallet-id' }] } } } });
  });
  assert.deepEqual(result, { status: 'connected' });
});
test('authentication, permissions and upstream failures are distinct', async () => {
  for (const [code, status] of [[401, 'unauthorized'], [403, 'permissions'], [500, 'provider_error']]) {
    assert.deepEqual(await checkFlashConnection(env, async () => new Response('sensitive provider body', { status: code })), { status });
  }
  for (const [code, status] of [['UNAUTHENTICATED', 'unauthorized'], ['FORBIDDEN', 'permissions'], ['UNKNOWN', 'provider_error']]) {
    const body = { data: { me: { defaultAccount: { wallets: [{ walletCurrency: 'BTC' }] } } }, errors: [{ message: 'sensitive', extensions: { code } }] };
    assert.deepEqual(await checkFlashConnection(env, async () => Response.json(body)), { status });
  }
});
test('malformed responses and transport failure never report success', async () => {
  for (const body of [{}, { data: { me: null } }, { data: { me: { defaultAccount: { wallets: [] } } } }]) {
    assert.deepEqual(await checkFlashConnection(env, async () => Response.json(body)), { status: 'provider_error' });
  }
  assert.deepEqual(await checkFlashConnection(env, async () => { throw new Error(env.FLASH_API_KEY); }), { status: 'unavailable' });
});
