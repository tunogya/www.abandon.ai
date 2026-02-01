// Ethereum signature verification using EIP-191 (personal_sign)
import { verifyMessage } from 'viem';

/**
 * Generate the message to sign for virus creation
 */
export function generateSignMessage(
  action: 'create_virus' | 'create_vaccine',
  walletAddress: string,
  timestamp: number,
  nonce: number,
  additionalData?: { difficulty?: number; memo?: string; targetVirusHash?: string }
): string {
  if (action === 'create_virus') {
    return `abandon.ai - Create Virus\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\nNonce: ${nonce}\nDifficulty: ${additionalData?.difficulty || 0}\nMemo: ${additionalData?.memo || ''}`;
  } else {
    return `abandon.ai - Create Vaccine\n\nWallet: ${walletAddress}\nTarget Virus: ${additionalData?.targetVirusHash || ''}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
  }
}

/**
 * Verify Ethereum signature
 */
export async function verifySignature(
  message: string,
  signature: string,
  expectedAddress: string
): Promise<boolean> {
  try {
    const valid = await verifyMessage({
      address: expectedAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    return valid;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Verify virus creation request signature
 */
export async function verifyVirusSignature(
  walletAddress: string,
  timestamp: number,
  nonce: number,
  difficulty: number,
  memo: string = '',
  signature: string
): Promise<boolean> {
  const message = generateSignMessage('create_virus', walletAddress, timestamp, nonce, {
    difficulty,
    memo,
  });
  return verifySignature(message, signature, walletAddress);
}

/**
 * Verify vaccine creation request signature
 */
export async function verifyVaccineSignature(
  walletAddress: string,
  targetVirusHash: string,
  timestamp: number,
  nonce: number,
  signature: string
): Promise<boolean> {
  const message = generateSignMessage('create_vaccine', walletAddress, timestamp, nonce, {
    targetVirusHash,
  });
  return verifySignature(message, signature, walletAddress);
}

/**
 * Check if timestamp is within acceptable range (1 hour)
 */
export function isTimestampValid(timestamp: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.abs(now - timestamp);
  return diff <= 3600; // 1 hour tolerance
}
