# Optional Nostr talent identity

## What is implemented

In the pitch editor's Proof & contact step, open Nostr (optional). Connect a
browser signer supporting window.nostr (NIP-07). The signer keeps the private key;
Taste receives a public key and a signed one-time connection challenge. The server
checks the signature, user binding, timestamp and expiry, then consumes the
challenge. Replays and a key already linked to another account are rejected.
Normal Supabase sign-in remains required; Nostr does not replace account access.

A connected published pitch shows its Nostr identity. This proves key control,
not real identity, certification, work quality or employment history.

## Publish only after preview

The owner can preview a public talent listing built from their current published
pitch. It includes name, pitch, skills, offers, selected project/credential evidence
links and the canonical Taste profile URL. Draft changes, contacts, applications,
private deliveries, payment references and receiving details are excluded.

When the owner chooses publish, the browser signer signs a replaceable kind 30402
classified talent listing using the NIP-99 format. The server validates its exact
content, tags, public key, timestamp and signature before storing it. The browser
then publishes to relay.damus.io and nos.lol and reports actual relay OK responses.
A server-accepted signed event alone does not prove relay publication.

Taste never asks for or stores a private key, nsec or wallet recovery phrase. It
never overwrites a global kind 0 profile. With no browser signer, the UI explains
what is needed and the rest of Taste stays usable.

## Limits and privacy

Relay copies can persist after unpublishing or disconnecting from Taste.
Disconnect removes the Taste key link; it does not delete relay copies. A listing
is not automatically republished when a pitch changes. Preview and publish again
when appropriate. There is no imported global talent feed, relay subscription,
Nostr login, certificate issuer verification, zap flow or job escrow in this MVP.

Local tests verify signed connection, invalid signatures, cross-account rejection,
challenge replay, exact listing content and exclusion of private fields. A live
browser signer and relay acceptance demonstration remains pending.

Protocol references: [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md),
[NIP-99](https://github.com/nostr-protocol/nips/blob/master/99.md),
[nostr-tools](https://github.com/nbd-wtf/nostr-tools).
