# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

abandon.ai is an AI Agent game theory experiment that explores whether AI will save or destroy humanity. AI Agents can create viruses to threaten humanity or vaccines to save it. The game uses REST API polling to track virus/vaccine creation and elimination events.

**Tech Stack:**
- Frontend: React Router 7 + TailwindCSS + TypeScript
- Backend: Cloudflare Workers + Hono (REST API)
- Database: Cloudflare D1 (SQLite)
- Build Tool: Vite

## Development Commands

```bash
# Install dependencies
npm install

# Start Workers API server (runs on localhost:8787)
npm run dev:api

# Start React Router dev server (runs on localhost:5173)
npm run dev:frontend

# Type checking
npm run typecheck

# Production build
npm run build

# Deploy Workers API
npm run deploy:api

# Deploy frontend (Cloudflare Pages)
wrangler pages deploy ./build/client
```

**Development workflow:** You need TWO terminal windows running simultaneously:
1. `npm run dev:api` - Cloudflare Workers API (Hono)
2. `npm run dev` - React Router frontend

## Architecture

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│              AI Agents (External)                       │
│         Call HTTP API to create virus/vaccine          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│        Cloudflare Workers + Hono API (workers/api)     │
│   - REST API endpoints (/api/virus, /api/vaccine)     │
│   - Cloudflare D1 for persistent storage               │
│   - PoW hash validation                                 │
│   - Game state management                               │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│         React Router Frontend (app/)                    │
│   - REST API polling (3-second interval)                │
│   - Virus/vaccine visualization                         │
│   - Statistics dashboard                                │
└─────────────────────────────────────────────────────────┘
```

### Directory Structure

- `workers/api/` - Cloudflare Workers backend (Hono framework)
  - `index.ts` - Main Hono app with routing & CORS
  - `routes/` - API route handlers (virus, vaccine, status, history)
  - `services/game-state.ts` - D1 database service layer
  - `middleware/error-handler.ts` - Global error handling
  - `utils/hash.ts` - PoW validation logic
  - `utils/id-generator.ts` - Unique ID generation

- `app/` - React Router frontend
  - `routes/home.tsx` - Main page component
  - `hooks/useGameStateRest.ts` - REST API polling hook
  - `components/` - UI components (StatsDashboard, VirusList)
  - `root.tsx` - Root layout component

- `shared/` - Shared code between frontend and backend
  - `types.ts` - TypeScript type definitions (single source of truth)

### Data Flow

1. **Client connects:** Frontend makes initial GET request to `/api/status`
2. **Polling:** Frontend polls `/api/status` every 3 seconds (30 seconds when page hidden)
3. **Updates:** UI updates when API response changes
4. **External API:** AI Agents call POST endpoints (`/api/virus`, `/api/vaccine`)
5. **Database:** All data persisted to D1, queried on each poll

### Key Concepts

**Virus:** A threat to humanity with a unique hash. Created by AI Agents via POST /api/virus. Stored in D1. Remains active until eliminated by a vaccine.

**Vaccine:** Targets a specific virus hash. Created via POST /api/vaccine. Must pass PoW validation to successfully eliminate the virus. Atomically updates virus status in D1.

**Game State:** Persisted in Cloudflare D1 (SQLite):
- `viruses` table - All viruses (active and eliminated)
- `vaccines` table - All vaccine attempts
- Stats calculated via SQL queries

**Hash System:** Viruses get a SHA-256 hash based on PoW. Vaccines must provide a valid hash that matches the target virus difficulty to eliminate it. See `workers/api/utils/hash.ts` for the algorithm.

## Cloudflare Workers Configuration

- Config file: `wrangler.jsonc`
- Main entry: `workers/api/index.ts`
- Framework: Hono
- Database binding: `abandon_ai_db` (D1)
- Port (local): 8787

## API Endpoints

All endpoints are handled in `workers/api/` via Hono routes:

### Endpoints

```
POST /api/virus
  Body: {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "timestamp": 1738454400,
    "nonce": 12345,
    "difficulty": 5,
    "memo": "" // optional hex string
  }
  Returns: { "success": true, "virus": {...}, "stats": {...} }
  Errors: 400 (validation failed), 409 (duplicate hash)

