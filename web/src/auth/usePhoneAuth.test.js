import { describe, it, expect } from 'vitest';
import { normalizeUsPhone, normalizePhone, TOKEN_KEY, PLAYER_KEY } from './usePhoneAuth.js';

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

describe('normalizePhone (Brasil)', () => {
  it('accepts an 11-digit mobile and prefixes the 55 country code', () => {
    expect(normalizePhone('(11) 91234-5678', 'BR')).toEqual({
      country: 'BR', national: '11912345678', digits: '5511912345678', dial: '55',
      pretty: '(11) 91234-5678',
    });
  });

  it('accepts a 10-digit landline', () => {
    expect(normalizePhone('1131234567', 'BR')).toEqual({
      country: 'BR', national: '1131234567', digits: '551131234567', dial: '55',
      pretty: '(11) 3123-4567',
    });
  });

  it('tolerates an included 55 country code', () => {
    expect(normalizePhone('+55 (21) 99876-5432', 'BR').digits).toBe('5521998765432');
    expect(normalizePhone('5521998765432', 'BR').national).toBe('21998765432');
  });

  it('defaults to Brazil when no country is given', () => {
    expect(normalizePhone('11912345678').country).toBe('BR');
  });

  it('rejects invalid Brazilian lengths', () => {
    expect(normalizePhone('123', 'BR')).toBeNull();
    expect(normalizePhone('119123456', 'BR')).toBeNull(); // 9 digits
    expect(normalizePhone('', 'BR')).toBeNull();
    expect(normalizePhone(null, 'BR')).toBeNull();
  });
});

describe('normalizePhone (USA)', () => {
  it('keeps US numbers at 10 national digits', () => {
    expect(normalizePhone('(415) 555-1234', 'US')).toEqual({
      country: 'US', national: '4155551234', digits: '4155551234', dial: '1',
      pretty: '(415) 555-1234',
    });
  });

  it('strips a leading US country code', () => {
    expect(normalizePhone('14155551234', 'US').digits).toBe('4155551234');
  });

  it('rejects non-10-digit US input', () => {
    expect(normalizePhone('5551234', 'US')).toBeNull();
  });
});

describe('storage keys', () => {
  it('uses the agreed localStorage keys', () => {
    expect(TOKEN_KEY).toBe('usam2026:ptoken');
    expect(PLAYER_KEY).toBe('usam2026:player');
  });
});
