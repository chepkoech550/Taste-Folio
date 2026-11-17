# Taste Folio

**Express your value. Make an offer. Give people a way to work with you.**

Taste Folio is a platform where people pitch what their skills make possible.
A person explains who they help, publishes up to three clear offers, supports
those offers with work, and gives visitors a direct way to enquire or tip.

The core journey is **pitch → offers → proof → opportunity**. A portfolio of work
supports the pitch. The public experience leads with what someone can do for you.

Use cases: an indoor plant stylist, a lash stylist, a fashion designer and a street saxophonist.
Product direction: Viola Kipkorir. Visual identity: maroon and gold.

**[Open the Cloudflare app](https://taste-folio.violakorir24.workers.dev/) ·
[Mentor: start here](MENTOR.md) · [Flash investigation](docs/FLASH.md)**

## Current status

Updated 17 November 2026. This is a hackathon MVP in active development.

| Area | Current evidence |
| --- | --- |
| Cloudflare hosting | Deployment reported Ready; account pages were independently loaded |
| D1 database and R2 uploads bucket | Created; initial database tables applied successfully |
| Supabase authentication | Connected; signup origin error fixed; owner reports creating a profile |
| Portfolio editor and publication | Implemented; draft, publication and ownership flows pass isolated integration tests |
| Project evidence, skills, experience and credentials | Implemented |
| Pitch and up to three specific offers | Implemented, with title, benefit/scope and optional price |
| Offer-specific email and WhatsApp enquiries | Implemented |
| Discovery by need, skill, name or place | Implemented; public listings render on the server |
| M-Pesa and Lightning receiving details | Display and copy; optional Leave a tip action |
| QR sharing and business cards | QR SVG download and ten-card A4 print sheet, from published profiles |
| Flash USD offer checkout | Implemented: explicit USD price, Flash recipient, invoice QR/wallet action and provider status; local checks pass; funded settlement not yet tested |
| Live testing with all three initial users | Pending |
| Project licence | Not selected |

The owner's successful profile creation is a user report. It does not establish
that every production upload, publication, email or account recovery flow has
been tested. [Testing](docs/TESTING.md) distinguishes automated and live evidence.

## Express value and share it

Publish a portfolio, then choose **Get QR code & business card** in Review & publish.
Download the QR SVG for your own cards or signs, or print the supplied business-card sheet.
In Proof & contact, **Accept tips for my work** adds a tip action using the receiving
details already supported. Performance clips use project evidence links. Existing services/rates appear as a legacy offer; saved data and /p/ links remain compatible.
[Sharing and printing guide](docs/SHARING.md).

See [the product direction](docs/PRODUCT.md) for the value-first flow and data compatibility.

## Help needed from a mentor

1. Review the USD offer checkout and recipient/price binding.
2. Run one explicitly agreed funded payment to verify the recipient's Cash Wallet balance.
3. Review account recovery, two-account isolation and pilot onboarding.
4. Confirm Flash account eligibility and settlement behaviour for each pilot professional.

The saved Flash key passes the wallet-read check. BTC invoice operations were
rejected, so the owner explicitly chose USD Cash Wallet settlement. A live public
USD recipient invoice was generated and returned PENDING; the owner subsequently
reported successful creation and EXPIRED status through the private test.
Both supplied endpoints reported mainnet. No funded transfer has been performed.
[Enable Pay with Lightning on an offer](docs/CHECKOUT.md).

Start with [MENTOR.md](MENTOR.md) for a bounded review, entry points and next tasks.

## Run locally

Requires Node.js 22.13 or later, npm and Git. Node.js 22 is the CI baseline.

```sh
npm ci
npm run build
```

Apply the initial migration once to a fresh local database using
[SETUP.md](docs/SETUP.md), then:

```sh
npm run dev
```

Local loopback development can use the starter's simulated identity. Production
uses verified Supabase sessions. Keep mock authentication local.

```sh
npm run check
```

This runs TypeScript checks, a production build, authentication tests and portfolio
integration tests. Tests use isolated storage and a simulated auth provider.

## Find your way around

| Location | Purpose |
| --- | --- |
| [MENTOR.md](MENTOR.md) | Handover, priorities and review checklist |
| [docs/SETUP.md](docs/SETUP.md) | Local development |
| [docs/CLOUDFLARE.md](docs/CLOUDFLARE.md) | Deployment and runtime configuration |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Authentication, data flow and routes |
| [docs/FLASH.md](docs/FLASH.md) | Flash evidence, USD settlement and private diagnostic |
| [docs/CHECKOUT.md](docs/CHECKOUT.md) | Enable an offer and understand checkout behaviour |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Remaining MVP work and completion criteria |
| [docs/TESTING.md](docs/TESTING.md) | Checks, evidence and live acceptance tasks |
| [docs/DEMO.md](docs/DEMO.md) | Demo and submission preparation |
| [app/ownwork.tsx](app/ownwork.tsx) | Portfolio interface; filename retains the earlier project name |
| [lib/portfolio.ts](lib/portfolio.ts) | Shared validation and portfolio types |
| [lib/standalone-auth.mjs](lib/standalone-auth.mjs) | Standalone authentication and account pages |
| [worker/index.ts](worker/index.ts) | Worker entry and trusted identity boundary |
| [db/schema.ts](db/schema.ts), [drizzle/](drizzle/) | Data schema and migration |
| [tests/](tests/) | Auth and portfolio checks |

## Deployment and payments

GitHub `main` is connected to Cloudflare Workers Builds. This project uses
Vinext and a Worker, rather than the standard Next.js deployment expected by the
earlier Vercel setup. Generated Worker configuration is in `dist/server/wrangler.json`.

The original Sites preview is historical and remains separate:
https://ownwork-creative-portfolios.indigo-plum-6650.chatgpt.site

USD-priced offers can use Flash Lightning checkout with durable R2 payment records.
M-Pesa and generic Lightning tipping details remain display-only. Automated payouts,
M-Pesa processing, escrow and independent credential verification are not implemented.
Only a provider-confirmed status marks a checkout paid. Publishing does not guarantee employment.

## Access, authorship and licence

The repository is private as checked on 16 November 2026. Invite a mentor as a
collaborator before sharing code links. Website access and repository visibility
are separate.

OpenAI ChatGPT/Codex assisted with design, implementation and debugging. A licence
for original project code is still pending; retain all dependency and starter
notices. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md),
[SECURITY.md](SECURITY.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

Keep API keys, passwords, PINs, recovery phrases and private customer data out of
source, issues and shared screenshots.

