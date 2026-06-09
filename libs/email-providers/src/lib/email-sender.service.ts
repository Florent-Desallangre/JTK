import { EmailAccount, EmailConnectionType } from '@prisma/client';
import { decryptToken } from '@jtk/shared-types';
import { GmailProvider } from './gmail.provider';
import { OutlookProvider } from './outlook.provider';
import { SendEmailInput } from './email-provider.interface';
import { sendViaSmtp } from './smtp.sender';

export class EmailSenderService {
    constructor(
        private readonly gmailProvider: GmailProvider,
        private readonly outlookProvider: OutlookProvider,
    ) {}

    async send(account: EmailAccount, input: SendEmailInput): Promise<{ externalId: string; threadId?: string }> {
        if (account.connectionType === EmailConnectionType.imap) {
            return sendViaSmtp(account, input);
        }

        const provider = account.provider === 'gmail' ? this.gmailProvider : this.outlookProvider;
        let accessToken = decryptToken(account.accessToken);

        if (account.tokenExpiry && account.tokenExpiry < new Date()) {
            const refreshed = await provider.refreshAccessToken(decryptToken(account.refreshToken));
            accessToken = refreshed.accessToken;
        }

        return provider.sendEmail(accessToken, input);
    }
}
