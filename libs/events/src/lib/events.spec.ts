import { InMemoryEventBus } from './events';

describe('InMemoryEventBus', () => {
    it('emits to subscribed handlers', async () => {
        const bus = new InMemoryEventBus();
        const handler = jest.fn();
        bus.subscribe('email_received', handler);
        await bus.emit('email_received', { id: '1' }, 'user-1');
        expect(handler).toHaveBeenCalledWith({ id: '1' }, 'user-1');
    });
});
