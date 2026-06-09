import { EmailAccount } from '@prisma/client';
import { ApplicationMatcherService, ApplicationStateService } from '@jtk/applications';
import { ClassificationService } from '@jtk/classification';
import { EventBusService } from '@jtk/events';
import { ParsingService } from '@jtk/parsing';
import { EmailPersistenceService } from './email-persistence.service';
import { EmailRepository } from './email.repository';

export class EmailPipelineService {
    constructor(
        private readonly persistenceService: EmailPersistenceService,
        private readonly emailRepository: EmailRepository,
        private readonly parsingService: ParsingService,
        private readonly applicationMatcher: ApplicationMatcherService,
        private readonly classificationService: ClassificationService,
        private readonly applicationStateService: ApplicationStateService,
        private readonly eventBus?: EventBusService,
    ) {}

    async processAccount(account: EmailAccount): Promise<void> {
        const before = await this.emailRepository.findByAccount(account.id);
        const beforeIds = new Set(before.map((e) => e.id));

        await this.persistenceService.syncAndPersist(account);

        const after = await this.emailRepository.findByAccount(account.id);
        const newEmails = after.filter((e) => !beforeIds.has(e.id));

        for (const email of newEmails) {
            await this.eventBus?.emit('email_received', { emailId: email.id, subject: email.subject }, account.userId);
            const parsed = this.parsingService.parse({
                subject: email.subject,
                fromAddress: email.fromAddress,
                bodyText: email.bodyText ?? undefined,
                receivedAt: email.receivedAt,
            });

            await this.emailRepository.updateParsedData(email.id, parsed);

            const match = await this.applicationMatcher.matchOrCreate(account.userId, email, parsed);
            if (!match) continue;

            if (match.created) {
                await this.eventBus?.emit(
                    'application_created',
                    { id: match.application.id, title: match.application.title },
                    account.userId,
                );
            }

            const classification = await this.classificationService.classify(email.subject, parsed.cleanBody);
            await this.emailRepository.updateParsedData(email.id, { ...parsed, classification });

            if (match.application.id) {
                const updated = await this.applicationStateService.updateFromClassification(
                    match.application.id,
                    email.id,
                    classification,
                    email.receivedAt,
                );
                await this.eventBus?.emit('classification_completed', { summary: classification.summary }, account.userId);
                if (updated && updated.status !== match.application.status) {
                    await this.eventBus?.emit(
                        'application_updated',
                        { id: updated.id, title: updated.title, status: updated.status },
                        account.userId,
                    );
                }
            }
        }
    }
}
