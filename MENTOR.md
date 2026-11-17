# Mentor handover

Updated 17 November 2026.

**Project:** Taste Folio  
**Owner:** Viola Kipkorir  
**App:** https://taste-folio.violakorir24.workers.dev/  
**Repository:** https://github.com/chepkoech550/Taste-Folio

## What I am building

Taste helps people get paid for their skills. Professionals publish a pitch and
clear offers. Buyers can post an outcome, budget and acceptance criteria, select
one professional, and agree one to three milestones before work begins. The
professional submits work privately; the buyer approves it and pays over
Lightning into the professional's USD Flash Cash Wallet.

The same account can hire and earn. A one-step bounty uses the same opportunity
flow. There is no speculative contest or escrow. Optional Nostr connection proves
control of a public key and lets a professional sign a public talent listing;
it does not verify their qualifications.

The editor keeps four steps. We removed duplicate free-text offer pricing and
separate experience/education entry forms. Existing background records remain
available, with removal controls; new evidence goes through projects and links.
[Paid work](docs/WORK.md) · [Nostr](docs/NOSTR.md).

## Where we are

- Cloudflare deployment, D1 database and R2 bucket are set up.
- Supabase email/password authentication is connected.
- A browser form origin bug was fixed and the corrected header verified live.
- The owner reports successful profile creation after that fix.
- The editor, image access, draft/published separation and owner isolation pass
  local integration checks.
- M-Pesa and Lightning addresses are displayed and copied; optional tipping exposes those same details.
- Published profiles have QR SVG downloads and a printable business-card sheet.
- Review the added card route and print UI using [SHARING.md](docs/SHARING.md).
- USD offer checkout is implemented with an explicit price, recipient lookup, validated invoice QR and provider status. See [CHECKOUT.md](docs/CHECKOUT.md). The owner reports one offer payment confirmed. Wallet credit and funded milestone payments still need live verification.

The latest application-code check passed before the documentation-only updates:
TypeScript, build, auth, Flash and checkout tests plus Workers integration checks.
Auth-provider behaviour is simulated in these tests. Broader live acceptance is
still pending. A separate unauthenticated HTTP probe to /api/profiles returned
403 while account pages loaded. Please recheck public browsing in a normal
browser and inspect Cloudflare logs before treating it as a confirmed app bug.
No payment was sent by the assistant. The owner reported one confirmed USD 1.00 offer payment; new milestone payments use simulated provider responses in tests.

## The main technical help I need

### 1. Review work agreements and milestone checkout

The key is stored in Cloudflare and the owner reports a successful wallet access
check. BTC invoice calls were rejected. The owner explicitly chose USD Cash Wallet
settlement. A live USD recipient invoice and PENDING status were verified; the
owner also reported creation and expiry through the private diagnostic.

Public checkout now binds an explicit USD price and Flash address to a published
offer, creates a recipient invoice, validates its signature recovery/checksum,
mainnet amount and expiry, and stores the immutable request in R2. Payment status
is queried server-side. The app never sends funds. See [CHECKOUT.md](docs/CHECKOUT.md)
and [FLASH.md](docs/FLASH.md). Existing service prices were not converted or changed.

Review `lib/opportunities.mjs`, `lib/nostr-talent.mjs`, `lib/work-schema.mjs`, `lib/flash-checkout.mjs`, the two checkout routes, `app/offer-checkout.tsx`
and the checkout/integration tests. Best-effort in-memory burst protection is not
a global rate limit. There is no dispute, refund, escrow or payment dashboard.
Run one expressly authorised funded payment before claiming USD settlement works
end-to-end. Check Cash Wallet balance, expiry/retry behaviour and mobile wallets.

### 2. Review the authentication boundary

Start with:

- [worker/index.ts](worker/index.ts)
- [lib/standalone-auth.mjs](lib/standalone-auth.mjs)
- [app/chatgpt-auth.ts](app/chatgpt-auth.ts)
- [lib/server.ts](lib/server.ts)
- [tests/auth.test.mjs](tests/auth.test.mjs)
- [tests/integration.mjs](tests/integration.mjs)

The legacy helper filename remains, but the standalone production Worker removes
incoming identity headers and replaces them only after verifying a Supabase user.
Cookies are Secure, HttpOnly and host-only. Account forms require origin and CSRF
checks. Session renewal is server-side.

Review two-account isolation, session expiry, email delivery and the production
configuration. Password recovery UI and CAPTCHA are not implemented.

### 3. Verify the pitch and offer journey live

Use [the acceptance checklist](docs/TESTING.md). Confirm that a professional can
write a pitch, add an offer, save, upload, publish and share it, and that another account cannot edit
their draft or access unpublished images.

## Suggested review session

| Step | Outcome |
| --- | --- |
| Read this page and open the app | Shared understanding of the MVP |
| Run the checks locally | A reproducible starting point |
| Review the Flash evidence with the organisers | Confirmed endpoint, account, key permissions and Bitcoin network |
| Test one authenticated invoice without paying it | Correct amount, recipient, expiry and actual invoice network |
| Agree one bounded implementation task | A reviewable change with a clear completion check |

Before any funded demonstration, agree the payer, recipient, amount and fee limit.
A real payment has not been authorised merely by sharing an API endpoint.

## Repository access and configuration

The repository is currently private. The owner can invite your GitHub account
through repository Settings, Collaborators. No invitation has been sent by the
assistant.

Runtime values are configured in the owner's Cloudflare account. Ask the owner
to set values directly there; do not put secrets in a pull request or issue.
[Deployment guide](docs/CLOUDFLARE.md).

## Scope to protect

Finish one strong pitch, one agreed paid task and one verified Lightning payment story. New D1 tables are created idempotently at runtime; a matching Drizzle migration is included. Test an existing database as well as a fresh one. Defer
leaderboards, messaging, scheduling, reviews, escrow, wallet custody and hiring
algorithms. Preserve the maroon and gold interface.

Record fixes and test evidence in a focused branch or pull request. Help select a
project licence and confirm the organisers' current submission requirements
before tagging the final release.

