import { TelegramService } from './telegram.service';
import { NotificationHandler } from './notification.handler';

describe('TelegramService', () => {
    it('sends message via telegram api', async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: true }) as never;
        const service = new TelegramService({ botToken: 'test-token' });
        await service.sendMessage('123', 'Hello');
        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.telegram.org/bottest-token/sendMessage',
            expect.objectContaining({ method: 'POST' }),
        );
    });

    it('skips when no token', async () => {
        global.fetch = jest.fn() as never;
        const service = new TelegramService({ botToken: '' });
        await service.sendMessage('123', 'Hello');
        expect(global.fetch).not.toHaveBeenCalled();
    });
});

describe('NotificationHandler', () => {
    const mockPrisma = {
        userSettings: { findUnique: jest.fn() },
    } as unknown as import('@prisma/client').PrismaClient;

    const mockTelegram = { sendMessage: jest.fn() } as unknown as TelegramService;
    const handler = new NotificationHandler(mockTelegram, mockPrisma);

    it('sends notification when enabled', async () => {
        (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
            telegramEnabled: true,
            telegramChatId: '123',
        });
        await handler.handle('application_created', { title: 'Dev' }, 'u1');
        expect(mockTelegram.sendMessage).toHaveBeenCalled();
    });
});
