import { FollowupService } from './followup.service';
import { FollowupRepository } from './followup.repository';

describe('FollowupService', () => {
    const mockPrisma = {
        userSettings: { findMany: jest.fn(), findUnique: jest.fn() },
        application: { findMany: jest.fn() },
        event: { findFirst: jest.fn() },
        emailAccount: { findFirst: jest.fn() },
    } as unknown as import('@prisma/client').PrismaClient;

    const mockRepo = { createSuggestion: jest.fn(), findPendingByUser: jest.fn(), updateStatus: jest.fn() } as unknown as FollowupRepository;
    const mockOllama = { generateFollowupEmail: jest.fn() } as unknown as import('@jtk/classification').OllamaClient;
    const mockGmail = { sendEmail: jest.fn() } as unknown as import('@jtk/email-providers').GmailProvider;
    const mockEventBus = { emit: jest.fn() } as unknown as import('@jtk/events').EventBusService;

    const service = new FollowupService(mockPrisma, mockRepo, mockOllama, mockGmail, mockEventBus);

    it('finds due applications', async () => {
        (mockPrisma.userSettings.findMany as jest.Mock).mockResolvedValue([{ userId: 'u1', followupDelayDays: 7 }]);
        (mockPrisma.application.findMany as jest.Mock).mockResolvedValue([{ id: 'a1', title: 'Dev', company: 'Acme' }]);
        (mockPrisma.event.findFirst as jest.Mock).mockResolvedValue(null);

        const due = await service.findDueApplications();
        expect(due).toHaveLength(1);
    });

    it('generates followup suggestion via ollama', async () => {
        (mockOllama.generateFollowupEmail as jest.Mock).mockResolvedValue({ subject: 'Relance', body: 'Bonjour' });
        (mockRepo.createSuggestion as jest.Mock).mockResolvedValue({ id: 'f1', subject: 'Relance', body: 'Bonjour' });

        const result = await service.generateSuggestion('u1', 'a1', 'Dev', 'Acme');
        expect(result.subject).toBe('Relance');
    });
});
