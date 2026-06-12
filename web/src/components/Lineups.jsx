// Lineups graphic in the reference style: a TEAM · VS · TEAM banner, the two
// teams' pitches side by side (stacked on a phone), each with its formation,
// substitutions and manager. Each side is colour-signalled.
import TeamPitch from './TeamPitch.jsx';
import Flag from './teams/Flag.jsx';
import { TEAM_ABBR } from '../data/teamMeta.js';
import { useLang } from '../i18n/LanguageContext.jsx';

const T = {
  en: { subs: 'Substitutions', manager: 'Manager', soon: 'Lineups appear ~1h before kickoff' },
  es: { subs: 'Suplentes', manager: 'DT', soon: 'Las alineaciones salen ~1h antes' },
};

function Side({ team, lineup, color, t, align }) {
  return (
    <div className={`ln-team ${align}`}>
      <TeamPitch team={team} lineup={lineup} color={color} />
      {lineup && lineup.subs && lineup.subs.length > 0 && (
        <div className="ln-block">
          <div className="ln-block-h">{t.subs}</div>
          {lineup.subs.map((p, i) => (
            <div key={i} className="ln-sub"><b>{p.num || ''}</b> {p.name}</div>
          ))}
        </div>
      )}
      {lineup && lineup.coach && (
        <div className="ln-mgr">{t.manager}: <b>{lineup.coach}</b></div>
      )}
    </div>
  );
}

export default function Lineups({ home, away, homeLineup, awayLineup, homeColor = '#3a86ff', awayColor = '#ffd60a' }) {
  const { lang } = useLang();
  const t = T[lang] || T.en;
  const ready = homeLineup && awayLineup;

  return (
    <div className="ln">
      <style>{LN_CSS}</style>

      {/* TEAM · VS · TEAM banner */}
      <div className="ln-banner">
        <span className="ln-bteam" style={{ borderColor: homeColor }}>
          <Flag team={home} size={22} /> <span>{TEAM_ABBR[home] || home}</span>
        </span>
        <span className="ln-vs">VS</span>
        <span className="ln-bteam right" style={{ borderColor: awayColor }}>
          <span>{TEAM_ABBR[away] || away}</span> <Flag team={away} size={22} />
        </span>
      </div>

      {ready ? (
        <div className="ln-grid">
          <Side team={home} lineup={homeLineup} color={homeColor} t={t} align="left" />
          <Side team={away} lineup={awayLineup} color={awayColor} t={t} align="right" />
        </div>
      ) : (
        <div className="ln-soon">⚽ {t.soon}</div>
      )}
    </div>
  );
}

const LN_CSS = `
.ln{margin-top:6px}
.ln-banner{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:14px}
.ln-bteam{display:flex;align-items:center;gap:8px;background:linear-gradient(180deg,rgba(255,255,255,.1),rgba(255,255,255,.03));
  border:1px solid;border-radius:30px;padding:6px 14px;font-family:'Archivo Black',sans-serif;font-size:15px;color:#fff}
.ln-vs{font-family:'Anton',sans-serif;font-size:20px;color:rgba(255,255,255,.7)}
/* two pitches stay side by side even on a phone (keeps the view short) */
.ln-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ln-block{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:9px 11px;margin-top:10px}
.ln-block-h{font-family:'Anton',sans-serif;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--gold,#ffd60a);margin-bottom:6px}
.ln-sub{font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,.82);line-height:1.7}
.ln-sub b{display:inline-block;min-width:20px;color:#fff}
.ln-mgr{font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,.7);margin-top:8px}
.ln-mgr b{color:#fff}
.ln-soon{text-align:center;color:rgba(255,255,255,.6);font-family:'JetBrains Mono',monospace;font-size:13px;padding:26px 10px}
`;

export { Lineups };
