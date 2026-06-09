import { PrismaService } from './database';

describe('PrismaService', () => {
    it('can be instantiated', () => {
        const service = new PrismaService();
        expect(service.db).toBeDefined();
    });
});
