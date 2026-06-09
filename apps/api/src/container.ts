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
import { EmailPipelineService, EmailPersistenceService, EmailRepository, EmailSyncService } from '@jtk/email-sync';
import {
    EmailAccountRepository,
    EmailSenderService,
    GmailProvider,
    ImapProvider,
    OutlookProvider,
    getGmailConfig,
    getOutlookConfig,
} from '@jtk/email-providers';
import { EventBusService, EventRepository } from '@jtk/events';
import { NotificationHandler, TelegramService, getTelegramConfig } from '@jtk/notifications';
import { FollowupRepository, FollowupService } from '@jtk/followup';

const prismaService = new PrismaService();
const authRepository = new AuthRepository(prismaService.db);
const applicationRepository = new ApplicationRepository(prismaService.db);
const gmailProvider = new GmailProvider(getGmailConfig());
const outlookProvider = new OutlookProvider(getOutlookConfig());
const imapProvider = new ImapProvider();
const emailSenderService = new EmailSenderService(gmailProvider, outlookProvider);
const emailRepository = new EmailRepository(prismaService.db);
const emailSyncService = new EmailSyncService(gmailProvider, outlookProvider, imapProvider);
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
    outlookProvider,
    imapProvider,
    emailSenderService,
    emailSyncService,
    emailRepository,
    emailPersistenceService: new EmailPersistenceService(emailSyncService, emailRepository, prismaService.db),
    parsingService: new ParsingService(),
    applicationMatcher: new ApplicationMatcherService(prismaService.db),
    applicationStateService,
    timelineService: new TimelineService(prismaService.db),
    classificationService,
    eventBus,
    notificationHandler: new NotificationHandler(new TelegramService(getTelegramConfig()), prismaService.db),
    emailPipelineService: new EmailPipelineService(
        new EmailPersistenceService(emailSyncService, emailRepository, prismaService.db),
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
        emailSenderService,
        eventBus,
    ),
};
