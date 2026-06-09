import { apiFetch, clearAuthToken, setAuthToken } from './api';

export interface AuthUser {
    id: string;
    email: string;
}

export interface AuthResponse {
    user: AuthUser;
    token: string;
}

export async function register(email: string, password: string): Promise<AuthResponse> {
    const result = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    setAuthToken(result.token);
    return result;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
    const result = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    setAuthToken(result.token);
    return result;
}

export async function getMe(): Promise<AuthUser> {
    return apiFetch<AuthUser>('/auth/me');
}

export function logout(): void {
    clearAuthToken();
}
