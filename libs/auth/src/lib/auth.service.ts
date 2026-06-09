import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { AuthConfig } from './auth.config';
import { AuthRepository } from './auth.repository';

export interface AuthTokenPayload {
    userId: string;
    email: string;
}

export interface AuthResult {
    user: { id: string; email: string };
    token: string;
}

export class AuthService {
    constructor(
        private readonly repository: AuthRepository,
        private readonly config: AuthConfig,
    ) {}

    async register(email: string, password: string): Promise<AuthResult> {
        const existing = await this.repository.findByEmail(email);
        if (existing) {
            throw new Error('EMAIL_ALREADY_EXISTS');
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await this.repository.createUser(email, passwordHash);
        return this.toAuthResult(user);
    }

    async login(email: string, password: string): Promise<AuthResult> {
        const user = await this.repository.findByEmail(email);
        if (!user) {
            throw new Error('INVALID_CREDENTIALS');
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            throw new Error('INVALID_CREDENTIALS');
        }

        return this.toAuthResult(user);
    }

    async getMe(userId: string): Promise<{ id: string; email: string }> {
        const user = await this.repository.findById(userId);
        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }
        return { id: user.id, email: user.email };
    }

    signToken(payload: AuthTokenPayload): string {
        return jwt.sign(payload, this.config.jwtSecret, {
            expiresIn: this.config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
        });
    }

    verifyToken(token: string): AuthTokenPayload {
        return jwt.verify(token, this.config.jwtSecret) as AuthTokenPayload;
    }

    private toAuthResult(user: User): AuthResult {
        const token = this.signToken({ userId: user.id, email: user.email });
        return { user: { id: user.id, email: user.email }, token };
    }
}
