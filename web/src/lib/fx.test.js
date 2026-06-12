import { describe, it, expect } from 'vitest';
import { fireConfetti, playGoalSound, flashTitle, celebrateGoal } from './fx.js';

// These run under node (no DOM / no Web Audio). The FX helpers must no-op
// gracefully rather than throw, so the rest of the app stays test-safe.
describe('fx helpers', () => {
  it('fireConfetti is callable without throwing when DOM is unavailable', () => {
    expect(() => fireConfetti()).not.toThrow();
  });

  it('playGoalSound is callable without throwing when AudioContext is unavailable', () => {
    expect(() => playGoalSound()).not.toThrow();
  });

  it('flashTitle is callable without throwing when document is unavailable', () => {
    expect(() => flashTitle('⚽ GOAL!')).not.toThrow();
    expect(() => flashTitle()).not.toThrow();
  });

  it('celebrateGoal fires all three without throwing', () => {
    expect(() => celebrateGoal()).not.toThrow();
  });
});
