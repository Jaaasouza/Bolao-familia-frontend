// Predicted group tables from a player's scoreline picks.
// For every group match the player predicted, award 3/1/0 points and tally
// goals, then rank each group to surface the predicted 1st (champion) and 2nd
// (runner-up). Pure + testable.
import { normalizeMatches } from '../components/teams/teamStats.js';

// "GROUP_A" → "A"; null for knockout matches.
function groupKey(m) {
  if (!m.group) return null;
  return String(m.group).replace(/^GROUP[_ ]?/i, '').trim() || null;
}

// picks: { [matchId]: { home, away } }
export function predictedGroupTables(matches = [], picks = {}) {
  const norm = normalizeMatches(matches);
  const groups = {};
  const counts = {}; // group → total group matches (to know if complete)

  for (const m of norm) {
    const g = groupKey(m);
    if (!g) continue;
    counts[g] = (counts[g] || 0) + 1;

    const p = picks[m.id];
    if (!p) continue;
    const h = Number(p.home);
    const a = Number(p.away);
    if (!Number.isFinite(h) || !Number.isFinite(a)) continue;

    const tbl = groups[g] || (groups[g] = {});
    const H = tbl[m.home] || (tbl[m.home] = { team: m.home, pts: 0, gf: 0, ga: 0, played: 0 });
    const A = tbl[m.away] || (tbl[m.away] = { team: m.away, pts: 0, gf: 0, ga: 0, played: 0 });
    H.played += 1; A.played += 1;
    H.gf += h; H.ga += a; A.gf += a; A.ga += h;
    if (h > a) H.pts += 3;
    else if (h < a) A.pts += 3;
    else { H.pts += 1; A.pts += 1; }
  }

  return Object.keys(groups).sort().map((g) => {
    const rows = Object.values(groups[g])
      .map((r) => ({ ...r, gd: r.gf - r.ga }))
      .sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.team.localeCompare(y.team));
    const playedAll = rows.reduce((s, r) => s + r.played, 0);
    return {
      group: g,
      rows,
      first: rows[0] ? rows[0].team : null,
      second: rows[1] ? rows[1].team : null,
      // complete when every group match has a pick (each match counted twice in played)
      complete: counts[g] != null && playedAll === counts[g] * 2,
    };
  });
}

// Group letters whose every group-stage match is FINISHED — the only groups the
// bonus can score (so it never fires before a group has actually finished).
export function decidedGroups(matches = []) {
  const byGroup = {};
  for (const m of normalizeMatches(matches)) {
    const g = groupKey(m);
    if (!g) continue;
    (byGroup[g] = byGroup[g] || []).push(m.status);
  }
  const decided = new Set();
  for (const g of Object.keys(byGroup)) {
    if (byGroup[g].length > 0 && byGroup[g].every((s) => s === 'FINISHED')) decided.add(g);
  }
  return decided;
}

// Bonus a predicted top-two earns against the actual decided standings:
//   +2 both correct in order · +1 both right but swapped · 0 otherwise.
// Returns null when it can't be scored yet (group undecided or pick incomplete).
export function groupBonus(predFirst, predSecond, actFirst, actSecond) {
  if (!predFirst || !predSecond || !actFirst || !actSecond) return null;
  if (predFirst === actFirst && predSecond === actSecond) return 2;
  if (predFirst === actSecond && predSecond === actFirst) return 1;
  return 0;
}

export { groupKey };
