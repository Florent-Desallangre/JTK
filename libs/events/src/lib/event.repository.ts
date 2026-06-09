import { EventType, PrismaClient } from '@prisma/client';
import { EventType as SharedEventType } from '@jtk/shared-types';

export class EventRepository {
    constructor(private readonly prisma: PrismaClient) {}

    create(userId: string, type: SharedEventType, payload: object) {
        return this.prisma.event.create({
            data: { userId, type: type as EventType, payload },
        });
    }

    findUnprocessed(limit = 50) {
        return this.prisma.event.findMany({
            where: { processed: false },
            orderBy: { createdAt: 'asc' },
            take: limit,
        });
    }

    markProcessed(id: string) {
        return this.prisma.event.update({
            where: { id },
            data: { processed: true, processedAt: new Date() },
        });
    }
}
