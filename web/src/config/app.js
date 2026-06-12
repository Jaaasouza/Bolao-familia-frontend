// App branding — overridable per deploy via Vite env vars, so a duplicated pool
// can set its own name without touching code. Defaults keep the original USAM
// branding. Set these in Vercel (Project ▸ Settings ▸ Environment Variables):
//   VITE_APP_NAME    full display name  (gate title, document title, install copy)
//   VITE_BRAND       header big line    (e.g. "Bolão da Família")
//   VITE_BRAND_LINE2 header second line (e.g. "World Cup 2026")
const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};

export const APP_NAME = env.VITE_APP_NAME || 'USAM World Cup 2026';
export const BRAND = env.VITE_BRAND || 'USAM';
export const BRAND_LINE2 = env.VITE_BRAND_LINE2 || 'World Cup 2026';
