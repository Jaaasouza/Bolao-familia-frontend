import { useState, useMemo, useEffect } from 'react';
import { normalizeMatches } from '../components/teams/teamStats.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import MatchScoreSelector from '../components/MatchScoreSelector.jsx';
import MatchCard, { MATCH_CARD_EXTRA_CSS } from '../components/MatchCard.jsx';
import GroupPredictionCard from '../components/GroupPredictionCard.jsx';

// Phase display names per language (PHASE_LONG in teamStats is English-only).
const PHASE_NAME = {
  en: { group: 'Group Stage', r32: 'Round of 32', r16: 'Round of 16', qf: 'Quarter-finals', sf: 'Semi-finals', final: 'Final' },
  pt: { group: 'Fase de Grupos', r32: 'Fase de 32', r16: 'Oitavas de Final', qf: 'Quartas de Final', sf: 'Semifinais', final: 'Final' },
};

// All Predict copy, EN/PT (functions for the interpolated strings).
const TXT = {
  en: {
    title: 'Predict Scores',
    hint: 'Predict the exact score of every match in this phase, then lock them in one shot. Each round opens for predictions as the previous one finishes.',
    legExact: 'pts exact score', legResult: 'pt right result (winner / draw)', legZero: 'otherwise',
    legBoxes: 'middle box = draw (X-X) · sides = a winner',
    group: 'Group',
    waiting: (n) => `Waiting for ${n} match${n > 1 ? 'es' : ''} — the teams are decided once the previous round finishes. You can predict here as soon as they appear.`,
    progress: (d, t) => `${d}/${t} matches predicted`,
    saving: 'Saving…', waitTeams: 'Waiting for the teams…',
    lockBtn: (p) => `🔒 Lock in my ${p} picks (final)`,
    fillAll: (t) => `Fill all ${t} matches to finish`,
    lockedMsg: (p) => `🔒 Your ${p} picks are locked in — they can’t be changed.`,
    startedMsg: '⏱ This phase has already started — predictions are closed.',
    confirm: (p) => `Lock in your ${p} picks? This is final — they cannot be changed.`,
    okLocked: '🔒 Locked in! Good luck.', okSubmit: '✓ Submitted!', failSubmit: 'Submit failed',
  },
  pt: {
    title: 'Palpite os Placares',
    hint: 'Palpite o placar exato de cada jogo desta fase e trave todos de uma vez. Cada fase abre para palpites assim que a anterior termina.',
    legExact: 'pts placar exato', legResult: 'pt resultado certo (vencedor / empate)', legZero: 'caso contrário',
    legBoxes: 'caixa central = empate (X-X) · laterais = um vencedor',
    group: 'Grupo',
    waiting: (n) => `Aguardando ${n} jogo${n > 1 ? 's' : ''} — os times são definidos quando a fase anterior termina. Você poderá palpitar aqui assim que aparecerem.`,
    progress: (d, t) => `${d}/${t} jogos palpitados`,
    saving: 'Salvando…', waitTeams: 'Aguardando os times…',
    lockBtn: (p) => `🔒 Travar meus palpites da ${p} (final)`,
    fillAll: (t) => `Preencha os ${t} jogos para concluir`,
    lockedMsg: (p) => `🔒 Seus palpites da ${p} estão travados — não podem ser alterados.`,
    startedMsg: '⏱ Esta fase já começou — os palpites estão encerrados.',
    confirm: (p) => `Travar seus palpites da ${p}? É definitivo — não podem ser alterados.`,
    okLocked: '🔒 Travado! Boa sorte.', okSubmit: '✓ Enviado!', failSubmit: 'Falha ao enviar',
  },
};

const LIVE = new Set(['IN_PLAY', 'PAUSED', 'LIVE']);
const DONE = new Set(['FINISHED']);

// Tournament order. Predict walks these in sequence: the group stage first, then
// each knockout round as it opens. (THIRD_PLACE folds into 'sf' to match the
// backend's phaseOf().)
export const PHASE_ORDER = ['group', 'r32', 'r16', 'qf', 'sf', 'final'];

// Only matches that haven't kicked off can be predicted.
export function isMatchOpen(m) {
  const st = m.status;
  if (LIVE.has(st) || DONE.has(st)) return false;
  if (m.utcDate && new Date(m.utcDate).getTime() <= Date.now()) return false;
  return true;
}

// A knockout slot is "ready" to predict once both teams are known (the previous
// round decided them). Group matches always have teams.
export function matchReady(m) {
  return !!(m && m.home && m.away);
}

