import { Router, Response } from 'express';
import { container } from '../container';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';

export const followupsRouter = Router();
followupsRouter.use(authenticate);

followupsRouter.get('/suggestions', async (req: AuthenticatedRequest, res: Response) => {
    const suggestions = await container.followupService.listPending(req.user!.userId);
    res.json(suggestions);
});

followupsRouter.post('/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
    try {
        await container.followupService.approve(req.params['id']!, req.user!.userId);
        res.json({ ok: true });
    } catch {
        res.status(404).json({ error: 'NOT_FOUND' });
    }
});

followupsRouter.post('/:id/send', async (req: AuthenticatedRequest, res: Response) => {
    try {
        await container.followupService.sendFollowup(req.params['id']!, req.user!.userId);
        res.json({ ok: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'ERROR';
        res.status(400).json({ error: message });
    }
});
