export const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:8787'
  : 'https://api.abandon.ai';

export const API_ENDPOINTS = {
  STATUS: `${API_BASE}/api/status`,
  VIRUS: `${API_BASE}/api/virus`,
  VACCINE: `${API_BASE}/api/vaccine`,
  HISTORY: `${API_BASE}/api/history`,
} as const;
