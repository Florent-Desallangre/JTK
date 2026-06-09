export interface AuthConfig {
    jwtSecret: string;
    jwtExpiresIn: string;
}

export function getAuthConfig(): AuthConfig {
    return {
        jwtSecret: process.env['JWT_SECRET'] ?? 'dev-secret-change-me',
        jwtExpiresIn: process.env['JWT_EXPIRES_IN'] ?? '7d',
    };
}
