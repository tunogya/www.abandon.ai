import { useState, useEffect, useCallback, useRef } from 'react';
import type { Virus } from '../../shared/types';
import { API_ENDPOINTS } from '../config/api';

interface PaginatedData<T> {
    items: T[];
    loading: boolean;
    error: string | null;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    } | null;
}

export function useViruses(initialPage: number = 1, limit: number = 30) {
    const [page, setPage] = useState(initialPage);
    const [data, setData] = useState<PaginatedData<Virus>>({
        items: [],
        loading: true,
        error: null,
        pagination: null,
    });

    const isVisibleRef = useRef<boolean>(true);

    const fetchViruses = useCallback(async (pageNum: number) => {
        try {
            setData(prev => ({ ...prev, loading: true }));
            const response = await fetch(`${API_ENDPOINTS.VIRUS}?page=${pageNum}&limit=${limit}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                setData({
                    items: result.viruses,
                    loading: false,
                    error: null,
                    pagination: result.pagination,
                });
            } else {
                throw new Error(result.error || 'Failed to fetch viruses');
            }
        } catch (error) {
            console.error('Failed to fetch viruses:', error);
            setData(prev => ({
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
            if (!document.hidden) {
                fetchViruses(page);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchViruses, page]);

    // Initial load and page change
    useEffect(() => {
        fetchViruses(page);
    }, [fetchViruses, page]);

    // Polling only on first page
    useEffect(() => {
        if (page !== 1) return;

        const interval = setInterval(() => {
            if (isVisibleRef.current) {
                fetchViruses(1);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [fetchViruses, page]);

    const refresh = useCallback(() => {
        fetchViruses(page);
    }, [fetchViruses, page]);

    return {
        viruses: data.items,
        loading: data.loading,
        error: data.error,
        pagination: data.pagination,
        page,
        setPage,
        refresh,
    };
}
