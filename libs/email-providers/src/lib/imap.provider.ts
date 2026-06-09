import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { RawEmailMessage } from './email-provider.interface';

export interface ImapCredentials {
    email: string;
    password: string;
    imapHost: string;
    imapPort: number;
}

export class ImapProvider {
    async validateConnection(credentials: ImapCredentials): Promise<void> {
        const client = this.createClient(credentials);
        try {
            await client.connect();
        } finally {
            await client.logout().catch(() => undefined);
        }
    }

    async listMessages(
        credentials: ImapCredentials,
        cursor?: string,
    ): Promise<{ messages: RawEmailMessage[]; nextCursor?: string }> {
        const client = this.createClient(credentials);
        await client.connect();

        const messages: RawEmailMessage[] = [];
        let maxUid = cursor ? Number(cursor) : 0;

        try {
            const lock = await client.getMailboxLock('INBOX');
            try {
                const mailbox = client.mailbox;
                const uidNext = mailbox && typeof mailbox !== 'boolean' ? mailbox.uidNext ?? 1 : 1;

                if (cursor && Number(cursor) + 1 >= uidNext) {
                    return { messages, nextCursor: cursor };
                }

                const fetchRange = cursor
                    ? `${Number(cursor) + 1}:*`
                    : `${Math.max(1, uidNext - 50)}:*`;

                for await (const message of client.fetch(fetchRange, { envelope: true, source: true, uid: true })) {
                    if (!message.source || !message.uid) continue;

                    const parsed = await simpleParser(message.source);
                    if (message.uid > maxUid) maxUid = message.uid;

                    messages.push({
                        externalId: String(message.uid),
                        threadId: parsed.messageId ?? undefined,
                        subject: message.envelope?.subject ?? parsed.subject ?? '',
                        fromAddress: message.envelope?.from?.[0]?.address ?? parsed.from?.text ?? '',
                        toAddresses: (message.envelope?.to ?? [])
                            .map((address) => address.address ?? '')
                            .filter(Boolean),
                        bodyText: parsed.text ?? undefined,
                        bodyHtml: parsed.html ? String(parsed.html) : undefined,
                        receivedAt: message.envelope?.date ?? parsed.date ?? new Date(),
                    });
                }
            } finally {
                lock.release();
            }
        } finally {
            await client.logout().catch(() => undefined);
        }

        return {
            messages,
            nextCursor: maxUid > 0 ? String(maxUid) : cursor,
        };
    }

    private createClient(credentials: ImapCredentials): ImapFlow {
        return new ImapFlow({
            host: credentials.imapHost,
            port: credentials.imapPort,
            secure: credentials.imapPort === 993,
            auth: {
                user: credentials.email,
                pass: credentials.password,
            },
        });
    }
}
