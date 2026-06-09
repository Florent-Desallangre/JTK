import { EmailAccount } from '@prisma/client';
import { GmailProvider, RawEmailMessage } from '@jtk/email-providers';

export interface SyncResult {
    accountId: string;
    messages: RawEmailMessage[];
    nextCursor?: string;
}

export class GmailSyncService {
    constructor(private readonly gmailProvider: GmailProvider) {}

    async syncAccount(account: EmailAccount): Promise<SyncResult> {
        let accessToken = account.accessToken;

        if (account.tokenExpiry && account.tokenExpiry < new Date()) {
            const refreshed = await this.gmailProvider.refreshAccessToken(account.refreshToken);
            accessToken = refreshed.accessToken;
        }

        const { messages, nextCursor } = await this.gmailProvider.listMessages(accessToken, account.syncCursor ?? undefined);

        return {
            accountId: account.id,
            messages,
            nextCursor,
        };
    }

    async syncAllAccounts(accounts: EmailAccount[]): Promise<SyncResult[]> {
        const results: SyncResult[] = [];
        for (const account of accounts) {
            try {
                const result = await this.syncAccount(account);
                results.push(result);
            } catch (error) {
                console.error(`Sync failed for account ${account.id}:`, error);
            }
        }
        return results;
    }
}
