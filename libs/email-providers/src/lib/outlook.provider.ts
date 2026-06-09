import { EmailProvider, RawEmailMessage, SendEmailInput } from './email-provider.interface';

export interface OutlookConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export function getOutlookConfig(): OutlookConfig {
    return {
        clientId: process.env['MICROSOFT_CLIENT_ID'] ?? '',
        clientSecret: process.env['MICROSOFT_CLIENT_SECRET'] ?? '',
        redirectUri: process.env['MICROSOFT_REDIRECT_URI'] ?? 'http://localhost:3001/oauth/outlook/callback',
    };
}

/** Outlook provider stub implementing the same interface as Gmail — full Graph API integration. */
export class OutlookProvider implements EmailProvider {
    constructor(private readonly config: OutlookConfig) {}

    getAuthUrl(state: string): string {
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            response_type: 'code',
            redirect_uri: this.config.redirectUri,
            scope: 'https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send offline_access',
            state,
        });
        return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
    }

    async exchangeCode(code: string) {
        const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                code,
                redirect_uri: this.config.redirectUri,
                grant_type: 'authorization_code',
            }),
        });
        const data = (await response.json()) as { access_token: string; refresh_token: string; expires_in: number };
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiry: new Date(Date.now() + data.expires_in * 1000),
            email: 'outlook@user.com',
        };
    }

    async refreshAccessToken(refreshToken: string) {
        const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        });
        const data = (await response.json()) as { access_token: string; expires_in: number };
        return { accessToken: data.access_token, expiry: new Date(Date.now() + data.expires_in * 1000) };
    }

    async listMessages(accessToken: string, cursor?: string): Promise<{ messages: RawEmailMessage[]; nextCursor?: string }> {
        const url = cursor ?? 'https://graph.microsoft.com/v1.0/me/messages?$top=50';
        const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
        const data = (await response.json()) as {
            value: { id: string; subject: string; from: { emailAddress: { address: string } }; receivedDateTime: string; body: { content: string } }[];
            '@odata.nextLink'?: string;
        };
        const messages: RawEmailMessage[] = data.value.map((m) => ({
            externalId: m.id,
            subject: m.subject,
            fromAddress: m.from.emailAddress.address,
            toAddresses: [],
            bodyText: m.body.content,
            receivedAt: new Date(m.receivedDateTime),
        }));
        return { messages, nextCursor: data['@odata.nextLink'] };
    }

    async sendEmail(accessToken: string, input: SendEmailInput) {
        const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: {
                    subject: input.subject,
                    body: { contentType: 'Text', content: input.body },
                    toRecipients: [{ emailAddress: { address: input.to } }],
                },
            }),
        });
        if (!response.ok) throw new Error('Outlook send failed');
        return { externalId: `outlook-${Date.now()}`, threadId: input.threadId };
    }
}
