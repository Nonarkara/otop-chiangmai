# OTOP เชียงใหม่ — context

Thai-language OTOP (One Tambon One Product) marketplace for Chiang Mai province.
Storefront + a LINE/Telegram bot that uses Gemini Vision to turn a seller's photo
into a listing.

**Tier: T0 Demo** (§16.2). Runs entirely on seed data. Do not describe it to anyone
as a live marketplace until the bot and Supabase are real.

---

## Live

| | |
|---|---|
| Deployed URL | https://otop.pages.dev |
| Intended URL | https://otop.nonarkara.org — **attached but not resolving**, see Blocker |
| Platform | Cloudflare Pages, direct upload (no git integration) |
| Pages project | `otop`, production branch `main` |
| Cloudflare account | `74ad6bf8dfaaccf82de6f0847f7d2d54` |
| nonarkara.org zone | `8809ee95…` (full id via `GET /zones?name=nonarkara.org`) |

### Build & deploy

```bash
npm run build --prefix web          # → web/out/  (static export)
npx wrangler pages deploy web/out --project-name otop --branch main
```

No environment variables are required to build. The map needs no access token.

---

## Blocker — DNS record not created

`otop.nonarkara.org` is attached to the Pages project (`status: pending`,
validation method `http`) but has **no CNAME**, so it does not resolve.

Wrangler's OAuth grant has `zone (read)` and `pages (write)` but **not** DNS write —
`POST /zones/{zone}/dns_records` returns `10000 Authentication error`, and even
reading DNS records is denied. Cloudflare did not auto-create the record.

There is no API path to mint an API token without already having one, so this is the
one unavoidable manual step. With a token carrying **Zone:DNS:Edit** on nonarkara.org
exported as `CLOUDFLARE_API_TOKEN`, this finishes it:

```bash
curl -sS -X POST "https://api.cloudflare.com/client/v4/zones/$(curl -sS "https://api.cloudflare.com/client/v4/zones?name=nonarkara.org" -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | python3 -c 'import sys,json;print(json.load(sys.stdin)["result"][0]["id"])')/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" \
  --data '{"type":"CNAME","name":"otop","content":"otop.pages.dev","proxied":true,"ttl":1}'
```

---

## Stack

- **web/** — Next.js 16 (App Router), React 19, TypeScript, Tailwind 4. `output: 'export'`.
  Every page is a client component; the only server component is
  `products/[slug]/page.tsx`, which exists solely to run `generateStaticParams`.
- **Map** — MapLibre GL 5 + CARTO positron basemap. **No access token.** Matches the
  estate standard (conflict-tracker, geopolitics, HCMC, chonburi, UNL).
  `minZoom: 9`, `renderWorldCopies: false` (§11.9). CARTO/OSM attribution is a
  licensing requirement — do not remove it.
- **bot/** — Express + @line/bot-sdk + telegraf + Gemini. **Written, never deployed.**
- **supabase/schema.sql** — **written, never applied.** No OTOP Supabase project exists
  (the org holds only Thailand Geopolitical Watch, Ops Monitoring, AirDnD).

## Data — all of it is fake

`web/src/lib/seed-data.ts` is the only data source. View counts, review counts, star
ratings and the whole `/analytics` page are invented. Three honesty guards exist because
of that; **do not remove them while the data is still seed**:

1. `components/DemoStrip.tsx` — rendered in `layout.tsx`, on every page.
2. The OG description in `layout.tsx` — it must not claim real buyers or real reviews.
   It used to say `รีวิวจากผู้ซื้อจริง`. That was false.
3. `/submit` — both bot channels read as not-yet-open. The handles it used to
   advertise (`@otop-chiangmai`, `t.me/otop_chiangmai_bot`) **do not exist**; a real
   seller following those steps hit a dead end.

## Next session

1. Create the DNS record (above) — one command, then the intended URL is live.
2. Register the real LINE + Telegram bots, get a Gemini key, host `bot/` somewhere
   persistent. `/submit` becomes truthful the moment that is real.
3. Create the OTOP Supabase project, apply `supabase/schema.sql`, switch the frontend
   off seed data. Then the DemoStrip comes down and the tier moves to T1.

## Gotchas

- **Do not try to verify the map in an automated browser.** `requestAnimationFrame` is
  suspended there, so MapLibre never renders, requests zero tiles, and never fires
  `load` — with no error. Dr Non's live `asia.nonarkara.org` shows the identical
  signature in the same context. Vault:
  `Scars/Debug-Logs/2026-09-09-webgl-maps-cannot-be-verified-in-automated-browsers-raf-is-suspended.md`
- Browser-tool console output can be stale across navigations. Re-read after a fresh
  navigation before believing it.
- `globals.css` is already fully house-compliant (Josefin Sans + Source Sans 3, IBM Plex
  Sans Thai non-looped, one amber, zero radius, zero shadow, three sizes). Leave it alone.
