import { EmailAccount, EmailConnectionType } from '@prisma/client';
import { GmailProvider, ImapProvider, OutlookProvider, RawEmailMessage } from '@jtk/email-providers';
import { decryptToken } from '@jtk/shared-types';

export interface SyncResult {
    accountId: string;
    messages: RawEmailMessage[];
    nextCursor?: string;
}

export class EmailSyncService {
    constructor(
        private readonly gmailProvider: GmailProvider,
        private readonly outlookProvider: OutlookProvider,
        private readonly imapProvider: ImapProvider,
    ) {}

    async syncAccount(account: EmailAccount): Promise<SyncResult> {
        if (account.connectionType === EmailConnectionType.imap) {
            const password = decryptToken(account.accessToken);
            const { messages, nextCursor } = await this.imapProvider.listMessages(
                {
                    email: account.email,
                    password,
                    imapHost: account.imapHost!,
                    imapPort: account.imapPort!,
                },
                account.syncCursor ?? undefined,
            );

            return {
                accountId: account.id,
                messages,
                nextCursor,
            };
        }

        const provider = account.provider === 'gmail' ? this.gmailProvider : this.outlookProvider;
        let accessToken = decryptToken(account.accessToken);

        if (account.tokenExpiry && account.tokenExpiry < new Date()) {
            const refreshed = await provider.refreshAccessToken(decryptToken(account.refreshToken));
            accessToken = refreshed.accessToken;
        }

        const { messages, nextCursor } = await provider.listMessages(accessToken, account.syncCursor ?? undefined);

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
                results.push(await this.syncAccount(account));
            } catch (error) {
                console.error(`Sync failed for account ${account.id}:`, error);
            }
        }
        return results;
    }
}
