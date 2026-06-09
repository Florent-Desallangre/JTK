import { EmailAccount, EmailConnectionType, EmailProvider, PrismaClient } from '@prisma/client';
import { encryptToken } from '@jtk/shared-types';

export class EmailAccountRepository {
    constructor(private readonly prisma: PrismaClient) {}

    findByUser(userId: string): Promise<EmailAccount[]> {
        return this.prisma.emailAccount.findMany({ where: { userId } });
    }

    upsertOAuthAccount(
        userId: string,
        provider: EmailProvider,
        email: string,
        accessToken: string,
        refreshToken: string,
        tokenExpiry: Date,
    ): Promise<EmailAccount> {
        return this.prisma.emailAccount.upsert({
            where: { userId_provider_email: { userId, provider, email } },
            create: {
                userId,
                provider,
                connectionType: EmailConnectionType.oauth,
                email,
                accessToken: encryptToken(accessToken),
                refreshToken: encryptToken(refreshToken),
                tokenExpiry,
            },
            update: {
                connectionType: EmailConnectionType.oauth,
                accessToken: encryptToken(accessToken),
                refreshToken: encryptToken(refreshToken),
                tokenExpiry,
                imapHost: null,
                imapPort: null,
                smtpHost: null,
                smtpPort: null,
            },
        });
    }

    /** @deprecated Use upsertOAuthAccount */
    upsertGmailAccount(
        userId: string,
        email: string,
        accessToken: string,
        refreshToken: string,
        tokenExpiry: Date,
    ): Promise<EmailAccount> {
        return this.upsertOAuthAccount(userId, EmailProvider.gmail, email, accessToken, refreshToken, tokenExpiry);
    }

    upsertImapAccount(
        userId: string,
        provider: EmailProvider,
        email: string,
        password: string,
        imapHost: string,
        imapPort: number,
        smtpHost: string,
        smtpPort: number,
    ): Promise<EmailAccount> {
        return this.prisma.emailAccount.upsert({
            where: { userId_provider_email: { userId, provider, email } },
            create: {
                userId,
                provider,
                connectionType: EmailConnectionType.imap,
                email,
                accessToken: encryptToken(password),
                refreshToken: encryptToken(password),
                tokenExpiry: null,
                imapHost,
                imapPort,
                smtpHost,
                smtpPort,
            },
            update: {
                connectionType: EmailConnectionType.imap,
                accessToken: encryptToken(password),
                refreshToken: encryptToken(password),
                tokenExpiry: null,
                imapHost,
                imapPort,
                smtpHost,
                smtpPort,
            },
        });
    }

    findAllAccounts(): Promise<EmailAccount[]> {
        return this.prisma.emailAccount.findMany();
    }

    /** @deprecated Use findAllAccounts */
    findAllGmailAccounts(): Promise<EmailAccount[]> {
        return this.findAllAccounts();
    }
}
