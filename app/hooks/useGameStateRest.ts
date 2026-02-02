import { useState, useEffect, useCallback, useRef } from 'react';
import type { Virus, GameStats, StatusResponse } from '../../shared/types';
import { API_ENDPOINTS } from '../config/api';

interface GameState {
  activeViruses: Virus[];
  stats: GameStats;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

export function useGameStateRest() {
  const [gameState, setGameState] = useState<GameState>({
    activeViruses: [],
    stats: {
      totalVirusesCreated: 0,
      activeViruses: 0,
      eliminatedViruses: 0,
      uniqueAddresses: 0,
    },
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const intervalRef = useRef<number>(undefined);
  const isVisibleRef = useRef<boolean>(true);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.STATUS);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: StatusResponse = await response.json();

      setGameState({
        activeViruses: data.activeViruses,
        stats: data.stats,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error('Failed to fetch status:', error);
      setGameState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;

      // Immediately fetch when page becomes visible
      if (!document.hidden) {
        fetchStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchStatus]);

  // Initial load + polling
  useEffect(() => {
    fetchStatus();

    // Poll every 3 seconds when page is visible, 30 seconds when hidden
    const startPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const pollInterval = isVisibleRef.current ? 3000 : 30000;

      intervalRef.current = window.setInterval(() => {
        if (isVisibleRef.current) {
          fetchStatus();
        }
      }, pollInterval);
    };

    startPolling();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchStatus]);

  // Manual refresh function
  const refresh = useCallback(() => {
    setGameState(prev => ({ ...prev, loading: true }));
    fetchStatus();
  }, [fetchStatus]);

  return {
    ...gameState,
    refresh,
  };
}
