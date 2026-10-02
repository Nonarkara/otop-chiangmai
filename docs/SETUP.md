# Setup guide

## Seed demo

Node 24 is recommended; `.nvmrc` records it. The locked MapLibre dependency tree has a Node 22 floor. The web and bot have independent `package.json` and lockfiles; there is no root workspace installation.

```bash
cd web
npm ci --ignore-scripts
npm run dev -- --hostname 127.0.0.1
```

Leave `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` unset. Copying `.env.example` is optional; its safe empty values leave live data disabled. A fake but nonempty Supabase URL/key can enable unwanted requests.

The app's data is local seed data, but maps fetch a CARTO style/tiles and text styling loads Google Fonts. Internet access is needed for those assets. There is no map access token. Preserve map attribution.

### Production export, local preview

```bash
npm run typecheck
npm test
npm run build
npm start
```

`next.config.ts` sets `output: 'export'`, so the output is `web/out/`. `next start` is not the right runtime. The checked-in `scripts/serve-export.mjs` resolves `/products` to `products.html`, serves nested generated product pages, and binds only to `127.0.0.1`. `PORT=3010 npm start` changes its port on a POSIX shell.

The preview is intentionally small: no TLS, authentication, compression, SPA fallback, production caching, or public-service guarantees. Deploy the static output to a suitable host only after reviewing the application's readiness and the target account.

## Optional local listings

This path is for a dedicated development database. No hosted Supabase account is needed if you already run the Supabase local stack. Installing/starting that stack requires its own CLI and container runtime; those are not vendored here, and this guide does not automatically provision services.

1. Start your dedicated local Supabase project using its normal workflow and note its local API URL, database connection string, anonymous key, and service-role key
2. Review `supabase/schema.sql`, then apply it **once to a fresh database's `public` schema**. It creates tables, policies, triggers, and sample category/district records. Both application clients use `public` by default

   ```bash
   # From this repository root, DATABASE_URL must target your local dev database.
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/schema.sql
   ```

   This is a bootstrap script, not a migration runner. Despite `if not exists` on tables, policy/trigger creation is not repeatable. Do not run it on an unrelated or production database
3. Copy `web/.env.example` to `web/.env.local` and set only:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your local anonymous key>
   ```

   These values enter the browser bundle. They are not a place for a privileged key. Restart dev or rebuild the export after changing them
4. Copy `bot/.env.example` to `bot/.env`, set your local `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, and leave LINE/Telegram/Gemini fields empty. Keep `HOST=127.0.0.1` and `PORT=3001`
5. From a second terminal:

   ```bash
   cd bot
   npm ci --ignore-scripts
   npm start
   ```

6. Open the web app at `http://127.0.0.1:3000/submit`. Submit **synthetic test data only** while validating. The form posts to the hard-coded local address `http://127.0.0.1:3001/listings`

A successful manual submission returns `201` and a slug. The UI links to `/listing?slug=...`, which fetches a published product at runtime. The product's contact field is public catalogue data: use a test contact, and do not enter another person's contact without permission.

A no-credential bot process can still answer `GET /health`; `POST /listings` returns `503 database not configured`. Health only indicates that Express is running, not that the database or bot integrations work.

The API's loopback bind and localhost CORS are development defaults, not authentication. Do not expose it using a tunnel, public bind, or reverse proxy without a security design.

## Configuration reference

| Variable | Where | Required for | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `web/.env.local` | Live catalogue read | Empty for demo; local DB blocked from non-loopback web hosts |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `web/.env.local` | Live catalogue read | Public browser key; RLS must protect data |
| `SUPABASE_URL` | `bot/.env` | Manual insert and job queue | Use your local database in development |
| `SUPABASE_SERVICE_ROLE_KEY` | `bot/.env` | Privileged bot writes | Server-only secret; never commit or expose in web |
| `HOST`, `PORT` | `bot/.env` | Express bind | Defaults `127.0.0.1`, `3001`; form assumes 3001 |
| `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN` | `bot/.env` | LINE adapter | Empty disables configured integration |
| `TELEGRAM_BOT_TOKEN` | `bot/.env` | Telegram adapter | Empty disables bot; a real token can start polling in development |
| `TELEGRAM_WEBHOOK_URL` | `bot/.env` | Suppress dev polling | Code checks presence; it does **not** register a remote webhook for you |
| `TELEGRAM_WEBHOOK_SECRET` | `bot/.env` | Optional route suffix | Used in webhook path, not a full production security policy |
| `GEMINI_API_KEY` | `bot/.env` | AI extraction | External model calls may incur cost and transmit seller content |
| `MESSAGE_WORKER_POLL_MS` | `bot/.env` | Queue interval | Default 2000 ms |
| `NODE_ENV` | bot environment | Polling behavior | Non-production plus no webhook URL enables configured Telegram polling |

Start the bot from `bot/` so `dotenv/config` reads the correct `.env`. Real values remain gitignored. The previous `BOT_QUEUE_MODE` example was removed: no code reads it, and there is no functioning in-memory queue processor.

## Optional chat ingestion

Chat integrations are implemented as source but are **not verified end to end**. They are not needed for the demo or local manual listings. Creating bots, assigning webhooks, enabling credentials, and sending seller content to providers are separate operational/privacy decisions.

Before any public trial:

- Verify LINE signature middleware and the SDK's image-content download API against the installed version
- Verify Telegram polling/webhook behavior, including authentication and duplicate handler registration
- Check the hard-coded Gemini model IDs (`gemini-2.0-flash`, fallback `gemini-1.5-flash-latest`) against models available to your account before making paid calls
- Add a review/confirmation workflow: the current worker attempts to publish extracted products directly
- Distinguish machine-generated stars/scores from official OTOP certification
- Fix live chat-product navigation: the static export prebuilds seed slugs, while `ProductCard` routes non-manual products to `/products/<slug>`; newly ingested chat slugs are not prebuilt
- Add image persistence and a usable contact flow; the ingestion path does not make those complete automatically
- Review job failure propagation, retries, moderation, and output safety before claiming successful publication
- Review seller-controlled HTML in map popups, API authentication/rate limits, and exposed data before any public input

Do not interpret a green build, HTTP health response, or configured environment as proof that these integrations are ready.

## Troubleshooting

| Symptom | Likely cause / next check |
| --- | --- |
| `next lint` fails | Next 16 removed that command; this repo now exposes `typecheck`, not a lint substitute |
| `npm start` says `web/out` is missing | Run `npm run build` first, in `web/` |
| Port 3000 already in use | Stop the dev server before static preview, or set `PORT` |
| Demo tries to reach Supabase | Remove placeholder public variables and restart/rebuild |
| Local form returns 503 | Bot database credentials are absent |
| Local form cannot connect | Bot isn't running at `127.0.0.1:3001`, or browser is on a different machine |
| API is healthy but insert fails | Schema, `public` search path, grants/RLS, service key, and server log |
| Live listing doesn't appear in static `/products/<slug>` | Use manual listing route `/listing?slug=...`; chat routing needs work |
| Map is blank | WebGL, browser console, and network reachability; static build isn't a map-rendering test |

Historical `context.md` references to a shared `_infra/localbase` project and old deployment/DNS commands are not included infrastructure and should not be copied into a new machine's setup.
