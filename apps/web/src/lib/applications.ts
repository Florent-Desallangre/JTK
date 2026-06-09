import { ApplicationStatus } from '@jtk/shared-types';
import { apiFetch } from './api';

export interface Application {
    id: string;
    title: string;
    company: string | null;
    status: ApplicationStatus;
    source: string | null;
    appliedAt: string | null;
    lastEmailAt: string | null;
}

export interface CreateApplicationDto {
    title: string;
    company?: string;
    source?: string;
}

export function listApplications(): Promise<Application[]> {
    return apiFetch<Application[]>('/applications');
}

export function createApplication(data: CreateApplicationDto): Promise<Application> {
    return apiFetch<Application>('/applications', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function deleteApplication(id: string): Promise<void> {
    return apiFetch<void>(`/applications/${id}`, { method: 'DELETE' });
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
    applied: 'Candidaté',
    interview: 'Entretien',
    offer: 'Offre',
    rejected: 'Refusé',
    archived: 'Archivé',
};
