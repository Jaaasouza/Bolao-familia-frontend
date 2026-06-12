// Pick deadline countdown for the Dashboard.
//
// A phase's predictions lock the moment its FIRST match kicks off (the backend
// only accepts a phase submission while every match is still open). So the next
// pick deadline is the earliest kickoff of the current open phase. We derive it
// straight from the fixtures — no extra API call — and show a live, draining
// bar plus a d/h/m/s countdown, bilingual.
import { useState, useEffect } from 'react';
import { useLang } from '../i18n/LanguageContext.jsx';
import { normalizeMatches } from './teams/teamStats.js';

const PHASE_ORDER = ['group', 'r32', 'r16', 'qf', 'sf', 'final'];
const STAGE_TO_PHASE = {
  GROUP_STAGE: 'group', LAST_32: 'r32', LAST_16: 'r16',
  QUARTER_FINALS: 'qf', SEMI_FINALS: 'sf', THIRD_PLACE: 'sf', FINAL: 'final',
};
const phaseOf = (m) => m.phase || STAGE_TO_PHASE[m.stage] || 'group';

const PHASE_NAME = {
  en: { group: 'Group Stage', r32: 'Round of 32', r16: 'Round of 16', qf: 'Quarter-finals', sf: 'Semi-finals', final: 'Final' },
  pt: { group: 'Fase de Grupos', r32: 'Fase de 32', r16: 'Oitavas de Final', qf: 'Quartas de Final', sf: 'Semifinais', final: 'Final' },
};
const TXT = {
  en: { closeIn: (p) => `${p} picks close in`, locked: 'Predictions for this phase are locked', soon: 'Closing soon!' },
  pt: { closeIn: (p) => `Os palpites da ${p} fecham em`, locked: 'Os palpites desta fase estão travados', soon: 'Fecha em breve!' },
};

// Earliest still-future kickoff of the first phase that hasn't started → that's
// the next pick deadline. Returns { phase, deadline } or null.
function nextDeadline(matches, now) {
  const byPhase = {};
  for (const m of matches) {
    const t = m.utcDate ? new Date(m.utcDate).getTime() : null;
    if (!t) continue;
    (byPhase[phaseOf(m)] ||= []).push(t);
  }
  for (const p of PHASE_ORDER) {
    const times = byPhase[p];
    if (!times || !times.length) continue;
    const earliest = Math.min(...times);
    if (earliest > now) return { phase: p, deadline: earliest };
  }
  return null;
}

function parts(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

const CB_CSS = `
.cb{margin:6px 0 18px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:13px 16px}
.cb-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
.cb-label{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.65)}
.cb-time{font-family:'Anton',sans-serif;font-size:18px;letter-spacing:.02em;color:#fff;white-space:nowrap}
.cb-time .u{color:rgba(255,255,255,.45);font-size:.62em;margin:0 5px 0 1px}
.cb-track{height:8px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden}
.cb-fill{height:100%;border-radius:6px;transition:width 1s linear;background:linear-gradient(90deg,var(--lime,#8ac926),var(--gold,#ffd60a))}
.cb-fill.warn{background:linear-gradient(90deg,var(--gold,#ffd60a),var(--orange,#fb5607))}
.cb-fill.danger{background:linear-gradient(90deg,var(--orange,#fb5607),#ff3b3b);animation:cb-pulse 1.1s ease-in-out infinite}
@keyframes cb-pulse{50%{opacity:.55}}
.cb-locked{display:flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,.6)}
`;

const WINDOW_MS = 7 * 86400_000; // bar drains over the final week before the deadline

export default function CountdownBar({ matches = [] }) {
  const { lang } = useLang();
  const T = TXT[lang] || TXT.en;
  const pn = PHASE_NAME[lang] || PHASE_NAME.en;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const norm = normalizeMatches(matches);
  const next = nextDeadline(norm, now);
  if (!next) return null; // nothing left to lock

  const remaining = next.deadline - now;
  const p = parts(remaining);
  const pct = Math.max(0, Math.min(100, (remaining / WINDOW_MS) * 100));
  const fillCls = remaining < 3600_000 ? 'danger' : remaining < 24 * 3600_000 ? 'warn' : '';

  // > 1 day → "Dd Hh Mm"; under a day → "Hh Mm Ss".
  const units = p.d > 0
    ? [[p.d, 'd'], [p.h, 'h'], [p.m, 'm']]
    : [[p.h, 'h'], [p.m, 'm'], [p.s, 's']];

  return (
    <div className="cb">
      <style>{CB_CSS}</style>
      <div className="cb-top">
        <span className="cb-label">⏳ {T.closeIn(pn[next.phase] || next.phase)}</span>
        <span className="cb-time">
          {units.map(([v, u]) => <span key={u}>{v}<span className="u">{u}</span></span>)}
        </span>
      </div>
      <div className="cb-track">
        <div className={`cb-fill ${fillCls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export { CountdownBar, nextDeadline };
