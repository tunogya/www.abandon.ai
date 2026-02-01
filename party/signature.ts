// Ethereum signature verification using EIP-191 (personal_sign)
import { verifyMessage } from 'viem';

/**
 * Generate the message to sign for virus creation
 */
export function generateSignMessage(
  action: 'create_virus' | 'create_vaccine',
  address: string,
  timestamp: number,
  nonce: number,
  additionalData?: { difficulty?: number; memo?: string; target?: string }
): string {
  if (action === 'create_virus') {
    return `abandon.ai - Create Virus\n\nWallet: ${address}\nTimestamp: ${timestamp}\nNonce: ${nonce}\nDifficulty: ${additionalData?.difficulty || 0}\nMemo: ${additionalData?.memo || ''}`;
  } else {
    return `abandon.ai - Create Vaccine\n\nWallet: ${address}\nTarget Virus: ${additionalData?.target || ''}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
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
  address: string,
  timestamp: number,
  nonce: number,
  difficulty: number,
  memo: string = '',
  signature: string
): Promise<boolean> {
  const message = generateSignMessage('create_virus', address, timestamp, nonce, {
    difficulty,
    memo,
  });
  return verifySignature(message, signature, address);
}

/**
 * Verify vaccine creation request signature
 */
export async function verifyVaccineSignature(
  address: string,
  target: string,
  timestamp: number,
  nonce: number,
  signature: string
): Promise<boolean> {
  const message = generateSignMessage('create_vaccine', address, timestamp, nonce, {
    target,
  });
  return verifySignature(message, signature, address);
}

/**
 * Check if timestamp is within acceptable range (1 hour)
 */
export function isTimestampValid(timestamp: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.abs(now - timestamp);
  return diff <= 3600; // 1 hour tolerance
}
