# Changelog

## Public offer Lightning checkout

- Added an optional exact USD price and Pay with Lightning for published offers using Flash receiving addresses.
- Added validated invoice QR/wallet checkout, expiry display and provider-confirmed payment status.
- Bound price and recipient server-side to published offers and saved immutable R2 payment records with idempotent creation.
- Added price/recipient tampering, checksum/network/expiry, retry and payment-state tests.
- Existing prices are unchanged; funded settlement remains untested.

## USD Cash Wallet invoice pilot

- Added an explicitly selected USD 1.00 private Lightning invoice test, settling to the pilot recipient’s USD wallet.
- Used the verified USD recipient operation, handled nullable satoshis and checked the invoice’s encoded amount.
- Kept USD test records separate from BTC failures and retained duplicate request protection.
- Verified a live public USD invoice and PENDING status; no funded payment or public checkout was enabled.

## Private Flash Bitcoin invoice pilot

- Added an owner-only, fixed-recipient 21-sat invoice test and provider status lookup.
- Verified key wallet ownership before requesting an invoice; kept invoice strings private in R2.
- Added conditional reservations to avoid duplicate creation and ambiguous automatic retries.
- Public offer checkout remains disabled until live invoice support is confirmed.

## Flash connection runtime fix

- Replaced an unsupported Cloudflare redirect mode that prevented the check from reaching Flash. Redirects remain blocked without forwarding credentials.
- Distinguished timeouts, unreadable responses and rejected redirects.
- Added a configured-key Workers integration test and extended safe error handling tests.

## Flash connection diagnostic

- Added a signed-in Flash connection check using the credentials stored in Cloudflare.
- Restricted credential destinations to official Flash endpoints and kept provider/account details server-side.
- Added tests for auth, origin protection, failed credentials, scope failures and safe status handling.
- Invoice creation and funded payments remain unverified and disabled.

## Unreleased

### Express value: pitch, offers and opportunity

- Lead public pages with a person's pitch and specific offers, then supporting work.
- Add up to three structured offers and offer-specific email/WhatsApp enquiries.
- Reorder the editor to Your pitch, Your offers, Proof & contact, Review & publish.
- Render discovery on the server and search needs across offers, skills and pitch.
- Add clearly labelled examples, including the street saxophonist.
- Preserve legacy service/rate records, draft/publication separation and printed QR links.
- Test empty/incomplete/excess offers, enquiry destinations and legacy compatibility.
\n\n### QR business cards and simple tipping\n\n- Generate a production portfolio QR code and download it as SVG.\n- Print ten 85 x 55 mm business cards on A4 from the published snapshot.\n- Add one optional Accept tips toggle; Leave a tip expands existing receiving details.\n- Use Book me for tipping profiles and keep share actions under one menu.\n- Keep video evidence in existing project links; omit extra designers and customisation forms.\n- Validate tipping requirements, unpublished card access and published snapshot separation.\n- Decode generated QR codes at small and print resolutions; verify download and tip actions in preview.\n\n### Mentor handover, 16 November 2026\n\n- Add MENTOR.md and make the README an index of current status and review needs.\n- Update architecture, testing, roadmap, setup and demo docs for Cloudflare and Supabase.\n- Distinguish user-reported progress, local tests, public Flash failures and the untested authenticated invoice path.\n- Document proposed Flash runtime names without claiming the code reads them yet.

- Fix browser signup and sign in forms by preserving same-origin request metadata.
  Cross-origin and opaque-origin requests remain rejected.

### Standalone Cloudflare authentication

- Email/password account pages, secure cookie sessions, provider verification and refresh.
- CSRF-protected account forms, safe redirects, sign out and forged-header rejection.
- Updated ownership integration tests to use verified sessions.
- Supabase runtime values configured; owner reports profile creation. Broader live user testing is pending.

### Implemented

- Guided portfolio editor with introduction, project evidence, work/contact and publication review.
- Skills connected to projects, with optional experience, credentials and rates.
- Account owned drafts, separate publication snapshots and stable slugs.
- Image uploads with ownership and publication access controls.
- M-Pesa and Lightning receiving details, displayed without processing payments.
- Integration checks for key validation and access boundaries.

### Repository organisation

- Project README, setup, architecture, roadmap, testing and demo documentation.
- Contribution and security guidance; explicit licence and AI-assistance status.
- Issue forms, pull request template and automated build/typecheck/integration workflow.

No tagged release has been published yet. Add a dated release entry when a tested submission version is tagged.

