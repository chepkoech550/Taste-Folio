// Private, fixed-recipient pilot. Never sends a payment or exposes a payable invoice.
export const FLASH_TEST_OWNER_SLUG = 'viola-korir-dcd4b1a1';
const RECIPIENT = 'boodaboo';
const AMOUNT = 21;
const ENDPOINTS = new Set(['https://api.flashapp.me/graphql', 'https://api.test.flashapp.me/graphql']);

function classify(errors) {
  if (!Array.isArray(errors) || !errors.length) return null;
  if (errors.some(e => /does not support BTC wallets/i.test(String(e?.message || '')))) return 'btc_unavailable';
  if (errors.some(e => /scope|permission|forbidden/i.test(String(e?.message || '')) || ['FORBIDDEN', 'PERMISSION_DENIED'].includes(e?.extensions?.code))) return 'permissions';
  if (errors.some(e => /not authorized|unauthorized|unauthenticated/i.test(String(e?.message || '')))) return 'unauthorized';
  return 'provider_error';
}

/** @param {any} env @param {string} query @param {any} variables @param {typeof fetch} fetcher */
async function graphql(env, query, variables, fetcher) {
  try {
    const res = await fetcher(env.FLASH_API_URL.trim(), {
      method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(20000),
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': env.FLASH_API_KEY.trim() },
      body: JSON.stringify({ query, variables }),
    });
    if (res.status === 401) return { status: 'unauthorized' };
    if (res.status === 403) return { status: 'permissions' };
    if (!res.ok) return { status: 'provider_error' };
    let body;
    try { body = await res.json(); } catch { return { status: 'invalid_response' }; }
    if (!body || typeof body !== 'object') return { status: 'invalid_response' };
    const error = classify(body.errors);
    return error ? { status: error } : { data: body.data };
  } catch (error) {
    return { status: error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name) ? 'timeout' : 'unavailable' };
  }
}

/** @param {any} env @param {any} record @param {typeof fetch} fetcher */
async function invoiceStatus(env, record, fetcher) {
  const result = await graphql(env,
    'query TasteFolioInvoiceStatus($input: LnInvoicePaymentStatusInput!) { lnInvoicePaymentStatus(input: $input) { status errors { message } } }',
    { input: { paymentRequest: record.paymentRequest } }, fetcher);
  if (result.status) return { status: 'created', statusCheck: result.status, amount: AMOUNT, recipient: RECIPIENT, network: 'mainnet' };
  const payload = result.data?.lnInvoicePaymentStatus;
  const error = classify(payload?.errors);
  if (error || !['PENDING', 'PAID', 'EXPIRED'].includes(payload?.status)) return { status: 'created', statusCheck: error || 'provider_error', amount: AMOUNT, recipient: RECIPIENT, network: 'mainnet' };
  return { status: 'created', paymentStatus: payload.status, amount: AMOUNT, recipient: RECIPIENT, network: 'mainnet' };
}

/** @param {any} env @param {string} userId @param {'create'|'status'} action @param {typeof fetch} [fetcher] */
export async function flashInvoiceTest(env, userId, action, fetcher = fetch) {
  if (!env.FLASH_API_URL?.trim() || !env.FLASH_API_KEY?.trim()) return { status: 'not_configured' };
  if (!ENDPOINTS.has(env.FLASH_API_URL.trim())) return { status: 'invalid_endpoint' };
  if (!env.BUCKET) return { status: 'storage_unavailable' };
  const key = 'internal/flash-invoice-test/' + encodeURIComponent(userId) + '.json';
  const previous = await env.BUCKET.get(key);
  const record = previous ? await previous.json() : null;
  if (record?.endpoint && record.endpoint !== env.FLASH_API_URL.trim()) return { status: 'environment_changed' };
  if (record?.paymentRequest && (action === 'status' || record.lockUntil > Date.now())) return invoiceStatus(env, record, fetcher);
  if (record?.lockUntil > Date.now()) return { status: record.status || 'creation_pending' };
  if (action === 'status') return { status: 'no_invoice' };

  // Verify the API-key account controls this exact public recipient's BTC wallet.
  const prepared = await graphql(env,
    'query TasteFolioInvoiceRecipient { me { defaultAccount { wallets { id walletCurrency } } } recipient: accountDefaultWallet(username: "boodaboo", walletCurrency: BTC) { id walletCurrency } globals { network } }',
    {}, fetcher);
  if (prepared.status) return { status: prepared.status };
  const target = prepared.data?.recipient;
  const wallets = prepared.data?.me?.defaultAccount?.wallets;
  if (!target?.id || target.walletCurrency !== 'BTC' || !Array.isArray(wallets) || !wallets.some(w => w?.id === target.id && w.walletCurrency === 'BTC')) return { status: 'recipient_mismatch' };
  if (prepared.data?.globals?.network !== 'mainnet') return { status: 'network_mismatch' };

  // R2 conditional write reserves one request across Worker instances. Timeouts
  // stay locked because an invoice may have been created before the reply failed.
  const reservation = { status: 'creation_pending', endpoint: env.FLASH_API_URL.trim(), lockUntil: Date.now() + 11 * 60_000 };
  const lease = await env.BUCKET.put(key, JSON.stringify(reservation), {
    onlyIf: previous ? { etagMatches: previous.etag } : { etagDoesNotMatch: '*' },
  });
  if (!lease) return { status: 'creation_pending' };
  const created = await graphql(env,
    'mutation TasteFolioInvoiceTest($input: LnInvoiceCreateInput!) { lnInvoiceCreate(input: $input) { errors { message } invoice { paymentRequest satoshis } } }',
    { input: { walletId: target.id, amount: AMOUNT, expiresIn: 10, memo: 'Taste Folio private invoice test' } }, fetcher);
  const payload = created.data?.lnInvoiceCreate;
  const error = created.status || classify(payload?.errors);
  const invoice = payload?.invoice;
  if (error || invoice?.satoshis !== AMOUNT || typeof invoice?.paymentRequest !== 'string' || !/^lnbc[0-9]+[munp]?1[0-9a-z]+$/i.test(invoice.paymentRequest)) {
    const status = error || 'invalid_invoice';
    await env.BUCKET.put(key, JSON.stringify({ ...reservation, status }), { onlyIf: { etagMatches: lease.etag } });
    return { status };
  }
  const saved = { ...reservation, status: 'created', paymentRequest: invoice.paymentRequest };
  const stored = await env.BUCKET.put(key, JSON.stringify(saved), { onlyIf: { etagMatches: lease.etag } });
  if (!stored) return { status: 'creation_pending' };
  return invoiceStatus(env, saved, fetcher);
}
