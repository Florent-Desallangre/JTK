import cron from 'node-cron';
import { container } from './container';

export function startScheduler(): void {
    cron.schedule('*/5 * * * *', async () => {
        console.log('[scheduler] syncEmails tick');
        const accounts = await container.emailAccountRepository.findAllGmailAccounts();
        if (accounts.length === 0) return;
        await container.gmailSyncService.syncAllAccounts(accounts);
    });
}
