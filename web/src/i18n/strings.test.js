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
  it('exposes exactly the en and pt locales', () => {
    expect(Object.keys(I18N).sort()).toEqual(['en', 'pt']);
  });

  it('has matching key sets in en and pt (nothing untranslated)', () => {
    const enKeys = Object.keys(I18N.en).sort();
    const ptKeys = Object.keys(I18N.pt).sort();

    // every en key exists in pt
    const missingInPt = enKeys.filter((k) => !(k in I18N.pt));
    expect(missingInPt).toEqual([]);

    // every pt key exists in en
    const missingInEn = ptKeys.filter((k) => !(k in I18N.en));
    expect(missingInEn).toEqual([]);

    // and the full sets are identical
    expect(enKeys).toEqual(ptKeys);
  });

  it('ported a substantial number of keys (~70)', () => {
    expect(Object.keys(I18N.en).length).toBeGreaterThanOrEqual(65);
  });

  describe('t() fallback behaviour', () => {
    it('returns the locale string when present', () => {
      const t = makeT('pt');
      expect(t('signIn')).toBe('Entrar');
    });

    it('falls back to en when the key is missing in the active locale', () => {
      // 'adminPin' exists in both; ensure the pt value is used, not en.
      const t = makeT('pt');
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

  describe('spot-checked known strings', () => {
    it('hero subtitle (en)', () => {
      expect(I18N.en.subtitle).toBe(
        'Predict every match score ● 3 exact · 1 right result ● Locked once confirmed'
      );
    });

    it('hero subtitle (pt)', () => {
      expect(I18N.pt.subtitle).toBe(
        'Palpite o placar de cada jogo ● 3 exato · 1 resultado certo ● Travado ao confirmar'
      );
    });

    it('a tab label (en/pt)', () => {
      expect(I18N.en.tabRank).toBe('🏆 Leaderboard');
      expect(I18N.pt.tabRank).toBe('🏆 Classificação');
    });

    it('phone copy is country-neutral (no "US only")', () => {
      expect(I18N.en.yourPhone).toBe('Your phone (WhatsApp)');
      expect(I18N.pt.yourPhone).toBe('Seu telefone (WhatsApp)');
    });
  });

  describe('function-valued strings (confirmLock)', () => {
    it('is a function in both locales and interpolates correctly', () => {
      expect(typeof I18N.en.confirmLock).toBe('function');
      expect(typeof I18N.pt.confirmLock).toBe('function');
      expect(I18N.en.confirmLock('Ana', 'Brazil')).toContain('Lock in your picks for "Ana"?');
      expect(I18N.en.confirmLock('Ana', 'Brazil')).toContain('Champion: Brazil');
      expect(I18N.pt.confirmLock('Ana', 'Brasil')).toContain('Travar os palpites de "Ana"?');
      expect(I18N.pt.confirmLock('Ana', 'Brasil')).toContain('Campeão: Brasil');
    });
  });
});
