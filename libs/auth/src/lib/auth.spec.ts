import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';

describe('AuthService', () => {
    const config = { jwtSecret: 'test-secret', jwtExpiresIn: '1h' };
    const mockRepo = {
        findByEmail: jest.fn(),
        findById: jest.fn(),
        createUser: jest.fn(),
    } as unknown as AuthRepository;
    const service = new AuthService(mockRepo, config);

    beforeEach(() => jest.clearAllMocks());

    it('hashes password on register', async () => {
        (mockRepo.findByEmail as jest.Mock).mockResolvedValue(null);
        (mockRepo.createUser as jest.Mock).mockResolvedValue({
            id: 'u1',
            email: 'test@example.com',
            passwordHash: await bcrypt.hash('password', 10),
        });

        const result = await service.register('test@example.com', 'password');
        expect(result.user.email).toBe('test@example.com');
        expect(result.token).toBeDefined();
    });

    it('signs and verifies token', () => {
        const token = service.signToken({ userId: 'u1', email: 'a@b.com' });
        const payload = service.verifyToken(token);
        expect(payload.userId).toBe('u1');
    });

    it('rejects invalid credentials on login', async () => {
        (mockRepo.findByEmail as jest.Mock).mockResolvedValue(null);
        await expect(service.login('x@y.com', 'wrong')).rejects.toThrow('INVALID_CREDENTIALS');
    });

    it('rejects invalid jwt', () => {
        expect(() => service.verifyToken('invalid')).toThrow();
        expect(() => jwt.verify('invalid', config.jwtSecret)).toThrow();
    });
});
