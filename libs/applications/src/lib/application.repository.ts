import { Application, ApplicationStatus, PrismaClient } from '@prisma/client';
import { CreateApplicationInput, UpdateApplicationInput } from './application.types';

export class ApplicationRepository {
    constructor(private readonly prisma: PrismaClient) {}

    findAllByUser(userId: string): Promise<Application[]> {
        return this.prisma.application.findMany({
            where: { userId },
            orderBy: { appliedAt: 'desc' },
        });
    }

    findById(userId: string, id: string): Promise<Application | null> {
        return this.prisma.application.findFirst({ where: { id, userId } });
    }

    create(userId: string, data: CreateApplicationInput): Promise<Application> {
        return this.prisma.application.create({
            data: {
                userId,
                title: data.title,
                company: data.company,
                source: data.source,
                appliedAt: data.appliedAt ?? new Date(),
                status: ApplicationStatus.applied,
            },
        });
    }

    update(userId: string, id: string, data: UpdateApplicationInput): Promise<Application> {
        return this.prisma.application.update({
            where: { id },
            data: {
                ...data,
                metadata: data.metadata as object | undefined,
            },
        });
    }

    delete(userId: string, id: string): Promise<Application> {
        return this.prisma.application.delete({ where: { id } });
    }
}
