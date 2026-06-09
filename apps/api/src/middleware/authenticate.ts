import { Request, Response, NextFunction } from 'express';
import { container } from '../container';

export interface AuthenticatedRequest extends Request {
    user?: { userId: string; email: string };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'UNAUTHORIZED' });
        return;
    }

    try {
        const token = header.slice(7);
        const payload = container.authService.verifyToken(token);
        req.user = { userId: payload.userId, email: payload.email };
        next();
    } catch {
        res.status(401).json({ error: 'UNAUTHORIZED' });
    }
}
