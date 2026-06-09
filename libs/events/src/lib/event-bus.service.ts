import { EventType } from '@jtk/shared-types';
import { EventHandler } from './events';
import { EventRepository } from './event.repository';

export class EventBusService {
    private handlers = new Map<EventType, EventHandler[]>();

    constructor(private readonly repository: EventRepository) {}

    subscribe(type: EventType, handler: EventHandler): void {
        const handlers = this.handlers.get(type) ?? [];
        handlers.push(handler);
        this.handlers.set(type, handlers);
    }

    async emit(type: EventType, payload: unknown, userId: string): Promise<void> {
        await this.repository.create(userId, type, payload as object);
    }

    async processPending(): Promise<number> {
        const events = await this.repository.findUnprocessed();
        for (const event of events) {
            const handlers = this.handlers.get(event.type as EventType) ?? [];
            await Promise.all(handlers.map((h) => h(event.payload, event.userId)));
            await this.repository.markProcessed(event.id);
        }
        return events.length;
    }
}
