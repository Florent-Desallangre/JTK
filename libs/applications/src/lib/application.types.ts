import { ApplicationStatus } from '@jtk/shared-types';

export interface CreateApplicationInput {
    title: string;
    company?: string;
    source?: string;
    appliedAt?: Date;
}

export interface UpdateApplicationInput {
    title?: string;
    company?: string;
    status?: ApplicationStatus;
    source?: string;
    appliedAt?: Date;
    metadata?: Record<string, unknown>;
}

export const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
    applied: ['interview', 'offer', 'rejected', 'archived'],
    interview: ['offer', 'rejected', 'archived'],
    offer: ['archived'],
    rejected: ['archived'],
    archived: [],
};

export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
    if (from === to) return true;
    return VALID_TRANSITIONS[from].includes(to);
}
