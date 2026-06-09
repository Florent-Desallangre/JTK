const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

export function getApiUrl(path: string): string {
    return `${API_URL}${path}`;
}

export function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('jtk_token');
}

export function setAuthToken(token: string): void {
    localStorage.setItem('jtk_token', token);
}

export function clearAuthToken(): void {
    localStorage.removeItem('jtk_token');
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getAuthToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(getApiUrl(path), { ...options, headers });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'REQUEST_FAILED');
    }
    return res.json() as Promise<T>;
}
