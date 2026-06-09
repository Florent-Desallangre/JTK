import { EmailAccount } from '@prisma/client';
import { ApplicationMatcherService, ApplicationStateService } from '@jtk/applications';
import { ClassificationService } from '@jtk/classification';
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
    ) {}

    async processAccount(account: EmailAccount): Promise<void> {
        const before = await this.emailRepository.findByAccount(account.id);
        const beforeIds = new Set(before.map((e) => e.id));

        await this.persistenceService.syncAndPersist(account);

        const after = await this.emailRepository.findByAccount(account.id);
        const newEmails = after.filter((e) => !beforeIds.has(e.id));

        for (const email of newEmails) {
            const parsed = this.parsingService.parse({
                subject: email.subject,
                fromAddress: email.fromAddress,
                bodyText: email.bodyText ?? undefined,
                receivedAt: email.receivedAt,
            });

            await this.emailRepository.updateParsedData(email.id, parsed);

            const match = await this.applicationMatcher.matchOrCreate(account.userId, email, parsed);
            if (!match) continue;

            const classification = await this.classificationService.classify(email.subject, parsed.cleanBody);
            await this.emailRepository.updateParsedData(email.id, { ...parsed, classification });

            if (match.application.id) {
                await this.applicationStateService.updateFromClassification(
                    match.application.id,
                    email.id,
                    classification,
                    email.receivedAt,
                );
            }
        }
    }
}
