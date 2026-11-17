# Flash integration status

Checked 17 November 2026. Current approved settlement: USD in Flash Cash Wallet.
The owner explicitly chose this after both tested BTC invoice operations were rejected.
Payers use Bitcoin Lightning; recipients receive a USD balance. This is not USDT.

## Intended payment journey

A client opens a professional's published portfolio, agrees the scope and amount,
requests a Lightning invoice credited to that professional's USD Cash Wallet, pays in
their own wallet, and sees receipt confirmed by Flash. Taste Folio does not
receive payments into a shared platform wallet.

## Verified schema

Both supplied endpoints expose these operations through public introspection:

- `accountDefaultWallet(username: Username!, walletCurrency: WalletCurrency)`
  returning a PublicWallet with id and walletCurrency.
- `lnInvoiceCreateOnBehalfOfRecipient(input:
  LnInvoiceCreateOnBehalfOfRecipientInput!)`.
  Input includes amount (SatAmount), recipientWalletId and expiresIn (minutes).
  Returned invoice includes paymentHash, paymentRequest and satoshis.
- `lnInvoicePaymentStatus(input: {paymentRequest})`.
  Status enum includes PENDING, PAID and EXPIRED.

The old userDefaultWalletId query appears in the docs but was absent from the
live schemas. Use accountDefaultWallet when building against these endpoints.

## Live observations

Endpoints supplied by the hackathon:

- https://api.test.flashapp.me/graphql
- https://api.flashapp.me/graphql

A read-only `query { globals { network lightningAddressDomain } }`
returned network `mainnet` on BOTH endpoints. The test hostname must not be
assumed to use test coins.

The following bounded probe used an intentionally nonexistent recipient, amount
1 sat and expiry 10 minutes. It created no invoice and sent no payment:

```graphql
mutation {
  lnInvoiceCreateOnBehalfOfRecipient(input: {
    recipientWalletId: "00000000-0000-4000-8000-000000000000"
    amount: 1
    expiresIn: 10
  }) {
    errors { message }
    invoice { paymentRequest }
  }
}
```

Both endpoints returned a top-level GraphQL error:

`Flash does not support BTC wallets.`

The error extension identified the public service. This documents the observed
recipient-invoice path; it does not prove every Flash app or authenticated wallet
operation is unavailable. A subsequent check with the owner's supplied receiving account resolved both a
BTC wallet and a USD wallet on the production endpoint. The default wallet was
USD. A 21-sat, 10-minute invoice request explicitly addressed to that valid BTC
wallet returned the same 'Flash does not support BTC wallets.' error. No invoice
was returned and no payment was sent. The test endpoint did not recognise this
receiving account. The owner subsequently reported that the authenticated wallet access check passed on 17 November. Authenticated invoice creation has not yet been verified live.

Flash user docs still describe receiving and holding Bitcoin. Public API docs
still describe the BTC recipient-invoice mutation. This conflicts with the probe
response, so runtime support must be confirmed before enabling checkout.

## Authenticated key path still to test

The owner has now created a Flash API key and saved FLASH_API_KEY and FLASH_API_URL in Cloudflare. The secret has not been shared with maintainers. The owner reported a successful live authentication and wallet-read check. Invoice creation has not yet been verified live. Flash
documents keys in the format `fk_<keyId>_<secret>`, created through an authenticated
user session with `apiKeyCreate`. Server requests use `X-API-KEY`; session tokens
use Authorization. Obtain the minimum permissions for the chosen operations.

The separate authenticated `lnInvoiceCreate` operation is documented to create
an invoice for the caller's wallet. It has not been tested here. The public
recipient-invoice error does not establish its behaviour. An account-scoped
invoice paid into the key owner's wallet is not automatically a payment into
another professional's wallet; verify the recipient before designing the checkout.

The private `/settings/flash` page now calls an authenticated POST diagnostic at
`/api/flash/connection`, which reads `FLASH_API_URL` and `FLASH_API_KEY`. It sends
only a wallet-read query, returns a generic status and never exposes account data
or provider error bodies. It requires an exact same-origin Origin header.
All signed-in Taste Folio users can run this shared deployment connection check;
it does not link their individual Flash accounts. Only the two official endpoint
URLs are allowed, redirects are disabled and requests time out after 20 seconds. Redirects use manual mode and all 3xx responses are rejected without forwarding credentials. Workers does not support redirect:error; the original diagnostic used that unsupported option and failed before contacting Flash. The configured-key integration test now runs the outbound request through the real Workers runtime to prevent that regression.
A successful check verifies wallet-read access only, not Bitcoin invoice support.
The query may require additional read permissions depending on Flash's scope mapping. API credentials must be set privately in the runtime,
not in portfolio fields, GitHub or chat.

Client tipping means a client pays an invoice from their own wallet. Sending
rewards or tips from Taste Folio through `lnInvoicePaymentSend` spends from a
funded account controlled by that key. That is a separate payout and funding
flow. No payout endpoint is currently implemented.

