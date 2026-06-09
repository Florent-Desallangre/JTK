import { OutlookProvider } from './outlook.provider';

describe('OutlookProvider', () => {
    const provider = new OutlookProvider({
        clientId: 'ms-client',
        clientSecret: 'ms-secret',
        redirectUri: 'http://localhost:3001/oauth/outlook/callback',
    });

    it('generates microsoft auth url', () => {
        const url = provider.getAuthUrl('user-1');
        expect(url).toContain('login.microsoftonline.com');
        expect(url).toContain('state=user-1');
    });

    it('implements EmailProvider interface', () => {
        expect(typeof provider.listMessages).toBe('function');
        expect(typeof provider.sendEmail).toBe('function');
    });
});
