// Scoring domain logic for the Pick 24 pool. Mirrors SCORING.md and the legacy
// computePoints() in usam-world-cup-2026.html.
//
// A player picks the 1st and 2nd place team for each of the 12 groups (24 teams)
// plus one Champion bet. They earn:
//   - match points as their picked teams play (win/draw/goals/clean sheet/upset)
//   - cumulative phase bonuses as their picked teams advance
//   - group-prediction bonuses when group standings are finalised
//   - a champion-pick bonus if their champion bet wins the cup
//
// player.picks shape: { firsts: {A: team}, seconds: {A: team}, champion: team }

export const PHASE_ORDER = ['group', 'r32', 'r16', 'qf', 'sf', 'final', 'champion'];

// Cumulative knockout bonuses (a team reaching the final earns r32+r16+qf+sf+final).
export const PHASE_BONUS = { group: 0, r32: 3, r16: 5, qf: 10, sf: 20, final: 30, champion: 50 };

export const PHASE_LABELS = {
  group: 'Group Stage',
  r32: 'Round of 32',
  r16: 'Round of 16',
  qf: 'Quarter-finals',
  sf: 'Semi-finals',
  final: 'Final',
  champion: 'Champion',
};

// Group-prediction bonus tiers (SCORING.md §1).
//   perfect      — both 1st AND 2nd correct, right order
//   half         — exactly one position exactly correct
//   bothAdvance  — both predicted teams qualify but order is wrong
//
// NOTE: SCORING.md and the legacy code disagreed on the half/bothAdvance split.
// We follow SCORING.md. To flip, just swap these two values.
export const GROUP_BONUS = { perfect: 8, half: 4, bothAdvance: 2 };

export const CHAMPION_PICK_BONUS = 50;

// Golden Boot (top scorer) pick bonuses.
export const GOLDEN_BOOT_EXACT = 30; // your pick finishes as THE top scorer
export const GOLDEN_BOOT_TOP3 = 10;  // your pick finishes in the top 3 (consolation)

