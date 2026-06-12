import { describe, test, expect } from 'vitest';
import { initials } from './StrikerSticker.jsx';

describe('striker initials', () => {
  test('first + last initial', () => {
    expect(initials('Kylian Mbappé')).toBe('KM');
    expect(initials('Son Heung-min')).toBe('SH');
  });
  test('single name → first two letters', () => {
    expect(initials('Rodrygo')).toBe('RO');
    expect(initials('Raphinha')).toBe('RA');
  });
  test('empty safe', () => {
    expect(initials('')).toBe('?');
  });
});
