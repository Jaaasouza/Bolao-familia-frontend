// Team-level helpers for the Teams view. Ported from the legacy
// computeTeamStats() + the per-team match-points loop inside renderTeams().
// Match shape mirrors the legacy DB.matches rows:
//   { home, away, homeScore, awayScore, status, phase }

export const COUNTABLE_STATUS = new Set(['FINISHED', 'IN_PLAY', 'PAUSED']);
const UPCOMING_STATUS = new Set(['TIMED', 'SCHEDULED']);

// The backend (football-data mirror) sends snake_case rows
// ({ home_team, away_team, home_score, away_score, status, stage, utc_date }).
// The Teams components were written against the legacy camelCase shape
// ({ home, away, homeScore, awayScore, phase }). Normalize once here so both
// shapes work and live data renders correctly.
const STAGE_TO_PHASE = {
  GROUP_STAGE: 'group', LAST_32: 'r32', LAST_16: 'r16',
  QUARTER_FINALS: 'qf', SEMI_FINALS: 'sf', THIRD_PLACE: 'sf', FINAL: 'final',
};
export function normalizeMatch(m) {
  if (!m) return m;
  if (m.home !== undefined && m.homeScore !== undefined) return m; // already legacy shape
  const raw = m.raw || {};
  const ht = raw.score && raw.score.halfTime ? raw.score.halfTime : null;
  return {
    id: m.id,
    home: m.home_team ?? m.home ?? null,
    away: m.away_team ?? m.away ?? null,
    homeScore: m.home_score ?? m.homeScore ?? null,
    awayScore: m.away_score ?? m.awayScore ?? null,
    status: m.status ?? null,
    phase: m.phase ?? STAGE_TO_PHASE[m.stage] ?? 'group',
    utcDate: m.utc_date ?? m.utcDate ?? null,
    group: m.group_name ?? m.group ?? null,
    upset: m.upset ?? false,
    // Surfaced from the rich payload (football-data) for the live UI:
    minute: raw.minute ?? m.minute ?? null,
    injuryTime: raw.injuryTime ?? null,
    htHome: ht ? ht.home ?? null : null,
    htAway: ht ? ht.away ?? null : null,
    venue: raw.venue ?? null,
    matchday: raw.matchday ?? null,
    referee: raw.referees && raw.referees.length ? raw.referees[0].name : null,
    // ESPN key events: { events:[{kind,minute,team,player}], pens:{home,away,winner} }
    liveEvents: m.live_events ?? m.liveEvents ?? null,
    // ESPN lineups: { home/away: { formation, coach, starters:[...], subs:[...] } }
    lineups: m.lineups ?? null,
    // ESPN play-by-play commentary: [{ minute, text }]
    commentary: m.commentary ?? null,
  };
}
export function normalizeMatches(matches = []) {
  return matches.map(normalizeMatch);
}

// Upcoming (not-yet-played) matches for a team, soonest first.
export function teamUpcoming(team, matches = []) {
  return normalizeMatches(matches)
    .filter((m) => (m.home === team || m.away === team) && UPCOMING_STATUS.has(m.status))
    .sort((a, b) => new Date(a.utcDate || 0) - new Date(b.utcDate || 0));
}

// Phase metadata shared across teambox / bracket / modal renderers.
export const PHASE_SHORT = { group: 'Group', r32: 'R32', r16: 'R16', qf: 'QF', sf: 'SF', final: 'Final', champion: '🏆 Champion' };
export const PHASE_LONG = {
  group: 'Group Stage', r32: 'Round of 32', r16: 'Round of 16',
  qf: 'Quarterfinal', sf: 'Semifinal', final: 'Final', champion: 'Champion',
};
export const HISTORY_PHASE = { group: 'Group', r32: 'R32', r16: 'R16', qf: 'QF', sf: 'SF', final: 'Final' };

function num(v) {
  return Number(v) || 0;
}

// Full single-team stat line — mirrors computeTeamStats(team).
export function computeTeamStats(team, matches = []) {
  let w = 0, d = 0, l = 0, gf = 0, ga = 0, pts = 0, played = 0;
  normalizeMatches(matches).forEach((m) => {
    if (!COUNTABLE_STATUS.has(m.status)) return;
    let gfor; let gag;
    if (m.home === team) { gfor = num(m.homeScore); gag = num(m.awayScore); }
    else if (m.away === team) { gfor = num(m.awayScore); gag = num(m.homeScore); }
    else return;
    played += 1; gf += gfor; ga += gag;
    if (gfor > gag) { w += 1; pts += 3; }
    else if (gfor === gag) { d += 1; pts += 1; }
    else { l += 1; }
    pts += gfor;
    if (gag === 0) pts += 1;
  });
  return { w, d, l, gf, ga, pts, played, gd: gf - ga };
}

// Match-points per team across every team, mirroring the renderTeams() loop.
export function computeAllTeamPoints(matches = []) {
  const teamPts = {};
  normalizeMatches(matches).forEach((m) => {
    if (!COUNTABLE_STATUS.has(m.status)) return;
    const hs = num(m.homeScore); const as = num(m.awayScore);
    [[m.home, hs, as], [m.away, as, hs]].forEach(([t, gfor, gag]) => {
      if (!t) return;
      if (!teamPts[t]) teamPts[t] = { pts: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0, played: 0 };
      const r = teamPts[t];
      r.played += 1; r.gf += gfor; r.ga += gag;
      if (gfor > gag) { r.pts += 3; r.w += 1; }
      else if (gfor === gag) { r.pts += 1; r.d += 1; }
      else { r.l += 1; }
      r.pts += gfor;
      if (gag === 0) r.pts += 1;
    });
  });
  return teamPts;
}

// Count 1st/2nd predictions per team across all players. Accepts either the
// legacy player.picks array form ([{team,pos}]) or the React picks object form
// ({firsts:{A:team}, seconds:{A:team}}).
export function computePredictions(players = {}) {
  const pred = {};
  const bump = (team, posIsFirst) => {
    if (!team) return;
    if (!pred[team]) pred[team] = { first: 0, second: 0 };
    if (posIsFirst) pred[team].first += 1; else pred[team].second += 1;
  };
  Object.values(players).forEach((p) => {
    const picks = p?.picks;
    if (Array.isArray(picks)) {
      picks.forEach((pk) => bump(pk.team, pk.pos === 1));
    } else if (picks && typeof picks === 'object') {
      Object.values(picks.firsts || {}).forEach((t) => bump(t, true));
      Object.values(picks.seconds || {}).forEach((t) => bump(t, false));
    }
  });
  return pred;
}

// Matches involving a team that have a countable status — for match history.
export function teamMatchHistory(team, matches = []) {
  return normalizeMatches(matches).filter(
    (m) => (m.home === team || m.away === team) && COUNTABLE_STATUS.has(m.status),
  );
}
