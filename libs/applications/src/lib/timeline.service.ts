import { PrismaClient } from '@prisma/client';

export interface TimelineEntry {
    type: 'email' | 'status_change' | 'event';
    at: string;
    title: string;
    description?: string;
    metadata?: Record<string, unknown>;
}

export class TimelineService {
    constructor(private readonly prisma: PrismaClient) {}

    async getTimeline(userId: string, applicationId: string): Promise<TimelineEntry[]> {
        const application = await this.prisma.application.findFirst({
            where: { id: applicationId, userId },
        });
        if (!application) throw new Error('NOT_FOUND');

        const emails = await this.prisma.email.findMany({
            where: { applicationId },
            orderBy: { receivedAt: 'asc' },
        });

        const entries: TimelineEntry[] = emails.map((email) => ({
            type: 'email',
            at: email.receivedAt.toISOString(),
            title: email.subject,
            description: email.fromAddress,
            metadata: { emailId: email.id, classification: email.classification },
        }));

        const history = (application.metadata as { history?: { at: string; previousStatus: string; newStatus: string; classification?: { summary: string } }[] })?.history ?? [];
        for (const h of history) {
            if (h.previousStatus !== h.newStatus) {
                entries.push({
                    type: 'status_change',
                    at: h.at,
                    title: `Statut : ${h.previousStatus} → ${h.newStatus}`,
                    description: h.classification?.summary,
                });
            }
        }

        return entries.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    }
}
