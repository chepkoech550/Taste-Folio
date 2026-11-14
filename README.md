# Taste Folio

Repository: [chepkoech550/Taste-Folio](https://github.com/chepkoech550/Taste-Folio)

**Your skills, supported by your work.**

Taste Folio helps independent professionals create a portfolio that clients and employers can understand. People explain their contribution to projects, connect skills to evidence, add experience and credentials, and publish a stable portfolio link.

Initial user examples: an indoor plant stylist, a lash technician and a fashion designer.

## Project status

Hackathon MVP in development. The current app is deployed as a private preview:

[Open Taste Folio](https://ownwork-creative-portfolios.indigo-plum-6650.chatgpt.site)

The preview requires access to the Site. Repository visibility and website access are separate settings. A public GitHub repository alone does not make the app or portfolio links public.

| Working | Planned or pending |
| --- | --- |
| Four section portfolio editor | Flash Lightning checkout |
| Projects with role, contribution, outcome, photo and evidence link | Payment status confirmation |
| Skills mapped to project examples | External user testing and documented feedback |
| Experience and credential fields | Public website access after review |
| Account saved drafts and separate published versions | Backup demo recording and final pitch |
| Stable portfolio links and reversible unpublishing | Project licence selection |
| Search, email/WhatsApp links and print/PDF layout | Submission release |
| Optional M-Pesa and Lightning receiving details | Automated M-Pesa processing is outside the current MVP |

Qualifications, results and work descriptions are supplied by the professional. Taste Folio does not independently verify them or guarantee employment.

## Start here

- [Local setup](docs/SETUP.md)
- [How the app works](docs/ARCHITECTURE.md)
- [MVP roadmap and acceptance criteria](docs/ROADMAP.md)
- [Testing](docs/TESTING.md)
- [Demo and submission checklist](docs/DEMO.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Changelog](CHANGELOG.md)

## Quick start

Requires Node.js 22.13 or later and npm. Node.js 22 is the CI baseline.

```sh
npm ci
npm run build
```

Before running the development app, apply the existing database migration as described in [SETUP.md](docs/SETUP.md). The app uses Cloudflare D1 and R2 through the Sites runtime.

```sh
npm run dev
```

On a normal local machine, the starter offers simulated sign in for loopback development. The hosted app uses Sites authentication. Do not expose local mock authentication to the internet.

To run the automated checks:

```sh
npm run check
```

## Source map

| Location | Purpose |
| --- | --- |
| `app/` | Pages, portfolio interface and API routes |
| `lib/` | Shared validation, portfolio types and server helpers |
| `db/` | Database schema |
| `drizzle/` | Versioned database migrations |
| `tests/` | Integration checks in an isolated Worker environment |
| `docs/` | Setup, architecture, roadmap and demo guidance |
| `.github/` | CI, issue forms and pull request template |
| `worker/`, `scripts/`, `vendor/` | Runtime and starter infrastructure |
| `.openai/hosting.json` | Existing Site identity and storage binding names |

## Payments

M-Pesa and Lightning fields currently display receiving information for payments made in the client’s own app. There is no Flash invoice creation, automatic payment confirmation, STK Push or escrow yet. See the [roadmap](docs/ROADMAP.md) for the planned Lightning journey.

## Authorship and licences

Product concept and direction: **Viola Kipkorir**. OpenAI ChatGPT/Codex assisted with interface design, implementation and debugging. AI assistance is disclosed for the hackathon.

A licence for the original project code has **not been selected**. The repository should not be described as open source until an appropriate licence is added. Dependencies and starter code retain their existing licences and notices. See [third-party notices](THIRD_PARTY_NOTICES.md).

Never commit API keys, wallet recovery phrases, PINs or private customer data.
