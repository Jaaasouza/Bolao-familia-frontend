# Bolão Família — World Cup 2026 (Frontend)

A React + Vite single-page app for the Bolão Família pool. Players predict the
exact scoreline of every World Cup match; the leaderboard is computed by the
backend so everyone agrees on the numbers.

The companion backend (Node + Express + Postgres on Railway) lives at
[`Jaaasouza/-Bolao-familia-backend`](https://github.com/Jaaasouza/-Bolao-familia-backend).
This repo only contains the web client; it talks to the backend via
`VITE_API_BASE`.

## Stack

- **Vite 5** + **React 18** + **vitest**
- **Auth**: bearer-token JWT — admin PIN (`/api/auth/login`) and player phone
  (`/api/auth/phone`)
- **i18n**: PT-BR (default) + EN, via `LanguageContext`
- **Web Push**: service worker (`public/sw.js`) + VAPID
- **Deploy**: Vercel (auto on push to `main`)

## Local development

```bash
cd web
npm install
cp .env.example .env.local        # set VITE_API_BASE=https://<your-backend>.up.railway.app
npm run dev                       # http://localhost:5173
npm test                          # vitest
npm run build                     # → dist/
```

You need the backend running and reachable at `VITE_API_BASE` (no trailing
slash). The dev server doesn't proxy `/api/*` — it calls the absolute backend
URL directly.

## Project layout

```
web/
├── public/
│   └── sw.js                 # service worker (web-push)
├── src/
│   ├── main.jsx              # entry
│   ├── App.jsx               # tabs + routing
│   ├── auth/                 # AuthContext, PlayerAuthContext, AuthGate
│   ├── views/                # JoinView, RankView, PredictView, ChatView, AdminPanel, ...
│   ├── components/           # reusable UI bits
│   ├── lib/                  # api(), push.js, helpers
│   ├── i18n/                 # strings.js + LanguageContext
│   └── theme/                # palette (`C` object) + global.css
├── vercel.json               # SPA rewrite
└── package.json
```

## Screens

- **Join** — phone signup (locks once submitted)
- **Predict** — pick scorelines per phase; each pick is final once a match
  kicks off
- **Scoreboard** — leaderboard with exact-vs-result breakdown
- **Teams / Matches / Live** — group standings, fixture list, live overlay
- **Rules** — the scoring system
- **Admin** (PIN-gated) — players CRUD, deadline, standings, phases, force sync,
  manual score override

## Scoring (mirror of the backend)

Per match:
- **+3** exact scoreline
- **+1** correct result (winner, or draw when both predicted and actual are draws)
- **0** otherwise

Plus a per-group bonus, only once all matches in the group finish:
- **+2** 1st AND 2nd correct, right order
- **+1** 1st AND 2nd correct, wrong order

Submitted picks can never be edited — the backend stores them insert-only.

## Deploy

Vercel auto-deploys on merge to `main`. In the Vercel project settings, set:

- `VITE_API_BASE=https://<backend>.up.railway.app` (no trailing slash) — for
  every environment (Production, Preview, Development).

`vercel.json` rewrites every path to `/index.html` so React Router (the
in-component view state) handles deep links and `/tv` mode.

## Archive

`archive/usam-world-cup-2026.html` is a standalone vanilla-JS prototype kept
for reference only. It does NOT talk to this backend and is no longer part of
the product. Don't edit it.
