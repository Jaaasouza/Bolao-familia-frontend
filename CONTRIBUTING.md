# Contributing

Small personal project, but improvements are welcome.

## Local dev

```bash
cd web
npm install
cp .env.example .env.local        # set VITE_API_BASE=https://<your-backend>.up.railway.app
npm run dev                       # http://localhost:5173
npm test                          # vitest
npm run build                     # → dist/ (must succeed before merging)
```

You need the companion backend reachable at `VITE_API_BASE`. If you're working
on UI only, point at the production backend (read-only browsing is harmless);
for anything that mutates, run a local backend (see the backend repo's README).

## Code style

- React function components + hooks (no classes).
- Color palette lives in `web/src/theme/palette.js` — `C` object. Don't
  hard-code hex outside it.
- API calls go through `web/src/lib/api.js` (`api(path, { method, body, auth })`
  — it adds the bearer token + timeout).
- Use `import.meta.env.VITE_API_BASE` for the backend URL — never relative
  `/api/...` paths (Vercel's SPA rewrite would eat them).
- Strings go through `LanguageContext` / `useLang()`. New copy lands in both
  `pt` and `en` blocks of `web/src/i18n/strings.js`.

## Tests

`vitest` runs against the React tree (`@testing-library/react`-style is OK but
not required). At minimum, every change should pass:

```bash
npm test
npm run build
```

CI runs both on Node 18 + 20 per PR. Don't merge with red CI.

## Branch / commit / PR conventions

- Branch: `claude/<short-slug>` for Claude work; `<user>/<slug>` for humans.
- Commit prefix: `feat(scope):` / `fix(scope):` / `ui(scope):` / `docs(scope):`.
- PR title mirrors the lead commit subject.
- PR body: 2-3 bullets ("what + why") + a brief test plan.
- Squash-merge (no merge commits in `main`).

## What NOT to touch without asking

- `archive/usam-world-cup-2026.html` — deprecated standalone prototype, kept
  for reference only.
- The companion backend's migrations (in the backend repo) — append-only by
  policy.

## Adding a language

1. Add a new block to `web/src/i18n/strings.js`:
   ```js
   export const I18N = {
     en: { ... },
     pt: { ... },
     es: { /* your translations */ },
   };
   ```
2. Add the language to the picker (look for `useLang` usages).
3. Push notifications: the backend stores `lang` per subscription so you'll
   want to add server-side templates for the new language too.

## Questions / bugs

Open an Issue on GitHub. For security issues, email the maintainer rather than
filing publicly.
