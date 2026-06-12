# USAM World Cup 2026 — Web (Vite + React)

React rewrite of the pool frontend, talking to the Railway backend
(`usam-fifa-world-cup-backend`) via the centralized `api()` wrapper.

> **Not yet the production frontend.** The live site still serves the legacy
> `../usam-world-cup-2026.html` from Vercel. This app lives in `web/` so it can
> reach parity without breaking production. The cutover (pointing Vercel's build
> at `web/`) is a deliberate, separate step — see "Cutover" below.

## Develop

```bash
cd web
npm install
cp .env.example .env     # set VITE_API_BASE to the Railway backend URL
npm run dev              # http://localhost:5173
npm test                 # vitest (scoring domain logic)
npm run build            # production bundle -> dist/
```

`VITE_API_BASE` must be an **absolute** URL (never a relative `/api` path — the
Vercel SPA fallback would serve `index.html` for unknown paths).

## Structure

- `src/theme/palette.js` — color palette **C** (single source of truth; no hex elsewhere)
- `src/lib/api.js` — `api()` wrapper: base URL + JWT bearer + timeout, plus `API.*` helpers
- `src/lib/scoring.js` — scoring domain logic (phase bonuses, leaderboard, tiebreakers) + tests
- `src/auth/AuthContext.jsx` — admin login (PIN → JWT), `useAuth()` role helper
- `src/data/useAppData.js` — loads `/api/state` + `/api/players`, polls every 30s
- `src/views/*` — Leaderboard, Matches, Standings, Bracket, Players

## Status / follow-ups

- ✅ Read views, leaderboard, admin login, polling
- ✅ Scoring per SCORING.md (match points, cumulative phase bonuses, group
  bonuses, champion pick) + tiebreakers, with tests
- ✅ Admin editors: phases, standings, players & picks, sync-now
- ⬜ Public self-registration (backend currently gates player writes behind admin)
- ⬜ Upset bonus (needs an `upset` flag on matches in the backend + editor)
- ⬜ Team-name normalization between football-data names and our canonical names
  (best done in the backend sync) — affects match-by-match scoring
- ⬜ Pixel parity pass with the legacy HTML (squads, i18n, live goal FX)

## Cutover (when at parity)

1. Set `VITE_API_BASE` in Vercel to the Railway URL.
2. Point the Vercel project's Root Directory at `web/` (build `npm run build`,
   output `dist/`), or move this app to the repo root.
3. Remove the legacy `usam-world-cup-2026.html` and the loose Vercel serverless
   functions (`state.js`, `players.js`, …) once the Railway backend is live.
