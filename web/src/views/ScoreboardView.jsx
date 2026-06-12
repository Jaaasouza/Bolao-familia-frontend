// Scoreline-predictions leaderboard. Reads a pre-sorted (desc by total)
// leaderboard array from the coordinator:
//   leaderboard: [ { id, name, total, exact, resultOnly } ]
// Top 3 get a clean podium; your own row is highlighted. Below, a compact table
// with exact (⚽) / result (≈) / total breakdown.
import { useLang } from '../i18n/LanguageContext.jsx';
import { C } from '../theme/palette.js';
import { getPlayerInfo } from '../auth/usePhoneAuth.js';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function ScoreboardView({ leaderboard = [] }) {
  const { t } = useLang();
  const rows = Array.isArray(leaderboard) ? leaderboard : [];
  const me = getPlayerInfo();
  const top3 = rows.slice(0, 3);

  return (
    <div className="card">
      <style>{SB_CSS(C)}</style>

      <h2>{t('sbTitle') || 'Leaderboard'}</h2>
      <p className="hint">
        {t('sbHint') ||
          'Ranked by total points · exact scoreline (⚽) = 3 · right result (≈) = 1'}
      </p>

      {rows.length === 0 ? (
        <p className="sb-empty">
          {t('sbEmpty') ||
            'No predictions scored yet — the leaderboard fills in once matches are played.'}
        </p>
      ) : (
        <>
          {/* Podium — top 3 */}
          <div className="sb-podium">
            {top3.map((r, i) => (
              <div key={r.id ?? i} className={`sb-pod sb-pod-${i + 1}${me && r.id === me.id ? ' me' : ''}`}>
                <div className="sb-pod-medal">{MEDALS[i]}</div>
                <div className="sb-pod-name">{r.name}{me && r.id === me.id ? ` ${t('sbYou')}` : ''}</div>
                <div className="sb-pod-pts">{r.total ?? 0}<span>pts</span></div>
              </div>
            ))}
          </div>

          <table className="sb-table">
            <thead>
              <tr>
                <th className="sb-rank">#</th>
                <th>{t('sbPlayer') || 'Player'}</th>
                <th className="sb-num" title="Exact scorelines">⚽</th>
                <th className="sb-num" title="Correct results">≈</th>
                <th className="sb-num">{t('sbPts') || 'pts'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const mine = me && r.id === me.id;
                return (
                  <tr key={r.id ?? `${r.name}-${i}`} className={`${i === 0 ? 'sb-leader' : ''}${mine ? ' sb-me' : ''}`.trim()}>
                    <td className="sb-rank">{i + 1}</td>
                    <td className="sb-name">{i < 3 ? `${MEDALS[i]} ` : ''}{r.name}{mine ? ` ${t('sbYou')}` : ''}</td>
                    <td className="sb-num">{r.exact ?? 0}</td>
                    <td className="sb-num">{r.resultOnly ?? 0}</td>
                    <td className="sb-num sb-total">{r.total ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

const SB_CSS = (C) => `
.sb-empty{color:rgba(255,255,255,.5)}
.sb-podium{display:grid;grid-template-columns:1fr 1.15fr 1fr;gap:10px;align-items:end;margin:8px 0 18px}
.sb-pod{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:14px 10px;text-align:center}
.sb-pod-1{order:2;background:linear-gradient(180deg,rgba(255,214,10,.18),rgba(255,214,10,.04));border-color:rgba(255,214,10,.5);padding-top:22px}
.sb-pod-2{order:1}
.sb-pod-3{order:3}
.sb-pod.me{box-shadow:0 0 0 2px rgba(138,201,38,.5)}
.sb-pod-medal{font-size:26px}
.sb-pod-name{font-family:'Archivo Black',sans-serif;font-size:12px;color:#fff;margin:6px 0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-pod-pts{font-family:'Anton',sans-serif;font-size:26px;color:var(--gold,#ffd60a);line-height:1}
.sb-pod-pts span{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,.5);margin-left:4px}
.sb-table{width:100%;border-collapse:collapse;font-size:15px}
.sb-table th,.sb-table td{padding:10px 8px;text-align:left;border-bottom:1px solid ${C.line}}
.sb-table th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:${C.muted};font-weight:700}
.sb-num{text-align:right;font-variant-numeric:tabular-nums}
.sb-rank{width:36px;color:${C.inkDim};font-weight:700}
.sb-name{font-weight:600;color:${C.ink}}
.sb-total{font-weight:800;color:${C.ink}}
.sb-leader td{background:rgba(212,175,55,.10)}
.sb-leader .sb-rank,.sb-leader .sb-name,.sb-leader .sb-total{color:${C.gold}}
.sb-me td{background:rgba(138,201,38,.12)}
`;

export { ScoreboardView };
