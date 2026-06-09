import { EmailAccount, EmailProvider, PrismaClient } from '@prisma/client';

export class EmailAccountRepository {
    constructor(private readonly prisma: PrismaClient) {}

    findByUser(userId: string): Promise<EmailAccount[]> {
        return this.prisma.emailAccount.findMany({ where: { userId } });
    }

    upsertGmailAccount(
        userId: string,
        email: string,
        accessToken: string,
        refreshToken: string,
        tokenExpiry: Date,
    ): Promise<EmailAccount> {
        return this.prisma.emailAccount.upsert({
            where: { userId_provider_email: { userId, provider: EmailProvider.gmail, email } },
            create: { userId, provider: EmailProvider.gmail, email, accessToken, refreshToken, tokenExpiry },
            update: { accessToken, refreshToken, tokenExpiry },
        });
    }

    findAllGmailAccounts(): Promise<EmailAccount[]> {
        return this.prisma.emailAccount.findMany({ where: { provider: EmailProvider.gmail } });
    }
}
