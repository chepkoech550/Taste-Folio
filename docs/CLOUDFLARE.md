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

## Connect authentication

The standalone Worker now supports Supabase email/password authentication. Its
account pages use the maroon and gold brand. Until configuration is present,
sign in displays a setup message and all account writes remain protected.

1. Create a Supabase project. Portfolio records and uploads stay in Cloudflare.
2. In Supabase Authentication URL Configuration, set Site URL to
   `https://taste-folio.violakorir24.workers.dev` and allow the redirect URL
   `https://taste-folio.violakorir24.workers.dev/auth/sign-in`.
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

Authentication tests use a simulated provider. Real signup, email delivery,
refresh and account isolation on the deployed site must still be tested after
configuration. Password recovery UI and CAPTCHA are not implemented. Before
broader launch, add those and review auth rate limits and SMTP capacity.

No extra D1 migration is required for authentication. Supabase supplies stable
user IDs for the existing owner_id columns. No portfolios existed on the new D1
before this integration, so there is no identity migration in this deployment.

The original Sites-hosted source and audience are unchanged by this GitHub update.
