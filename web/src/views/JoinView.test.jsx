import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';
import JoinView, {
  validatePicks,
  buildPlayerPayload,
  pickedTeams,
  flagUrl,
  FLAG_EMOJI,
  TEAM_ABBR,
  teamWithEmoji,
} from './JoinView.jsx';
import { GROUP_KEYS, GROUPS } from '../data/teams.js';

// vitest runs in the default node environment here (no jsdom installed, and per
// the task we don't reconfigure vitest). We render to static markup with
// react-dom/server (already a dependency) to assert the 12 group cards exist,
// and exercise the pure validation/payload helpers that drive the submit button.
function render(node) {
  return renderToStaticMarkup(<LanguageProvider>{node}</LanguageProvider>);
}

// Build a fully-valid set of picks across all 12 group cards.
function fullPicks() {
  const firsts = {};
  const seconds = {};
  for (const g of GROUP_KEYS) {
    firsts[g] = GROUPS[g][0];
    seconds[g] = GROUPS[g][1];
  }
  return { firsts, seconds };
}

describe('JoinView', () => {
  it('renders the 12 group pick cards with first/second selects', () => {
    const html = render(<JoinView players={{}} />);
    // One pick-card per group → exactly 12.
    const cards = (html.match(/pick-card/g) || []).length;
    expect(cards).toBe(12);
    expect(GROUP_KEYS.length).toBe(12);
    // First + second select per card → 24 selects.
    expect((html.match(/pickSel/g) || []).length).toBe(24);
    // Champion dropdown + name input present.
    expect(html).toContain('championPick');
    expect(html).toContain('playerName');
  });

  it('renders the submit button disabled while picks are empty/invalid', () => {
    const html = render(<JoinView players={{}} />);
    // savePick button starts disabled (no name / no picks / no champion).
    expect(html).toMatch(/id="savePick"[^>]*disabled/);
  });

  it('validatePicks gates submit until every field is valid', () => {
    expect(validatePicks({ name: '', firsts: {}, seconds: {}, champion: '' })).toBe('enterName');

    const { firsts, seconds } = fullPicks();

    expect(validatePicks({ name: 'Joao', firsts: {}, seconds: {}, champion: '' })).toBe(
      'pickAllGroups',
    );

    const partial = { ...seconds };
    delete partial.A;
    expect(validatePicks({ name: 'Joao', firsts, seconds: partial, champion: '' })).toBe(
      'pickAllGroups',
    );

    expect(
      validatePicks({ name: 'Joao', firsts, seconds: { ...seconds, A: firsts.A }, champion: '' }),
    ).toBe('sameTeamError');

    expect(validatePicks({ name: 'Joao', firsts, seconds, champion: '' })).toBe('pickChampion');

    expect(validatePicks({ name: 'Joao', firsts, seconds, champion: firsts.A })).toBeNull();
  });

  it('pickedTeams returns the unique sorted set of chosen teams', () => {
    const { firsts, seconds } = fullPicks();
    const picked = pickedTeams(firsts, seconds);
    expect(picked).toHaveLength(24);
    expect([...picked]).toEqual([...picked].sort());
    expect(new Set(picked).size).toBe(24);
  });

  it('buildPlayerPayload maps to the backend { id, name, picks } shape', () => {
    const { firsts, seconds } = fullPicks();
    const champion = firsts.A;
    const payload = buildPlayerPayload({ name: '  Joao  ', firsts, seconds, champion });

    expect(payload.id).toMatch(/^p_\d+$/);
    expect(payload.name).toBe('Joao');
    expect(Object.keys(payload.picks.firsts)).toEqual(GROUP_KEYS);
    expect(Object.keys(payload.picks.seconds)).toEqual(GROUP_KEYS);
    expect(payload.picks.champion).toBe(champion);

    const reused = buildPlayerPayload({ id: 'p_123', name: 'X', firsts, seconds, champion });
    expect(reused.id).toBe('p_123');
  });

  it('flag/abbr metadata resolves for every team', () => {
    for (const g of GROUP_KEYS) {
      for (const team of GROUPS[g]) {
        expect(FLAG_EMOJI[team]).toBeTruthy();
        expect(TEAM_ABBR[team]).toBeTruthy();
        expect(flagUrl(team)).toMatch(/^https:\/\/flagcdn\.com\//);
        expect(teamWithEmoji(team)).toBe(`${FLAG_EMOJI[team]} ${TEAM_ABBR[team]} - ${team}`);
      }
    }
  });
});
