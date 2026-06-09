import express from 'express';
import { JTK_VERSION } from '@jtk/shared-types';

const host = process.env.HOST ?? 'localhost';
const port = process.env.API_PORT ? Number(process.env.API_PORT) : 3001;

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: JTK_VERSION });
});

app.listen(port, host, () => {
    console.log(`[ ready ] http://${host}:${port}`);
});
