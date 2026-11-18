# Taste Folio

Taste Folio helps independent professionals earn extra income from their skills and helps buyers with limited budgets find skilled help for a defined task. Professionals publish a shareable pitch with work samples and up to three offers. Buyers can pay for an existing offer or post a brief, select a professional and agree on the scope and price of up to three milestones.

Built by **Viola Kipkorir** for the Satoshi Sister Circle Sovereign Stack Hackathon.

**[Try the live app](https://taste-folio.violakorir24.workers.dev/) · [Demo guide](docs/DEMO.md) · [Architecture](docs/ARCHITECTURE.md)**

## Hackathon demo

1. Open the live app and browse the published talent listings. The demo uses Viola's real indoor plant styling offers and published work from an AfriBit Kibera contributor.
2. Open the office plant consultation offer to see what the buyer gets and what it costs.
3. Follow the **Pay with Lightning** flow to see the invoice and payment status. Flash confirmed one USD 1.00 offer payment during testing, as reported by the builder. The receiving Cash Wallet credit has yet to be independently verified.

The paid-work flow covers buyer briefs, applications, milestone agreements, private delivery and payment after approval. It was tested with simulated payment responses. Optional Nostr publishing lets a professional sign a public talent listing. Live milestone settlement and live Nostr signer and relay testing remain pending.

## Tech stack

| Component | Role |
| --- | --- |
| React, TypeScript and Vinext | App interface, server rendering and routes |
| Cloudflare Workers | Runs the deployed app |
| Cloudflare D1 | Stores portfolios, publication snapshots and work records |
| Cloudflare R2 | Stores uploaded images and private payment records |
| Supabase Auth | Email sign-in and session management |
| Flash and Bitcoin Lightning | USD-priced recipient invoices and payment confirmation |
| Nostr | Optional signed public talent listings |

## Current status

Updated 18 November 2026. This is a hackathon MVP in active development.

| Area | Current evidence |
| --- | --- |
| Cloudflare hosting | Deployment reported Ready; account pages were independently loaded |
| D1 database and R2 uploads bucket | Created; initial database tables applied successfully |
| Supabase authentication | Sign-in/signup, Show/Hide password and Forgot password implemented; general-user signup and real email delivery still need SMTP/configuration verification |
| Portfolio editor and publication | Implemented; draft, publication and ownership flows pass isolated integration tests |
| Project evidence and skills | Implemented; existing background records retained; separate experience/education entry forms removed |
| Pitch and up to three specific offers | Implemented, with title, benefit/scope and optional price |
| Offer-specific email and WhatsApp enquiries | Implemented |
| Discovery by need, skill, name or place | Implemented; public listings render on the server |
| M-Pesa and Lightning receiving details | Display and copy; optional Leave a tip action |
| QR sharing and business cards | QR SVG download and ten-card A4 print sheet, from published profiles |
| Flash USD offer checkout | Implemented: explicit USD price, Flash recipient, invoice QR/wallet action and provider status; local checks pass; owner reports one offer payment confirmed; Cash Wallet credit not independently verified |
| Paid opportunities and milestones | Implemented and tested in isolated storage; buyer selection, professional agreement, private delivery, review and provider-confirmed payment |
| Optional Nostr talent identity | Signed connection and public listing implemented; live signer/relay demonstration pending |
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

1. Review the opportunity agreement, delivery privacy and milestone recipient/price binding.
2. Run one explicitly agreed funded payment to verify the recipient's Cash Wallet balance.
3. Review account recovery, two-account isolation and pilot onboarding.
4. Confirm Flash account eligibility and settlement behaviour for each pilot professional.

The saved Flash key passes the wallet-read check. BTC invoice operations were
rejected, so the owner explicitly chose USD Cash Wallet settlement. A live public
USD recipient invoice was generated and returned PENDING; the owner subsequently
reported successful creation and EXPIRED status through the private test.
Both supplied endpoints reported mainnet. The owner subsequently reported a provider-confirmed USD 1.00 offer payment. Its Cash Wallet credit has not been independently checked. The new milestone flow has only been tested with simulated provider responses.
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

This runs TypeScript checks, a production build, 42 unit tests and Worker integration tests. Tests use isolated storage and simulated auth and Flash providers. See [paid work](docs/WORK.md) and [Nostr](docs/NOSTR.md) for the new flows and their limits.

## Find your way around

| Location | Purpose |
| --- | --- |
| [MENTOR.md](MENTOR.md) | Handover, priorities and review checklist |
| [docs/SETUP.md](docs/SETUP.md) | Local development |
| [docs/CLOUDFLARE.md](docs/CLOUDFLARE.md) | Deployment and runtime configuration |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Authentication, data flow and routes |
| [docs/WORK.md](docs/WORK.md) | Opportunities, agreements, private delivery and milestone payments |
| [docs/NOSTR.md](docs/NOSTR.md) | Optional signed identity and public talent listings |
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

OpenAI Codex assisted with implementation and debugging. ChatGPT assisted with product design and drafting hackathon materials. Viola directed the product and design decisions. A licence
for original project code is still pending; retain all dependency and starter
notices. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md),
[SECURITY.md](SECURITY.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

Keep API keys, passwords, PINs, recovery phrases and private customer data out of
source, issues and shared screenshots.