## Live USD receiving probe

On 17 November, a bounded public recipient probe resolved the owner-supplied USD
wallet and called `lnUsdInvoiceCreateOnBehalfOfRecipient` with amount 100
(FractionalCentAmount = USD cents, so USD 1.00), five-minute expiry and an unpaid
test memo. Flash returned a mainnet Lightning payment request. Its `satoshis`
field was null. A subsequent `lnInvoicePaymentStatus` query returned PENDING
with no errors. No money was sent, and the payable string was not exposed or
saved in the repository. This proves invoice creation and pending-state lookup,
not paid settlement, merchant eligibility or cash withdrawal availability.

The private USD test uses this same recipient mutation, with an extra verified-key
wallet-ownership check before creation. A live run of that private route is still
needed with the deployed credentials.

## Private invoice test

The settings page now includes an owner-only pilot for the existing profile slug
`viola-korir-dcd4b1a1`. The API verifies that the authenticated Supabase user owns
that exact D1 record. This is a temporary, explicit pilot restriction, not a role
system or a generic Flash account connection mechanism.

`POST /api/flash/invoice-test` accepts action create or status, plus currency USD
or BTC, with an exact same-origin Origin header. Omitted currency retains BTC
for older clients. The current UI explicitly selects USD. USDT is rejected.
No client can choose an amount, recipient, wallet ID or invoice string.

Before creation it looks up the fixed recipient's wallet in the selected currency
and verifies that the authenticated Flash account controls that wallet. It checks
mainnet. USD mode requests 100 cents with a five-minute expiry through
`lnUsdInvoiceCreateOnBehalfOfRecipient`. The earlier BTC mode remains available
only for controlled regression checks (21 sats, ten-minute expiry); the UI no
longer offers it. Currency selection is explicit and there is no silent fallback.
No operation sends a payment. The private probe does not expose an invoice QR or
payment string and must not be advertised as public checkout.

Returned invoices must encode a positive mainnet amount with millisatoshi
precision. If Flash provides satoshis, that field must match the encoded amount.
USD invoices can have satoshis:null, in which case the amount is derived from
the invoice prefix. BTC mode must match exactly 21 sats. This is an amount/network
prefix check, not full BOLT11 signature or checksum verification.

The pilot record is stored under `internal/flash-invoice-test/<owner-id>.json` in
the existing private R2 bucket. USD uses a separate `usd/` subdirectory, so a prior BTC failure cannot block or be mistaken for a USD invoice. It contains the provider's payment request for
server-side status queries. It is not an asset record and cannot be fetched via
the media API. Conditional R2 writes reserve the test across Worker instances.
For six minutes in USD mode (eleven in BTC mode), repeated creation requests reuse the saved invoice, or remain
blocked if a creation result was uncertain. Network failures never cause an
automatic mutation retry. A key/environment change requires review of the prior
record before a new test.

Status queries use the stored paymentRequest. Only Flash's PENDING, PAID and
EXPIRED results are recognised. A failed status lookup remains unverified.
The owner must click the private test button to run it using runtime credentials.
Automated tests use synthetic invoices and mocked Flash replies. The separate live public USD probe above generated a real unpaid invoice; no funded payment has been tested.

The owner reported that the private BTC operation also rejects BTC wallets. Keep that path disabled for public checkout. Public USD offer checkout now includes explicit offer pricing, an offer-bound R2 record, recipient routing and BOLT11 validation. A real funded settlement test is still required. Never include an API key in support messages.

## Current product behaviour

The portfolio can display a reusable Lightning address and let visitors copy it.
Public USD offer invoice creation, QR/wallet checkout and provider status handling are now implemented. See [CHECKOUT.md](CHECKOUT.md) for setup. The private diagnostic remains available. No simulated payment success or currency conversion was added.

The implemented checkout validates invoice network, amount and expiry, binds the recipient and USD price to a published offer, reuses an issued invoice on retries and marks PAID only after a provider-confirmed result.
Checkout payment snapshots and provider state are stored privately in R2; no D1 migration is required.

## Sources

- https://docs.flashapp.me/mutations/lnInvoiceCreateOnBehalfOfRecipient
- https://docs.flashapp.me/queries/accountDefaultWallet
- https://docs.flashapp.me/queries/lnInvoicePaymentStatus
- https://docs.flashapp.me/guides/api-keys
- https://userdocs.flashapp.me/guides/bitcoin-wallet/


## Public checkout implementation

The public button is opt-in through an explicit offer usdPrice and Flash address. It uses the verified USD recipient mutation, validates BOLT11 through BitcoinJS bolt11, stores an immutable R2 payment record and queries provider status. The key never reaches the browser and no spend/payout operation is exposed. [Setup, retry and review notes](CHECKOUT.md).
