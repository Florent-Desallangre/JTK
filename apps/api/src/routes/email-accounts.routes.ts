import { Router, Request, Response } from 'express';
import { OutlookProvider, getOutlookConfig } from '@jtk/email-providers';
import { container } from '../container';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';

const outlookProvider = new OutlookProvider(getOutlookConfig());

export const emailAccountsRouter = Router();

emailAccountsRouter.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    const accounts = await container.emailAccountRepository.findByUser(req.user!.userId);
    res.json(accounts.map((a) => ({ id: a.id, provider: a.provider, email: a.email, lastSyncAt: a.lastSyncAt })));
});

emailAccountsRouter.get('/gmail/connect', authenticate, (req: AuthenticatedRequest, res: Response) => {
    const url = container.gmailProvider.getAuthUrl(req.user!.userId);
    res.json({ url });
});

emailAccountsRouter.get('/outlook/connect', authenticate, (req: AuthenticatedRequest, res: Response) => {
    const url = outlookProvider.getAuthUrl(req.user!.userId);
    res.json({ url });
});

export const outlookOAuthRouter = Router();

outlookOAuthRouter.get('/callback', async (req: Request, res: Response) => {
    const code = req.query['code'] as string | undefined;
    const userId = req.query['state'] as string | undefined;
    if (!code || !userId) {
        res.status(400).send('Missing code or state');
        return;
    }
    try {
        const tokens = await outlookProvider.exchangeCode(code);
        await container.emailAccountRepository.upsertGmailAccount(
            userId,
            tokens.email,
            tokens.accessToken,
            tokens.refreshToken,
            tokens.expiry,
        );
        const webUrl = process.env['WEB_URL'] ?? 'http://localhost:3000';
        res.redirect(`${webUrl}/settings?outlook=connected`);
    } catch {
        res.status(500).send('OAuth failed');
    }
});

export const gmailOAuthRouter = Router();

gmailOAuthRouter.get('/callback', async (req: Request, res: Response) => {
    const code = req.query['code'] as string | undefined;
    const userId = req.query['state'] as string | undefined;

    if (!code || !userId) {
        res.status(400).send('Missing code or state');
        return;
    }

    try {
        const tokens = await container.gmailProvider.exchangeCode(code);
        await container.emailAccountRepository.upsertGmailAccount(
            userId,
            tokens.email,
            tokens.accessToken,
            tokens.refreshToken,
            tokens.expiry,
        );
        const webUrl = process.env['WEB_URL'] ?? 'http://localhost:3000';
        res.redirect(`${webUrl}/settings?gmail=connected`);
    } catch {
        res.status(500).send('OAuth failed');
    }
});
