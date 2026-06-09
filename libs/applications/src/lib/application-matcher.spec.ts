import { ApplicationMatcherService } from './application-matcher.service';

describe('ApplicationMatcherService', () => {
    const mockPrisma = {
        application: { create: jest.fn(), findFirst: jest.fn() },
        email: { findFirst: jest.fn(), update: jest.fn() },
    } as never;

    const service = new ApplicationMatcherService(mockPrisma);

    it('returns null for non job-related emails', async () => {
        const result = await service.matchOrCreate('u1', { id: 'e1', receivedAt: new Date() } as never, {
            isJobRelated: false,
            isApplicationSent: false,
            isRecruiterReply: false,
            cleanBody: '',
            receivedAt: new Date(),
        });
        expect(result).toBeNull();
    });

    it('creates application from application sent email', async () => {
        (mockPrisma.email.findFirst as jest.Mock).mockResolvedValue(null);
        (mockPrisma.application.findFirst as jest.Mock).mockResolvedValue(null);
        (mockPrisma.application.create as jest.Mock).mockResolvedValue({ id: 'app-1', title: 'Dev' });
        (mockPrisma.email.update as jest.Mock).mockResolvedValue({});

        const result = await service.matchOrCreate('u1', { id: 'e1', subject: 'Candidature', receivedAt: new Date() } as never, {
            isJobRelated: true,
            isApplicationSent: true,
            isRecruiterReply: false,
            jobTitle: 'Dev',
            company: 'Acme',
            platform: 'Indeed',
            cleanBody: '',
            receivedAt: new Date(),
        });

        expect(result?.created).toBe(true);
        expect(result?.application.id).toBe('app-1');
    });
});
