import type { Virus, Vaccine, GameStats } from '../../../shared/types';

/**
 * Database service layer for game state management
 */
export class GameStateService {
  constructor(private db: D1Database) { }

  /**
   * Create a new virus in the database
   */
  async createVirus(virus: Virus): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO viruses (id, hash, created_by, created_at, timestamp, nonce, difficulty, memo, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        virus.id,
        virus.hash,
        virus.createdBy,
        virus.createdAt,
        virus.timestamp,
        virus.nonce,
        virus.difficulty,
        virus.memo || null,
        virus.status
      )
      .run();
  }

  /**
   * Create a vaccine and eliminate the target virus atomically
   */
  async createVaccine(vaccine: Vaccine, targetHash: string): Promise<Virus> {
    // Insert vaccine
    await this.db
      .prepare(
        `INSERT INTO vaccines (id, hash, created_by, created_at, target, timestamp, nonce, success, virus_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        vaccine.id,
        vaccine.hash,
        vaccine.createdBy,
        vaccine.createdAt,
        vaccine.target,
        vaccine.timestamp,
        vaccine.nonce,
        vaccine.success ? 1 : 0,
        vaccine.virusId || null
      )
      .run();

    // Update virus status
    const now = Math.floor(Date.now() / 1000);
    await this.db
      .prepare(
        `UPDATE viruses
         SET status = 'eliminated', eliminated_by = ?, eliminated_at = ?
         WHERE hash = ? AND status = 'active'`
      )
      .bind(vaccine.createdBy, now, targetHash)
      .run();

    // Return updated virus
    const virus = await this.getVirusByHash(targetHash);
    if (!virus) {
      throw new Error('Failed to retrieve updated virus');
    }
    return virus;
  }

  /**
   * Get all active viruses
   */
  async getActiveViruses(): Promise<Virus[]> {
    const { results } = await this.db
      .prepare(`SELECT * FROM viruses WHERE status = 'active' ORDER BY created_at DESC`)
      .all();

    return results.map(mapRowToVirus);
  }

  /**
   * Get virus by hash
   */
  async getVirusByHash(hash: string): Promise<Virus | null> {
    const result = await this.db
      .prepare(`SELECT * FROM viruses WHERE hash = ?`)
      .bind(hash)
      .first();

    return result ? mapRowToVirus(result) : null;
  }

  /**
   * Get game statistics
   */
  async getStats(): Promise<GameStats> {
    const result = await this.db
      .prepare(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'eliminated' THEN 1 ELSE 0 END) as eliminated,
          COUNT(DISTINCT created_by) as unique_creators
        FROM viruses`
      )
      .first();

    // Get unique addresses from vaccines
    const vaccineAddresses = await this.db
      .prepare(`SELECT COUNT(DISTINCT created_by) as unique_vaccine_creators FROM vaccines`)
      .first();

    // Get all unique addresses (union of virus and vaccine creators)
    const allAddresses = await this.db
      .prepare(
        `SELECT COUNT(DISTINCT address) as unique_addresses FROM (
          SELECT created_by as address FROM viruses
          UNION
          SELECT created_by as address FROM vaccines
          UNION
          SELECT eliminated_by as address FROM viruses WHERE eliminated_by IS NOT NULL
        )`
      )
      .first();

    return {
      totalVirusesCreated: (result?.total as number) || 0,
      activeViruses: (result?.active as number) || 0,
      eliminatedViruses: (result?.eliminated as number) || 0,
      uniqueAddresses: (allAddresses?.unique_addresses as number) || 0,
    };
  }

  /**
   * Get virus history with limit
   */
  async getVirusHistory(limit: number = 100): Promise<Virus[]> {
    const { results } = await this.db
      .prepare(`SELECT * FROM viruses ORDER BY created_at DESC LIMIT ?`)
      .bind(limit)
      .all();

    return results.map(mapRowToVirus);
  }

  /**
   * Get active viruses with pagination
   */
  async getActiveVirusesPaginated(page: number, limit: number): Promise<{ items: Virus[], total: number }> {
    const offset = (page - 1) * limit;

    const { results } = await this.db
      .prepare(`SELECT * FROM viruses WHERE status = 'active' ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(limit, offset)
      .all();

    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as total FROM viruses WHERE status = 'active'`)
      .first();

    return {
      items: results.map(mapRowToVirus),
      total: (countResult?.total as number) || 0
    };
  }

  /**
   * Search viruses by exact hash or creator address
   */
  async searchVirusesByHashOrAddress(query: string): Promise<Virus[]> {
    const normalized = query.trim();
    if (!normalized) return [];

    const { results } = await this.db
      .prepare(
        `SELECT * FROM viruses
         WHERE hash = ? OR created_by = ?
         ORDER BY created_at DESC`
      )
      .bind(normalized, normalized)
      .all();

    return results.map(mapRowToVirus);
  }

  /**
   * Get vaccine history with limit
   */
  async getVaccineHistory(limit: number = 100): Promise<Vaccine[]> {
    const { results } = await this.db
      .prepare(`SELECT * FROM vaccines ORDER BY created_at DESC LIMIT ?`)
      .bind(limit)
      .all();

    return results.map(mapRowToVaccine);
  }

  /**
   * Get vaccines with pagination
   */
  async getVaccinesPaginated(page: number, limit: number): Promise<{ items: Vaccine[], total: number }> {
    const offset = (page - 1) * limit;

    const { results } = await this.db
      .prepare(`SELECT * FROM vaccines ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(limit, offset)
      .all();

    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as total FROM vaccines`)
      .first();

    return {
      items: results.map(mapRowToVaccine),
      total: (countResult?.total as number) || 0
    };
  }
}

/**
 * Map D1 row to Virus object
 */
function mapRowToVirus(row: any): Virus {
  return {
    id: row.id as string,
    hash: row.hash as string,
    createdBy: row.created_by as string,
    createdAt: row.created_at as number,
    timestamp: row.timestamp as number,
    nonce: row.nonce as number,
    difficulty: row.difficulty as number,
    memo: row.memo as string | undefined,
    status: row.status as 'active' | 'eliminated',
    eliminatedBy: row.eliminated_by as string | undefined,
    eliminatedAt: row.eliminated_at as number | undefined,
  };
}

/**
 * Map D1 row to Vaccine object
 */
function mapRowToVaccine(row: any): Vaccine {
  return {
    id: row.id as string,
    hash: row.hash as string,
    createdBy: row.created_by as string,
    createdAt: row.created_at as number,
    target: row.target as string,
    timestamp: row.timestamp as number,
    nonce: row.nonce as number,
    success: row.success === 1,
    virusId: row.virus_id as string | undefined,
  };
}
