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

## Authentication still pending

The original preview uses the Sites authentication gateway. Direct Cloudflare
hosting does not provide that gateway. The standalone production Worker strips
incoming `oai-authenticated-*` headers, so visitors cannot forge the original
gateway identity. Authenticated editing, uploads and publishing remain unavailable
until standalone authentication is implemented. Public browsing requires the
database tables to exist. Do not enable mock authentication in production.

The original Sites-hosted source and audience are unchanged by this GitHub update.
