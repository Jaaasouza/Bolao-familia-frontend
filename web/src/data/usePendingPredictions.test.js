import { describe, test, expect } from 'vitest';
import { hasPendingPredictions } from './usePendingPredictions.js';

const FUTURE = new Date(Date.now() + 864e5).toISOString(); // +1 day
const PAST = new Date(Date.now() - 864e5).toISOString();   // -1 day

// Backend-shaped rows (snake_case) — hasPendingPredictions normalizes them.
const openMatch = (id, over = {}) => ({
  id, home_team: 'Brazil', away_team: 'Spain', status: 'TIMED',
  utc_date: FUTURE, stage: 'GROUP_STAGE', ...over,
});

describe('hasPendingPredictions', () => {
  test('open, ready, unpicked match → pending', () => {
    expect(hasPendingPredictions([openMatch(1)], {})).toBe(true);
  });

  test('all open matches already picked → not pending', () => {
    expect(hasPendingPredictions([openMatch(1)], { 1: true })).toBe(false);
  });

  test('kicked-off / finished matches never count as pending', () => {
    expect(hasPendingPredictions([openMatch(1, { status: 'IN_PLAY' })], {})).toBe(false);
    expect(hasPendingPredictions([openMatch(1, { status: 'FINISHED' })], {})).toBe(false);
    expect(hasPendingPredictions([openMatch(1, { utc_date: PAST })], {})).toBe(false);
  });

  test('knockout slot with unknown teams (TBD) is not yet pending', () => {
    expect(hasPendingPredictions([openMatch(1, { home_team: null, away_team: null, stage: 'LAST_16' })], {})).toBe(false);
  });

  test('mix: one picked, one open unpicked → still pending', () => {
    const ms = [openMatch(1), openMatch(2)];
    expect(hasPendingPredictions(ms, { 1: true })).toBe(true);
    expect(hasPendingPredictions(ms, { 1: true, 2: true })).toBe(false);
  });

  test('no matches → not pending', () => {
    expect(hasPendingPredictions([], {})).toBe(false);
  });
});
