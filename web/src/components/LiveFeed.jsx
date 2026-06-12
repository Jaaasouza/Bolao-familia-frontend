// Live happenings box (under the pitch): a styled feed of the match's key events
// — goals, cards, missed pens, shootout — each colour-signalled to the team that
// it belongs to. Latest event first. Pairs with the Pitch on the Live tab + TV.
import Flag from './teams/Flag.jsx';
import { TEAM_ABBR } from '../data/teamMeta.js';
import { useLang } from '../i18n/LanguageContext.jsx';

const ICON = { goal: '⚽', 'own-goal': '🥅', 'pen-miss': '❌', yellow: '🟨', red: '🟥' };
const KIND_LABEL = {
  en: { goal: 'Goal', 'own-goal': 'Own goal', 'pen-miss': 'Pen missed', yellow: 'Yellow', red: 'Red' },
  es: { goal: 'Gol', 'own-goal': 'Gol contra', 'pen-miss': 'Penal fallado', yellow: 'Amarilla', red: 'Roja' },
};
const LIVE = new Set(['IN_PLAY', 'PAUSED', 'LIVE']);
const T = {
  en: { title: 'Live · key moments', pens: 'Penalties',
    soon: 'Kick-off soon ⚽', noneLive: 'No goals or cards yet — game underway', done: 'Full time — no goals or cards' },
  es: { title: 'En vivo · momentos', pens: 'Penales',
    soon: 'Ya empieza ⚽', noneLive: 'Sin goles ni tarjetas aún — partido en curso', done: 'Final — sin goles ni tarjetas' },
};

export default function LiveFeed({ liveEvents, status, minute, homeTeam, awayTeam, homeColor = '#3a86ff', awayColor = '#ffd60a' }) {
  const { lang } = useLang();
  const t = T[lang] || T.en;
  const kl = KIND_LABEL[lang] || KIND_LABEL.en;

  const events = (liveEvents && Array.isArray(liveEvents.events)) ? liveEvents.events : [];
  const pens = liveEvents && liveEvents.pens;
  // newest first
  const ordered = [...events].sort((a, b) => (b.minute ?? 0) - (a.minute ?? 0));

  // status-aware empty message so it's clear the feed is working
  const emptyMsg = status === 'FINISHED' ? t.done
    : LIVE.has(status) ? `🔴 ${t.noneLive}${minute != null ? ` · ${minute}'` : ''}`
      : t.soon;

  const colorFor = (team) => {
    if (!team) return 'rgba(255,255,255,.4)';
    if (team === homeTeam) return homeColor;
    if (team === awayTeam) return awayColor;
    return 'rgba(255,255,255,.4)';
  };

  return (
    <div className="lf">
      <style>{LF_CSS}</style>
      <div className="lf-h">🔴 {t.title}</div>

      {pens && (
        <div className="lf-pens">
          🥅 {t.pens}: <b style={{ color: colorFor(pens.winner) }}>{TEAM_ABBR[pens.winner] || pens.winner}</b>
          {' '}{Math.max(pens.home, pens.away)}–{Math.min(pens.home, pens.away)}
        </div>
      )}

      {ordered.length === 0 && !pens ? (
        <div className="lf-empty">{emptyMsg}</div>
      ) : (
        <ul className="lf-list">
          {ordered.map((ev, i) => (
            <li key={i} className="lf-row" style={{ borderLeftColor: colorFor(ev.team) }}>
              <span className="lf-min">{ev.minute != null ? `${ev.minute}'` : ''}</span>
              <span className="lf-ic">{ICON[ev.kind] || '•'}</span>
              <span className="lf-body">
                <b className="lf-player">{ev.player || (kl[ev.kind] || '')}</b>
                {ev.player && <span className="lf-kind"> · {kl[ev.kind] || ''}</span>}
              </span>
              {ev.team && (
                <span className="lf-team">
                  <Flag team={ev.team} size={16} /> {TEAM_ABBR[ev.team] || ev.team}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const LF_CSS = `
.lf{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px 14px;margin-top:14px}
.lf-h{font-family:'Anton',sans-serif;font-size:14px;letter-spacing:.04em;color:var(--gold,#ffd60a);margin-bottom:10px}
.lf-pens{font-family:'JetBrains Mono',monospace;font-size:13px;color:#fff;background:rgba(138,201,38,.12);
  border:1px solid rgba(138,201,38,.4);border-radius:10px;padding:8px 10px;margin-bottom:10px}
.lf-empty{font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,.55);padding:6px 2px}
.lf-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px}
.lf-row{display:flex;align-items:center;gap:9px;background:rgba(0,0,0,.18);border-left:3px solid;border-radius:8px;padding:7px 10px}
.lf-min{font-family:'Anton',sans-serif;font-size:14px;color:#fff;width:34px;flex:none}
.lf-ic{font-size:15px;flex:none}
.lf-body{flex:1;min-width:0;font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,.85);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lf-player{color:#fff}
.lf-kind{color:rgba(255,255,255,.55)}
.lf-team{display:flex;align-items:center;gap:5px;flex:none;font-family:'Archivo Black',sans-serif;font-size:11px;color:#fff}
`;

export { LiveFeed };
