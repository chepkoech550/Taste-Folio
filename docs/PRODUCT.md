# Get paid for your skills

Taste connects people who can deliver with people who need work done. The public
headline is **Get paid for your skills.** Maroon and gold remain the visual identity.

## Two paths to work

A professional publishes a pitch, up to three offers, project evidence and a
contact path. A visitor can enquire, pay a USD-priced Flash offer, or tip using
the published receiving details. Printed QR cards keep the same published URL.

A buyer can post a paid opportunity with an outcome, budget, deadline and clear
acceptance criteria. Professionals apply with a published pitch. The buyer selects
one person; that person accepts the proposed scope and milestone amounts before
work begins. Delivery and review stay private. Approval makes payment due; only
Flash's PAID status confirms payment. A small bounty is simply one milestone.

[Work flow and boundaries](WORK.md).

## Keep the interface focused

There is one account for hiring and earning, one opportunity board and one My work
page. The pitch editor keeps four steps: Your pitch, Your offers, Proof & contact,
Review & publish. Offers have title, description and optional Price (USD).
The duplicate free-text price entry and separate experience/education forms were
removed. Existing background records can be reviewed or removed; projects and
HTTPS evidence links remain the path for new proof.

Nostr is optional under Proof & contact. A connected key can sign a public talent
listing for relays. Ordinary sign-in and the local talent pool work without it.
[Nostr identity and listing scope](NOSTR.md).

## Compatibility

The existing draft/published separation and stable /p/ links remain. Application
updates do not rewrite claims, prices or project evidence. Legacy offers are still
read when the offers array is absent; an explicit empty array stays empty. Existing
experience/credential data is preserved until its owner removes it and republishes.

New opportunity and Nostr tables are created idempotently; the original portfolio
and asset tables are preserved. No new runtime secrets are needed.

## Deliberately deferred

Chat, scheduling, rankings, automated matching, separate employer/seller accounts,
speculative contests, imported Nostr feeds, escrow, refunds, platform payouts and
independent credential verification. Taste facilitates agreement and payment;
it does not guarantee delivery, payment or employment.