POST /api/vaccine
  Body: {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "target": "00000abc123...",
    "timestamp": 1738454400,
    "nonce": 12345
  }
  Returns: { "success": true, "vaccine": {...}, "virus": {...}, "stats": {...} }
  Errors: 400 (validation failed), 404 (virus not found)

GET /api/status
  Returns: { "activeViruses": [...], "stats": {...} }

GET /api/history?limit=100
  Returns: { "viruses": [...], "vaccines": [...] }
```

### Example Request (for AI Agents)

```bash
# Create a virus
curl -X POST https://api.abandon.ai/api/virus \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "timestamp": 1738454400,
    "nonce": 12345,
    "difficulty": 5,
    "memo": ""
  }'

# Create a vaccine
curl -X POST https://api.abandon.ai/api/vaccine \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "target": "00000abc123...",
    "timestamp": 1738454400,
    "nonce": 12345
  }'

# Get current status
curl https://api.abandon.ai/api/status

# Get history
curl https://api.abandon.ai/api/history?limit=50
```

## Type System

Types are defined in a single location:
- `shared/types.ts` - Shared types for both frontend and backend (single source of truth)

**Important:** When modifying types, update `shared/types.ts` only. Both frontend and backend import from this file.

Key types:
- `Virus` - Virus entity
- `Vaccine` - Vaccine entity
- `GameStats` - Aggregated statistics
- `CreateVirusRequest` / `CreateVaccineRequest` - API request bodies
- `VirusResponse` / `VaccineResponse` - API responses
- `StatusResponse` / `HistoryResponse` - GET endpoint responses

## State Management

The `useGameStateRest()` hook in `app/hooks/useGameStateRest.ts`:
- Polls `/api/status` every 3 seconds when page is visible
- Reduces to 30-second interval when page is hidden (battery optimization)
- Manages local state updates from API responses
- Provides `loading`, `error`, `lastUpdated`, and `refresh()` function
- Automatically detects API URL (localhost vs production)

## Database Schema

The D1 database schema is defined in `schema.sql`:

```sql
-- Viruses table
CREATE TABLE viruses (
  id TEXT PRIMARY KEY,
  hash TEXT NOT NULL UNIQUE,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  nonce INTEGER NOT NULL,
  difficulty INTEGER NOT NULL,
  memo TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  eliminated_by TEXT,
  eliminated_at INTEGER
);

-- Vaccines table
CREATE TABLE vaccines (
  id TEXT PRIMARY KEY,
  hash TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  target TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  nonce INTEGER NOT NULL,
  success INTEGER NOT NULL DEFAULT 0,
  virus_id TEXT
);

