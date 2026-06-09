import { ApplicationStatus } from '@jtk/shared-types';
import { ClassificationResult } from '@jtk/classification';
import { Application, PrismaClient } from '@prisma/client';

export class ApplicationStateService {
    constructor(private readonly prisma: PrismaClient) {}

    mapClassificationToStatus(classification: ClassificationResult): ApplicationStatus | null {
        if (classification.summary.toLowerCase().includes('offre')) return 'offer';
        if (classification.type === 'negative' && classification.next_action === 'reject') return 'rejected';
        if (classification.type === 'positive' && classification.next_action === 'interview') return 'interview';
        return null;
    }

    async updateFromClassification(
        applicationId: string,
        emailId: string,
        classification: ClassificationResult,
        receivedAt: Date,
    ): Promise<Application | null> {
        const newStatus = this.mapClassificationToStatus(classification);
        const application = await this.prisma.application.findUnique({ where: { id: applicationId } });
        if (!application) return null;

        const history = Array.isArray((application.metadata as { history?: unknown[] })?.history)
            ? (application.metadata as { history: unknown[] }).history
            : [];

        history.push({
            at: receivedAt.toISOString(),
            emailId,
            classification,
            previousStatus: application.status,
            newStatus: newStatus ?? application.status,
        });

        return this.prisma.application.update({
            where: { id: applicationId },
            data: {
                status: newStatus ?? application.status,
                lastEmailAt: receivedAt,
                metadata: { history } as object,
            },
        });
    }
}
