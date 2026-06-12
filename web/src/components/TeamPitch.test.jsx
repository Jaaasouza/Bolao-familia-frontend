import { describe, it, expect } from 'vitest';
import { rowsFromFormation, placeXI } from './TeamPitch.jsx';

describe('rowsFromFormation', () => {
  it('parses formations / defaults to 4-4-2', () => {
    expect(rowsFromFormation('4-3-3')).toEqual([4, 3, 3]);
    expect(rowsFromFormation('4-2-3-1')).toEqual([4, 2, 3, 1]);
    expect(rowsFromFormation('')).toEqual([4, 4, 2]);
  });
});

describe('placeXI', () => {
  const xi = (formation) => ({
    formation,
    starters: Array.from({ length: 11 }, (_, i) => ({
      num: String(i + 1), name: `P${i + 1}`, pos: i === 0 ? 'G' : 'M', place: i + 1,
    })),
  });

  it('places all 11 with GK at the back (high y), attackers up (low y)', () => {
    const pts = placeXI(xi('4-3-3'));
    expect(pts).toHaveLength(11);
    expect(pts[0].pos).toBe('G');
    expect(pts[0].y).toBeGreaterThan(85);            // GK at the back
    expect(pts[pts.length - 1].y).toBeLessThan(30);  // forwards up top
    pts.forEach((p) => { expect(p.x).toBeGreaterThanOrEqual(0); expect(p.x).toBeLessThanOrEqual(100); });
  });

  it('returns [] for an empty lineup', () => {
    expect(placeXI({ starters: [] })).toEqual([]);
  });
});
