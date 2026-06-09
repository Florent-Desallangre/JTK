import express from 'express';
import cors from 'cors';
import { JTK_VERSION } from '@jtk/shared-types';
import { authRouter } from './routes/auth.routes';

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

    return app;
}
