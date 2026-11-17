# MVP roadmap

Updated 17 November 2026. The next goal is one complete pitch, offer and enquiry journey followed
by a verified client Bitcoin payment or tip. Keep one active coding task at a time.

## Completed or reported

- [x] Cloudflare hosting connected to GitHub.
- [x] D1 and R2 created; initial schema applied.
- [x] Supabase authentication connected.
- [x] Signup origin bug fixed and corrected header verified live.
- [x] Owner reports successful profile creation.
- [x] Value-first pitch and up to three offers implemented.
- [x] Offer-specific enquiries, server-rendered discovery and legacy service compatibility implemented.
- [x] Local auth and expanded integration checks pass.
- [x] Published QR SVG downloads and business-card print layout added and deployed.
- [x] Optional tipping action uses existing receiving details without adding a payment backend.
- [x] Public Flash BTC invoice failure investigated and documented.

These completion marks identify the evidence above. They do not replace the
remaining production acceptance checks.

## P0: mentor and Flash access

- [ ] Give the mentor access to the private repository.
- [x] Create a Flash API key and verify wallet access.
- [x] Establish the BTC rejection and explicitly choose USD Cash Wallet settlement.
- [ ] Confirm why both supplied endpoints report mainnet.
- [ ] Verify required scopes and the receiving wallet for each professional.

A live unpaid USD invoice was generated; confirm the production receiving flow with its amount, recipient,
currency, network and expiry verified. [Investigation](FLASH.md).

## P0: verify the portfolio live

- [ ] Save and reload a real draft with permitted project images.
- [ ] Publish, edit the draft and confirm the public snapshot remains unchanged.
- [ ] Republish, open on another device and unpublish.
- [ ] Test two-account isolation and unpublished image access.
- [ ] Confirm email delivery and session renewal for the intended pilot.

Done when a visitor can understand the professional's contribution and contact
them, and accounts remain isolated.

## P0: implement client payments or tips

- [x] Create one invoice for a clearly agreed amount credited to the professional. (Implemented; local tests.)
- [x] Store the recipient and payment attempt server-side. (Implemented; local tests.)
- [x] Show QR/invoice and a supported wallet action. (Implemented; local tests.)
- [x] Confirm PAID only from the provider. (Implemented; local tests.)
- [x] Handle unpaid, expired, failed and duplicate requests. (Implemented; local tests.)
- [ ] Run an explicitly agreed funded demonstration on the verified network.

USD checkout is implemented; the owner reports an offer payment confirmed. Independent wallet-credit and funded milestone verification remain outstanding. Platform-funded rewards and payouts are a separate future flow.

## P0: three-user pilot

- [ ] Indoor plant stylist.
- [ ] Lash technician.
- [ ] Fashion designer.
- [ ] Record observed difficulty and the resulting fix.
- [ ] Obtain permission for content shown to judges.

## Submission

- [ ] Confirm organisers' latest deadlines and required public access.
- [ ] Select a project licence and retain third-party notices.
- [ ] Verify clean-checkout setup and configuration instructions.
- [ ] Review source/history for credentials before any visibility change.
- [ ] Prepare pitch and playable backup recording.
- [ ] Tag the tested submission commit with its actual limitations.

## Deferred

Messaging, reviews, rankings, scheduling, hiring algorithms, automated M-Pesa
processing, escrow, wallet custody and independent credential verification.


## Paid opportunities and optional Nostr

- [x] Add Get paid for your skills to the homepage.
- [x] One board, one account for hiring/earning and one My work page.
- [x] Buyer selection, professional acceptance and one to three agreed milestones.
- [x] Private delivery, revision, approval and provider-confirmed Lightning payment.
- [x] Optional verified Nostr key and previewed public talent listing.
- [x] Remove duplicate free-text pricing and separate experience/education forms.
- [x] Preserve existing published links, evidence, offer checkout and QR cards.
- [ ] Live two-account work flow and funded milestone settlement.
- [ ] Live browser signer and relay acceptance demonstration.
