import React, { useMemo } from 'react';
import { leaderboard } from '../lib/scoring.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import { FLAGS } from '../data/teamMeta.js';

// Leaderboard / Rank tab — React port of renderRanking() from
// usam-world-cup-2026.html. Pixel parity comes from the exact CSS classes /
// keyframes ported from the HTML and injected here (the foundation has no
// shared global.css for these panel styles yet). Scoring/ordering is delegated
// to scoring.leaderboard(players, ctx) per the task contract.

const RANK_CSS = `
.usam-rank .stats-bar{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:24px}
.usam-rank .stat{flex:1;min-width:140px;padding:20px 22px;background:linear-gradient(135deg,rgba(255,255,255,.05),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.1);border-radius:16px;border-left:4px solid var(--hot-pink,#ff006e)}
.usam-rank .stat:nth-child(2){border-left-color:var(--usa-bright,#3a86ff)}
.usam-rank .stat:nth-child(3){border-left-color:var(--mexico-green,#06a77d)}
.usam-rank .stat:nth-child(4){border-left-color:var(--gold,#ffd60a)}
.usam-rank .stat .v{font-family:'Anton',sans-serif;font-size:42px;line-height:1;color:#fff}
.usam-rank .stat .l{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.5);margin-top:4px}
.usam-rank .leaderboard{display:flex;flex-direction:column;gap:8px}
.usam-rank .empty{font-family:'JetBrains Mono',monospace;font-size:13px;color:rgba(255,255,255,.6);padding:24px;text-align:center}
.usam-rank .row{display:grid;grid-template-columns:70px 1fr auto auto;gap:18px;align-items:center;padding:18px 24px;background:linear-gradient(135deg,rgba(255,255,255,.04),rgba(255,255,255,.01));backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.08);border-radius:16px;transition:all .3s cubic-bezier(.34,1.56,.64,1)}
.usam-rank .row:hover{border-color:var(--gold,#ffd60a);transform:translateX(8px);background:linear-gradient(135deg,rgba(255,214,10,.06),rgba(255,255,255,.01))}
.usam-rank .pos{font-family:'Anton',sans-serif;font-size:42px;color:rgba(255,255,255,.3);line-height:1}
.usam-rank .row.top1 .pos{background:linear-gradient(135deg,var(--gold,#ffd60a),var(--orange,#fb5607));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.usam-rank .row.top1 .pos::after{content:'👑';-webkit-text-fill-color:initial;font-size:20px;margin-left:6px;display:inline-block;animation:crownBounce 2s infinite}
.usam-rank .row.top2 .pos{color:#c0c0c0}
.usam-rank .row.top3 .pos{color:#cd7f32}
.usam-rank .name{font-family:'Archivo Black',sans-serif;font-size:18px;letter-spacing:.01em;color:#fff}
.usam-rank .picks{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,.5);letter-spacing:.02em;margin-top:6px;line-height:1.6}
.usam-rank .pts{font-family:'Anton',sans-serif;font-size:38px;background:linear-gradient(135deg,var(--gold,#ffd60a),var(--orange,#fb5607));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;text-align:right}
.usam-rank .pts small{display:block;font-family:'JetBrains Mono',monospace;font-size:9px;-webkit-text-fill-color:rgba(255,255,255,.4);letter-spacing:.1em}
@keyframes crownBounce{0%,100%{transform:translateY(0) rotate(-5deg)}50%{transform:translateY(-4px) rotate(5deg)}}
`;

// Group-prediction tallies for the gold summary line, mirroring renderRanking's
// perfect/swapped/half counts (computed against the finalised standings).
function groupTallies(player, standings = {}) {
  const firsts = (player.picks && player.picks.firsts) || player.firsts || {};
  const seconds = (player.picks && player.picks.seconds) || player.seconds || {};
  let perfect = 0, swapped = 0, half = 0;
  for (const g of Object.keys(firsts)) {
    const actual = standings[g];
    if (!actual || !actual.first || !actual.second) continue;
    const pf = firsts[g], ps = seconds[g];
    if (!pf || !ps) continue;
    if (pf === actual.first && ps === actual.second) perfect++;
    else if (pf === actual.second && ps === actual.first) swapped++;
    else if (pf === actual.first || ps === actual.second) half++;
  }
  return { perfect, swapped, half };
}

