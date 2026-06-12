// Squad section for the team modal — React port of renderSquad()/squadItem().
// Players are grouped GK -> DEF -> MID -> FW and shown as a flat squad-list grid.
// Clicking an item opens the player card via onSelectPlayer.
const POS_ORDER = ['GK', 'DEF', 'MID', 'FW'];

export default function SquadList({ team, squad, onSelectPlayer }) {
  if (!squad || !squad.length) {
    return (
      <div className="modal-section">
        <h3>Squad</h3>
        <div className="squad-empty">
          <div className="emoji-big">⚽</div>
          <div className="msg">Squad data coming soon for {team}.</div>
        </div>
      </div>
    );
  }

  const byPos = { GK: [], DEF: [], MID: [], FW: [] };
  squad.forEach((p) => {
    (byPos[p.pos] || byPos.MID).push(p);
  });
  const ordered = POS_ORDER.flatMap((pos) => byPos[pos]);

  return (
    <div className="modal-section">
      <h3>
        Squad{' '}
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', WebkitTextFillColor: 'rgba(255,255,255,.5)' }}>
          {squad.length} players
        </span>
      </h3>
      <div className="squad-list">
        {ordered.map((p) => (
          <div
            key={`${p.num}-${p.name}`}
            className="squad-item"
            onClick={() => onSelectPlayer?.({ ...p, team })}
          >
            <div className="num">{p.num}</div>
            <div className="info">
              <div className="nm">{p.name}</div>
              <div className="pos">
                {p.pos}
                {p.club ? ` · ${p.club}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
