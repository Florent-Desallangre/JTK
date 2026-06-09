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
import { EmailPipelineService, EmailPersistenceService, EmailRepository, GmailSyncService } from '@jtk/email-sync';
import { EmailAccountRepository, GmailProvider, getGmailConfig } from '@jtk/email-providers';
import { EventBusService, EventRepository } from '@jtk/events';
import { NotificationHandler, TelegramService, getTelegramConfig } from '@jtk/notifications';
import { FollowupRepository, FollowupService } from '@jtk/followup';

const prismaService = new PrismaService();
const authRepository = new AuthRepository(prismaService.db);
const applicationRepository = new ApplicationRepository(prismaService.db);
const gmailProvider = new GmailProvider(getGmailConfig());
const emailRepository = new EmailRepository(prismaService.db);
const gmailSyncService = new GmailSyncService(gmailProvider);
const eventRepository = new EventRepository(prismaService.db);
const eventBus = new EventBusService(eventRepository);
const classificationService = new ClassificationService(new RulesEngine(), new OllamaClient(getOllamaConfig()));
const applicationStateService = new ApplicationStateService(prismaService.db);

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
    applicationStateService,
    timelineService: new TimelineService(prismaService.db),
    classificationService,
    eventBus,
    notificationHandler: new NotificationHandler(new TelegramService(getTelegramConfig()), prismaService.db),
    emailPipelineService: new EmailPipelineService(
        new EmailPersistenceService(gmailSyncService, emailRepository, prismaService.db),
        emailRepository,
        new ParsingService(),
        new ApplicationMatcherService(prismaService.db),
        classificationService,
        applicationStateService,
        eventBus,
    ),
    followupService: new FollowupService(
        prismaService.db,
        new FollowupRepository(prismaService.db),
        new OllamaClient(getOllamaConfig()),
        gmailProvider,
        eventBus,
    ),
};
