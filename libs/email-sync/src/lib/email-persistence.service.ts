import { EmailAccount, PrismaClient } from '@prisma/client';
import { GmailSyncService } from './gmail-sync.service';
import { EmailRepository } from './email.repository';

export interface PersistResult {
    accountId: string;
    newCount: number;
    totalSynced: number;
}

export class EmailPersistenceService {
    constructor(
        private readonly syncService: GmailSyncService,
        private readonly emailRepository: EmailRepository,
        private readonly prisma: PrismaClient,
    ) {}

    async syncAndPersist(account: EmailAccount): Promise<PersistResult> {
        const syncResult = await this.syncService.syncAccount(account);
        let newCount = 0;

        for (const message of syncResult.messages) {
            const { created } = await this.emailRepository.upsertFromSync(account.userId, account.id, message);
            if (created) newCount++;
        }

        await this.prisma.emailAccount.update({
            where: { id: account.id },
            data: {
                lastSyncAt: new Date(),
                syncCursor: syncResult.nextCursor ?? account.syncCursor,
            },
        });

        return { accountId: account.id, newCount, totalSynced: syncResult.messages.length };
    }
}
