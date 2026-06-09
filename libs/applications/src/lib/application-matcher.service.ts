import { Application, Email, PrismaClient } from '@prisma/client';
import { ParsedEmailData } from '@jtk/parsing';

export interface MatchResult {
    application: Application;
    created: boolean;
}

export class ApplicationMatcherService {
    constructor(private readonly prisma: PrismaClient) {}

    async matchOrCreate(userId: string, email: Email, parsed: ParsedEmailData): Promise<MatchResult | null> {
        if (!parsed.isJobRelated) return null;

        const existing = await this.findExisting(userId, email, parsed);
        if (existing) {
            await this.prisma.email.update({
                where: { id: email.id },
                data: { applicationId: existing.id },
            });
            return { application: existing, created: false };
        }

        if (!parsed.isApplicationSent && !parsed.isRecruiterReply) return null;

        const application = await this.prisma.application.create({
            data: {
                userId,
                title: parsed.jobTitle ?? email.subject,
                company: parsed.company,
                source: parsed.platform,
                appliedAt: parsed.isApplicationSent ? email.receivedAt : undefined,
                lastEmailAt: email.receivedAt,
                metadata: { detectedFrom: email.id },
            },
        });

        await this.prisma.email.update({
            where: { id: email.id },
            data: { applicationId: application.id, parsedData: parsed as object },
        });

        console.log(`[application_created] user=${userId} app=${application.id} title=${application.title}`);

        return { application, created: true };
    }

    private async findExisting(userId: string, email: Email, parsed: ParsedEmailData): Promise<Application | null> {
        if (email.threadId) {
            const linked = await this.prisma.email.findFirst({
                where: { threadId: email.threadId, applicationId: { not: null }, userId },
                include: { application: true },
            });
            if (linked?.application) return linked.application;
        }

        if (parsed.company) {
            return this.prisma.application.findFirst({
                where: { userId, company: { contains: parsed.company, mode: 'insensitive' } },
            });
        }

        return null;
    }
}
