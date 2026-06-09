import { PrismaService } from './database';

const hasDatabase = process.env['RUN_INTEGRATION_TESTS'] === 'true';

(hasDatabase ? describe : describe.skip)('PrismaService integration', () => {
    const service = new PrismaService();

    afterAll(async () => {
        await service.disconnect();
    });

    it('connects to the database', async () => {
        await service.connect();
        const result = await service.db.$queryRaw<[{ ok: number }]>`SELECT 1 as ok`;
        expect(result[0].ok).toBe(1);
    });
});
