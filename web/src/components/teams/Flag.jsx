// Flag image with emoji fallback — React port of the legacy flagImg(team,size)
// helper. Renders an <img> from flagcdn when an ISO code exists, otherwise the
// Unicode flag emoji (or ⚽). `size` is the flagcdn width; the rendered height is
// size/2 px to match the original inline style.
import { FLAGS, FLAG_EMOJI, flagUrl } from '../../data/teamMeta.js';

export default function Flag({ team, size = 40, style }) {
  const code = FLAGS[team];
  if (!code) {
    return <span style={style}>{FLAG_EMOJI[team] || '⚽'}</span>;
  }
  return (
    <img
      src={flagUrl(team, size)}
      alt={team}
      style={{ height: (size || 40) / 2, borderRadius: 2, verticalAlign: 'middle', ...style }}
    />
  );
}
