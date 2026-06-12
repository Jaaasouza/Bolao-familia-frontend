import { useState, useEffect } from 'react';

// Three-box scoreline selector for one match:
//   [ home ] [ DRAW ] [ away ]
// - typing in DRAW (one number = X-X) locks the two sides;
// - typing in a side locks DRAW;
// - the ↺ button clears everything to switch modes.
//
// Pure resolver (also unit-tested): given the raw box strings, return the final
// { home, away } scoreline or null when the prediction is incomplete.
export function resolveBoxes({ drawVal, homeVal, awayVal }) {
  const d = drawVal === '' || drawVal == null ? null : Number(drawVal);
  const h = homeVal === '' || homeVal == null ? null : Number(homeVal);
  const a = awayVal === '' || awayVal == null ? null : Number(awayVal);
  if (d != null && Number.isFinite(d)) return { home: d, away: d };       // draw
  if (h != null && a != null && Number.isFinite(h) && Number.isFinite(a)) return { home: h, away: a };
  return null;
}

const clamp = (v) => {
  if (v === '') return '';
  let n = parseInt(String(v).replace(/\D/g, ''), 10);
  if (Number.isNaN(n)) return '';
  if (n < 0) n = 0;
  if (n > 20) n = 20;
  return String(n);
};

export default function MatchScoreSelector({ value, locked = false, onChange }) {
  // Seed local box state from a resolved value (equal → draw box, else sides).
  const seed = () => {
    if (!value) return { drawVal: '', homeVal: '', awayVal: '' };
    if (value.home === value.away) return { drawVal: String(value.home), homeVal: '', awayVal: '' };
    return { drawVal: '', homeVal: String(value.home), awayVal: String(value.away) };
  };
  const [box, setBox] = useState(seed);

  // Re-seed if the persisted value changes (e.g. after save/refresh).
  useEffect(() => { setBox(seed()); /* eslint-disable-next-line */ }, [value && value.home, value && value.away]);

  const drawActive = box.drawVal !== '';
  const sidesActive = box.homeVal !== '' || box.awayVal !== '';

  const update = (next) => {
    setBox(next);
    if (onChange) onChange(resolveBoxes(next));
  };

  const setDraw = (v) => update({ drawVal: clamp(v), homeVal: '', awayVal: '' });
  const setHome = (v) => update({ ...box, drawVal: '', homeVal: clamp(v) });
  const setAway = (v) => update({ ...box, drawVal: '', awayVal: clamp(v) });
  const clear = () => update({ drawVal: '', homeVal: '', awayVal: '' });

  const inputProps = {
    type: 'text', inputMode: 'numeric', pattern: '[0-9]*', maxLength: 2, disabled: locked,
  };

  return (
    <div className={`mss${locked ? ' locked' : ''}`}>
      <input
        {...inputProps}
        className="mss-box side"
        aria-label="home score"
        placeholder="–"
        value={box.homeVal}
        disabled={locked || drawActive}
        onChange={(e) => setHome(e.target.value)}
      />
      <input
        {...inputProps}
        className="mss-box draw"
        aria-label="draw score"
        placeholder="="
        value={box.drawVal}
        disabled={locked || sidesActive}
        onChange={(e) => setDraw(e.target.value)}
      />
      <input
        {...inputProps}
        className="mss-box side"
        aria-label="away score"
        placeholder="–"
        value={box.awayVal}
        disabled={locked || drawActive}
        onChange={(e) => setAway(e.target.value)}
      />
      {!locked && (drawActive || sidesActive) && (
        <button type="button" className="mss-clear" onClick={clear} aria-label="clear">↺</button>
      )}
    </div>
  );
}

export { MatchScoreSelector };
