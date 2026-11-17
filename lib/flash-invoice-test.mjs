// Private, fixed-recipient pilot. Never sends a payment or exposes a payable invoice.
export const FLASH_TEST_OWNER_SLUG = 'viola-korir-dcd4b1a1';
const RECIPIENT = 'boodaboo';
const AMOUNT = 21;
const ENDPOINTS = new Set(['https://api.flashapp.me/graphql', 'https://api.test.flashapp.me/graphql']);

export function classify(errors) {
  if (!Array.isArray(errors) || !errors.length) return null;
  if (errors.some(e => /does not support BTC wallets/i.test(String(e?.message || '')))) return 'btc_unavailable';
  if (errors.some(e => /does not support USD wallets/i.test(String(e?.message || '')))) return 'usd_unavailable';
  if (errors.some(e => /scope|permission|forbidden/i.test(String(e?.message || '')) || ['FORBIDDEN', 'PERMISSION_DENIED'].includes(e?.extensions?.code))) return 'permissions';
  if (errors.some(e => /not authorized|unauthorized|unauthenticated/i.test(String(e?.message || '')))) return 'unauthorized';
  return 'provider_error';
}

/** @param {any} env @param {string} query @param {any} variables @param {typeof fetch} fetcher */
export async function graphql(env, query, variables, fetcher) {
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
  const summary = record.currency === 'USD'
    ? { amount: 100, currency: 'USD', amountUnit: 'cents', satoshis: record.satoshis, recipient: RECIPIENT, network: 'mainnet' }
    : { amount: AMOUNT, recipient: RECIPIENT, network: 'mainnet' };
  const result = await graphql(env,
    'query TasteFolioInvoiceStatus($input: LnInvoicePaymentStatusInput!) { lnInvoicePaymentStatus(input: $input) { status errors { message } } }',
    { input: { paymentRequest: record.paymentRequest } }, fetcher);
  if (result.status) return { status: 'created', statusCheck: result.status, ...summary };
  const payload = result.data?.lnInvoicePaymentStatus;
  const error = classify(payload?.errors);
  if (error || !['PENDING', 'PAID', 'EXPIRED'].includes(payload?.status)) return { status: 'created', statusCheck: error || 'provider_error', ...summary };
  return { status: 'created', paymentStatus: payload.status, ...summary };
}

