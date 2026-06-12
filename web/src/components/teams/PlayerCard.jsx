// Player card modal — React port of openPlayerCard(). Shows a single squad
// player's number, name, full position, club and age. Rendered over its own
// backdrop above the team modal.
const POS_FULL = { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FW: 'Forward' };

export default function PlayerCard({ player, onClose }) {
  if (!player) return null;
  const { num, name, pos, club, age } = player;
  const posFull = POS_FULL[pos] || pos;
  return (
    <div
      className="modal-backdrop active"
      style={{ zIndex: 2100 }}
      onClick={onClose}
    >
      <div className="player-card" onClick={(e) => e.stopPropagation()}>
        <div className="player-card-header">
          <div className="player-card-num">{num}</div>
          <div>
            <div className="player-card-name">{name}</div>
            <div className="player-card-pos">{posFull}</div>
          </div>
        </div>
        <div className="player-card-info">
          <div className="row"><div className="lbl">Club</div><div className="v">{club || '—'}</div></div>
          <div className="row"><div className="lbl">Age</div><div className="v">{age || '—'}</div></div>
          <div className="row"><div className="lbl">Position</div><div className="v">{pos}</div></div>
          <div className="row"><div className="lbl">Number</div><div className="v">{num}</div></div>
        </div>
      </div>
    </div>
  );
}
