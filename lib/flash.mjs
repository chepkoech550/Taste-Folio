// Server-only diagnostic. It never creates invoices or sends payments.
const endpoints = new Set([
  'https://api.flashapp.me/graphql',
  'https://api.test.flashapp.me/graphql',
]);

/** @param {{FLASH_API_URL?: string, FLASH_API_KEY?: string}} env
 * @param {typeof fetch} [fetcher] */
export async function checkFlashConnection(env, fetcher = fetch) {
  const endpoint = env.FLASH_API_URL?.trim();
  const key = env.FLASH_API_KEY?.trim();
  if (!endpoint || !key) return { status: 'not_configured' };
  // Secrets may only be sent to the two explicitly supported Flash endpoints.
  if (!endpoints.has(endpoint)) return { status: 'invalid_endpoint' };
  try {
    const result = await fetcher(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': key },
      // Workers does not support redirect:'error'. Manual mode rejects redirects
      // below without ever forwarding the credential to a Location destination.
      redirect: 'manual',
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        query: 'query TasteFolioConnection { me { defaultAccount { wallets { walletCurrency } } } }',
      }),
    });
    if (result.status >= 300 && result.status < 400) return { status: 'redirect_rejected' };
    if (result.status === 401) return { status: 'unauthorized' };
    if (result.status === 403) return { status: 'permissions' };
    if (!result.ok) return { status: 'provider_error' };
    let payload;
    try { payload = await result.json(); }
    catch { return { status: 'invalid_response' }; }
    if (!payload || typeof payload !== 'object') return { status: 'invalid_response' };
    if (payload.errors?.length) {
      if (!Array.isArray(payload.errors)) return { status: 'invalid_response' };
      const codes = payload.errors.map(/** @param {any} error */ error => String(error?.extensions?.code || '').toUpperCase());
      if (codes.some(/** @param {string} code */ code => ['UNAUTHENTICATED', 'UNAUTHORIZED'].includes(code))) return { status: 'unauthorized' };
      if (codes.some(/** @param {string} code */ code => ['FORBIDDEN', 'PERMISSION_DENIED'].includes(code))) return { status: 'permissions' };
      // Flash's public service also returns auth failures without extension codes.
      if (payload.errors.some(/** @param {any} error */ error => /^(not authorized|unauthorized|unauthenticated)\.?$/i.test(String(error?.message || '').trim()))) return { status: 'unauthorized' };
      return { status: 'provider_error' };
    }
    const wallets = payload.data?.me?.defaultAccount?.wallets;
    if (!Array.isArray(wallets) || wallets.length === 0 || !wallets.every(wallet => typeof wallet.walletCurrency === 'string')) return { status: 'provider_error' };
    // Account details and provider error bodies never leave this function.
    return { status: 'connected' };
  } catch (error) {
    if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) return { status: 'timeout' };
    return { status: 'unavailable' };
  }
}
