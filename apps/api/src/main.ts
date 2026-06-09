import { createApp } from './app';
import { PrismaService } from '@jtk/database';

const host = process.env['HOST'] ?? 'localhost';
const port = process.env['API_PORT'] ? Number(process.env['API_PORT']) : 3001;

async function bootstrap() {
    const prisma = new PrismaService();
    await prisma.connect();

    const app = createApp();
    app.listen(port, host, () => {
        console.log(`[ ready ] http://${host}:${port}`);
    });
}

bootstrap().catch((error) => {
    console.error(error);
    process.exit(1);
});
