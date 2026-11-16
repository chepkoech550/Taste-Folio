# Mentor handover

Updated 16 November 2026.

**Project:** Taste Folio  
**Owner:** Viola Kipkorir  
**App:** https://taste-folio.violakorir24.workers.dev/  
**Repository:** https://github.com/chepkoech550/Taste-Folio

## What I am building

A shareable portfolio that helps a professional communicate their skills through
work they can explain and stand behind. Users describe a project, their own role,
contribution and outcome, then publish skills, services, rates and contact details.

The first examples are an indoor plant stylist, a lash technician and a fashion
designer. The owner is building this for a hackathon and is learning development.
Keep the review practical and focus on one complete user journey.

## Where we are

- Cloudflare deployment, D1 database and R2 bucket are set up.
- Supabase email/password authentication is connected.
- A browser form origin bug was fixed and the corrected header verified live.
- The owner reports successful profile creation after that fix.
- The editor, image access, draft/published separation and owner isolation pass
  local integration checks.
- M-Pesa and Lightning addresses are displayed and copied; optional tipping exposes those same details.\n- Published profiles have QR SVG downloads and a printable business-card sheet.\n- Review the added card route and print UI using [SHARING.md](docs/SHARING.md).
- Flash invoice generation, checkout and payment confirmation remain unimplemented.

The latest application-code check passed before the documentation-only updates:
TypeScript, build, 15 authentication tests and portfolio integration tests.
Auth-provider behaviour is simulated in these tests. Broader live acceptance is
still pending. A separate unauthenticated HTTP probe to /api/profiles returned\n403 while account pages loaded. Please recheck public browsing in a normal\nbrowser and inspect Cloudflare logs before treating it as a confirmed app bug.\nNo real payment has been sent in this work.

## The main technical help I need

### 1. Establish the supported Flash BTC path

The organisers supplied:

- https://api.test.flashapp.me/graphql
- https://api.flashapp.me/graphql
- https://docs.flashapp.me/guides/introduction

We have endpoint URLs and a valid production receiving account. An API key has
not been provided or configured. The production account resolved both BTC and
USD wallets; its default receiving wallet was USD at the time checked.
The owner selected **Bitcoin settlement**.

The public `lnInvoiceCreateOnBehalfOfRecipient` operation returned
`Flash does not support BTC wallets.` on both endpoints, including a request
explicitly targeting the valid production BTC wallet. Neither request returned an
invoice. Both endpoints also reported `globals.network = mainnet`.

An authenticated `lnInvoiceCreate` call using an account-scoped key has not been
tested. Please help distinguish a public-operation limitation, account permissions
and a changed provider implementation. [Exact evidence](docs/FLASH.md).

Desired first payment story: a client tips or pays a professional through an
invoice credited to that professional's BTC wallet. The client pays from their
own wallet. Platform-funded rewards and payouts are a separate funding and
authorization flow and can wait.

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

### 3. Verify the portfolio journey live

Use [the acceptance checklist](docs/TESTING.md). Confirm that a professional can
save, upload, publish and share a portfolio, and that another account cannot edit
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

Finish one strong portfolio and one verified Bitcoin payment story. Defer
leaderboards, messaging, scheduling, reviews, escrow, wallet custody and hiring
algorithms. Preserve the maroon and gold interface.

Record fixes and test evidence in a focused branch or pull request. Help select a
project licence and confirm the organisers' current submission requirements
before tagging the final release.
