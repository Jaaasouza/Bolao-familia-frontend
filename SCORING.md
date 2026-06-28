# Scoring Rules — Bolão Família

How points are awarded in the pool. The leaderboard is computed by the backend
(`services/scorePicks.js` + `services/groupBonus.js`); these rules are the
authoritative spec.

---

## 1. Per-match prediction

For every match, a player predicts the **exact final scoreline**. Points:

| Outcome | Points |
|---|---|
| **Exact score** — home AND away correct | **+3** |
| **Result only** — correct winner (or both predicted and actual end in a draw) | **+1** |
| Otherwise | **0** |

### Examples

| Actual | Prediction | Points | Why |
|---|---|---|---|
| 2-1 (home win) | 2-1 | **+3** | exact |
| 2-1 (home win) | 1-0 | **+1** | correct winner |
| 2-1 (home win) | 0-1 | **0** | wrong winner |
| 1-1 (draw) | 1-1 | **+3** | exact |
| 1-1 (draw) | 2-2 | **+1** | both are draws |
| 1-1 (draw) | 1-0 | **0** | not a draw |

### When a match counts

A match contributes to the leaderboard once it has a score in the database
**and** isn't a void game (CANCELLED / POSTPONED / SUSPENDED / ABANDONED).
Pre-match games (no score yet) contribute 0.

### When you can submit a pick

- Predictions are accepted any time before kickoff.
- Once a match kicks off, picks for it are **frozen**. Saved picks remain;
  unsaved picks are skipped (the API returns `skipped` for those).
- A submitted pick is **final** — it cannot be edited or deleted, ever
  (`ON CONFLICT … DO NOTHING` in the DB).

---

## 2. Group-stage bonus

When **all** matches of a group have finished, a one-shot bonus is awarded for
predicting who came out 1st and 2nd in that group.

The player's predicted 1st/2nd is derived from their scoreline predictions for
that group's matches — same ranking rules as FIFA (points → goal difference →
goals for).

| Outcome | Points |
|---|---|
| Predicted 1st AND 2nd correct, **right order** | **+2** |
| Predicted 1st AND 2nd correct, **wrong order** | **+1** |
| Otherwise | **0** |

The actual 1st/2nd comes from the `standings` table on the backend, which is
updated automatically by the football-data sync once enough matches are played
(an admin can also enter it manually).

The bonus is **withheld until the group is fully decided** — until then it
shows as 0. This is intentional: scoring a partial group would change the
leaderboard mid-stream.

---

## 3. Award picks (optional)

Players can also bet on tournament-wide awards:

- **Golden Boot** (top scorer)
- **Best Player** (player of the tournament)

These are set once and locked. The point value for getting them right hasn't
been formalized in code yet (`award_picks` is stored but not yet factored into
the leaderboard).

---

## 4. Tiebreakers

The leaderboard sort (`GET /api/score-leaderboard`):

1. Total points (highest first)
2. Number of exact-score hits (highest first)

For ties beyond that, ranking is admin's call.

---

## 5. What the leaderboard returns

`GET /api/score-leaderboard` returns each player with:

```json
{
  "id": "p_...",
  "name": "João",
  "total": 24,
  "exact": 4,
  "resultOnly": 12,
  "bonus": 4
}
```

- `exact` — count of +3 hits
- `resultOnly` — count of +1 hits
- `bonus` — sum of group-stage bonuses
- `total` — everything combined (also the sort key)

---

## 6. Where the code lives

| File | What it does |
|---|---|
| `backend/src/services/scorePicks.js` | per-match scoring (`scorePick`, `totalForPlayer`) |
| `backend/src/services/groupBonus.js` | group bonus (`predictedGroupTables`, `groupBonusForPlayer`, `decidedGroups`) |
| `backend/src/routes/scorePicks.js` | `POST /api/score-picks`, `GET /api/score-leaderboard` |
| `backend/tests/scorePicks.test.js` | regression coverage for the scoring rules |

Changing any of these requires a backend deploy + smoke-test (saved picks
should always score the same way).
