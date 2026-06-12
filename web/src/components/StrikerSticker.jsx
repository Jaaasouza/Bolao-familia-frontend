// "Panini-style" striker sticker: a flag-colored card with the player's initials
// in a circle and the country flag. No external photos (player images are
// rights-protected and fragile to hotlink) — this always renders and matches the
// festive look. `size` controls the card width in px.
import Flag from './teams/Flag.jsx';
import { flagColors } from '../data/flagColors.js';

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function StrikerSticker({ name, team, size = 84, selected = false }) {
  const [c1, c2] = flagColors(team);
  return (
    <div
      className={`striker-sticker${selected ? ' selected' : ''}`}
      style={{ width: size, background: `linear-gradient(160deg, ${c1}, ${c2})` }}
      title={`${name} · ${team}`}
    >
      <span className="ss-shine" aria-hidden="true" />
      <span className="ss-avatar">{initials(name)}</span>
      <span className="ss-flag"><Flag team={team} size={36} /></span>
      <span className="ss-name">{name}</span>
    </div>
  );
}

export { StrikerSticker, initials };
