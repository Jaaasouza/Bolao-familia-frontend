# USAM World Cup 2026 Pool — Migration Specification

**Source:** `/usam-world-cup-2026.html` (3638 lines, vanilla HTML/CSS/JS)  
**Purpose:** Pixel-for-pixel React reproduction  
**Last Updated:** 2026-05-31

---

## Table of Contents

1. [Design Tokens](#1-design-tokens)
2. [Layout Shell & Header](#2-layout-shell--header)
3. [Navigation: Tabs & Mobile Menu](#3-navigation-tabs--mobile-menu)
4. [Per-View Breakdown](#4-per-view-breakdown)
5. [Internationalization (i18n)](#5-internationalization-i18n)
6. [Animations & Effects](#6-animations--effects)
7. [Team & Squad Metadata](#7-team--squad-metadata)
8. [Scoring & Bonuses](#8-scoring--bonuses)
9. [State Management & Storage](#9-state-management--storage)

---

## 1. Design Tokens

### CSS Custom Properties (`:root`, lines 11–26)

```css
:root {
  --mexico-red: #e63946;      /* Mexico national red */
  --mexico-green: #06a77d;    /* Mexico national green */
  --usa-blue: #1d3557;        /* USA navy/dark */
  --usa-bright: #3a86ff;      /* USA bright blue */
  --canada-red: #d62828;      /* Canada national red */
  --gold: #ffd60a;            /* Trophy gold — primary accent */
  --hot-pink: #ff006e;        /* Festival magenta */
  --orange: #fb5607;          /* Sunset orange */
  --lime: #8ac926;            /* Vivid lime green */
  --cream: #fff8e7;           /* Warm off-white */
  --ink: #0a1733;             /* Deep navy, used for dark text */
  --dark: #0a1733;            /* Same as --ink */
  --white: #ffffff;
}
```

### Global Background & Typography

- **Page background:** `#0a1733` (solid `!important`)
- **Body font:** `'Space Grotesk', sans-serif` (400, 500, 700 weights imported)
- **Base text color:** `var(--white)` on `#0a1733`
- **Grain texture:** `.grain { display: none }` (disabled)

### Font Families & Usage

All imported from Google Fonts (line 9):

| Font | Weights | Primary Uses |
|------|---------|--------------|
| **Anton** | 400 | Large headings (h1, h2), big numbers (title, card h2, stats, leaderboard `.pts`, bracket `.team-pts`) |
| **Archivo Black** | 700, 900 | Tab labels, buttons, badge text, section titles, menu drawer |
| **Space Grotesk** | 400, 500, 700 | Body copy, form inputs, player name, general text |
| **JetBrains Mono** | 400, 700, 800 | Monospace: hints, labels, timestamps, code-like UI (`.subtitle`, `.hint`, `.badge`, `.picks`) |

### Container & Layout

- **Main container:** `.wrap { max-width: 1280px; margin: 0 auto; padding: 24px 20px 80px; }`
  - Mobile (`max-width: 520px`): `padding: 16px 14px 60px`

### Border Radii & Shadows

| Element | Border Radius | Box Shadow |
|---------|---------------|-----------|
| **Header divider** | N/A | 3px solid gradient: `linear-gradient(90deg, var(--hot-pink), var(--gold), var(--mexico-green), var(--usa-bright))` |
| **Cards** | 20px | 1px solid `rgba(255,255,255,.1)` + `backdrop-filter: blur(20px)` |
| **Buttons** | 12–30px | varies: `0 8px 24px rgba(255,0,110,.3)` for `.primary` |
| **Inputs** | 10px | 1px solid `rgba(255,255,255,.15)` |
| **Modals** | 24px | 1px solid `rgba(255,255,255,.15)` |
| **Tabs** | 30px | gradient border-radius |

### Gradient Definitions (Used Repeatedly)

```css
/* Primary accent gradient (hot pink → gold) */
linear-gradient(135deg, var(--hot-pink), var(--orange))
/* Used in: .tab.active, .primary button, .badge, accent text fills */

/* Gold-to-orange gradient */
linear-gradient(135deg, var(--gold), var(--orange))
/* Used in: text gradients (pts, scores), badges, accents */

/* Header rainbow divider */
linear-gradient(90deg, var(--hot-pink), var(--gold), var(--mexico-green), var(--usa-bright))
/* Used in: header border-image, card ::before top line, modal ::before top line */

/* Subtle card background */
linear-gradient(135deg, rgba(255,255,255,.05), rgba(255,255,255,.02))
/* Used in: .card, .row, .teambox, .bracket-col, etc. */

/* Menu drawer background */
linear-gradient(180deg, #0d1b3a, #0a1733)
/* Used in: .menu-drawer, modals */

/* Green pitch background */
linear-gradient(180deg, #1a5d2e 0%, #2a7d3e 100%)
/* Used in: .pitch (soccer field visualization) */
```

---

## 2. Layout Shell & Header

### Header Structure & Styling (lines 41–110)

```html
<header>
  <div class="brand-wrap">
    <div class="brand">
      <span class="brand-tag">⚽ Official Pool · June 11 – July 19</span>
      <h1 class="title">USAM <span class="line2">World Cup 2026</span></h1>
      <div class="subtitle">Pick 2 per group ● Predict 1st & 2nd ● Locked once confirmed</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px;align-items:flex-end">
      <div class="lang-switch">
        <button class="lang-btn active" data-lang="en">EN</button>
        <button class="lang-btn" data-lang="es">ES</button>
      </div>
      <div class="host-flags">
        <span class="flag-pill usa">🇺🇸 USA</span>
        <span class="flag-pill can">🇨🇦 CAN</span>
        <span class="flag-pill mex">🇲🇽 MEX</span>
      </div>
      <span class="live">Live · Real-time ranking</span>
    </div>
  </div>
</header>
```

**Styling Details:**

- **`.brand-tag`**: `display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .25em; text-transform: uppercase; background: var(--gold); color: var(--ink); padding: 4px 12px; border-radius: 2px; font-weight: 800;`

- **`.title`**: 
  - Font: Anton, uppercase
  - Size: `clamp(56px, 11vw, 128px)` (responsive)
  - Line height: 0.85, letter-spacing: -0.01em
  - Color: white
  - **`.line2` (sub-line):** `font-size: .5em`, gradient text: `linear-gradient(90deg, var(--gold), var(--orange))` with `-webkit-background-clip: text; -webkit-text-fill-color: transparent`

- **`.subtitle`**: JetBrains Mono, 12px, `letter-spacing: .18em`, `text-transform: uppercase`, `color: rgba(255,255,255,.6)`, with `.dot { color: var(--gold); margin: 0 8px }`

- **`.host-flags`**: Flex row, gap 8px, Archivo Black 11px, `letter-spacing: .1em`
  - **`.flag-pill`**: `padding: 6px 14px; border-radius: 30px; text-transform: uppercase; transform: rotate(-2deg);`
    - `.flag-pill.usa`: `background: var(--usa-bright); color: white`
    - `.flag-pill.can`: `background: var(--canada-red); color: white`
    - `.flag-pill.mex`: `background: var(--mexico-green); color: white`
    - `:hover`: `transform: rotate(0) scale(1.1)`

- **`.live` indicator**: Inline-flex, gap 8px, JetBrains Mono 11px, `color: var(--lime)`, `letter-spacing: .15em`, `text-transform: uppercase`, `font-weight: 700`
  - **`::before` pulse dot**: `width: 10px; height: 10px; border-radius: 50%; background: var(--lime); box-shadow: 0 0 14px var(--lime); animation: pulse 1.2s infinite;`

- **`.lang-switch`**: Flex, gap 0, `border: 1px solid rgba(255,255,255,.2); border-radius: 30px; padding: 3px; background: rgba(255,255,255,.04);`
  - **`.lang-btn`**: `padding: 6px 14px; border-radius: 20px; font-family: 'Archivo Black'; font-size: 11px; letter-spacing: .1em; color: rgba(255,255,255,.6); cursor: pointer;`
  - **`.lang-btn.active`**: `background: linear-gradient(135deg, var(--gold), var(--orange)); color: var(--ink)`

---

## 3. Navigation: Tabs & Mobile Menu

### Tab Bar (lines 112–131)

```html
<div class="tabs">
  <button class="tab tv-tab" data-tab="live" data-i18n="tabLive">🔴 Live</button>
  <button class="tab active" data-tab="join" data-i18n="tabJoin">🎯 Join Pool</button>
  <button class="tab" data-tab="rank" data-i18n="tabRank">🏆 Leaderboard</button>
  <button class="tab" data-tab="teams" data-i18n="tabTeams">⚽ Teams</button>
  <button class="tab" data-tab="rules" data-i18n="tabRules">📖 How It Works</button>
  <button class="tab" data-tab="admin" data-i18n="tabAdmin">🔧 Admin</button>
</div>
```

**Tab Styling:**

- **`.tab`** (inactive): 
  - `background: rgba(255,255,255,.04); border: 2px solid rgba(255,255,255,.08);`
  - `color: rgba(255,255,255,.7); font-family: 'Archivo Black'; font-size: 12px;`
  - `letter-spacing: .08em; text-transform: uppercase; padding: 12px 18px;`
  - `border-radius: 30px; cursor: pointer; white-space: nowrap;`
  - `transition: all .25s cubic-bezier(.34,1.56,.64,1);`
  - `:hover`: `color: white; border-color: var(--gold); transform: translateY(-2px);`

- **`.tab.active`** (except `.tv-tab`):
  - `background: linear-gradient(135deg, var(--hot-pink), var(--orange));`
  - `color: white; border-color: transparent;`
  - `box-shadow: 0 8px 24px rgba(255,0,110,.4);`

- **`.tab.tv-tab`** (Live tab special styling):
  - `background: linear-gradient(135deg, rgba(255,214,10,.15), rgba(251,86,7,.15)); color: var(--gold); border-color: var(--gold);`
  - **`.tab.tv-tab.active`**: `background: linear-gradient(135deg, var(--gold), var(--orange)); color: var(--ink); box-shadow: 0 8px 24px rgba(255,214,10,.4);`

**Tab List:** `display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; padding-bottom: 4px;` (horizontal scroll on mobile, no scrollbar)

### Mobile Menu & FAB (lines 133–210)

**FAB Button (`.fab-menu`)** — only shows on `max-width: 768px`:
- `position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px;`
- `border-radius: 50%; background: linear-gradient(135deg, var(--usa-bright), #5a9eff);`
- `box-shadow: 0 8px 24px rgba(58,134,255,.5), 0 0 0 1px rgba(255,255,255,.1);`
- `z-index: 900; display: flex (on mobile only);`
- `:active`: `transform: scale(.92); :hover`: `transform: translateY(-2px); box-shadow: 0 12px 32px rgba(58,134,255,.6)`
- **Inner SVG**: `width: 26px; height: 26px;` (hamburger icon), rotates 90deg when `.menu-open`

**Menu Overlay (`.menu-overlay`):**
- `position: fixed; inset: 0; background: rgba(0,0,0,.7); backdrop-filter: blur(6px);`
- `z-index: 1500; opacity: 0; transition: opacity .25s;`
- **`.menu-overlay.active`**: `display: block; opacity: 1;`

**Menu Drawer (`.menu-drawer`):**
- `position: fixed; top: 0; right: -340px; bottom: 0; width: 300px; max-width: 85vw;`
- `background: linear-gradient(180deg, #0d1b3a, #0a1733);`
- `border-left: 1px solid rgba(255,255,255,.1); z-index: 1600;`
- `padding: 20px 16px; transition: right .3s cubic-bezier(.34,1.56,.64,1);`
- `overflow-y: auto; display: flex; flex-direction: column;`
- **`.menu-drawer.active`**: `right: 0;`

**Menu Header (`.menu-drawer-header`):**
- `display: flex; justify-content: space-between; align-items: center;`
- `padding-bottom: 16px; margin-bottom: 16px;`
- `border-bottom: 1px solid rgba(255,255,255,.1);`
- **`.title`**: Anton 24px, gradient text (gold to orange)

**Menu Close Button (`.menu-drawer-close`):**
- `width: 36px; height: 36px; border-radius: 50%;`
- `background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15);`
- `color: white; font-size: 18px; cursor: pointer;`

**Menu Items (`.menu-drawer-tab`):**
- `display: flex; align-items: center; gap: 14px;`
- `width: 100%; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);`
- `color: rgba(255,255,255,.85); padding: 14px 18px; margin-bottom: 8px;`
- `border-radius: 14px; cursor: pointer; font-family: 'Archivo Black'; font-size: 14px;`
- `letter-spacing: .06em; text-transform: uppercase; transition: all .2s;`
- **`.menu-drawer-tab.active`**: `background: linear-gradient(135deg, var(--hot-pink), var(--orange)); color: white; box-shadow: 0 4px 14px rgba(255,0,110,.3);`
- **`.menu-drawer-tab.tv-item`** (Live): `background: linear-gradient(135deg, rgba(255,214,10,.12), rgba(251,86,7,.08)); border-color: var(--gold); color: var(--gold);`
- **`.menu-drawer-tab.tv-item.active`**: `background: linear-gradient(135deg, var(--gold), var(--orange)); color: var(--ink);`

---

## 4. Per-View Breakdown

### Panel Structure & Animations

All panels use:
```css
.panel { display: none; animation: fadeUp .5s cubic-bezier(.16,1,.3,1); }
.panel.active { display: block; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
```

---

### 4.1. **Join / Predict** Tab (`panel-join`)

**Main Card Structure:**
```html
<div class="card">
  <h2 data-i18n="joinTitle">Predict Your Group Winners 
    <span class="pick-counter" data-i18n="joinTitleCounter">2 per group · 24 picks</span>
  </h2>
  <p class="hint" data-i18n="joinHint">...</p>
  <!-- Locked banner, inputs, picks grid, champion pick, save button -->
</div>
```

**Key Elements:**

1. **Locked Banner (`#lockedBanner`)** — hidden by default:
   - `background: linear-gradient(135deg, rgba(255,0,110,.15), rgba(251,86,7,.1));`
   - `border: 2px solid var(--hot-pink); border-radius: 16px; padding: 18px 22px;`
   - `display: flex; align-items: center; gap: 14px; margin-bottom: 22px;`
   - `animation: locked-pulse 3s infinite;`
   - Shows when player name exists and is locked

2. **Player Name Input (`#playerName`)**:
   - Type: `text`, maxlength 40, placeholder i18n key `namePlaceholder`
   - Has `oninput` listener to check existing picks (calls `checkExistingPicks()`)

3. **Player Phone Input (`#playerPhone`)**:
   - Type: `tel`, maxlength 14, `inputmode: numeric`
   - Auto-formats to `(555) 123-4567` pattern via `oninput` listener
   - US-only validation (10 digits)

4. **Picks Grid (`#picksGrid`)** — rendered via `buildPicksGrid()`:
   - Grid: `display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;`
   - Mobile: `repeat(2, 1fr)` at 900px, `1fr` at 520px
   - One **pick-card per group**:
     ```html
     <div class="pick-card" data-group="A">
       <div class="group-title">
         <span class="gl">A</span> Group A
       </div>
       <div class="pick-slot first">
         <label><span class="medal">🥇</span> 1st place</label>
         <select class="pickSel first" data-group="A" data-pos="1">...</select>
       </div>
       <div class="pick-slot second">
         <label><span class="medal">🥈</span> 2nd place</label>
         <select class="pickSel second" data-group="A" data-pos="2">...</select>
       </div>
     </div>
     ```
   - **`.pick-card`**: `background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1);`
     - `border-radius: 14px; padding: 16px; transition: border-color .2s;`
     - **`.pick-card.complete`**: `border-color: var(--lime); background: rgba(138,201,38,.05);` (both picks filled)
   - **`.pick-slot`**: margin-bottom 10px, relative positioning
     - **`.pick-slot.first label`**: `color: var(--gold);` (1st place gold)
     - **`.pick-slot.second label`**: `color: #c0c0c0;` (2nd place silver)
   - **Select element**: `padding: 10px 12px; font-size: 14px;` (smaller than form inputs)
   - **`<select option>`**: Dark background (#0a1733) with light text, hover to #1a3a6b with gold (#ffd60a)

5. **Prediction Hint Box:**
   - `margin-top: 20px; padding: 14px 18px;`
   - `background: rgba(255,214,10,.08); border: 1px solid rgba(255,214,10,.3); border-radius: 10px;`
   - `font-size: 13px; line-height: 1.6;`
   - Text: "💡 **Prediction bonus:** +8 perfect · +4 swapped · +2 half (per group) · Match points + knockout bonuses add up fast!"

6. **Champion Pick Section:**
   - `margin-top: 24px; padding: 24px;`
   - `background: linear-gradient(135deg, rgba(255,214,10,.12), rgba(251,86,7,.08));`
   - `border: 2px solid var(--gold); border-radius: 16px;`
   - **Heading**: Anton 28px, gradient text (gold to orange), "🏆 Champion Pick"
   - **Hint**: JetBrains Mono 11px, "Pick your World Champion from one of your 24 selected teams. +50 pts if you nail it!"
   - **Select `#championPick`**: Populated by `updateChampionDropdown()` based on picked teams
   - **Trophy emoji**: Positioned absolutely, `font-size: 120px; opacity: .08;` in background

7. **Save Button (`#savePick`)**:
   - Class: `.primary` — `background: linear-gradient(135deg, var(--hot-pink), var(--orange));`
   - `color: white; padding: 16px 28px; border-radius: 12px; cursor: pointer;`
   - `box-shadow: 0 8px 24px rgba(255,0,110,.3);`
   - **On click**: Validates all inputs, shows confirmation dialog, saves to storage, switches to leaderboard
   - **Label changes**: `🔒 Lock In My Picks Forever` (unlocked) → `🔒 Picks Locked` (locked)

**Render Function:** `buildPicksGrid()` (lines 2130–2221)
- Preserves existing select values
- Builds HTML for all 12 groups
- Attaches `onchange` listeners for visual feedback
- Calls `updateChampionDropdown()` to populate champion select

---

### 4.2. **Leaderboard / Ranking** Tab (`panel-rank`)

**Stats Bar (`.stats-bar`):**
```html
<div class="stats-bar">
  <div class="stat"><div class="v" id="statPlayers">0</div><div class="l">Players</div></div>
  <div class="stat"><div class="v" id="statMatches">0</div><div class="l">Matches played</div></div>
  <div class="stat"><div class="v" id="statLeader">—</div><div class="l">Leader</div></div>
  <div class="stat">
    <button class="ghost" onclick="refreshAll()">↻ Refresh</button>
  </div>
</div>
```

**Stats Bar Styling:**
- `display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 24px;`
- **`.stat`**: `flex: 1; min-width: 140px; padding: 20px 22px;`
  - `background: linear-gradient(135deg, rgba(255,255,255,.05), rgba(255,255,255,.02));`
  - `border: 1px solid rgba(255,255,255,.1); border-radius: 16px;`
  - **Left colored bar**: `4px solid` (different color per stat: hot-pink, usa-bright, mexico-green, gold)
- **`.stat .v`** (value): Anton 42px, white
- **`.stat .l`** (label): JetBrains Mono 10px, `letter-spacing: .15em`, uppercase, `color: rgba(255,255,255,.5)`

**Leaderboard (`.leaderboard`):**
- `display: flex; flex-direction: column; gap: 8px;`
- Each **`.row`** (player):
  ```html
  <div class="row top1|top2|top3">
    <div class="pos">01</div>
    <div>
      <div class="name">Player Name 🔒</div>
      <div class="picks">Flag icons · Team names</div>
      <div class="picks" style="color:var(--gold)">🎯 2 perfect · 🔄 1 swapped · 📌 0 half</div>
      <div class="picks">🏆 Champion Pick: Brazil ✓ +50!</div>
    </div>
    <div></div>
    <div class="pts">1523<small>POINTS</small></div>
  </div>
  ```

**Row Styling (`.row`):**
- `display: grid; grid-template-columns: 70px 1fr auto auto; gap: 18px;`
- `align-items: center; padding: 18px 24px;`
- `background: linear-gradient(135deg, rgba(255,255,255,.04), rgba(255,255,255,.01));`
- `backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,.08); border-radius: 16px;`
- `transition: all .3s cubic-bezier(.34,1.56,.64,1);`
- `:hover`: `border-color: var(--gold); transform: translateX(8px);`
  - `background: linear-gradient(135deg, rgba(255,214,10,.06), rgba(255,255,255,.01));`

**Position Badge (`.pos`):**
- `font-family: 'Anton'; font-size: 42px; color: rgba(255,255,255,.3); line-height: 1;`
- **Top 1**: Gradient text (gold to orange), `::after` crown emoji (🎭) with `animation: crown-bob 2s infinite;`
- **Top 2**: Silver (#c0c0c0)
- **Top 3**: Bronze (#cd7f32)

**Player Name (`.name`):**
- `font-family: 'Archivo Black'; font-size: 18px; letter-spacing: .01em;`
- Shows 🔒 if locked

**Picks Summary (`.picks`):**
- `font-family: 'JetBrains Mono'; font-size: 10px; color: rgba(255,255,255,.5);`
- `letter-spacing: .02em; margin-top: 6px; line-height: 1.6;`
- Shows top 6 teams as flag + name, then `+N` more

**Points Score (`.pts`):**
- `font-family: 'Anton'; font-size: 38px;`
- Gradient text (gold to orange)
- **`small`**: JetBrains Mono 9px, "POINTS", gray text

**Render Function:** `renderRanking()` (lines 2352–2406)
- Computes points via `computePoints(player)` for each player (lines 2284–2350)
- Sorts by points descending, then by name
- Updates stat counters
- Builds leaderboard HTML with conditional classes

**Points Computation (`computePoints`):**
1. Match points (per picked team): +3 for win, +1 for draw, +1 per goal, +1 for clean sheet, +5 if upset
2. Phase bonuses: Cumulative if team advances (r32: +3, r16: +5, qf: +10, sf: +20, final: +30, champion: +50)
3. Group bonuses: +8 perfect, +4 swapped, +2 half (per group)
4. Champion bonus: +50 if champion pick wins the cup

---

### 4.3. **Teams** Tab (`panel-teams`)

**Bracket Section (when any team advances):**

```html
<div class="card bracket-section" id="bracketCard">
  <h2>🏆 Knockout Bracket</h2>
  <p class="hint">Teams advancing through the knockout rounds</p>
  <div class="bracket-grid" id="bracketGrid"></div>
</div>
```

**Bracket Grid (`.bracket-grid`):**
- `display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px;`
- Mobile: `repeat(3, 1fr)` at 900px, `repeat(2, 1fr)` at 520px
- Contains 5 **bracket columns**: R32, R16, QF, SF, FINAL (with Champion at top)

**Bracket Column (`.bracket-col`):**
- `background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08);`
- `border-radius: 14px; padding: 14px;`

**Column Header (`.bracket-col-header`):**
- `font-family: 'Anton'; font-size: 18px; letter-spacing: .04em; text-transform: uppercase;`
- `margin-bottom: 12px; padding-bottom: 8px;`
- `border-bottom: 2px solid rgba(255,214,10,.3);`
- Gradient text (gold to orange)
- **Count**: `<span class="bracket-col-count">2/4</span>` (JetBrains Mono 9px, gray)

**Team in Bracket (`.bracket-team`):**
- `display: flex; align-items: center; gap: 8px;`
- `padding: 8px 10px; margin-bottom: 6px; border-radius: 8px;`
- `font-size: 13px; font-weight: 600; border-left: 3px solid transparent;`
- **`.bracket-team.champ`**: `border-left: var(--gold); background: linear-gradient(90deg, rgba(255,214,10,.15), transparent); animation: champ-glow 2s infinite;`
- **`.bracket-team.final`**: `border-left: var(--orange); background: rgba(251,86,7,.08);`
- **`.bracket-team.sf`**: `border-left: var(--hot-pink); background: rgba(255,0,110,.06);`
- **`.bracket-team.qf`**: `border-left: var(--mexico-green); background: rgba(6,167,125,.06);`
- **`.bracket-team.r16`**: `border-left: var(--usa-bright); background: rgba(58,134,255,.06);`
- **`.bracket-team.r32`**: `border-left: var(--lime); background: rgba(138,201,38,.05);`
- Flag emoji or flag image, team name (flex 1), points (Anton gradient text)

**Teams By Group Section:**

```html
<div class="card">
  <h2>Teams & Status</h2>
  <p class="hint">Performance and stage reached by each national team</p>
  <button class="group-view-toggle" id="groupToggle" onclick="toggleGroupView()">
    <span>📊 Show All 12 Groups</span>
    <span class="arrow">▼</span>
  </button>
  <div class="teamgrid" id="teamgrid"></div>
</div>
```

**Group View Toggle (`.group-view-toggle`):**
- Hidden by default, shown when bracket exists
- `margin-bottom: 12px; padding: 10px 16px;`
- `background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1);`
- `border-radius: 10px; cursor: pointer; width: 100%;`
- **Arrow**: `float: right;` rotates 180deg when `.expanded`

**Team Grid (`.teamgrid`):**
- `display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;`
- Groups rendered as **group-header** (spanning full width) + team boxes

**Group Header (`.group-header`):**
- `grid-column: 1/-1; font-family: 'Anton'; font-size: 32px;`
- `letter-spacing: .04em; margin-top: 16px; padding: 12px 20px;`
- `background: linear-gradient(90deg, rgba(255,214,10,.2), transparent);`
- `border-left: 4px solid var(--gold); border-radius: 12px; text-transform: uppercase;`
- Label (JetBrains Mono 11px, gold) + group letter + standings badge if available

**Team Box (`.teambox`):**
- `background: linear-gradient(135deg, rgba(255,255,255,.05), rgba(255,255,255,.02));`
- `border: 1px solid rgba(255,255,255,.1); padding: 16px; border-radius: 14px;`
- `transition: all .3s; position: relative; overflow: hidden;`
- `:hover`: `transform: translateY(-4px); border-color: var(--gold);`
  - `box-shadow: 0 12px 32px rgba(255,214,10,.15);`
- **`.teambox.eliminated`**: `opacity: .45; ::after` shows "❌ Eliminated" (red text, JetBrains Mono 9px)
- **onClick**: Opens team detail modal via `openTeamModal(teamName)`

**Team Box Content:**
- **`.tn`** (team name): Archivo Black 15px, flex with icon + flag image + name + phase badge
- **`.ts`** (predictions): JetBrains Mono 10px, "🥇 X · 🥈 Y predictions" + position badge if 1st/2nd
- **`.tp`** (match points): Anton 28px, gradient text (gold to orange), "N match pts"

**Phase Badge (`.badge`):**
- `display: inline-block; font-family: 'JetBrains Mono'; font-size: 9px;`
- `padding: 3px 8px; border-radius: 20px; letter-spacing: .1em; font-weight: 700;`
- **`.badge.active`** (in knockout): `background: rgba(138,201,38,.2); border-color: var(--lime); color: var(--lime);`
- **`.badge.champ`**: Gradient (gold to orange), black text, glowing animation

**Render Function:** `renderTeams()` (lines 2419–2543)
- Computes match points per team from finished matches
- Counts 1st/2nd predictions per team
- Displays bracket (if any team advanced beyond group) or all groups
- Groups teams by phase in bracket view

---

### 4.4. **Rules / How It Works** Tab (`panel-rules`)

**Two Language Blocks** (lines 1249–1431):

```html
<div class="lang-content" data-lang-content="en" style="...">
  <div class="rules-hero">...</div>
  <div class="rule-block">1. Make Your Predictions</div>
  <div class="rule-block">2. Group Prediction Bonus</div>
  ... (8 rule blocks total)
</div>

<div class="lang-content" data-lang-content="es" style="display:none">
  <!-- Same structure in Spanish -->
</div>
```

**Rules Hero Section (`.rules-hero`):**
- `background: linear-gradient(135deg, rgba(255,0,110,.15), rgba(58,134,255,.1), rgba(6,167,125,.15));`
- `border: 2px solid transparent; border-image: linear-gradient(135deg, var(--hot-pink), var(--gold), var(--mexico-green)) 1;`
- `border-radius: 24px; padding: 40px; margin-bottom: 28px; position: relative; overflow: hidden;`
- **`::after`**: Soccer emoji ⚽, `font-size: 200px; opacity: .06; transform: rotate(-15deg);` in background
- **`h2`**: Anton 54px, gradient text (gold → orange → pink), "How To Play"
- **`p`**: `font-size: 17px; line-height: 1.7; color: rgba(255,255,255,.9); position: relative; z-index: 1;`

**Rule Block (`.rule-block`):**
- `background: linear-gradient(135deg, rgba(255,255,255,.05), rgba(255,255,255,.01));`
- `border: 1px solid rgba(255,255,255,.08); border-radius: 20px; padding: 28px;`
- `margin-bottom: 16px; position: relative; overflow: hidden;`
- **`::before`** (left accent bar): `left: 0; top: 0; bottom: 0; width: 5px; background: linear-gradient(180deg, var(--hot-pink), var(--gold));`

**Rule Heading (`.rule-block h3`):**
- `font-family: 'Anton'; font-size: 28px; letter-spacing: .02em;`
- `margin-bottom: 14px; display: flex; align-items: center; gap: 14px;`
- `text-transform: uppercase;`
- Gradient text (gold to orange)

**Rule Number Badge (`.rule-num`):**
- `display: inline-flex; align-items: center; justify-content: center;`
- `width: 44px; height: 44px; border-radius: 50%;`
- `background: linear-gradient(135deg, var(--hot-pink), var(--orange));`
- `color: white; font-family: 'Anton'; font-size: 22px; flex-shrink: 0;`
- `box-shadow: 0 4px 16px rgba(255,0,110,.3);`

**Rule Content:**
- **`p`**: `line-height: 1.75; font-size: 15px; margin-bottom: 12px; color: rgba(255,255,255,.85);`
- **`ul`**: `list-style: none; margin: 14px 0;`
  - **`li`**: `padding: 14px 18px; background: linear-gradient(90deg, rgba(255,255,255,.04), transparent);`
    - `border-left: 3px solid var(--gold); border-radius: 0 10px 10px 0; margin-bottom: 8px;`
    - `display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;`
    - **`.label`**: `font-weight: 700; font-size: 15px;`
    - **`.value`**: Anton 26px, gradient text, `letter-spacing: .02em;`

**Example Box (`.example`):**
- `margin-top: 16px; padding: 16px;`
- `background: rgba(0,0,0,.3); border: 1px dashed rgba(255,214,10,.4);`
- `border-radius: 12px; font-family: 'JetBrains Mono'; font-size: 12px;`
- `color: rgba(255,255,255,.7); line-height: 1.8;`
- **`strong`**: `color: var(--gold); font-weight: 800;`
- **`.pts-pill`**: `display: inline-block; padding: 2px 10px; background: linear-gradient(135deg, var(--gold), var(--orange));`
  - `color: var(--ink); border-radius: 20px; font-weight: 900; margin-left: 4px; font-size: 11px;`

**i18n Application:** Via `applyLang()` function, only one `.lang-content` block is visible at a time.

---

### 4.5. **Live / Real-Time** Tab (`panel-live`)

**Live Banner (when matches in progress):**

```html
<div class="live-banner" id="liveBanner" style="display:none">
  <div class="live-banner-header">
    <span class="live-tag">LIVE</span>
    <span>Matches in progress</span>
  </div>
  <div class="live-matches-grid" id="liveMatchesGrid" data-count="2"></div>
</div>
```

**Live Banner Styling:**
- `background: linear-gradient(135deg, rgba(229,57,70,.15), rgba(255,0,110,.1));`
- `border: 2px solid var(--mexico-red); border-radius: 20px; padding: 20px;`
- `margin-bottom: 20px; position: relative; z-index: 2;`

**Live Tag (`.live-tag`):**
- `display: inline-flex; align-items: center; gap: 8px;`
- `background: var(--mexico-red); color: white; padding: 6px 14px;`
- `border-radius: 20px; font-family: 'Archivo Black'; font-size: 11px;`
- `letter-spacing: .15em; font-weight: 900;`
- **`::before` pulse dot**: `width: 9px; height: 9px; border-radius: 50%; background: white; animation: pulse 1s infinite;`

**Live Matches Grid (`.live-matches-grid`):**
- Responsive: `data-count="1"` → 1 col, `"2"` → 2 cols, `"3"` or `"4"` → 2 cols
- Mobile: all 1 col

**Live Match Card (`.live-match-card`):**
- `background: linear-gradient(135deg, rgba(0,0,0,.4), rgba(0,0,0,.2));`
- `border: 1px solid rgba(255,255,255,.15); border-radius: 14px; padding: 18px;`
- `position: relative; overflow: hidden;`

**Match Row (`.live-match-row`):**
- `display: grid; grid-template-columns: 1fr auto 1fr; gap: 14px; align-items: center;`

**Live Team (`.live-team`, `.live-team.away`):**
- `display: flex; align-items: center; gap: 12px; min-width: 0;`
- **`.live-team.away`**: `flex-direction: row-reverse; text-align: right;`
- **Image**: `height: 40px; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,.4); flex-shrink: 0;`

**Team Info (`.live-team-info`):**
- **Name (`.live-team-name`):** Anton 22px, `letter-spacing: .02em`, uppercase, white, max-width with ellipsis
- **Abbr (`.live-team-abbr`):** JetBrains Mono 10px, gray, `letter-spacing: .1em; font-weight: 700; margin-top: 3px;`

**Score Display (`.live-score`):**
- `display: flex; align-items: center; gap: 12px;`
- `font-family: 'Anton'; font-size: 48px; line-height: 1; color: white; justify-content: center;`
- **`.digit`** (each score number): Gradient text (gold to orange), `min-width: 38px; text-align: center;`
  - **`.digit.changed`**: `animation: scoreFlash .8s cubic-bezier(.34,1.56,.64,1);` (scales and glows)
- **Minute** (`.live-minute`): JetBrains Mono 14px, red text, `letter-spacing: .1em; font-weight: 800;`
  - **`::before`**: Pulsing bullet ●

**Match Meta (`.live-match-meta`):**
- `display: flex; justify-content: space-between; align-items: center;`
- `margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,.08);`
- `font-family: 'JetBrains Mono'; font-size: 9px; color: rgba(255,255,255,.5);`
- `letter-spacing: .1em; text-transform: uppercase; gap: 8px; flex-wrap: wrap;`

**Match Events (`.match-events`):**
- `margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,.08);`
- `display: flex; flex-direction: column; gap: 4px; max-height: 140px; overflow-y: auto;`

**Event Row (`.match-event-row`):**
- `display: flex; align-items: center; gap: 8px; font-size: 11px;`
- `padding: 4px 8px; background: rgba(0,0,0,.2); border-radius: 6px;`
- **Minute (`.ev-min`):** JetBrains Mono 10px, gold, `font-weight: 700; min-width: 30px;`
- **Icon (`.ev-ico`):** `font-size: 14px; line-height: 1;`
- **Text (`.ev-text`):** `flex: 1; overflow hidden; text-overflow: ellipsis; white-space: nowrap;`
- **Classes by type**: `.goal`, `.card-y` (yellow), `.card-r` (red), `.sub` (substitution)
  - Each has `border-left: 2px solid` in different colors (lime, gold, red, usa-bright)

**Left Panel (Leaderboard Live):**

```html
<div class="live-grid">
  <div>
    <h2>LEADERBOARD <span class="live" style="...">LIVE</span></h2>
    <div class="tv-leader" id="tvLeader"></div>
  </div>
  <div class="tv-side">
    <div class="tv-panel" id="earningPanel">
      <h3>🔥 Earning Now</h3>
      <div class="earning-panel" id="earningList"></div>
    </div>
    <div class="tv-panel">
      <h3>Recent Matches</h3>
      <div id="tvMatches"></div>
    </div>
    <div class="tv-panel">
      <h3>Team Stages</h3>
      <div id="tvStages"></div>
    </div>
  </div>
</div>
```

**Live Grid Layout (`.live-grid`):**
- `display: grid; grid-template-columns: 2fr 1fr; gap: 24px;`
- Mobile: `1fr; gap: 16px;`

**TV Leaderboard Row (`.tv-row`):**
- `display: grid; grid-template-columns: 60px 1fr auto; gap: 16px;`
- `align-items: center; padding: 16px 20px;`
- `background: linear-gradient(135deg, rgba(255,255,255,.05), rgba(255,255,255,.01));`
- `border: 1px solid rgba(255,255,255,.1); border-radius: 14px;`
- `position: relative; transition: all .3s cubic-bezier(.34,1.56,.64,1);`
- **`.tv-row.tv-top1`**: `background: linear-gradient(135deg, rgba(255,0,110,.2), rgba(255,214,10,.1));`
  - `border-color: var(--gold); box-shadow: 0 0 30px rgba(255,214,10,.15);`
- **`.tv-row.has-live`**: `border-color: var(--lime); box-shadow: 0 0 24px rgba(138,201,38,.15);`
  - **`::after`** (soccer emoji): `content: '⚽'; font-size: 13px; animation: pulse 1.5s infinite;`

**TV Position Badge (`.tv-pos`):**
- `font-family: 'Anton'; font-size: 36px; color: rgba(255,255,255,.3); line-height: 1;`
- **Top 1**: Gradient text (gold to orange)
- **Top 2**: Silver (#c0c0c0)
- **Top 3**: Bronze (#cd7f32)

**TV Name & Picks (`.tv-name`, `.tv-picks`):**
- **Name**: Anton 22px, `letter-spacing: .02em`, uppercase
- **Picks**: JetBrains Mono 10px, gray, `margin-top: 6px; letter-spacing: .04em; font-weight: 600; line-height: 1.5;`

**TV Points (`.tv-pts`):**
- `font-family: 'Anton'; font-size: 38px;`
- Gradient text (gold to orange)
- **`.tv-pts.bumped`**: `animation: pointBump .6s cubic-bezier(.34,1.56,.64,1);`
  - Scales to 1.25 and glows gold at 50%

**Earning Panel (`.earning-panel`, `.earning-item`):**
- `margin-top: 14px;`
- **Item**: `display: flex; align-items: center; gap: 10px; padding: 10px 14px;`
  - `background: rgba(138,201,38,.08); border-left: 3px solid var(--lime);`
  - `border-radius: 0 8px 8px 0; margin-bottom: 6px; animation: slideIn .4s;`
  - **Who**: Archivo Black 12px, flex 1
  - **What**: JetBrains Mono 10px, gray, `margin-top: 2px;`
  - **Gain**: Anton 18px, lime green, `letter-spacing: .02em;`

**TV Panel (`.tv-panel`):**
- `background: linear-gradient(135deg, rgba(255,255,255,.05), rgba(255,255,255,.01));`
- `border: 1px solid rgba(255,255,255,.1); padding: 18px; border-radius: 14px;`
- **Heading**: Anton 20px, `letter-spacing: .04em`, uppercase, gradient text, `margin-bottom: 12px;`
  - `padding-bottom: 8px; border-bottom: 1px solid rgba(255,214,10,.3);`

**Recent Matches in Panel:**
- **Match row**: `padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,.08); font-size: 13px;`
  - `display: flex; justify-content: space-between; align-items: center; gap: 8px;`
  - **Team name (`.mt`)**: Archivo Black 12px, flex 1
  - **Score (`.ms`)**: Anton 20px, gradient text

**Render Function:** `renderTV()` (called when panel-live is active)
- Filters matches to IN_PLAY status
- Renders live leaderboard with points updates
- Shows recent matches and team progression
- Displays earning notifications for picked teams

---

### 4.6. **Admin** Tab (`panel-admin`)

**Admin Lock Card (`#adminLock`):**
- PIN entry (4 digits, password input)
- Submits to `ADMIN_PASS` ("2026")

**Admin Panel (`#adminPanel`, hidden until authenticated):**

Contains 5 sub-sections:

1. **Live Data Sync (Scores)**
   - API Key input (football-data.org)
   - API Base URL override
   - Sync buttons: "↻ Sync Now", "Enable Auto-Sync (90s)"
   - Status indicator (`.api-status`)

2. **Player Management (`#playerMgmt`)**
   - List of players with unlock buttons
   - Populated by `renderPlayerMgmt()`

3. **Match Results (Manual) (`#matchesArea`)**
   - List of matches (editable) or add new match form
   - Buttons: "+ Add Match", "Export Backup", "Reset All"

4. **Group Standings (`#groupStandingsArea`)**
   - Dropdowns for each group (A–L) to set 1st & 2nd finishers
   - Populated by `renderGroupStandings()`

5. **Team Stage Tracker (`#teamPhaseArea`)**
   - Set phase for each team (group, r32, r16, qf, sf, final, champion)
   - Populated by `renderTeamPhases()`

**Admin Card Styling:** Same as main `.card` — gradient background, border, rounded

---

## 5. Internationalization (i18n)

### I18N Object (lines 1618–1733)

```javascript
const I18N = {
  en: { /* 60+ keys */ },
  es: { /* 60+ keys in Spanish */ }
};
```

**Key Groups:**

| Group | Keys | Examples |
|-------|------|----------|
| **Header** | `brandTag`, `subtitle`, `live` | "⚽ Official Pool · June 11 – July 19" |
| **Tabs** | `tabJoin`, `tabRank`, `tabTeams`, `tabRules`, `tabAdmin`, `tabLive` | "🎯 Join Pool", "🏆 Leaderboard" |
| **Menu drawer** | `menuJoin`, `menuRank`, etc. | No emoji (emoji separate) |
| **Join panel** | `joinTitle`, `joinHint`, `yourName`, `yourPhone`, `phoneHint`, `champTitle`, `champHint`, `lockBtn`, etc. | Full form labels and hints |
| **Leaderboard** | `statPlayers`, `statMatches`, `statLeader`, `noPlayers`, `championPick` | Stats and empty state |
| **Teams** | `teamsTitle`, `teamsHint`, `bracketTitle`, `bracketHint` | Section headers |
| **Rules** | EN/ES blocks are separate `<div data-lang-content="en|es">` (not in I18N object) | Full HTML content per language |
| **Live** | `noLiveNow`, `checkLater`, `leaderboard`, `earningNow`, `recentMatches`, `teamStages` | Live panel labels |
| **Admin** | `adminTitle`, `adminPin`, `signIn` | Admin section |
| **Toasts** | `enterName`, `pickAllGroups`, `sameTeamError`, `pickChampion`, `confirmLock` (function), `lockedIn`, `saveFailed`, `wrongPin` | Validation & confirmation messages |

**i18n Application Functions (lines 1735–1766):**

```javascript
let currentLang = localStorage.getItem('usam_lang') || 'en';

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;
}

function applyLang() {
  document.documentElement.lang = currentLang;
  
  // Update all [data-i18n] elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = t(el.getAttribute('data-i18n'));
    if(val) el.innerHTML = val;
  });
  
  // Update all [data-i18n-placeholder] attributes
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const val = t(el.getAttribute('data-i18n-placeholder'));
    if(val) el.placeholder = val;
  });
  
  // Toggle language-specific blocks (rules pages)
  document.querySelectorAll('[data-lang-content]').forEach(el => {
    el.style.display = (el.getAttribute('data-lang-content') === currentLang) ? '' : 'none';
  });
  
  // Update language buttons
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === currentLang);
  });
  
  if(typeof renderAll === 'function') renderAll();
}
```

**Language Toggle:**
- Click `.lang-btn` with `data-lang="en"` or `data-lang="es"`
- Saves to `localStorage.setItem('usam_lang', currentLang)`
- Calls `applyLang()` to re-render

---

## 6. Animations & Effects

### Keyframe Animations

| Name | Duration | Easing | Effect |
|------|----------|--------|--------|
| **`pulse`** | 1.2s | infinite | Opacity: 1 → 0.5 @ 50%, Scale: 1 → 1.3 @ 50% (live dot, crown) |
| **`fadeUp`** | 0.5s | `cubic-bezier(.16,1,.3,1)` | Translate: Y 20px → 0, opacity: 0 → 1 (panel entry) |
| **`slideIn`** | 0.5s | `cubic-bezier(.16,1,.3,1)` | Translate: Y 20px → 0, opacity: 0 → 1 (row entry, staggered per :nth-child) |
| **`crown-bob`** | 2s | infinite | Top-1 crown: Y 0 → -4px @ 50%, rotate: -5deg → 5deg |
| **`champ-glow`** | 2s | infinite | Box-shadow: 0 0 0 rgba(255,214,10,0) → 0 0 20px rgba(255,214,10,.6) @ 50% |
| **`locked-pulse`** | 3s | infinite | Box-shadow: 0 0 0 transparent → 0 0 30px rgba(255,0,110,.3) @ 50% |
| **`goalBounce`** | 0.6s | ease | Scale: 0 → 1.4 @ 50%, rotate: -30deg → 15deg → 0 |
| **`confetti-fall`** | 2s | linear | Translate: Y 0 → 110vh, rotate: 0 → 720deg, opacity: 1 → 0 |
| **`scoreFlash`** | 0.8s | `cubic-bezier(.34,1.56,.64,1)` | Scale: 1 → 1.4 @ 30%, drop-shadow glow, back to 1 |
| **`scoringPulse`** | 1.5s | ease | Box-shadow: 0 0 0 → 0 0 40px rgba(138,201,38,.6) @ 50% |
| **`pointBump`** | 0.6s | `cubic-bezier(.34,1.56,.64,1)` | Scale: 1 → 1.25 @ 50%, drop-shadow gold glow |
| **`modalSlide`** | 0.4s | `cubic-bezier(.16,1,.3,1)` | Translate: Y 40px → 0, scale: 0.95 → 1, opacity: 0 → 1 |

### Cubic Bezier Easing

- **`.34, 1.56, .64, 1`** — "bouncy" ease-out, used for interactive elements (buttons, modals, tabs)
- **`.16, 1, .3, 1`** — smooth ease-out, used for content entry (panels, rows)

### Special Effects

**Confetti (`.confetti-piece`):**
- `position: fixed; top: -20px; width: 10px; height: 14px; z-index: 2999;`
- Fired via `fireConfetti()` on champion/goal
- Random colors, angles, fall duration 2s

**Goal Celebration Banner (`.goal-celebration`):**
- `position: fixed; top: 0; left: 0; right: 0;`
- `transform: translateY(-100%);` → slides down on event
- `.goal-celebration.show`: `transform: translateY(0);`
- `.goal-celebration.goal-team`: Green gradient (lime + mexico-green)
- `.goal-celebration.goal-against`: Red gradient (mexico-red + darker)
- **Icon animation**: `goalBounce` .6s (scales and spins)
- **Auto-hide**: after 5-6 seconds

**Title Flash (`flashTitle()`):**
- Changes document title on goal scored
- Flashes between original and event message

**Score Flash (`.digit.changed`):**
- Added to live score digit when score updates
- Animates scale + gold glow

**Leaderboard Row Pulse (`.row.scoring`, `.tv-row.scoring`):**
- Added when player scores
- `animation: scoringPulse 1.5s ease;`
- Lime glow for 1.5s then removed

---

## 7. Team & Squad Metadata

### Team Identifiers (lines 1768–1845)

**GROUPS** (Official 2026 FIFA Draw, lines 1769–1782):
```javascript
const GROUPS = {
  "A": ["Mexico","South Korea","South Africa","Czechia"],
  "B": ["Canada","Switzerland","Qatar","Bosnia-Herzegovina"],
  "C": ["Brazil","Morocco","Scotland","Haiti"],
  "D": ["USA","Paraguay","Australia","Türkiye"],
  "E": ["Germany","Ecuador","Ivory Coast","Curaçao"],
  "F": ["Netherlands","Japan","Tunisia","Sweden"],
  "G": ["Belgium","Iran","Egypt","New Zealand"],
  "H": ["Spain","Uruguay","Saudi Arabia","Cape Verde"],
  "I": ["France","Senegal","Norway","Iraq"],
  "J": ["Argentina","Austria","Algeria","Jordan"],
  "K": ["Portugal","Colombia","Uzbekistan","DR Congo"],
  "L": ["England","Croatia","Panama","Ghana"]
};
```

**FLAGS** (flagcdn.com ISO codes, lines 1790–1803):
```javascript
const FLAGS = {
  "Mexico":"mx","Brazil":"br","USA":"us","England":"gb-eng","Scotland":"gb-sct",
  "Argentina":"ar","France":"fr","Spain":"es","Germany":"de",
  // ... full mapping for all 48 teams
  "DR Congo":"cd","Uzbekistan":"uz"
};
```
- **URL pattern**: `https://flagcdn.com/w${size}/${code}.png`
- **Example**: Brazil 40px = `https://flagcdn.com/w40/br.png`

**TEAM_ABBR** (3-letter codes, lines 1810–1823):
```javascript
const TEAM_ABBR = {
  "Mexico":"MEX","Brazil":"BRA","USA":"USA","England":"ENG",
  "Argentina":"ARG","France":"FRA","Spain":"ESP","Germany":"GER",
  // ... all 48
};
```
- Used in `teamWithEmoji(team)`: "BRA - Brazil" for select options
- Used in team detail, leaderboard abbreviations

**FLAG_EMOJI** (Unicode country flags, lines 1826–1839):
```javascript
const FLAG_EMOJI = {
  "Mexico":"🇲🇽","Brazil":"🇧🇷","USA":"🇺🇸","England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Scotland":"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  // ... all 48, including special flags for subdivisions (Scotland, England)
};
```

**TEAM_ALIASES** (Robust matching for API integration, lines 1851–1900):
```javascript
const TEAM_ALIASES = {
  "Brazil": ["brazil", "brasil", "bra"],
  "USA": ["usa", "united states", "united states of america", "us soccer", "us"],
  "England": ["england", "eng"],
  // ... all 48, with accent normalization and common API variations
};
```

**Normalization & Matching (lines 1915–1938):**
```javascript
function normalizeTeamName(s) {
  if(!s) return '';
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g,'')  // strip accents
    .replace(/[^\w\s]/g,'')                            // strip punctuation
    .replace(/\s+/g,' ').trim();
}

function resolveTeamName(apiName) {
  // 1. Check normalized alias map
  // 2. Try first significant word (3+ chars)
  // 3. Fallback: substring match
  // Returns canonical name or null
}
```

---

### Squads (lines 1940–2013)

**SQUADS_SEED** — seed data for 5 teams (example):

```javascript
const SQUADS_SEED = {
  "Brazil": [
    {num:1, name:"Alisson", pos:"GK", club:"Liverpool", age:32},
    {num:4, name:"Marquinhos", pos:"DEF", club:"PSG", age:30},
    {num:5, name:"Casemiro", pos:"MID", club:"Man United", age:33},
    {num:10, name:"Rodrygo", pos:"FW", club:"Real Madrid", age:24},
    // ... 11 players shown (1 GK + 4 DEF + 3 MID + 3 FW for formation)
  ],
  "Argentina": [ /* similar */ ],
  "France": [ /* similar */ ],
  "Spain": [ /* similar */ ],
  "England": [ /* similar */ ]
};
```

**Player Object Structure:**
```javascript
{ num: 1, name: "Player Name", pos: "GK|DEF|MID|FW", club: "Club Name", age: 32 }
```

**Squad Display — Pitch Formation (`.pitch`):**
- `background: linear-gradient(180deg, #1a5d2e 0%, #2a7d3e 100%);` (green soccer field)
- `border-radius: 14px; padding: 20px; min-height: 380px;`
- `border: 2px solid rgba(255,255,255,.15); overflow: hidden;`

**Pitch Elements:**
- **Field lines (`.pitch::before, ::after`):** Dashed borders, thin lines
- **Center circle (`.pitch-center-circle`):** `width: 80px; height: 80px; border: 2px solid rgba(255,255,255,.3);`
- **Rows (`.pitch-row`):** `display: flex; justify-content: space-around;` with position classes (`.fw`, `.mid`, `.def`, `.gk`)

**Player Dot (`.player-dot`):**
- `display: flex; flex-direction: column; align-items: center; cursor: pointer;`
- **Dot circle (`.dot`)**: `width: 38px; height: 38px; border-radius: 50%; font-size: 16px; font-weight: 900;`
  - **GK**: Lime + mexico-green gradient
  - **DEF**: USA bright + dark gradient, white text
  - **MID**: Gold + orange gradient (default)
  - **FW**: Hot pink + mexico-red gradient, white text
- **Name (`.pname`):** Archivo Black 10px, max 80px width, ellipsis
- `:hover`: `transform: translateY(-4px) scale(1.08);`

**Squad List View (`.squad-list`):**
- `display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px;`

**Squad Item (`.squad-item`):**
- `display: flex; align-items: center; gap: 10px; padding: 10px 12px;`
- `background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);`
- `border-radius: 10px; cursor: pointer;`
- `:hover`: `border-color: var(--gold); transform: translateY(-2px); background: rgba(255,214,10,.05);`
- **Number circle (`.num`)**: `width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--gold), var(--orange)); color: var(--ink); font-size: 13px; font-weight: 900;`
- **Info (`.info`)**: `flex: 1; min-width: 0;`
  - **Name (`.nm`)**: Archivo Black 12px, ellipsis
  - **Position (`.pos`)**: JetBrains Mono 9px, gray, uppercase

**Position Filter (`.pos-toggle`):**
- `display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap;`
- **Buttons**: Arquivo Black 10px, toggles which positions display in list
- **`.active`**: Gradient background (gold to orange)

**Player Card Modal (`.player-card`):**
- `background: linear-gradient(180deg, #1a3a6b, #0d1f44);`
- `border: 2px solid var(--gold); border-radius: 18px; padding: 24px;`
- `max-width: 340px; box-shadow: 0 20px 60px rgba(0,0,0,.5);`
- **Header**: Number circle (64px, Anton 32px) + name + position
- **Info grid**: 2 columns, rows for team/position/club/age

---

## 8. Scoring & Bonuses

### Scoring Constants (lines 2015–2020)

```javascript
const PHASE_BONUS = {
  group: 0,      // no bonus for staying in group
  r32: 3,        // Round of 32
  r16: 5,        // Round of 16
  qf: 10,        // Quarter-Finals
  sf: 20,        // Semi-Finals
  final: 30,     // Final (runner-up)
  champion: 50   // World Champion
};

const PHASE_LABELS = {
  group: "Group Stage",
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarter-Finals",
  sf: "Semi-Finals",
  final: "Final",
  champion: "Champion"
};

const PHASE_ORDER = ['group','r32','r16','qf','sf','final','champion'];
```

### Points Computation (`computePoints()`, lines 2284–2350)

**1. Match Points (per picked team):**
- **Win**: +3 pts
- **Draw**: +1 pt
- **Each goal scored**: +1 pt
- **Clean sheet** (0 conceded): +1 pt
- **Upset win** (flagged in match): +5 pts
- **Example**: Brazil 3–0 Haiti = 3 (win) + 3 (goals) + 1 (clean sheet) = **7 pts**

**2. Knockout Stage Bonuses (cumulative if team advances):**
- **Reached R32**: +3 pts
- **Reached R16**: +5 pts
- **Reached QF**: +10 pts
- **Reached SF**: +20 pts
- **Reached Final**: +30 pts
- **Won Champion**: +50 pts

**3. Group Prediction Bonuses (per group):**
- **Perfect** (1st & 2nd correct in order): +8 pts per group
- **Swapped** (both correct but reversed): +4 pts per group
- **Half** (one of two qualified): +2 pts per group
- **Max per tournament**: 8 groups × 8 pts = 96 pts

**4. Champion Pick Bonus:**
- **Champion pick wins Cup**: +50 pts (binary, applied once)

**Returned Object:**
```javascript
{
  total: 1523,          // sum of all points
  breakdown: {          // points per picked team
    "Brazil": 145,
    "Argentina": 128,
    // ...
  },
  groupBonuses: {       // group prediction bonuses
    "A": {bonus: 8, kind: "perfect"},
    "C": {bonus: 4, kind: "swapped"},
    // ...
  },
  championBonus: 50     // 0 or 50
}
```

---

## 9. State Management & Storage

### Storage Keys (lines 2092–2114)

All stored in `window.storage` (IndexedDB via `sGet` / `sSet`):

| Key | Value Type | Content |
|-----|------------|---------|
| `usam2026v2:players` | `{id: Player}` | All registered players with picks |
| `usam2026v2:matches` | `[Match]` | Match results (scores, phase, etc.) |
| `usam2026v2:phases` | `{team: phase}` | Current stage per team |
| `usam2026v2:standings` | `{group: {first, second}}` | Confirmed group winners |
| `usam2026v2:squads` | `{team: [Player]}` | Squad rosters (defaults to SQUADS_SEED) |
| `usam2026v2:apiconfig` | `{key, base, autoSync}` | API configuration (admin) |
| `usam_lang` | `"en" \| "es"` | Current language preference |
| `usam_myphone` | `string` | Logged-in player's phone (for goal celebrations) |

### Player Object Structure

```javascript
{
  name: "John Silva",
  phone: "(555) 123-4567",
  phoneDigits: "5551234567",  // for matching
  picks: ["Brazil", "Argentina", ..., "France"],  // all 24 teams
  firsts: {A: "Mexico", B: "Canada", ..., L: "England"},   // 1st place per group
  seconds: {A: "South Korea", B: "Switzerland", ..., L: "Croatia"},  // 2nd place per group
  champion: "Brazil",
  locked: true,
  ts: 1718000000  // timestamp locked
}
```

### Match Object Structure

```javascript
{
  id: "unique_id",
  teamA: "Brazil",
  teamB: "Haiti",
  scoreA: 3,
  scoreB: 0,
  status: "FINISHED" | "IN_PLAY" | "PAUSED",  // or undefined
  phase: "group" | "r32" | "r16" | "qf" | "sf" | "final",
  ts: 1718000000,  // timestamp or unix
  upset: false     // admin-flagged
}
```

### Storage Functions (lines 2093–2100)

```javascript
async function sGet(key, fallback) {
  try {
    const r = await window.storage.get(key, true);
    return r ? JSON.parse(r.value) : fallback;
  } catch {
    return fallback;
  }
}

async function sSet(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value), true);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
```

### Render & Load Cycle

```javascript
async function loadAll() {
  // Load all data from storage
  players = await sGet('usam2026v2:players', {});
  matches = await sGet('usam2026v2:matches', []);
  teamPhases = await sGet('usam2026v2:phases', {});
  groupStandings = await sGet('usam2026v2:standings', {});
  const savedSquads = await sGet('usam2026v2:squads', null);
  squads = savedSquads || SQUADS_SEED;  // default to seed
  
  // Load API config
  const cfg = await sGet('usam2026v2:apiconfig', null);
  if(cfg) apiConfig = {...apiConfig, ...cfg};
  
  // Render all panels
  renderAll();
}

function renderAll() {
  buildPicksGrid();
  renderRanking();
  renderTeams();
  renderAdminMatches();
  renderTeamPhases();
  renderPlayerMgmt();
  renderGroupStandings();
  renderAPIStatus();
  if(document.getElementById('panel-live').classList.contains('active')) renderTV();
}
```

### Rate Limiting & Sync Lock (lines 2027–2074)

**Football-data.org Rate Limit** (10 req/min):
- Tracks call timestamps
- Safety threshold: 7 calls/min (leaves 3-call buffer)
- Shared across tabs via storage lock

**Sync Lock** (prevents concurrent API hits):
- `usam2026v2:synclock` key
- TTL: 2 minutes
- Only one tab runs auto-sync at a time

---

## Summary for React Migration

When converting to React:

1. **Design tokens** → CSS-in-JS or Tailwind config (all hex codes, gradients, font families)
2. **Layout/Header** → `<Header>` component with nested branding, language switcher, host flags
3. **Tabs & Mobile Menu** → Tabs navigation component + drawer component with state
4. **Panels** → Conditionally rendered components (Join, Leaderboard, Teams, Rules, Live, Admin)
5. **Cards & Forms** → Reusable card component, form inputs with validation
6. **Modals** → Team detail modal, player card modal (conditionally displayed)
7. **Animations** → CSS classes or Framer Motion for @keyframes transitions
8. **i18n** → i18next or context provider for language switching
9. **State** → Context (players, matches, phases, squads) + localStorage persistence
10. **Scoring logic** → Pure function `computePoints(player)` ported as-is
11. **Squads & formations** → Reusable squad display components (pitch + list view)
12. **Live features** → Real-time score updates, goal celebrations, score flashing

All visual hierarchy, spacing, typography, and color schemes must remain pixel-perfect.

---

**End of Spec — 3638 source lines encoded into structured design, behavior, and state.**

