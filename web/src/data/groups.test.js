import { describe, test, expect } from 'vitest';
import { resolveGroups } from './groups.js';
import { GROUPS as SEED } from './teams.js';

describe('resolveGroups', () => {
  test('falls back to seed when API groups are empty/partial', () => {
    expect(resolveGroups({}).groups).toBe(SEED);
    expect(resolveGroups({ A: ['x'] }).groups).toBe(SEED);
  });
  test('uses API groups when 12 full groups are present', () => {
    const api = {};
    for (const k of 'ABCDEFGHIJKL') api[k] = ['t1', 't2', 't3', 't4'];
    const r = resolveGroups(api);
    expect(r.groups).toBe(api);
    expect(r.keys).toHaveLength(12);
  });
});
