import { PrismaService } from '@jtk/database';
import { AuthRepository, AuthService, getAuthConfig } from '@jtk/auth';
import {
    ApplicationMatcherService,
    ApplicationRepository,
    ApplicationService,
    ApplicationStateService,
    TimelineService,
} from '@jtk/applications';
import { ClassificationService, OllamaClient, RulesEngine, getOllamaConfig } from '@jtk/classification';
import { ParsingService } from '@jtk/parsing';
import { EmailPipelineService } from '@jtk/email-sync';
import { EmailAccountRepository, GmailProvider, getGmailConfig } from '@jtk/email-providers';
import { EmailPersistenceService, EmailRepository, GmailSyncService } from '@jtk/email-sync';

const prismaService = new PrismaService();
const authRepository = new AuthRepository(prismaService.db);
const applicationRepository = new ApplicationRepository(prismaService.db);
const gmailProvider = new GmailProvider(getGmailConfig());
const emailRepository = new EmailRepository(prismaService.db);
const gmailSyncService = new GmailSyncService(gmailProvider);

export const container = {
    prisma: prismaService.db,
    authRepository,
    authService: new AuthService(authRepository, getAuthConfig()),
    applicationRepository,
    applicationService: new ApplicationService(applicationRepository),
    emailAccountRepository: new EmailAccountRepository(prismaService.db),
    gmailProvider,
    gmailSyncService,
    emailRepository,
    emailPersistenceService: new EmailPersistenceService(gmailSyncService, emailRepository, prismaService.db),
    parsingService: new ParsingService(),
    applicationMatcher: new ApplicationMatcherService(prismaService.db),
    applicationStateService: new ApplicationStateService(prismaService.db),
    timelineService: new TimelineService(prismaService.db),
    classificationService: new ClassificationService(new RulesEngine(), new OllamaClient(getOllamaConfig())),
    emailPipelineService: new EmailPipelineService(
        new EmailPersistenceService(gmailSyncService, emailRepository, prismaService.db),
        emailRepository,
        new ParsingService(),
        new ApplicationMatcherService(prismaService.db),
        new ClassificationService(new RulesEngine(), new OllamaClient(getOllamaConfig())),
        new ApplicationStateService(prismaService.db),
    ),
};
