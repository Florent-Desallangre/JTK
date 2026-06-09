import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | undefined;

export function getPrismaClient(): PrismaClient {
    if (!prisma) {
        prisma = new PrismaClient();
    }
    return prisma;
}

export class PrismaService {
    private client: PrismaClient;

    constructor(client?: PrismaClient) {
        this.client = client ?? getPrismaClient();
    }

    get db(): PrismaClient {
        return this.client;
    }

    async connect(): Promise<void> {
        await this.client.$connect();
    }

    async disconnect(): Promise<void> {
        await this.client.$disconnect();
    }
}

export { PrismaClient };
