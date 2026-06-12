# 🍝 Duplicate this pool (another World Cup 2026 bolão)

This guide spins up a **second, independent pool** of the *same* World Cup 2026
— a separate group of friends, with its own players, picks, leaderboard and
notifications. **No code changes are needed**: it's a fresh deploy of these two
repos with its own database and its own secrets.

> Architecture recap: **frontend** (this repo → Vercel) + **backend**
> (`usam-fifa-world-cup-backend` → Railway + Postgres). The frontend reads the
> backend URL from `VITE_API_BASE`; the backend pulls live scores from
> football-data.org and stores everything in Postgres.

---

## Step 1 — Copy both repos (2 min)

For **each** repo (`usam-fifa-world-cup` and `usam-fifa-world-cup-backend`):

- On GitHub, open the repo → **Use this template ▸ Create a new repository**
  (or **Fork**). Name them e.g. `copa-pool-2-frontend` / `copa-pool-2-backend`.

You now have two brand-new repos that are exact copies. Everything below is
**configuration only**.

---

## Step 2 — Backend on Railway (own database)

1. **Railway → New Project → Deploy from GitHub repo** → pick your new backend repo.
2. **Add a Postgres** to the project (Railway: *New ▸ Database ▸ Postgres*).
   Railway injects `DATABASE_URL` automatically — leave it.
3. Under the backend service **Variables**, set:

   | Variable | Value |
   |---|---|
   | `JWT_SECRET` | a fresh 64-char random hex (NEW per pool) |
   | `ADMIN_PASSWORD` | the admin PIN your friends' admin will type |
   | `VAPID_PUBLIC_KEY` | a fresh VAPID public key (NEW per pool) |
   | `VAPID_PRIVATE_KEY` | the matching VAPID private key |
   | `VAPID_SUBJECT` | `mailto:youremail@example.com` |
   | `MIRROR_SOURCE_URL` | **(recommended)** the USAM backend URL — mirror its matches, no API token needed (see Step 5) |
   | `FOOTBALL_DATA_API_KEY` | only if NOT mirroring — a football-data.org token |
   | `ALLOWED_ORIGINS` | your new frontend URL, e.g. `https://copa-pool-2.vercel.app` |
   | `FOOTBALL_DATA_COMPETITION` | leave unset (defaults to `WC`) |

   > Set **either** `MIRROR_SOURCE_URL` **or** `FOOTBALL_DATA_API_KEY`. With
   > `MIRROR_SOURCE_URL` the scheduler copies matches+standings from the source
   > pool and uses **no** football-data quota — ideal for a second pool.

   > Generate fresh VAPID keys with:
   > `npx web-push generate-vapid-keys`
   > and a JWT secret with:
   > `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

4. Deploy. Migrations run on boot (fresh, empty tables). Confirm health:
   open `https://<your-backend>.up.railway.app/health` → should be OK.

---

## Step 3 — Frontend on Vercel

1. **Vercel → New Project** → import your new frontend repo.
2. Build settings (this repo): root `web/`, framework **Vite**,
   build `npm run build`, output `dist` (Vercel detects this).
3. Add env var **`VITE_API_BASE`** = your Railway backend URL
   (the full `https://…up.railway.app`, no trailing slash).
4. Deploy. Then copy the Vercel URL back into the backend's `ALLOWED_ORIGINS`
   (Step 2) and redeploy the backend so CORS allows the new site.

Push notifications need **no Vercel config** — the app fetches the VAPID public
key from `/api/push/key` on the backend.

---

## Step 4 — First run

1. Open the site → pick a language → register yourself (name + US phone).
2. Sign in as **admin** (footer ▸ Admin) using the `ADMIN_PASSWORD` PIN to
   manage players.
3. Make a test pick, toggle 🔔 notifications, and you're live.

---

## Step 5 — ✅ Mirror mode (no second API token)

Match data is identical across pools (same Cup), so the new pool doesn't need
its own football-data token. Set **`MIRROR_SOURCE_URL`** to the USAM backend
(e.g. `https://usam-fifa-world-cup-backend-production.up.railway.app`) and leave
`FOOTBALL_DATA_API_KEY` **unset**.

In mirror mode the scheduler copies the source pool's public `/api/matches` and
`/api/standings` into this pool's own database on the same adaptive cadence
(~7s when a match is live). It uses **zero** football-data quota — only the USAM
backend talks to the external API. Players, picks, leaderboard, the group bonus
and notifications all stay independent per pool.

> Only consider a second football-data token if you want the new pool fully
> standalone (not dependent on the USAM backend being up). To do that, set
> `FOOTBALL_DATA_API_KEY` instead and leave `MIRROR_SOURCE_URL` unset. The free
> tier is 10 req/min **per token**, so two pools must not share one token.

---

## Env var reference

**Backend (Railway):** `DATABASE_URL` (auto), `JWT_SECRET`*, `ADMIN_PASSWORD`*,
`VAPID_PUBLIC_KEY`*, `VAPID_PRIVATE_KEY`*, `VAPID_SUBJECT`, `ALLOWED_ORIGINS`,
**one of** `MIRROR_SOURCE_URL` (recommended) **or** `FOOTBALL_DATA_API_KEY`,
optional: `FOOTBALL_DATA_COMPETITION` (default `WC`), `JWT_TTL`, `PORT`,
`PG_POOL_MAX`, `SYNC_LIVE_MS` / `SYNC_SOON_MS` / `SYNC_GAMEDAY_MS` /
`SYNC_IDLE_MS` / `SYNC_SECONDARY_MS`.

**Frontend (Vercel):** `VITE_API_BASE`.

\* **Always generate NEW per pool** — never reuse another pool's secrets.
