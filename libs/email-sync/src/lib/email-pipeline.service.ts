import { EmailAccount } from '@prisma/client';
import { ApplicationMatcherService } from '@jtk/applications';
import { ParsingService } from '@jtk/parsing';
import { EmailPersistenceService } from './email-persistence.service';
import { EmailRepository } from './email.repository';

export class EmailPipelineService {
    constructor(
        private readonly persistenceService: EmailPersistenceService,
        private readonly emailRepository: EmailRepository,
        private readonly parsingService: ParsingService,
        private readonly applicationMatcher: ApplicationMatcherService,
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

            await this.applicationMatcher.matchOrCreate(account.userId, email, parsed);
        }
    }
}
