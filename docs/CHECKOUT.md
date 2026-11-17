# Pay with Lightning

## Enable an offer

1. Sign in and open Your offers in the editor.
2. Enter an exact Lightning price (USD), such as 25.00. This is the amount the
   recipient will receive as a USD balance in Flash; it is not a conversion of
   the older free-text rate. The accepted range is USD 0.01 to 10,000.00.
3. In Proof & contact, open Payment receiving details and enter the professional's
   username@flashapp.me address. No API key belongs in the profile.
4. Review and publish. The public offer now shows Pay with Lightning.

Other Lightning address providers still work as displayed receiving details, but
this checkout integration only supports Flash USD wallets. Illustrative samples
never create invoices. The editor preview shows a disabled payment button.

## Buyer journey

No buyer account is required. The button creates an unpaid invoice and displays
the published offer, seller, Flash destination, USD price, QR and wallet link.
The payer confirms the actual Bitcoin payment in their own wallet. Taste Folio
never calls a payment-send operation. It checks the saved invoice through Flash
and displays Paid only for PAID. Other supported states are PENDING and EXPIRED.
Failed status queries do not confirm payment. A paid receipt remains paid.

Price and recipient come from the published snapshot. Draft edits cannot change
an issued invoice. Repeated clicks reuse the browser's UUID and saved request.
An existing token cannot be repurposed after the published amount or recipient
changes. A new token is created only through the explicit new-invoice action.
Do not pay a replacement before checking whether the earlier payment succeeded.

## Implementation and review

`lib/flash-checkout.mjs` resolves the profile's Flash USD wallet and uses
lnUsdInvoiceCreateOnBehalfOfRecipient. It requests a five-minute invoice with
amount in cents. BitcoinJS bolt11 checks encoding/checksum and signature recovery;
the app requires mainnet, positive amount and bounded expiry. Nullable provider
satoshis is supported. The invoice contains the provider's BTC quote for the USD
amount, not an app-generated exchange rate.

Records are private R2 objects under internal/offer-payments/<UUID>.json.
The UUID is a bearer receipt reference. No app API lists records. The public
response contains only payment details and the published seller/offer snapshot;
it never contains API credentials or Flash wallet IDs. Conditional writes prevent
duplicate creation for one UUID. An uncertain mutation is not retried automatically.
All provider requests use an endpoint allowlist, manual redirect rejection and
timeouts. The server briefly caches status checks and never downgrades PAID.

The public creation route has exact-origin checks and best-effort per-isolate
burst protection (20 requests per minute per observed IP). This is not a global
abuse limit. Broader use needs a Cloudflare rate-limit rule/binding and an explicit
payment-record retention policy. There is no escrow, refund, dispute system,
order dashboard or guarantee of service delivery.

Automated tests use signed fixtures and mocked provider replies, including in
the Workers runtime. Browser QA used an explicitly labelled local fixture and
made no payment. A real funded transaction and actual Cash Wallet settlement
remain untested. The existing published service price was not changed; the owner
chose to enter the desired USD amount themselves.

A separate live unpaid USD 1.00 Flash recipient invoice passed the production decoder, including network, amount and expiry checks. No payment was sent during that verification.
