# Scripts

Command-line tools for interacting with the abandon.ai game.

## Available Scripts

### 1. Generate Keypair (`generate-keypair.ts`)

Securely generates a new Ethereum address for use in the game.

**Usage:**
```bash
npx tsx scripts/generate-keypair.ts
```

**Output:**
- **Private Key**: A 256-bit random private key (0x... 64 hex chars)
- **Address**: The corresponding Ethereum address (0x... 40 hex chars, EIP-55 checksum format)

**Note:** The address is used as a unique identifier in the game. The private key is not used for authentication (the game uses Proof-of-Work instead), but should still be kept secure for future use.

**Example Output:**
```
🔐 Ethereum Keypair Generator

✔ Keypair Generated Successfully!

Private Key:
0x1234567890abcdef...

Address (Public):
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

⚠️  SECURITY WARNING ⚠️
• NEVER share your private key with anyone
• Store it securely offline (hardware wallet recommended)
...
```

---

### 2. Game Client (`game-client.ts`)

Command-line client for creating viruses and vaccines using Proof-of-Work mining.

**Commands:**

#### Create a Virus

```bash
npx tsx scripts/game-client.ts virus \
  --address 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb \
  --difficulty 4 \
  --memo 48656c6c6f
```

**Options:**
- `--address` (required): Your Ethereum wallet address
- `--difficulty` (required): Difficulty level (3-10). Higher = harder to mine
- `--memo` (optional): Hex-encoded message attached to the virus

**How it works:**
1. Mines a valid nonce using SHA-256 hashing
2. Hash must start with N zeros (N = difficulty)
3. Displays the result with timestamp, nonce, and hash
4. Provides a curl command to submit the virus to the server

---

#### Create a Vaccine

```bash
npx tsx scripts/game-client.ts vaccine \
  --address 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb \
  --target 0000abc123...
```

**Options:**
- `--address` (required): Your Ethereum wallet address
- `--target` (required): The hash of the virus you want to eliminate

**How it works:**
1. Infers difficulty from the target virus hash (counts leading zeros)
2. Mines a valid nonce for the vaccine
3. Vaccine hash must match the virus difficulty (same number of leading zeros)
4. Provides a curl command to submit the vaccine

---

## Typical Workflow

### Step 1: Generate a Keypair

```bash
npx tsx scripts/generate-keypair.ts
```

Save the output securely. You'll use the **Address** for the next steps.

### Step 2: Create a Virus

```bash
npx tsx scripts/game-client.ts virus \
  --address YOUR_ADDRESS \
  --difficulty 4
```

Wait for mining to complete. This may take seconds to minutes depending on difficulty.

### Step 3: Submit the Virus

Copy and run the curl command provided by the script:

```bash
curl -X POST https://api.abandon.ai/api/virus \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Step 4: Create a Vaccine (Optional)

To eliminate a virus, get its hash from the game dashboard, then:

```bash
npx tsx scripts/game-client.ts vaccine \
  --address YOUR_ADDRESS \
  --target VIRUS_HASH
```

Submit using the provided curl command.

---

## Technical Details

### Hash Algorithms

**Virus Hash:**
```typescript
SHA256("virus:{address}:{timestamp}:{nonce}:{difficulty}:{memo}")
```

**Vaccine Hash:**
```typescript
SHA256("vaccine:{address}:{target}:{timestamp}:{nonce}")
```

### Difficulty Levels

| Difficulty | Leading Zeros | Avg. Attempts | Est. Time |
|-----------|---------------|---------------|-----------|
| 3 | `000...` | ~4,000 | < 1 second |
| 4 | `0000...` | ~65,000 | 1-5 seconds |
| 5 | `00000...` | ~1,000,000 | 10-30 seconds |
| 6 | `000000...` | ~16,000,000 | 2-5 minutes |
| 7+ | `0000000...` | Exponential | Hours+ |

*Times are estimates and depend on CPU speed.*

---

## Requirements

- Node.js 18+
- Dependencies installed: `npm install`
- `tsx` for running TypeScript: `npx tsx`

---

## Troubleshooting

**"Mining is too slow"**
- Lower the difficulty level
- Use a faster CPU
- The script shows progress every 100,000 attempts

**"Address format error"**
- Ensure the address starts with `0x`
- Must be a valid Ethereum address (42 characters total)

**"Target hash not found"**
- Verify the virus hash is correct
- Check the virus still exists (hasn't been eliminated)

---

## Security Considerations

1. **Proof-of-Work**: The game uses PoW validation only (no signature verification)
2. **Rate Limiting**: The server may rate-limit requests
3. **Memo Field**: Don't include sensitive data in the memo (it's public)
4. **Address Reuse**: Using the same address links all your viruses/vaccines together
5. **Timestamps**: All timestamps must be Unix seconds (not milliseconds)

---

## API Endpoints

All requests go to: `https://api.abandon.ai/api/`

- `POST /virus` - Submit a mined virus
- `POST /vaccine` - Submit a vaccine
- `GET /status` - Get current game state
- `GET /history?limit=N` - Get virus/vaccine history

See the main project README for full API documentation.
