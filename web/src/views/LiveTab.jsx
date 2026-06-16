// Live tab — the stadium view: the live match on a tactical pitch with lineups,
// score, the running clock and key events (goals/cards/pens). Falls back to the
// next kickoff, then the latest result. Self-refreshes every 15s.
import { useState, useEffect, useMemo } from 'react';
import { API } from '../lib/api.js';
import { normalizeMatches } from '../components/teams/teamStats.js';
import { getPlayerToken } from '../auth/usePhoneAuth.js';
import LiveMatch from '../components/LiveMatch.jsx';
import ChatView from './ChatView.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';

const LIVE = new Set(['IN_PLAY', 'PAUSED', 'LIVE']);
const DONE = new Set(['FINISHED']);
const byDate = (a, b) => new Date(a.utcDate || 0) - new Date(b.utcDate || 0);

const T = {
  en: { live: '🔴 LIVE', next: '⏭ Up next', latest: '✅ Latest result', none: 'No matches to show yet.' },
  pt: { live: '🔴 AO VIVO', next: '⏭ A seguir', latest: '✅ Último resultado', none: 'Ainda não há jogos para mostrar.' },
};

export default function LiveTab({ matches: initial = [] }) {
  const { lang, t: tr } = useLang();
  const t = T[lang] || T.en;
  const [matches, setMatches] = useState(initial);
  const [myPicks, setMyPicks] = useState({});
  const [sel, setSel] = useState(0);

  // Keep the live view fresh independent of the rest of the app.
  useEffect(() => {
    let alive = true;
    const load = () => API.state().then((s) => { if (alive) setMatches(s.matches || []); }).catch(() => {});
    load();
    const id = setInterval(load, 8000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // The signed-in player's picks → show "Your pick" on the featured match.
  useEffect(() => {
    const token = getPlayerToken();
    if (!token) return;
    let alive = true;
    API.myScorePicks(token).then((res) => {
      if (!alive) return;
      const map = {};
      for (const p of res.picks || []) map[p.match_id] = { home: p.pred_home, away: p.pred_away };
      setMyPicks(map);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const { live, featured } = useMemo(() => {
    const norm = normalizeMatches(matches);
    const lv = norm.filter((m) => LIVE.has(m.status)).sort(byDate);
    const up = norm.filter((m) => !LIVE.has(m.status) && !DONE.has(m.status)).sort(byDate);
    const done = norm.filter((m) => DONE.has(m.status)).sort((a, b) => byDate(b, a));
    if (lv.length) return { live: lv, featured: lv };
    if (up.length) return { live: [], featured: [up[0]] };
    if (done.length) return { live: [], featured: [done[0]] };
    return { live: [], featured: [] };
  }, [matches]);

  const m = featured[Math.min(sel, featured.length - 1)] || null;

  return (
    <>
      <div className="card">
      <style>{LT_CSS}</style>

      {/* selector when several games are live at once */}
      {live.length > 1 && (
        <div className="lt-pick">
          {live.map((g, i) => (
            <button key={g.id ?? i} type="button"
              className={`lt-chip${i === sel ? ' on' : ''}`} onClick={() => setSel(i)}>
              {(g.home || 'TBD').slice(0, 3).toUpperCase()}–{(g.away || 'TBD').slice(0, 3).toUpperCase()}
              {g.homeScore != null && <b> {g.homeScore}:{g.awayScore}</b>}
            </button>
          ))}
        </div>
      )}

      {m ? <LiveMatch m={m} pred={myPicks[m.id] || null} /> : <p className="hint">{t.none}</p>}
      </div>

      {/* In-game chat — clears when the game ends. */}
      <ChatView channel="live" title={tr('chatLiveTitle')} hint={tr('chatLiveHint')} />
    </>
  );
}

const LT_CSS = `
.lt-pick{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.lt-chip{border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.05);color:#fff;border-radius:30px;
  padding:7px 12px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:12px}
.lt-chip.on{border-color:var(--gold,#ffd60a);background:rgba(255,214,10,.14)}
.lt-chip b{color:var(--gold,#ffd60a)}
`;
