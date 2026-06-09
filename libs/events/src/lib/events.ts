import { EventType } from '@jtk/shared-types';

export type EventHandler = (payload: unknown, userId: string) => Promise<void>;

/** Event bus stub — full implementation in commit 15. */
export interface EventBus {
    emit(type: EventType, payload: unknown, userId: string): Promise<void>;
    subscribe(type: EventType, handler: EventHandler): void;
}

export class InMemoryEventBus implements EventBus {
    private handlers = new Map<EventType, EventHandler[]>();

    async emit(type: EventType, payload: unknown, userId: string): Promise<void> {
        const handlers = this.handlers.get(type) ?? [];
        await Promise.all(handlers.map((handler) => handler(payload, userId)));
    }

    subscribe(type: EventType, handler: EventHandler): void {
        const handlers = this.handlers.get(type) ?? [];
        handlers.push(handler);
        this.handlers.set(type, handlers);
    }
}
