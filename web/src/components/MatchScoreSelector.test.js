import { describe, test, expect } from 'vitest';
import { resolveBoxes } from './MatchScoreSelector.jsx';

describe('resolveBoxes', () => {
  test('draw box → X-X', () => {
    expect(resolveBoxes({ drawVal: '2', homeVal: '', awayVal: '' })).toEqual({ home: 2, away: 2 });
    expect(resolveBoxes({ drawVal: '0', homeVal: '', awayVal: '' })).toEqual({ home: 0, away: 0 });
  });
  test('both sides → that scoreline', () => {
    expect(resolveBoxes({ drawVal: '', homeVal: '2', awayVal: '1' })).toEqual({ home: 2, away: 1 });
  });
  test('incomplete → null', () => {
    expect(resolveBoxes({ drawVal: '', homeVal: '2', awayVal: '' })).toBeNull();
    expect(resolveBoxes({ drawVal: '', homeVal: '', awayVal: '' })).toBeNull();
  });
  test('draw takes precedence if somehow both set', () => {
    expect(resolveBoxes({ drawVal: '1', homeVal: '3', awayVal: '0' })).toEqual({ home: 1, away: 1 });
  });
});