// All teams a player picked, in pick order (firsts then seconds), like the HTML.
function pickList(player) {
  if (Array.isArray(player.picks)) return player.picks.filter(Boolean);
  const firsts = (player.picks && player.picks.firsts) || player.firsts || {};
  const seconds = (player.picks && player.picks.seconds) || player.seconds || {};
  return [...Object.values(firsts), ...Object.values(seconds)].filter(Boolean);
}

export default function RankView({ players = {}, phases = {}, standings = {}, matches = [], scorers = null }) {
  const { t } = useLang();

  const scorerList = (scorers && scorers.list) || [];
  const ranked = useMemo(
    () => leaderboard(players, { matches, teamPhases: phases, standings, scorers: scorerList }),
    [players, matches, phases, standings, scorerList]
  );

  const playerCount = Object.keys(players || {}).length;
  const matchesPlayed = useMemo(
    () => (matches || []).filter((m) => m.status === 'FINISHED' || !m.status).length,
    [matches]
  );
  const leaderName = ranked.length ? ranked[0].name.split(' ')[0] : '—';

  return (
    <div className="usam-rank">
      <style>{RANK_CSS}</style>

      <div className="stats-bar">
        <div className="stat"><div className="v">{playerCount}</div><div className="l">{t('statPlayers')}</div></div>
        <div className="stat"><div className="v">{matchesPlayed}</div><div className="l">{t('statMatches')}</div></div>
        <div className="stat"><div className="v">{leaderName}</div><div className="l">{t('statLeader')}</div></div>
      </div>

      {ranked.length === 0 ? (
        <div className="empty">{t('noPlayers')}</div>
      ) : (
        <div className="leaderboard">
          {ranked.map((p, i) => {
            const cls = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
            const picks = pickList(p);
            const shown = picks.slice(0, 6);
            const more = picks.length > 6 ? ` +${picks.length - 6}` : '';
            const gt = groupTallies(p, standings);
            const hasBonus = gt.perfect || gt.swapped || gt.half;
            return (
              <div className={`row ${cls}`.trim()} key={p.id || p.name}>
                <div className="pos">{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <div className="name">{p.name}{p.locked ? ' 🔒' : ''}</div>
                  <div className="picks">
                    {shown.map((tm, k) => {
                      const code = FLAGS[tm];
                      return (
                        <span key={tm + k}>
                          {code && (
                            <img
                              src={`https://flagcdn.com/w20/${code}.png`}
                              alt=""
                              style={{ height: 11, borderRadius: 2, verticalAlign: 'middle', marginRight: 3 }}
                            />
                          )}
                          {tm}{k < shown.length - 1 ? ' · ' : ''}
                        </span>
                      );
                    })}
                    {more}
                  </div>
                  {hasBonus ? (
                    <div className="picks" style={{ color: 'var(--gold, #ffd60a)', marginTop: 3 }}>
                      {[
                        gt.perfect ? `🎯 ${gt.perfect} perfect` : null,
                        gt.swapped ? `🔄 ${gt.swapped} swapped` : null,
                        gt.half ? `📌 ${gt.half} half` : null,
                      ].filter(Boolean).join(' · ')}
                    </div>
                  ) : null}
                  {p.champion ? (
                    <div className="picks" style={{ marginTop: 4, color: p.championCorrect ? 'var(--gold, #ffd60a)' : 'rgba(255,255,255,.5)' }}>
                      🏆 {t('championPick')}: <strong>{p.champion}</strong>{p.championCorrect ? ' ✓ +50!' : ''}
                    </div>
                  ) : null}
                </div>
                <div />
                <div className="pts">{p.total}<small>{t('points')}</small></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
