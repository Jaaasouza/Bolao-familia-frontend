// Compact key-events strip for a match (from ESPN): goals (scorer + minute),
// cards, and the penalty-shootout result. Rendered under the MatchCard whenever
// there's something to show — live or finished. Team abbreviations keep it tidy.
import { TEAM_ABBR } from '../data/teamMeta.js';

const ICON = { goal: '⚽', 'own-goal': '⚽', 'pen-miss': '❌', yellow: '🟨', red: '🟥' };

function label(ev) {
  const who = ev.player || (ev.team ? (TEAM_ABBR[ev.team] || ev.team) : '');
  const min = ev.minute != null ? `${ev.minute}'` : '';
  const own = ev.kind === 'own-goal' ? ' (OG)' : '';
  return `${ICON[ev.kind] || '•'} ${min} ${who}${own}`.trim();
}

export default function MatchEvents({ liveEvents }) {
  if (!liveEvents) return null;
  const events = Array.isArray(liveEvents.events) ? liveEvents.events : [];
  const pens = liveEvents.pens;
  if (!events.length && !pens) return null;

  return (
    <div className="mev">
      <style>{MEV_CSS}</style>
      {events.map((ev, i) => (
        <span key={i} className={`mev-i mev-${ev.kind}`}>{label(ev)}</span>
      ))}
      {pens && (
        <span className="mev-i mev-pens">
          🥅 {TEAM_ABBR[pens.winner] || pens.winner} {Math.max(pens.home, pens.away)}–{Math.min(pens.home, pens.away)} pen
        </span>
      )}
    </div>
  );
}

const MEV_CSS = `
.mev{display:flex;flex-wrap:wrap;gap:6px 10px;justify-content:center;margin:6px 2px 0;
  font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,.8)}
.mev-i{display:inline-flex;align-items:center;gap:3px;white-space:nowrap}
.mev-goal,.mev-own-goal{color:#fff}
.mev-yellow{color:#ffd60a}
.mev-red{color:#ff6b6b}
.mev-pen-miss{color:rgba(255,255,255,.5)}
.mev-pens{color:var(--lime,#8ac926);font-weight:700}
`;

export { MatchEvents };
