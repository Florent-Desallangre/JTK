import { FollowupMode } from '@jtk/shared-types';
import { apiFetch } from './api';

export interface UserSettings {
    followupMode: FollowupMode;
    followupDelayDays: number;
    telegramChatId: string | null;
    telegramEnabled: boolean;
}

export function getSettings(): Promise<UserSettings> {
    return apiFetch<UserSettings>('/settings');
}

export function updateSettings(data: Partial<UserSettings>): Promise<UserSettings> {
    return apiFetch<UserSettings>('/settings', { method: 'PUT', body: JSON.stringify(data) });
}
