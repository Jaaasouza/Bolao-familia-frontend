// Knockout bracket — React port of renderBracketView()/bracketTeamHtml().
// Five columns R32 -> Final, each listing the teams whose current phase equals
// that column, plus a Champion / Finalists highlight row. Each team is clickable
// and opens the team modal via onSelectTeam.
import Flag from './Flag.jsx';

const COL_ORDER = ['r32', 'r16', 'qf', 'sf', 'final'];
const COL_LABELS = { r32: 'Round of 32', r16: 'Round of 16', qf: 'Quarterfinal', sf: 'Semifinal', final: 'Final' };

function BracketTeam({ team, phase, pts, onSelectTeam }) {
  return (
    <div className={`bracket-team ${phase}`} onClick={() => onSelectTeam?.(team)}>
      <Flag team={team} size={40} />
      <span className="team-name">{team}</span>
      <span className="team-pts">{pts}</span>
    </div>
  );
}

export default function Bracket({ phases = {}, teamPts = {}, onSelectTeam }) {
  // Bucket teams strictly by their current phase (matches the legacy byPhase).
  const byPhase = { r32: [], r16: [], qf: [], sf: [], final: [], champion: [] };
  Object.entries(phases).forEach(([t, ph]) => {
    if (byPhase[ph]) byPhase[ph].push(t);
  });

  const ptsOf = (t) => (teamPts[t] || {}).pts || 0;
  const champ = byPhase.champion;
  const finalists = byPhase.final;

  return (
    <>
      <div className="bracket-grid">
        {COL_ORDER.map((col) => {
          const teams = byPhase[col] || [];
          return (
            <div className="bracket-col" key={col}>
              <div className="bracket-col-header">
                {COL_LABELS[col]}
                <span className="bracket-col-count">
                  {teams.length} {teams.length === 1 ? 'team' : 'teams'}
                </span>
              </div>
              {teams.length === 0 ? (
                <div className="bracket-empty">—</div>
              ) : (
                teams.map((t) => (
                  <BracketTeam key={t} team={t} phase={col} pts={ptsOf(t)} onSelectTeam={onSelectTeam} />
                ))
              )}
            </div>
          );
        })}
      </div>

      {(champ.length > 0 || finalists.length > 0) && (
        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <div className="bracket-col-header" style={{ textAlign: 'center' }}>🏆 Champion</div>
            {champ.length > 0
              ? champ.map((t) => (
                <BracketTeam key={t} team={t} phase="champ" pts={ptsOf(t)} onSelectTeam={onSelectTeam} />
              ))
              : <div className="bracket-empty">TBD</div>}
          </div>
          <div>
            <div className="bracket-col-header" style={{ textAlign: 'center' }}>Finalists</div>
            {finalists.length > 0
              ? finalists.map((t) => (
                <BracketTeam key={t} team={t} phase="final" pts={ptsOf(t)} onSelectTeam={onSelectTeam} />
              ))
              : <div className="bracket-empty">TBD</div>}
          </div>
        </div>
      )}
    </>
  );
}
