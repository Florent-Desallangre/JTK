import { EventType } from '@jtk/shared-types';
import { PrismaClient } from '@prisma/client';
import { TelegramService } from './telegram.service';

const MESSAGES: Partial<Record<EventType, (payload: Record<string, string>) => string>> = {
    application_created: (p) => `🆕 Nouvelle candidature : <b>${p['title']}</b>`,
    application_updated: (p) => `📝 Candidature mise à jour : <b>${p['title']}</b> → ${p['status']}`,
    classification_completed: (p) => `🤖 Classification : ${p['summary']}`,
    followup_due: (p) => `⏰ Relance nécessaire : <b>${p['title']}</b>`,
    followup_sent: (p) => `📤 Relance envoyée : <b>${p['title']}</b>`,
};

export class NotificationHandler {
    constructor(
        private readonly telegram: TelegramService,
        private readonly prisma: PrismaClient,
    ) {}

    async handle(type: EventType, payload: unknown, userId: string): Promise<void> {
        const settings = await this.prisma.userSettings.findUnique({ where: { userId } });
        if (!settings?.telegramEnabled || !settings.telegramChatId) return;

        const formatter = MESSAGES[type];
        if (!formatter) return;

        const text = formatter(payload as Record<string, string>);
        await this.telegram.sendMessage(settings.telegramChatId, text);
    }
}
