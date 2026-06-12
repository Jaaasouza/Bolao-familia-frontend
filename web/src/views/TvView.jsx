// Public TV / kiosk view — NO login. Reachable at /tv (or /?tv=1). Meant to sit
// full-screen on a TV: live scores on the left, the leaderboard on the right,
// auto-refreshing, with a join QR so people in the room can scan and play.
import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { API } from '../lib/api.js';
import { normalizeMatches } from '../components/teams/teamStats.js';
import { MATCH_CARD_EXTRA_CSS } from '../components/MatchCard.jsx';
import LiveMatch from '../components/LiveMatch.jsx';
import { Logo } from '../components/Logo.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';
import { APP_NAME, BRAND } from '../config/app.js';

const LIVE = new Set(['IN_PLAY', 'PAUSED', 'LIVE']);
const DONE = new Set(['FINISHED']);

const TV_TXT = {
  en: { live: 'LIVE NOW', next: 'COMING UP', recent: 'LATEST RESULTS', rank: 'LEADERBOARD', pts: 'pts', join: 'Scan to join', noMatches: 'No matches scheduled yet', empty: 'No scores yet' },
  es: { live: 'EN VIVO', next: 'PRÓXIMOS', recent: 'ÚLTIMOS RESULTADOS', rank: 'CLASIFICACIÓN', pts: 'pts', join: 'Escanea para participar', noMatches: 'Aún no hay partidos', empty: 'Aún no hay puntos' },
};

const MEDALS = ['🥇', '🥈', '🥉'];

const TV_CSS = `
.tv{min-height:100vh;background:radial-gradient(1200px 700px at 50% -10%, rgba(20,45,95,.45), transparent), linear-gradient(180deg,#0a1733,#06102a);color:#fff;padding:24px 30px;box-sizing:border-box;display:flex;flex-direction:column;gap:20px}
.tv-top{display:flex;align-items:center;justify-content:space-between;gap:20px}
.tv-brand{display:flex;align-items:center;gap:14px}
.tv-brand h1{font-family:'Archivo Black',sans-serif;font-size:30px;margin:0;letter-spacing:.02em}
.tv-brand .l2{font-size:.7em;color:rgba(255,255,255,.6);display:block;font-weight:400;letter-spacing:.12em}
.tv-live{display:flex;align-items:center;gap:10px}
.tv-livedot{width:14px;height:14px;border-radius:50%;background:#ff3b3b;box-shadow:0 0 0 0 rgba(255,59,59,.7);animation:tvpulse 1.4s infinite}
@keyframes tvpulse{70%{box-shadow:0 0 0 14px rgba(255,59,59,0)}100%{box-shadow:0 0 0 0 rgba(255,59,59,0)}}
.tv-clock{font-family:'Anton',sans-serif;font-size:34px;letter-spacing:.04em}
.tv-grid{flex:1;display:grid;grid-template-columns:1.35fr 1fr;gap:24px;min-height:0}
@media (max-width:820px){.tv-grid{grid-template-columns:1fr;gap:16px}.tv-col-scroll{overflow:visible}.tv{padding:16px}}
.tv-col{display:flex;flex-direction:column;gap:14px;min-height:0}
.tv-col-scroll{overflow-y:auto}
.tv-pitch{flex:1}
.tv-h{font-family:'Anton',sans-serif;font-size:22px;letter-spacing:.06em;color:var(--gold,#ffd60a);display:flex;align-items:center;gap:10px}
.tv-matches{display:flex;flex-direction:column;gap:14px;overflow:hidden}
.tv-matches .match-card{transform:scale(1.0)}
.tv-rank{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:8px 10px;display:flex;flex-direction:column;gap:2px;overflow:hidden}
.tv-row{display:flex;align-items:center;gap:14px;padding:11px 12px;border-radius:11px}
.tv-row:nth-child(odd){background:rgba(255,255,255,.03)}
.tv-row.top{background:linear-gradient(90deg,rgba(255,214,10,.16),transparent)}
.tv-pos{font-family:'Anton',sans-serif;font-size:24px;width:46px;color:var(--gold,#ffd60a);text-align:center}
.tv-name{flex:1;font-family:'Archivo Black',sans-serif;font-size:22px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tv-pts{font-family:'Anton',sans-serif;font-size:26px}
.tv-pts small{font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,.5);margin-left:5px}
.tv-empty{color:rgba(255,255,255,.5);font-family:'JetBrains Mono',monospace;font-size:16px;padding:20px}
.tv-foot{display:flex;align-items:center;justify-content:center;gap:16px;padding:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px}
.tv-foot img{width:84px;height:84px;border-radius:10px;background:#fff;padding:6px;box-sizing:border-box}
.tv-foot .j{display:flex;flex-direction:column;gap:3px}
.tv-foot .j b{font-family:'Archivo Black',sans-serif;font-size:18px}
.tv-foot .j span{font-family:'JetBrains Mono',monospace;font-size:14px;color:var(--gold,#ffd60a);word-break:break-all}
`;

