# CLAUDE.md — Standing Operating Directives

Authoritative working agreement between Joaosouza (product owner) and Claude
(head of development) for this repository. Read before touching anything.

## Autonomy mode

Claude operates as head of development. Joaosouza describes what he wants; Claude
executes end-to-end without asking for per-step approval:

- Open PRs without asking.
- Merge PRs without asking, once CI is green and the change matches the request.
- Only report back when work is done ("pronto") or when genuinely blocked.

This autonomy applies to the normal development loop. The guardrails still hold:

- Never force-push to main.
- Never skip pre-commit hooks (`--no-verify`) or signing.
- Never merge a PR with red CI — fix the failure first.
- Never make destructive changes without investigating root cause.
- Confirm before changes that affect shared infrastructure beyond this repo
  (DNS, secrets, environment variables, third-party integrations, breaking
  schema changes).
- When in doubt, prefer creating a new commit over rewriting history.

## Source of truth

- Roadmap and product principles: `MASTER_PLAN.md` (if it exists) at repo root.
  Read it for sprint order, North-Star principles, and architectural rules.
- This file: operating mode + repo-specific notes.

## Tech stack

- **Frontend:** Vite + React (single-page `App.jsx` or `app/` folder). Tests via
  `npm test` (vitest). `npm run build` must succeed before merging.
- **Backend:** Node.js + Express + Postgres. Tests via `npm test` (jest). Keep
  green before merging.
- **Hosting:** GitHub (source) → Vercel (frontend) + Railway (backend + Postgres).
- **CI:** GitHub Actions runs `npm test` + `npm run build` on Node 18 + 20 per PR.
- **Deploy:** auto on merge to main (Vercel + Railway pull from GitHub webhook).

## Repo-specific notes

### Frontend (`*-frontend`)

- Single `App.jsx` (or feature folders). When adding a section, find the closest
  existing pattern first.
- Color palette lives in the `C` object (near the top). Never hardcode hex
  outside it.
- `getAuthRole()` is the helper for role-gating UI inside components that can't
  thread `authSession` as a prop.
- API calls use a centralized `api()` wrapper that adds JWT bearer + timeout.
- Use `import.meta.env.VITE_API_BASE` for backend URL (never relative `/api/...`
  paths — Vercel SPA fallback will eat them).

### Backend (`*-backend`)

- All migrations are append-only — never modify a merged migration.
- All workflow state changes go through a central event bus
  (`services/eventBus.js`). Don't bypass.
- New routes mount in `src/index.js`. Use `requireRole(...)` on every mutating
  endpoint.
- Wipe-immune tables (audit, cost log, AI cache) are NOT in the
  `services/wipeReleases.js` `WIPE_PLAN`.
- `/health` endpoint required for Railway liveness probe.

## Branch convention

- Feature work: `claude/<sprint-or-feature>-<short-slug>`.
- Commit prefix: lowercase scope, e.g. `feat(notifications):`, `fix(wipe):`,
  `ui(reports):`.
- PR title mirrors the lead commit subject; body summarizes "what + why" in 2-3
  bullets plus a Test plan checklist.
- Squash-merge; no merge commits in main.

## Reporting

End-of-task summary to Joaosouza: 1-3 sentences. What landed and what's next. If
nothing's next, just say "pronto".

## Setup expectations

When starting work on a new repo, in the FIRST session:

1. Read this file and confirm understanding.
2. Read the README + top-level config files (`package.json`, `railway.json`,
   `.github/workflows`).
3. Skim the existing source to learn the patterns (don't refactor unless asked).
4. If something is missing (e.g. no CI, no test script), flag it and propose
   adding it before any feature work.

Subsequent sessions: jump straight to the task — these standing directives
remain in force.

---

## Current state of this repo

This frontend matches the reference stack:

- **Vite + React 18** SPA under `web/`. Entry: `web/src/main.jsx` →
  `AuthProvider` → `PlayerAuthProvider` → `AuthGate` → `App.jsx`.
- **API wrapper** at `web/src/lib/api.js` — bearer-token JWT + 10s timeout +
  `import.meta.env.VITE_API_BASE`.
- **Two-tier auth**: admin PIN (`POST /api/auth/login`) and player phone
  (`POST /api/auth/phone`). Tokens stored as `usam2026:token` and
  `usam2026:ptoken` in localStorage.
- **i18n**: PT-BR (default) + EN, via `web/src/i18n/strings.js` +
  `LanguageContext`. `usam_lang` in localStorage.
- **Push notifications**: service worker at `web/public/sw.js`. Subscribe flow
  in `web/src/lib/push.js`: GET VAPID key → subscribe → POST `/api/push/subscribe`.
- **CI**: GitHub Actions runs `vitest` + `vite build` on Node 18 + 20 per PR.
- **Deploy**: Vercel auto-deploys on merge to main (`vercel.json` rewrites
  everything to `/index.html` for SPA routing).

The companion backend lives at `Jaaasouza/-Bolao-familia-backend` (Node +
Express + Postgres, deployed on Railway). The frontend talks to it via
`VITE_API_BASE` set in the Vercel project's env vars.

## Archive

The root contains `archive/usam-world-cup-2026.html` — a deprecated standalone
prototype (vanilla JS, localStorage, direct football-data.org calls). Kept for
reference only. **Don't touch it for product work.** All current code lives in
`web/`.
