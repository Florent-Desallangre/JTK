import request from 'supertest';
import express from 'express';
import { authRouter } from './auth.routes';

jest.mock('../container', () => ({
    container: {
        authService: {
            register: jest.fn(),
            login: jest.fn(),
            getMe: jest.fn(),
            verifyToken: jest.fn(),
        },
    },
}));

import { container } from '../container';

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

describe('auth routes', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 401 without token on /me', async () => {
        const res = await request(app).get('/auth/me');
        expect(res.status).toBe(401);
    });

    it('returns 400 on invalid register payload', async () => {
        const res = await request(app).post('/auth/register').send({ email: 'bad' });
        expect(res.status).toBe(400);
    });

    it('returns 200 on login success', async () => {
        (container.authService.login as jest.Mock).mockResolvedValue({
            user: { id: '1', email: 'a@b.com' },
            token: 'token',
        });
        const res = await request(app).post('/auth/login').send({ email: 'a@b.com', password: 'password123' });
        expect(res.status).toBe(200);
        expect(res.body.token).toBe('token');
    });
});
