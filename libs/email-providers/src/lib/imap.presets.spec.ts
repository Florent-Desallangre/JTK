import { IMAP_PRESETS, resolveImapPreset } from './imap.presets';

describe('imap presets', () => {
    it('exposes gmail and outlook defaults', () => {
        expect(IMAP_PRESETS.gmail.imapHost).toBe('imap.gmail.com');
        expect(IMAP_PRESETS.outlook.smtpHost).toBe('smtp.office365.com');
    });

    it('allows host overrides', () => {
        const preset = resolveImapPreset('gmail', { imapPort: 143 });
        expect(preset.imapPort).toBe(143);
        expect(preset.imapHost).toBe('imap.gmail.com');
    });
});
