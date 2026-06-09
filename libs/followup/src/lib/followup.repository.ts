import { PrismaClient } from '@prisma/client';
import { FollowupSuggestion, FollowupStatus } from './followup.types';

export class FollowupRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async createSuggestion(data: Omit<FollowupSuggestion, 'id' | 'createdAt' | 'status'> & { status?: FollowupStatus }): Promise<FollowupSuggestion> {
        const record = await this.prisma.event.create({
            data: {
                userId: data.userId,
                type: 'followup_due',
                payload: {
                    applicationId: data.applicationId,
                    subject: data.subject,
                    body: data.body,
                    status: data.status ?? 'pending',
                },
            },
        });
        const payload = record.payload as { applicationId: string; subject: string; body: string; status: FollowupStatus };
        return {
            id: record.id,
            applicationId: payload.applicationId,
            userId: record.userId,
            subject: payload.subject,
            body: payload.body,
            status: payload.status,
            createdAt: record.createdAt,
        };
    }

    findPendingByUser(userId: string): Promise<FollowupSuggestion[]> {
        return this.prisma.event
            .findMany({
                where: { userId, type: 'followup_due', processed: false },
                orderBy: { createdAt: 'desc' },
            })
            .then((events) =>
                events.map((e) => {
                    const p = e.payload as { applicationId: string; subject: string; body: string; status?: FollowupStatus };
                    return {
                        id: e.id,
                        applicationId: p.applicationId,
                        userId: e.userId,
                        subject: p.subject,
                        body: p.body,
                        status: p.status ?? 'pending',
                        createdAt: e.createdAt,
                    };
                }),
            );
    }

    async updateStatus(id: string, status: FollowupStatus): Promise<void> {
        const event = await this.prisma.event.findUnique({ where: { id } });
        if (!event) return;
        const payload = { ...(event.payload as object), status };
        await this.prisma.event.update({ where: { id }, data: { payload } });
    }
}
