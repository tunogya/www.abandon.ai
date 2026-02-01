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
import {
  verifyVirusSignature,
  verifyVaccineSignature,
  isTimestampValid,
} from "./signature";

export default class Server implements Party.Server {
  // In-memory game state
  private viruses: Map<string, Virus> = new Map();
  private vaccines: Vaccine[] = [];
  private stats: GameStats = {
    totalVirusesCreated: 0,
    activeViruses: 0,
    eliminatedViruses: 0,
    totalVaccinesCreated: 0,
    successfulVaccines: 0,
    failedVaccines: 0,
    uniqueAgents: 0,
  };
  private uniqueAgents: Set<string> = new Set();

  constructor(readonly room: Party.Room) {}

  async onRequest(req: Party.Request): Promise<Response> {
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
    const { walletAddress, signature, timestamp, nonce, difficulty, memo = "" } = body;

    // Validate timestamp
    if (!isTimestampValid(timestamp)) {
      return { error: "Timestamp out of acceptable range (must be within 1 hour)" };
    }

    // Verify signature
    const signatureValid = await verifyVirusSignature(
      walletAddress,
      timestamp,
      nonce,
      difficulty,
      memo,
      signature
    );

    if (!signatureValid) {
      return { error: "Invalid signature" };
    }

    // Validate PoW
    const validation = await validateVirusHash(
      walletAddress,
      timestamp,
      nonce,
      difficulty,
      memo
    );

    if (!validation.valid) {
      return { error: validation.error || "Validation failed" };
    }

    // Create virus
    const virus: Virus = {
      id: this.generateId(),
      hash: validation.hash!,
      createdBy: walletAddress,
      createdAt: Date.now(),
      timestamp,
      nonce,
      difficulty,
      memo: memo || undefined,
      status: "active",
    };

    this.viruses.set(virus.hash, virus);
    this.uniqueAgents.add(walletAddress);
    this.stats.totalVirusesCreated++;
    this.stats.activeViruses++;
    this.stats.uniqueAgents = this.uniqueAgents.size;

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
    const { walletAddress, signature, targetVirusHash, timestamp, nonce } = body;

    // Validate timestamp
    if (!isTimestampValid(timestamp)) {
      return { error: "Timestamp out of acceptable range (must be within 1 hour)" };
    }

    // Check if target virus exists
    const targetVirus = this.viruses.get(targetVirusHash);
    if (!targetVirus) {
      return { error: "Target virus not found" };
    }

    if (targetVirus.status === "eliminated") {
      return { error: "Target virus already eliminated" };
    }

    // Verify signature
    const signatureValid = await verifyVaccineSignature(
      walletAddress,
      targetVirusHash,
      timestamp,
      nonce,
      signature
    );

    if (!signatureValid) {
      return { error: "Invalid signature" };
    }

    // Validate PoW (must match target virus difficulty)
    const validation = await validateVaccineHash(
      walletAddress,
      targetVirusHash,
      timestamp,
      nonce,
      targetVirus.difficulty
    );

    if (!validation.valid) {
      return { error: validation.error || "Validation failed" };
    }

    // Create vaccine
    const vaccine: Vaccine = {
      id: this.generateId(),
      hash: validation.hash!,
      createdBy: walletAddress,
      createdAt: Date.now(),
      targetVirusHash,
      timestamp,
      nonce,
      success: true,
      virusId: targetVirus.id,
    };

    this.vaccines.push(vaccine);
    this.uniqueAgents.add(walletAddress);

    // Eliminate virus
    targetVirus.status = "eliminated";
    targetVirus.eliminatedBy = walletAddress;
    targetVirus.eliminatedAt = Date.now();

    this.stats.totalVaccinesCreated++;
    this.stats.successfulVaccines++;
    this.stats.activeViruses--;
    this.stats.eliminatedViruses++;
    this.stats.uniqueAgents = this.uniqueAgents.size;

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

  onConnect(conn: Party.Connection) {
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
        error: "Invalid message format",
      };
      sender.send(JSON.stringify(errorResponse));
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

Server satisfies Party.Worker;
