import { google } from 'googleapis';
import { EmailProvider, RawEmailMessage, SendEmailInput } from './email-provider.interface';
import { GMAIL_SCOPES, GmailConfig } from './gmail.config';

export class GmailProvider implements EmailProvider {
    constructor(private readonly config: GmailConfig) {}

    private createOAuthClient() {
        return new google.auth.OAuth2(this.config.clientId, this.config.clientSecret, this.config.redirectUri);
    }

    getAuthUrl(state: string): string {
        const client = this.createOAuthClient();
        return client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: GMAIL_SCOPES,
            state,
        });
    }

    async exchangeCode(code: string) {
        const client = this.createOAuthClient();
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: 'v2', auth: client });
        const userInfo = await oauth2.userinfo.get();

        return {
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token!,
            expiry: new Date(tokens.expiry_date ?? Date.now() + 3600_000),
            email: userInfo.data.email!,
        };
    }

    async refreshAccessToken(refreshToken: string) {
        const client = this.createOAuthClient();
        client.setCredentials({ refresh_token: refreshToken });
        const { credentials } = await client.refreshAccessToken();
        return {
            accessToken: credentials.access_token!,
            expiry: new Date(credentials.expiry_date ?? Date.now() + 3600_000),
        };
    }

    async listMessages(accessToken: string, cursor?: string): Promise<{ messages: RawEmailMessage[]; nextCursor?: string }> {
        const client = this.createOAuthClient();
        client.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: 'v1', auth: client });

        const listParams: { userId: string; maxResults: number; pageToken?: string; q?: string } = {
            userId: 'me',
            maxResults: 50,
        };
        if (cursor) listParams.pageToken = cursor;

        const list = await gmail.users.messages.list(listParams);
        const messages: RawEmailMessage[] = [];

        for (const msg of list.data.messages ?? []) {
            const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id!, format: 'full' });
            const headers = detail.data.payload?.headers ?? [];
            const getHeader = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? '';

            const bodyText = extractBody(detail.data.payload);
            messages.push({
                externalId: msg.id!,
                threadId: detail.data.threadId ?? undefined,
                subject: getHeader('Subject'),
                fromAddress: getHeader('From'),
                toAddresses: getHeader('To').split(',').map((s) => s.trim()).filter(Boolean),
                bodyText,
                receivedAt: new Date(Number(detail.data.internalDate)),
            });
        }

        return { messages, nextCursor: list.data.nextPageToken ?? undefined };
    }

    async sendEmail(accessToken: string, input: SendEmailInput) {
        const client = this.createOAuthClient();
        client.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: 'v1', auth: client });

        const lines = [
            `To: ${input.to}`,
            `Subject: ${input.subject}`,
            'Content-Type: text/plain; charset=utf-8',
            '',
            input.body,
        ];
        const raw = Buffer.from(lines.join('\r\n')).toString('base64url');

        const result = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw,
                threadId: input.threadId,
            },
        });

        return { externalId: result.data.id!, threadId: result.data.threadId ?? undefined };
    }
}

function extractBody(payload: { body?: { data?: string | null }; parts?: { mimeType?: string | null; body?: { data?: string | null } }[] } | undefined): string {
    if (!payload) return '';
    if (payload.body?.data) {
        return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }
    for (const part of payload.parts ?? []) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
            return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
    }
    return '';
}
