import type * as Party from "partykit/server";
import {
  Virus,
  Vaccine,
  GameStats,
  MessageType,
  ClientMessage,
  ServerMessage,
  CreateVirusRequest,
  CreateVaccineRequest,
  VirusResponse,
  VaccineResponse,
  StatusResponse,
  HistoryResponse,
  ErrorResponse,
} from "./types";
import { validateVirusHash, validateVaccineHash } from "./hash";

// D1 Database interface
interface Env {
  DB?: D1Database;
}

export default class Server implements Party.Server {
  // In-memory game state (for fast reads)
  private viruses: Map<string, Virus> = new Map();
  private vaccines: Vaccine[] = [];
  private stats: GameStats = {
    totalVirusesCreated: 0,
    activeViruses: 0,
    eliminatedViruses: 0,
    uniqueAddresses: 0,
  };
  private uniqueAddresses: Set<string> = new Set();
  private initialized = false;
  private db: D1Database | undefined;

  constructor(readonly room: Party.Room) {
    this.db = (room.env as Env).DB;
  }

  // Load state from D1 on first use
  private async ensureInitialized() {
    if (this.initialized) return;
    this.initialized = true;

    if (!this.db) {
      console.warn("D1 database not available (local dev mode)");
      return;
    }

    try {
      // Load all viruses
      const virusRows = await this.db
        .prepare("SELECT * FROM viruses ORDER BY created_at DESC")
        .all();

      if (virusRows.results) {
        for (const row of virusRows.results) {
          const virus: Virus = {
            id: row.id as string,
            hash: row.hash as string,
            createdBy: row.created_by as string,
            createdAt: row.created_at as number,
            timestamp: row.timestamp as number,
            nonce: row.nonce as number,
            difficulty: row.difficulty as number,
            memo: row.memo as string | undefined,
            status: row.status as "active" | "eliminated",
            eliminatedBy: row.eliminated_by as string | undefined,
            eliminatedAt: row.eliminated_at as number | undefined,
          };
          this.viruses.set(virus.hash, virus);
          this.uniqueAddresses.add(virus.createdBy);
          if (virus.eliminatedBy) {
            this.uniqueAddresses.add(virus.eliminatedBy);
          }
        }
      }

      // Load all vaccines (keep in memory for history)
      const vaccineRows = await this.db
        .prepare("SELECT * FROM vaccines ORDER BY created_at DESC LIMIT 1000")
        .all();

      if (vaccineRows.results) {
        for (const row of vaccineRows.results) {
          const vaccine: Vaccine = {
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
          this.vaccines.push(vaccine);
          this.uniqueAddresses.add(vaccine.createdBy);
        }
      }

      // Calculate stats
      this.stats.totalVirusesCreated = this.viruses.size;
      this.stats.activeViruses = Array.from(this.viruses.values()).filter(
        (v) => v.status === "active"
      ).length;
      this.stats.eliminatedViruses = this.stats.totalVirusesCreated - this.stats.activeViruses;
      this.stats.uniqueAddresses = this.uniqueAddresses.size;

      console.log(`Loaded ${this.viruses.size} viruses and ${this.vaccines.length} vaccines from D1`);
    } catch (error) {
      console.error("Error loading from D1:", error);
    }
  }

  async onRequest(req: Party.Request): Promise<Response> {
    await this.ensureInitialized();

    const url = new URL(req.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // POST /party/virus - Create virus
      if (path.endsWith("/virus") && req.method === "POST") {
        const body = (await req.json()) as CreateVirusRequest;
        const response = await this.handleCreateVirus(body);
        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: response.success ? 200 : 400,
        });
      }

      // POST /party/vaccine - Create vaccine
      if (path.endsWith("/vaccine") && req.method === "POST") {
        const body = (await req.json()) as CreateVaccineRequest;
        const response = await this.handleCreateVaccine(body);
        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: response.success ? 200 : 400,
        });
      }

      // GET /party/status - Get current status
      if (path.endsWith("/status") && req.method === "GET") {
        const response = this.getStatus();
        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET /party/history - Get history
      if (path.endsWith("/history") && req.method === "GET") {
        const limit = parseInt(url.searchParams.get("limit") || "100");
        const response = this.getHistory(limit);
        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response("Not found", { status: 404, headers: corsHeaders });
    } catch (error) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
      return new Response(JSON.stringify(errorResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
  }

  async handleCreateVirus(
    body: CreateVirusRequest
  ): Promise<VirusResponse | ErrorResponse> {
    const { address, timestamp, nonce, difficulty, memo = "" } = body;

    // Validate PoW
    const validation = await validateVirusHash(
      address,
      timestamp,
      nonce,
      difficulty,
      memo
    );

    if (!validation.valid) {
      return { success: false, error: validation.error || "Validation failed" };
    }

    // Create virus
    const virus: Virus = {
      id: this.generateId(),
      hash: validation.hash!,
      createdBy: address,
      createdAt: Math.floor(Date.now() / 1000),
      timestamp,
      nonce,
      difficulty,
      memo: memo || undefined,
      status: "active",
    };

    // Persist to D1 if available
    if (this.db) {
      try {
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
      } catch (error) {
        console.error("Error persisting virus to D1:", error);
      }
    }

    this.viruses.set(virus.hash, virus);
    this.uniqueAddresses.add(address);
    this.stats.totalVirusesCreated++;
    this.stats.activeViruses++;
    this.stats.uniqueAddresses = this.uniqueAddresses.size;

    // Broadcast to all connected clients
    const message: ServerMessage = {
      type: MessageType.VIRUS_CREATED,
      virus,
      stats: this.stats,
    };
    this.room.broadcast(JSON.stringify(message));

    return {
      success: true,
      virus,
      stats: this.stats,
    };
  }

  async handleCreateVaccine(
    body: CreateVaccineRequest
  ): Promise<VaccineResponse | ErrorResponse> {
    const { address, target, timestamp, nonce } = body;

    // Check if target virus exists
    const targetVirus = this.viruses.get(target);
    if (!targetVirus) {
      return { success: false, error: "Target virus not found" };
    }

    if (targetVirus.status === "eliminated") {
      return { success: false, error: "Target virus already eliminated" };
    }

    // Validate PoW (must match target virus difficulty)
    const validation = await validateVaccineHash(
      address,
      target,
      timestamp,
      nonce,
      targetVirus.difficulty
    );

    if (!validation.valid) {
      return { success: false, error: validation.error || "Validation failed" };
    }

    // Create vaccine
    const vaccine: Vaccine = {
      id: this.generateId(),
      hash: validation.hash!,
      createdBy: address,
      createdAt: Math.floor(Date.now() / 1000),
      target,
      timestamp,
      nonce,
      success: true,
      virusId: targetVirus.id,
    };

    this.vaccines.push(vaccine);
    this.uniqueAddresses.add(address);

    // Eliminate virus
    targetVirus.status = "eliminated";
    targetVirus.eliminatedBy = address;
    targetVirus.eliminatedAt = Math.floor(Date.now() / 1000);

    this.stats.activeViruses--;
    this.stats.eliminatedViruses++;
    this.stats.uniqueAddresses = this.uniqueAddresses.size;

    // Persist to D1 if available
    if (this.db) {
      try {
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
        await this.db
          .prepare(
            `UPDATE viruses
             SET status = ?, eliminated_by = ?, eliminated_at = ?
             WHERE hash = ?`
          )
          .bind(
            targetVirus.status,
            targetVirus.eliminatedBy,
            targetVirus.eliminatedAt,
            targetVirus.hash
          )
          .run();
      } catch (error) {
        console.error("Error persisting vaccine to D1:", error);
      }
    }

    // Broadcast to all connected clients
    const message: ServerMessage = {
      type: MessageType.VIRUS_ELIMINATED,
      virus: targetVirus,
      vaccine,
      stats: this.stats,
    };
    this.room.broadcast(JSON.stringify(message));

    return {
      success: true,
      vaccine,
      virus: targetVirus,
      stats: this.stats,
    };
  }

  getStatus(): StatusResponse {
    const activeViruses = Array.from(this.viruses.values()).filter(
      (v) => v.status === "active"
    );
    return {
      activeViruses,
      stats: this.stats,
    };
  }

  getHistory(limit: number = 100): HistoryResponse {
    const allViruses = Array.from(this.viruses.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    const recentVaccines = this.vaccines
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    return {
      viruses: allViruses,
      vaccines: recentVaccines,
    };
  }

  async onConnect(conn: Party.Connection) {
    await this.ensureInitialized();
    console.log(`Connected: ${conn.id}`);

    // Send current status to new connection
    const statusMessage: ServerMessage = {
      type: MessageType.STATUS_UPDATE,
      activeViruses: Array.from(this.viruses.values()).filter(
        (v) => v.status === "active"
      ),
      stats: this.stats,
    };
    conn.send(JSON.stringify(statusMessage));
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const msg = JSON.parse(message) as ClientMessage;

      if (msg.type === MessageType.GET_STATUS) {
        const response: ServerMessage = {
          type: MessageType.STATUS_UPDATE,
          activeViruses: Array.from(this.viruses.values()).filter(
            (v) => v.status === "active"
          ),
          stats: this.stats,
        };
        sender.send(JSON.stringify(response));
      } else if (msg.type === MessageType.GET_HISTORY) {
        const history = this.getHistory(msg.limit);
        const response: ServerMessage = {
          type: MessageType.HISTORY_UPDATE,
          viruses: history.viruses,
          vaccines: history.vaccines,
        };
        sender.send(JSON.stringify(response));
      }
    } catch (error) {
      console.error("Error handling message:", error);
      const errorResponse: ServerMessage = {
        type: MessageType.ERROR,
        success: false,
        error: "Invalid message format",
      };
      sender.send(JSON.stringify(errorResponse));
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}

Server satisfies Party.Worker;
