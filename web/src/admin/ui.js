import { C } from '../theme/palette.js';

// Shared admin control styles (kept here so no hex leaks into components).
export const selectStyle = {
  background: C.pix,
  color: C.ink,
  border: `1px solid ${C.line}`,
  borderRadius: 8,
  padding: '6px 8px',
  fontSize: 13,
  width: '100%',
};

export const inputStyle = { ...selectStyle };

export const primaryBtn = {
  background: C.grad2,
  color: '#fff',
  border: 'none',
  borderRadius: C.radius,
  padding: '8px 16px',
  cursor: 'pointer',
  fontWeight: 600,
};

export const ghostBtn = {
  background: C.chip,
  color: C.inkDim,
  border: `1px solid ${C.line}`,
  borderRadius: C.radius,
  padding: '8px 14px',
  cursor: 'pointer',
  fontWeight: 600,
};

export const dangerBtn = {
  background: 'transparent',
  color: C.bad,
  border: `1px solid ${C.bad}`,
  borderRadius: 8,
  padding: '4px 10px',
  cursor: 'pointer',
  fontSize: 12,
};

export const card = {
  background: C.card,
  border: `1px solid ${C.line}`,
  borderRadius: C.radius,
  padding: 14,
  marginBottom: 14,
};
