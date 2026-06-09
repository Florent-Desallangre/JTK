import { EmailProviderType } from '@jtk/shared-types';

export interface ImapPreset {
    imapHost: string;
    imapPort: number;
    smtpHost: string;
    smtpPort: number;
}

export const IMAP_PRESETS: Record<EmailProviderType, ImapPreset> = {
    gmail: {
        imapHost: 'imap.gmail.com',
        imapPort: 993,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
    },
    outlook: {
        imapHost: 'outlook.office365.com',
        imapPort: 993,
        smtpHost: 'smtp.office365.com',
        smtpPort: 587,
    },
};

export function resolveImapPreset(
    provider: EmailProviderType,
    overrides?: Partial<ImapPreset>,
): ImapPreset {
    return { ...IMAP_PRESETS[provider], ...overrides };
}
