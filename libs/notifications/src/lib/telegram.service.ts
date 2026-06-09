export interface TelegramConfig {
    botToken: string;
}

export function getTelegramConfig(): TelegramConfig {
    return { botToken: process.env['TELEGRAM_BOT_TOKEN'] ?? '' };
}

export class TelegramService {
    constructor(private readonly config: TelegramConfig) {}

    async sendMessage(chatId: string, text: string): Promise<void> {
        if (!this.config.botToken || !chatId) return;

        const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
        });

        if (!response.ok) {
            throw new Error(`Telegram API error: ${response.status}`);
        }
    }
}
