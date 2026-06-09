import { Email, PrismaClient } from '@prisma/client';
import { RawEmailMessage } from '@jtk/email-providers';

export class EmailRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async upsertFromSync(
        userId: string,
        emailAccountId: string,
        message: RawEmailMessage,
    ): Promise<{ email: Email; created: boolean }> {
        const existing = await this.prisma.email.findUnique({
            where: { emailAccountId_externalId: { emailAccountId, externalId: message.externalId } },
        });

        if (existing) {
            return { email: existing, created: false };
        }

        const email = await this.prisma.email.create({
            data: {
                userId,
                emailAccountId,
                externalId: message.externalId,
                threadId: message.threadId,
                subject: message.subject,
                fromAddress: message.fromAddress,
                toAddresses: message.toAddresses,
                bodyText: message.bodyText,
                bodyHtml: message.bodyHtml,
                receivedAt: message.receivedAt,
            },
        });

        return { email, created: true };
    }

    findByAccount(emailAccountId: string): Promise<Email[]> {
        return this.prisma.email.findMany({
            where: { emailAccountId },
            orderBy: { receivedAt: 'desc' },
        });
    }
}
