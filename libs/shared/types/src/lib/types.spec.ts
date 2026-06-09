import { JTK_VERSION } from './types';

describe('shared types', () => {
    it('exports version', () => {
        expect(JTK_VERSION).toBe('0.1.0');
    });
});
