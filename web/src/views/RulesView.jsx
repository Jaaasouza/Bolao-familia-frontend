import { useLang } from '../i18n/LanguageContext.jsx';
import { APP_NAME } from '../config/app.js';

// "How It Works" / rules screen for the scoreline-prediction game.
// Players predict the exact score of every match, phase by phase. Each phase
// locks in one shot. The whole pool is scored purely on match results — 3 for
// an exact score, 1 for the right result. Copy is kept in sync with PredictView
// and the scoring backend (services/scorePicks.js).

const EN = {
  heroTitle: 'How To Play',
  heroHtml:
    `Welcome to the <strong>${APP_NAME}</strong> Pool! 🎉 You predict the <strong style="color:var(--gold)">exact score of every match</strong>, phase by phase. The group stage is submitted in <strong>one shot</strong> — all group matches at once — and once locked it <strong style="color:var(--gold)">can't be changed</strong>. Each later phase (Round of 32 → Final) is its own single submission. Most points after the Final wins.`,
  b1: {
    h: 'Predict Every Score',
    pHtml: [
      'For each match, set a scoreline. The center <strong>draw</strong> box means a tie (X–X); the two <strong>side</strong> boxes mean a winner. Fill the draw box and the sides lock; fill a side and the draw locks.',
      '🔒 <strong>One shot per phase.</strong> The group phase is submitted all at once and locks forever. R32, R16, QF, SF and the Final each get one submission as they arrive.',
    ],
  },
  b2: {
    h: 'Match Points 🎯',
    pHtml: 'Every match is scored the same simple way:',
    li: [
      ['🎯 Exact score (home AND away correct)', '+3 pts'],
      ['✅ Right result only (correct winner, or a draw)', '+1 pt'],
      ['❌ Wrong result', '0 pts'],
    ],
    exampleHtml:
      '<strong>Example:</strong> Actual <strong>2–1</strong> (home win).<br>You said 2–1 → <span class="pts-pill">+3 exact</span> · 1–0 (home win) → <span class="pts-pill">+1 result</span> · 0–1 → <span class="pts-pill">0</span>'
      + '<br><br>🎁 <strong>Group bonus:</strong> nail a group\'s top two (from your scorelines) → <span class="pts-pill">+2</span> right order · <span class="pts-pill">+1</span> swapped. Added when each group finishes.',
  },
  b3: {
    h: 'Winning the Pool',
    pHtml: 'Highest total after the Final wins. If two players tie on total points, the tiebreaker is:',
    li: [
      ['1️⃣ Most exact scores (+3)', '→'],
    ],
  },
  b4: {
    h: 'Strategy Tips',
    pHtml: [
      '👉 <strong>Exact scores are gold:</strong> +3 vs +1 adds up fast over a full tournament — don\'t just pick the winner, pick the scoreline.',
      '👉 <strong>Group bonus on top:</strong> getting a group\'s top two right adds +2 (or +1 swapped) — but match points are the bulk, so stay consistent across every game.',
      '👉 <strong>Think before you lock:</strong> a phase is one shot and final. Fill in every match, double-check, then confirm.',
    ],
  },
};

const ES = {
  heroTitle: 'Cómo Jugar',
  heroHtml:
    `¡Bienvenido a la quiniela <strong>${APP_NAME}</strong>! 🎉 Predices el <strong style="color:var(--gold)">marcador exacto de cada partido</strong>, fase por fase. La fase de grupos se envía de <strong>un solo tiro</strong> — todos los partidos a la vez — y una vez bloqueada <strong style="color:var(--gold)">no se puede cambiar</strong>. Cada fase siguiente (Ronda de 32 → Final) es su propio envío único. Gana quien tenga más puntos al final.`,
  b1: {
    h: 'Predice Cada Marcador',
    pHtml: [
      'Para cada partido, pon un marcador. La casilla central de <strong>empate</strong> significa empate (X–X); las dos casillas de los <strong>lados</strong> significan un ganador. Llena el empate y los lados se bloquean; llena un lado y el empate se bloquea.',
      '🔒 <strong>Un solo tiro por fase.</strong> La fase de grupos se envía toda de una vez y se bloquea para siempre. R32, R16, CF, SF y la Final tienen un envío cada una.',
    ],
  },
  b2: {
    h: 'Puntos por Partido 🎯',
    pHtml: 'Cada partido se puntúa de la misma forma simple:',
    li: [
      ['🎯 Marcador exacto (local Y visitante correctos)', '+3 pts'],
      ['✅ Solo el resultado (ganador correcto, o empate)', '+1 pt'],
      ['❌ Resultado incorrecto', '0 pts'],
    ],
    exampleHtml:
      '<strong>Ejemplo:</strong> Real <strong>2–1</strong> (gana local).<br>Dijiste 2–1 → <span class="pts-pill">+3 exacto</span> · 1–0 (gana local) → <span class="pts-pill">+1 resultado</span> · 0–1 → <span class="pts-pill">0</span>'
      + '<br><br>🎁 <strong>Bono de grupo:</strong> acierta los dos primeros de un grupo (según tus marcadores) → <span class="pts-pill">+2</span> en orden · <span class="pts-pill">+1</span> invertido. Se suma cuando termina cada grupo.',
  },
  b3: {
    h: 'Ganar el Pool',
    pHtml: 'Gana quien tenga más puntos al final. Si dos empatan en puntos, el desempate es:',
    li: [
      ['1️⃣ Más marcadores exactos (+3)', '→'],
    ],
  },
  b4: {
    h: 'Consejos de Estrategia',
    pHtml: [
      '👉 <strong>Los marcadores exactos valen oro:</strong> +3 vs +1 suma rápido en todo el torneo — no elijas solo al ganador, elige el marcador.',
      '👉 <strong>Bono de grupo extra:</strong> acertar los dos primeros de un grupo suma +2 (o +1 invertido) — pero los puntos por partido son la mayoría, así que mantén la constancia.',
      '👉 <strong>Piensa antes de bloquear:</strong> una fase es un solo tiro y es final. Llena cada partido, revisa, y confirma.',
    ],
  },
};

function P({ html }) {
  return <p dangerouslySetInnerHTML={{ __html: html }} />;
}

function RuleList({ items }) {
  return (
    <ul>
      {items.map(([label, value], i) => (
        <li key={i}>
          <span className="label">{label}</span>
          <span className="value">{value}</span>
        </li>
      ))}
    </ul>
  );
}

function RuleBlock({ num, block }) {
  const paras = Array.isArray(block.pHtml) ? block.pHtml : [block.pHtml];
  return (
    <div className="rule-block">
      <h3>
        <span className="rule-num">{num}</span> {block.h}
      </h3>
      {paras.map((html, i) => (
        <P key={i} html={html} />
      ))}
      {block.li && <RuleList items={block.li} />}
      {block.exampleHtml && (
        <div className="example" dangerouslySetInnerHTML={{ __html: block.exampleHtml }} />
      )}
    </div>
  );
}

export default function RulesView() {
  const { lang } = useLang();
  const R = lang === 'es' ? ES : EN;

  return (
    <div className="panel active" id="panel-rules">
      <div className="rules-hero">
        <h2>{R.heroTitle}</h2>
        <P html={R.heroHtml} />
      </div>

      <RuleBlock num={1} block={R.b1} />
      <RuleBlock num={2} block={R.b2} />
      <RuleBlock num={3} block={R.b3} />
      <RuleBlock num={4} block={R.b4} />
    </div>
  );
}

export { RulesView };
