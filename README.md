# USAM World Cup 2026 — Backend (Minimal)

Backend 24/7 no Vercel que consulta a **football-data.org** a cada 1 minuto e armazena os placares no Vercel KV. O HTML só LÊ deste backend — quota é independente do número de usuários.

**Escopo intencionalmente minimalista:**
- ✅ Placar e status dos jogos
- ✅ Fase do torneio (grupo / R16 / QF / SF / final)
- ✅ Players, phases, standings (gerenciados via admin)
- ❌ Sem gols/cartões/substituições por jogador
- ❌ Sem escalações
- ❌ Sem squads

---

## 📊 API usada

### football-data.org (única API)

**Limite (free tier):** 10 requisições por **MINUTO**

**Nosso uso:**
- Cron `sync-matches` roda **a cada 1 min** (mínimo do Vercel free)
- Cada execução faz **1 chamada**
- Resultado: **1 req/min = 10% do limite** ✅

**Margem de segurança:**
- Usamos 1 de 10 reqs/min
- Sobram **9 reqs/min** de buffer pra:
  - Botão "Sync Now" manual no admin
  - Refresh de página
  - Imprevistos

**Proteções no código (defensivas):**
- Sliding window: pára em 6/10 reqs por minuto
- Detecta erro 429 e pausa por 90 segundos
- CORS aberto pra qualquer cliente ler

---

## 🚀 Setup

### 1. Pegar a chave grátis
https://www.football-data.org/client/register

### 2. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 3. Deploy
```bash
cd usam-backend
vercel login
vercel link             # Cria novo projeto
```

### 4. Vercel KV (grátis)
1. Abra o projeto em https://vercel.com
2. Storage tab → Create Database → KV
3. Nome: `usam-kv`
4. Connect to project (env vars adicionadas automaticamente)

### 5. Env vars
```bash
vercel env add FOOTBALL_DATA_API_KEY       # cola chave football-data.org
vercel env add ADMIN_TOKEN                 # string aleatória 32 chars
```

Para cada um, selecione **Production, Preview, Development**.

### 6. Deploy
```bash
vercel --prod
```

Anote a URL final.

### 7. Atualizar o HTML
No `usam-world-cup-2026.html`, início do `<script>`:
```javascript
const BACKEND_URL = 'https://SEU-PROJETO.vercel.app';
const ADMIN_TOKEN_CLIENT = 'SUA-ADMIN-TOKEN';
```

Veja `CLAUDE.md` pra integração frontend completa.

---

## 🔌 Endpoints

### Públicos (read-only)
- `GET /api/state` — Snapshot: matches, phases, standings, lastSync, rateLimit info
- `GET /api/matches` — Só matches

### Admin (header `x-admin-token`)
- `GET/POST/DELETE /api/admin/players` — CRUD de jogadores
- `GET/POST /api/admin/phases` — Atualizar fases
- `GET/POST /api/admin/standings` — Atualizar classificações de grupo
- `POST /api/admin/sync-now` — Forçar sync imediato

### Cron (Vercel chama sozinho)
- `GET /api/cron/sync-matches` — A cada 1 min

---

## 📁 Estrutura

```
usam-backend/
├── README.md              ← este arquivo
├── CLAUDE.md              ← instruções pro Claude Code
├── package.json
├── vercel.json            ← config de cron + CORS
├── lib/
│   ├── kv.js              ← wrapper KV
│   ├── football-data.js   ← cliente football-data.org + rate limit
│   └── team-aliases.js    ← matching robusto de nomes
└── api/
    ├── state.js           ← snapshot completo
    ├── matches.js         ← só matches
    ├── admin/
    │   ├── players.js
    │   ├── phases.js
    │   ├── standings.js
    │   └── sync-now.js
    └── cron/
        └── sync-matches.js  (1× por minuto)
```
