import { EmailPersistenceService } from './email-persistence.service';
import { GmailSyncService } from './gmail-sync.service';
import { EmailRepository } from './email.repository';

describe('EmailPersistenceService', () => {
    const mockSync = { syncAccount: jest.fn() } as unknown as GmailSyncService;
    const mockRepo = { upsertFromSync: jest.fn() } as unknown as EmailRepository;
    const mockPrisma = {
        emailAccount: { update: jest.fn() },
    } as never;

    const service = new EmailPersistenceService(mockSync, mockRepo, mockPrisma);

    const account = {
        id: 'acc-1',
        userId: 'u1',
        syncCursor: null,
    } as never;

    beforeEach(() => jest.clearAllMocks());

    it('deduplicates emails on persist', async () => {
        const msg = { externalId: 'm1', subject: 'S', fromAddress: 'a@b.com', toAddresses: [], receivedAt: new Date() };
        (mockSync.syncAccount as jest.Mock).mockResolvedValue({ messages: [msg, msg], nextCursor: 'c1' });
        (mockRepo.upsertFromSync as jest.Mock)
            .mockResolvedValueOnce({ created: true })
            .mockResolvedValueOnce({ created: false });

        const result = await service.syncAndPersist(account);
        expect(result.newCount).toBe(1);
        expect(mockRepo.upsertFromSync).toHaveBeenCalledTimes(2);
    });
});
