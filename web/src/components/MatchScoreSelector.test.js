import { describe, test, expect } from 'vitest';
import { resolveScore, SCORE_OPTIONS } from './MatchScoreSelector.jsx';

describe('resolveScore', () => {
  test('both sides selected → that scoreline', () => {
    expect(resolveScore({ homeVal: '2', awayVal: '1' })).toEqual({ home: 2, away: 1 });
    expect(resolveScore({ homeVal: '0', awayVal: '0' })).toEqual({ home: 0, away: 0 });
  });
  test('incomplete → null', () => {
    expect(resolveScore({ homeVal: '2', awayVal: '' })).toBeNull();
    expect(resolveScore({ homeVal: '', awayVal: '3' })).toBeNull();
    expect(resolveScore({ homeVal: '', awayVal: '' })).toBeNull();
  });
});

describe('SCORE_OPTIONS', () => {
  test('covers 0..10', () => {
    expect(SCORE_OPTIONS[0]).toBe(0);
    expect(SCORE_OPTIONS[SCORE_OPTIONS.length - 1]).toBe(10);
    expect(SCORE_OPTIONS).toHaveLength(11);
  });
});
