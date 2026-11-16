# Flash integration status

Checked 16 November 2026. Requested settlement: Bitcoin. The owner chose to
keep Bitcoin rather than investigate USD settlement.

## Intended payment journey

A client opens a professional's published portfolio, agrees the scope and amount,
requests a Lightning invoice credited to that professional's BTC wallet, pays in
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
operation is unavailable. A valid authorised BTC recipient and organiser guidance
are needed to verify the intended path. No authenticated user wallet was tested.

Flash user docs still describe receiving and holding Bitcoin. Public API docs
still describe the BTC recipient-invoice mutation. This conflicts with the probe
response, so runtime support must be confirmed before enabling checkout.

## Required next information

Obtain the professional's Flash receiving username/address and confirmation from
Flash or the organisers of the supported BTC invoice endpoint, operation,
recipient account requirements and required permissions. Ask:

"We are integrating Bitcoin-only Lightning payments into Taste Folio. Both
provided GraphQL endpoints return 'Flash does not support BTC wallets.' for
lnInvoiceCreateOnBehalfOfRecipient, and both globals.network values are mainnet.
Which BTC receive/invoice operation and recipient account should we use, and
which environment is intended for the hackathon?"

Do not paste account credentials, API secrets, PINs or recovery phrases into GitHub.

## Current product behaviour

The portfolio can display a reusable Lightning address and let visitors copy it.
Automatic Flash invoice creation, QR checkout and paid-status confirmation remain
unimplemented. No simulated payment success or currency conversion was added.

Before adding those features, verify invoice amount, recipient, Bitcoin network
and expiry; bind records server-side to the published portfolio; handle retries
without duplicate invoices; and mark PAID only after a provider-confirmed result.
A separate payment-record migration will be needed when that path is implemented.

## Sources

- https://docs.flashapp.me/mutations/lnInvoiceCreateOnBehalfOfRecipient
- https://docs.flashapp.me/queries/accountDefaultWallet
- https://docs.flashapp.me/queries/lnInvoicePaymentStatus
- https://docs.flashapp.me/guides/api-keys
- https://userdocs.flashapp.me/guides/bitcoin-wallet/
