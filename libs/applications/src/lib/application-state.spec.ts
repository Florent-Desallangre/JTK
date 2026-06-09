import { ApplicationStateService } from './application-state.service';

describe('ApplicationStateService', () => {
    const mockPrisma = {
        application: { findUnique: jest.fn(), update: jest.fn() },
    } as unknown as import('@prisma/client').PrismaClient;

    const service = new ApplicationStateService(mockPrisma);

    it('maps rejection to rejected status', () => {
        const status = service.mapClassificationToStatus({
            type: 'negative',
            confidence: 0.9,
            summary: 'Refus',
            next_action: 'reject',
        });
        expect(status).toBe('rejected');
    });

    it('maps interview to interview status', () => {
        const status = service.mapClassificationToStatus({
            type: 'positive',
            confidence: 0.9,
            summary: 'Entretien',
            next_action: 'interview',
        });
        expect(status).toBe('interview');
    });

    it('updates application with history', async () => {
        (mockPrisma.application.findUnique as jest.Mock).mockResolvedValue({
            id: 'a1',
            status: 'applied',
            metadata: { history: [] },
        });
        (mockPrisma.application.update as jest.Mock).mockResolvedValue({ id: 'a1', status: 'rejected' });

        const result = await service.updateFromClassification(
            'a1',
            'e1',
            { type: 'negative', confidence: 0.9, summary: 'Refus', next_action: 'reject' },
            new Date(),
        );
        expect(result?.status).toBe('rejected');
    });
});
