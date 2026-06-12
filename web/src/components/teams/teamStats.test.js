import { describe, test, expect } from 'vitest';
import {
  normalizeMatch, computeTeamStats, teamUpcoming, computeAllTeamPoints,
} from './teamStats.js';

describe('normalizeMatch (API snake_case → legacy shape)', () => {
  test('maps backend rows', () => {
    const n = normalizeMatch({
      id: 1, home_team: 'Brazil', away_team: 'Serbia', home_score: 2, away_score: 0,
      status: 'FINISHED', stage: 'GROUP_STAGE', utc_date: '2026-06-15T18:00:00Z', group_name: 'GROUP_C',
    });
    expect(n).toMatchObject({ home: 'Brazil', away: 'Serbia', homeScore: 2, awayScore: 0, phase: 'group' });
  });
  test('passes through legacy shape untouched', () => {
    const m = { home: 'A', away: 'B', homeScore: 1, awayScore: 1, status: 'FINISHED', phase: 'group' };
    expect(normalizeMatch(m)).toBe(m);
  });
});

describe('stats work on API-shaped matches', () => {
  const api = [
    { id: 1, home_team: 'Brazil', away_team: 'Serbia', home_score: 3, away_score: 0, status: 'FINISHED', stage: 'GROUP_STAGE' },
  ];
  test('computeTeamStats reads snake_case', () => {
    const s = computeTeamStats('Brazil', api);
    expect(s.played).toBe(1); expect(s.w).toBe(1); expect(s.gf).toBe(3);
  });
  test('computeAllTeamPoints reads snake_case', () => {
    const pts = computeAllTeamPoints(api);
    // win 3 + 3 goals + clean sheet 1 = 7
    expect(pts.Brazil.pts).toBe(7);
  });
});

describe('teamUpcoming', () => {
  test('returns only TIMED/SCHEDULED, soonest first', () => {
    const ms = [
      { id: 1, home_team: 'Brazil', away_team: 'X', status: 'FINISHED', utc_date: '2026-06-10T00:00:00Z' },
      { id: 2, home_team: 'Brazil', away_team: 'Y', status: 'TIMED', utc_date: '2026-06-20T00:00:00Z' },
      { id: 3, home_team: 'Z', away_team: 'Brazil', status: 'TIMED', utc_date: '2026-06-15T00:00:00Z' },
    ];
    const up = teamUpcoming('Brazil', ms);
    expect(up.map((m) => m.id)).toEqual([3, 2]);
  });
});
