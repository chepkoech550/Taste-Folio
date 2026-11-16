# Changelog

## Unreleased\n\n### QR business cards and simple tipping\n\n- Generate a production portfolio QR code and download it as SVG.\n- Print ten 85 x 55 mm business cards on A4 from the published snapshot.\n- Add one optional Accept tips toggle; Leave a tip expands existing receiving details.\n- Use Book me for tipping profiles and keep share actions under one menu.\n- Keep video evidence in existing project links; omit extra designers and customisation forms.\n- Validate tipping requirements, unpublished card access and published snapshot separation.\n- Decode generated QR codes at small and print resolutions; verify download and tip actions in preview.\n\n### Mentor handover, 16 November 2026\n\n- Add MENTOR.md and make the README an index of current status and review needs.\n- Update architecture, testing, roadmap, setup and demo docs for Cloudflare and Supabase.\n- Distinguish user-reported progress, local tests, public Flash failures and the untested authenticated invoice path.\n- Document proposed Flash runtime names without claiming the code reads them yet.

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
