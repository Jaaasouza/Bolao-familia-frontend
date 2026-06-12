// App branding — overridable per deploy via Vite env vars, so a duplicated pool
// can set its own name without touching code. Defaults are the família pool
// branding. Set these in Vercel (Project ▸ Settings ▸ Environment Variables):
//   VITE_APP_NAME    full display name  (gate title, document title, install copy)
//   VITE_BRAND       header big line    (e.g. "Bolão da Família")
//   VITE_BRAND_LINE2 header second line (e.g. "Copa 2026")
const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};

export const APP_NAME = env.VITE_APP_NAME || 'Família Bolão Copa 2026';
export const BRAND = env.VITE_BRAND || 'Bolão da Família';
export const BRAND_LINE2 = env.VITE_BRAND_LINE2 || 'Copa 2026';
