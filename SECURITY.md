# Security

Do not open public issues containing credentials, user portfolios, payment identifiers, recovery phrases, PINs or private customer data. Describe a suspected vulnerability privately to the repository owner first. GitHub private vulnerability reporting is not assumed enabled.

The app depends on the Sites authentication gateway for trusted identity headers. Do not expose API handlers behind a server that accepts those headers directly from arbitrary clients.

Keep runtime secrets outside Git. The current app has no Flash API credentials or live payment integration. Future checkout handlers must create and confirm invoices server-side and bind payments to the correct recipient and service.

The automated integration suite covers selected ownership and publication boundaries. It is not a security audit.
