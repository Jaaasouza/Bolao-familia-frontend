// Phone-auth helpers for the scoreline-predictions flow.
// Pure utilities only — NO network code lives here (the coordinator wires the
// actual POST /api/auth/phone call through api.js). This module owns phone
// normalization plus token / player persistence in localStorage.

export const TOKEN_KEY = 'usam2026:ptoken';
export const PLAYER_KEY = 'usam2026:player';

// normalizeUsPhone(input) -> { digits, pretty } | null
// Accepts any US 10-digit phone in any formatting. A leading country code "1"
// (i.e. an 11-digit string starting with 1) is stripped. Anything that does not
// resolve to exactly 10 digits returns null. `pretty` is "(xxx) xxx-xxxx".
export function normalizeUsPhone(input) {
  if (input == null) return null;
  let digits = String(input).replace(/\D+/g, '');

  // Strip a leading US country code.
  if (digits.length === 11 && digits[0] === '1') {
    digits = digits.slice(1);
  }

  if (digits.length !== 10) return null;

  const pretty = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return { digits, pretty };
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
