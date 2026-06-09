import { EmailConnectionType } from '@prisma/client';
import { encryptToken } from '@jtk/shared-types';
import { EmailSyncService } from './email-sync.service';
import { GmailProvider, ImapProvider, OutlookProvider } from '@jtk/email-providers';

describe('EmailSyncService', () => {
    const mockGmail = {
        listMessages: jest.fn(),
        refreshAccessToken: jest.fn(),
    } as unknown as GmailProvider;
    const mockOutlook = {
        listMessages: jest.fn(),
        refreshAccessToken: jest.fn(),
    } as unknown as OutlookProvider;
    const mockImap = {
        listMessages: jest.fn(),
    } as unknown as ImapProvider;

    const service = new EmailSyncService(mockGmail, mockOutlook, mockImap);

    it('syncs oauth gmail messages', async () => {
        (mockGmail.listMessages as jest.Mock).mockResolvedValue({
            messages: [{ externalId: 'm1', subject: 'Test', fromAddress: 'a@b.com', toAddresses: [], receivedAt: new Date() }],
            nextCursor: 'cursor-1',
        });

        const result = await service.syncAccount({
            id: 'acc-1',
            provider: 'gmail',
            connectionType: EmailConnectionType.oauth,
            accessToken: encryptToken('token'),
            refreshToken: encryptToken('refresh'),
            tokenExpiry: new Date(Date.now() + 3600_000),
            syncCursor: null,
        } as never);

        expect(result.messages).toHaveLength(1);
        expect(result.nextCursor).toBe('cursor-1');
    });

    it('syncs imap messages', async () => {
        (mockImap.listMessages as jest.Mock).mockResolvedValue({
            messages: [{ externalId: '42', subject: 'IMAP', fromAddress: 'a@b.com', toAddresses: [], receivedAt: new Date() }],
            nextCursor: '42',
        });

        const result = await service.syncAccount({
            id: 'acc-2',
            provider: 'gmail',
            connectionType: EmailConnectionType.imap,
            email: 'user@gmail.com',
            accessToken: encryptToken('app-password'),
            imapHost: 'imap.gmail.com',
            imapPort: 993,
            syncCursor: null,
        } as never);

        expect(result.messages).toHaveLength(1);
        expect(mockImap.listMessages).toHaveBeenCalled();
    });

    it('syncs all accounts', async () => {
        (mockGmail.listMessages as jest.Mock).mockResolvedValue({ messages: [], nextCursor: undefined });
        const results = await service.syncAllAccounts([
            {
                id: 'a1',
                provider: 'gmail',
                connectionType: EmailConnectionType.oauth,
                accessToken: encryptToken('t'),
                refreshToken: encryptToken('r'),
                tokenExpiry: new Date(Date.now() + 3600_000),
            } as never,
        ]);
        expect(results).toHaveLength(1);
    });
});
