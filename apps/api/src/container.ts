import { PrismaService } from '@jtk/database';
import { AuthRepository, AuthService, getAuthConfig } from '@jtk/auth';
import { ApplicationRepository, ApplicationService } from '@jtk/applications';

const prismaService = new PrismaService();
const authRepository = new AuthRepository(prismaService.db);
const applicationRepository = new ApplicationRepository(prismaService.db);

export const container = {
    prisma: prismaService.db,
    authRepository,
    authService: new AuthService(authRepository, getAuthConfig()),
    applicationRepository,
    applicationService: new ApplicationService(applicationRepository),
};
