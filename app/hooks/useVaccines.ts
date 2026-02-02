import { useState, useEffect, useCallback, useRef } from 'react';
import type { Vaccine } from '../../shared/types';
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

export function useVaccines(initialPage: number = 1, limit: number = 30) {
    const [page, setPage] = useState(initialPage);
    const [data, setData] = useState<PaginatedData<Vaccine>>({
        items: [],
        loading: true,
        error: null,
        pagination: null,
    });

    const isVisibleRef = useRef<boolean>(true);

    const fetchVaccines = useCallback(async (pageNum: number) => {
        try {
            setData(prev => ({ ...prev, loading: true }));
            const response = await fetch(`${API_ENDPOINTS.VACCINE}?page=${pageNum}&limit=${limit}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                setData({
                    items: result.vaccines,
                    loading: false,
                    error: null,
                    pagination: result.pagination,
                });
            } else {
                throw new Error(result.error || 'Failed to fetch vaccines');
            }
        } catch (error) {
            console.error('Failed to fetch vaccines:', error);
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
                fetchVaccines(page);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchVaccines, page]);

    // Initial load and page change
    useEffect(() => {
        fetchVaccines(page);
    }, [fetchVaccines, page]);

    // Polling only on first page
    useEffect(() => {
        if (page !== 1) return;

        const interval = setInterval(() => {
            if (isVisibleRef.current) {
                fetchVaccines(1);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [fetchVaccines, page]);

    const refresh = useCallback(() => {
        fetchVaccines(page);
    }, [fetchVaccines, page]);

    return {
        vaccines: data.items,
        loading: data.loading,
        error: data.error,
        pagination: data.pagination,
        page,
        setPage,
        refresh,
    };
}
