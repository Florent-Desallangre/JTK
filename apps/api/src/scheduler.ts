import cron from 'node-cron';
import { container } from './container';
import { processEvents } from './event-processor';

export function startScheduler(): void {
    cron.schedule('*/5 * * * *', async () => {
        console.log('[scheduler] syncEmails tick');
        const accounts = await container.emailAccountRepository.findAllGmailAccounts();
        if (accounts.length === 0) return;
        for (const account of accounts) {
            await container.emailPipelineService.processAccount(account);
        }
    });

    cron.schedule('0 9 * * *', async () => {
        console.log('[scheduler] checkFollowups tick');
        await container.followupService.checkAndSchedule();
    });

    cron.schedule('* * * * *', async () => {
        const count = await processEvents();
        if (count > 0) console.log(`[scheduler] processed ${count} events`);
    });
}
