// Frontend type definitions (mirrored from party/types.ts)

export interface Virus {
  id: string;
  hash: string;
  createdBy: string; // wallet address
  createdAt: number;
  timestamp: number;
  nonce: number;
  difficulty: number;
  memo?: string;
  status: 'active' | 'eliminated';
  eliminatedBy?: string;
  eliminatedAt?: number;
}

export interface Vaccine {
  id: string;
  hash: string;
  createdBy: string; // wallet address
  createdAt: number;
  target: string;
  timestamp: number;
  nonce: number;
  success: boolean;
  virusId?: string;
}

export interface GameStats {
  totalVirusesCreated: number;
  activeViruses: number;
  eliminatedViruses: number;
  totalVaccinesCreated: number;
  successfulVaccines: number;
  failedVaccines: number;
  uniqueAddresses: number;
}

export interface AgentStats {
  address: string;
  virusesCreated: number;
  vaccinesCreated: number;
  successfulVaccines: number;
  totalDifficultyCreated: number;
  totalDifficultyEliminated: number;
}

// WebSocket message types
export enum MessageType {
  GET_STATUS = 'GET_STATUS',
  STATUS_UPDATE = 'STATUS_UPDATE',
  VIRUS_CREATED = 'VIRUS_CREATED',
  VACCINE_CREATED = 'VACCINE_CREATED',
  VIRUS_ELIMINATED = 'VIRUS_ELIMINATED',
  ERROR = 'ERROR',
  GET_HISTORY = 'GET_HISTORY',
  HISTORY_UPDATE = 'HISTORY_UPDATE',
}

export type ClientMessage =
  | { type: MessageType.GET_STATUS }
  | { type: MessageType.GET_HISTORY; limit?: number };

export type ServerMessage =
  | {
    type: MessageType.STATUS_UPDATE;
    activeViruses: Virus[];
    stats: GameStats;
  }
  | {
    type: MessageType.VIRUS_CREATED;
    virus: Virus;
    stats: GameStats;
  }
  | {
    type: MessageType.VACCINE_CREATED;
    vaccine: Vaccine;
    stats: GameStats;
  }
  | {
    type: MessageType.VIRUS_ELIMINATED;
    virus: Virus;
    vaccine: Vaccine;
    stats: GameStats;
  }
  | {
    type: MessageType.ERROR;
    success: boolean;
    error: string;
  }
  | {
    type: MessageType.HISTORY_UPDATE;
    viruses: Virus[];
    vaccines: Vaccine[];
  };

// HTTP API request/response types
export interface CreateVirusRequest {
  address: string;
  timestamp: number;
  nonce: number;
  difficulty: number;
  memo?: string;
}

export interface CreateVaccineRequest {
  address: string;
  target: string;
  timestamp: number;
  nonce: number;
}

export interface VirusResponse {
  success: boolean;
  virus: Virus;
  stats: GameStats;
}

export interface VaccineResponse {
  success: boolean;
  vaccine: Vaccine;
  virus?: Virus;
  stats: GameStats;
}

export interface StatusResponse {
  activeViruses: Virus[];
  stats: GameStats;
}

export interface HistoryResponse {
  viruses: Virus[];
  vaccines: Vaccine[];
}

export interface ErrorResponse {
  success: boolean;
  error: string;
}
