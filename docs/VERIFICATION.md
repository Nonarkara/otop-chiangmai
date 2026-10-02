# Verification record

Checked on 2026-10-02 in a Linux x64 environment with Node 24.19.0 and npm 11.9.0, against source baseline `2592cc87d04300c1ee9a1ee7ef898a2104fceb92` plus the local documentation/readiness changes.

## Passed

| Command / check | Result |
| --- | --- |
| `npm ci --ignore-scripts --no-audit --no-fund --cache /tmp/public-readiness-undocumented-npm-cache` in `web/` and `bot/` | Both locked installs succeeded without lifecycle scripts |
| `npm run typecheck` in `web/` | TypeScript exited 0 |
| `npm test` in `web/` | 5/5 static-preview regression tests |
| `NEXT_TELEMETRY_DISABLED=1 npm run build` in `web/` | Next 16.2.6 build succeeded; 19 static pages generated |
| `PORT=13000 node scripts/serve-export.mjs` in `web/` | Actual build served home, products, nested sample product, analytics, submit, and query-based listing routes as HTTP 200; unknown route returned 404 |
| `HOST=127.0.0.1 PORT=13001 NODE_ENV=production node src/index.js` in `bot/`, with provider/DB credentials unset | Startup, `/health`, localhost CORS preflight, and the expected `503 database not configured` response passed |
| `node --check` for bot JavaScript and preview scripts | Syntax passed |
| `git diff --check` | No whitespace errors |

The preview-server tests cover clean/nested URLs, query strings, MIME type, HEAD, 404, malformed paths, method rejection, encoded path traversal, and symlinks outside the export root. They do not test application UI interactions.

Documentation SVGs were parsed, rendered with Sharp, and visually inspected. Markdown local targets were checked for existence. App styling and demo honesty labels were preserved.

## Failed attempts / resolved tooling issues

- Initial dependency installations could not use the environment's default npm cache. A writable temporary cache resolved the problem without changing locked dependency versions
- The old `next lint` and `next start` scripts were inconsistent with Next 16 and `output: 'export'`. `lint` was removed in favor of an explicitly named `typecheck`; `start` now uses a tested local static preview. No claim of configured lint coverage is made

## Not run

- Real Supabase setup, schema application, RLS/security acceptance, insert/read roundtrip, or synthetic UI form submission against a database
- LINE/Telegram account setup, webhook registration, polling with real credentials, image downloads, replies, or end-to-end ingestion
- Gemini requests, model availability, extraction quality, or paid API calls
- Browser interaction/accessibility testing or live WebGL/map rendering
- Full dependency vulnerability audit, production hardening, public availability check, DNS changes, or deployment

The seed export and no-key process startup are validated. The connected marketplace/chat paths remain development work, not a production-ready service.
