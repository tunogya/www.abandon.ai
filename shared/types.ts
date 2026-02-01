// Shared type definitions for abandon.ai
// Used by both Workers API and React frontend

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
