import { describe, it, expect } from 'vitest';
import {
  calculateVirusHash,
  calculateVaccineHash,
  verifyPoW,
  validateVirusHash,
  validateVaccineHash,
} from './hash';

describe('Hash Utils', () => {
  describe('calculateVirusHash', () => {
    it('should calculate correct SHA-256 hash for virus', async () => {
      const hash = await calculateVirusHash(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        1738454400,
        12345,
        5,
        ''
      );
      expect(hash).toBeTruthy();
      expect(hash).toHaveLength(64);
    });

    it('should include memo in hash calculation', async () => {
      const hashWithoutMemo = await calculateVirusHash(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        1738454400,
        12345,
        5,
        ''
      );
      const hashWithMemo = await calculateVirusHash(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        1738454400,
        12345,
        5,
        'abc123'
      );
      expect(hashWithoutMemo).not.toBe(hashWithMemo);
    });

    it('should produce different hash with different nonce', async () => {
      const hash1 = await calculateVirusHash(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        1738454400,
        12345,
        5,
        ''
      );
      const hash2 = await calculateVirusHash(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        1738454400,
        54321,
        5,
        ''
      );
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('calculateVaccineHash', () => {
    it('should calculate correct SHA-256 hash for vaccine', async () => {
      const hash = await calculateVaccineHash(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        '00000abc123',
        1738454400,
        12345
      );
      expect(hash).toBeTruthy();
      expect(hash).toHaveLength(64);
    });

    it('should produce different hash with different target', async () => {
      const hash1 = await calculateVaccineHash(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        '00000abc123',
        1738454400,
        12345
      );
      const hash2 = await calculateVaccineHash(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        '00000def456',
        1738454400,
        12345
      );
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPoW', () => {
    it('should verify hash with correct difficulty', () => {
      expect(verifyPoW('00000abc123', 5)).toBe(true);
      expect(verifyPoW('000abc123', 3)).toBe(true);
      expect(verifyPoW('0000000abc', 7)).toBe(true);
    });

    it('should reject hash with insufficient difficulty', () => {
      expect(verifyPoW('0000abc123', 5)).toBe(false);
      expect(verifyPoW('00abc123', 3)).toBe(false);
      expect(verifyPoW('abc123', 1)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(verifyPoW('0000000000', 10)).toBe(true);
      expect(verifyPoW('0000000000', 11)).toBe(false);
      expect(verifyPoW('', 0)).toBe(true);
    });
  });

  describe('validateVirusHash', () => {
    it('should reject difficulty outside valid range', async () => {
      const result1 = await validateVirusHash(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        1738454400,
        12345,
        2,
        ''
      );
      expect(result1.valid).toBe(false);
      expect(result1.error).toContain('between 3 and 10');

      const result2 = await validateVirusHash(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        1738454400,
        12345,
        11,
        ''
      );
      expect(result2.valid).toBe(false);
      expect(result2.error).toContain('between 3 and 10');
    });

    it('should reject invalid hex memo', async () => {
      const result = await validateVirusHash(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        1738454400,
        12345,
        5,
        'invalid-hex!'
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid hexadecimal string');
    });

    it('should reject memo exceeding max length', async () => {
      const longMemo = 'a'.repeat(1025);
      const result = await validateVirusHash(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        1738454400,
        12345,
        5,
        longMemo
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('maximum length');
    });

    it('should accept valid hex memo', async () => {
      const result = await validateVirusHash(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        1738454400,
        12345,
        3,
        'abc123def456'
      );
      // May pass or fail depending on PoW, but should not error on memo validation
      if (!result.valid) {
        expect(result.error).toContain('PoW verification failed');
      }
    });
  });

  describe('validateVaccineHash', () => {
    it('should validate vaccine hash structure', async () => {
      // This test requires finding a valid nonce, so we just verify the structure
      const result = await validateVaccineHash(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        '00000abc123',
        1738454400,
        12345,
        3
      );
      expect(result).toHaveProperty('valid');
      if (result.valid) {
        expect(result).toHaveProperty('hash');
      } else {
        expect(result.error).toContain('PoW verification failed');
      }
    });
  });
});
