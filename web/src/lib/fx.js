// FX helpers ported 1:1 from usam-world-cup-2026.html.
// Framework-agnostic, browser-safe: every function no-ops gracefully when the
// relevant DOM / Web Audio APIs are unavailable (e.g. under node/vitest), so it
// can be imported and called in tests without throwing.

const CONFETTI_COLORS = ['#ff006e', '#ffd60a', '#06a77d', '#3a86ff', '#fb5607', '#8ac926'];

// The HTML relies on the .confetti-piece class + confetti-fall keyframe living in
// global CSS. The React foundation has no global.css yet, so we inject the exact
// same rules once on first use. Values match the HTML verbatim:
//   .confetti-piece{position:fixed;top:-20px;width:10px;height:14px;z-index:2999;
//                   animation:confetti-fall 2s linear forwards}
//   @keyframes confetti-fall{to{transform:translateY(110vh) rotate(720deg);opacity:0}}
const FX_STYLE_ID = 'usam-fx-style';
const FX_CSS = `
.confetti-piece{position:fixed;top:-20px;width:10px;height:14px;z-index:2999;animation:confetti-fall 2s linear forwards}
@keyframes confetti-fall{to{transform:translateY(110vh) rotate(720deg);opacity:0}}
`;

function hasDom() {
  return typeof document !== 'undefined' && !!document.body;
}

function ensureFxStyle() {
  if (!hasDom()) return;
  if (document.getElementById(FX_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = FX_STYLE_ID;
  style.textContent = FX_CSS;
  (document.head || document.body).appendChild(style);
}

// fireConfetti — DOM confetti, identical behaviour to the HTML (80 pieces,
// random colour / position / delay / duration, removed after 3s).
export function fireConfetti() {
  if (!hasDom()) return;
  ensureFxStyle();
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    piece.style.animationDelay = Math.random() * 0.5 + 's';
    piece.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 3000);
  }
}

// Reuse a single AudioContext like the HTML.
let audioCtx = null;

// playGoalSound — ascending four-note arpeggio (C5 E5 G5 C6) via Web Audio,
// matching the HTML exactly. No-ops if AudioContext is unavailable.
export function playGoalSound() {
  try {
    const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return;
    audioCtx = audioCtx || new AC();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const start = audioCtx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.3);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  } catch (e) {
    /* ignore — audio not available */
  }
}

// flashTitle — flashes document.title between a message and the original a few
// times, then restores it. HTML default message is "⚽ GOAL!". `prefix` lets
// callers customise the flashed text (defaults to the HTML value).
export function flashTitle(prefix = '⚽ GOAL!') {
  if (typeof document === 'undefined') return;
  let count = 0;
  const original = document.title;
  const interval = setInterval(() => {
    document.title = count % 2 === 0 ? prefix : original;
    count++;
    if (count > 6) {
      clearInterval(interval);
      document.title = original;
    }
  }, 400);
}

// celebrateGoal — fires all three FX together (HTML celebrateGoal()).
export function celebrateGoal() {
  fireConfetti();
  playGoalSound();
  flashTitle();
}

export default { fireConfetti, playGoalSound, flashTitle, celebrateGoal };