// accent/case-insensitive name key so "Mbappé" matches "Kylian Mbappé"/"Mbappe".
function nameKey(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

// Rank (1-based) of a picked scorer in the official scorers list, matching by
// goals (so ties share a rank). Returns 0 if the pick isn't in the list.
// scorers: [{ player, goals }] already sorted desc by the API.
export function goldenBootRank(pickName, scorers = []) {
  if (!pickName || !scorers.length) return 0;
  const key = nameKey(pickName);
  const idx = scorers.findIndex((s) => {
    const n = nameKey(s.player);
    return n === key || n.includes(key) || key.includes(n);
  });
  if (idx === -1) return 0;
  // dense rank by goal count (people level on goals share the top spot)
  const goals = scorers[idx].goals;
  let rank = 1;
  for (const s of scorers) {
    if (s.goals > goals) rank += 1;
  }
  return rank;
}

export function goldenBootBonus(pickName, scorers = []) {
  const rank = goldenBootRank(pickName, scorers);
  if (rank === 1) return GOLDEN_BOOT_EXACT;
  if (rank === 2 || rank === 3) return GOLDEN_BOOT_TOP3;
  return 0;
}

export const MATCH_POINTS = { win: 3, draw: 1, goal: 1, cleanSheet: 1, upset: 5 };

const COUNTABLE_STATUS = new Set(['FINISHED', 'IN_PLAY', 'PAUSED']);

export function phaseRank(phase) {
  const i = PHASE_ORDER.indexOf(phase);
  return i === -1 ? 0 : i;
}

// Cumulative phase bonus for a team that actually reached `actualPhase`.
export function phaseBonus(actualPhase) {
  const r = phaseRank(actualPhase);
  let pts = 0;
  for (const ph of ['r32', 'r16', 'qf', 'sf', 'final', 'champion']) {
    if (r >= phaseRank(ph)) pts += PHASE_BONUS[ph];
  }
  return pts;
}

// Match points earned by one team across all its played matches.
// Match shape is the backend row: { home_team, away_team, home_score, away_score, status, upset? }.
export function matchPointsForTeam(team, matches = []) {
  let pts = 0;
  for (const m of matches) {
    if (!COUNTABLE_STATUS.has(m.status)) continue;
    const isHome = m.home_team === team;
    const isAway = m.away_team === team;
    if (!isHome && !isAway) continue;
    const my = isHome ? m.home_score : m.away_score;
    const opp = isHome ? m.away_score : m.home_score;
    if (my == null || opp == null) continue;
    if (my > opp) pts += MATCH_POINTS.win;
    else if (my === opp) pts += MATCH_POINTS.draw;
    pts += my * MATCH_POINTS.goal;
    if (opp === 0) pts += MATCH_POINTS.cleanSheet;
    if (m.upset && my > opp) pts += MATCH_POINTS.upset;
  }
  return pts;
}

// The unique set of teams a player bet on (their 24 group picks).
export function pickedTeams(player) {
  const picks = (player && player.picks) || {};
  const set = new Set();
  for (const t of Object.values(picks.firsts || {})) if (t) set.add(t);
  for (const t of Object.values(picks.seconds || {})) if (t) set.add(t);
  return [...set];
}

// Bonus for a single group prediction vs the finalised standings.
export function groupBonus(predFirst, predSecond, actual) {
  if (!actual || !predFirst || !predSecond) return 0;
  const { first, second } = actual;
  if (!first || !second) return 0;
  if (predFirst === first && predSecond === second) return GROUP_BONUS.perfect;
  if (predFirst === first || predSecond === second) return GROUP_BONUS.half;
  const pred = new Set([predFirst, predSecond]);
  if (pred.has(first) && pred.has(second)) return GROUP_BONUS.bothAdvance;
  return 0;
}

// Full score for a player. ctx: { matches, teamPhases, standings, scorers }.
export function computeScore(player, ctx = {}) {
  const { matches = [], teamPhases = {}, standings = {}, scorers = [] } = ctx;
  const picks = (player && player.picks) || {};
  let total = 0;
  let sfPlus = 0;

  for (const team of pickedTeams(player)) {
    total += matchPointsForTeam(team, matches);
    const actualPhase = teamPhases[team] || 'group';
    total += phaseBonus(actualPhase);
    if (phaseRank(actualPhase) >= phaseRank('sf')) sfPlus += 1;
  }

  let perfectGroups = 0;
  const firsts = picks.firsts || {};
  const seconds = picks.seconds || {};
  for (const g of Object.keys(firsts)) {
    const b = groupBonus(firsts[g], seconds[g], standings[g]);
    total += b;
    if (b === GROUP_BONUS.perfect) perfectGroups += 1;
  }

  let championCorrect = false;
  if (picks.champion && teamPhases[picks.champion] === 'champion') {
    total += CHAMPION_PICK_BONUS;
    championCorrect = true;
  }

  // Golden Boot pick: +30 if your striker is THE top scorer, +10 for top 3.
  const gbBonus = goldenBootBonus(picks.topScorer, scorers);
  total += gbBonus;
  const goldenBoot = gbBonus === GOLDEN_BOOT_EXACT;

  return { total, championCorrect, goldenBoot, gbBonus, perfectGroups, sfPlus };
}

// Ranked leaderboard. Tiebreakers (SCORING.md §Tiebreakers): total desc, then
// champion-pick correct, then perfect group predictions, then picked teams that
// reached the semis, then earliest submission.
export function leaderboard(players = {}, ctx = {}) {
  return Object.values(players)
    .map((p) => {
      const s = computeScore(p, ctx);
      return { ...p, ...s, score: s.total };
    })
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      if (a.championCorrect !== b.championCorrect) return a.championCorrect ? -1 : 1;
      if (b.perfectGroups !== a.perfectGroups) return b.perfectGroups - a.perfectGroups;
      if (b.sfPlus !== a.sfPlus) return b.sfPlus - a.sfPlus;
      return (a.ts || 0) - (b.ts || 0);
    });
}
