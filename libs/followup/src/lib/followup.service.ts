import { PrismaClient } from '@prisma/client';
import { OllamaClient } from '@jtk/classification';
import { EventBusService } from '@jtk/events';
import { EmailSenderService } from '@jtk/email-providers';
import { FollowupRepository } from './followup.repository';
import { FollowupSuggestion } from './followup.types';

export class FollowupService {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly repository: FollowupRepository,
        private readonly ollamaClient: OllamaClient,
        private readonly emailSender: EmailSenderService,
        private readonly eventBus: EventBusService,
    ) {}

    async findDueApplications(): Promise<{ userId: string; applicationId: string; title: string; company: string | null }[]> {
        const settings = await this.prisma.userSettings.findMany();
        const due: { userId: string; applicationId: string; title: string; company: string | null }[] = [];

        for (const setting of settings) {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - setting.followupDelayDays);

            const applications = await this.prisma.application.findMany({
                where: {
                    userId: setting.userId,
                    status: 'applied',
                    OR: [{ lastEmailAt: { lt: cutoff } }, { lastEmailAt: null, appliedAt: { lt: cutoff } }],
                },
            });

            for (const app of applications) {
                const recentFollowup = await this.prisma.event.findFirst({
                    where: {
                        userId: setting.userId,
                        type: 'followup_sent',
                        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                        payload: { path: ['applicationId'], equals: app.id },
                    },
                });
                if (!recentFollowup) {
                    due.push({ userId: setting.userId, applicationId: app.id, title: app.title, company: app.company });
                }
            }
        }

        return due;
    }

    async generateSuggestion(userId: string, applicationId: string, title: string, company: string | null): Promise<FollowupSuggestion> {
        const email = await this.ollamaClient.generateFollowupEmail({ title, company: company ?? undefined });
        return this.repository.createSuggestion({
            userId,
            applicationId,
            subject: email.subject,
            body: email.body,
        });
    }

    async checkAndSchedule(): Promise<void> {
        const due = await this.findDueApplications();
        for (const item of due) {
            const suggestion = await this.generateSuggestion(item.userId, item.applicationId, item.title, item.company);
            await this.eventBus.emit('followup_due', { id: suggestion.id, title: item.title }, item.userId);

            const settings = await this.prisma.userSettings.findUnique({ where: { userId: item.userId } });
            if (settings?.followupMode === 'automatic') {
                await this.sendFollowup(suggestion.id, item.userId);
            }
        }
    }

    listPending(userId: string): Promise<FollowupSuggestion[]> {
        return this.repository.findPendingByUser(userId);
    }

    async approve(id: string, userId: string): Promise<void> {
        await this.repository.updateStatus(id, 'approved');
        await this.sendFollowup(id, userId);
    }

    async sendFollowup(id: string, userId: string): Promise<void> {
        const events = await this.repository.findPendingByUser(userId);
        const suggestion = events.find((s) => s.id === id);
        if (!suggestion) throw new Error('NOT_FOUND');

        const account = await this.prisma.emailAccount.findFirst({ where: { userId } });
        if (!account) throw new Error('NO_EMAIL_ACCOUNT');

        await this.emailSender.send(account, {
            to: '',
            subject: suggestion.subject,
            body: suggestion.body,
        });

        await this.repository.updateStatus(id, 'sent');
        await this.eventBus.emit('followup_sent', { id, title: suggestion.subject }, userId);
    }
}
