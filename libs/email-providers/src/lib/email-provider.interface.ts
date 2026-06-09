export interface RawEmailMessage {
    externalId: string;
    threadId?: string;
    subject: string;
    fromAddress: string;
    toAddresses: string[];
    bodyText?: string;
    bodyHtml?: string;
    receivedAt: Date;
}

export interface SendEmailInput {
    to: string;
    subject: string;
    body: string;
    threadId?: string;
    inReplyTo?: string;
}

export interface EmailProvider {
    getAuthUrl(state: string): string;
    exchangeCode(code: string): Promise<{ accessToken: string; refreshToken: string; expiry: Date; email: string }>;
    refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiry: Date }>;
    listMessages(accessToken: string, cursor?: string): Promise<{ messages: RawEmailMessage[]; nextCursor?: string }>;
    sendEmail(accessToken: string, input: SendEmailInput): Promise<{ externalId: string; threadId?: string }>;
}
