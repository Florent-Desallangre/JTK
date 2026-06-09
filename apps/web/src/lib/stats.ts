import { apiFetch } from './api';

export interface DashboardStats {
    total: number;
    byStatus: Record<string, number>;
    responseRate: number;
    pendingFollowups: number;
}

export function getStats(): Promise<DashboardStats> {
    return apiFetch<DashboardStats>('/stats');
}
