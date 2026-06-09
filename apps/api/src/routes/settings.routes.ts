import { Router, Response } from 'express';
import { z } from 'zod';
import { container } from '../container';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';

const updateSchema = z.object({
    followupMode: z.enum(['manual', 'assisted', 'automatic']).optional(),
    followupDelayDays: z.number().min(1).max(90).optional(),
    telegramChatId: z.string().optional(),
    telegramEnabled: z.boolean().optional(),
});

export const settingsRouter = Router();
settingsRouter.use(authenticate);

settingsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
    const settings = await container.prisma.userSettings.findUnique({ where: { userId: req.user!.userId } });
    res.json(settings);
});

settingsRouter.put('/', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR' });
        return;
    }
    const settings = await container.prisma.userSettings.upsert({
        where: { userId: req.user!.userId },
        create: { userId: req.user!.userId, ...parsed.data },
        update: parsed.data,
    });
    res.json(settings);
});
