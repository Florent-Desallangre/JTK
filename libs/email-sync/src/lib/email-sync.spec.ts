import { GmailSyncService } from './gmail-sync.service';
import { GmailProvider } from '@jtk/email-providers';

describe('GmailSyncService', () => {
    const mockProvider = {
        listMessages: jest.fn(),
        refreshAccessToken: jest.fn(),
    } as unknown as GmailProvider;

    const service = new GmailSyncService(mockProvider);

    it('syncs messages from gmail provider', async () => {
        (mockProvider.listMessages as jest.Mock).mockResolvedValue({
            messages: [{ externalId: 'm1', subject: 'Test', fromAddress: 'a@b.com', toAddresses: [], receivedAt: new Date() }],
            nextCursor: 'cursor-1',
        });

        const result = await service.syncAccount({
            id: 'acc-1',
            accessToken: 'token',
            refreshToken: 'refresh',
            tokenExpiry: new Date(Date.now() + 3600_000),
            syncCursor: null,
        } as never);

        expect(result.messages).toHaveLength(1);
        expect(result.nextCursor).toBe('cursor-1');
    });

    it('syncs all accounts', async () => {
        (mockProvider.listMessages as jest.Mock).mockResolvedValue({ messages: [], nextCursor: undefined });
        const results = await service.syncAllAccounts([{ id: 'a1', accessToken: 't', refreshToken: 'r', tokenExpiry: new Date(Date.now() + 3600_000) } as never]);
        expect(results).toHaveLength(1);
    });
});
