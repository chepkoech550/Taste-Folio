'use client';
import { useState } from 'react';

const messages: Record<string, string> = {
  connected: 'Flash accepted the key and the wallet access check passed. Invoice creation and payment confirmation still need to be verified.',
  not_configured: 'The deployment is missing FLASH_API_URL or FLASH_API_KEY. Check the variable names in Cloudflare and deploy the configuration.',
  invalid_endpoint: 'FLASH_API_URL must be one of the two supported Flash GraphQL endpoints.',
  unauthorized: 'Flash rejected the key. Check that it is active and belongs to the selected Flash environment.',
  permissions: 'Flash accepted the request but denied wallet access. Check the key permissions in Flash. Additional permissions may be required for this query.',
  provider_error: 'Flash did not return a successful wallet response. The connection is not verified. Check the current Flash API permissions and service status.',
  unavailable: 'Flash could not be reached successfully. Try again shortly.',
};

export default function FlashConnection() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
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
  return <main className="flash-settings">
    <a href="/edit">← Back to your pitch</a>
    <p className="eyebrow">Payment connection</p>
    <h1>Connect Flash</h1>
    <p>Check the Flash credentials saved for Taste Folio. This uses the server settings already stored in Cloudflare.</p>
    <p>No invoice is created and no money is sent. A successful connection check does not enable checkout.</p>
    <button className="primary" disabled={busy} onClick={check}>{busy ? 'Checking Flash…' : 'Check connection'}</button>
    <p role="status" aria-live="polite">{message}</p>
  </main>;
}
