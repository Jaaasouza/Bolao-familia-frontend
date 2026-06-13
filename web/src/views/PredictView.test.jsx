import { describe, it, expect, beforeAll } from 'vitest';
import {
  changedPicks, isMatchOpen, matchReady, phaseInfo, selectActivePhase,
  draftKeyFor, pruneDraft, readDraft, writeDraft,
} from './PredictView.jsx';

// Minimal in-memory localStorage so the cache round-trip runs in any environment.
beforeAll(() => {
  if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    };
  }
});

describe('draft cache', () => {
  it('keys the draft per player', () => {
    expect(draftKeyFor('p_1')).toBe('usam2026:draftPicks:p_1');
    expect(draftKeyFor(null)).toBe('usam2026:draftPicks:anon');
  });

  it('pruneDraft drops submitted + incomplete entries', () => {
    const edits = {
      10: { home: 2, away: 1 }, // keep (in-progress)
      11: { home: 0, away: 0 }, // submitted → drop
      12: null,                 // incomplete → drop
      13: { home: 1, away: null }, // incomplete → drop
    };
    expect(pruneDraft(edits, { 11: { home: 0, away: 0 } })).toEqual({ 10: { home: 2, away: 1 } });
  });

  it('round-trips through localStorage and clears when empty', () => {
    const key = draftKeyFor('p_test');
    writeDraft(key, { 5: { home: 3, away: 2 } });
    expect(readDraft(key)).toEqual({ 5: { home: 3, away: 2 } });
    writeDraft(key, {});
    expect(readDraft(key)).toEqual({});
  });
});

describe('changedPicks', () => {
  it('returns only new entries when myPicks is empty', () => {
    const edits = { 1: { home: 2, away: 1 } };
    expect(changedPicks(edits, {})).toEqual([{ matchId: 1, home: 2, away: 1 }]);
  });

  it('ignores entries that match the persisted pick exactly', () => {
    const edits = { 1: { home: 2, away: 1 } };
    const myPicks = { 1: { home: 2, away: 1 } };
    expect(changedPicks(edits, myPicks)).toEqual([]);
  });

  it('includes an entry whose score changed', () => {
    const edits = { 1: { home: 3, away: 1 } };
    const myPicks = { 1: { home: 2, away: 1 } };
    expect(changedPicks(edits, myPicks)).toEqual([{ matchId: 1, home: 3, away: 1 }]);
  });

  it('treats string and number scores as equal (no spurious change)', () => {
    const edits = { 7: { home: '0', away: '0' } };
    const myPicks = { 7: { home: 0, away: 0 } };
    expect(changedPicks(edits, myPicks)).toEqual([]);
  });

  it('skips incomplete pairs (missing one side)', () => {
    const edits = { 1: { home: 2, away: '' }, 2: { home: '', away: '' } };
    expect(changedPicks(edits, {})).toEqual([]);
  });

  it('returns multiple changed/new entries and ignores unchanged ones', () => {
    const edits = {
      1: { home: 2, away: 1 }, // unchanged
      2: { home: 0, away: 3 }, // changed
      3: { home: 1, away: 1 }, // new
    };
    const myPicks = {
      1: { home: 2, away: 1 },
      2: { home: 1, away: 3 },
    };
    const result = changedPicks(edits, myPicks);
    expect(result).toEqual([
      { matchId: 2, home: 0, away: 3 },
      { matchId: 3, home: 1, away: 1 },
    ]);
  });

  it('coerces numeric string keys back to numbers in matchId', () => {
    const edits = { 42: { home: 1, away: 0 } };
    const [pick] = changedPicks(edits, {});
    expect(pick.matchId).toBe(42);
    expect(typeof pick.matchId).toBe('number');
  });

  it('handles empty/undefined inputs gracefully', () => {
    expect(changedPicks(undefined, undefined)).toEqual([]);
    expect(changedPicks({}, {})).toEqual([]);
  });
});

describe('isMatchOpen', () => {
  const future = '2999-01-01T00:00:00Z';
  const past = '2000-01-01T00:00:00Z';

  it('is open for a future TIMED match', () => {
    expect(isMatchOpen({ status: 'TIMED', utcDate: future })).toBe(true);
  });

  it('is open for a future SCHEDULED match', () => {
    expect(isMatchOpen({ status: 'SCHEDULED', utcDate: future })).toBe(true);
  });

  it('is locked once kickoff is in the past even if still TIMED', () => {
    expect(isMatchOpen({ status: 'TIMED', utcDate: past })).toBe(false);
  });

  it('is locked for in-play / finished statuses', () => {
    expect(isMatchOpen({ status: 'IN_PLAY', utcDate: future })).toBe(false);
    expect(isMatchOpen({ status: 'FINISHED', utcDate: past })).toBe(false);
  });
});

describe('matchReady', () => {
  it('is ready only when both teams are known', () => {
    expect(matchReady({ home: 'Brazil', away: 'Spain' })).toBe(true);
    expect(matchReady({ home: null, away: 'Spain' })).toBe(false);
    expect(matchReady({ home: 'Brazil', away: null })).toBe(false);
    expect(matchReady(null)).toBe(false);
  });
});

describe('phaseInfo', () => {
  const future = '2999-01-01T00:00:00Z';
  const past = '2000-01-01T00:00:00Z';
  const openReady = { status: 'TIMED', utcDate: future, home: 'A', away: 'B' };
  const openTBD = { status: 'TIMED', utcDate: future, home: null, away: null };
  const started = { status: 'IN_PLAY', utcDate: past, home: 'A', away: 'B' };

  it('flags a fully-open, all-ready phase as submittable', () => {
    const i = phaseInfo([openReady, openReady], false);
    expect(i).toMatchObject({ fullyOpen: true, allReady: true, started: false });
  });

  it('flags a phase with TBD slots as not allReady', () => {
    const i = phaseInfo([openReady, openTBD], false);
    expect(i.fullyOpen).toBe(true);
    expect(i.allReady).toBe(false);
  });

  it('flags a phase with a kicked-off match as started (not fullyOpen)', () => {
    const i = phaseInfo([openReady, started], false);
    expect(i.fullyOpen).toBe(false);
    expect(i.started).toBe(true);
  });

  it('passes the locked flag through', () => {
    expect(phaseInfo([openReady], true).locked).toBe(true);
  });
});

describe('selectActivePhase', () => {
  const open = { locked: false, fullyOpen: true };
  const lockedP = { locked: true, fullyOpen: false };
  const closed = { locked: false, fullyOpen: false };

  it('picks the first unlocked, fully-open phase', () => {
    const info = { group: lockedP, r32: open, r16: open };
    expect(selectActivePhase(['group', 'r32', 'r16'], info)).toBe('r32');
  });

  it('advances past a closed (window-passed) unlocked phase to the next open one', () => {
    const info = { group: closed, r32: open };
    expect(selectActivePhase(['group', 'r32'], info)).toBe('r32');
  });

  it('falls back to the last phase when all are locked', () => {
    const info = { group: lockedP, r32: lockedP };
    expect(selectActivePhase(['group', 'r32'], info)).toBe('r32');
  });

  it('returns null with no phases', () => {
    expect(selectActivePhase([], {})).toBe(null);
  });
});
