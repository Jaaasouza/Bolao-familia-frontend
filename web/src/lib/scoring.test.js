import { describe, test, expect } from 'vitest';
import {
  phaseRank,
  phaseBonus,
  matchPointsForTeam,
  groupBonus,
  pickedTeams,
  computeScore,
  leaderboard,
  PHASE_BONUS,
  GROUP_BONUS,
  CHAMPION_PICK_BONUS,
} from './scoring.js';

describe('phaseRank / phaseBonus', () => {
  test('phases are ordered', () => {
    expect(phaseRank('group')).toBeLessThan(phaseRank('r16'));
    expect(phaseRank('final')).toBeLessThan(phaseRank('champion'));
    expect(phaseRank('nope')).toBe(0);
  });

  test('phase bonus is cumulative', () => {
    expect(phaseBonus('group')).toBe(0);
    expect(phaseBonus('r32')).toBe(PHASE_BONUS.r32); // 3
    expect(phaseBonus('final')).toBe(3 + 5 + 10 + 20 + 30); // 68
    expect(phaseBonus('champion')).toBe(3 + 5 + 10 + 20 + 30 + 50); // 118
  });
});

describe('matchPointsForTeam', () => {
  const matches = [
    // Brazil win 3-0: win 3 + 3 goals + clean sheet 1 = 7
    { home_team: 'Brazil', away_team: 'Serbia', home_score: 3, away_score: 0, status: 'FINISHED' },
    // Brazil draw 1-1 away: draw 1 + 1 goal = 2
    { home_team: 'Spain', away_team: 'Brazil', home_score: 1, away_score: 1, status: 'FINISHED' },
    // not started — ignored
    { home_team: 'Brazil', away_team: 'X', home_score: null, away_score: null, status: 'TIMED' },
  ];

  test('sums win/draw/goals/clean sheet', () => {
    expect(matchPointsForTeam('Brazil', matches)).toBe(7 + 2);
  });

  test('ignores teams not in a match', () => {
    expect(matchPointsForTeam('France', matches)).toBe(0);
  });
});

describe('groupBonus', () => {
  const actual = { first: 'Brazil', second: 'Morocco' };
  test('perfect order', () => expect(groupBonus('Brazil', 'Morocco', actual)).toBe(GROUP_BONUS.perfect));
  test('one position exact', () => expect(groupBonus('Brazil', 'Haiti', actual)).toBe(GROUP_BONUS.half));
  test('both teams, wrong order', () => expect(groupBonus('Morocco', 'Brazil', actual)).toBe(GROUP_BONUS.bothAdvance));
  test('nothing right', () => expect(groupBonus('Haiti', 'Scotland', actual)).toBe(0));
  test('no standings yet', () => expect(groupBonus('Brazil', 'Morocco', undefined)).toBe(0));
});

describe('pickedTeams', () => {
  test('dedupes firsts + seconds', () => {
    const p = { picks: { firsts: { A: 'Mexico', B: 'Brazil' }, seconds: { A: 'Brazil', B: 'Japan' } } };
    expect(pickedTeams(p).sort()).toEqual(['Brazil', 'Japan', 'Mexico']);
  });
});

describe('computeScore', () => {
  const ctx = {
    matches: [
      { home_team: 'Brazil', away_team: 'Serbia', home_score: 2, away_score: 0, status: 'FINISHED' },
    ],
    teamPhases: { Brazil: 'champion', Mexico: 'r16' },
    standings: { A: { first: 'Mexico', second: 'South Korea' } },
  };

  test('aggregates match + phase + group + champion bonuses', () => {
    const player = {
      picks: {
        firsts: { A: 'Mexico', C: 'Brazil' },
        seconds: { A: 'South Korea', C: 'Morocco' },
        champion: 'Brazil',
      },
    };
    const s = computeScore(player, ctx);
    // Brazil: match 2-0 (win3+2goals+CS1=6) + phaseBonus(champion)=118 => 124
    // Mexico: phaseBonus(r16)=3+5=8
    // South Korea / Morocco: group phase, 0
    // group A perfect (Mexico/South Korea) => +8
    // champion pick Brazil correct => +50
    expect(s.total).toBe(124 + 8 + 8 + CHAMPION_PICK_BONUS);
    expect(s.championCorrect).toBe(true);
    expect(s.perfectGroups).toBe(1);
    expect(s.sfPlus).toBe(1); // Brazil reached champion (>= sf)
  });

  test('empty player scores zero', () => {
    expect(computeScore({}, ctx).total).toBe(0);
  });
});

describe('leaderboard', () => {
  const ctx = { teamPhases: { Brazil: 'champion' }, matches: [], standings: {} };
  test('orders by total then tiebreakers', () => {
    const players = {
      a: { id: 'a', ts: 200, picks: { firsts: { C: 'Brazil' }, seconds: {}, champion: 'Brazil' } },
      b: { id: 'b', ts: 100, picks: { firsts: { C: 'Brazil' }, seconds: {}, champion: 'Brazil' } },
      c: { id: 'c', ts: 50, picks: { firsts: { C: 'Mexico' }, seconds: {}, champion: 'Mexico' } },
    };
    const ranked = leaderboard(players, ctx);
    // a and b tie on total + champion; b earlier ts wins
    expect(ranked.map((p) => p.id)).toEqual(['b', 'a', 'c']);
    expect(ranked[0].championCorrect).toBe(true);
  });
});

describe('golden boot pick', () => {
  const scorers = [
    { player: 'Kylian Mbappé', goals: 8 },
    { player: 'Harry Kane', goals: 6 },
    { player: 'Erling Haaland', goals: 6 },
    { player: 'Vinicius Junior', goals: 4 },
  ];

  test('exact top scorer → +30', () => {
    const p = { picks: { firsts: {}, seconds: {}, topScorer: 'Kylian Mbappé' } };
    expect(computeScore(p, { scorers }).total).toBe(30);
    expect(computeScore(p, { scorers }).goldenBoot).toBe(true);
  });

  test('top-3 (tied 2nd) → +10', () => {
    const p = { picks: { firsts: {}, seconds: {}, topScorer: 'Erling Haaland' } };
    expect(computeScore(p, { scorers }).total).toBe(10);
    expect(computeScore(p, { scorers }).goldenBoot).toBe(false);
  });

  test('outside top 3 → 0', () => {
    const p = { picks: { firsts: {}, seconds: {}, topScorer: 'Vinicius Junior' } };
    expect(computeScore(p, { scorers }).total).toBe(0);
  });

  test('accent/case-insensitive name match', () => {
    const p = { picks: { firsts: {}, seconds: {}, topScorer: 'kylian mbappe' } };
    expect(computeScore(p, { scorers }).total).toBe(30);
  });

  test('no scorers yet → 0 (no crash)', () => {
    const p = { picks: { firsts: {}, seconds: {}, topScorer: 'Harry Kane' } };
    expect(computeScore(p, {}).total).toBe(0);
  });
});
