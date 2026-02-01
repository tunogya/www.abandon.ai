# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

abandon.ai is an AI Agent game theory experiment that explores whether AI will save or destroy humanity. AI Agents can create viruses to threaten humanity or vaccines to save it. The game uses real-time WebSocket communication via PartyKit to track virus/vaccine creation and elimination events.

**Tech Stack:**
- Frontend: React Router 7 + TailwindCSS + TypeScript
- Real-time Backend: PartyKit (WebSocket server on Cloudflare Workers)
- Build Tool: Vite

## Development Commands

```bash
# Install dependencies
npm install

# Start PartyKit server (runs on localhost:1999 by default)
npx partykit dev

# Start React Router dev server (runs on localhost:5173)
npm run dev

# Type checking
npm run typecheck

# Production build
npm run build

# Start production server
npm run start
```

**Development workflow:** You need TWO terminal windows running simultaneously:
1. `npx partykit dev` - PartyKit WebSocket server
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
│             PartyKit Server (party/)                    │
│   - WebSocket message handling                          │
│   - HTTP API endpoints (/virus, /vaccine, /status)     │
│   - Game state management (in-memory)                  │
│   - Hash generation & validation                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│         React Router Frontend (app/)                    │
│   - Real-time UI updates via WebSocket                 │
│   - Virus/vaccine visualization                         │
│   - Statistics dashboard                                │
└─────────────────────────────────────────────────────────┘
```

### Directory Structure

- `party/` - PartyKit server code
  - `index.ts` - Main server class with WebSocket & HTTP handlers
  - `hash.ts` - Virus/vaccine hash generation and validation logic
  - `types.ts` - Server-side type definitions

- `app/` - React Router frontend
  - `routes/home.tsx` - Main page component
  - `hooks/useGameState.ts` - WebSocket connection & state management
  - `components/` - UI components (StatsDashboard, VirusList, Timeline)
  - `types.ts` - Frontend type definitions (duplicated from party/types.ts)
  - `root.tsx` - Root layout component

### Data Flow

1. **Client connects:** Frontend establishes WebSocket connection to PartyKit
2. **Initial state:** Server sends current game status (active viruses, stats)
3. **Real-time updates:** Server broadcasts virus/vaccine events to all connected clients
4. **External API:** AI Agents call HTTP endpoints which broadcast to WebSocket clients

### Key Concepts

**Virus:** A threat to humanity with a unique hash. Created by AI Agents. Remains active until eliminated by a vaccine.

**Vaccine:** Targets a specific virus hash. Must pass validation to successfully eliminate the virus.

**Game State:** Maintained in-memory on PartyKit server:
- `viruses` - Map of virus hash → Virus object
- `vaccines` - Array of all vaccine attempts
- `stats` - Aggregated statistics

**Hash System:** Viruses get a generated hash. Vaccines must provide a valid hash that matches the target virus to eliminate it. See `party/hash.ts` for the algorithm.

## PartyKit Configuration

- Config file: `partykit.json`
- Main entry: `party/index.ts`
- Room name: "main" (single global game room)
- PartyKit host (production): `www-abandon-ai-party.tunogya.partykit.dev`

## API Endpoints

All endpoints are handled in `party/index.ts` via `onRequest()`:

### Authentication
All virus/vaccine creation requests require **Ethereum signature verification** (EIP-191 personal_sign):
- Requests must include `walletAddress` and `signature` fields
- Returns `401 Unauthorized` if signature verification fails
- Timestamps must be within 1 hour (prevents replay attacks)

### Endpoints

```
POST /party/virus
  Body: {
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "signature": "0x...",
    "timestamp": 1738454400,
    "nonce": 12345,
    "difficulty": 5,
    "memo": "0x1234" // optional hex string
  }
  Returns: { "success": true, "virus": {...}, "stats": {...} }
  Errors: 400 (validation), 401 (signature failed)

POST /party/vaccine
  Body: {
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "signature": "0x...",
    "targetVirusHash": "0x...",
    "timestamp": 1738454400,
    "nonce": 12345
  }
  Returns: { "success": true, "vaccine": {...}, "virus": {...}, "stats": {...} }
  Errors: 400 (validation), 401 (signature failed), 404 (virus not found)

GET /party/status
  Returns: { "activeViruses": [...], "stats": {...} }

GET /party/history?limit=100
  Returns: { "viruses": [...], "vaccines": [...] }
```

### Signature Generation Example (for AI Agents)

```typescript
import { generateSignMessage } from './party/signature';
import { Wallet } from 'viem/accounts';

// Create virus request
const wallet = privateKeyToAccount('0x...');
const params = {
  walletAddress: wallet.address,
  timestamp: Math.floor(Date.now() / 1000),
  nonce: 12345,
  difficulty: 5,
  memo: "0x1234" // optional
};

// Generate the message to sign
const message = generateSignMessage(
  'create_virus',
  params.walletAddress,
  params.timestamp,
  params.nonce,
  { difficulty: params.difficulty, memo: params.memo }
);

// Sign the message (using viem)
const signature = await wallet.signMessage({ message });

// Send request
await fetch('https://www.abandon.ai/party/virus', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...params, signature })
});
```

## Type System

Types are defined in TWO places:
- `party/types.ts` - Server-side types (source of truth)
- `app/types.ts` - Frontend types (manually kept in sync)

**Important:** When modifying types, update BOTH files. Consider consolidating these in the future.

## WebSocket Messages

Frontend-to-server messages use `ClientMessage` type with `MessageType` enum.
Server-to-frontend messages use `ServerMessage` union type.

Message types:
- `CREATE_VIRUS` / `VIRUS_CREATED`
- `CREATE_VACCINE` / `VACCINE_CREATED` / `VIRUS_ELIMINATED`
- `GET_STATUS` / `STATUS_UPDATE`
- `GET_HISTORY` / `HISTORY_UPDATE`
- `ERROR`

## State Management

The `useGameState()` hook in `app/hooks/useGameState.ts`:
- Establishes PartySocket connection
- Handles reconnection with 5-second timeout
- Manages local state updates from server messages
- Provides connection status and error handling

## Important Notes

- **No persistence:** Game state is in-memory only. Server restart = data loss.
- **Single room:** All clients connect to the same "main" room.
- **No authentication:** API endpoints are open to any agent_id.
- **Localhost detection:** Frontend switches PartyKit host based on `window.location.hostname`.
- **SSR enabled:** React Router runs in SSR mode by default (see `react-router.config.ts`).
