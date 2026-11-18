# Standalone Cloudflare deployment

The GitHub copy is configured for Worker `taste-folio`, D1 database
`taste-folio-db` (`49a2578e-5716-4758-9ec4-779b49b16f01`), binding
`DB`, and R2 bucket `site-creator-r2`, binding `BUCKET`.

After creating the database, apply `drizzle/0000_fat_daredevil.sql` once
to the empty database using the D1 dashboard Console. Do not rerun it
against a populated database. The migration creates assets, portfolios and
two unique indexes. Existing databases must be inspected before migration.

Build command: `npm run build`.
Deploy command: `npx wrangler deploy`.
The Cloudflare Vite plugin generates `dist/server/wrangler.json`.

## Current account setup\n\nAs of 16 November 2026, the owner has created D1/R2, applied the initial schema,\nconfigured the two Supabase runtime values and reported successful profile\ncreation. The signup origin bug is fixed. Do not recreate resources or reapply\nthe initial migration on the existing database. The steps below are for review\nand fresh environments.\n\n## Connect authentication

The standalone Worker now supports Supabase email/password authentication. Its
account pages use the maroon and gold brand. Until configuration is present,
sign in displays a setup message and all account writes remain protected.

1. Create a Supabase project. Portfolio records and uploads stay in Cloudflare.
2. In Supabase Authentication URL Configuration, set Site URL to
   `https://taste-folio.violakorir24.workers.dev` and allow the redirect URL
   `https://taste-folio.violakorir24.workers.dev/auth/sign-in` and
   `https://taste-folio.violakorir24.workers.dev/auth/callback`.
3. Obtain the Project URL and the **publishable** API key (`sb_publishable_...`).
   The Worker deliberately rejects secret/service-role and legacy keys.
4. In Cloudflare Worker settings, configure runtime values `SUPABASE_URL` and
   `SUPABASE_PUBLISHABLE_KEY`. Secrets or variables are supported. These must be
   runtime bindings, not just build environment variables. Do not commit values.
   The generated Wrangler configuration preserves dashboard variables on deploy.
5. Deploy the latest commit and open `/auth/sign-in` on the production URL.
6. In Supabase, configure a custom SMTP service before opening signup to general
   users. The built-in mail service is restricted to project team addresses and
   has a low rate limit. Keep email confirmation enabled. For a bounded hackathon
   pilot, create consenting testers using Authentication Users, with confirmed
   emails, and let them sign in with their own test passwords. Do not use or ask
   testers for passwords they reuse elsewhere.

Sign in returns to the portfolio editor. Sign out asks for a POST confirmation.
Passwords are sent to Supabase over HTTPS and are not stored in D1 or R2.
Sessions use Secure, HttpOnly, SameSite=Lax host-only cookies. Every authenticated
request verifies its access token with Supabase `/user`; expired access tokens
can renew through the refresh token and are verified again. Untrusted incoming
identity headers are removed before setting any provider-verified identity.
Responses bypass shared caching. Sign out clears browser cookies and attempts
provider session revocation; existing access tokens follow provider expiry rules.

Authentication tests use a simulated provider. The owner reported successful\nprofile creation after configuration. Email delivery, refresh and two-account\nisolation still need broader live acceptance tests. Forgot password, browser-bound recovery and password visibility controls are implemented.
CAPTCHA integration is not implemented. Review auth rate limits and SMTP capacity.

No extra D1 migration is required for authentication. Supabase supplies stable
user IDs for the existing owner_id columns. No portfolios existed on the new D1
before this integration, so there is no identity migration in this deployment.

The original Sites-hosted source and audience are unchanged by this GitHub update.

## Flash configuration is still proposed

`FLASH_API_URL` (variable) and `FLASH_API_KEY` (secret) are the proposed runtime
names. The current application does not read them yet. Adding them alone will
not enable payments. No Flash API key has been supplied or configured in this work.
Authenticate with a key for the matching Flash environment and implement the
server integration only after verifying BTC operation support. [Flash evidence](FLASH.md).


## Signup and recovery support, 18 November 2026

1. In Supabase Authentication, confirm email/password signup is enabled.
2. Configure custom SMTP under Authentication > Email > SMTP settings. The built-in
   provider sends only to project-team addresses and has a low sending limit.
   Keep confirmation enabled. Credentials belong in Supabase, never this repository.
3. Add the exact production /auth/callback URL above to Authentication > URL
   Configuration > Redirect URLs. Preserve the existing /auth/sign-in entry and
   production Site URL. Default confirmation and password recovery email templates
   using ConfirmationURL support this flow; PKCE recovery needs its code redirect.
4. On a consenting test account, verify signup email delivery and confirmation.
   Then choose Forgot password, request a reset email and open it in the same
   browser within 15 minutes. Set the password yourself; never share it with support.
5. Confirm the updated password signs in, and old/expired reset links fail.

The code now maps provider error codes to safe explanations. AUTH_EMAIL_SETUP
indicates default SMTP recipient restrictions; AUTH_EMAIL_LIMIT indicates sending
limits; AUTH_SIGNUP_DISABLED identifies disabled signup. Unknown provider details
and passwords are not reflected. Cloudflare logs record only action, status and
allowlisted error code, with no email, password or token.

Reset uses a random S256 PKCE verifier in a short-lived Secure HttpOnly cookie.
The callback exchanges the one-time code, verifies the user and stores a separate
recovery-only token. It never grants portfolio access. Updating the password
requires origin/CSRF checks, matching passwords and a provider-verified recovery
session, then clears the local session and returns to sign in. The callback strips
the code from the URL with a no-referrer redirect. No D1 or new secret is needed.

Without access to the private Supabase dashboard or an actual failing response,
SMTP is a likely cause rather than a confirmed diagnosis. Automated auth checks
simulate provider responses; real mail delivery remains an owner-run check.

Reference: https://supabase.com/docs/guides/auth/auth-smtp
