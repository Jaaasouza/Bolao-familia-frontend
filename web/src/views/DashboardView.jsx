// Personal dashboard. Layout:
//   1) full-width LIVE/next match card (the canonical MatchCard) on top
//   2) two cards side by side: Rank (left) + Points history (right)
//   3) your predicted group winners (🔮)
//   4) a reminder of your picks — collapsible per group (group phase shows all
//      groups; later phases show only the current phase), rendered as match cards.
import { useState, useEffect } from 'react';
import { API } from '../lib/api.js';
import { normalizeMatches } from '../components/teams/teamStats.js';
import Flag from '../components/teams/Flag.jsx';
import { TEAM_ABBR } from '../data/teamMeta.js';
import { getPlayerInfo } from '../auth/usePhoneAuth.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import MatchCard, { MATCH_CARD_EXTRA_CSS } from '../components/MatchCard.jsx';
import GroupPredictionCard from '../components/GroupPredictionCard.jsx';
import CountdownBar from '../components/CountdownBar.jsx';

// Phase names + all Dashboard copy, EN/ES.
const PHASE_NAME = {
  en: { group: 'Group Stage', r32: 'Round of 32', r16: 'Round of 16', qf: 'Quarter-finals', sf: 'Semi-finals', final: 'Final' },
  es: { group: 'Fase de Grupos', r32: 'Ronda de 32', r16: 'Octavos de Final', qf: 'Cuartos de Final', sf: 'Semifinales', final: 'Final' },
};
const DTXT = {
  en: {
    title: 'My Dashboard', earned: (n) => `${n} pts earned so far`, noMatches: 'No matches yet.',
    latest: 'LATEST RESULT', yourPick: 'Your pick:', noPick: 'No pick for this match', pts: 'pts',
    rank: '🏆 Rank', fullRanking: '🏆 Full ranking', seeAll: (n) => `See all ${n} ›`, noScores: 'No scores yet.',
    you: '(you)', histTitle: '📈 My points history', histModal: '📈 Points history',
    noPoints: 'No points yet — finished matches you picked will show here.', pick: 'pick',
    myPicks: '📝 My picks', noPicksYet: "You haven't made picks yet.", group: 'Group',
  },
  es: {
    title: 'Mi Panel', earned: (n) => `${n} pts ganados hasta ahora`, noMatches: 'Aún no hay partidos.',
    latest: 'ÚLTIMO RESULTADO', yourPick: 'Tu pronóstico:', noPick: 'Sin pronóstico para este partido', pts: 'pts',
    rank: '🏆 Clasificación', fullRanking: '🏆 Clasificación completa', seeAll: (n) => `Ver los ${n} ›`, noScores: 'Aún no hay puntos.',
    you: '(tú)', histTitle: '📈 Mi historial de puntos', histModal: '📈 Historial de puntos',
    noPoints: 'Aún no hay puntos — los partidos terminados que pronosticaste aparecerán aquí.', pick: 'pron.',
    myPicks: '📝 Mis pronósticos', noPicksYet: 'Aún no has hecho pronósticos.', group: 'Grupo',
  },
};
const useDash = () => { const { lang } = useLang(); return { T: DTXT[lang] || DTXT.en, pn: PHASE_NAME[lang] || PHASE_NAME.en }; };

const LIVE = new Set(['IN_PLAY', 'PAUSED', 'LIVE']);
const DONE = new Set(['FINISHED']);

// exact 3 / result 1 / else 0 (mirrors backend scorePicks).
function pointsFor(pred, m) {
  if (!pred || m.homeScore == null || m.awayScore == null) return null;
  const o = (h, a) => (h > a ? 'H' : h < a ? 'A' : 'D');
  if (Number(pred.home) === m.homeScore && Number(pred.away) === m.awayScore) return 3;
  if (o(pred.home, pred.away) === o(m.homeScore, m.awayScore)) return 1;
  return 0;
}

// stage → phase bucket (mirrors backend phaseOf).
const PHASE_OF = {
  GROUP_STAGE: 'group',
  LAST_32: 'r32', LAST_16: 'r16',
  QUARTER_FINALS: 'qf',
  SEMI_FINALS: 'sf', THIRD_PLACE: 'sf',
  FINAL: 'final',
};
const PHASE_ORDER = ['group', 'r32', 'r16', 'qf', 'sf', 'final'];
const phaseOf = (m) => PHASE_OF[m.stage] || (m.phase ? m.phase : 'group');

