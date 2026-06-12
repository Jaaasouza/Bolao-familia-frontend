// Phone-auth helpers for the scoreline-predictions flow.
// Pure utilities only — NO network code lives here (the coordinator wires the
// actual POST /api/auth/phone call through api.js). This module owns phone
// normalization plus token / player persistence in localStorage.

export const TOKEN_KEY = 'usam2026:ptoken';
export const PLAYER_KEY = 'usam2026:player';

// Countries we accept a phone from. `dial` is the calling code; `example` seeds
// the input placeholder. Brazil is first (the família default).
export const PHONE_COUNTRIES = [
  { code: 'BR', dial: '55', flag: '🇧🇷', label: 'Brasil', example: '(11) 91234-5678' },
  { code: 'US', dial: '1', flag: '🇺🇸', label: 'USA', example: '(415) 555-1234' },
];
export const DEFAULT_PHONE_COUNTRY = 'BR';

function prettyUs(d) {
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
function prettyBr(n) {
  const ddd = n.slice(0, 2);
  const rest = n.slice(2);
  return rest.length === 9
    ? `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
    : `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
}

// normalizePhone(input, country) -> { country, national, digits, dial, pretty } | null
//   US  → 10 national digits (a leading "1" country code is stripped). The
//         canonical `digits` we send to the backend stays 10 digits — a bare
//         10-digit string is unambiguously US here.
//   BR  → 10 (landline) or 11 (mobile) national digits. Canonical `digits` is the
//         calling code + national ("55" + national), so it never collides with a
//         US number and the backend can tell the two apart by the "55" prefix.
export function normalizePhone(input, country = DEFAULT_PHONE_COUNTRY) {
  if (input == null) return null;
  let d = String(input).replace(/\D+/g, '');

  if (country === 'US') {
    if (d.length === 11 && d[0] === '1') d = d.slice(1);
    if (d.length !== 10) return null;
    return { country: 'US', national: d, digits: d, dial: '1', pretty: prettyUs(d) };
  }

  // Brazil (default). Tolerate an included "55" country code.
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) d = d.slice(2);
  if (d.length !== 10 && d.length !== 11) return null;
  return { country: 'BR', national: d, digits: `55${d}`, dial: '55', pretty: prettyBr(d) };
}

// Back-compat US-only helper — { digits, pretty } | null. Kept for callers and
// tests that predate multi-country support.
export function normalizeUsPhone(input) {
  const n = normalizePhone(input, 'US');
  return n ? { digits: n.digits, pretty: n.pretty } : null;
}

// ── Token persistence (guarded — localStorage may be unavailable) ──────────
export function getPlayerToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setPlayerToken(token) {
  try {
    if (token == null) {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch {
    // ignore persistence failures (private mode / SSR)
  }
}

// ── Player info persistence ({ id, name } as JSON) ─────────────────────────
export function getPlayerInfo() {
  try {
    const raw = localStorage.getItem(PLAYER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setPlayerInfo(obj) {
  try {
    if (obj == null) {
      localStorage.removeItem(PLAYER_KEY);
    } else {
      localStorage.setItem(PLAYER_KEY, JSON.stringify(obj));
    }
  } catch {
    // ignore persistence failures
  }
}

export default normalizeUsPhone;
