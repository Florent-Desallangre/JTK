import { GmailProvider } from './gmail.provider';

describe('GmailProvider', () => {
    const provider = new GmailProvider({
        clientId: 'test-client',
        clientSecret: 'test-secret',
        redirectUri: 'http://localhost:3001/oauth/gmail/callback',
    });

    it('generates auth url with state', () => {
        const url = provider.getAuthUrl('user-123');
        expect(url).toContain('client_id=test-client');
        expect(url).toContain('state=user-123');
    });
});
