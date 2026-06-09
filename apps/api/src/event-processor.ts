import { EventType } from '@jtk/shared-types';
import { container } from './container';

export function registerEventHandlers(): void {
    const types: EventType[] = [
        'application_created',
        'application_updated',
        'classification_completed',
        'followup_due',
        'followup_sent',
        'email_received',
    ];

    for (const type of types) {
        container.eventBus.subscribe(type, async (payload, userId) => {
            await container.notificationHandler.handle(type, payload, userId);
        });
    }
}

export async function processEvents(): Promise<number> {
    return container.eventBus.processPending();
}
