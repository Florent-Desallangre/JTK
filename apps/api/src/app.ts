import express from 'express';
import cors from 'cors';
import { JTK_VERSION } from '@jtk/shared-types';
import { authRouter } from './routes/auth.routes';
import { applicationsRouter } from './routes/applications.routes';
import { emailAccountsRouter, gmailOAuthRouter, outlookOAuthRouter } from './routes/email-accounts.routes';
import { followupsRouter } from './routes/followups.routes';
import { settingsRouter } from './routes/settings.routes';
import { statsRouter } from './routes/stats.routes';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export function createApp() {
    const app = express();

    app.use(helmet());
    app.use(
        cors({
            origin: process.env['WEB_URL'] ?? 'http://localhost:3000',
            credentials: true,
        }),
    );
    app.use(
        rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 300,
        }),
    );
    app.use(express.json());

    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', version: JTK_VERSION });
    });

    app.use('/auth', authRouter);
    app.use('/applications', applicationsRouter);
    app.use('/email-accounts', emailAccountsRouter);
    app.use('/oauth/gmail', gmailOAuthRouter);
    app.use('/oauth/outlook', outlookOAuthRouter);
    app.use('/followups', followupsRouter);
    app.use('/settings', settingsRouter);
    app.use('/stats', statsRouter);

    return app;
}