export default function TvView() {
  const { lang } = useLang();
  const T = TV_TXT[lang] || TV_TXT.en;
  const [matches, setMatches] = useState([]);
  const [board, setBoard] = useState([]);
  const [now, setNow] = useState(() => new Date());
  const [qr, setQr] = useState('');

  // Live clock.
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);

  // Poll public data (fast while something's live).
  useEffect(() => {
    let alive = true;
    const load = () => {
      API.state().then((s) => { if (alive) setMatches(s.matches || []); }).catch(() => {});
      API.scoreLeaderboard().then((r) => { if (alive) setBoard(r.leaderboard || []); }).catch(() => {});
    };
    load();
    const id = setInterval(load, 8000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // Join QR of the site root (strip the ?tv / /tv so phones open the real app).
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (!origin) return;
    QRCode.toDataURL(origin, { width: 220, margin: 1, color: { dark: '#0a1733', light: '#ffffff' } })
      .then(setQr).catch(() => {});
  }, []);

  const joinUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const { live, next, recent } = useMemo(() => {
    const norm = normalizeMatches(matches);
    const byDate = (a, b) => new Date(a.utcDate || 0) - new Date(b.utcDate || 0);
    return {
      live: norm.filter((m) => LIVE.has(m.status)).sort(byDate),
      next: norm.filter((m) => !LIVE.has(m.status) && !DONE.has(m.status)).sort(byDate),
      recent: norm.filter((m) => DONE.has(m.status)).sort((a, b) => new Date(b.utcDate || 0) - new Date(a.utcDate || 0)),
    };
  }, [matches]);

  // Show live games if any; otherwise the next kickoffs; otherwise latest results.
  const showLive = live.length > 0;
  const sectionLabel = showLive ? T.live : next.length ? T.next : T.recent;
  // The lead match always gets the full pitch view (live, else next, else last).
  const lead = live[0] || next[0] || recent[0] || null;

  const clock = now.toLocaleTimeString(lang === 'es' ? 'es' : 'en', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="tv">
      <style>{TV_CSS}{MATCH_CARD_EXTRA_CSS}</style>

      <div className="tv-top">
        <div className="tv-brand">
          <Logo size={56} />
          <h1>{BRAND}<span className="l2">{APP_NAME}</span></h1>
        </div>
        <div className="tv-live">
          {showLive && <span className="tv-livedot" aria-hidden="true" />}
          <span className="tv-clock">{clock}</span>
        </div>
      </div>

      <div className="tv-grid">
        <div className="tv-col tv-col-scroll">
          <div className="tv-h">{showLive && '🔴'} {sectionLabel}</div>
          {/* The lead match always shows on the pitch with its lineups + events. */}
          {lead
            ? <div className="tv-pitch"><LiveMatch m={lead} /></div>
            : <div className="tv-empty">{T.noMatches}</div>}
        </div>

        <div className="tv-col">
          <div className="tv-h">🏆 {T.rank}</div>
          <div className="tv-rank">
            {board.length
              ? board.slice(0, 12).map((r, i) => (
                <div key={r.id ?? i} className={`tv-row${i < 3 ? ' top' : ''}`}>
                  <span className="tv-pos">{i < 3 ? MEDALS[i] : i + 1}</span>
                  <span className="tv-name">{r.name}</span>
                  <span className="tv-pts">{r.total ?? 0}<small>{T.pts}</small></span>
                </div>
              ))
              : <div className="tv-empty">{T.empty}</div>}
          </div>
        </div>
      </div>

      {qr && (
        <div className="tv-foot">
          <img src={qr} alt="QR" />
          <div className="j">
            <b>📲 {T.join}</b>
            <span>{joinUrl}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export { TvView };
