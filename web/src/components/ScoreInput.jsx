import React from 'react';

// Small numeric stepper used by PredictView. Clamps to [0, max], integers only,
// and exposes a mobile numeric keypad. Controlled component:
//   <ScoreInput value={n} onChange={(n) => ...} disabled max={20} label="Home" />
export const MIN_SCORE = 0;
export const MAX_SCORE = 20;

export function clampScore(v, max = MAX_SCORE) {
  if (v === '' || v === null || v === undefined) return '';
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return '';
  if (n < MIN_SCORE) return MIN_SCORE;
  if (n > max) return max;
  return n;
}

export default function ScoreInput({
  value,
  onChange,
  disabled = false,
  max = MAX_SCORE,
  label,
  testid,
}) {
  const current = value === '' || value == null ? '' : Number(value);

  const step = (delta) => {
    if (disabled) return;
    const base = current === '' ? 0 : current;
    onChange(clampScore(base + delta, max));
  };

  const onInput = (e) => {
    if (disabled) return;
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw === '') { onChange(''); return; }
    onChange(clampScore(raw, max));
  };

  return (
    <div className="pv-stepper" aria-label={label}>
      <button
        type="button"
        className="pv-step-btn"
        onClick={() => step(-1)}
        disabled={disabled || current === '' || current <= MIN_SCORE}
        aria-label={label ? `${label} minus` : 'minus'}
        tabIndex={-1}
      >
        −
      </button>
      <input
        className="pv-step-input"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={current === '' ? '' : String(current)}
        onChange={onInput}
        disabled={disabled}
        aria-label={label}
        data-testid={testid}
        placeholder="0"
      />
      <button
        type="button"
        className="pv-step-btn"
        onClick={() => step(1)}
        disabled={disabled || (current !== '' && current >= max)}
        aria-label={label ? `${label} plus` : 'plus'}
        tabIndex={-1}
      >
        +
      </button>
    </div>
  );
}
