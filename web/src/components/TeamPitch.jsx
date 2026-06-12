// A single team's pitch — its XI laid out by formation, all attacking "up"
// (GK at the back). Used twice, side by side, by the Lineups graphic.
import { TEAM_ABBR } from '../data/teamMeta.js';

// "4-3-3" → [4,3,3]; default 4-4-2 when missing/garbage.
export function rowsFromFormation(formation) {
  const parts = String(formation || '').split(/[^0-9]+/).map(Number).filter((n) => n > 0);
  return parts.length >= 2 ? parts : [4, 4, 2];
}

// → [{ x, y, num, name, pos }] in %; GK low, attackers high.
export function placeXI(team) {
  const starters = (team && team.starters) || [];
  if (!starters.length) return [];
  const gk = starters.find((p) => (p.pos || '').toUpperCase().startsWith('G')) || starters[0];
  const outfield = starters.filter((p) => p !== gk);
  const rows = rowsFromFormation(team.formation);

  const out = [{ ...gk, x: 50, y: 90 }];
  let idx = 0;
  const yNear = 72; // defenders
  const yFar = 16;  // forwards
  const nRows = rows.length;
  rows.forEach((count, r) => {
    const y = nRows > 1 ? yNear + (yFar - yNear) * (r / (nRows - 1)) : yNear;
    for (let j = 0; j < count && idx < outfield.length; j += 1, idx += 1) {
      out.push({ ...outfield[idx], x: ((j + 1) / (count + 1)) * 100, y });
    }
  });
  while (idx < outfield.length) { out.push({ ...outfield[idx], x: 50, y: yFar }); idx += 1; }
  return out;
}

function surname(name) {
  if (!name) return '';
  const parts = String(name).trim().split(/\s+/);
  return parts.length === 1 ? parts[0] : parts[parts.length - 1];
}

export default function TeamPitch({ team, lineup, color = '#3a86ff' }) {
  const players = placeXI(lineup);
  return (
    <div className="tp-field">
      <style>{TP_CSS}</style>
      <span className="tp-line tp-half" />
      <span className="tp-circle" />
      <span className="tp-box" />
      {players.map((p, i) => (
        <div key={i} className="tp-p" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
          <span className="tp-shirt" style={{ background: color }}>{p.num || ''}</span>
          <span className="tp-name">{surname(p.name)}</span>
        </div>
      ))}
      {!players.length && <span className="tp-empty">{TEAM_ABBR[team] || team}</span>}
    </div>
  );
}

const TP_CSS = `
.tp-field{position:relative;width:100%;aspect-ratio:3/4;border-radius:12px;overflow:hidden;
  background:repeating-linear-gradient(0deg,#1f8a4c 0 10%,#1c7e46 10% 20%);border:2px solid rgba(255,255,255,.25)}
.tp-line{position:absolute;background:rgba(255,255,255,.45)}
.tp-half{left:0;right:0;top:0;height:2px}
.tp-circle{position:absolute;left:50%;top:0;width:26%;aspect-ratio:1;transform:translate(-50%,-50%);
  border:2px solid rgba(255,255,255,.45);border-radius:50%}
.tp-box{position:absolute;left:28%;width:44%;bottom:0;height:16%;border:2px solid rgba(255,255,255,.45);border-bottom:none}
.tp-p{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:1px;width:46px}
.tp-shirt{width:21px;height:21px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-family:'Anton',sans-serif;font-size:10px;color:#0a1733;box-shadow:0 1px 4px rgba(0,0,0,.5)}
.tp-name{font-family:'JetBrains Mono',monospace;font-size:7.5px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.9);
  white-space:nowrap;max-width:52px;overflow:hidden;text-overflow:ellipsis;line-height:1.05}
.tp-empty{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-family:'Archivo Black',sans-serif;
  font-size:13px;color:rgba(255,255,255,.6)}
`;

export { TeamPitch };
