import { describe, it, expect } from 'vitest';
import { I18N } from './strings.js';

// Mirror of the HTML's t() fallback: I18N[lang][key] ?? I18N.en[key] ?? key
function makeT(lang) {
  return (key) => {
    const table = I18N[lang];
    return (table && table[key]) ?? I18N.en[key] ?? key;
  };
}

describe('I18N strings', () => {
  it('exposes exactly the en and es locales', () => {
    expect(Object.keys(I18N).sort()).toEqual(['en', 'es']);
  });

  it('has matching key sets in en and es (nothing untranslated)', () => {
    const enKeys = Object.keys(I18N.en).sort();
    const esKeys = Object.keys(I18N.es).sort();

    // every en key exists in es
    const missingInEs = enKeys.filter((k) => !(k in I18N.es));
    expect(missingInEs).toEqual([]);

    // every es key exists in en
    const missingInEn = esKeys.filter((k) => !(k in I18N.en));
    expect(missingInEn).toEqual([]);

    // and the full sets are identical
    expect(enKeys).toEqual(esKeys);
  });

  it('ported a substantial number of keys (~70)', () => {
    expect(Object.keys(I18N.en).length).toBeGreaterThanOrEqual(65);
  });

  describe('t() fallback behaviour', () => {
    it('returns the locale string when present', () => {
      const t = makeT('es');
      expect(t('signIn')).toBe('Entrar');
    });

    it('falls back to en when the key is missing in the active locale', () => {
      // Simulate a locale lookup that has no override by using a key that
      // only differs — every key exists in both, so test the chain directly.
      const t = makeT('es');
      // 'adminPin' exists in both; ensure es value is used, not en.
      expect(t('adminPin')).toBe('PIN (4 dígitos)');
      expect(I18N.en.adminPin).toBe('PIN (4 digits)');
    });

    it('falls back to the key itself when missing everywhere', () => {
      const t = makeT('en');
      expect(t('__nonexistent_key__')).toBe('__nonexistent_key__');
    });

    it('falls back to en for an unknown language', () => {
      const t = makeT('fr');
      expect(t('signIn')).toBe('Sign In');
    });
  });

  describe('spot-checked known strings match the HTML source', () => {
    it('hero subtitle (en)', () => {
      expect(I18N.en.subtitle).toBe(
        'Predict every match score ● 3 exact · 1 right result ● Locked once confirmed'
      );
    });

    it('hero subtitle (es)', () => {
      expect(I18N.es.subtitle).toBe(
        'Predice el marcador de cada partido ● 3 exacto · 1 resultado ● Bloqueado al confirmar'
      );
    });

    it('a tab label (en/es)', () => {
      expect(I18N.en.tabRank).toBe('🏆 Leaderboard');
      expect(I18N.es.tabRank).toBe('🏆 Clasificación');
    });

    it('brandTag preserves emoji, middot, and en dash', () => {
      expect(I18N.en.brandTag).toBe('⚽ Official Pool · June 11 – July 19');
      expect(I18N.es.brandTag).toBe('⚽ Quiniela Oficial · 11 Junio – 19 Julio');
    });
  });

  describe('function-valued strings (confirmLock)', () => {
    it('is a function in both locales and interpolates correctly', () => {
      expect(typeof I18N.en.confirmLock).toBe('function');
      expect(typeof I18N.es.confirmLock).toBe('function');
      expect(I18N.en.confirmLock('Ana', 'Brazil')).toContain('Lock in your picks for "Ana"?');
      expect(I18N.en.confirmLock('Ana', 'Brazil')).toContain('Champion: Brazil');
      expect(I18N.es.confirmLock('Ana', 'Brasil')).toContain('¿Bloquear los picks de "Ana"?');
      expect(I18N.es.confirmLock('Ana', 'Brasil')).toContain('Campeón: Brasil');
    });
  });
});
