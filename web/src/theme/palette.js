// Color palette "C" — the single source of truth for theming. Never hardcode
// hex values elsewhere in the app (see CLAUDE.md). Ported from the legacy
// :root CSS custom properties in usam-world-cup-2026.html.
export const C = {
  bg: '#070b16',
  ink: '#e9eef7',
  inkDim: '#a9b6d3',
  muted: '#7e8cab',
  line: '#1d2740',
  card: '#0e1424',
  card2: '#121a2e',
  chip: '#0c1322',
  pix: '#0b1020',

  gold: '#d4af37',
  goldSoft: '#e7c860',
  gold2: '#f3d670',
  green: '#1f9d63',
  red: '#d64550',
  accent: '#3aa0ff',
  accent2: '#7c5cff',
  good: '#2ecc71',
  warn: '#f1c40f',
  bad: '#e74c3c',
  blue: '#2b6cff',

  radius: '14px',
  shadow: '0 10px 30px rgba(0,0,0,.35)',
  grad: 'linear-gradient(135deg,#d4af37,#e7c860)',
  grad2: 'linear-gradient(135deg,#3aa0ff,#7c5cff)',

  // ── USAM World Cup 2026 palette — exact hex from the :root custom
  // properties in usam-world-cup-2026.html. Use these (or the matching
  // CSS vars in theme/global.css) for the festive WC look. Keys mirror the
  // CSS variable names (camelCased) for inline-style parity.
  mexicoRed: '#e63946',     // --mexico-red
  mexicoGreen: '#06a77d',   // --mexico-green
  usaBlue: '#1d3557',       // --usa-blue
  usaBright: '#3a86ff',     // --usa-bright
  canadaRed: '#d62828',     // --canada-red
  goldWc: '#ffd60a',        // --gold (trophy gold)
  hotPink: '#ff006e',       // --hot-pink
  orange: '#fb5607',        // --orange
  lime: '#8ac926',          // --lime
  cream: '#fff8e7',         // --cream
  inkWc: '#0a1733',         // --ink / --dark (deep navy background)
  dark: '#0a1733',          // --dark
  white: '#ffffff',         // --white
};

export default C;