// Compare the BOLT11 amount prefix against Flash's returned whole-sat amount.
// This is a private diagnostic, not a full invoice signature/checksum verifier.
function invoiceSatoshis(paymentRequest) {
  if (typeof paymentRequest !== 'string') return null;
  const match = /^lnbc(\d{1,20})([munp]?)1[0-9a-z]+$/i.exec(paymentRequest);
  if (!match) return null;
  const value = BigInt(match[1]);
  const suffix = match[2].toLowerCase();
  const numerator = suffix === 'm' ? value * 100000n : suffix === 'u' ? value * 100n : suffix === 'n' || suffix === 'p' ? value : value * 100000000n;
  const denominator = suffix === 'n' ? 10n : suffix === 'p' ? 10000n : 1n;
  const milliNumerator = numerator * 1000n;
  if (milliNumerator % denominator !== 0n) return null;
  const msats = milliNumerator / denominator;
  if (msats <= 0n || msats > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return Number(msats) / 1000;
}

/** @param {any} env @param {string} userId @param {'create'|'status'} action @param {typeof fetch} [fetcher] @param {'BTC'|'USD'} [currency] */
export async function flashInvoiceTest(env, userId, action, fetcher = fetch, currency = 'BTC') {
  if (currency !== 'BTC' && currency !== 'USD') return { status: 'invalid_currency' };
  const usd = currency === 'USD';
  const amount = usd ? 100 : AMOUNT; // Flash FractionalCentAmount: 100 cents = USD 1.00.
  const expiresIn = usd ? 5 : 10;
  const operation = usd ? 'lnUsdInvoiceCreateOnBehalfOfRecipient' : 'lnInvoiceCreate';
  const inputType = usd ? 'LnUsdInvoiceCreateOnBehalfOfRecipientInput' : 'LnInvoiceCreateInput';
  if (!env.FLASH_API_URL?.trim() || !env.FLASH_API_KEY?.trim()) return { status: 'not_configured' };
  if (!ENDPOINTS.has(env.FLASH_API_URL.trim())) return { status: 'invalid_endpoint' };
  if (!env.BUCKET) return { status: 'storage_unavailable' };
  const key = 'internal/flash-invoice-test/' + (usd ? 'usd/' : '') + encodeURIComponent(userId) + '.json';
  const previous = await env.BUCKET.get(key);
  const record = previous ? await previous.json() : null;
  if (record?.endpoint && record.endpoint !== env.FLASH_API_URL.trim()) return { status: 'environment_changed' };
  if (record?.paymentRequest && (action === 'status' || record.lockUntil > Date.now())) return invoiceStatus(env, record, fetcher);
  if (record?.lockUntil > Date.now()) return { status: record.status || 'creation_pending' };
  if (action === 'status') return { status: 'no_invoice' };

  // Verify the key controls this recipient's wallet in the selected settlement currency.
  const prepared = await graphql(env,
    `query TasteFolioInvoiceRecipient { me { defaultAccount { wallets { id walletCurrency } } } recipient: accountDefaultWallet(username: "boodaboo", walletCurrency: ${currency}) { id walletCurrency } globals { network } }`,
    {}, fetcher);
  if (prepared.status) return { status: prepared.status };
  const target = prepared.data?.recipient;
  const wallets = prepared.data?.me?.defaultAccount?.wallets;
  if (!target?.id || target.walletCurrency !== currency || !Array.isArray(wallets) || !wallets.some(w => w?.id === target.id && w.walletCurrency === currency)) return { status: 'recipient_mismatch' };
  if (prepared.data?.globals?.network !== 'mainnet') return { status: 'network_mismatch' };

  // R2 conditional write reserves one request across Worker instances. Timeouts
  // stay locked because an invoice may have been created before the reply failed.
  const reservation = { status: 'creation_pending', endpoint: env.FLASH_API_URL.trim(), currency, lockUntil: Date.now() + (expiresIn + 1) * 60_000 };
  const lease = await env.BUCKET.put(key, JSON.stringify(reservation), {
    onlyIf: previous ? { etagMatches: previous.etag } : { etagDoesNotMatch: '*' },
  });
  if (!lease) return { status: 'creation_pending' };
  const created = await graphql(env,
    `mutation TasteFolioInvoiceTest($input: ${inputType}!) { ${operation}(input: $input) { errors { message } invoice { paymentRequest satoshis } } }`,
    { input: { [usd ? 'recipientWalletId' : 'walletId']: target.id, amount, expiresIn, memo: usd ? 'Taste Folio private USD invoice test' : 'Taste Folio private invoice test' } }, fetcher);
  const payload = created.data?.[operation];
  const error = created.status || classify(payload?.errors);
  const invoice = payload?.invoice;
  const encodedSatoshis = invoiceSatoshis(invoice?.paymentRequest);
  // USD invoices have a provider-quoted BTC amount; Flash can return satoshis:null.
  // Check a reported amount when present, otherwise use the invoice's own amount.
  if (error || encodedSatoshis === null || (!usd && (invoice?.satoshis !== AMOUNT || encodedSatoshis !== AMOUNT)) || (invoice?.satoshis != null && invoice.satoshis !== encodedSatoshis)) {
    const status = error || 'invalid_invoice';
    await env.BUCKET.put(key, JSON.stringify({ ...reservation, status }), { onlyIf: { etagMatches: lease.etag } });
    return { status };
  }
  const saved = { ...reservation, status: 'created', paymentRequest: invoice.paymentRequest, satoshis: encodedSatoshis };
  const stored = await env.BUCKET.put(key, JSON.stringify(saved), { onlyIf: { etagMatches: lease.etag } });
  if (!stored) return { status: 'creation_pending' };
  return invoiceStatus(env, saved, fetcher);
}
