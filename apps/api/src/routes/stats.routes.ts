import { Router, Response } from 'express';
import { container } from '../container';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';

export const statsRouter = Router();
statsRouter.use(authenticate);

statsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const [total, byStatus, pendingFollowups] = await Promise.all([
        container.prisma.application.count({ where: { userId } }),
        container.prisma.application.groupBy({ by: ['status'], where: { userId }, _count: true }),
        container.prisma.event.count({ where: { userId, type: 'followup_due', processed: false } }),
    ]);

    const responded = await container.prisma.application.count({
        where: { userId, status: { in: ['interview', 'offer', 'rejected'] } },
    });

    res.json({
        total,
        byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
        responseRate: total > 0 ? Math.round((responded / total) * 100) : 0,
        pendingFollowups,
    });
});
