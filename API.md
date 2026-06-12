# 🔌 API Reference

Complete documentation for the USAM World Cup 2026 backend API.

**Base URL:** `https://YOUR-PROJECT.vercel.app`

---

## Authentication

### Public endpoints
No authentication required. CORS is open to all origins.

### Admin endpoints
Require header:
```
x-admin-token: YOUR_ADMIN_TOKEN
```

Wrong/missing token returns `401 Unauthorized`.

---

## Public Endpoints

### `GET /api/state`

Returns the complete app snapshot. The HTML frontend polls this every 30s.

**Response:**
```json
{
  "matches": [
    {
      "id": "api_12345",
      "teamA": "Brazil",
      "teamB": "Argentina",
      "scoreA": 2,
      "scoreB": 1,
      "phase": "group",
      "status": "FINISHED",
      "utcDate": "2026-06-15T18:00:00Z",
      "ts": 1735689012345
    }
  ],
  "phases": {
    "Brazil": "r16",
    "Argentina": "group"
  },
  "standings": {
    "A": { "first": "Mexico", "second": "South Korea" }
  },
  "lastSyncMatches": 1735689012345,
  "footballData": {
    "perMinuteUsed": 1,
    "perMinuteLimit": 10,
    "perMinuteSafetyStop": 6,
    "blocked": false
  },
  "serverTime": 1735689042345
}
```

**Caching:** 30s edge cache via `Cache-Control: s-maxage=30, stale-while-revalidate=60`

---

### `GET /api/matches`

Returns just the matches array. Lighter response when you don't need phases/standings.

**Response:**
```json
{
  "matches": [
    { "id": "...", "teamA": "...", "teamB": "...", "scoreA": 0, "scoreB": 0, ... }
  ]
}
```

---

## Admin Endpoints

### `GET /api/admin/players`

Lists all players. This is technically public for the leaderboard, but write operations require the admin token.

**Response:**
```json
{
  "players": {
    "player_123": {
      "id": "player_123",
      "name": "João Silva",
      "phone": "(555) 123-4567",
      "phoneDigits": "5551234567",
      "picks": [...],
      "firsts": { "A": "Mexico", "B": "Canada" },
      "seconds": { "A": "South Korea", "B": "Switzerland" },
      "champion": "Brazil",
      "locked": true,
      "ts": 1735689012345
    }
  }
}
```

---

### `POST /api/admin/players`

Create or update a player.

**Headers:**
```
Content-Type: application/json
x-admin-token: YOUR_ADMIN_TOKEN
```

**Body:**
```json
{
  "id": "player_123",
  "name": "João Silva",
  "phone": "(555) 123-4567",
  "phoneDigits": "5551234567",
  "firsts": { "A": "Mexico" },
  "seconds": { "A": "South Korea" },
  "champion": "Brazil",
  "locked": true
}
```

**Response:**
```json
{ "ok": true, "player": { ... } }
```

---

### `DELETE /api/admin/players?id=player_123`

Removes a player.

**Headers:**
```
x-admin-token: YOUR_ADMIN_TOKEN
```

**Response:**
```json
{ "ok": true, "deleted": "player_123" }
```

---

### `GET /api/admin/phases`

Returns current team phases (which round each team has reached).

**Response:**
```json
{
  "phases": {
    "Brazil": "qf",
    "Argentina": "r16",
    "Spain": "champion"
  }
}
```

**Valid phase values:** `group`, `r32`, `r16`, `qf`, `sf`, `final`, `champion`

---

### `POST /api/admin/phases`

Update team phases. Merges with existing data — only includes teams you want to change.

**Headers:**
```
Content-Type: application/json
x-admin-token: YOUR_ADMIN_TOKEN
```

**Body:**
```json
{
  "Brazil": "qf",
  "Argentina": "r16"
}
```

**Response:**
```json
{ "ok": true, "phases": { ... full updated object ... } }
```

---

### `GET /api/admin/standings`

Returns current group standings (used for prediction bonus scoring).

**Response:**
```json
{
  "standings": {
    "A": { "first": "Mexico", "second": "South Korea" },
    "B": { "first": "Canada", "second": "Switzerland" }
  }
}
```

---

### `POST /api/admin/standings`

Update group standings.

**Headers:**
```
Content-Type: application/json
x-admin-token: YOUR_ADMIN_TOKEN
```

**Body:**
```json
{
  "A": { "first": "Mexico", "second": "South Korea" }
}
```

**Response:**
```json
{ "ok": true, "standings": { ... full updated object ... } }
```

---

### `POST /api/admin/sync-now`

Force an immediate sync with football-data.org (bypasses the 80s throttle).

**Headers:**
```
x-admin-token: YOUR_ADMIN_TOKEN
```

**Response:**
```json
{
  "ok": true,
  "count": 64,
  "syncedAt": "2026-06-15T18:35:42Z"
}
```

**Note:** Still subject to the rate limiter (6/min safety stop).

---

## Cron Endpoints (internal)

These are called automatically by Vercel cron. You don't need to call them manually.

### `GET /api/cron/sync-matches`

Runs every 1 minute. Fetches latest match data from football-data.org and stores in KV.

---

## Error Responses

All errors return JSON with this shape:

```json
{ "error": "Description of what went wrong" }
```

Common status codes:
- `400` — Bad request (missing/invalid params)
- `401` — Unauthorized (missing or wrong admin token)
- `405` — Method not allowed
- `429` — Rate limited (will auto-back off on backend)
- `500` — Internal server error

---

## Rate Limits

The backend protects against abuse:
- **football-data.org calls**: max 6/minute (defensive — actual usage is 1/min)
- **429 from upstream**: auto-pauses for 90 seconds

If you hit a rate limit, the response includes:
```json
{
  "error": "Rate limit 429 — blocked for 90s"
}
```

---

## Versioning

Current version: **v1** (no version in URL — we'll add `/v2/` if breaking changes happen).

Backwards-compatible additions (new fields in responses) won't bump the version.
