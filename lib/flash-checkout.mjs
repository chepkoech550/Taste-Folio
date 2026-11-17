import bolt11 from 'bolt11';
import { graphql, classify } from './flash-invoice-test.mjs';
import { usdCents, flashUsername } from './checkout-contract.mjs';

const ENDPOINTS = new Set(['https://api.flashapp.me/graphql', 'https://api.test.flashapp.me/graphql']);
const keyFor = id => 'internal/offer-payments/' + id + '.json';
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export function validCheckoutId(id) { return typeof id === 'string' && uuid.test(id); }
export function validateInvoice(invoice, now = Date.now()) {
  const decoded = bolt11.decode(invoice.paymentRequest);
  const msats = decoded.millisatoshis;
  const hash = decoded.tags.find(t => t.tagName === 'payment_hash')?.data;
  const expiry = (decoded.timeExpireDate || (decoded.timestamp + 3600)) * 1000;
  if (decoded.network?.bech32 !== 'bc' || !msats || !/^\d+$/.test(msats) || BigInt(msats) <= 0n || !/^[a-f0-9]{64}$/i.test(String(hash)) || expiry < now + 15000 || expiry > now + 10 * 60000 || decoded.timestamp * 1000 > now + 60000) throw new Error('Invalid invoice');
  if (invoice.satoshis != null && (!Number.isSafeInteger(invoice.satoshis) || BigInt(invoice.satoshis) * 1000n !== BigInt(msats))) throw new Error('Invoice amount mismatch');
  return { millisatoshis: msats, paymentHash: hash, expiresAt: expiry };
}
function configured(env) { return env.FLASH_API_KEY?.trim() && ENDPOINTS.has(env.FLASH_API_URL?.trim()) && env.BUCKET; }
function publicRecord(record) {
  return { id: record.id, stage: record.stage, paymentStatus: record.paymentStatus || null, offerTitle: record.offerTitle, sellerName: record.sellerName, recipient: record.recipient, usdCents: record.usdCents, paymentRequest: record.stage === 'ready' ? record.paymentRequest : undefined, millisatoshis: record.millisatoshis, expiresAt: record.expiresAt, retryAt: record.retryAt, error: record.error };
}
export async function createCheckout(env, input, snapshot, fetcher = fetch) {
  if (!configured(env)) return { error: 'Lightning checkout is unavailable. Please contact the professional.', code: 503 };
  const offer = snapshot.profile.offers?.find(o => o.id === input.offerId);
  const amount = usdCents(offer?.usdPrice);
  const username = flashUsername(snapshot.profile.lightning);
  if (!offer || amount === null || !username || snapshot.profile.offers.filter(o => o.id === input.offerId).length !== 1) return { error: 'This offer needs a USD price and a Flash receiving address before it can accept Lightning payments.', code: 400 };
  const key = keyFor(input.id);
  const fingerprint = JSON.stringify([snapshot.id, input.offerId, amount, username, offer.title]);
  const existing = await env.BUCKET.get(key);
  if (existing) {
    const record = await existing.json();
    if (record.fingerprint !== fingerprint || record.endpoint !== env.FLASH_API_URL.trim()) return { error: 'This offer has changed. Refresh the page before starting a new payment.', code: 409 };
    return { checkout: publicRecord(record) };
  }
  const lookup = await graphql(env,
    'query TasteFolioCheckoutRecipient($username: Username!) { recipient: accountDefaultWallet(username: $username, walletCurrency: USD) { id walletCurrency } globals { network } }',
    { username }, fetcher);
  const wallet = lookup.data?.recipient;
  if (lookup.status || !wallet?.id || wallet.walletCurrency !== 'USD' || lookup.data?.globals?.network !== 'mainnet') return { error: 'The recipient’s Flash USD wallet could not be verified. No invoice was requested.', code: 502 };
  const record = { id: input.id, fingerprint, endpoint: env.FLASH_API_URL.trim(), portfolioId: snapshot.id, slug: snapshot.slug, offerId: offer.id, offerTitle: offer.title, sellerName: snapshot.profile.name, recipient: username + '@flashapp.me', usdCents: amount, stage: 'creating', createdAt: Date.now(), retryAt: Date.now() + 6 * 60000 };
  const lease = await env.BUCKET.put(key, JSON.stringify(record), { onlyIf: { etagDoesNotMatch: '*' } });
  if (!lease) {
    const raced = await env.BUCKET.get(key);
    const saved = raced ? await raced.json() : null;
    return saved?.fingerprint === fingerprint && saved.endpoint === env.FLASH_API_URL.trim() ? { checkout: publicRecord(saved) } : { error: 'Payment request is already in progress.', code: 409 };
  }
  const result = await graphql(env,
    'mutation TasteFolioOfferInvoice($input: LnUsdInvoiceCreateOnBehalfOfRecipientInput!) { lnUsdInvoiceCreateOnBehalfOfRecipient(input: $input) { errors { message } invoice { paymentRequest satoshis } } }',
    { input: { recipientWalletId: wallet.id, amount, expiresIn: 5, memo: ('Taste Folio: ' + offer.title).slice(0,150) + ' #' + input.id.slice(0,8) } }, fetcher);
  const payload = result.data?.lnUsdInvoiceCreateOnBehalfOfRecipient;
  const failure = result.status || classify(payload?.errors);
  let next;
  try {
    if (failure || !payload?.invoice) throw new Error('Invoice unavailable');
    const validated = validateInvoice(payload.invoice);
    next = { ...record, ...validated, stage: 'ready', paymentRequest: payload.invoice.paymentRequest, paymentStatus: 'PENDING', lastCheckedAt: 0 };
  } catch {
    next = { ...record, stage: 'failed', error: 'The invoice could not be verified. No payment has been confirmed. Wait until the retry time before creating a new request.' };
  }
  const written = await env.BUCKET.put(key, JSON.stringify(next), { onlyIf: { etagMatches: lease.etag } });
  if (!written) return { error: 'The payment request could not be saved. Do not pay; contact the professional.', code: 503 };
  return { checkout: publicRecord(next) };
}
export async function getCheckout(env, id, fetcher = fetch) {
  if (!configured(env)) return { error: 'Payment status is temporarily unavailable.', code: 503 };
  const object = await env.BUCKET.get(keyFor(id));
  if (!object) return { error: 'Payment request not found.', code: 404 };
  const record = await object.json();
  if (record.endpoint !== env.FLASH_API_URL.trim()) return { error: 'Payment environment changed. Contact the professional.', code: 409 };
  if (record.stage !== 'ready' || record.paymentStatus === 'PAID' || Date.now() - record.lastCheckedAt < 5000) return { checkout: publicRecord(record) };
  const result = await graphql(env,
    'query TasteFolioCheckoutStatus($input: LnInvoicePaymentStatusInput!) { lnInvoicePaymentStatus(input: $input) { status errors { message } } }',
    { input: { paymentRequest: record.paymentRequest } }, fetcher);
  const payload = result.data?.lnInvoicePaymentStatus;
  if (result.status || classify(payload?.errors) || !['PENDING','PAID','EXPIRED'].includes(payload?.status)) return { checkout: publicRecord(record), statusUnavailable: true };
  const next = { ...record, paymentStatus: payload.status, lastCheckedAt: Date.now() };
  const saved = await env.BUCKET.put(keyFor(id), JSON.stringify(next), { onlyIf: { etagMatches: object.etag } });
  if (!saved) {
    const latest = await env.BUCKET.get(keyFor(id));
    return latest ? { checkout: publicRecord(await latest.json()) } : { error: 'Payment status could not be saved.', code: 503 };
  }
  return { checkout: publicRecord(next) };
}
