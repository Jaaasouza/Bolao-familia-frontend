// "Your predicted group standings" — champions (🥇) and runners-up (🥈) for
// every group, derived from the player's scoreline picks. Collapsible per the
// app-wide accordion standard.
import { useState } from 'react';
import { predictedGroupTables, groupBonus, decidedGroups } from '../lib/groupPredict.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import Flag from './teams/Flag.jsx';
import { TEAM_ABBR } from '../data/teamMeta.js';

const GP_TXT = {
  en: { title: '🔮 Your predicted group winners', group: 'Group', partial: ' · partial' },
  pt: { title: '🔮 Seus classificados previstos', group: 'Grupo', partial: ' · parcial' },
};

// Look up actual decided standings for a group letter, tolerating "A" / "GROUP_A".
function actualFor(standings, letter) {
  if (!standings) return null;
  return standings[letter] || standings[`GROUP_${letter}`] || standings[`GROUP ${letter}`] || null;
}

export default function GroupPredictionCard({ matches = [], picks = {}, standings = {}, defaultOpen = false }) {
  const { lang } = useLang();
  const G = GP_TXT[lang] || GP_TXT.en;
  const [open, setOpen] = useState(defaultOpen);
  const tables = predictedGroupTables(matches, picks);
  if (!tables.length) return null;

  // A group only scores once it has actually FINISHED (guards against seed/
  // placeholder standings before kickoff).
  const decided = decidedGroups(matches);
  const bonusFor = (tg) => {
    if (!decided.has(tg.group)) return null;
    const act = actualFor(standings, tg.group);
    return act ? groupBonus(tg.first, tg.second, act.first, act.second) : null;
  };

  // Total bonus banked so far (only finished groups contribute).
  const earnedBonus = tables.reduce((sum, tg) => sum + (bonusFor(tg) || 0), 0);

  return (
    <div className="gpred">
      <style>{GPRED_CSS}</style>
      <button type="button" className="gpred-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="gpred-title">{G.title}</span>
        <span className="gpred-right">
          {earnedBonus > 0 && <span className="gpred-bonus-total">🎁 +{earnedBonus}</span>}
          <span className="gpred-chev">{open ? '▴' : '▾'}</span>
        </span>
      </button>
      {open && (
        <div className="gpred-grid">
          {tables.map((t) => {
            const b = bonusFor(t);
            return (
            <div key={t.group} className="gpred-cell">
              <div className="gpred-g">
                {G.group} {t.group}{!t.complete && <span className="gpred-partial">{G.partial}</span>}
                {b != null && (
                  <span className={`gpred-badge b${b}`}>{b > 0 ? `✓ +${b}` : '✗ 0'}</span>
                )}
              </div>
              <div className="gpred-slot">
                <span className="gpred-medal">🥇</span>
                {t.first
                  ? <span className="gpred-team"><Flag team={t.first} size={18} /> {TEAM_ABBR[t.first] || t.first}</span>
                  : <span className="gpred-none">—</span>}
              </div>
              <div className="gpred-slot">
                <span className="gpred-medal">🥈</span>
                {t.second
                  ? <span className="gpred-team"><Flag team={t.second} size={18} /> {TEAM_ABBR[t.second] || t.second}</span>
                  : <span className="gpred-none">—</span>}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const GPRED_CSS = `
.gpred{border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.03);margin-bottom:14px;overflow:hidden}
.gpred-head{width:100%;display:flex;align-items:center;justify-content:space-between;background:transparent;border:none;cursor:pointer;color:#fff;padding:14px 16px}
.gpred-title{font-family:'Archivo Black',sans-serif;font-size:14px;letter-spacing:.03em}
.gpred-right{display:flex;align-items:center;gap:10px}
.gpred-bonus-total{font-family:'Anton',sans-serif;font-size:14px;color:#0a1733;background:linear-gradient(135deg,var(--gold,#ffd60a),var(--orange,#fb5607));border-radius:20px;padding:2px 10px}
.gpred-chev{color:var(--gold,#ffd60a)}
.gpred-badge{margin-left:8px;font-family:'JetBrains Mono',monospace;font-size:10px;border-radius:20px;padding:1px 7px;vertical-align:middle}
.gpred-badge.b2{color:#0a1733;background:var(--gold,#ffd60a)}
.gpred-badge.b1{color:#0a1733;background:var(--lime,#8ac926)}
.gpred-badge.b0{color:#ff8f8f;background:rgba(255,107,107,.15);border:1px solid rgba(255,107,107,.4)}
.gpred-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding:0 14px 14px}
.gpred-cell{background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px}
.gpred-g{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold,#ffd60a);margin-bottom:6px}
.gpred-partial{color:rgba(255,255,255,.4)}
.gpred-slot{display:flex;align-items:center;gap:8px;padding:3px 0}
.gpred-medal{font-size:14px}
.gpred-team{display:flex;align-items:center;gap:6px;font-family:'Archivo Black',sans-serif;font-size:12px;color:#fff}
.gpred-none{color:rgba(255,255,255,.35)}
`;

export { GroupPredictionCard };
