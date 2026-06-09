import { EmailAccount } from '@prisma/client';
import nodemailer from 'nodemailer';
import { decryptToken } from '@jtk/shared-types';
import { SendEmailInput } from './email-provider.interface';

export async function sendViaSmtp(
    account: EmailAccount,
    input: SendEmailInput,
): Promise<{ externalId: string; threadId?: string }> {
    const password = decryptToken(account.accessToken);
    const transporter = nodemailer.createTransport({
        host: account.smtpHost!,
        port: account.smtpPort!,
        secure: account.smtpPort === 465,
        auth: {
            user: account.email,
            pass: password,
        },
    });

    const info = await transporter.sendMail({
        from: account.email,
        to: input.to,
        subject: input.subject,
        text: input.body,
        inReplyTo: input.inReplyTo,
        references: input.inReplyTo,
    });

    return {
        externalId: info.messageId ?? `smtp-${Date.now()}`,
        threadId: input.threadId,
    };
}
