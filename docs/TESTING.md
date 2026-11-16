# Testing

## Automated checks

```sh
npm run check
```

Runs TypeScript checks, a production build, then:

1. `node --test tests/auth.test.mjs`: 15 auth tests.
2. `node tests/integration.mjs`: built Worker checks in isolated Miniflare storage.

Authentication tests cover safe redirects, cookie flags, form origin/CSRF checks,
oversized requests, forged identity headers, provider verification, refresh,
invalid sessions, outages, sign out and caching.

Integration tests use a mocked Supabase provider and session cookies. They no
longer establish test users by trusting incoming identity headers. Coverage includes
the account form/redirect path, unauthenticated and forged-header rejection,
invalid origins, required portfolio content, draft/published separation, owner
isolation, server-rendered portfolios, upload access, unpublishing and unsafe links.

## Evidence as of 16 November 2026

| Check | Evidence |
| --- | --- |
| TypeScript, build, 15 auth tests and portfolio integration suite | Passed locally after the signup origin fix |
| Cloudflare deployment | Dashboard showed Ready; account page loaded independently |
| Initial hosted D1 tables | Owner reported successful SQL execution |
| Supabase runtime settings | Owner reported adding them in Cloudflare |
| Signup and profile creation after the origin fix | Owner reported profile created |
| Production session expiry, two-account isolation and all email flows | Not independently verified |
| External unauthenticated /api/profiles request | A separate HTTP probe returned 403; cause undiagnosed, browser recheck required |\n| Real Flash payment | Not performed |
| Public Flash recipient BTC invoice operation | Returned documented provider error |
| Authenticated Flash invoice with API key | Not tested; no key supplied |

The latest application-code validation was before later documentation-only commits.
No fresh application checks are implied by a documentation update. GitHub/Vercel
status and Cloudflare deployment status are distinct.

## Live acceptance checklist

Use consenting testers and record device, task, actual result and linked fix.

| Task | Expected result |
| --- | --- |
| Create an account and sign in | Reach the editor with a verified account |
| Sign out, then reopen editor | Server saves require sign in |
| Sign in as a second account | First account's draft and unpublished photos remain inaccessible |
| Save and reload | Saved account draft survives |
| Add project and skills | Personal role and contribution are clear |
| Upload valid/invalid files | Valid photo renders; invalid content is rejected |
| Publish incomplete content | Validation identifies missing information |
| Publish complete content | Stable portfolio URL opens on another device |
| Edit a published portfolio | Existing publication stays unchanged |
| Republish and unpublish | Public content follows the chosen action |
| Open email/WhatsApp and copy payment details | Correct external destination/details |
| Use a narrow phone screen | Primary actions remain usable |
| Let a session expire | Renewal works or sign in is requested clearly |

Flash acceptance remains pending. First verify the authenticated operation,
recipient currency, account permissions, amount, network and expiry. Then test
invoice status, duplicate requests and failure handling. Record any actual
payment separately with the agreed payer, recipient, amount and fees.

Passing local checks does not verify real email delivery, provider payments,
all browser layouts or employment outcomes. Use illustrative data in public
issues and obtain permission for identifiable photos or payment details.

## QR and tipping checks

The expanded integration suite checks tip profiles require receiving details,
Book me and Leave a tip render, cards reflect the published snapshot rather than
a newer draft, unpublished cards return 404, and payment receiving addresses are
not included in card output. No extra account or payment provider is involved.

During implementation, the generated card QR was independently decoded at 330px
and 106px to verify the canonical production URL. Browser checks verified the
SVG download event, opening tip details and the live card route for the owner's
published portfolio. Physical print output and narrow-phone acceptance should
still be checked before printing a batch. The cloud browser did not surface a
native print dialog for inspection.

## Pitch and offer checks

The value-first integration tests verify that offers precede proof on public pages,
the enquiry link names the selected offer, empty/incomplete offers cannot be
published, more than three offers are rejected, and legacy service/rate records
still display. Explicitly empty offer arrays do not resurrect old services.
The home page renders published offer information on the server.

Manual acceptance: write one pitch, add an offer, select its enquiry action,
search by a need mentioned in an offer, review the saxophonist example, then
confirm the existing published link and QR card still work. Messages, bookings
and payments are not submitted by these UI checks.
