import { InMemoryEventBus } from './events';
import { EventBusService } from './event-bus.service';
import { EventRepository } from './event.repository';

describe('InMemoryEventBus', () => {
    it('emits to subscribed handlers', async () => {
        const bus = new InMemoryEventBus();
        const handler = jest.fn();
        bus.subscribe('email_received', handler);
        await bus.emit('email_received', { id: '1' }, 'user-1');
        expect(handler).toHaveBeenCalledWith({ id: '1' }, 'user-1');
    });
});

describe('EventBusService', () => {
    const mockRepo = {
        create: jest.fn(),
        findUnprocessed: jest.fn(),
        markProcessed: jest.fn(),
    } as unknown as EventRepository;

    const service = new EventBusService(mockRepo);

    it('persists events on emit', async () => {
        await service.emit('application_created', { id: 'a1' }, 'u1');
        expect(mockRepo.create).toHaveBeenCalledWith('u1', 'application_created', { id: 'a1' });
    });

    it('replays unprocessed events', async () => {
        const handler = jest.fn();
        service.subscribe('application_created', handler);
        (mockRepo.findUnprocessed as jest.Mock).mockResolvedValue([
            { id: 'e1', type: 'application_created', payload: { id: 'a1' }, userId: 'u1' },
        ]);
        const count = await service.processPending();
        expect(count).toBe(1);
        expect(handler).toHaveBeenCalled();
        expect(mockRepo.markProcessed).toHaveBeenCalledWith('e1');
    });
});