function currentPhase(matches) {
  const present = new Set(matches.map(phaseOf));
  for (const p of PHASE_ORDER) {
    if (!present.has(p)) continue;
    const some = matches.some((m) => phaseOf(m) === p && !DONE.has(m.status));
    if (some) return p;
  }
  for (let i = PHASE_ORDER.length - 1; i >= 0; i--) {
    if (present.has(PHASE_ORDER[i])) return PHASE_ORDER[i];
  }
  return 'group';
}

function groupLabel(m, groupWord = 'Group') {
  const g = m.group;
  if (!g) return groupWord;
  const letter = String(g).replace(/^GROUP[_ ]?/i, '').replace(/_/g, ' ').trim();
  return `${groupWord} ${letter.toUpperCase()}`;
}

// ── Top: full-width feature match (canonical card) ───────────────────────────
function FeatureMatch({ m, pred }) {
  const { T } = useDash();
  const live = LIVE.has(m.status);
  const done = DONE.has(m.status);
  // Just a short context label — the kickoff date/time lives in the card center,
  // so we don't repeat it up here.
  const tag = live ? null : done ? T.latest : null;
  const pts = done ? pointsFor(pred, m) : null;
  return (
    <div className="dash-feature">
      <MatchCard m={m} tag={tag} />
      <div className="dash-feature-foot">
        {pred ? <span>{T.yourPick} <b>{pred.home}–{pred.away}</b></span>
          : <span className="dash-muted">{T.noPick}</span>}
        {pts != null && <span className={`dash-pts p${pts}`}>{pts > 0 ? `+${pts}` : '0'} {T.pts}</span>}
      </div>
    </div>
  );
}

// One ranking row.
function RankRow({ r, pos, meId }) {
  const { T } = useDash();
  return (
    <li className={`dash-rank-row${r.id === meId ? ' me' : ''}`}>
      <span className="dash-rank-pos">{pos}</span>
      <span className="dash-rank-name">{r.name}{r.id === meId ? ` ${T.you}` : ''}</span>
      <span className="dash-rank-pts">{r.total ?? 0}</span>
    </li>
  );
}

// Full-ranking modal (opened by tapping the Rank card).
function RankModal({ rows, meId, onClose }) {
  const { T } = useDash();
  return (
    <div className="dash-modal-bg" onClick={onClose}>
      <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dash-modal-head">
          <h3 className="dash-h" style={{ margin: 0 }}>{T.fullRanking}</h3>
          <button className="dash-modal-x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <ol className="dash-rank dash-rank-scroll">
          {rows.map((r, i) => <RankRow key={r.id ?? i} r={r} pos={i + 1} meId={meId} />)}
        </ol>
      </div>
    </div>
  );
}

// ── Left card: Rank — top 10, plus your own row if you're outside it. ─────────
// Tap the card to open the full ranking.
function RankCard({ rows, meId }) {
  const { T } = useDash();
  const [open, setOpen] = useState(false);
  const top = rows.slice(0, 10);
  const myIndex = meId ? rows.findIndex((r) => r.id === meId) : -1;
  const showMine = myIndex >= 10; // outside the top 10

  return (
    <>
      <button type="button" className="dash-panel dash-rank-card" onClick={() => rows.length && setOpen(true)}>
        <div className="dash-rank-head">
          <h3 className="dash-h" style={{ margin: 0 }}>{T.rank}</h3>
          {rows.length > 0 && <span className="dash-rank-all">{T.seeAll(rows.length)}</span>}
        </div>
        {rows.length === 0
          ? <p className="dash-empty">{T.noScores}</p>
          : (
            <ol className="dash-rank">
              {top.map((r, i) => <RankRow key={r.id ?? i} r={r} pos={i + 1} meId={meId} />)}
              {showMine && (
                <>
                  <li className="dash-rank-gap" aria-hidden="true">⋯</li>
                  <RankRow r={rows[myIndex]} pos={myIndex + 1} meId={meId} />
                </>
              )}
            </ol>
          )}
      </button>
      {open && <RankModal rows={rows} meId={meId} onClose={() => setOpen(false)} />}
    </>
  );
}

function HistRow({ m, pred, pts }) {
  const { T } = useDash();
  return (
    <li className="dash-hist-row">
      <span className="dash-hist-teams">
        <Flag team={m.home} size={18} /> {TEAM_ABBR[m.home] || m.home}
        <b className="dash-hist-score">{m.homeScore}–{m.awayScore}</b>
        {TEAM_ABBR[m.away] || m.away} <Flag team={m.away} size={18} />
      </span>
      <span className="dash-hist-pick">{T.pick} {pred.home}–{pred.away}</span>
      <span className={`dash-pts p${pts}`}>+{pts}</span>
    </li>
  );
}

