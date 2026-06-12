import { describe, it, expect } from 'vitest';
import { nextDeadline } from './CountdownBar.jsx';

const now = Date.parse('2026-06-10T00:00:00Z');
const at = (iso) => Date.parse(iso);

describe('nextDeadline', () => {
  it('returns the earliest future kickoff of the current open phase', () => {
    const matches = [
      { stage: 'GROUP_STAGE', utcDate: '2026-06-11T16:00:00Z' },
      { stage: 'GROUP_STAGE', utcDate: '2026-06-12T16:00:00Z' },
      { stage: 'LAST_32', utcDate: '2026-06-28T16:00:00Z' },
    ];
    const r = nextDeadline(matches, now);
    expect(r).toEqual({ phase: 'group', deadline: at('2026-06-11T16:00:00Z') });
  });

  it('advances to the next phase once the group has kicked off', () => {
    const t = Date.parse('2026-06-20T00:00:00Z'); // group already started
    const matches = [
      { stage: 'GROUP_STAGE', utcDate: '2026-06-11T16:00:00Z' },
      { stage: 'LAST_32', utcDate: '2026-06-28T16:00:00Z' },
      { stage: 'LAST_16', utcDate: '2026-07-04T16:00:00Z' },
    ];
    expect(nextDeadline(matches, t)).toEqual({ phase: 'r32', deadline: at('2026-06-28T16:00:00Z') });
  });

  it('returns null when nothing is left to lock', () => {
    const t = Date.parse('2026-08-01T00:00:00Z');
    const matches = [{ stage: 'FINAL', utcDate: '2026-07-19T16:00:00Z' }];
    expect(nextDeadline(matches, t)).toBe(null);
  });

  it('ignores matches without a date', () => {
    const matches = [
      { stage: 'GROUP_STAGE', utcDate: null },
      { stage: 'GROUP_STAGE', utcDate: '2026-06-11T16:00:00Z' },
    ];
    expect(nextDeadline(matches, now).deadline).toBe(at('2026-06-11T16:00:00Z'));
  });
});
