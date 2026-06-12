import { describe, it, expect } from 'vitest';
import { predictedGroupTables, groupBonus, decidedGroups } from './groupPredict.js';

describe('decidedGroups', () => {
  it('marks a group decided only when all its matches are FINISHED', () => {
    const d = decidedGroups([
      { id: 1, group_name: 'GROUP_A', status: 'FINISHED' },
      { id: 2, group_name: 'GROUP_A', status: 'FINISHED' },
      { id: 3, group_name: 'GROUP_B', status: 'FINISHED' },
      { id: 4, group_name: 'GROUP_B', status: 'TIMED' },
    ]);
    expect(d.has('A')).toBe(true);
    expect(d.has('B')).toBe(false);
  });

  it('is empty before the tournament starts', () => {
    const d = decidedGroups([
      { id: 1, group_name: 'GROUP_A', status: 'TIMED' },
      { id: 2, group_name: 'GROUP_L', status: 'SCHEDULED' },
    ]);
    expect(d.size).toBe(0);
  });
});

describe('groupBonus', () => {
  it('+2 when both qualifiers correct in order', () => {
    expect(groupBonus('MEX', 'RSA', 'MEX', 'RSA')).toBe(2);
  });
  it('+1 when both right but swapped', () => {
    expect(groupBonus('MEX', 'RSA', 'RSA', 'MEX')).toBe(1);
  });
  it('0 when a qualifier is wrong', () => {
    expect(groupBonus('MEX', 'RSA', 'MEX', 'URU')).toBe(0);
  });
  it('null when undecided or incomplete', () => {
    expect(groupBonus('MEX', 'RSA', null, null)).toBe(null);
    expect(groupBonus(null, 'RSA', 'MEX', 'RSA')).toBe(null);
  });
});

const matches = [
  { id: 1, group_name: 'GROUP_A', home_team: 'Mexico', away_team: 'South Africa', status: 'TIMED' },
  { id: 2, group_name: 'GROUP_A', home_team: 'Mexico', away_team: 'South Korea', status: 'TIMED' },
  { id: 3, group_name: 'GROUP_A', home_team: 'South Africa', away_team: 'South Korea', status: 'TIMED' },
];

describe('predictedGroupTables', () => {
  it('ranks a group by predicted points then goal diff', () => {
    const picks = {
      1: { home: 2, away: 0 }, // MEX beats RSA
      2: { home: 1, away: 1 }, // MEX draws KOR
      3: { home: 0, away: 3 }, // KOR beats RSA
    };
    const [A] = predictedGroupTables(matches, picks);
    expect(A.group).toBe('A');
    // MEX 4 (W+D), KOR 4 (W+D) → tie on pts; KOR gd +2 vs MEX +2; gf KOR 4 vs MEX 3 → KOR first
    expect(A.first).toBe('South Korea');
    expect(A.second).toBe('Mexico');
    expect(A.complete).toBe(true);
  });

  it('marks incomplete when not all matches picked', () => {
    const [A] = predictedGroupTables(matches, { 1: { home: 1, away: 0 } });
    expect(A.complete).toBe(false);
    expect(A.first).toBe('Mexico');
  });

  it('ignores matches without a pick and knockout matches', () => {
    const ko = [{ id: 9, stage: 'FINAL', home_team: 'A', away_team: 'B', status: 'TIMED' }];
    expect(predictedGroupTables(ko, { 9: { home: 1, away: 0 } })).toEqual([]);
  });
});
