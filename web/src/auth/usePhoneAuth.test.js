import { describe, it, expect } from 'vitest';
import { normalizeUsPhone, TOKEN_KEY, PLAYER_KEY } from './usePhoneAuth.js';

describe('normalizeUsPhone', () => {
  it('accepts a plain 10-digit string', () => {
    expect(normalizeUsPhone('5551234567')).toEqual({
      digits: '5551234567',
      pretty: '(555) 123-4567',
    });
  });

  it('accepts the (xxx) xxx-xxxx format', () => {
    expect(normalizeUsPhone('(555) 123-4567')).toEqual({
      digits: '5551234567',
      pretty: '(555) 123-4567',
    });
  });

  it('accepts dashes and dots', () => {
    expect(normalizeUsPhone('555-123-4567').digits).toBe('5551234567');
    expect(normalizeUsPhone('555.123.4567').digits).toBe('5551234567');
  });

  it('accepts spaces and surrounding whitespace', () => {
    expect(normalizeUsPhone('  555 123 4567  ').digits).toBe('5551234567');
  });

  it('strips a leading 1 country code (11 digits)', () => {
    expect(normalizeUsPhone('15551234567')).toEqual({
      digits: '5551234567',
      pretty: '(555) 123-4567',
    });
  });

  it('strips a leading +1 country code with formatting', () => {
    expect(normalizeUsPhone('+1 (555) 123-4567').digits).toBe('5551234567');
  });

  it('rejects too-short input', () => {
    expect(normalizeUsPhone('12345')).toBeNull();
    expect(normalizeUsPhone('555123456')).toBeNull(); // 9 digits
  });

  it('rejects too-long input', () => {
    expect(normalizeUsPhone('555123456789')).toBeNull(); // 12 digits
    expect(normalizeUsPhone('25551234567')).toBeNull(); // 11 digits not starting with 1
  });

  it('rejects empty / nullish input', () => {
    expect(normalizeUsPhone('')).toBeNull();
    expect(normalizeUsPhone('   ')).toBeNull();
    expect(normalizeUsPhone(null)).toBeNull();
    expect(normalizeUsPhone(undefined)).toBeNull();
  });

  it('rejects letters-only input', () => {
    expect(normalizeUsPhone('abcdefghij')).toBeNull();
  });

  it('accepts numeric (non-string) input', () => {
    expect(normalizeUsPhone(5551234567).digits).toBe('5551234567');
  });
});

describe('storage keys', () => {
  it('uses the agreed localStorage keys', () => {
    expect(TOKEN_KEY).toBe('usam2026:ptoken');
    expect(PLAYER_KEY).toBe('usam2026:player');
  });
});
