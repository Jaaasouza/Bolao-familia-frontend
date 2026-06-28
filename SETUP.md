# Setup Guide — Bolão Família

End-to-end deployment of the pool (frontend + backend). Plan ~30 minutes if
this is your first time; ~5 minutes if you've already done it once.

> If you're just **duplicating** an existing pool, read `DUPLICATE.md` instead
> — it skips half the steps.

---

## What you'll need

- A computer with **Node.js 18+** ([download](https://nodejs.org))
- A **GitHub** account
- A **Vercel** account (for the frontend)
- A **Railway** account (for the backend + Postgres)
- (Optional) A **football-data.org** API key
  ([free signup](https://www.football-data.org/client/register)) — without it,
  the backend runs in ESPN-only mode (live scores, no official standings).

---

## Part 1 — Deploy the backend (Railway)

The backend repo is
[`Jaaasouza/-Bolao-familia-backend`](https://github.com/Jaaasouza/-Bolao-familia-backend).

### 1.1 — Create the project

1. Open [railway.app](https://railway.app) → **New Project** → **Deploy from
   GitHub repo** → pick the backend repo.
2. Add a **Postgres** plugin to the project (Railway → **+ New** → **Database** →
   **Add Postgres**).

Railway will start a first build; it'll fail because env vars aren't set yet.
That's expected.

### 1.2 — Set environment variables

On the backend service (NOT the Postgres one), open **Variables** and add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference syntax — Railway resolves it) |
| `JWT_SECRET` | a random 32+ char string (`openssl rand -hex 32`) |
| `ADMIN_PASSWORD` | the PIN/password for admin login |
| `ALLOWED_ORIGINS` | comma-separated frontend origins, e.g. `https://your-pool.vercel.app` |
| `FOOTBALL_DATA_API_KEY` | (optional) your football-data token |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | (optional) for web-push (`npx web-push generate-vapid-keys`) |
| `VAPID_CONTACT` | (optional) `mailto:you@example.com` — required by web-push spec |
| `NODE_ENV` | `production` |

### 1.3 — Redeploy

Trigger a new deploy. The start command runs migrations first
(`node src/db/migrate.js && node src/index.js`); if migrations fail the deploy
aborts and nothing crashes.

### 1.4 — Smoke-test the backend

```bash
curl https://<your-backend>.up.railway.app/health
# → "ok"
```

Note your backend URL — you'll paste it in step 2.2.

---

## Part 2 — Deploy the frontend (Vercel)

This repo (`Jaaasouza/Bolao-familia-frontend`).

### 2.1 — Import to Vercel

1. Open [vercel.com](https://vercel.com) → **Add New** → **Project** → import
   the frontend repo.
2. **Root Directory**: `web`
3. **Framework Preset**: Vite (auto-detected)
4. Build command: `npm run build` (default)
5. Output directory: `dist` (default)

Don't click Deploy yet — set env vars first.

### 2.2 — Set environment variables

On the Vercel project → **Settings** → **Environment Variables**:

| Variable | Value | Environments |
|---|---|---|
| `VITE_API_BASE` | `https://<your-backend>.up.railway.app` (no trailing slash) | Production, Preview, Development |

### 2.3 — Deploy

Click **Deploy**. After ~30s you'll have `https://<your-pool>.vercel.app`.

### 2.4 — Wire CORS

Back in Railway, update `ALLOWED_ORIGINS` to include your Vercel URL (and any
custom domain). Trigger a redeploy.

---

## Part 3 — Smoke-test end-to-end

1. Open your Vercel URL.
2. Sign up as a player (phone).
3. Go to **Predict** → submit a few picks.
4. Open **Admin** (PIN from `ADMIN_PASSWORD`) → confirm the player appears in
   the list.
5. Hit **Force sync** in the admin panel — matches should load from
   football-data within seconds.

If matches don't appear:

- Check Railway logs for `[scheduler] sync …` lines.
- Hit `https://<backend>/api/sync-status` — shows last sync result + error.
- If you see `RATE_LIMITED`, the free tier (10 req/min) tripped — wait 60s.

---

## Common gotchas

### "Failed to fetch" in the browser

- `VITE_API_BASE` is wrong, has a trailing slash, or points at the wrong URL.
- `ALLOWED_ORIGINS` on Railway doesn't include the Vercel origin.

### Admin login returns 401

- `ADMIN_PASSWORD` on Railway doesn't match what you're typing.
- `JWT_SECRET` was changed and old tokens are invalidated — log out + back in.

### Matches table is empty after deploy

- The football-data WC competition may not be live yet. Use the admin
  **Standings** + **Phases** editors to seed manually, or set placeholder
  scores via the per-match override (`POST /api/matches/:id/score`).

### Push notifications don't fire

- VAPID keys not set, OR
- `serviceWorker.ready` never resolves (HTTPS-only — won't work on `http://`).

---

## Updating the app

Push to `main` in either repo:

- **Backend**: Railway auto-deploys.
- **Frontend**: Vercel auto-deploys.

Migrations are append-only; new ones run on next backend boot.

## Updating environment variables

- **Railway**: change the variable, then redeploy the backend service.
- **Vercel**: change the variable, then redeploy the frontend (or push a new
  commit).

---

## Further reading

- `CLAUDE.md` — standing directives + repo conventions
- `DUPLICATE.md` — fast path for cloning the pool for another group of friends
- `API.md` — backend API reference
- `SCORING.md` — point system in detail
