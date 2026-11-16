# Local setup

## Requirements

- Node.js 22.13 or later; CI uses Node.js 22.
- npm, with the committed `package-lock.json`.
- Git.

The app runs with the Vinext starter on Cloudflare Workers. D1 stores portfolio records and R2 stores uploaded images. The starter simulates these bindings locally.

## Install and build

```sh
npm ci
npm run build
```

## Create the local database

Apply this migration once to a fresh local database:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_fat_daredevil.sql
```

Do not repeatedly apply an already applied SQL file. Local and hosted databases are separate. For later schema changes, generate a new migration with `npm run db:generate`, inspect it, and apply the new file in order.

## Run

```sh
npm run dev
```

Open the URL printed by the development server. On a portable local setup, visit `/signin-with-chatgpt?return_to=/edit` to use the starter's loopback-only development identity. Managed Sites previews do not enable mock sign in.

The standalone production Worker verifies Supabase sessions before setting trusted identity headers. The app authorizes writes against that verified identity. Follow [Cloudflare setup](CLOUDFLARE.md) for runtime settings. The original Sites preview has its own gateway.

## Check

```sh
npm run check
```

This typechecks, builds, then runs an isolated integration suite. The tests create in-memory data, not real portfolios or payments.

## Deploy

For the standalone GitHub deployment use [Cloudflare setup](CLOUDFLARE.md).

The original Sites project is identified by `.openai/hosting.json`. Preserve that identity and its `DB`/`BUCKET` bindings when updating the live app. Publishing uses the authenticated Sites workflow to build, synchronise source, save a version and deploy it. GitHub pushes do not currently deploy the Site automatically.

Website access remains private until the owner explicitly changes the audience. Repository visibility does not control website access.

## Credentials

No third-party payment credentials are needed for the currently implemented feature set. When Flash is integrated, configure credentials as server-side runtime secrets. Document only their names in an example file after the actual integration defines them. Never place credentials in the repository, portfolio fields, client bundle or issue comments.
