import { Router, Request, Response } from 'express';
import { EmailProvider } from '@prisma/client';
import { z } from 'zod';
import {
    IMAP_PRESETS,
    ImapProvider,
    OutlookProvider,
    getOutlookConfig,
    resolveImapPreset,
} from '@jtk/email-providers';
import { container } from '../container';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';

const outlookProvider = new OutlookProvider(getOutlookConfig());
const imapProvider = new ImapProvider();

const imapConnectSchema = z.object({
    provider: z.enum(['gmail', 'outlook']),
    email: z.string().email(),
    password: z.string().min(1),
    imapHost: z.string().optional(),
    imapPort: z.number().int().positive().optional(),
    smtpHost: z.string().optional(),
    smtpPort: z.number().int().positive().optional(),
});

export const emailAccountsRouter = Router();

emailAccountsRouter.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    const accounts = await container.emailAccountRepository.findByUser(req.user!.userId);
    res.json(
        accounts.map((account) => ({
            id: account.id,
            provider: account.provider,
            connectionType: account.connectionType,
            email: account.email,
            lastSyncAt: account.lastSyncAt,
        })),
    );
});

emailAccountsRouter.get('/imap/presets', authenticate, (_req: AuthenticatedRequest, res: Response) => {
    res.json(IMAP_PRESETS);
});

emailAccountsRouter.post('/imap', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    const parsed = imapConnectSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
        return;
    }

    const preset = resolveImapPreset(parsed.data.provider, {
        imapHost: parsed.data.imapHost,
        imapPort: parsed.data.imapPort,
        smtpHost: parsed.data.smtpHost,
        smtpPort: parsed.data.smtpPort,
    });

    try {
        await imapProvider.validateConnection({
            email: parsed.data.email,
            password: parsed.data.password,
            imapHost: preset.imapHost,
            imapPort: preset.imapPort,
        });
    } catch {
        res.status(400).json({ error: 'IMAP_CONNECTION_FAILED' });
        return;
    }

    const account = await container.emailAccountRepository.upsertImapAccount(
        req.user!.userId,
        parsed.data.provider as EmailProvider,
        parsed.data.email,
        parsed.data.password,
        preset.imapHost,
        preset.imapPort,
        preset.smtpHost,
        preset.smtpPort,
    );

    res.status(201).json({
        id: account.id,
        provider: account.provider,
        connectionType: account.connectionType,
        email: account.email,
    });
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
        await container.emailAccountRepository.upsertOAuthAccount(
            userId,
            EmailProvider.outlook,
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
        await container.emailAccountRepository.upsertOAuthAccount(
            userId,
            EmailProvider.gmail,
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
