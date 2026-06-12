import { describe, it, expect } from 'vitest';
import { leaderboard } from '../lib/scoring.js';

// RankView renders players in the exact order produced by scoring.leaderboard()
// and reads .name / .total / .championCorrect off each flat entry. DOM rendering
// needs jsdom (not installed in this project), so this verifies the
// scoring-driven contract RankView consumes. Player shape mirrors scoring.js:
// players is an object keyed by id; picks = { firsts:{G:team}, seconds:{G:team} }.
describe('RankView ordering (scoring-driven)', () => {
  const standings = { A: { first: 'Mexico', second: 'South Korea' } };
  const phases = { Brazil: 'qf' }; // cumulative r32(3)+r16(5)+qf(10) = 18 bonus
  const matches = [
    { home_team: 'Brazil', away_team: 'Morocco', home_score: 2, away_score: 0, status: 'FINISHED' },
  ];

  const players = {
    // Ana: perfect group A prediction = +8
    ana: { id: 'ana', name: 'Ana', picks: { firsts: { A: 'Mexico' }, seconds: { A: 'South Korea' } } },
    // Bob: Brazil match pts (win 3 + 2 goals + clean sheet 1 = 6) + qf phase 18 = 24
    bob: { id: 'bob', name: 'Bob', picks: { firsts: { C: 'Brazil' }, seconds: { C: 'Morocco' } } },
    // Cara: no scoring picks = 0
    cara: { id: 'cara', name: 'Cara', picks: { firsts: { B: 'Canada' }, seconds: { B: 'Qatar' } } },
  };

  it('returns a flat array sorted by total points descending', () => {
    const ranked = leaderboard(players, { matches, teamPhases: phases, standings });
    expect(ranked.map((p) => p.name)).toEqual(['Bob', 'Ana', 'Cara']);
    expect(ranked[0].total).toBeGreaterThan(ranked[1].total);
    expect(ranked[1].total).toBeGreaterThan(ranked[2].total);
  });

  it('each entry exposes the fields RankView reads', () => {
    const ranked = leaderboard(players, { matches, teamPhases: phases, standings });
    const top = ranked[0];
    expect(top).toHaveProperty('name');
    expect(top).toHaveProperty('total');
    expect(top).toHaveProperty('championCorrect');
    expect(typeof top.total).toBe('number');
  });
});
