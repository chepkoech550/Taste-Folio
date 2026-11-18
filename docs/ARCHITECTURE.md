# Architecture

## Runtime and data

Taste Folio uses React and Vinext on a standalone Cloudflare Worker. It began from
the Sites starter; the current GitHub deployment is connected to Cloudflare.
The original private Sites preview has a separate source and authentication gateway.

| Component | Responsibility |
| --- | --- |
| React, app routes and Vinext | Portfolio UI, server rendering and API handlers |
| Cloudflare Worker | Request handling and trusted identity boundary |
| Supabase Auth | Account credentials, verified identity and session renewal |
| Cloudflare D1 | Portfolio drafts, published snapshots, image ownership, opportunities, signed Nostr identities and challenges |
| Cloudflare R2 | Uploaded image bytes and private immutable payment records |
| Flash | USD-settled recipient invoices and payment-status queries |

## Authentication

In production, `worker/index.ts` calls `authenticateRequest` from
`lib/standalone-auth.mjs`. It removes visitor-supplied `oai-authenticated-*`
headers, verifies the session with Supabase `/user`, and sets identity headers
only from the provider-verified account. Expired access can renew through a
refresh token and is verified again.

`app/chatgpt-auth.ts` retains its starter filename. On the standalone app it reads
the verified identity supplied by the Worker. `lib/server.ts` supplies the owner
ID used by portfolio and media handlers. Browser state does not authorize writes.

Account forms use same-origin checks, CSRF tokens and host-only Secure/HttpOnly
cookies. Their Referrer-Policy is `same-origin`, preserving the Origin header on
native browser form submissions. Account-specific responses bypass shared caches.
Local development may use loopback-only simulated identity.

## User journey and records

1. Express value in a headline and short pitch.
2. Add one to three offers: what someone gets and an optional price.
3. Add work supporting the offer, contact details and optional receiving details.
4. Review and publish the pitch.

The database name and /p/ route remain unchanged for compatibility. The public page
leads with pitch and offers; evidence and optional background follow. Each Enquire
action includes the selected offer in an email or WhatsApp message.

The optional offers array lives in the existing JSON. lib/offers.ts reads absent
arrays as legacy service/rate records and prepares them for editing, limiting the derived description to 600 characters while preserving the original pitch. An explicit
empty array means the user removed the offers and cannot silently resurrect a
legacy service. Publishing requires one clear offer. No D1 migration is required.

Home renders published listings on the server and passes them to the client for
need-based filtering. Search considers offers, pitch, skills, name and location.
Illustrative examples are separated from real published people.

D1 `portfolios` stores one record per user, with a stable slug, private draft JSON
and separate published JSON snapshot. Saving a draft does not replace the published
snapshot. Publishing replaces it; unpublishing keeps the draft.

D1 `assets` stores image ownership and publication state. R2 stores image bytes.
Draft images are owner-only. Publishing exposes images referenced by the published
version. Unpublishing or removing an image from that version revokes anonymous
access on subsequent requests.

## Routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Browse and search portfolios | Public app route; verify live access separately |
| `/edit` | Editor and local drafting | Account required for server saves, uploads and publishing |
| `/p/[slug]` | Published portfolio | Published snapshot |
| `/p/[slug]/card` | QR download and business-card printing | Published snapshot only; unpublished returns 404 |
| `/auth/sign-in`, `/auth/sign-up` | Account forms | Public; POST requires origin and CSRF checks |
| `/auth/sign-out` | Sign out confirmation | POST clears session |
| `/auth/forgot-password` | Request recovery email | Exact origin and CSRF protected POST |
| `/auth/callback` | Exchange browser-bound recovery code | S256 PKCE verifier required |
| `/auth/reset-password` | Set matching new password | Separate verified recovery token, origin and CSRF |
| `/signin-with-chatgpt` | Legacy sign in link | Routed to standalone account flow in production |
| `GET /api/portfolio` | Owner's draft and publication state | Signed-in owner |
| `POST /api/portfolio` | Save, publish or unpublish | Signed-in owner and origin check |
| `GET /api/profiles` | Published portfolio collection | Public app handler |
| `POST /api/upload` | Upload a photo | Signed-in user and origin check |
| `GET /api/media/[id]` | Image bytes | Owner or currently published image |

## Validation and limits

`lib/portfolio.ts` shares validation between browser and server. Uploads accept
JPG, PNG and WebP under 5 MB, with a 60-upload-per-owner MVP limit. File signatures
are checked. Publishing rejects references to another user's assets. Evidence
links must use HTTPS.

Skills, qualifications, outcomes and portfolio claims are supplied by the user.
The platform does not independently verify credentials.

## Payment boundary

Published offers with an explicit usdPrice and a username@flashapp.me address
show Pay with Lightning. The server resolves the recipient's USD wallet from the
published address and reads the amount from the published offer. Buyer-supplied
prices and recipients are ignored. USD settlement is explicit; original free-text
rates remain available and are never automatically converted.

POST /api/checkout requires an exact Origin, a UUID idempotency token and a published
offer. R2 conditional writes reserve invoice creation. The record contains the
published offer identity, price, Flash destination and validated BOLT11 invoice.
GET /api/checkout/[id] queries only that stored invoice, caches checks briefly and
never downgrades PAID. The UUID is a bearer receipt reference and cannot be listed
through the app. Both responses bypass shared caches. No buyer account is needed.
The app never initiates a payment or payout; the payer confirms in their own wallet.
See [CHECKOUT.md](CHECKOUT.md) for bounds and remaining live checks.

## QR sharing and tipping actions

An optional acceptTips field lives in portfolio JSON; no schema migration is needed.
A tipping profile expands receiving details through Leave a tip and labels its
contact action Book me. It creates no invoice or payment confirmation.

CardStudio uses qrcode.react locally, with a white quiet zone. lib/portfolio-links.ts
supplies the canonical production URL so printed codes never point to previews.
Only published name, headline, contact and tipping status reach the card page.
The browser prints ten 85 x 55 mm cards on A4; visitors can also download the QR SVG.
See [SHARING.md](SHARING.md).


## Private Flash invoice pilot

The owner-only invoice diagnostic uses the existing private R2 binding for one fixed-recipient test record, outside the assets namespace. It has no public checkout endpoint. Exact-origin checks, verified app identity and ownership of the fixed pilot profile gate creation/status access. The Flash account must control the target wallet in the explicitly selected currency. The current private UI uses USD Cash Wallet settlement; BTC mode remains only for regression checks. See [FLASH.md](FLASH.md) for operation, retry and storage details.

## Paid work and Nostr extension

The /opportunities board is public; /opportunities/new and /work require verified
authentication. /opportunities/[id] renders a role-filtered work view. GET/POST
/api/opportunities and /api/opportunities/[id] use the existing identity boundary;
mutations require exact Origin. lib/opportunities.mjs owns state transitions and
D1 version checks. Private proposals, delivery and payment records never enter a
public projection. Existing checkout handles immutable recipient invoices in R2.
[Agreement and payment design](WORK.md).

/api/nostr is account-private. A one-time signed challenge binds a key to the
verified account. lib/public-pitches.ts attaches only verified public identity to
published listings. Kind 30402 talent listings are derived from published content,
validated server-side and sent to relays by the browser after explicit preview.
[Identity and relay boundaries](NOSTR.md).

lib/work-schema.mjs adds new tables/indexes idempotently on first use. Existing
portfolio and image data is preserved. drizzle/0001_wise_daredevil.sql records the
same schema for normal migration tooling. Dashboard secrets and bindings remain
unchanged.
