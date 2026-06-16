// Centralized API wrapper for the backend (Railway).
//
// - Reads the base URL from VITE_API_BASE (absolute URL — never relative, or the
//   Vercel SPA fallback would serve index.html for unknown /api paths).
// - Attaches the admin JWT as `Authorization: Bearer <token>` when present.
// - Adds a timeout and uniform error handling.

// Strip trailing slashes (and stray whitespace) so a base like
// "https://host/" never produces a double-slashed "//api/state", which the
// backend would 404 as "Not found".
const BASE = (import.meta.env.VITE_API_BASE || '').trim().replace(/\/+$/, '');
const TOKEN_KEY = 'usam2026:token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore storage errors */
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body, auth = false, token, timeoutMs = 10000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  // `token` (explicit, e.g. a player token) takes precedence over the stored
  // admin token used by `auth: true`.
  const bearer = token || (auth ? getToken() : null);
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    let data = null;
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }

    if (!res.ok) {
      const msg = (data && data.error) || `Request failed (${res.status})`;
      throw new ApiError(msg, res.status);
    }
    return data;
  } catch (e) {
    if (e.name === 'AbortError') throw new ApiError('Request timed out', 0);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// Convenience helpers mirroring the backend contract.
export const API = {
  state: () => api('/api/state'),
  // auth:true sends the admin token when present (reveals phones to admins);
  // without a token the same endpoint returns the public, phone-less roster.
  players: () => api('/api/players', { auth: true }),
  config: () => api('/api/config'),
  groups: () => api('/api/groups'),
  login: (password) => api('/api/auth/login', { method: 'POST', body: { password } }),
  // Public self-registration (no admin token). Backend locks the player on save.
  register: (player) => api('/api/register', { method: 'POST', body: player }),
  // Scoreline-prediction model (new game): phone login + per-match score picks.
  phoneLogin: (phone) => api('/api/auth/phone', { method: 'POST', body: { phone } }),
  scoreLeaderboard: () => api('/api/score-leaderboard'),
  // Public: every player's score picks, grouped by player id ({ picks: { pid:[...] } }).
  allScorePicks: () => api('/api/score-picks'),
  myScorePicks: (token) => api('/api/my-score-picks', { token }),
  saveScorePicks: (picks, token) => api('/api/score-picks', { method: 'POST', body: { picks }, token }),
  // Submit a whole phase in one shot (irreversible lock). picks = all matches of
  // the phase.
  submitPhase: (phase, picks, token) =>
    api('/api/score-picks', { method: 'POST', body: { phase, picks }, token }),
  saveConfig: (cfg) => api('/api/config', { method: 'POST', body: cfg, auth: true }),
  savePlayer: (player) => api('/api/players', { method: 'POST', body: player, auth: true }),
  deletePlayer: (id) => api(`/api/players/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
  savePhases: (phases) => api('/api/phases', { method: 'POST', body: phases, auth: true }),
  saveStandings: (standings) => api('/api/standings', { method: 'POST', body: standings, auth: true }),
  syncNow: () => api('/api/sync-now', { method: 'POST', auth: true }),
  // Web push: VAPID public key + (un)subscribe a browser for the logged-in player.
  pushKey: () => api('/api/push/key'),
  pushSubscribe: (subscription, lang, token) => api('/api/push/subscribe', { method: 'POST', body: { subscription, lang }, token }),
  pushUnsubscribe: (endpoint, token) => api('/api/push/unsubscribe', { method: 'POST', body: { endpoint }, token }),
  // Pool chat — player-scoped, per channel ('live' wipes when a game ends,
  // 'ranking' persists). `since` (ISO) fetches only newer messages.
  chatList: (token, channel = 'live', since) =>
    api(`/api/chat?channel=${encodeURIComponent(channel)}${since ? `&since=${encodeURIComponent(since)}` : ''}`, { token }),
  chatPost: (body, token, channel = 'live', mentions = []) => api('/api/chat', { method: 'POST', body: { body, channel, mentions }, token }),
  chatDelete: (id) => api(`/api/chat/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
};

export default api;
