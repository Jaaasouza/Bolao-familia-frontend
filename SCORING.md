# 🏆 Scoring Rules

Detailed breakdown of how points are awarded.

---

## 1. Group Stage Predictions

When a player joins the pool, they predict the 1st and 2nd place finishers for each of the 12 groups (24 picks total).

When the group stage ends, the admin enters the actual standings, and players score based on accuracy:

| Outcome | Points per group |
|---|---|
| **Perfect**: Both 1st AND 2nd correct (right order) | **+8** |
| **Half right**: Either 1st OR 2nd correct | **+4** |
| **Both teams advance**, wrong order | **+2** |
| **No teams correct** | **0** |

**Maximum group stage score:** 12 × 8 = **96 points**

---

## 2. Match-by-Match Scoring

For each match where one of YOUR picked teams plays:

| Action | Points |
|---|---|
| Your team **wins** the match | **+3** |
| Match ends in a **draw** | **+1** |
| **Each goal** scored by your picked team | **+1** |
| **Clean sheet** (your team doesn't concede) | **+1** |

**Example:** If you picked Brazil and they win 3-0:
- Win bonus: +3
- 3 goals scored: +3
- Clean sheet: +1
- **Total: +7 points**

If a player picked both teams in a match (Brazil vs Argentina, picked both), they score for both.

---

## 3. Knockout Phase Bonuses

When a team you picked advances to a new phase, you get a one-time bonus:

| Phase reached | Points |
|---|---|
| **Round of 32** (after group stage) | **+3** |
| **Round of 16** | **+5** |
| **Quarter-finals** | **+10** |
| **Semi-finals** | **+20** |
| **Final** | **+30** |
| **Champion** (won the cup) | **+50** |

Bonuses stack: a team that reaches the final gives you +3 +5 +10 +20 +30 = **+68 points** just for advancing.

---

## 4. Champion Pick Bonus

Each player also picks 1 team as their **Champion Bet** — who they think wins the whole thing.

| Outcome | Points |
|---|---|
| Your Champion pick wins the World Cup | **+50** |
| Your Champion pick loses the Final | 0 |
| Your Champion pick is eliminated earlier | 0 |

**Important:** This is in ADDITION to the +50 you get for any team reaching champion phase. So if you pick Brazil as your Champion AND Brazil wins:
- Champion advancing bonus: +50
- Champion Pick bonus: +50
- **Total: +100** (plus all the earlier knockout bonuses)

---

## 5. Upset Bonus

If you picked a team to win a match and they were "the underdog" (based on FIFA rankings at tournament start), you get an extra **+5** for the upset.

The admin can mark upsets manually or it can be auto-calculated.

---

## 🧮 Example Player Score

Let's say a player named **João** picked these:

**Group A:** 1st Mexico, 2nd South Korea
**Group C:** 1st Brazil, 2nd Morocco
**Champion Pick:** Brazil

**Actual results:**
- Group A finished: 1st Mexico, 2nd South Korea (perfect!)
- Group C finished: 1st Brazil, 2nd Scotland (1 right)
- Brazil wins the World Cup

**João's score:**

| Source | Points |
|---|---|
| Group A perfect prediction | +8 |
| Group C half right | +4 |
| Brazil reaches R32 | +3 |
| Brazil reaches R16 | +5 |
| Brazil reaches QF | +10 |
| Brazil reaches SF | +20 |
| Brazil reaches Final | +30 |
| Brazil = champion | +50 |
| Champion pick correct | +50 |
| Mexico reaches R32 | +3 |
| Mexico reaches R16 | +5 |
| (Mexico eliminated in R16) | — |
| Match scoring throughout tournament | varies |

**Approx total (knockout only): ~188 points**

---

## 🥇 Tiebreakers

When two players have the same total score, ranking is decided by:

1. **Champion pick correct?** (yes wins over no)
2. **Number of "perfect" (+8) group predictions** (more wins)
3. **Number of picked teams that reached Semifinals** (more wins)
4. If still tied → admin's call (or split the prize!)

---

## 🔒 Locking

Once a player submits their picks:
- **Group predictions are locked** — can't be changed
- **Champion pick is locked** — can't be changed
- **Player profile** (name, phone) is locked

Admin can unlock individual players via the Admin panel if there's a legitimate reason.

---

## ⚙️ Customization

To change any of these point values, edit `function scorePlayer` in `usam-world-cup-2026.html`:

```javascript
function scorePlayer(player) {
  let score = 0;
  // ... scoring logic ...
  return score;
}
```

Look for these key constants near the top:
```javascript
const GROUP_BONUSES = { perfect: 8, halfRight: 4, bothAdvance: 2 };
const PHASE_BONUSES = { r32: 3, r16: 5, qf: 10, sf: 20, final: 30, champion: 50 };
const CHAMPION_PICK_BONUS = 50;
```
