# Cloudflare D1 Setup Guide

This guide explains how to set up Cloudflare D1 database for persistent storage in the abandon.ai project.

## Overview

PartyKit servers restart every 24 hours, causing all in-memory data to be lost. To solve this, we use Cloudflare D1 (SQLite) for persistent storage while maintaining fast in-memory reads for WebSocket responses.

## Architecture

- **Write**: Data is written to both D1 (persistent) and memory (fast reads)
- **Read**: All reads come from memory for low latency
- **Initialization**: On server startup, data is loaded from D1 into memory
- **Fallback**: Local development works without D1 (memory-only mode)

## Setup Steps

### 1. Create D1 Database

```bash
# Create the database in your Cloudflare account
npx wrangler d1 create abandon-ai-db
```

This will output:

```
✅ Successfully created DB 'abandon-ai-db'

[[d1_databases]]
binding = "DB"
database_name = "abandon-ai-db"
database_id = "<your-database-id>"
```

### 2. Run Migrations

```bash
# Apply the schema to the remote database
npx wrangler d1 execute abandon-ai-db --remote --file=./migrations/0001_init.sql
```

For local development (optional):

```bash
# Create local database for testing
npx wrangler d1 execute abandon-ai-db --local --file=./migrations/0001_init.sql
```

### 3. Update PartyKit Configuration

The `partykit.json` file has already been configured with:

```json
{
  "d1_databases": {
    "DB": "abandon-ai-db"
  }
}
```

The binding name `"DB"` must match the database_id from step 1 in your `wrangler.toml` or PartyKit deployment settings.

### 4. Deploy to Production

```bash
# Deploy PartyKit server with D1 binding
npx partykit deploy
```

During deployment, PartyKit will automatically bind the D1 database based on `partykit.json` configuration.

## Database Schema

### Tables

**viruses**
- `id` - Unique virus identifier
- `hash` - Virus hash (unique, indexed)
- `created_by` - Creator wallet address (indexed)
- `created_at` - Creation timestamp (indexed, sorted DESC)
- `timestamp` - PoW timestamp
- `nonce` - PoW nonce
- `difficulty` - PoW difficulty level
- `memo` - Optional memo field
- `status` - 'active' or 'eliminated' (indexed)
- `eliminated_by` - Eliminator address (if eliminated)
- `eliminated_at` - Elimination timestamp (if eliminated)

**vaccines**
- `id` - Unique vaccine identifier
- `hash` - Vaccine hash
- `created_by` - Creator wallet address (indexed)
- `created_at` - Creation timestamp (indexed, sorted DESC)
- `target` - Target virus hash (indexed, foreign key)
- `timestamp` - PoW timestamp
- `nonce` - PoW nonce
- `success` - 1 for successful, 0 for failed
- `virus_id` - Reference to eliminated virus

## Verification

### Check Database Contents

```bash
# List all viruses
npx wrangler d1 execute abandon-ai-db --remote --command="SELECT COUNT(*) as total_viruses FROM viruses"

# List active viruses
npx wrangler d1 execute abandon-ai-db --remote --command="SELECT COUNT(*) as active_viruses FROM viruses WHERE status='active'"

# List all vaccines
npx wrangler d1 execute abandon-ai-db --remote --command="SELECT COUNT(*) as total_vaccines FROM vaccines"

# View recent viruses
npx wrangler d1 execute abandon-ai-db --remote --command="SELECT id, hash, status, created_at FROM viruses ORDER BY created_at DESC LIMIT 10"
```

### Check Logs

```bash
# View PartyKit logs to confirm D1 initialization
npx partykit tail
```

You should see log messages like:
```
Loaded 42 viruses and 15 vaccines from D1
```

## Local Development

During local development (`npx partykit dev`), D1 is not available. The server will:
1. Log a warning: `"D1 database not available (local dev mode)"`
2. Continue working with memory-only storage
3. Data will be lost when the dev server restarts

This is expected behavior and allows rapid development without database setup.

## Troubleshooting

### Error: "Database not found"

Make sure the database name in `partykit.json` matches your actual database:

```bash
# List your databases
npx wrangler d1 list
```

### Error: "Table does not exist"

Run the migration script:

```bash
npx wrangler d1 execute abandon-ai-db --remote --file=./migrations/0001_init.sql
```

### Data not persisting

1. Check PartyKit logs for D1 errors
2. Verify the database binding is correct
3. Ensure the deployment includes the updated `partykit.json`

### Performance issues

The current implementation loads ALL viruses into memory on startup. If you accumulate thousands of viruses, consider:
1. Loading only recent/active viruses
2. Implementing pagination for history queries
3. Adding a cleanup job for old eliminated viruses

## Migration Strategy

To add new fields or tables:

1. Create a new migration file: `migrations/0002_description.sql`
2. Apply to remote: `npx wrangler d1 execute abandon-ai-db --remote --file=./migrations/0002_description.sql`
3. Update TypeScript types in `party/types.ts`
4. Update data loading logic in `party/index.ts`
5. Deploy: `npx partykit deploy`

## Cost Considerations

Cloudflare D1 pricing (as of 2025):
- **Free tier**: 5GB storage, 5M reads/day, 100K writes/day
- **Paid tier**: $0.75/million reads, $5/million writes

For this game, the free tier should be sufficient unless you get extremely high traffic.
