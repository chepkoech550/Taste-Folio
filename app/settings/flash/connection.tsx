'use client';
import { useState } from 'react';

const messages: Record<string, string> = {
  connected: 'Flash accepted the key and the wallet access check passed. Invoice creation and payment confirmation still need to be verified.',
  not_configured: 'The deployment is missing FLASH_API_URL or FLASH_API_KEY. Check the variable names in Cloudflare and deploy the configuration.',
  invalid_endpoint: 'FLASH_API_URL must be one of the two supported Flash GraphQL endpoints.',
  unauthorized: 'Flash rejected the key. Check that it is active and belongs to the selected Flash environment.',
  permissions: 'Flash accepted the request but denied wallet access. Check the key permissions in Flash. Additional permissions may be required for this query.',
  provider_error: 'Flash did not return a successful wallet response. The connection is not verified. Check the current Flash API permissions and service status.',
  redirect_rejected: 'Flash redirected the request. The check stopped without forwarding your key. Check that FLASH_API_URL is the exact GraphQL endpoint.',
  invalid_response: 'Flash responded, but did not return readable API data. Your key has not been verified.',
  timeout: 'Flash did not finish responding within 20 seconds. Your key has not been verified. Try the check again shortly.',
  unavailable: 'Flash could not be reached successfully. Try again shortly.',
};

const invoiceMessages: Record<string, string> = {
  btc_unavailable: 'Flash rejected Bitcoin invoice creation: BTC wallets are not supported by this operation. No payable invoice was returned.',
  usd_unavailable: 'Flash rejected USD invoice creation: USD wallets are not supported by this operation. No payable invoice was returned.',
  recipient_mismatch: 'The saved key does not control the USD Cash Wallet for boodaboo. No invoice was requested.',
  network_mismatch: 'Flash returned a different Bitcoin network. No invoice was requested.',
  permissions: 'Flash denied the invoice operation. Check the key permissions for invoice creation.',
  unauthorized: 'Flash rejected the credentials for the invoice test.',
  provider_error: 'Flash did not return a successful invoice response. Invoice creation remains unverified.',
  invalid_invoice: 'Flash returned an unexpected invoice amount or network. The invoice has not been exposed for payment.',
  no_invoice: 'No private test invoice has been created yet.',
  creation_pending: 'A test request is already in progress or its result is uncertain. To avoid duplicate invoices, wait 6 minutes before creating another.',
  timeout: 'The Flash request timed out. Creation may have reached Flash. Use Check USD invoice status; a new request is blocked for 6 minutes.',
  unavailable: 'The Flash request failed. Creation may have reached Flash. A new request is blocked for 6 minutes.',
  storage_unavailable: 'The private test record could not be read or saved. Do not retry invoice creation until storage is working.',
  environment_changed: 'The test record belongs to a different Flash environment. Ask the maintainer to review it before another test.',
};

export default function FlashConnection({ canTestInvoice = false }: { canTestInvoice?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const [invoiceMessage, setInvoiceMessage] = useState('');
  async function check() {
    setBusy(true);
    setMessage('');
    try {
      const result = await fetch('/api/flash/connection', { method: 'POST' });
      const body = await result.json() as { status?: string; error?: string };
      setMessage(result.ok ? messages[body.status || 'provider_error'] || messages.provider_error : body.error || 'The check could not complete.');
    } catch {
      setMessage('The check could not complete. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }
  async function testInvoice(action: 'create' | 'status') {
    setInvoiceBusy(true);
    setInvoiceMessage('');
    try {
      const result = await fetch('/api/flash/invoice-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, currency: 'USD' }),
      });
      const body = await result.json() as { status?: string; error?: string; paymentStatus?: string; statusCheck?: string; currency?: string; amount?: number; satoshis?: number };
      if (!result.ok) setInvoiceMessage(body.error || 'The invoice test could not complete.');
      else if (body.status === 'created' && body.currency === 'USD' && body.amount === 100) {
        const state = body.paymentStatus === 'PENDING' ? 'Flash confirms it is awaiting payment.' : body.paymentStatus === 'PAID' ? 'Flash confirms it is paid.' : body.paymentStatus === 'EXPIRED' ? 'Flash confirms it has expired.' : 'The payment status check has not succeeded.';
        setInvoiceMessage('Flash created a Lightning invoice for USD 1.00 into boodaboo’s Cash Wallet. ' + state + ' This private test does not enable offer checkout.');
      } else setInvoiceMessage(invoiceMessages[body.status || 'provider_error'] || messages[body.status || 'provider_error'] || invoiceMessages.provider_error);
    } catch {
      setInvoiceMessage('The test response could not be read. Use Check invoice status before attempting creation again.');
    } finally { setInvoiceBusy(false); }
  }
  return <main className="flash-settings">
    <a href="/edit">← Back to your pitch</a>
    <p className="eyebrow">Payment connection</p>
    <h1>Connect Flash</h1>
    <p>Check the Flash credentials saved for Taste Folio. This uses the server settings already stored in Cloudflare.</p>
    <p>The connection check creates no invoice and sends no money. A successful check does not enable checkout.</p>
    <button className="primary" disabled={busy} onClick={check}>{busy ? 'Checking Flash…' : 'Check connection'}</button>
    <p role="status" aria-live="polite">{message}</p>
    {canTestInvoice && <section aria-labelledby="invoice-test-heading">
      <h2 id="invoice-test-heading">Private USD invoice test</h2>
      <p>Request a Lightning invoice for USD 1.00 into boodaboo’s Flash Cash Wallet, expiring in 5 minutes. The server first verifies that the saved key controls this recipient’s USD wallet.</p>
      <p>The payer would pay Bitcoin over Lightning. The recipient would receive a USD cash balance in Flash.</p>
      <p>This uses real Bitcoin mainnet. The test sends no money and keeps the payable invoice private.</p>
      <button className="primary" disabled={busy || invoiceBusy} onClick={() => testInvoice('create')}>{invoiceBusy ? 'Checking invoice…' : 'Create $1 USD test invoice'}</button>{' '}
      <button disabled={busy || invoiceBusy} onClick={() => testInvoice('status')}>Check USD invoice status</button>
      <p role="status" aria-live="polite">{invoiceMessage}</p>
    </section>}
  </main>;
}
