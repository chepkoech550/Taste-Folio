# Express value

Taste Folio helps someone express what their skills make possible and offer it
to another person. Work, experience and credentials give the offer credibility.

## Core journey

1. A person writes a pitch: who they help and what they can do.
2. They add up to three offers, each with a title, scope/benefit and optional price.
3. They show work and provide a contact path.
4. A visitor searches for a need, understands the offer and starts a conversation.
5. Optional tips use published receiving details while Flash is pending.

Example: a street saxophonist pitches live music for events and restaurants,
shows a performance clip through project evidence, and can receive support from
people who discover the work through a QR code.

## Keep the interface focused

The four editor steps are Your pitch, Your offers, Proof & contact, Review &
publish. An offer has three fields. Background and payment details remain optional.
There is one reusable QR code and one business-card print layout.

Enquire opens an offer-specific email or WhatsApp message. It does not confirm a
booking, accept a contract, send a payment or create an invoice. No cart, scheduling
system, platform payout or automatic payment confirmation has been implemented.

## Existing data and links

The bio and headline fields now serve the pitch. An optional offers array stores
structured offers in the existing draft/published JSON.

When offers is absent, the former service/rate fields appear as a legacy offer,
using an excerpt of the existing bio as its description. This uses supplied content rather than
inventing a new claim. Opening an old draft prepares that offer for editing.
An explicit empty offers array never falls back to the legacy service.

Publishing requires at least one clear offer, plus the existing pitch, evidence
and contact checks. Existing published records remain readable. Stable /p/ links
and printed QR destinations are unchanged. No migration or runtime setting is needed.

The owner should review their pitch wording and offer scope before republishing.
Application updates do not rewrite their saved project claims or prices.
