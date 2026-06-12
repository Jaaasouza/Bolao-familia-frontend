import { describe, test, expect } from 'vitest';
import { flagUrl } from './teamMeta.js';

describe('flagUrl snaps to valid flagcdn widths', () => {
  test('arbitrary size (48) → nearest supported (w80), never broken w48', () => {
    expect(flagUrl('Brazil', 48)).toBe('https://flagcdn.com/w80/br.png');
    expect(flagUrl('Brazil', 40)).toBe('https://flagcdn.com/w40/br.png');
    expect(flagUrl('Brazil', 36)).toBe('https://flagcdn.com/w40/br.png');
    expect(flagUrl('Brazil', 160)).toBe('https://flagcdn.com/w160/br.png');
  });
  test('string token passes through', () => {
    expect(flagUrl('Brazil', 'w320')).toBe('https://flagcdn.com/w320/br.png');
  });
});
