import { describe, test, expect } from 'vitest';
import { normalizeUsPhone, formatCountdown } from './JoinView.jsx';

describe('normalizeUsPhone', () => {
  test('accepts 10 digits in any format', () => {
    expect(normalizeUsPhone('4155551234')).toEqual({ digits: '4155551234', pretty: '(415) 555-1234' });
    expect(normalizeUsPhone('(415) 555-1234').digits).toBe('4155551234');
    expect(normalizeUsPhone('415.555.1234').pretty).toBe('(415) 555-1234');
  });
  test('strips a leading US country code', () => {
    expect(normalizeUsPhone('14155551234').digits).toBe('4155551234');
  });
  test('rejects invalid lengths', () => {
    expect(normalizeUsPhone('123')).toBeNull();
    expect(normalizeUsPhone('')).toBeNull();
    expect(normalizeUsPhone('123456789012')).toBeNull();
  });
});

describe('formatCountdown', () => {
  test('formats days/hours/minutes/seconds', () => {
    expect(formatCountdown(0)).toBe('0s');
    expect(formatCountdown(-5)).toBe('0s');
    expect(formatCountdown(90 * 1000)).toBe('00h 01m 30s');
    expect(formatCountdown((26 * 3600 + 5 * 60 + 9) * 1000)).toBe('1d 02h 05m 09s');
  });
});
