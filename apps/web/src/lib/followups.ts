import { apiFetch } from './api';

export interface FollowupSuggestion {
    id: string;
    applicationId: string;
    subject: string;
    body: string;
    status: string;
}

export function listFollowupSuggestions(): Promise<FollowupSuggestion[]> {
    return apiFetch<FollowupSuggestion[]>('/followups/suggestions');
}

export function approveFollowup(id: string): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>(`/followups/${id}/approve`, { method: 'POST' });
}
