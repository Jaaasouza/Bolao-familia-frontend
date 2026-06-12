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

const PT = {
  heroTitle: 'Como Jogar',
  heroHtml:
    `Bem-vindo ao bolão <strong>${APP_NAME}</strong>! 🎉 Você palpita o <strong style="color:var(--gold)">placar exato de cada jogo</strong>, fase por fase. A fase de grupos é enviada de <strong>uma só vez</strong> — todos os jogos do grupo juntos — e depois de travada <strong style="color:var(--gold)">não pode ser alterada</strong>. Cada fase seguinte (Fase de 32 → Final) é um envio único próprio. Quem tiver mais pontos depois da Final vence.`,
  b1: {
    h: 'Palpite Cada Placar',
    pHtml: [
      'Para cada jogo, defina um placar. A caixa central de <strong>empate</strong> significa empate (X–X); as duas caixas das <strong>laterais</strong> significam um vencedor. Preencha o empate e as laterais travam; preencha uma lateral e o empate trava.',
      '🔒 <strong>Um envio por fase.</strong> A fase de grupos é enviada toda de uma vez e trava para sempre. Fase de 32, Oitavas, Quartas, Semis e a Final têm um envio cada.',
    ],
  },
  b2: {
    h: 'Pontos por Jogo 🎯',
    pHtml: 'Cada jogo é pontuado da mesma forma simples:',
    li: [
      ['🎯 Placar exato (mandante E visitante certos)', '+3 pts'],
      ['✅ Só o resultado (vencedor certo, ou empate)', '+1 pt'],
      ['❌ Resultado errado', '0 pts'],
    ],
    exampleHtml:
      '<strong>Exemplo:</strong> Resultado <strong>2–1</strong> (vitória do mandante).<br>Você disse 2–1 → <span class="pts-pill">+3 exato</span> · 1–0 (vitória do mandante) → <span class="pts-pill">+1 resultado</span> · 0–1 → <span class="pts-pill">0</span>'
      + '<br><br>🎁 <strong>Bônus de grupo:</strong> acerte os dois primeiros de um grupo (pelos seus placares) → <span class="pts-pill">+2</span> na ordem · <span class="pts-pill">+1</span> invertido. Somado quando cada grupo termina.',
  },
  b3: {
    h: 'Como Vencer o Bolão',
    pHtml: 'Quem tiver mais pontos depois da Final vence. Se dois empatarem em pontos, o critério de desempate é:',
    li: [
      ['1️⃣ Mais placares exatos (+3)', '→'],
    ],
  },
  b4: {
    h: 'Dicas de Estratégia',
    pHtml: [
      '👉 <strong>Placares exatos valem ouro:</strong> +3 vs +1 soma rápido ao longo de toda a Copa — não escolha só o vencedor, escolha o placar.',
      '👉 <strong>Bônus de grupo por cima:</strong> acertar os dois primeiros de um grupo soma +2 (ou +1 invertido) — mas os pontos por jogo são a maior parte, então mantenha a constância.',
      '👉 <strong>Pense antes de travar:</strong> a fase é um envio único e definitivo. Preencha cada jogo, confira, e confirme.',
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
  const R = lang === 'pt' ? PT : EN;

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
