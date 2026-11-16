# Changelog

## Unreleased\n\n### Mentor handover, 16 November 2026\n\n- Add MENTOR.md and make the README an index of current status and review needs.\n- Update architecture, testing, roadmap, setup and demo docs for Cloudflare and Supabase.\n- Distinguish user-reported progress, local tests, public Flash failures and the untested authenticated invoice path.\n- Document proposed Flash runtime names without claiming the code reads them yet.

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
