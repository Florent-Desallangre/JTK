import express from 'express';
import cors from 'cors';
import { JTK_VERSION } from '@jtk/shared-types';
import { authRouter } from './routes/auth.routes';
import { applicationsRouter } from './routes/applications.routes';
import { emailAccountsRouter, gmailOAuthRouter } from './routes/email-accounts.routes';

export function createApp() {
    const app = express();

    app.use(
        cors({
            origin: process.env['WEB_URL'] ?? 'http://localhost:3000',
            credentials: true,
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

    return app;
}
