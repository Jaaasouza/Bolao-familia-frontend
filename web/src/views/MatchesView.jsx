// Matches schedule tab. Fixtures grouped by calendar day (collapsible), each
// rendered with the canonical MatchCard so every tab looks identical. Days and
// matches are ordered chronologically; the day bucket uses the LOCAL calendar
// date (so a 12:00 AM kickoff lands on its real day, not the previous one).
import { useMemo, useState } from 'react';
import { useLang } from '../i18n/LanguageContext.jsx';
import { normalizeMatches } from '../components/teams/teamStats.js';
import MatchCard, { MATCH_CARD_EXTRA_CSS, LIVE, DONE } from '../components/MatchCard.jsx';

// Local YYYY-MM-DD (not UTC) so day buckets match the times shown on each card.
function localDayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function MatchesView({ matches = [] }) {
  const { t, lang } = useLang();
  const loc = lang === 'pt' ? 'pt-BR' : 'en';
  const [filter, setFilter] = useState('all'); // all | live | upcoming | finished

  const all = useMemo(
    () => normalizeMatches(matches).sort((a, b) => new Date(a.utcDate || 0) - new Date(b.utcDate || 0)),
    [matches],
  );

  const shown = useMemo(() => {
    if (filter === 'live') return all.filter((m) => LIVE.has(m.status));
    if (filter === 'finished') return all.filter((m) => DONE.has(m.status));
    if (filter === 'upcoming') return all.filter((m) => !LIVE.has(m.status) && !DONE.has(m.status));
    return all;
  }, [all, filter]);

  // Group by LOCAL calendar day. Keys sort chronologically; matches inside are
  // already time-ordered (the parent list is sorted by utcDate ascending).
  const byDay = useMemo(() => {
    const map = new Map();
    for (const m of shown) {
      const d = m.utcDate ? new Date(m.utcDate) : null;
      const key = d ? localDayKey(d) : 'TBD';
      if (!map.has(key)) {
        map.set(key, {
          key,
          weekday: d ? d.toLocaleDateString(loc, { weekday: 'long' }) : t('mDateTBD'),
          dayNum: d ? d.toLocaleDateString(loc, { day: '2-digit' }) : '',
          month: d ? d.toLocaleDateString(loc, { month: 'short' }) : '',
          items: [],
        });
      }
      map.get(key).items.push(m);
    }
    return [...map.values()].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  }, [shown]);

  // Default to the first day with a live match, else the first upcoming day,
  // else the first day overall.
  const defaultOpen = useMemo(() => {
    const withLive = byDay.find((s) => s.items.some((m) => LIVE.has(m.status)));
    if (withLive) return withLive.key;
    const withUpcoming = byDay.find((s) => s.items.some((m) => !DONE.has(m.status)));
    return (withUpcoming || byDay[0] || {}).key;
  }, [byDay]);

  const [openDay, setOpenDay] = useState(null);
  const activeDay = openDay ?? defaultOpen;

  const filters = [
    ['all', t('mFilterAll')], ['live', t('mFilterLive')],
    ['upcoming', t('mFilterUpcoming')], ['finished', t('mFilterFinished')],
  ];

  return (
    <div className="card">
      <style>{MATCH_CARD_EXTRA_CSS}</style>
      <h2>{t('matchesTitle')}</h2>
      <p className="hint">{t('matchesHint')}</p>

      <div className="match-filters">
        {filters.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`match-filter ${filter === id ? 'active' : ''}`}
            onClick={() => { setFilter(id); setOpenDay(null); }}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 && <p style={{ color: 'rgba(255,255,255,.5)' }}>{t('mNone')}</p>}

      <div className="match-accordion">
        {byDay.map((sec) => {
          const open = sec.key === activeDay;
          const liveCount = sec.items.filter((m) => LIVE.has(m.status)).length;
          return (
            <div key={sec.key} className={`day-group ${open ? 'open' : ''}`}>
              <button
                type="button"
                className="day-toggle"
                onClick={() => setOpenDay(open ? '__none__' : sec.key)}
                aria-expanded={open}
              >
                <span className="day-date">
                  <span className="day-num">{sec.dayNum}</span>
                  <span className="day-wm">
                    <span className="day-weekday">{sec.weekday}</span>
                    <span className="day-month">{sec.month}</span>
                  </span>
                </span>
                <span className="day-meta">
                  {liveCount > 0 && <span className="day-live">🔴 {liveCount} {t('mLiveSuffix')}</span>}
                  <span className="day-count">{sec.items.length} {sec.items.length === 1 ? t('mMatch') : t('mMatches')}</span>
                  <span className="day-chevron">▾</span>
                </span>
              </button>
              {open && (
                <div className="match-list">
                  {sec.items.map((m, i) => <MatchCard key={m.id ?? i} m={m} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { MatchesView };