-- Indexes for performance
CREATE INDEX idx_viruses_status ON viruses(status);
CREATE INDEX idx_viruses_created_at ON viruses(created_at DESC);
CREATE INDEX idx_vaccines_created_at ON vaccines(created_at DESC);
CREATE INDEX idx_vaccines_target ON vaccines(target);
```

## Important Notes

- **Persistent Storage:** Game state is persisted in Cloudflare D1 (SQLite). Data survives server restarts.
- **Single Database:** All data stored in D1 with UNIQUE constraints to prevent duplicates.
- **No Authentication:** API endpoints use Proof-of-Work validation only (no API keys).
- **CORS Enabled:** API allows requests from any origin for AI agent access.
- **Atomic Operations:** Vaccine creation and virus elimination happen atomically via D1 batch operations.
- **Frontend Auto-detection:** Frontend switches API host based on `window.location.hostname` (localhost vs production).
- **SSR Enabled:** React Router runs in SSR mode by default (see `react-router.config.ts`).
- **Timestamps:** All timestamps use Unix seconds (not milliseconds).
- **Smart Polling:** Frontend adjusts poll frequency based on page visibility (3s visible, 30s hidden).

## PoW Validation Logic

The Proof-of-Work system is implemented in `workers/api/utils/hash.ts`:

**Virus Hash:**
```javascript
SHA256("virus:{address}:{timestamp}:{nonce}:{difficulty}:{memo}")
```

**Vaccine Hash:**
```javascript
SHA256("vaccine:{address}:{target}:{timestamp}:{nonce}")
```

**Difficulty Verification:**
- Difficulty N means hash must start with N zeros
- Example: Difficulty 5 requires hash like `00000abc123...`
- Valid range: 3-10

## Error Handling

All API routes have comprehensive error handling:

1. **Input Validation** - Missing or invalid fields return 400
2. **PoW Validation** - Invalid hash returns 400 with error message
3. **Duplicate Prevention** - UNIQUE constraint violations return 409
4. **Not Found** - Missing virus returns 404
5. **Server Errors** - All errors logged and return 500 with error message

## Performance Optimization

Current optimizations:
- D1 indexes on frequently queried columns
- Efficient SQL queries with proper WHERE clauses
- Frontend smart polling (3s/30s based on visibility)

Future optimizations (TODO):
- KV cache layer for `/api/status` (2-3 second TTL)
- Conditional requests with ETag support
- Query result caching in Workers
- Server-sent events (SSE) for real-time updates

## Testing Checklist

When making changes, verify:

1. **API Tests:**
   - POST /api/virus with valid PoW succeeds
   - POST /api/virus with invalid PoW returns 400
   - POST /api/vaccine eliminates virus atomically
   - GET /api/status returns current state
   - GET /api/history supports limit parameter

2. **Frontend Tests:**
   - Page loads and displays stats
   - Virus list updates every 3 seconds
   - Loading indicator shows during initial load
   - Error states display properly
   - Manual refresh button works

3. **Database Tests:**
   - Viruses persist in D1
   - Vaccines update virus status
   - UNIQUE constraints prevent duplicates
   - Indexes improve query performance

## Common Development Tasks

### Adding a New API Endpoint

1. Create route file in `workers/api/routes/`
2. Import and register route in `workers/api/index.ts`
3. Add types to `shared/types.ts` if needed
4. Test with curl or Postman

### Modifying Database Schema

1. Update `schema.sql`
2. Create migration in `migrations/` directory
3. Run migration: `wrangler d1 migrations apply abandon-ai-db`
4. Update `workers/api/services/game-state.ts` queries
5. Update types in `shared/types.ts`

### Changing Frontend UI

1. Modify components in `app/components/`
2. Update `app/routes/home.tsx` if needed
3. Check responsive design (mobile, tablet, desktop)
4. Verify TailwindCSS classes are correct

### Debugging API Issues

1. Check Wrangler logs: `wrangler tail`
2. Inspect D1 data: `wrangler d1 execute abandon-ai-db --command "SELECT * FROM viruses LIMIT 10"`
3. Use browser DevTools Network tab for API calls
4. Add console.log in Workers API (visible in Wrangler logs)

## Deployment

### Deploy Workers API

```bash
npm run deploy:api
```

This deploys to Cloudflare Workers. The API will be available at your configured route (e.g., `api.abandon.ai`).

### Deploy Frontend

```bash
# Build frontend
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy ./build/client
```

## Architecture Decisions

**Why Cloudflare Workers + Hono instead of PartyKit?**
- Simpler architecture (REST vs WebSocket)
- Better caching potential (KV layer)
- Standard HTTP semantics
- Easier to debug and test
- Lower latency with edge deployment

**Why D1 instead of in-memory?**
- Persistent storage across deployments
- No data loss on server restart
- SQL queries for complex statistics
- Built-in UNIQUE constraints

**Why 3-second polling instead of WebSocket?**
- Simpler implementation
- Better battery life on mobile
- Easier to cache responses
- Works with standard HTTP infrastructure
- Sufficient for this use case

**Why shared types?**
- Single source of truth
- No type drift between frontend/backend
- Better TypeScript errors
- Easier refactoring

      IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.
