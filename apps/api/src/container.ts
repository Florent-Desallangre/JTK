import { PrismaService } from '@jtk/database';
import { AuthRepository, AuthService, getAuthConfig } from '@jtk/auth';

const prismaService = new PrismaService();

export const container = {
    prisma: prismaService.db,
    authRepository: new AuthRepository(prismaService.db),
    authService: new AuthService(new AuthRepository(prismaService.db), getAuthConfig()),
};
