import { Router, Response } from 'express';
import { z } from 'zod';
import { container } from '../container';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';

const createSchema = z.object({
    title: z.string().min(1),
    company: z.string().optional(),
    source: z.string().optional(),
    appliedAt: z.string().datetime().optional(),
});

const updateSchema = z.object({
    title: z.string().min(1).optional(),
    company: z.string().optional(),
    status: z.enum(['applied', 'interview', 'offer', 'rejected', 'archived']).optional(),
    source: z.string().optional(),
    appliedAt: z.string().datetime().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export const applicationsRouter = Router();
applicationsRouter.use(authenticate);

applicationsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
    const apps = await container.applicationService.list(req.user!.userId);
    res.json(apps);
});

applicationsRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const app = await container.applicationService.getById(req.user!.userId, req.params['id']!);
        res.json(app);
    } catch {
        res.status(404).json({ error: 'NOT_FOUND' });
    }
});

applicationsRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR' });
        return;
    }
    const app = await container.applicationService.create(req.user!.userId, {
        ...parsed.data,
        appliedAt: parsed.data.appliedAt ? new Date(parsed.data.appliedAt) : undefined,
    });
    res.status(201).json(app);
});

applicationsRouter.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR' });
        return;
    }
    try {
        const app = await container.applicationService.update(req.user!.userId, req.params['id']!, {
            ...parsed.data,
            appliedAt: parsed.data.appliedAt ? new Date(parsed.data.appliedAt) : undefined,
        });
        res.json(app);
    } catch (error) {
        if (error instanceof Error && error.message === 'INVALID_STATUS_TRANSITION') {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(404).json({ error: 'NOT_FOUND' });
    }
});

applicationsRouter.get('/:id/timeline', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const timeline = await container.timelineService.getTimeline(req.user!.userId, req.params['id']!);
        res.json(timeline);
    } catch {
        res.status(404).json({ error: 'NOT_FOUND' });
    }
});

applicationsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        await container.applicationService.delete(req.user!.userId, req.params['id']!);
        res.status(204).send();
    } catch {
        res.status(404).json({ error: 'NOT_FOUND' });
    }
});
