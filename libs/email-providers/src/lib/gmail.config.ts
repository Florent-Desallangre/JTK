export interface GmailConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export function getGmailConfig(): GmailConfig {
    return {
        clientId: process.env['GMAIL_CLIENT_ID'] ?? '',
        clientSecret: process.env['GMAIL_CLIENT_SECRET'] ?? '',
        redirectUri: process.env['GMAIL_REDIRECT_URI'] ?? 'http://localhost:3001/oauth/gmail/callback',
    };
}

export const GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email',
];
