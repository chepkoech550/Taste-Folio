import test from 'node:test';
import assert from 'node:assert/strict';
import { checkFlashConnection } from '../lib/flash.mjs';
import { flashInvoiceTest } from '../lib/flash-invoice-test.mjs';

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
    assert.equal(init.redirect, 'manual');
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

test('redirects never forward credentials and unreadable responses are distinct', async () => {
  let calls = 0;
  assert.deepEqual(await checkFlashConnection(env, async (_url, init) => {
    calls++;
    assert.equal(init.redirect, 'manual');
    return new Response('', { status: 302, headers: { Location: 'https://attacker.test/' } });
  }), { status: 'redirect_rejected' });
  assert.equal(calls, 1);
  assert.deepEqual(await checkFlashConnection(env, async () => new Response('<html>Login</html>')), { status: 'invalid_response' });
  assert.deepEqual(await checkFlashConnection(env, async () => Response.json(null)), { status: 'invalid_response' });
  assert.deepEqual(await checkFlashConnection(env, async () => { throw new DOMException('timed out', 'TimeoutError'); }), { status: 'timeout' });
  assert.deepEqual(await checkFlashConnection(env, async () => Response.json({ data: { me: null }, errors: [{ message: 'Not authorized' }] })), { status: 'unauthorized' });
});

function testBucket() {
  let value = null, etag = 0;
  return {
    async get() { return value === null ? null : { etag: String(etag), json: async () => JSON.parse(value) }; },
    async put(_key, next, options) {
      if (options?.onlyIf?.etagDoesNotMatch === '*' && value !== null) return null;
      if (options?.onlyIf?.etagMatches && options.onlyIf.etagMatches !== String(etag)) return null;
      value = next; etag++; return { etag: String(etag) };
    },
  };
}
const prepared = { me: { defaultAccount: { wallets: [{ id: 'recipient-btc', walletCurrency: 'BTC' }] } }, recipient: { id: 'recipient-btc', walletCurrency: 'BTC' }, globals: { network: 'mainnet' } };
test('private invoice verifies recipient, creates once and queries provider status without leaking invoice', async () => {
  const configured = { ...env, BUCKET: testBucket() };
  let creates = 0;
  let paymentStatus = 'PENDING';
  const fetcher = async (_url, init) => {
    const { query, variables } = JSON.parse(init.body);
    assert.equal(init.redirect, 'manual');
    if (query.includes('TasteFolioInvoiceRecipient')) return Response.json({ data: prepared });
    if (query.includes('mutation')) {
      creates++;
      assert.deepEqual(variables.input, { walletId: 'recipient-btc', amount: 21, expiresIn: 10, memo: 'Taste Folio private invoice test' });
      return Response.json({ data: { lnInvoiceCreate: { errors: [], invoice: { paymentRequest: 'lnbc210n1fixture', satoshis: 21 } } } });
    }
    assert.equal(variables.input.paymentRequest, 'lnbc210n1fixture');
    return Response.json({ data: { lnInvoicePaymentStatus: { errors: [], status: paymentStatus } } });
  };
  assert.equal((await flashInvoiceTest(configured, 'owner', 'status', fetcher)).status, 'no_invoice');
  const first = await flashInvoiceTest(configured, 'owner', 'create', fetcher);
  assert.deepEqual(first, { status: 'created', paymentStatus: 'PENDING', amount: 21, recipient: 'boodaboo', network: 'mainnet' });
  assert(!JSON.stringify(first).includes('lnbc'));
  assert.equal((await flashInvoiceTest(configured, 'owner', 'create', fetcher)).paymentStatus, 'PENDING');
  paymentStatus = 'PAID';
  assert.equal((await flashInvoiceTest(configured, 'owner', 'status', fetcher)).paymentStatus, 'PAID');
  assert.equal(creates, 1);
});
test('wrong recipient, USD-only wallet and wrong network cannot reach invoice creation', async () => {
  for (const data of [
    { ...prepared, recipient: { id: 'someone-else', walletCurrency: 'BTC' } },
    { ...prepared, me: { defaultAccount: { wallets: [{ id: 'recipient-btc', walletCurrency: 'USD' }] } } },
    { ...prepared, globals: { network: 'testnet' } },
  ]) {
    let calls = 0;
    const result = await flashInvoiceTest({ ...env, BUCKET: testBucket() }, 'owner', 'create', async (_url, init) => {
      calls++; assert(!JSON.parse(init.body).query.includes('mutation')); return Response.json({ data });
    });
    assert(['recipient_mismatch', 'network_mismatch'].includes(result.status));
    assert.equal(calls, 1);
  }
});
test('BTC rejection and uncertain creation never silently convert currency or automatically retry', async () => {
  for (const rejected of [false, true]) {
    const configured = { ...env, BUCKET: testBucket() };
    let creates = 0;
    const fetcher = async (_url, init) => {
      const { query } = JSON.parse(init.body);
      if (!query.includes('mutation')) return Response.json({ data: prepared });
      creates++;
      if (rejected) return Response.json({ errors: [{ message: 'Flash does not support BTC wallets.' }] });
      throw new DOMException('timeout', 'TimeoutError');
    };
    const status = rejected ? 'btc_unavailable' : 'timeout';
    assert.equal((await flashInvoiceTest(configured, 'owner', 'create', fetcher)).status, status);
    assert.equal((await flashInvoiceTest(configured, 'owner', 'create', fetcher)).status, status);
    assert.equal(creates, 1);
  }
});
test('wrong amount stays private and provider failures never become PAID', async () => {
  const configured = { ...env, BUCKET: testBucket() };
  const result = await flashInvoiceTest(configured, 'owner', 'create', async (_url, init) => {
    if (!JSON.parse(init.body).query.includes('mutation')) return Response.json({ data: prepared });
    return Response.json({ data: { lnInvoiceCreate: { errors: [], invoice: { paymentRequest: 'lnbc210n1fixture', satoshis: 2100 } } } });
  });
  assert.equal(result.status, 'invalid_invoice');
  const saved = { endpoint: env.FLASH_API_URL, paymentRequest: 'lnbc210n1fixture', lockUntil: Date.now() + 60000 };
  const stored = testBucket(); await stored.put('unused', JSON.stringify(saved));
  const failed = await flashInvoiceTest({ ...env, BUCKET: stored }, 'owner', 'status', async () => Response.json({ errors: [{ message: 'Service unavailable' }] }));
  assert.equal(failed.status, 'created'); assert.equal(failed.paymentStatus, undefined);
});
