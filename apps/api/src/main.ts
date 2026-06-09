import { createApp } from './app';
import { PrismaService } from '@jtk/database';
import { startScheduler } from './scheduler';

const host = process.env['HOST'] ?? 'localhost';
const port = process.env['API_PORT'] ? Number(process.env['API_PORT']) : 3001;

async function bootstrap() {
    const prisma = new PrismaService();
    await prisma.connect();

    const app = createApp();
    startScheduler();
    app.listen(port, host, () => {
        console.log(`[ ready ] http://${host}:${port}`);
    });
}

bootstrap().catch((error) => {
    console.error(error);
    process.exit(1);
});
