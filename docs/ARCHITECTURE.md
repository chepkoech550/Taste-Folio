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
| Cloudflare D1 | Portfolio drafts, published snapshots and image ownership |
| Cloudflare R2 | Uploaded image bytes |
| Flash | Intended invoice/status provider; not integrated into the running app |

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

1. Add an introduction, skills and optional experience/credentials.
2. Describe project context, role, contribution, outcome and supporting work.
3. Add contact details, with optional services, rates and receiving information.
4. Review and publish a portfolio version.

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
| `/auth/sign-in`, `/auth/sign-up` | Account forms | Public; POST requires origin and CSRF checks |
| `/auth/sign-out` | Sign out confirmation | POST clears session |
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

M-Pesa and Lightning receiving information is display-only. The current code has
no payment ledger, Flash client, automatic invoice or payout handler.

The desired BTC flow is client wallet to professional wallet, with provider-confirmed
receipt. An API key authenticates access to its owning Flash account; it does not
establish authority to spend every portfolio user's funds. Platform-funded payouts
must be designed separately. [Flash status and evidence](FLASH.md).
