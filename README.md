# Taste Folio

**Your skills, supported by your work.**

Taste Folio helps independent professionals publish credible portfolios they can
share with clients and employers. A portfolio explains what someone does, shows
their contribution to real projects, connects skills to evidence, and provides
clear service, rate and contact information.

Initial users: an indoor plant stylist, a lash technician and a fashion designer.
Product direction: Viola Kipkorir. Visual identity: maroon and gold.

**[Open the Cloudflare app](https://taste-folio.violakorir24.workers.dev/) ·
[Mentor: start here](MENTOR.md) · [Flash investigation](docs/FLASH.md)**

## Current status

Updated 16 November 2026. This is a hackathon MVP in active development.

| Area | Current evidence |
| --- | --- |
| Cloudflare hosting | Deployment reported Ready; account pages were independently loaded |
| D1 database and R2 uploads bucket | Created; initial database tables applied successfully |
| Supabase authentication | Connected; signup origin error fixed; owner reports creating a profile |
| Portfolio editor and publication | Implemented; draft, publication and ownership flows pass isolated integration tests |
| Project evidence, skills, experience and credentials | Implemented |
| Services, rates, email and WhatsApp | Implemented |
| M-Pesa and Lightning receiving details | Display and copy; optional Leave a tip action |\n| QR sharing and business cards | QR SVG download and ten-card A4 print sheet, from published profiles |
| Flash automatic invoices and payment confirmation | Pending API credentials, verified BTC support and implementation |
| Live testing with all three initial users | Pending |
| Project licence | Not selected |

The owner's successful profile creation is a user report. It does not establish
that every production upload, publication, email or account recovery flow has
been tested. [Testing](docs/TESTING.md) distinguishes automated and live evidence.

## Share a portfolio in person\n\nPublish a portfolio, then choose **Get QR code & business card** in Review & publish.\nDownload the QR SVG for your own cards or signs, or print the supplied business-card sheet.\nIn Work & contact, **Accept tips for my work** adds a tip action using the receiving\ndetails already supported. Performance clips use project evidence links.\n[Sharing and printing guide](docs/SHARING.md).\n\n## Help needed from a mentor

1. Confirm how to obtain an authenticated Flash API key and a matching test account.
2. Verify the supported BTC invoice operation. The public recipient-invoice call
   rejected a valid production BTC recipient with
   `Flash does not support BTC wallets.`.
3. Review the standalone authentication boundary and test with two accounts.
4. Help ship one complete client payment or tip journey, with the correct recipient
   and provider-confirmed receipt.

The private authenticated invoice operation has **not** been tested. The public
operation's failure does not establish that every Flash BTC API route is unavailable.
Both supplied endpoints reported `mainnet`; a testing hostname is not proof of test coins.

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
| [docs/FLASH.md](docs/FLASH.md) | Payment scope, observed errors and missing credentials |
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

There is no Flash checkout, payment ledger, automated payout, automatic M-Pesa
processing, escrow or independent credential verification yet. Receiving details
alone do not confirm that a payment was made. Publishing does not guarantee employment.

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
