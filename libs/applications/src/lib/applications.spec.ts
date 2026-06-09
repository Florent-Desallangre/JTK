import { ApplicationService } from './application.service';
import { ApplicationRepository } from './application.repository';
import { canTransition } from './application.types';

describe('ApplicationService', () => {
    const mockRepo = {
        findAllByUser: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    } as unknown as ApplicationRepository;
    const service = new ApplicationService(mockRepo);

    beforeEach(() => jest.clearAllMocks());

    it('creates application for user', async () => {
        (mockRepo.create as jest.Mock).mockResolvedValue({ id: '1', title: 'Dev', userId: 'u1' });
        const result = await service.create('u1', { title: 'Dev' });
        expect(result.id).toBe('1');
    });

    it('rejects invalid status transition', async () => {
        (mockRepo.findById as jest.Mock).mockResolvedValue({ id: '1', status: 'rejected', userId: 'u1' });
        await expect(service.update('u1', '1', { status: 'interview' })).rejects.toThrow('INVALID_STATUS_TRANSITION');
    });

    it('isolates users - not found for wrong user', async () => {
        (mockRepo.findById as jest.Mock).mockResolvedValue(null);
        await expect(service.getById('u2', '1')).rejects.toThrow('NOT_FOUND');
    });
});

describe('canTransition', () => {
    it('allows applied to interview', () => {
        expect(canTransition('applied', 'interview')).toBe(true);
    });

    it('blocks rejected to interview', () => {
        expect(canTransition('rejected', 'interview')).toBe(false);
    });
});