// ── Right card: Points history (only matches that scored me points) ──────────
// Compact preview (first 6) + tap to open the full list — same premise as Rank.
function HistoryCard({ items }) {
  const { T } = useDash();
  const [open, setOpen] = useState(false);
  const preview = items.slice(0, 6);
  return (
    <>
      <button type="button" className="dash-panel dash-rank-card" onClick={() => items.length && setOpen(true)}>
        <div className="dash-rank-head">
          <h3 className="dash-h" style={{ margin: 0 }}>{T.histTitle}</h3>
          {items.length > 6 && <span className="dash-rank-all">{T.seeAll(items.length)}</span>}
        </div>
        {items.length === 0
          ? <p className="dash-empty">{T.noPoints}</p>
          : <ul className="dash-hist">{preview.map((x) => <HistRow key={x.m.id} {...x} />)}</ul>}
      </button>
      {open && (
        <div className="dash-modal-bg" onClick={() => setOpen(false)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-head">
              <h3 className="dash-h" style={{ margin: 0 }}>{T.histModal}</h3>
              <button className="dash-modal-x" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>
            <ul className="dash-hist dash-rank-scroll">{items.map((x) => <HistRow key={x.m.id} {...x} />)}</ul>
          </div>
        </div>
      )}
    </>
  );
}

// One collapsible section of picks (a group, or a knockout phase).
function PickSection({ title, items, picks }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`dash-acc ${open ? 'open' : ''}`}>
      <button type="button" className="dash-acc-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="dash-acc-title">{title}</span>
        <span className="dash-acc-meta">{items.length} <span className="dash-acc-chev">▾</span></span>
      </button>
      {open && (
        <div className="dash-acc-list">
          {items.map((m) => {
            const p = picks[m.id];
            const center = <span className="mc-score">{p.home}<span className="mc-sep">–</span>{p.away}</span>;
            return <MatchCard key={m.id} m={m} centerOverride={center} />;
          })}
        </div>
      )}
    </div>
  );
}

function MyPicks({ matches, myPicks, phase }) {
  const { T, pn } = useDash();
  const inPhase = matches.filter((m) => phaseOf(m) === phase && myPicks[m.id]);
  const isGroup = phase === 'group';
  const phaseLabel = pn[phase] || phase;

  let sections;
  if (isGroup) {
    const byGroup = {};
    for (const m of inPhase) (byGroup[groupLabel(m, T.group)] ||= []).push(m);
    sections = Object.keys(byGroup).sort().map((g) => ({ title: g, items: byGroup[g] }));
  } else {
    sections = inPhase.length ? [{ title: phaseLabel, items: inPhase }] : [];
  }

  return (
    <div className="dash-panel dash-mypicks">
      <h3 className="dash-h">{T.myPicks} · {phaseLabel}</h3>
      {sections.length === 0
        ? <p className="dash-empty">{T.noPicksYet}</p>
        : sections.map((s) => <PickSection key={s.title} title={s.title} items={s.items} picks={myPicks} />)}
    </div>
  );
}

export default function DashboardView({ matches = [], myPicks = {}, standings = {} }) {
  const { T } = useDash();
  const [rows, setRows] = useState([]);
  const me = getPlayerInfo();

  useEffect(() => {
    let alive = true;
    API.scoreLeaderboard()
      .then((d) => { if (alive) setRows(d.leaderboard || []); })
      .catch(() => {});
    return () => { alive = false; };
  }, [matches]);

  const norm = normalizeMatches(matches);
  const predOf = (id) => myPicks[id] || null;

  const live = norm.filter((m) => LIVE.has(m.status))
    .sort((a, b) => new Date(a.utcDate || 0) - new Date(b.utcDate || 0));
  const upcoming = norm.filter((m) => !LIVE.has(m.status) && !DONE.has(m.status))
    .sort((a, b) => new Date(a.utcDate || 0) - new Date(b.utcDate || 0));
  const finished = norm.filter((m) => DONE.has(m.status))
    .sort((a, b) => new Date(b.utcDate || 0) - new Date(a.utcDate || 0));
  const feature = live[0] || upcoming[0] || finished[0] || null;

  const history = finished
    .map((m) => ({ m, pred: predOf(m.id), pts: pointsFor(predOf(m.id), m) }))
    .filter((x) => x.pred && x.pts != null && x.pts > 0);

  const earned = finished.reduce((s, m) => s + (pointsFor(predOf(m.id), m) || 0), 0);
  // The leaderboard total is authoritative (it includes the group-qualifier
  // bonus); fall back to the match-points sum until it loads.
  const myTotal = me ? rows.find((r) => r.id === me.id)?.total : null;
  const shownTotal = myTotal != null ? myTotal : earned;
  const phase = currentPhase(norm);

  return (
    <div className="card dash-card">
      <style>{DASH_CSS}{MATCH_CARD_EXTRA_CSS}</style>
      <h2>{T.title}</h2>
      <p className="hint">{me?.name ? `${me.name} · ` : ''}{T.earned(shownTotal)}</p>

      <CountdownBar matches={norm} />

      {feature
        ? <FeatureMatch m={feature} pred={predOf(feature.id)} />
        : <p className="dash-empty">{T.noMatches}</p>}

      <div className="dash-grid2">
        <RankCard rows={rows} meId={me?.id} />
        <HistoryCard items={history} />
      </div>

      <GroupPredictionCard matches={norm} picks={myPicks} standings={standings} />

      <MyPicks matches={norm} myPicks={myPicks} phase={phase} />
    </div>
  );
}

