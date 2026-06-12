// Canonical match card — the ONE visual standard reused across every tab
// (Matches schedule, Predict, Dashboard). The home team's flag colors +
// watermark fill the left half, the away team's the right half, a translucent
// center shows the score / kickoff time (or a custom node, e.g. the score
// selector), and a live game gets a 🔴 LIVE stamp + a bottom time bar.
//
// `m` is a normalized match ({ home, away, homeScore, awayScore, status,
// minute, injuryTime, referee, phase, group, utcDate }).
// Props:
//   centerOverride — replace the center content (Predict selector / locked / pick)
//   tag            — small ribbon above the row (e.g. "NEXT MATCH · Thu 3:00 PM")
import { FLAGS, flagUrl } from '../data/teamMeta.js';
import { useLang } from '../i18n/LanguageContext.jsx';

const LIVE = new Set(['IN_PLAY', 'PAUSED', 'LIVE']);
const DONE = new Set(['FINISHED']);

const STAGE_LABEL = {
  en: { group: 'Group Stage', r32: 'Round of 32', r16: 'Round of 16', qf: 'Quarter-final', sf: 'Semi-final', final: 'Final' },
  es: { group: 'Fase de Grupos', r32: 'Ronda de 32', r16: 'Octavos', qf: 'Cuartos', sf: 'Semifinal', final: 'Final' },
};
const STAMP = {
  en: { live: 'LIVE', ft: 'FT', ht: 'HT', vs: 'VS', group: 'Group' },
  es: { live: 'EN VIVO', ft: 'FIN', ht: 'MT', vs: 'VS', group: 'Grupo' },
};

export default function MatchCard({ m, centerOverride = null, tag = null }) {
  const { lang } = useLang();
  const loc = lang === 'es' ? 'es' : 'en';
  const S = STAMP[loc];
  const stages = STAGE_LABEL[loc];

  const home = m.home || 'TBD';
  const away = m.away || 'TBD';
  const live = LIVE.has(m.status);
  const done = DONE.has(m.status);
  const hasScore = m.homeScore != null && m.awayScore != null;
  const paused = m.status === 'PAUSED';
  const progress = live
    ? Math.max(2, Math.min(100, Math.round(((m.minute ?? (paused ? 45 : 0)) / 90) * 100)))
    : 0;

  // Live clock text reused in the stamp + bottom bar.
  const liveText = paused ? S.ht : m.minute != null ? `${m.minute}'${m.injuryTime ? `+${m.injuryTime}` : ''}` : S.live;

  const kickoff = m.utcDate
    ? new Date(m.utcDate).toLocaleString(loc, {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : 'TBD';

  return (
    <div className={`match-card ${live ? 'live' : ''}`}>
      {/* Full-height flag layers — each side's flag fills the whole card and
          fades toward the centre where the two meet (drawn behind everything,
          incl. the footer caption). */}
      {FLAGS[home] && (
        <span className="mc-flag home" style={{ backgroundImage: `url(${flagUrl(home, 320)})` }} aria-hidden="true" />
      )}
      {FLAGS[away] && (
        <span className="mc-flag away" style={{ backgroundImage: `url(${flagUrl(away, 320)})` }} aria-hidden="true" />
      )}

      {(tag || live) && (
        <div className="mc-tag">
          {live && <span className="mc-livestamp">🔴 {liveText}</span>}
          {tag && <span className="mc-tag-text">{tag}</span>}
        </div>
      )}

      <div className="mc-row">
        {/* left (home) half */}
        <div className="mc-side home" />

        {/* center — transparent; score / time / VS over the blended flags */}
        <div className="mc-center">
          {centerOverride != null ? (
            centerOverride
          ) : (
            <>
              {hasScore ? (
                <span className="mc-score">{m.homeScore}<span className="mc-sep">:</span>{m.awayScore}</span>
              ) : (
                <span className="mc-vs">{S.vs}</span>
              )}
              {/* the live minute lives only in the top badge — don't repeat it here */}
              {!live && <span className="mc-meta">{done ? S.ft : kickoff}</span>}
              <span className="mc-stage">
                {stages[m.phase] || (m.group ? `${S.group} ${String(m.group).replace(/^GROUP[_ ]?/i, '')}` : '')}
              </span>
            </>
          )}
        </div>

        {/* right (away) half */}
        <div className="mc-side away" />
      </div>

      {/* discreet country-name caption under the card */}
      <div className="mc-caption">
        <span>{home}</span>
        {m.referee && <span className="mc-ref">🧑‍⚖️ {m.referee}</span>}
        <span>{away}</span>
      </div>

      {/* live time bar pinned to the bottom — visual only (no duplicate minute) */}
      {live && (
        <div className="mc-timebar" aria-hidden="true">
          <span
            className={`mc-timebar-fill${paused ? ' paused' : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Shared CSS for the bits not already in global.css (the live stamp / tag
// ribbon) plus a slightly more legible footer caption — now that the team name
// only appears there (no abbreviation inside the card).
export const MATCH_CARD_EXTRA_CSS = `
.mc-tag{position:relative;z-index:2;display:flex;align-items:center;gap:10px;padding:2px 2px 8px;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em}
.mc-livestamp{color:#fff;background:#e7382c;border-radius:20px;padding:2px 10px;font-weight:800;box-shadow:0 0 12px rgba(231,56,44,.6)}
.mc-tag-text{color:var(--gold,#ffd60a);font-weight:700}
.mc-caption span{font-family:'Archivo Black',sans-serif;font-size:13px;color:rgba(255,255,255,.92);letter-spacing:.02em}
.mc-caption .mc-ref{font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(255,255,255,.55);font-weight:400}
`;

export { MatchCard, LIVE, DONE, STAGE_LABEL };
