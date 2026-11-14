# Architecture

## Application

Taste Folio uses React, Vinext and a Cloudflare Worker. Routes under `app/` serve the interface and API. `lib/portfolio.ts` defines portfolio validation rules shared between the browser and server.

## User journey

1. Write an introduction and skills.
2. Add project case studies and identify the skills demonstrated.
3. Add a contact method, with optional services and payment receiving information.
4. Review the portfolio and publish a version.

The public-facing portfolio includes project evidence, experience, credentials and contact links. Skills linked to projects are labelled as shown in those projects; that label is not independent verification.

## Records

D1 `portfolios` stores one record per signed-in user, including a stable slug, private draft JSON and a separate published JSON snapshot. Editing or saving a draft does not replace the published snapshot. Publishing replaces the snapshot; unpublishing removes it while keeping the draft.

D1 `assets` stores upload ownership and whether each image is referenced by the current published portfolio. R2 stores image bytes. Draft images are owner-only. Publishing exposes the images referenced by that version; unpublishing or removing an image from the published version revokes anonymous access on subsequent requests.

## Routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Browse/search published portfolios | Subject to Site audience |
| `/edit` | Portfolio editor | Writing requires sign in |
| `/p/[slug]` | Published portfolio | Subject to Site audience |
| `GET /api/portfolio` | Current user's draft and publication state | Owner |
| `POST /api/portfolio` | Save, publish or unpublish current user's portfolio | Owner + origin check |
| `GET /api/profiles` | Published portfolio collection | Subject to Site audience |
| `POST /api/upload` | Upload an owned project or profile image | Signed in + origin check |
| `GET /api/media/[id]` | Read an image | Owner or published image, within Site audience |

## Boundaries

Sites owns sign in and injects identity headers. Server handlers enforce ownership; browser state is not an authorization mechanism. The Site's current private audience also restricts visitors to published pages.

Image uploads allow JPG, PNG and WebP under 5 MB, with a sixty upload per owner MVP limit. The app checks file signatures and rejects references to another user's assets. Portfolio evidence links must use HTTPS.

M-Pesa and Lightning details are display-only. There is no payment provider integration or payment ledger. Flash invoice creation and server-confirmed status tracking are planned.