// "GROUP_A" → "A"; null for knockout matches.
function groupKey(m) {
  if (!m.group) return null;
  return String(m.group).replace(/^GROUP[_ ]?/i, '').trim() || null;
}

// Phase rollup used to drive the stepper + submit gating.
//  - fullyOpen: every match still open (none kicked off) → the one-shot window
//    is still submittable (mirrors the backend rule);
//  - allReady: every match has its teams (no TBD slots left);
//  - started: at least one match kicked off → the window has closed.
export function phaseInfo(ms = [], locked = false) {
  const count = ms.length;
  const open = ms.filter(isMatchOpen).length;
  const ready = ms.filter(matchReady).length;
  return {
    count,
    locked: !!locked,
    fullyOpen: count > 0 && open === count,
    anyOpen: open > 0,
    allReady: count > 0 && ready === count,
    started: count > 0 && open < count,
  };
}

// The phase Predict should focus on: the first phase still submittable (not
// locked, window fully open). Falls back to the first unlocked phase, then the
// last present phase, so there's always something to show.
export function selectActivePhase(present, infoByPhase) {
  return (
    present.find((p) => infoByPhase[p] && !infoByPhase[p].locked && infoByPhase[p].fullyOpen)
    || present.find((p) => infoByPhase[p] && !infoByPhase[p].locked)
    || present[present.length - 1]
    || null
  );
}

// Pure: only the picks that changed vs the persisted set.
export function changedPicks(edits = {}, myPicks = {}) {
  const out = [];
  for (const [key, v] of Object.entries(edits)) {
    if (!v || v.home === '' || v.home == null || v.away === '' || v.away == null) continue;
    const h = Number(v.home);
    const a = Number(v.away);
    if (!Number.isFinite(h) || !Number.isFinite(a)) continue;
    const prev = myPicks[key];
    if (prev && Number(prev.home) === h && Number(prev.away) === a) continue;
    // numeric keys → number (backend contract); non-numeric kept as-is
    const numeric = Number(key);
    const matchId = Number.isFinite(numeric) && String(numeric) === String(key) ? numeric : key;
    out.push({ matchId, home: h, away: a });
  }
  return out;
}

const PV_CSS = `
.pv-legend{display:flex;gap:14px;flex-wrap:wrap;font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,.6);margin-bottom:14px}
.pv-legend b{color:var(--gold,#ffd60a)}
.pv-steps{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}
.pv-step{display:inline-flex;align-items:center;gap:6px;padding:7px 11px;border-radius:30px;cursor:pointer;
  font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.04em;
  border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.04);color:rgba(255,255,255,.7)}
.pv-step.sel{border-color:var(--gold,#ffd60a);color:#fff;background:rgba(255,214,10,.12)}
.pv-step.locked{color:var(--lime,#8ac926)}
.pv-wait{border:1px dashed rgba(255,255,255,.25);border-radius:14px;padding:16px;text-align:center;
  font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,.7);margin:10px 0}
.pv-wait .big{font-size:26px;display:block;margin-bottom:6px}
.pv-group{margin-bottom:12px;border:1px solid rgba(255,255,255,.1);border-radius:16px;overflow:hidden;background:rgba(255,255,255,.03)}
.pv-group-head{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;background:transparent;border:none;cursor:pointer;color:#fff;padding:14px 16px;text-align:left}
.pv-group-head .gl{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,var(--gold,#ffd60a),var(--orange,#fb5607));color:#0a1733;font-family:'Anton',sans-serif;font-size:16px}
.pv-group-title{font-family:'Archivo Black',sans-serif;font-size:15px;letter-spacing:.04em}
.pv-group-meta{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,.6);display:flex;align-items:center;gap:8px}
.pv-group-meta .ok{color:var(--lime,#8ac926)}
.pv-chev{color:var(--gold,#ffd60a);transition:transform .25s}
.pv-group.open .pv-chev{transform:rotate(180deg)}
.pv-list{padding:0 12px 12px;display:flex;flex-direction:column;gap:10px}
.pv-ko-list{display:flex;flex-direction:column;gap:10px;margin-top:6px}

/* 3-box selector */
.mss{display:flex;align-items:center;justify-content:center;gap:6px;position:relative}
.mss-box{width:40px;height:44px;text-align:center;font-family:'Anton',sans-serif;font-size:22px;color:#fff;
  background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.25);border-radius:10px}
.mss-box:focus{outline:none;border-color:var(--gold,#ffd60a);background:rgba(255,214,10,.12)}
.mss-box.draw{border-style:dashed}
.mss-box:disabled{opacity:.3}
.mss-clear{position:absolute;top:-14px;right:-6px;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.3);
  color:#fff;border-radius:50%;width:22px;height:22px;font-size:12px;cursor:pointer;line-height:1}

.pv-finish{position:sticky;bottom:8px;margin-top:14px}
.pv-finish .primary[disabled]{opacity:.5;cursor:not-allowed}
.pv-progress{text-align:center;font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,.7);margin-bottom:8px}
`;

