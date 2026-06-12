// Live / TV screen for the scoreline-prediction game.
//
//   1) LIVE NOW — every in-play match as the canonical MatchCard (🔴 stamp + bar).
//   2) LEADERBOARD — the real server leaderboard (score-leaderboard). Players
//      with a pick on a live match get a 🔴 badge showing the points those live
//      picks are worth *right now* (provisional).
//   3) EARNING NOW — the picks currently scoring on live matches, biggest first.
//
// A goal on any tracked live match fires confetti + sound (kept from the
// original TV behaviour).
import { useMemo, useRef, useEffect } from 'react';
import { useLang } from '../i18n/LanguageContext.jsx';
import { normalizeMatches } from '../components/teams/teamStats.js';
import { TEAM_ABBR } from '../data/teamMeta.js';
import Flag from '../components/teams/Flag.jsx';
import MatchCard, { MATCH_CARD_EXTRA_CSS } from '../components/MatchCard.jsx';
import { pointsFor } from './DashboardView.jsx';
import { fireConfetti, playGoalSound, flashTitle } from '../lib/fx.js';

const LIVE = new Set(['IN_PLAY', 'PAUSED', 'LIVE']);

export default function LiveView({ matches = [], leaderboard = [], picksByPlayer = {} }) {
  const { t } = useLang();
  const norm = useMemo(() => normalizeMatches(matches), [matches]);
  const liveMatches = useMemo(
    () => norm.filter((m) => LIVE.has(m.status)).sort((a, b) => new Date(a.utcDate || 0) - new Date(b.utcDate || 0)),
    [norm],
  );

  // Goal celebration: compare total goals per live match across polls.
  const prevRef = useRef({});
  const initRef = useRef(false);
  useEffect(() => {
    const prev = prevRef.current;
    const next = {};
    let goal = false;
    for (const m of liveMatches) {
      const cur = (Number(m.homeScore) || 0) + (Number(m.awayScore) || 0);
      if (initRef.current && prev[m.id] !== undefined && cur > prev[m.id]) goal = true;
      next[m.id] = cur;
    }
    if (goal) { fireConfetti(); playGoalSound(); flashTitle(); }
    prevRef.current = next;
    initRef.current = true;
  }, [liveMatches]);

  // Live points each player is earning right now from their picks on live games.
  const liveById = useMemo(() => {
    const map = {};
    for (const m of liveMatches) map[String(m.id)] = m;
    return map;
  }, [liveMatches]);

  const livePtsByPlayer = useMemo(() => {
    const out = {};
    for (const [pid, picks] of Object.entries(picksByPlayer)) {
      let sum = 0;
      for (const p of picks || []) {
        const m = liveById[String(p.match_id)];
        if (!m) continue;
        const pts = pointsFor({ home: p.pred_home, away: p.pred_away }, m);
        if (pts) sum += pts;
      }
      if (sum) out[pid] = sum;
    }
    return out;
  }, [picksByPlayer, liveById]);

  // "Earning now": flatten picks that are scoring on a live match.
  const nameById = useMemo(() => {
    const m = {};
    for (const r of leaderboard) m[r.id] = r.name;
    return m;
  }, [leaderboard]);

  const earning = useMemo(() => {
    const rows = [];
    for (const [pid, picks] of Object.entries(picksByPlayer)) {
      for (const p of picks || []) {
        const m = liveById[String(p.match_id)];
        if (!m) continue;
        const pts = pointsFor({ home: p.pred_home, away: p.pred_away }, m);
        if (pts > 0) rows.push({ pid, m, pred: { home: p.pred_home, away: p.pred_away }, pts });
      }
    }
    return rows.sort((a, b) => b.pts - a.pts);
  }, [picksByPlayer, liveById]);

  const top = leaderboard.slice(0, 12);

  return (
    <div className="usam-live2">
      <style>{LIVE_CSS}{MATCH_CARD_EXTRA_CSS}</style>

      {/* 1) live matches */}
      {liveMatches.length > 0 ? (
        <div className="card">
          <h2>🔴 {t('liveTag') || 'LIVE'} <span className="lv-count">{liveMatches.length}</span></h2>
          <div className="lv-matches">
            {liveMatches.map((m) => <MatchCard key={m.id} m={m} />)}
          </div>
        </div>
      ) : (
        <div className="card"><p className="lv-empty">{t('noLiveNow') || 'No matches live right now.'}</p></div>
      )}

      <div className="lv-grid">
        {/* 2) leaderboard */}
        <div className="card">
          <h2>🏆 {t('leaderboard') || 'LEADERBOARD'}</h2>
          {top.length === 0
            ? <p className="lv-empty">{t('noPlayers') || 'No players yet.'}</p>
            : (
              <ol className="lv-board">
                {top.map((r, i) => {
                  const live = livePtsByPlayer[r.id];
                  return (
                    <li key={r.id ?? i} className={`lv-row${i === 0 ? ' lv-top' : ''}`}>
                      <span className="lv-pos">{i + 1}</span>
                      <span className="lv-name">{r.name}</span>
                      {live ? <span className="lv-live">🔴 +{live}</span> : null}
                      <span className="lv-pts">{r.total ?? 0}</span>
                    </li>
                  );
                })}
              </ol>
            )}
        </div>

        {/* 3) earning now */}
        <div className="card">
          <h2>⚡ {t('earningNow') || 'Earning now'}</h2>
          {earning.length === 0
            ? <p className="lv-empty">Nothing scoring live right now.</p>
            : (
              <ul className="lv-earn">
                {earning.map(({ pid, m, pred, pts }, i) => (
                  <li key={`${pid}-${m.id}-${i}`} className="lv-earn-row">
                    <span className="lv-earn-name">{nameById[pid] || 'Player'}</span>
                    <span className="lv-earn-match">
                      <Flag team={m.home} size={16} /> {TEAM_ABBR[m.home] || m.home}
                      <b> {m.homeScore}–{m.awayScore} </b>
                      {TEAM_ABBR[m.away] || m.away} <Flag team={m.away} size={16} />
                    </span>
                    <span className="lv-earn-pick">pick {pred.home}–{pred.away}</span>
                    <span className={`lv-earn-pts p${pts}`}>+{pts}</span>
                  </li>
                ))}
              </ul>
            )}
        </div>
      </div>
    </div>
  );
}

