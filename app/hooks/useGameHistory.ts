import { useState, useEffect, useCallback, useRef } from 'react';
import type { Virus, Vaccine, HistoryResponse } from '../../shared/types';
import { API_ENDPOINTS } from '../config/api';

interface GameHistory {
    viruses: Virus[];
    vaccines: Vaccine[];
    loading: boolean;
    error: string | null;
    lastUpdated: number | null;
}

export function useGameHistory(limit: number = 100) {
    const [history, setHistory] = useState<GameHistory>({
        viruses: [],
        vaccines: [],
        loading: true,
        error: null,
        lastUpdated: null,
    });

    const intervalRef = useRef<number>(undefined);
    const isVisibleRef = useRef<boolean>(true);

    const fetchHistory = useCallback(async () => {
        try {
            const response = await fetch(`${API_ENDPOINTS.HISTORY}?limit=${limit}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data: HistoryResponse = await response.json();

            setHistory({
                viruses: data.viruses,
                vaccines: data.vaccines,
                loading: false,
                error: null,
                lastUpdated: Date.now(),
            });
        } catch (error) {
            console.error('Failed to fetch history:', error);
            setHistory(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }));
        }
    }, [limit]);

    // Handle page visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            isVisibleRef.current = !document.hidden;

            // Immediately fetch when page becomes visible
            if (!document.hidden) {
                fetchHistory();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchHistory]);

    // Initial load + polling
    useEffect(() => {
        fetchHistory();

        // Poll every 5 seconds when page is visible, 60 seconds when hidden
        const startPolling = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            const pollInterval = isVisibleRef.current ? 5000 : 60000;

            intervalRef.current = window.setInterval(() => {
                if (isVisibleRef.current) {
                    fetchHistory();
                }
            }, pollInterval);
        };

        startPolling();

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [fetchHistory]);

    // Manual refresh function
    const refresh = useCallback(() => {
        setHistory(prev => ({ ...prev, loading: true }));
        fetchHistory();
    }, [fetchHistory]);

    return {
        ...history,
        refresh,
    };
}
