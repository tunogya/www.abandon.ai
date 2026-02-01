// SHA256-based Proof of Work hash generation and validation

/**
 * Calculate virus hash using SHA-256
 * Format: SHA256("virus:{walletAddress}:{timestamp}:{nonce}:{difficulty}:{memo}")
 */
export async function calculateVirusHash(
  walletAddress: string,
  timestamp: number,
  nonce: number,
  difficulty: number,
  memo: string = ''
): Promise<string> {
  const data = `virus:${walletAddress}:${timestamp}:${nonce}:${difficulty}:${memo}`;
  return sha256(data);
}

/**
 * Calculate vaccine hash using SHA-256
 * Format: SHA256("vaccine:{walletAddress}:{targetVirusHash}:{timestamp}:{nonce}")
 */
export async function calculateVaccineHash(
  walletAddress: string,
  targetVirusHash: string,
  timestamp: number,
  nonce: number
): Promise<string> {
  const data = `vaccine:${walletAddress}:${targetVirusHash}:${timestamp}:${nonce}`;
  return sha256(data);
}

/**
 * Verify if a hash meets the difficulty requirement
 * Difficulty N means hash must start with N zeros
 */
export function verifyPoW(hash: string, difficulty: number): boolean {
  const targetPrefix = '0'.repeat(difficulty);
  return hash.startsWith(targetPrefix);
}

/**
 * Validate virus hash with PoW verification
 */
export async function validateVirusHash(
  walletAddress: string,
  timestamp: number,
  nonce: number,
  difficulty: number,
  memo: string = ''
): Promise<{ valid: boolean; hash?: string; error?: string }> {
  // Validate difficulty range (3-10)
  if (difficulty < 3 || difficulty > 10) {
    return {
      valid: false,
      error: 'Difficulty must be between 3 and 10',
    };
  }

  // Validate memo format (hex string, max 1024 chars = 512 bytes)
  if (memo && !isValidHexString(memo)) {
    return {
      valid: false,
      error: 'Memo must be a valid hexadecimal string',
    };
  }

  if (memo && memo.length > 1024) {
    return {
      valid: false,
      error: 'Memo exceeds maximum length (1024 hex characters)',
    };
  }

  const hash = await calculateVirusHash(walletAddress, timestamp, nonce, difficulty, memo);

  if (!verifyPoW(hash, difficulty)) {
    return {
      valid: false,
      error: `PoW verification failed. Required difficulty: ${difficulty}`,
    };
  }

  return { valid: true, hash };
}

/**
 * Validate vaccine hash with PoW verification
 * Vaccine must meet the same difficulty as the target virus
 */
export async function validateVaccineHash(
  walletAddress: string,
  targetVirusHash: string,
  timestamp: number,
  nonce: number,
  targetDifficulty: number
): Promise<{ valid: boolean; hash?: string; error?: string }> {
  const hash = await calculateVaccineHash(walletAddress, targetVirusHash, timestamp, nonce);

  if (!verifyPoW(hash, targetDifficulty)) {
    return {
      valid: false,
      error: `PoW verification failed. Required difficulty: ${targetDifficulty}`,
    };
  }

  return { valid: true, hash };
}

/**
 * Check if a string is a valid hexadecimal string
 */
function isValidHexString(str: string): boolean {
  return /^[0-9a-fA-F]*$/.test(str);
}

/**
 * SHA-256 implementation using Web Crypto API
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