const LIVE_CSS = `
.usam-live2 h2 .lv-count{font-family:'JetBrains Mono',monospace;font-size:13px;color:#fff;background:#e7382c;border-radius:20px;padding:2px 9px;vertical-align:middle;margin-left:6px}
.lv-empty{color:rgba(255,255,255,.5)}
.lv-matches{display:grid;gap:12px}
@media(min-width:760px){.lv-matches{grid-template-columns:1fr 1fr}}
.lv-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
@media(max-width:760px){.lv-grid{grid-template-columns:1fr}}
.lv-board{list-style:none;margin:0;padding:0}
.lv-row{display:flex;align-items:center;gap:10px;padding:8px 8px;border-radius:9px;border-bottom:1px solid rgba(255,255,255,.06)}
.lv-row.lv-top{background:linear-gradient(90deg,rgba(255,214,10,.14),transparent)}
.lv-pos{font-family:'Anton',sans-serif;width:24px;color:var(--gold,#ffd60a)}
.lv-name{flex:1;font-family:'Archivo Black',sans-serif;font-size:13px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lv-live{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:800;color:#fff;background:rgba(231,56,44,.85);border-radius:10px;padding:2px 7px}
.lv-pts{font-family:'Anton',sans-serif;font-size:20px;color:#fff;min-width:34px;text-align:right}
.lv-earn{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.lv-earn-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.lv-earn-name{font-family:'Archivo Black',sans-serif;font-size:12px;color:#fff;min-width:90px}
.lv-earn-match{display:flex;align-items:center;gap:5px;font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,.85)}
.lv-earn-match b{color:var(--gold,#ffd60a)}
.lv-earn-pick{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,.55)}
.lv-earn-pts{margin-left:auto;font-weight:800;font-family:'JetBrains Mono',monospace;font-size:11px;padding:2px 8px;border-radius:10px}
.lv-earn-pts.p3{color:#0a1733;background:var(--gold,#ffd60a)}
.lv-earn-pts.p1{color:#0a1733;background:var(--lime,#8ac926)}
`;

export { LiveView };