const DASH_CSS = `
.dash-card{max-width:none}
.dash-h{font-family:'Anton',sans-serif;font-size:18px;letter-spacing:.03em;color:#fff;margin:0 0 10px}
.dash-empty{color:rgba(255,255,255,.5);font-size:13px}
.dash-muted{color:rgba(255,255,255,.45)}

/* full-width feature match */
.dash-feature{width:100%;margin:6px 0 18px}
.dash-feature-foot{display:flex;align-items:center;gap:12px;margin-top:8px;padding:10px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px;font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,.8)}
.dash-feature-foot b{color:#fff}

/* two-column row */
.dash-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px}
@media (max-width:720px){.dash-grid2{grid-template-columns:1fr}}
.dash-panel{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:14px 16px}

/* rank */
.dash-rank-card{display:block;width:100%;text-align:left;cursor:pointer;color:inherit;font:inherit}
.dash-rank-card:hover{border-color:rgba(255,214,10,.35)}
.dash-rank-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.dash-rank-all{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--gold,#ffd60a)}
.dash-rank{list-style:none;margin:0;padding:0}
.dash-rank-row{display:flex;align-items:center;gap:10px;padding:7px 8px;border-radius:9px}
.dash-rank-row.me{background:rgba(255,214,10,.12);border:1px solid rgba(255,214,10,.35)}
.dash-rank-pos{font-family:'Anton',sans-serif;width:26px;color:var(--gold,#ffd60a)}
.dash-rank-name{flex:1;font-family:'Archivo Black',sans-serif;font-size:13px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dash-rank-pts{font-family:'Anton',sans-serif;font-size:18px;color:#fff}
.dash-rank-gap{text-align:center;color:rgba(255,255,255,.4);letter-spacing:.3em;padding:2px 0}

/* full-ranking modal */
.dash-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:3000;padding:20px}
.dash-modal{background:linear-gradient(180deg,#0d1b3a,#0a1733);border:1px solid rgba(255,255,255,.15);border-radius:16px;padding:18px;width:100%;max-width:440px;max-height:80vh;display:flex;flex-direction:column}
.dash-modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.dash-modal-x{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:13px;line-height:1}
.dash-rank-scroll{overflow-y:auto}

/* points history */
.dash-hist{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.dash-hist-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.dash-hist-teams{display:flex;align-items:center;gap:6px;font-family:'Archivo Black',sans-serif;font-size:12px;color:#fff}
.dash-hist-score{color:var(--gold,#ffd60a);margin:0 2px}
.dash-hist-pick{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,.6)}
.dash-pts{margin-left:auto;font-weight:800;padding:2px 8px;border-radius:10px;font-family:'JetBrains Mono',monospace;font-size:11px}
.dash-pts.p3{color:#0a1733;background:var(--gold,#ffd60a)}
.dash-pts.p1{color:#0a1733;background:var(--lime,#8ac926)}
.dash-pts.p0{color:rgba(255,255,255,.5);background:rgba(255,255,255,.08)}

/* my picks reminder (accordion per group/phase) */
.dash-mypicks{margin-bottom:4px}
.dash-acc{border:1px solid rgba(255,255,255,.1);border-radius:12px;margin-bottom:8px;overflow:hidden;background:rgba(0,0,0,.12)}
.dash-acc-head{width:100%;display:flex;align-items:center;justify-content:space-between;background:transparent;border:none;cursor:pointer;color:#fff;padding:12px 14px}
.dash-acc-title{font-family:'Archivo Black',sans-serif;font-size:13px;letter-spacing:.03em}
.dash-acc-meta{font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(255,255,255,.6);display:flex;align-items:center;gap:8px}
.dash-acc-chev{color:var(--gold,#ffd60a);display:inline-block;transition:transform .2s}
.dash-acc.open .dash-acc-chev{transform:rotate(180deg)}
.dash-acc-list{padding:0 12px 12px;display:flex;flex-direction:column;gap:10px}
`;

export { DashboardView, pointsFor };
