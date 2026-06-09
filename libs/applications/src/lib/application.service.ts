import { Application } from '@prisma/client';
import { ApplicationStatus } from '@jtk/shared-types';
import { ApplicationRepository } from './application.repository';
import { canTransition, CreateApplicationInput, UpdateApplicationInput } from './application.types';

export class ApplicationService {
    constructor(private readonly repository: ApplicationRepository) {}

    list(userId: string): Promise<Application[]> {
        return this.repository.findAllByUser(userId);
    }

    getById(userId: string, id: string): Promise<Application> {
        return this.repository.findById(userId, id).then((app) => {
            if (!app) throw new Error('NOT_FOUND');
            return app;
        });
    }

    create(userId: string, data: CreateApplicationInput): Promise<Application> {
        return this.repository.create(userId, data);
    }

    async update(userId: string, id: string, data: UpdateApplicationInput): Promise<Application> {
        const existing = await this.getById(userId, id);
        if (data.status && !canTransition(existing.status as ApplicationStatus, data.status)) {
            throw new Error('INVALID_STATUS_TRANSITION');
        }
        return this.repository.update(userId, id, data);
    }

    async delete(userId: string, id: string): Promise<void> {
        await this.getById(userId, id);
        await this.repository.delete(userId, id);
    }
}
