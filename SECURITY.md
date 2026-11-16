# Security

Do not open public issues containing credentials, user portfolios, payment identifiers, recovery phrases, PINs or private customer data. Describe a suspected vulnerability privately to the repository owner first. GitHub private vulnerability reporting is not assumed enabled.

The standalone Cloudflare Worker strips incoming identity headers and establishes identity only after verifying the session with Supabase. The existing portfolio APIs still enforce owner IDs. Authentication uses secure host-only cookies, same-origin checks and CSRF-protected account forms. Keep secrets out of Git and configure the runtime using docs/CLOUDFLARE.md. The original Sites preview retains its separate gateway. Do not enable local mock authentication in production.

Keep runtime secrets outside Git. The current app has no Flash API credentials or live payment integration. Future checkout handlers must create and confirm invoices server-side and bind payments to the correct recipient and service.

The automated integration suite covers selected ownership and publication boundaries. It is not a security audit.
