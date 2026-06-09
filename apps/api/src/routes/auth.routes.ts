import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../container';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
        return;
    }

    try {
        const result = await container.authService.register(parsed.data.email, parsed.data.password);
        res.status(201).json(result);
    } catch (error) {
        if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
            res.status(409).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
});

authRouter.post('/login', async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
        return;
    }

    try {
        const result = await container.authService.login(parsed.data.email, parsed.data.password);
        res.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
            res.status(401).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
});

authRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = await container.authService.getMe(req.user!.userId);
        res.json(user);
    } catch {
        res.status(404).json({ error: 'USER_NOT_FOUND' });
    }
});
