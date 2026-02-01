import { env, createExecutionContext, waitOnExecutionContext, self } from 'cloudflare:test';
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateService } from './game-state';
import type { Virus, Vaccine } from '../../../shared/types';

describe('GameStateService', () => {
    let service: GameStateService;
    let db: D1Database;

    beforeEach(async () => {
        // In vitest-pool-workers with D1, the database is reset for each test run
        // provided we apply the schema.
        db = env.abandon_ai_db;
        service = new GameStateService(db);

        // Use batch execution or individual runs to avoid db.exec issues if present
        await db.batch([
            db.prepare(`
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
            db.prepare(`
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
        )`)
        ]);
    });

    const mockVirus: Virus = {
        id: 'virus-1',
        hash: '0x1000',
        createdBy: '0xAddress1',
        createdAt: 1000,
        timestamp: 1000,
        nonce: 1,
        difficulty: 3,
        status: 'active',
        // D1 returns null for these columns, which we expect
        memo: null as any,
        eliminatedBy: null as any,
        eliminatedAt: null as any
    };

    it('should create and retrieve a virus', async () => {
        await service.createVirus(mockVirus);

        const fetched = await service.getVirusByHash(mockVirus.hash);
        expect(fetched).toEqual(mockVirus);
    });

    it('should list active viruses', async () => {
        await service.createVirus(mockVirus);

        const anotherVirus: Virus = { ...mockVirus, id: 'virus-2', hash: '0x2000' };
        await service.createVirus(anotherVirus);

        const active = await service.getActiveViruses();
        expect(active).toEqual(expect.arrayContaining([mockVirus, anotherVirus]));
        expect(active.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle duplicate virus creation gracefully (or throw)', async () => {
        await service.createVirus(mockVirus);
        // Based on implementation, it bubbles up the error.
        await expect(service.createVirus(mockVirus)).rejects.toThrow();
    });

    it('should create a vaccine and eliminate the target virus', async () => {
        // 1. Create target virus
        await service.createVirus(mockVirus);

        // 2. Create vaccine
        const vaccine: Vaccine = {
            id: 'vaccine-1',
            hash: '0xVaccineHash',
            createdBy: '0xHealer',
            createdAt: 2000,
            target: mockVirus.hash,
            timestamp: 2000,
            nonce: 123,
            success: true,
            virusId: mockVirus.id,
        };

        const updatedVirus = await service.createVaccine(vaccine, mockVirus.hash);

        // 3. Verify virus is eliminated
        expect(updatedVirus.status).toBe('eliminated');
        expect(updatedVirus.eliminatedBy).toBe(vaccine.createdBy);
        expect(updatedVirus.eliminatedAt).toBeTruthy();

        // 4. Verify in DB
        const fetchedVirus = await service.getVirusByHash(mockVirus.hash);
        expect(fetchedVirus?.status).toBe('eliminated');
    });

    it('should get stats', async () => {
        // Start fresh or just check increments if DB is shared (it shouldn't be)
        // Assuming fresh DB for test suite or at least isolation

        // Check initial stats. 
        // We explicitly clear tables to ensure clean state because 'CREATE IF NOT EXISTS' preserves data
        // if the environment reuses the DB (though vitest-pool-workers usually resets, but explicit delete is safer)
        await db.batch([
            db.prepare('DELETE FROM viruses'),
            db.prepare('DELETE FROM vaccines')
        ]);

        const statsStart = await service.getStats();

        await service.createVirus({ ...mockVirus, id: 'stat-virus-1', hash: '0xStat1' });

        const statsAfterVirus = await service.getStats();
        expect(statsAfterVirus.totalVirusesCreated).toBe(statsStart.totalVirusesCreated + 1);
        expect(statsAfterVirus.activeViruses).toBe(statsStart.activeViruses + 1);

        // Eliminate one
        const vaccine: Vaccine = {
            id: 'vaccine-stat',
            hash: '0xStatVaccine',
            createdBy: '0xHealerStat',
            createdAt: 2000,
            target: '0xStat1',
            timestamp: 2000,
            nonce: 123,
            success: true,
            virusId: 'stat-virus-1',
        };
        await service.createVaccine(vaccine, '0xStat1');

        const statsAfterVaccine = await service.getStats();
        expect(statsAfterVaccine.activeViruses).toBe(statsStart.activeViruses); // Back to start (+1 -1)
        expect(statsAfterVaccine.eliminatedViruses).toBe(statsStart.eliminatedViruses + 1);
    });
});
