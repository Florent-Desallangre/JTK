import { ParsingService } from './parsing.service';
import indeedFixture from '../fixtures/indeed-application.json';

describe('ParsingService', () => {
    const service = new ParsingService();

    it('detects Indeed application email', () => {
        const result = service.parse({
            ...indeedFixture,
            receivedAt: new Date(indeedFixture.receivedAt),
        });
        expect(result.platform).toBe('Indeed');
        expect(result.isApplicationSent).toBe(true);
        expect(result.isJobRelated).toBe(true);
    });

    it('detects recruiter interview reply', () => {
        const result = service.parse({
            subject: 'Invitation entretien - Data Engineer',
            fromAddress: 'recruteur@company.com',
            bodyText: 'Nous avons le plaisir de vous convier à un entretien.',
            receivedAt: new Date(),
        });
        expect(result.isRecruiterReply).toBe(true);
        expect(result.isJobRelated).toBe(true);
    });

    it('detects LinkedIn platform', () => {
        const result = service.parse({
            subject: 'Your application was sent',
            fromAddress: 'jobs-noreply@linkedin.com',
            bodyText: 'Thank you for applying',
            receivedAt: new Date(),
        });
        expect(result.platform).toBe('LinkedIn');
    });
});
