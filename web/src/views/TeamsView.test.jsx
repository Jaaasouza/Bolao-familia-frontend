// Smoke tests for the Teams tab, now just the official Group Tables.
// Uses react-dom/server so it needs no DOM environment.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import TeamsView from './TeamsView.jsx';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';
import { computeTeamStats } from '../components/teams/teamStats.js';

// StandingsTable reads the language; wrap renders in the provider (default EN).
const render = (node) => renderToStaticMarkup(<LanguageProvider>{node}</LanguageProvider>);

const SAMPLE = {
  A: {
    table: [
      { position: 1, team: 'Czechia', played: 3, won: 2, draw: 1, lost: 0, gd: 4, points: 7 },
      { position: 2, team: 'Mexico', played: 3, won: 2, draw: 0, lost: 1, gd: 2, points: 6 },
    ],
  },
};

describe('TeamsView (Group Tables)', () => {
  it('renders the group tables from the synced standings', () => {
    const html = render(<TeamsView standingsTable={SAMPLE} />);
    expect(html).toContain('Group Tables');
    expect(html).toContain('Group A');
    expect(html).toContain('Czechia');
    expect(html).toContain('Mexico');
  });

  it('renders nothing until tables are available', () => {
    expect(render(<TeamsView standingsTable={null} />)).toBe('');
  });

  it('computeTeamStats still mirrors the legacy scoring (win + goals + clean sheet)', () => {
    const stats = computeTeamStats('Brazil', [
      { home: 'Brazil', away: 'Morocco', homeScore: 2, awayScore: 0, status: 'FINISHED' },
    ]);
    expect(stats).toMatchObject({ w: 1, d: 0, l: 0, gf: 2, ga: 0, pts: 6, played: 1, gd: 2 });
  });
});
