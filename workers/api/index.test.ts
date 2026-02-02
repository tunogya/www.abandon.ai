import { describe, it, expect, beforeEach } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import app from './index';

// Helper function to calculate valid PoW hash
async function findValidNonce(
  address: string,
  timestamp: number,
  difficulty: number,
  memo: string = '',
  type: 'virus' | 'vaccine' = 'virus',
  target: string = ''
): Promise<{ nonce: number; hash: string }> {
  const calculateHash = async (nonce: number): Promise<string> => {
    let data: string;
    if (type === 'virus') {
      data = `virus:${address}:${timestamp}:${nonce}:${difficulty}:${memo}`;
    } else {
      data = `vaccine:${address}:${target}:${timestamp}:${nonce}`;
    }
    const msgBuffer = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const targetPrefix = '0'.repeat(difficulty);
  for (let nonce = 0; nonce < 1000000; nonce++) {
    const hash = await calculateHash(nonce);
    if (hash.startsWith(targetPrefix)) {
      return { nonce, hash };
    }
  }
  throw new Error('Could not find valid nonce within limit');
}

describe('API Integration Tests', () => {
  beforeEach(async () => {
    // Initialize database schema
    // Initialize database schema using batch to avoid db.exec issues
    await env.abandon_ai_db.batch([
      env.abandon_ai_db.prepare(`
      CREATE TABLE IF NOT EXISTS viruses (
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
      )`),
      env.abandon_ai_db.prepare(`
      CREATE TABLE IF NOT EXISTS vaccines (
        id TEXT PRIMARY KEY,
        hash TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        target TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        nonce INTEGER NOT NULL,
        success INTEGER NOT NULL DEFAULT 0,
        virus_id TEXT
      )`),
      env.abandon_ai_db.prepare(`DELETE FROM viruses`),
      env.abandon_ai_db.prepare(`DELETE FROM vaccines`)
    ]);
  });

  describe('GET /', () => {
    it('should return health check', async () => {
      const response = await app.request('/', {}, env);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        service: 'abandon.ai API',
        version: '1.0.0',
        status: 'healthy',
      });
    });
  });

  describe('POST /api/virus', () => {
    it('should create virus with valid PoW', async () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const timestamp = Math.floor(Date.now() / 1000);
      const difficulty = 3;
      const { nonce } = await findValidNonce(address, timestamp, difficulty);

      const response = await app.request(
        '/api/virus',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, timestamp, nonce, difficulty, memo: '' }),
        },
        env
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.virus).toBeDefined();
      expect(data.virus.createdBy).toBe(address);
      expect(data.virus.difficulty).toBe(difficulty);
      expect(data.virus.status).toBe('active');
      expect(data.stats).toBeDefined();
    });

    it('should reject virus with invalid PoW', async () => {
      const response = await app.request(
        '/api/virus',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
            timestamp: Math.floor(Date.now() / 1000),
            nonce: 99999,
            difficulty: 5,
            memo: '',
          }),
        },
        env
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('PoW verification failed');
    });

    it('should reject virus with missing fields', async () => {
      const response = await app.request(
        '/api/virus',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
            // Missing other required fields
          }),
        },
        env
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should reject virus with invalid difficulty', async () => {
      const response = await app.request(
        '/api/virus',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
            timestamp: Math.floor(Date.now() / 1000),
            nonce: 12345,
            difficulty: 11, // Out of range
            memo: '',
          }),
        },
        env
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('between 3 and 10');
    });
  });

  describe('GET /api/virus', () => {
    it('should return viruses with pagination', async () => {
      // Create multiple viruses
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const difficulty = 3;

      for (let i = 0; i < 5; i++) {
        const timestamp = Math.floor(Date.now() / 1000) + i;
        const { nonce } = await findValidNonce(address, timestamp, difficulty);
        await app.request(
          '/api/virus',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, timestamp, nonce, difficulty, memo: '' }),
          },
          env
        );
      }

      const response = await app.request('/api/virus?page=1&limit=3', {}, env);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.viruses.length).toBe(3);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(3);
      expect(data.pagination.total).toBe(5);
      expect(data.pagination.totalPages).toBe(2);

      // Verify second page
      const response2 = await app.request('/api/virus?page=2&limit=3', {}, env);
      const data2 = await response2.json();
      expect(data2.viruses.length).toBe(2);
      expect(data2.pagination.page).toBe(2);
    });
  });

  describe('POST /api/vaccine', () => {
    it('should eliminate virus with valid vaccine', async () => {
      // First create a virus
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const timestamp = Math.floor(Date.now() / 1000);
      const difficulty = 3;
      const { nonce: virusNonce, hash: virusHash } = await findValidNonce(
        address,
        timestamp,
        difficulty
      );

      await app.request(
        '/api/virus',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, timestamp, nonce: virusNonce, difficulty, memo: '' }),
        },
        env
      );

      // Now create a vaccine
      const vaccineTimestamp = Math.floor(Date.now() / 1000);
      const { nonce: vaccineNonce } = await findValidNonce(
        address,
        vaccineTimestamp,
        difficulty,
        '',
        'vaccine',
        virusHash
      );

      const response = await app.request(
        '/api/vaccine',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address,
            target: virusHash,
            timestamp: vaccineTimestamp,
            nonce: vaccineNonce,
          }),
        },
        env
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.vaccine).toBeDefined();
      expect(data.vaccine.success).toBe(true);
      expect(data.virus).toBeDefined();
      expect(data.virus.status).toBe('eliminated');
    });

    it('should reject vaccine for non-existent virus', async () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const timestamp = Math.floor(Date.now() / 1000);
      const fakeTarget = '0000000000000000000000000000000000000000000000000000000000000000';

      const response = await app.request(
        '/api/vaccine',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address,
            target: fakeTarget,
            timestamp,
            nonce: 12345,
          }),
        },
        env
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });
  });

  describe('GET /api/vaccine', () => {
    it('should return vaccines with pagination', async () => {
      // Create virus and vaccine
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const timestamp = Math.floor(Date.now() / 1000);
      const difficulty = 3;
      const { nonce: virusNonce, hash: virusHash } = await findValidNonce(
        address,
        timestamp,
        difficulty
      );

      await app.request(
        '/api/virus',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, timestamp, nonce: virusNonce, difficulty, memo: '' }),
        },
        env
      );

      // Create vaccine
      const vaccineTimestamp = Math.floor(Date.now() / 1000);
      const { nonce: vaccineNonce } = await findValidNonce(
        address,
        vaccineTimestamp,
        difficulty,
        '',
        'vaccine',
        virusHash
      );

      await app.request(
        '/api/vaccine',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address,
            target: virusHash,
            timestamp: vaccineTimestamp,
            nonce: vaccineNonce,
          }),
        },
        env
      );

      const response = await app.request('/api/vaccine?page=1&limit=10', {}, env);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.vaccines.length).toBe(1);
      expect(data.pagination.total).toBe(1);
    });
  });

  describe('GET /api/status', () => {
    it('should return empty status when no viruses exist', async () => {
      const response = await app.request('/api/status', {}, env);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.activeViruses).toEqual([]);
      expect(data.stats.totalVirusesCreated).toBe(0);
      expect(data.stats.activeViruses).toBe(0);
    });

    it('should return active viruses and stats', async () => {
      // Create a virus first
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const timestamp = Math.floor(Date.now() / 1000);
      const difficulty = 3;
      const { nonce } = await findValidNonce(address, timestamp, difficulty);

      await app.request(
        '/api/virus',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, timestamp, nonce, difficulty, memo: '' }),
        },
        env
      );

      const response = await app.request('/api/status', {}, env);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.activeViruses).toHaveLength(1);
      expect(data.stats.totalVirusesCreated).toBe(1);
      expect(data.stats.activeViruses).toBe(1);
      expect(data.stats.eliminatedViruses).toBe(0);
    });
  });

  describe('GET /api/history', () => {
    it('should return empty history when no data exists', async () => {
      const response = await app.request('/api/history', {}, env);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.viruses).toEqual([]);
      expect(data.vaccines).toEqual([]);
    });

    it('should return history with limit', async () => {
      const response = await app.request('/api/history?limit=10', {}, env);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('viruses');
      expect(data).toHaveProperty('vaccines');
    });

    it('should respect limit parameter', async () => {
      // Create multiple viruses
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const difficulty = 3;

      for (let i = 0; i < 5; i++) {
        const timestamp = Math.floor(Date.now() / 1000) + i;
        const { nonce } = await findValidNonce(address, timestamp, difficulty);
        await app.request(
          '/api/virus',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, timestamp, nonce, difficulty, memo: '' }),
          },
          env
        );
      }

      const response = await app.request('/api/history?limit=3', {}, env);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.viruses.length).toBeLessThanOrEqual(3);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await app.request('/unknown/route', {}, env);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Not found');
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await app.request('/', {}, env);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });
  });
});
