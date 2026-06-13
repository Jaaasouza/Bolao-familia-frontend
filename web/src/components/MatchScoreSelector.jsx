import { useState, useEffect } from 'react';

// Scoreline picker for one match: two dropdowns, 0–10 each.
//   [ home ▾ ]  ×  [ away ▾ ]
// Simple and unambiguous — pick a number for each team.
//
// Pure resolver (unit-tested): given the two selected strings, return the final
// { home, away } scoreline, or null when either side isn't chosen yet.
export const MAX_SCORE = 10;
export const SCORE_OPTIONS = Array.from({ length: MAX_SCORE + 1 }, (_, i) => i); // 0..10

export function resolveScore({ homeVal, awayVal }) {
  const h = homeVal === '' || homeVal == null ? null : Number(homeVal);
  const a = awayVal === '' || awayVal == null ? null : Number(awayVal);
  if (h != null && a != null && Number.isFinite(h) && Number.isFinite(a)) return { home: h, away: a };
  return null;
}

export default function MatchScoreSelector({ value, locked = false, onChange }) {
  const seed = () => ({
    homeVal: value && value.home != null ? String(value.home) : '',
    awayVal: value && value.away != null ? String(value.away) : '',
  });
  const [sel, setSel] = useState(seed);

  // Re-seed if the persisted value changes (e.g. after save/refresh).
  useEffect(() => { setSel(seed()); /* eslint-disable-next-line */ }, [value && value.home, value && value.away]);

  const update = (next) => {
    setSel(next);
    if (onChange) onChange(resolveScore(next));
  };

  return (
    <div className={`mss${locked ? ' locked' : ''}`}>
      <select
        className="mss-sel" aria-label="home score" value={sel.homeVal} disabled={locked}
        onChange={(e) => update({ ...sel, homeVal: e.target.value })}
      >
        <option value="">–</option>
        {SCORE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <span className="mss-x">×</span>
      <select
        className="mss-sel" aria-label="away score" value={sel.awayVal} disabled={locked}
        onChange={(e) => update({ ...sel, awayVal: e.target.value })}
      >
        <option value="">–</option>
        {SCORE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </div>
  );
}

export { MatchScoreSelector };
