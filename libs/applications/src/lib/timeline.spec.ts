import { TimelineService } from './timeline.service';

describe('TimelineService', () => {
    const mockPrisma = {
        application: { findFirst: jest.fn() },
        email: { findMany: jest.fn() },
    } as unknown as import('@prisma/client').PrismaClient;

    const service = new TimelineService(mockPrisma);

    it('returns chronological timeline entries', async () => {
        (mockPrisma.application.findFirst as jest.Mock).mockResolvedValue({
            id: 'a1',
            metadata: {
                history: [
                    { at: '2025-06-02T10:00:00Z', previousStatus: 'applied', newStatus: 'interview', classification: { summary: 'Entretien' } },
                ],
            },
        });
        (mockPrisma.email.findMany as jest.Mock).mockResolvedValue([
            { id: 'e1', subject: 'Candidature', fromAddress: 'me@test.com', receivedAt: new Date('2025-06-01T10:00:00Z'), classification: null },
        ]);

        const timeline = await service.getTimeline('u1', 'a1');
        expect(timeline).toHaveLength(2);
        expect(timeline[0].type).toBe('email');
        expect(timeline[1].type).toBe('status_change');
    });
});