function MatchRow({ m, value, onChange, phaseLocked }) {
  const ready = matchReady(m);
  let center;
  if (phaseLocked || !isMatchOpen(m)) center = <span className="mc-meta">🔒</span>;
  else if (!ready) center = <span className="mc-meta">⏳</span>;
  else center = <MatchScoreSelector value={value} onChange={onChange} />;
  return <MatchCard m={m} centerOverride={center} />;
}

export default function PredictView({ matches = [], myPicks = {}, lockedPhases = [], onSubmit, standings = {} }) {
  const { lang } = useLang();
  const T = TXT[lang] || TXT.en;
  const pn = PHASE_NAME[lang] || PHASE_NAME.en;
  const [edits, setEdits] = useState({});
  const [openGroup, setOpenGroup] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);

  // Bucket every fixture by phase (group / r32 / … / final), date-sorted.
  const byPhase = useMemo(() => {
    const map = {};
    for (const m of normalizeMatches(matches)) {
      (map[m.phase] = map[m.phase] || []).push(m);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => new Date(a.utcDate || 0) - new Date(b.utcDate || 0));
    }
    return map;
  }, [matches]);

  const presentPhases = useMemo(
    () => PHASE_ORDER.filter((p) => (byPhase[p] || []).length > 0),
    [byPhase],
  );

  const infoByPhase = useMemo(() => {
    const out = {};
    for (const p of presentPhases) out[p] = phaseInfo(byPhase[p], lockedPhases.includes(p));
    return out;
  }, [presentPhases, byPhase, lockedPhases]);

  const activePhase = useMemo(
    () => selectActivePhase(presentPhases, infoByPhase),
    [presentPhases, infoByPhase],
  );

  // Which phase the user is looking at. Follows the active phase as the
  // tournament advances, unless the user clicked another (e.g. a locked) phase.
  const [viewPhase, setViewPhase] = useState(activePhase);
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    if (!pinned) setViewPhase(activePhase);
  }, [activePhase, pinned]);

  const phase = viewPhase || activePhase;
  const info = (phase && infoByPhase[phase]) || phaseInfo([], false);
  const phaseMatches = (phase && byPhase[phase]) || [];
  const phaseLocked = info.locked;
  const isGroup = phase === 'group';

  // Current resolved value for a match: live edit first, else persisted pick.
  const valueFor = (id) => (id in edits ? edits[id] : (myPicks[id] || null));
  const onChange = (id, score) => setEdits((e) => ({ ...e, [id]: score }));

  // Completeness across the open + ready matches of the viewed phase.
  const fillable = useMemo(
    () => phaseMatches.filter((m) => isMatchOpen(m) && matchReady(m)),
    [phaseMatches],
  );
  const filledCount = fillable.filter((m) => valueFor(m.id)).length;
  const total = fillable.length;
  const allFilled = total > 0 && filledCount === total;

  // Submittable only while the whole phase is open (none started), every team is
  // known, and all are filled — matching the backend's one-shot rule.
  const canSubmit = !phaseLocked && info.fullyOpen && info.allReady && allFilled;

  const finish = async () => {
    setFeedback(null);
    // eslint-disable-next-line no-alert
    if (!window.confirm(T.confirm(pn[phase] || phase))) return;
    const picks = phaseMatches
      .map((m) => { const v = valueFor(m.id); return v ? { matchId: Number(m.id), home: Number(v.home), away: Number(v.away) } : null; })
      .filter(Boolean);
    setSaving(true);
    try {
      const res = onSubmit ? await onSubmit(phase, picks) : null;
      if (res && res.locked) setFeedback({ type: 'ok', msg: T.okLocked });
      else setFeedback({ type: 'ok', msg: T.okSubmit });
    } catch (e) {
      setFeedback({ type: 'err', msg: (e && e.message) || T.failSubmit });
    } finally {
      setSaving(false);
    }
  };

  // Live preview of the group winners implied by the current picks.
  const previewPicks = useMemo(() => {
    const out = { ...myPicks };
    for (const [k, v] of Object.entries(edits)) if (v) out[k] = v;
    return out;
  }, [edits, myPicks]);

  // Group-stage rendering: accordion by group letter.
  const groups = useMemo(() => {
    if (!isGroup) return [];
    const map = new Map();
    for (const m of phaseMatches) {
      const g = groupKey(m) || '?';
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(m);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [isGroup, phaseMatches]);

  const selectPhase = (p) => { setViewPhase(p); setPinned(p !== activePhase); };

  const notReadyCount = phaseMatches.filter((m) => isMatchOpen(m) && !matchReady(m)).length;

  return (
    <div className="card">
      <style>{PV_CSS}{MATCH_CARD_EXTRA_CSS}</style>
      <h2>{T.title} — {pn[phase] || pn.group}</h2>
      <p className="hint">{T.hint}</p>
      <div className="pv-legend">
        <span><b>3</b> {T.legExact}</span>
        <span><b>1</b> {T.legResult}</span>
        <span><b>0</b> {T.legZero}</span>
        <span>{T.legBoxes}</span>
      </div>

      {/* Phase stepper — tap to view any phase (locked ones are read-only). */}
      {presentPhases.length > 1 && (
        <div className="pv-steps">
          {presentPhases.map((p) => {
            const i = infoByPhase[p];
            const cls = ['pv-step'];
            if (p === phase) cls.push('sel');
            if (i.locked) cls.push('locked');
            const mark = i.locked ? '✓' : p === activePhase ? '●' : (i.allReady ? '' : '⏳');
            return (
              <button key={p} type="button" className={cls.join(' ')} onClick={() => selectPhase(p)}>
                {mark && <span>{mark}</span>}
                {pn[p] || p}
              </button>
            );
          })}
        </div>
      )}

      {isGroup && <GroupPredictionCard matches={matches} picks={previewPicks} standings={standings} />}

      {/* Waiting banner when this round's teams aren't decided yet. */}
      {!phaseLocked && notReadyCount > 0 && (
        <div className="pv-wait">
          <span className="big">⏳</span>
          {T.waiting(notReadyCount)}
        </div>
      )}

      {isGroup ? (
        groups.map(([g, ms]) => {
          const open = openGroup === g;
          const openMs = ms.filter(isMatchOpen);
          const done = openMs.filter((m) => valueFor(m.id)).length;
          const complete = openMs.length > 0 && done === openMs.length;
          return (
            <div key={g} className={`pv-group ${open ? 'open' : ''}`}>
              <button type="button" className="pv-group-head" onClick={() => setOpenGroup(open ? null : g)}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="gl">{g}</span>
                  <span className="pv-group-title">{T.group} {g}</span>
                </span>
                <span className="pv-group-meta">
                  <span className={complete ? 'ok' : ''}>{complete ? '✓ ' : ''}{done}/{ms.length}</span>
                  <span className="pv-chev">▾</span>
                </span>
              </button>
              {open && (
                <div className="pv-list">
                  {ms.map((m) => (
                    <MatchRow key={m.id} m={m} value={valueFor(m.id)} phaseLocked={phaseLocked} onChange={(s) => onChange(m.id, s)} />
                  ))}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="pv-ko-list">
          {phaseMatches.map((m) => (
            <MatchRow key={m.id} m={m} value={valueFor(m.id)} phaseLocked={phaseLocked} onChange={(s) => onChange(m.id, s)} />
          ))}
        </div>
      )}

      <div className="pv-finish">
        {phaseLocked ? (
          <div className="api-status connected" style={{ textAlign: 'center' }}>
            {T.lockedMsg(pn[phase] || phase)}
          </div>
        ) : info.started ? (
          <div className="api-status error" style={{ textAlign: 'center' }}>
            {T.startedMsg}
          </div>
        ) : (
          <>
            <div className="pv-progress">{T.progress(filledCount, total)}</div>
            {feedback && (
              <div className={`api-status ${feedback.type === 'ok' ? 'connected' : 'error'}`} style={{ marginBottom: 8 }}>
                {feedback.msg}
              </div>
            )}
            <button className="primary" disabled={!canSubmit || saving} onClick={finish}>
              {saving ? T.saving
                : !info.allReady ? T.waitTeams
                  : allFilled ? T.lockBtn(pn[phase] || phase)
                    : T.fillAll(total)}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export { PredictView };
